import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface CustomDatePickerModalProps {
  visible: boolean;
  initialDate?: string; // YYYY-MM-DD
  title?: string;
  minDate?: string; // YYYY-MM-DD
  useModal?: boolean;
  onConfirm: (dateStr: string) => void;
  onCancel: () => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const CustomDatePickerModal: React.FC<CustomDatePickerModalProps> = ({
  visible,
  initialDate,
  title = 'Select Date',
  minDate,
  useModal = true,
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();

  const parseDate = (dStr?: string): Date => {
    if (!dStr) return new Date();
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      return new Date(y, m, d);
    }
    const d = new Date(dStr);
    return isNaN(d.getTime()) ? new Date() : d;
  };

  const formatDateToString = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || formatDateToString(new Date())
  );

  useEffect(() => {
    if (visible) {
      const parsed = parseDate(initialDate);
      setCurrentMonth(parsed.getMonth());
      setCurrentYear(parsed.getFullYear());
      setSelectedDate(initialDate || formatDateToString(parsed));
    }
  }, [visible, initialDate]);

  const daysInMonth = useMemo(() => {
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();

    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(i);
    }
    return days;
  }, [currentMonth, currentYear]);

  const effectiveMinDate = minDate || formatDateToString(new Date());

  const isCurrentOrPastMonth = useMemo(() => {
    const now = new Date();
    return currentYear < now.getFullYear() || (currentYear === now.getFullYear() && currentMonth <= now.getMonth());
  }, [currentYear, currentMonth]);

  const handlePrevMonth = () => {
    if (isCurrentOrPastMonth) return;
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((prev) => prev - 1);
    } else {
      setCurrentMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((prev) => prev + 1);
    } else {
      setCurrentMonth((prev) => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const d = new Date(currentYear, currentMonth, day);
    const dStr = formatDateToString(d);
    if (dStr < effectiveMinDate) return;
    setSelectedDate(dStr);
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === currentMonth &&
      today.getFullYear() === currentYear
    );
  };

  const isSelected = (day: number) => {
    const dStr = formatDateToString(new Date(currentYear, currentMonth, day));
    return selectedDate === dStr;
  };

  if (!visible) return null;

  const modalBody = (
    <View
      style={
        useModal
          ? {
              flex: 1,
              backgroundColor: 'rgba(0, 0, 0, 0.55)',
              justifyContent: 'flex-end',
            }
          : [
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.65)',
                justifyContent: 'flex-end',
                zIndex: 9999,
                elevation: 9999,
              },
            ]
      }>
      <TouchableOpacity activeOpacity={1} onPress={onCancel} style={{ flex: 1 }} />

      {/* Modal Container */}
      <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + (Platform.OS === 'ios' ? 16 : 8),
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 16,
            elevation: 20,
          }}>
          {/* Top Grabber */}
          <View
            style={{
              width: 44,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E2E8F0',
              alignSelf: 'center',
              marginBottom: 16,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FFF1F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                <Ionicons name="calendar" size={18} color="#F6163C" />
              </View>
              <Text style={{ fontSize: 17, fontWeight: '700', color: '#0F172A' }}>
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#F8FAFC',
              borderRadius: 16,
              paddingVertical: 10,
              paddingHorizontal: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}>
            <TouchableOpacity
              onPress={handlePrevMonth}
              disabled={isCurrentOrPastMonth}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
                opacity: isCurrentOrPastMonth ? 0.35 : 1,
              }}>
              <Ionicons name="chevron-back" size={18} color="#1E293B" />
            </TouchableOpacity>

            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Text>

            <TouchableOpacity
              onPress={handleNextMonth}
              style={{
                padding: 6,
                borderRadius: 8,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#E2E8F0',
              }}>
              <Ionicons name="chevron-forward" size={18} color="#1E293B" />
            </TouchableOpacity>
          </View>

          {/* Weekday Labels */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-around',
              marginBottom: 8,
            }}>
            {WEEK_DAYS.map((wd, i) => (
              <View key={i} style={{ width: 36, alignItems: 'center' }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: '600',
                    color: i === 0 ? '#F6163C' : '#94A3B8',
                  }}>
                  {wd}
                </Text>
              </View>
            ))}
          </View>

          {/* Day Grid */}
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
            }}>
            {daysInMonth.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={{ width: 36, height: 38, marginVertical: 3 }} />;
              }

              const d = new Date(currentYear, currentMonth, day);
              const cellDateStr = formatDateToString(d);
              const isPast = cellDateStr < effectiveMinDate;
              const selected = isSelected(day);
              const today = isToday(day);

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  disabled={isPast}
                  activeOpacity={isPast ? 1 : 0.7}
                  onPress={() => !isPast && handleSelectDay(day)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginVertical: 3,
                    backgroundColor: selected ? '#F6163C' : today ? '#FFF1F2' : 'transparent',
                    borderWidth: today && !selected ? 1.5 : 0,
                    borderColor: '#F6163C',
                    opacity: isPast ? 0.3 : 1,
                  }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: selected || today ? '700' : '500',
                      color: selected
                        ? '#FFFFFF'
                        : today
                        ? '#F6163C'
                        : isPast
                        ? '#94A3B8'
                        : '#1E293B',
                    }}>
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Selected Date Preview */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFF5F5',
              borderRadius: 12,
              paddingHorizontal: 16,
              paddingVertical: 10,
              marginTop: 16,
              borderWidth: 1,
              borderColor: '#FECDD3',
            }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#64748B' }}>
              Selected Date:
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#F6163C' }}>
              {selectedDate}
            </Text>
          </View>

          {/* Action Buttons */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              marginTop: 20,
            }}>
            <TouchableOpacity
              onPress={onCancel}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.8}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: '#F6163C',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#F6163C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#FFFFFF' }}>
                Confirm Date
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );

  if (useModal) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={onCancel}>
        {modalBody}
      </Modal>
    );
  }

  return modalBody;
};
