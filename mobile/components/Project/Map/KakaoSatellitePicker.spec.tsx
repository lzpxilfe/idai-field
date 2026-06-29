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

  it('falls back to an open basemap drawing tool when every Kakao SDK origin is rejected', () => {
    const { getByTestId, getByText, queryByTestId } = render(
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
      baseUrl: 'https://idai-field.local/boundary-picker/',
    }));
    expect(webView.props.source.html).toContain('tile.openstreetmap.org');
    expect(webView.props.source.html).toContain('World_Imagery');

    expect(getByText(
      '카카오 지도가 WebView 출처 제한에 막혀 공개 배경지도로 전환했습니다. 경계 그리기와 저장은 그대로 가능합니다.'
    )).toBeTruthy();
    expect(queryByTestId('kakao-boundary-retry')).toBeNull();
  });
});
