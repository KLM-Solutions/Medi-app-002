import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AlertCircle, AlertTriangle, CheckCircle, HelpCircle } from 'lucide-react-native';
import { colors } from '@/constants/colors';
import { HealthCategory } from '@/types/analysis';

interface Props {
  category: HealthCategory;
  size?: number;
}

export function HealthCategoryBadge({ category, size = 16 }: Props) {
  const getIcon = () => {
    switch (category) {
      case 'Clearly Healthy':
        return <CheckCircle size={size} color={colors.success} />;
      case 'Borderline':
        return <HelpCircle size={size} color={colors.warning} />;
      case 'Mixed':
        return <AlertTriangle size={size} color={colors.mixed} />;
      case 'Clearly Unhealthy':
        return <AlertCircle size={size} color={colors.danger} />;
    }
  };

  const getColor = () => {
    switch (category) {
      case 'Clearly Healthy':
        return colors.success;
      case 'Borderline':
        return colors.warning;
      case 'Mixed':
        return colors.mixed;
      case 'Clearly Unhealthy':
        return colors.danger;
    }
  };

  return (
    <View style={[styles.container, { borderColor: getColor() }]}>
      {getIcon()}
      <Text style={[styles.text, { color: getColor() }]}>{category}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});