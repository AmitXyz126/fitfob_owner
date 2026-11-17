import React from 'react';
import { View, StyleSheet } from 'react-native';

interface SlotProgressBarProps {
  totalSlots: number;
  filledSlots: number;
}

export const SlotProgressBar: React.FC<SlotProgressBarProps> = ({
  totalSlots,
  filledSlots,
}) => {
  const count = Math.max(totalSlots, filledSlots);
  if (count <= 0) return null;
  const slotsArray = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.container}>
      {slotsArray.map((index) => {
        const isFilled = index < filledSlots;
        return (
          <View
            key={`slot-${index}`}
            style={[
              styles.segment,
              isFilled ? styles.filledSegment : styles.unfilledSegment,
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 12,
  },
  segment: {
    flex: 1,
    height: 7,
    borderRadius: 4,
  },
  filledSegment: {
    backgroundColor: '#E23744',
  },
  unfilledSegment: {
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
});
