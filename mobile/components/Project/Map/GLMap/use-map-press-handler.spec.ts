import {
  isDoubleTapOnDocument,
} from './use-map-press-handler';
import { DOUBLE_TAP_DURATION_MS } from './constants';

describe('isDoubleTapOnDocument', () => {
  it('recognizes two quick taps on the same map document', () => {
    expect(isDoubleTapOnDocument(
      { docId: 'feature-1', time: 1000 },
      'feature-1',
      1000 + DOUBLE_TAP_DURATION_MS
    )).toBe(true);
  });

  it('ignores slow taps or taps on another map document', () => {
    expect(isDoubleTapOnDocument(
      { docId: 'feature-1', time: 1000 },
      'feature-1',
      1000 + DOUBLE_TAP_DURATION_MS + 1
    )).toBe(false);
    expect(isDoubleTapOnDocument(
      { docId: 'feature-1', time: 1000 },
      'feature-2',
      1100
    )).toBe(false);
  });
});
