import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import {
  buildKakaoSatellitePickerHtml,
  KakaoMapTypeId,
} from './kakao-satellite-picker-html';

export interface KakaoSatellitePickedLocation {
  latitude: number;
  longitude: number;
}

export interface KakaoSatellitePickedBoundary {
  center?: KakaoSatellitePickedLocation;
  coordinates: KakaoSatellitePickedLocation[];
  mapTypeId?: KakaoMapTypeId;
}

interface KakaoSatellitePickerProps {
  initialLocation?: KakaoSatellitePickedLocation;
  javaScriptKey: string;
  onClose: () => void;
  onPickBoundary: (boundary: KakaoSatellitePickedBoundary) => void;
  visible: boolean;
}

const DEFAULT_LOCATION = {
  latitude: 37.5665,
  longitude: 126.9780,
};
const KAKAO_MAP_WEBVIEW_BASE_URLS = [
  'http://localhost:8080/',
  'http://127.0.0.1:8080/',
  'http://localhost:8081/',
  'http://127.0.0.1:8081/',
  'https://localhost/',
  'https://127.0.0.1/',
  'http://localhost/',
  'http://127.0.0.1/',
];
const KAKAO_MAP_TYPE_OPTIONS: Array<{ id: KakaoMapTypeId; label: string }> = [
  { id: 'ROADMAP', label: '일반' },
  { id: 'SKYVIEW', label: '위성' },
  { id: 'HYBRID', label: '혼합' },
];

