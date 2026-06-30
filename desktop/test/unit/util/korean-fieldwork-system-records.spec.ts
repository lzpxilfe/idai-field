import { Document } from 'idai-field-core';
import {
    getKoreanFieldworkUserVisibleDocuments,
    isKoreanFieldworkInitialBoundaryDocument,
    KOREAN_FIELDWORK_INITIAL_BOUNDARY_SYSTEM_RECORD,
    KOREAN_FIELDWORK_INITIAL_OPERATION_ID,
    KOREAN_FIELDWORK_INITIAL_SURVEY_BOUNDARY_ID
} from '../../../src/app/util/korean-fieldwork-system-records';


describe('korean-fieldwork-system-records', () => {

    it('hides initial boundary setup records while keeping real field records visible', () => {

        const initialOperation = createDoc(KOREAN_FIELDWORK_INITIAL_OPERATION_ID, 'Operation');
        const initialBoundary = createDoc(KOREAN_FIELDWORK_INITIAL_SURVEY_BOUNDARY_ID, 'SurveyBoundary', {
            isRecordedIn: [KOREAN_FIELDWORK_INITIAL_OPERATION_ID]
        });
        const projectBoundaryOperation = createDoc('operation-boundary-draft', 'Operation', {}, {
            projectBoundarySetupState: 'draftBoundary',
            projectBoundarySummary: '처음 만든 유적 경계'
        });
        const projectBoundary = createDoc('boundary-from-draft-operation', 'SurveyBoundary', {
            isRecordedIn: ['operation-boundary-draft']
        });
        const systemBoundary = createDoc('boundary-system-record', 'SurveyBoundary', {}, {
            koreanFieldworkSystemRecord: KOREAN_FIELDWORK_INITIAL_BOUNDARY_SYSTEM_RECORD
        });
        const featureGroup = createDoc('feature-group-1', 'FeatureGroup');
        const operation = createDoc('operation-1', 'Operation');
        const boundary = createDoc('boundary-1', 'SurveyBoundary', {
            isRecordedIn: ['operation-1']
        });
        const feature = createDoc('feature-1', 'Feature', {
            liesWithin: ['feature-group-1']
        });

        expect(isKoreanFieldworkInitialBoundaryDocument(initialOperation)).toBe(true);
        expect(isKoreanFieldworkInitialBoundaryDocument(projectBoundaryOperation)).toBe(true);
        expect(getKoreanFieldworkUserVisibleDocuments([
            initialOperation,
            initialBoundary,
            projectBoundaryOperation,
            projectBoundary,
            systemBoundary,
            featureGroup,
            operation,
            boundary,
            feature
        ]).map(document => document.resource.id)).toEqual([
            'operation-1',
            'boundary-1',
            'feature-1'
        ]);
    });
});


const createDoc = (
        id: string,
        category: string,
        relations: Record<string, string[]> = {},
        fields: Record<string, unknown> = {}
): Document => ({
    resource: {
        id,
        identifier: id,
        category,
        relations,
        ...fields
    }
} as any);
