import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export interface SummaryMetric {
  label: string;
  value: number | string;
  color?: string;
}

interface TrialGuestsSummaryCardProps {
  metrics: SummaryMetric[];
}


export const TrialGuestsSummaryCard: React.FC<TrialGuestsSummaryCardProps> = ({ metrics }) => {
  return (
    <View style={styles.card}>
      {metrics.map((metric, idx) => (
        <View key={`metric-${idx}-${idx + 1}`} style={styles.metricItem}>
          <Text style={[styles.metricValue, { color: metric.color || '#0F172A' }]}>
            {metric.value}
          </Text>
          <Text style={styles.metricLabel} numberOfLines={1}>
            {metric.label}
          </Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  metricItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: 2,
  },
  metricLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
});