const KakaoSatellitePicker: React.FC<KakaoSatellitePickerProps> = ({
  initialLocation,
  javaScriptKey,
  onClose,
  onPickBoundary,
  visible,
}) => {
  const webViewRef = useRef<any>(null);
  const latitude = initialLocation?.latitude ?? DEFAULT_LOCATION.latitude;
  const longitude = initialLocation?.longitude ?? DEFAULT_LOCATION.longitude;
  const [message, setMessage] = useState(
    '지도는 배경입니다. 지도 위를 눌러 조사 지역의 꼭짓점을 차례대로 찍으세요.'
  );
  const [baseUrlIndex, setBaseUrlIndex] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string>();
  const [reloadNonce, setReloadNonce] = useState(0);
  const [selectedMapTypeId, setSelectedMapTypeId] = useState<KakaoMapTypeId>('HYBRID');
  const [initialMapTypeId, setInitialMapTypeId] = useState<KakaoMapTypeId>('HYBRID');
  const webViewBaseUrl =
    KAKAO_MAP_WEBVIEW_BASE_URLS[baseUrlIndex] ?? KAKAO_MAP_WEBVIEW_BASE_URLS[0];
  const mapHtml = useMemo(
    () => buildKakaoSatellitePickerHtml({
      javaScriptKey,
      latitude,
      longitude,
      mapTypeId: initialMapTypeId,
      webViewBaseUrl,
    }),
    [initialMapTypeId, javaScriptKey, latitude, longitude, webViewBaseUrl]
  );

  useEffect(() => {
    if (visible) {
      setBaseUrlIndex(0);
      setIsMapReady(false);
      setMapLoadError(undefined);
      setInitialMapTypeId('HYBRID');
      setSelectedMapTypeId('HYBRID');
      setReloadNonce((value) => value + 1);
      setMessage('지도는 배경입니다. 지도 위를 눌러 조사 지역의 꼭짓점을 차례대로 찍으세요.');
    }
  }, [javaScriptKey, visible]);

  const showMapLoadFailure = (diagnostic?: Record<string, unknown>) => {
    setMapLoadError(getMapLoadFailureMessage(diagnostic, webViewBaseUrl));
    setIsMapReady(false);
  };

  const retryWithNextWebViewOrigin = (diagnostic?: Record<string, unknown>) => {
    if (baseUrlIndex >= KAKAO_MAP_WEBVIEW_BASE_URLS.length - 1) return false;

    setMapLoadError(undefined);
    setIsMapReady(false);
    setBaseUrlIndex(baseUrlIndex + 1);
    return true;
  };

  const onPickLocation = (boundary: KakaoSatellitePickedBoundary) => {
    onPickBoundary(boundary);
  };

  const selectMapType = (mapTypeId: KakaoMapTypeId) => {
    setSelectedMapTypeId(mapTypeId);
    webViewRef.current?.postMessage(JSON.stringify({
      type: 'setMapType',
      payload: { mapTypeId },
    }));
  };

  const onMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ready') {
        setIsMapReady(true);
        setMapLoadError(undefined);
        return;
      }

      if (data.type === 'mapType') {
        const mapTypeId = getPickedMapTypeId(data.payload?.mapTypeId);
        if (mapTypeId) setSelectedMapTypeId(mapTypeId);
        return;
      }

      if (data.type === 'boundary') {
        const coordinates = getPickedCoordinates(data.payload?.coordinates);
        if (coordinates.length >= 3) {
          setMessage('선택한 꼭짓점으로 조사 경계를 저장합니다.');
          onPickLocation({
            coordinates,
            center: getPickedLocation(data.payload?.center),
            mapTypeId: getPickedMapTypeId(data.payload?.mapTypeId),
          });
        }
        return;
      }

      if (data.type === 'error') {
        const diagnostic = getDiagnosticPayload(data.payload);
        if (retryWithNextWebViewOrigin(diagnostic)) return;
        showMapLoadFailure(diagnostic);
      }
    } catch {
      setMessage('카카오 지도 메시지를 읽지 못했습니다.');
    }
  };

  const retryLoadingMap = () => {
    setBaseUrlIndex(0);
    setIsMapReady(false);
    setMapLoadError(undefined);
    setReloadNonce((value) => value + 1);
  };

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent={false}
      visible={visible}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>카카오 지도에서 경계 그리기</Text>
            <Text style={styles.message}>{message}</Text>
            <View style={styles.mapTypeControls}>
              {KAKAO_MAP_TYPE_OPTIONS.map((option) => {
                const selected = option.id === selectedMapTypeId;

                return (
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    key={option.id}
                    onPress={() => selectMapType(option.id)}
                    style={[
                      styles.mapTypeButton,
                      selected && styles.mapTypeButtonSelected,
                    ]}
                    testID={`kakao-map-type-${option.id}`}
                  >
                    <Text style={[
                      styles.mapTypeButtonText,
                      selected && styles.mapTypeButtonTextSelected,
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={onClose}
            style={styles.closeButton}
            testID="kakao-satellite-picker-close"
          >
            <Text style={styles.closeText}>닫기</Text>
          </TouchableOpacity>
        </View>
        <WebView
          ref={webViewRef}
          originWhitelist={['*']}
          javaScriptEnabled
          domStorageEnabled
          onError={(event) => {
            const diagnostic = {
              message: event.nativeEvent.description,
              webViewBaseUrl,
            };
            if (retryWithNextWebViewOrigin(diagnostic)) return;
            showMapLoadFailure(diagnostic);
          }}
          onHttpError={(event) => {
            const diagnostic = {
              statusCode: event.nativeEvent.statusCode,
              webViewBaseUrl,
            };
            if (retryWithNextWebViewOrigin(diagnostic)) return;
            showMapLoadFailure(diagnostic);
          }}
          onMessage={onMessage}
          key={`${webViewBaseUrl}-${reloadNonce}`}
          setSupportMultipleWindows={false}
          source={{ html: mapHtml, baseUrl: webViewBaseUrl }}
          style={styles.webView}
          testID="kakao-satellite-picker-webview"
        />
        {(!isMapReady || mapLoadError) && (
          <View style={styles.loadingOverlay} testID="kakao-boundary-loading-overlay">
            <View style={styles.loadingPanel}>
              {mapLoadError ? (
                <>
                  <Text style={styles.loadingTitle}>조사 경계 지도를 열지 못했습니다</Text>
                  <Text style={styles.loadingText}>{mapLoadError}</Text>
                  <View style={styles.loadingActions}>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={retryLoadingMap}
                      style={styles.loadingPrimaryButton}
                      testID="kakao-boundary-retry"
                    >
                      <Text style={styles.loadingPrimaryButtonText}>다시 시도</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      accessibilityRole="button"
                      onPress={onClose}
                      style={styles.loadingSecondaryButton}
                    >
                      <Text style={styles.loadingSecondaryButtonText}>닫기</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                <>
                  <ActivityIndicator color="#24495d" size="large" />
                  <Text style={styles.loadingTitle}>조사 경계 지도를 준비 중입니다</Text>
                  <Text style={styles.loadingText}>
                    카카오 배경지도 위에 조사 지역 꼭짓점을 찍을 수 있게 준비하고 있습니다.
                  </Text>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    alignItems: 'center',
    backgroundColor: '#24495d',
    borderRadius: 4,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 12,
  },
  closeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    backgroundColor: '#eef2f4',
    flex: 1,
  },
  header: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#ccd6df',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerText: {
    flex: 1,
  },
  loadingActions: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    marginTop: 16,
  },
  loadingOverlay: {
    alignItems: 'center',
    backgroundColor: '#eef2f4',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    padding: 24,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 30,
  },
  loadingPanel: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#cbd5df',
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 460,
    padding: 24,
    width: '100%',
  },
  loadingPrimaryButton: {
    alignItems: 'center',
    backgroundColor: '#24495d',
    borderRadius: 4,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 18,
  },
  loadingPrimaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingSecondaryButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5df',
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 40,
    paddingHorizontal: 18,
  },
  loadingSecondaryButtonText: {
    color: '#20313a',
    fontSize: 14,
    fontWeight: '800',
  },
  loadingText: {
    color: '#526272',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 8,
    textAlign: 'center',
  },
  loadingTitle: {
    color: '#20313a',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 14,
    textAlign: 'center',
  },
  mapTypeButton: {
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5df',
    borderRadius: 4,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 30,
    paddingHorizontal: 10,
  },
  mapTypeButtonSelected: {
    backgroundColor: '#24495d',
    borderColor: '#24495d',
  },
  mapTypeButtonText: {
    color: '#20313a',
    fontSize: 12,
    fontWeight: '700',
  },
  mapTypeButtonTextSelected: {
    color: '#fff',
  },
  mapTypeControls: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  message: {
    color: '#526272',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  title: {
    color: '#20313a',
    fontSize: 17,
    fontWeight: '800',
  },
  webView: {
    flex: 1,
  },
});

export default KakaoSatellitePicker;

const getPickedCoordinates = (value: unknown): KakaoSatellitePickedLocation[] =>
  Array.isArray(value)
    ? value.map(getPickedLocation).filter(isPickedLocation)
    : [];

const getPickedLocation = (
  value: unknown
): KakaoSatellitePickedLocation | undefined => {
  if (typeof value !== 'object' || value === null) return undefined;

  const location = value as Record<string, unknown>;
  const latitude = location.latitude;
  const longitude = location.longitude;

  return typeof latitude === 'number'
    && Number.isFinite(latitude)
    && typeof longitude === 'number'
    && Number.isFinite(longitude)
    ? {
        latitude,
        longitude,
      }
    : undefined;
};

const isPickedLocation = (
  value: KakaoSatellitePickedLocation | undefined
): value is KakaoSatellitePickedLocation => value !== undefined;

const getPickedMapTypeId = (
  value: unknown
): KakaoMapTypeId | undefined => {
  return value === 'ROADMAP' || value === 'SKYVIEW' || value === 'HYBRID'
    ? value
    : undefined;
};

const getDiagnosticPayload = (value: unknown): Record<string, unknown> | undefined =>
  typeof value === 'object' && value !== null
    ? value as Record<string, unknown>
    : undefined;

const getMapLoadFailureMessage = (
  diagnostic: Record<string, unknown> | undefined,
  attemptedBaseUrl: string
): string => {
  const attemptedOrigin = getDiagnosticOrigin(diagnostic) ?? attemptedBaseUrl;
  return `카카오 지도 SDK가 WebView 출처에서 거부되었습니다. Kakao Developers JavaScript SDK 도메인에 ${attemptedOrigin} 등록 후 다시 시도하세요. 공개 카카오맵으로 빠지면 경계를 저장할 수 없어서 여기서는 조사 경계 그리기 화면을 유지합니다.`;
};

const getDiagnosticOrigin = (
  diagnostic: Record<string, unknown> | undefined
): string | undefined => {
  const origin = getNonEmptyString(diagnostic?.origin);
  if (origin && origin !== 'null') return origin;

  const hrefOrigin = getOriginFromUrl(getNonEmptyString(diagnostic?.href));
  if (hrefOrigin) return hrefOrigin;

  const baseUrlOrigin = getOriginFromUrl(getNonEmptyString(diagnostic?.webViewBaseUrl));
  if (baseUrlOrigin) return baseUrlOrigin;

  return getNonEmptyString(diagnostic?.webViewBaseUrl);
};

const getOriginFromUrl = (value: string | undefined): string | undefined => {
  if (!value) return undefined;

  try {
    return new URL(value).origin;
  } catch {
    return undefined;
  }
};

const getNonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
