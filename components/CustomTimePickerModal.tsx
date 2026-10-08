import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface CustomTimePickerModalProps {
  visible: boolean;
  initialDate?: Date;
  minDate?: Date;
  title?: string;
  useModal?: boolean;
  onConfirm: (selectedDate: Date) => void;
  onCancel: () => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const CustomTimePickerModal: React.FC<CustomTimePickerModalProps> = ({
  visible,
  initialDate,
  minDate,
  title = 'Select Time',
  useModal = true,
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedHour, setSelectedHour] = useState(6);
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');

  const minTotalMinutes = React.useMemo(() => {
    if (!minDate || !(minDate instanceof Date) || isNaN(minDate.getTime())) {
      return null;
    }
    return minDate.getHours() * 60 + minDate.getMinutes();
  }, [minDate]);

  // If minDate is past 11:55 AM, all AM times have passed
  const isAmDisabled = minTotalMinutes !== null && minTotalMinutes > 11 * 60 + 55;

  const isHourDisabled = (hour: number, period: 'AM' | 'PM' = selectedPeriod) => {
    if (minTotalMinutes === null) return false;
    const h24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    const maxMinInHour = h24 * 60 + 55;
    return maxMinInHour < minTotalMinutes;
  };

  const isMinuteDisabled = (minStr: string, hour: number = selectedHour, period: 'AM' | 'PM' = selectedPeriod) => {
    if (minTotalMinutes === null) return false;
    const h24 = (hour % 12) + (period === 'PM' ? 12 : 0);
    const totalMin = h24 * 60 + (parseInt(minStr, 10) || 0);
    return totalMin < minTotalMinutes;
  };

  useEffect(() => {
    if (visible) {
      let date = initialDate instanceof Date && !isNaN(initialDate.getTime()) ? new Date(initialDate) : new Date();
      if (minDate instanceof Date && !isNaN(minDate.getTime()) && date < minDate) {
        date = new Date(minDate);
      }
      let hours = date.getHours();
      const minutes = date.getMinutes();
      let period: 'AM' | 'PM' = hours >= 12 ? 'PM' : 'AM';
      let hour12 = hours % 12 || 12;

      // Find nearest 5-minute step
      let nearestMin = Math.ceil(minutes / 5) * 5;
      if (nearestMin >= 60) {
        hours += 1;
        period = hours >= 12 ? 'PM' : 'AM';
        hour12 = hours % 12 || 12;
        nearestMin = 0;
      }
      const strMin = String(nearestMin).padStart(2, '0');
      const validMin = MINUTES.includes(strMin) ? strMin : '00';

      // Validate against minDate
      if (minTotalMinutes !== null) {
        const candidateTotal = ((hour12 % 12) + (period === 'PM' ? 12 : 0)) * 60 + parseInt(validMin, 10);
        if (candidateTotal < minTotalMinutes) {
          // Advance to first valid minute or hour
          const minH = Math.floor(minTotalMinutes / 60);
          const minM = minTotalMinutes % 60;
          period = minH >= 12 ? 'PM' : 'AM';
          hour12 = minH % 12 || 12;
          const roundedM = Math.ceil(minM / 5) * 5;
          const finalM = roundedM >= 60 ? '55' : String(roundedM).padStart(2, '0');
          setSelectedHour(hour12);
          setSelectedMinute(MINUTES.includes(finalM) ? finalM : '00');
          setSelectedPeriod(period);
          setActiveTab('hour');
          return;
        }
      }

      setSelectedHour(hour12);
      setSelectedMinute(validMin);
      setSelectedPeriod(period);
      setActiveTab('hour');
    }
  }, [visible, initialDate, minDate, minTotalMinutes]);

  const handlePeriodChange = (newPeriod: 'AM' | 'PM') => {
    if (newPeriod === 'AM' && isAmDisabled) return;
    setSelectedPeriod(newPeriod);

    // If currently selected hour is disabled under the new period, pick first available hour
    if (isHourDisabled(selectedHour, newPeriod)) {
      const firstAvailableHour = HOURS.find((h) => !isHourDisabled(h, newPeriod));
      if (firstAvailableHour !== undefined) {
        setSelectedHour(firstAvailableHour);
        // Also ensure minute is valid
        const firstAvailableMinute = MINUTES.find((m) => !isMinuteDisabled(m, firstAvailableHour, newPeriod));
        if (firstAvailableMinute !== undefined) {
          setSelectedMinute(firstAvailableMinute);
        }
      }
    }
  };

  const handleHourSelect = (hour: number) => {
    if (isHourDisabled(hour)) return;
    setSelectedHour(hour);

    // If current minute is disabled in this hour, auto-select first available minute
    if (isMinuteDisabled(selectedMinute, hour)) {
      const firstAvailableMin = MINUTES.find((m) => !isMinuteDisabled(m, hour));
      if (firstAvailableMin !== undefined) {
        setSelectedMinute(firstAvailableMin);
      }
    }

    setActiveTab('minute'); // Smoothly guide to minute selection
  };

  const isCurrentSelectionPast = () => {
    if (minTotalMinutes === null) return false;
    const h24 = (selectedHour % 12) + (selectedPeriod === 'PM' ? 12 : 0);
    const totalMin = h24 * 60 + (parseInt(selectedMinute, 10) || 0);
    return totalMin < minTotalMinutes;
  };

  const handleConfirm = () => {
    if (isCurrentSelectionPast()) return;

    let finalHour = selectedHour % 12;
    if (selectedPeriod === 'PM') {
      finalHour += 12;
    }
    const finalDate = new Date();
    finalDate.setHours(finalHour, parseInt(selectedMinute, 10) || 0, 0, 0);
    onConfirm(finalDate);
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
      <TouchableOpacity
        activeOpacity={1}
        onPress={onCancel}
        style={{ flex: 1 }}
      />

        {/* Modal Container */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 0,
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
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: '#FFF1F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 8,
                }}>
                <Ionicons name="time" size={16} color="#F6163C" />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>
                {title}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onCancel}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>


          {/* Compact Digital Clock Display in FitFob Brand Colors */}
          <View
            style={{
              backgroundColor: '#FFF5F5',
              borderRadius: 18,
              borderWidth: 1,
              borderColor: '#FECDD3',
              paddingVertical: 10,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}>
            {/* Hour & Minute Digits */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Hour Box */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('hour')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: activeTab === 'hour' ? '#F6163C' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: activeTab === 'hour' ? '#F6163C' : '#E2E8F0',
                }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: activeTab === 'hour' ? '#FFFFFF' : '#0F172A',
                  }}>
                  {String(selectedHour).padStart(2, '0')}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: '800',
                  color: '#F6163C',
                  marginHorizontal: 6,
                }}>
                :
              </Text>

              {/* Minute Box */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('minute')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  backgroundColor: activeTab === 'minute' ? '#F6163C' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: activeTab === 'minute' ? '#F6163C' : '#E2E8F0',
                }}>
                <Text
                  style={{
                    fontSize: 22,
                    fontWeight: '800',
                    color: activeTab === 'minute' ? '#FFFFFF' : '#0F172A',
                  }}>
                  {selectedMinute}
                </Text>
              </TouchableOpacity>
            </View>

            {/* AM / PM Segmented Control */}
            <View
              style={{
                flexDirection: 'column',
                borderRadius: 10,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#FECDD3',
                overflow: 'hidden',
              }}>
              <TouchableOpacity
                activeOpacity={0.8}
                disabled={isAmDisabled}
                onPress={() => handlePeriodChange('AM')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  backgroundColor: selectedPeriod === 'AM' ? '#F6163C' : 'transparent',
                  opacity: isAmDisabled ? 0.35 : 1,
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: selectedPeriod === 'AM' ? '#FFFFFF' : isAmDisabled ? '#94A3B8' : '#64748B',
                  }}>
                  AM
                </Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#FECDD3' }} />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handlePeriodChange('PM')}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 5,
                  backgroundColor: selectedPeriod === 'PM' ? '#F6163C' : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '800',
                    color: selectedPeriod === 'PM' ? '#FFFFFF' : '#64748B',
                  }}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Indicator Label */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 10,
              paddingHorizontal: 2,
            }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.3 }}>
              {activeTab === 'hour' ? 'SELECT HOUR (1 - 12)' : 'SELECT MINUTES (5-Min Steps)'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setActiveTab('hour')}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'hour' ? '#FEE2E2' : 'transparent',
                  marginRight: 4,
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: activeTab === 'hour' ? '#F6163C' : '#94A3B8',
                  }}>
                  Hour
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('minute')}
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 2.5,
                  borderRadius: 8,
                  backgroundColor: activeTab === 'minute' ? '#FEE2E2' : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: activeTab === 'minute' ? '#F6163C' : '#94A3B8',
                  }}>
                  Minute
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selection Grid */}
          <View style={{ marginBottom: 18 }}>
            {activeTab === 'hour' ? (
              /* Hours Grid (4 columns x 3 rows) */
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}>
                {HOURS.map((hour) => {
                  const isSelected = selectedHour === hour;
                  const disabled = isHourDisabled(hour);
                  return (
                    <TouchableOpacity
                      key={hour}
                      disabled={disabled}
                      activeOpacity={disabled ? 1 : 0.7}
                      onPress={() => handleHourSelect(hour)}
                      style={{
                        width: '23%',
                        aspectRatio: 1.5,
                        marginBottom: 8,
                        borderRadius: 12,
                        backgroundColor: disabled ? '#F1F5F9' : isSelected ? '#F6163C' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: disabled ? '#E2E8F0' : isSelected ? '#F6163C' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: disabled ? 0.35 : 1,
                        shadowColor: isSelected && !disabled ? '#F6163C' : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected && !disabled ? 0.25 : 0,
                        shadowRadius: 4,
                        elevation: isSelected && !disabled ? 3 : 0,
                      }}>
                      <Text
                        style={{
                          fontSize: 14,
                          fontWeight: isSelected && !disabled ? '800' : '600',
                          color: disabled ? '#94A3B8' : isSelected ? '#FFFFFF' : '#1E293B',
                        }}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              /* Minutes Grid (4 columns x 3 rows) */
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                }}>
                {MINUTES.map((min) => {
                  const isSelected = selectedMinute === min;
                  const disabled = isMinuteDisabled(min);
                  return (
                    <TouchableOpacity
                      key={min}
                      disabled={disabled}
                      activeOpacity={disabled ? 1 : 0.7}
                      onPress={() => setSelectedMinute(min)}
                      style={{
                        width: '23%',
                        aspectRatio: 1.5,
                        marginBottom: 8,
                        borderRadius: 12,
                        backgroundColor: disabled ? '#F1F5F9' : isSelected ? '#F6163C' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: disabled ? '#E2E8F0' : isSelected ? '#F6163C' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: disabled ? 0.35 : 1,
                        shadowColor: isSelected && !disabled ? '#F6163C' : 'transparent',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isSelected && !disabled ? 0.25 : 0,
                        shadowRadius: 4,
                        elevation: isSelected && !disabled ? 3 : 0,
                      }}>
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: isSelected && !disabled ? '800' : '600',
                          color: disabled ? '#94A3B8' : isSelected ? '#FFFFFF' : '#1E293B',
                        }}>
                        :{min}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={onCancel}
              style={{
                flex: 1,
                paddingVertical: 11,
                borderRadius: 14,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={isCurrentSelectionPast() ? 1 : 0.8}
              disabled={isCurrentSelectionPast()}
              onPress={handleConfirm}
              style={{
                flex: 2,
                paddingVertical: 11,
                borderRadius: 14,
                backgroundColor: isCurrentSelectionPast() ? '#FDA4AF' : '#F6163C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isCurrentSelectionPast() ? 'transparent' : '#F6163C',
                shadowOffset: { width: 0, height: 3 },
                shadowOpacity: isCurrentSelectionPast() ? 0 : 0.25,
                shadowRadius: 6,
                elevation: isCurrentSelectionPast() ? 0 : 3,
              }}>
              <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#FFFFFF' }}>
                Confirm Time
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

export default CustomTimePickerModal;
