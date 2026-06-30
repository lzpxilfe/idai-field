import {
    makeKoreanFieldworkTodayStats
} from '../../../src/app/util/korean-fieldwork-today-stats';


describe('korean-fieldwork-today-stats', () => {

    it('summarizes Korean fieldwork daily logs, boundaries, candidates, and issues', () => {

        const stats = makeKoreanFieldworkTodayStats([
            createDocument('daily-1', 'DailyLog'),
            createDocument('boundary-1', 'SurveyBoundary'),
            createDocument('feature-candidate-1', 'Feature', {
                featureRecordingStatus: 'candidate'
            }),
            createDocument('feature-confirmed-1', 'Feature', {
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: []
            })
        ] as any);

        expect(stats).toEqual(expect.objectContaining({
            dailyLogCount: 1,
            surveyBoundaryCount: 1,
            featureCandidateCount: 1,
            openIssueCount: 1,
            warningIssueCount: 1,
            statusLabel: '보완 필요',
            statusTone: 'warning'
        }));
        expect(stats.priorityIssues).toEqual([
            expect.objectContaining({
                documentId: 'feature-confirmed-1',
                identifier: 'feature-confirmed-1',
                severity: 'warning',
                recommendedAction: '현장 마감 전 완료 사진을 남겼는지 확인하세요.'
            })
        ]);
        expect(stats.issueCountByDocumentId).toEqual({
            'feature-confirmed-1': 1
        });
    });


    it('orders priority issues by severity before identifier', () => {

        const stats = makeKoreanFieldworkTodayStats([
            createDocument('find-1', 'Find'),
            createDocument('feature-confirmed-1', 'Feature', {
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: []
            })
        ] as any);

        expect(stats.priorityIssues.map(issue => issue.documentId)).toEqual([
            'feature-confirmed-1',
            'find-1'
        ]);
        expect(stats.priorityIssues.map(issue => issue.severity)).toEqual([
            'warning',
            'info'
        ]);
    });


    it('does not count tablet-hidden initial boundary setup records as today records', () => {

        const stats = makeKoreanFieldworkTodayStats([
            createDocument('initial-fieldwork-operation', 'Operation'),
            createDocument('initial-survey-boundary', 'SurveyBoundary', {}, {
                isRecordedIn: ['initial-fieldwork-operation']
            }),
            createDocument('operation-boundary-draft', 'Operation', {
                projectBoundarySetupState: 'draftBoundary',
                projectBoundarySummary: '처음 만든 유적 경계'
            }),
            createDocument('boundary-from-draft-operation', 'SurveyBoundary', {}, {
                isRecordedIn: ['operation-boundary-draft']
            }),
            createDocument('feature-group-1', 'FeatureGroup'),
            createDocument('feature-candidate-1', 'Feature', {
                featureRecordingStatus: 'candidate'
            })
        ] as any);

        expect(stats).toEqual(expect.objectContaining({
            dailyLogCount: 0,
            surveyBoundaryCount: 0,
            featureCandidateCount: 1,
            openIssueCount: 0,
            statusLabel: '조사 진행',
            statusTone: 'info'
        }));
    });


    it('marks the project stable when no open fieldwork issues remain', () => {

        const stats = makeKoreanFieldworkTodayStats([
            createDocument('feature-confirmed-1', 'Feature', {
                featureRecordingStatus: 'confirmed',
                featureInvestigationChecklist: ['completionPhotoTaken']
            })
        ] as any);

        expect(stats.statusLabel).toBe('마감 안정');
        expect(stats.statusTone).toBe('success');
        expect(stats.priorityIssues).toEqual([]);
    });
});


const createDocument = (id: string, category: string, fields: any = {}, relations: any = {}) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations,
        ...fields
    }
});
