import { act, fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import KakaoSatellitePicker from './KakaoSatellitePicker';

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    WebView: React.forwardRef((props: Record<string, unknown>, ref: unknown) => {
      React.useImperativeHandle(ref, () => ({
        postMessage: jest.fn(),
      }));

      return <View {...props} />;
    }),
  };
});

describe('KakaoSatellitePicker', () => {
  it('covers the map with a full loading overlay until the drawing map is ready', () => {
    const { getByTestId, queryByTestId } = render(
      <KakaoSatellitePicker
        initialLocation={{ latitude: 36.45, longitude: 127.12 }}
        javaScriptKey="js-key"
        onClose={jest.fn()}
        onPickBoundary={jest.fn()}
        visible
      />
    );

    expect(getByTestId('kakao-boundary-loading-overlay')).toBeTruthy();

    act(() => {
      fireEvent(getByTestId('kakao-satellite-picker-webview'), 'message', {
        nativeEvent: {
          data: JSON.stringify({ type: 'ready' }),
        },
      });
    });

    expect(queryByTestId('kakao-boundary-loading-overlay')).toBeNull();
  });

  it('passes the selected Kakao map type with picked boundaries', () => {
    const onPickBoundary = jest.fn();
    const { getByTestId } = render(
      <KakaoSatellitePicker
        initialLocation={{ latitude: 36.45, longitude: 127.12 }}
        javaScriptKey="js-key"
        onClose={jest.fn()}
        onPickBoundary={onPickBoundary}
        visible
      />
    );

    act(() => {
      fireEvent(getByTestId('kakao-satellite-picker-webview'), 'message', {
        nativeEvent: {
          data: JSON.stringify({
            type: 'boundary',
            payload: {
              mapTypeId: 'ROADMAP',
              coordinates: [
                { latitude: 36.45, longitude: 127.12 },
                { latitude: 36.46, longitude: 127.13 },
                { latitude: 36.47, longitude: 127.14 },
              ],
            },
          }),
        },
      });
    });

    expect(onPickBoundary).toHaveBeenCalledWith(expect.objectContaining({
      mapTypeId: 'ROADMAP',
    }));
  });

  it('keeps the native map type selector in sync with the WebView map type', () => {
    const { getByTestId } = render(
      <KakaoSatellitePicker
        initialLocation={{ latitude: 36.45, longitude: 127.12 }}
        javaScriptKey="js-key"
        onClose={jest.fn()}
        onPickBoundary={jest.fn()}
        visible
      />
    );

    expect(getByTestId('kakao-map-type-HYBRID').props.accessibilityState)
      .toEqual({ selected: true });

    fireEvent.press(getByTestId('kakao-map-type-ROADMAP'));

    expect(getByTestId('kakao-map-type-ROADMAP').props.accessibilityState)
      .toEqual({ selected: true });

    act(() => {
      fireEvent(getByTestId('kakao-satellite-picker-webview'), 'message', {
        nativeEvent: {
          data: JSON.stringify({
            type: 'mapType',
            payload: { mapTypeId: 'SKYVIEW' },
          }),
        },
      });
    });

    expect(getByTestId('kakao-map-type-SKYVIEW').props.accessibilityState)
      .toEqual({ selected: true });
  });

  it('keeps the boundary drawing tool open when every SDK origin is rejected', () => {
    const { getByTestId, getByText } = render(
      <KakaoSatellitePicker
        initialLocation={{ latitude: 36.45, longitude: 127.12 }}
        javaScriptKey="js-key"
        onClose={jest.fn()}
        onPickBoundary={jest.fn()}
        visible
      />
    );

    for (let index = 0; index < 8; index++) {
      act(() => {
        fireEvent(getByTestId('kakao-satellite-picker-webview'), 'message', {
          nativeEvent: {
            data: JSON.stringify({
              type: 'error',
              payload: {
                message: 'denied',
                webViewBaseUrl: `origin-${index}`,
              },
            }),
          },
        });
      });
    }

    const webView = getByTestId('kakao-satellite-picker-webview');
    expect(webView.props.source).toEqual(expect.objectContaining({
      html: expect.stringContaining('조사 경계 그리기'),
      baseUrl: 'http://127.0.0.1/',
    }));

    expect(getByText(
      '카카오 지도 SDK가 WebView 출처에서 거부되었습니다. Kakao Developers JavaScript SDK 도메인에 origin-7 등록 후 다시 시도하세요. 공개 카카오맵으로 빠지면 경계를 저장할 수 없어서 여기서는 조사 경계 그리기 화면을 유지합니다.'
    )).toBeTruthy();
    expect(getByTestId('kakao-boundary-retry')).toBeTruthy();
  });
});
