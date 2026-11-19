import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrialWeekCalendarStripProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  onOpenMonthPicker: () => void;
  datesWithGuests?: string[]; // Array of YYYY-MM-DD strings that have trial guests
}

export const TrialWeekCalendarStrip: React.FC<TrialWeekCalendarStripProps> = ({
  selectedDate,
  onSelectDate,
  onOpenMonthPicker,
  datesWithGuests = [],
}) => {
  // Current anchor date parsed from selectedDate or today
  const anchorDate = useMemo(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  }, [selectedDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Compute Sunday of the current week
  const weekDays = useMemo(() => {
    const curr = new Date(anchorDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const sunday = new Date(curr);
    sunday.setDate(curr.getDate() - dayOfWeek);

    const days = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);

      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      days.push({
        name: dayNames[i],
        dayNum: d.getDate(),
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === selectedDate,
        hasGuests: datesWithGuests.includes(dateStr),
      });
    }
    return days;
  }, [anchorDate, selectedDate, todayStr, datesWithGuests]);

  // Formatted Month Header e.g. "November 2026"
  const monthTitle = useMemo(() => {
    return anchorDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [anchorDate]);

  const handlePrevWeek = () => {
    const prev = new Date(anchorDate);
    prev.setDate(prev.getDate() - 7);
    const y = prev.getFullYear();
    const m = String(prev.getMonth() + 1).padStart(2, '0');
    const d = String(prev.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
  };

  const handleNextWeek = () => {
    const next = new Date(anchorDate);
    next.setDate(next.getDate() + 7);
    const y = next.getFullYear();
    const m = String(next.getMonth() + 1).padStart(2, '0');
    const d = String(next.getDate()).padStart(2, '0');
    onSelectDate(`${y}-${m}-${d}`);
  };

  return (
    <View style={styles.card}>
      {/* Month Header Row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenMonthPicker}
          style={styles.monthSelector}>
          <Text style={styles.monthTitle}>{monthTitle}</Text>
          <Ionicons name="chevron-down" size={16} color="#0F172A" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Prev / Next Week Controls */}
        <View style={styles.arrowsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handlePrevWeek}
            style={styles.arrowButton}>
            <Ionicons name="chevron-back" size={18} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleNextWeek}
            style={styles.arrowButton}>
            <Ionicons name="chevron-forward" size={18} color="#334155" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Days Strip */}
      <View style={styles.weekStrip}>
        {weekDays.map((item) => (
          <TouchableOpacity
            key={item.dateStr}
            activeOpacity={0.8}
            onPress={() => onSelectDate(item.dateStr)}
            style={[
              styles.dayColumn,
              item.isSelected && styles.dayColumnSelected,
              item.isToday && !item.isSelected && styles.dayColumnToday,
            ]}>
            <Text
              style={[
                styles.dayNameText,
                item.isSelected && styles.dayNameTextSelected,
                item.isToday && !item.isSelected && styles.dayNameTextToday,
              ]}>
              {item.name}
            </Text>
            <Text
              style={[
                styles.dayNumText,
                item.isSelected && styles.dayNumTextSelected,
                item.isToday && !item.isSelected && styles.dayNumTextToday,
              ]}>
              {item.dayNum}
            </Text>

            {/* Dot Indicator */}
            {item.hasGuests ? (
              <View
                style={[
                  styles.dot,
                  item.isSelected ? styles.dotWhite : styles.dotRed,
                ]}
              />
            ) : (
              <View style={styles.dotPlaceholder} />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  arrowsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  weekStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    minWidth: 42,
  },
  dayColumnSelected: {
    backgroundColor: '#E23744',
  },
  dayColumnToday: {
    borderWidth: 1.5,
    borderColor: '#E23744',
    backgroundColor: '#FFFFFF',
  },
  dayNameText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    marginBottom: 4,
  },
  dayNameTextSelected: {
    color: '#FFFFFF',
  },
  dayNameTextToday: {
    color: '#E23744',
    fontWeight: '700',
  },
  dayNumText: {
    fontSize: 15,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  dayNumTextSelected: {
    color: '#FFFFFF',
  },
  dayNumTextToday: {
    color: '#0F172A',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
  dotRed: {
    backgroundColor: '#E23744',
  },
  dotWhite: {
    backgroundColor: '#FFFFFF',
  },
  dotPlaceholder: {
    width: 4,
    height: 4,
    marginTop: 4,
  },
});
