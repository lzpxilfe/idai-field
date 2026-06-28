import {
    getKoreanFieldworkDefaultMapProviderSettings,
    getKoreanFieldworkSatelliteMapProviderNotice,
    hasKoreanFieldworkSatelliteMapDisplayKey,
    normalizeKoreanFieldworkMapProviderSettings
} from '../../../src/app/util/korean-fieldwork-map-provider-settings';


describe('korean-fieldwork-map-provider-settings', () => {

    it('normalizes missing or malformed map provider settings', () => {

        expect(normalizeKoreanFieldworkMapProviderSettings(undefined)).toEqual(
            getKoreanFieldworkDefaultMapProviderSettings()
        );
        expect(normalizeKoreanFieldworkMapProviderSettings({
            kakaoLocalRestApiKey: 'rest-key',
            kakaoMapJavaScriptKey: 42,
            kakaoNativeAppKey: 'native-key'
        })).toEqual({
            kakaoLocalRestApiKey: 'rest-key',
            kakaoMapJavaScriptKey: '',
            kakaoNativeAppKey: 'native-key'
        });
    });


    it('treats REST keys as local API keys, not satellite map display keys', () => {

        expect(hasKoreanFieldworkSatelliteMapDisplayKey({
            kakaoLocalRestApiKey: 'rest-key'
        })).toBe(false);
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoLocalRestApiKey: 'rest-key'
        })).toContain('REST 키');
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoLocalRestApiKey: 'rest-key'
        })).toContain('주소 검색과 좌표 변환용');
    });


    it('recognizes JavaScript and Native App keys as map display candidates', () => {

        expect(hasKoreanFieldworkSatelliteMapDisplayKey({
            kakaoMapJavaScriptKey: 'js-key'
        })).toBe(true);
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoMapJavaScriptKey: 'js-key'
        })).toContain('JavaScript 키');
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoMapJavaScriptKey: 'js-key'
        })).toContain('일반지도, 위성지도, 하이브리드');
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoMapJavaScriptKey: 'js-key'
        })).toContain('동기화된 경계 기준과 SHP/DXF/GeoJSON/CSV 가져오기 경계');

        expect(hasKoreanFieldworkSatelliteMapDisplayKey({
            kakaoNativeAppKey: 'native-key'
        })).toBe(false);
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoNativeAppKey: 'native-key'
        })).toContain('Native App 키');
        expect(getKoreanFieldworkSatelliteMapProviderNotice({
            kakaoNativeAppKey: 'native-key'
        })).toContain('태블릿에서 만든 경계를 동기화');
    });
});
