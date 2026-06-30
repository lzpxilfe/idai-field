import { fireEvent, render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import SwipeableActionRow from './SwipeableActionRow';

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    MaterialIcons: ({ name }: { name: string }) => <Text>{name}</Text>,
  };
});

describe('SwipeableActionRow', () => {
  it('reveals row actions after a right-to-left swipe and runs the chosen action', () => {
    const handleEdit = jest.fn();
    const handleDelete = jest.fn();
    const { getByTestId } = render(
      <SwipeableActionRow
        actions={[
          {
            icon: 'edit',
            id: 'edit',
            label: '수정',
            onPress: handleEdit,
            testID: 'swipeEdit',
            tone: 'primary',
          },
          {
            icon: 'delete-outline',
            id: 'delete',
            label: '삭제',
            onPress: handleDelete,
            testID: 'swipeDelete',
            tone: 'danger',
          },
        ]}
        testID="swipeRow"
      >
        <Text>1호 유구</Text>
      </SwipeableActionRow>
    );

    fireEvent(getByTestId('swipeRow_surface'), 'responderMove', {}, {
      dx: -120,
      dy: 0,
    });
    fireEvent(getByTestId('swipeRow_surface'), 'responderRelease', {}, {
      dx: -120,
      dy: 0,
    });
    fireEvent.press(getByTestId('swipeDelete'));

    expect(handleDelete).toHaveBeenCalledTimes(1);
    expect(handleEdit).not.toHaveBeenCalled();
  });
});
