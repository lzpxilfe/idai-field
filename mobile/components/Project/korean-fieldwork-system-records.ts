import type {
  Document,
  KoreanFieldworkTodaySummary,
} from 'idai-field-core';

export const KOREAN_FIELDWORK_INITIAL_OPERATION_ID =
  'initial-fieldwork-operation';
export const KOREAN_FIELDWORK_INITIAL_SURVEY_BOUNDARY_ID =
  'initial-survey-boundary';
export const KOREAN_FIELDWORK_INITIAL_BOUNDARY_SYSTEM_RECORD =
  'initialProjectBoundary';

export const isKoreanFieldworkInitialBoundaryDocument = (
  document: Document | undefined
): boolean => {
  if (!document) return false;

  const resource = document.resource as unknown as Record<string, unknown>;

  return resource.id === KOREAN_FIELDWORK_INITIAL_OPERATION_ID
    || resource.id === KOREAN_FIELDWORK_INITIAL_SURVEY_BOUNDARY_ID
    || resource.koreanFieldworkSystemRecord
      === KOREAN_FIELDWORK_INITIAL_BOUNDARY_SYSTEM_RECORD;
};

export const getKoreanFieldworkUserVisibleDocuments = (
  documents: Document[]
): Document[] => documents.filter((document) =>
  !isKoreanFieldworkInitialBoundaryDocument(document)
);

export const getKoreanFieldworkUserVisibleTodaySummary = (
  summary: KoreanFieldworkTodaySummary,
  userVisibleDocuments: Document[]
): KoreanFieldworkTodaySummary => {
  const userVisibleDocumentIds = new Set(userVisibleDocuments.map((document) =>
    document.resource.id
  ));
  const openIssues = summary.openIssues.filter((issue) =>
    userVisibleDocumentIds.has(issue.documentId)
  );

  return {
    dailyLogs: filterVisibleDocuments(summary.dailyLogs, userVisibleDocumentIds),
    surveyBoundaries: filterVisibleDocuments(
      summary.surveyBoundaries,
      userVisibleDocumentIds
    ),
    featureCandidates: filterVisibleDocuments(
      summary.featureCandidates,
      userVisibleDocumentIds
    ),
    openIssues,
    issueCountByDocumentId: openIssues.reduce((index, issue) => {
      index[issue.documentId] = (index[issue.documentId] ?? 0) + 1;
      return index;
    }, {} as { [documentId: string]: number }),
  };
};

const filterVisibleDocuments = (
  documents: Document[],
  userVisibleDocumentIds: Set<string>
): Document[] => documents.filter((document) =>
  userVisibleDocumentIds.has(document.resource.id)
);
