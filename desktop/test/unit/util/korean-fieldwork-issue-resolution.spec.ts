import { KoreanFieldworkReadinessIssue } from 'idai-field-core';
import {
    getKoreanFieldworkIssueResolutionAction
} from '../../../src/app/util/korean-fieldwork-issue-resolution';


describe('korean-fieldwork-issue-resolution', () => {

    it('creates a checklist update action for confirmed features missing completion photos', () => {

        const feature = createDoc('feature-1', 'Feature', {
            featureInvestigationChecklist: ['measuredDrawingCompleted']
        });

        expect(getKoreanFieldworkIssueResolutionAction(
            createIssue('feature-complete-photo', 'feature-1'),
            feature as any
        )).toMatchObject({
            type: 'updateFields',
            updates: {
                featureInvestigationChecklist: [
                    'measuredDrawingCompleted',
                    'completionPhotoTaken'
                ]
            }
        });
    });


    it('creates field-only timing updates', () => {

        const feature = createDoc('feature-1', 'Feature');

        expect(getKoreanFieldworkIssueResolutionAction(
            createIssue('field-only-timing', 'feature-1'),
            feature as any
        )).toMatchObject({
            type: 'updateFields',
            updates: {
                recordCreationTiming: 'fieldOnlyObservation'
            }
        });
    });


    it('creates a soil profile photo draft action only when the category is allowed', () => {

        const feature = createDoc('feature-1', 'Feature');
        const issue = createIssue('soil-profile-photo-count', 'feature-1');

        expect(getKoreanFieldworkIssueResolutionAction(
            issue,
            feature as any,
            []
        )).toBeUndefined();

        expect(getKoreanFieldworkIssueResolutionAction(
            issue,
            feature as any,
            ['SoilProfilePhoto']
        )).toMatchObject({
            type: 'createDocument',
            categoryName: 'SoilProfilePhoto'
        });
    });


    it('does not resolve issues that belong to another record', () => {

        expect(getKoreanFieldworkIssueResolutionAction(
            createIssue('feature-complete-photo', 'feature-2'),
            createDoc('feature-1', 'Feature') as any
        )).toBeUndefined();
    });
});


const createDoc = (
    id: string,
    category: string,
    extraResource: Record<string, unknown> = {}
) => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...extraResource
    }
});


const createIssue = (
    ruleId: string,
    documentId: string
): KoreanFieldworkReadinessIssue => ({
    ruleId,
    documentId,
    identifier: documentId,
    category: 'Feature',
    severity: 'warning',
    message: 'Check required',
    relatedFields: ['featureInvestigationChecklist'],
    recommendedAction: 'Check in the field.',
    blocksSave: false
});
