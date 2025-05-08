import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface Props {
  confidence: number;
}

export function ConfidenceIndicator({ confidence }: Props) {
  const getColor = () => {
    if (confidence >= 85) return colors.confidence.high;
    if (confidence >= 70) return colors.confidence.medium;
    return colors.confidence.low;
  };

  return (
    <View style={[styles.container, { backgroundColor: getColor() + '20' }]}>
      <Text style={[styles.text, { color: getColor() }]}>
        {confidence}% Confidence
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});