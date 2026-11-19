import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TrialGuestsCapacityCardProps {
  title: string;
  capacityText: string;
  totalSlots: number;
  filledSlots: number;
  subtext: string;
}

export const TrialGuestsCapacityCard: React.FC<TrialGuestsCapacityCardProps> = ({
  title,
  capacityText,
  totalSlots,
  filledSlots,
  subtext,
}) => {
  const count = Math.max(totalSlots, filledSlots, 1);
  const slotsArray = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.card}>
      {/* Title & Capacity Row */}
      <View style={styles.headerRow}>
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.capacityText}>{capacityText}</Text>
      </View>

      {/* Segmented capsules progress bar */}
      <View style={styles.barContainer}>
        {slotsArray.map((index) => {
          const isFilled = index < filledSlots;
          return (
            <View
              key={`cap-slot-${index}`}
              style={[
                styles.segment,
                isFilled ? styles.filledSegment : styles.unfilledSegment,
              ]}
            />
          );
        })}
      </View>

      {/* Subtext info */}
      <Text style={styles.subtext}>{subtext}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  capacityText: {
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 14,
  },
  segment: {
    flex: 1,
    height: 6,
    borderRadius: 4,
  },
  filledSegment: {
    backgroundColor: '#E23744',
  },
  unfilledSegment: {
    backgroundColor: '#F1F5F9',
  },
  subtext: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
});
