/* eslint-disable @typescript-eslint/array-type */
/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface TrialDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  datesWithGuests?: string[]; // YYYY-MM-DD
}

export const TrialDatePickerModal: React.FC<TrialDatePickerModalProps> = ({
  visible,
  onClose,
  selectedDate,
  onSelectDate,
  datesWithGuests = [],
}) => {
  const insets = useSafeAreaInsets();

  const [activeDate, setActiveDate] = useState<string>(selectedDate);
  const [viewDate, setViewDate] = useState<Date>(() => {
    const d = new Date(selectedDate);
    return isNaN(d.getTime()) ? new Date() : d;
  });

  useEffect(() => {
    if (visible) {
      setActiveDate(selectedDate);
      const d = new Date(selectedDate);
      if (!isNaN(d.getTime())) {
        setViewDate(d);
      }
    }
  }, [visible, selectedDate]);

  const todayStr = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const monthYearTitle = useMemo(() => {
    return viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [viewDate]);

  // Generate calendar days matrix
  const calendarDays = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay(); // 0 is Sunday

    // Total days in month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days: Array<{
      dayNum?: number;
      dateStr?: string;
      isToday?: boolean;
      isSelected?: boolean;
      hasGuests?: boolean;
    }> = [];

    // Prepend empty slots for offset
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({});
    }

    // Days of current month
    for (let day = 1; day <= totalDays; day++) {
      const y = year;
      const m = String(month + 1).padStart(2, '0');
      const d = String(day).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;

      days.push({
        dayNum: day,
        dateStr,
        isToday: dateStr === todayStr,
        isSelected: dateStr === activeDate,
        hasGuests: datesWithGuests.includes(dateStr),
      });
    }

    return days;
  }, [viewDate, activeDate, todayStr, datesWithGuests]);

  const handlePrevMonth = () => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() - 1);
      return next;
    });
  };

  const handleNextMonth = () => {
    setViewDate((prev) => {
      const next = new Date(prev);
      next.setMonth(next.getMonth() + 1);
      return next;
    });
  };

  const formattedSelectedButtonText = useMemo(() => {
    try {
      const d = new Date(activeDate);
      if (!isNaN(d.getTime())) {
        const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
        const day = d.getDate();
        const month = d.toLocaleDateString('en-US', { month: 'short' });
        return `Show guests · ${weekday}, ${day} ${month}`;
      }
    } catch {}
    return 'Show guests';
  }, [activeDate]);

  const handleConfirm = () => {
    onSelectDate(activeDate);
    onClose();
  };

  const dayHeaders = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.sheetContainer,
                { paddingBottom: Math.max(insets.bottom + 12, 24) },
              ]}>
              {/* Top Handle Indicator */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <View>
                  <Text style={styles.headerTitle}>Pick a date</Text>
                  <Text style={styles.headerSubtitle}>See trial guests for any day</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={onClose}
                  style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#334155" />
                </TouchableOpacity>
              </View>

              {/* Month Navigation Row */}
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handlePrevMonth}
                  style={styles.navArrowBtn}>
                  <Ionicons name="chevron-back" size={18} color="#0F172A" />
                </TouchableOpacity>
                <Text style={styles.monthNavTitle}>{monthYearTitle}</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={handleNextMonth}
                  style={styles.navArrowBtn}>
                  <Ionicons name="chevron-forward" size={18} color="#0F172A" />
                </TouchableOpacity>
              </View>

              {/* Day of Week Headers */}
              <View style={styles.dayHeadersRow}>
                {dayHeaders.map((dh, index) => (
                  <Text key={`dh-${index}`} style={styles.dayHeaderCell}>
                    {dh}
                  </Text>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={styles.calendarGrid}>
                {calendarDays.map((cell, idx) => {
                  if (!cell.dayNum || !cell.dateStr) {
                    return <View key={`empty-${idx}`} style={styles.dayCell} />;
                  }

                  const isSel = cell.isSelected;
                  const isTod = cell.isToday && !isSel;

                  return (
                    <TouchableOpacity
                      key={cell.dateStr}
                      activeOpacity={0.8}
                      onPress={() => cell.dateStr && setActiveDate(cell.dateStr)}
                      style={[
                        styles.dayCell,
                        isSel && styles.dayCellSelected,
                        isTod && styles.dayCellToday,
                      ]}>
                      <Text
                        style={[
                          styles.dayCellText,
                          isSel && styles.dayCellTextSelected,
                          isTod && styles.dayCellTextToday,
                        ]}>
                        {cell.dayNum}
                      </Text>

                      {/* Dot for trial guests */}
                      {cell.hasGuests ? (
                        <View
                          style={[
                            styles.dot,
                            isSel ? styles.dotWhite : styles.dotRed,
                          ]}
                        />
                      ) : (
                        <View style={styles.dotPlaceholder} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, styles.dotRed, { marginRight: 6 }]} />
                  <Text style={styles.legendText}>Has trial guests</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendTodayRing, { marginRight: 6 }]} />
                  <Text style={styles.legendText}>Today</Text>
                </View>
              </View>

              {/* Bottom Confirm Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleConfirm}
                style={styles.confirmButton}>
                <Text style={styles.confirmButtonText}>
                  {formattedSelectedButtonText}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handleBar: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navArrowBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  monthNavTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  dayHeadersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dayHeaderCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: `${100 / 7}%`,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 23,
    marginVertical: 2,
  },
  dayCellSelected: {
    backgroundColor: '#E23744',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#E23744',
  },
  dayCellText: {
    fontSize: 14.5,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F172A',
  },
  dayCellTextSelected: {
    color: '#FFFFFF',
  },
  dayCellTextToday: {
    color: '#0F172A',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
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
    marginTop: 2,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginTop: 14,
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: '#64748B',
  },
  legendTodayRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#E23744',
  },
  confirmButton: {
    backgroundColor: '#E23744',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
});
