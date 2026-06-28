import { Document } from 'idai-field-core';
import {
    getKoreanFieldworkBoundaryMethodLabel,
    getKoreanFieldworkBoundarySummaryLabel,
    getKoreanFieldworkSurveyBoundaryDocuments
} from '../../../src/app/util/korean-fieldwork-boundary-summary';


describe('korean-fieldwork-boundary-summary', () => {

    it('summarizes GPS draft survey boundaries without hiding their rough accuracy', () => {

        const boundary = createBoundary({
            surveyBoundaryAccuracy: 'approximateGps',
            surveyBoundarySource: 'gpsWalkover'
        });

        expect(getKoreanFieldworkBoundaryMethodLabel(boundary)).toBe('GPS 임시 · GPS 대략');
        expect(getKoreanFieldworkBoundarySummaryLabel([boundary])).toBe('B1 · GPS 임시 · GPS 대략');
    });


    it('summarizes imported vector boundaries with source and reference accuracy', () => {

        const boundary = createBoundary({
            shortDescription: 'A구역 북쪽 경계',
            surveyBoundaryAccuracy: 'importedReference',
            surveyBoundarySource: 'shpImport',
            referenceBasemapProvider: 'importedVectorLayer'
        });

        expect(getKoreanFieldworkBoundarySummaryLabel([boundary], 'A구역')).toBe(
            'A구역 · SHP 가져오기 · 가져온 참고자료'
        );
    });


    it('summarizes tablet GeoJSON boundary imports after sync to desktop', () => {

        const boundary = createBoundary({
            shortDescription: 'A-zone north boundary',
            surveyBoundaryAccuracy: 'importedReference',
            surveyBoundarySource: 'geoJsonImport',
            referenceBasemapProvider: 'importedVectorLayer'
        });

        const summary = getKoreanFieldworkBoundarySummaryLabel([boundary], 'A-zone');

        expect(summary).toContain('A-zone');
        expect(summary).toContain('GeoJSON');
        expect(summary).not.toContain('boundary missing');
    });


    it('keeps Kakao satellite boundaries visible as satellite-based boundaries on desktop', () => {

        const boundary = createBoundary({
            surveyBoundaryAccuracy: 'visualReference',
            surveyBoundarySource: 'manualBasemapTrace',
            referenceBasemapProvider: 'kakaoSkyview'
        });

        expect(getKoreanFieldworkBoundaryMethodLabel(boundary)).toBe('카카오 위성지도 기준');
        expect(getKoreanFieldworkBoundarySummaryLabel([boundary], 'A구역')).toBe(
            'A구역 · 카카오 위성지도 기준'
        );
    });


    it('summarizes tablet Kakao roadmap and hybrid boundary basemaps distinctly', () => {

        expect(getKoreanFieldworkBoundaryMethodLabel(createBoundary({
            surveyBoundarySource: 'manualBasemapTrace',
            referenceBasemapProvider: 'kakaoRoadmap'
        }))).toBe('카카오 일반지도 기준');

        expect(getKoreanFieldworkBoundaryMethodLabel(createBoundary({
            surveyBoundarySource: 'manualBasemapTrace',
            referenceBasemapProvider: 'kakaoHybrid'
        }))).toBe('카카오 하이브리드 기준');
    });


    it('filters survey boundary records from mixed project documents', () => {

        const boundary = createBoundary();

        expect(getKoreanFieldworkSurveyBoundaryDocuments([
            createDocument('operation-1', 'Operation'),
            boundary
        ])).toEqual([boundary]);
    });
});


const createBoundary = (fields: any = {}) => createDocument('boundary-1', 'SurveyBoundary', {
    identifier: 'B1',
    ...fields
});


const createDocument = (id: string, category: string, fields: any = {}): Document => ({
    resource: {
        id,
        identifier: id,
        category,
        relations: {},
        ...fields
    }
} as Document);
