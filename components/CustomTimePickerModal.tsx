import React, { useState, useEffect } from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CustomTimePickerModalProps {
  visible: boolean;
  initialDate?: Date;
  title?: string;
  onConfirm: (selectedDate: Date) => void;
  onCancel: () => void;
}

const HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export const CustomTimePickerModal: React.FC<CustomTimePickerModalProps> = ({
  visible,
  initialDate,
  title = 'Select Time',
  onConfirm,
  onCancel,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedHour, setSelectedHour] = useState(6);
  const [selectedMinute, setSelectedMinute] = useState('00');
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [activeTab, setActiveTab] = useState<'hour' | 'minute'>('hour');

  useEffect(() => {
    if (visible) {
      const date = initialDate instanceof Date && !isNaN(initialDate.getTime()) ? initialDate : new Date();
      let hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;

      // Find nearest 5-minute step or pad
      const nearestMin = Math.round(minutes / 5) * 5;
      const normalizedMin = nearestMin >= 60 ? 55 : nearestMin;
      const strMin = String(normalizedMin).padStart(2, '0');

      setSelectedHour(hours);
      setSelectedMinute(MINUTES.includes(strMin) ? strMin : '00');
      setSelectedPeriod(period);
      setActiveTab('hour');
    }
  }, [visible, initialDate]);

  const handleHourSelect = (hour: number) => {
    setSelectedHour(hour);
    setActiveTab('minute'); // Smoothly guide to minute selection
  };

  const handleConfirm = () => {
    let finalHour = selectedHour % 12;
    if (selectedPeriod === 'PM') {
      finalHour += 12;
    }
    const finalDate = new Date();
    finalDate.setHours(finalHour, parseInt(selectedMinute, 10) || 0, 0, 0);
    onConfirm(finalDate);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent={true}
      onRequestClose={onCancel}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          justifyContent: 'flex-end',
        }}>
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
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FFF1F2',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                <Ionicons name="time" size={18} color="#F6163C" />
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

          {/* Large Digital Clock Display in FitFob Brand Colors */}
          <View
            style={{
              backgroundColor: '#FFF5F5',
              borderRadius: 24,
              borderWidth: 1.5,
              borderColor: '#FECDD3',
              paddingVertical: 16,
              paddingHorizontal: 20,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}>
            {/* Hour & Minute Digits */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {/* Hour Box */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('hour')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: activeTab === 'hour' ? '#F6163C' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: activeTab === 'hour' ? '#F6163C' : '#E2E8F0',
                }}>
                <Text
                  style={{
                    fontSize: 32,
                    fontWeight: '800',
                    color: activeTab === 'hour' ? '#FFFFFF' : '#0F172A',
                  }}>
                  {String(selectedHour).padStart(2, '0')}
                </Text>
              </TouchableOpacity>

              <Text
                style={{
                  fontSize: 32,
                  fontWeight: '800',
                  color: '#F6163C',
                  marginHorizontal: 8,
                }}>
                :
              </Text>

              {/* Minute Box */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setActiveTab('minute')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 16,
                  backgroundColor: activeTab === 'minute' ? '#F6163C' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: activeTab === 'minute' ? '#F6163C' : '#E2E8F0',
                }}>
                <Text
                  style={{
                    fontSize: 32,
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
                borderRadius: 14,
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#FECDD3',
                overflow: 'hidden',
              }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPeriod('AM')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: selectedPeriod === 'AM' ? '#F6163C' : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: '800',
                    color: selectedPeriod === 'AM' ? '#FFFFFF' : '#64748B',
                  }}>
                  AM
                </Text>
              </TouchableOpacity>

              <View style={{ height: 1, backgroundColor: '#FECDD3' }} />

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setSelectedPeriod('PM')}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: selectedPeriod === 'PM' ? '#F6163C' : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 13,
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
              marginBottom: 12,
              paddingHorizontal: 4,
            }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748B' }}>
              {activeTab === 'hour' ? 'SELECT HOUR (1 - 12)' : 'SELECT MINUTES (5-Min Steps)'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                onPress={() => setActiveTab('hour')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: activeTab === 'hour' ? '#FEE2E2' : 'transparent',
                  marginRight: 6,
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: activeTab === 'hour' ? '#F6163C' : '#94A3B8',
                  }}>
                  Hour
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setActiveTab('minute')}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                  borderRadius: 10,
                  backgroundColor: activeTab === 'minute' ? '#FEE2E2' : 'transparent',
                }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: activeTab === 'minute' ? '#F6163C' : '#94A3B8',
                  }}>
                  Minute
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Selection Grid */}
          <View style={{ marginBottom: 24 }}>
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
                  return (
                    <TouchableOpacity
                      key={hour}
                      activeOpacity={0.7}
                      onPress={() => handleHourSelect(hour)}
                      style={{
                        width: '23%',
                        aspectRatio: 1.4,
                        marginBottom: 10,
                        borderRadius: 16,
                        backgroundColor: isSelected ? '#F6163C' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: isSelected ? '#F6163C' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: isSelected ? '#F6163C' : 'transparent',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: isSelected ? 0.3 : 0,
                        shadowRadius: 5,
                        elevation: isSelected ? 4 : 0,
                      }}>
                      <Text
                        style={{
                          fontSize: 17,
                          fontWeight: isSelected ? '800' : '600',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
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
                  return (
                    <TouchableOpacity
                      key={min}
                      activeOpacity={0.7}
                      onPress={() => setSelectedMinute(min)}
                      style={{
                        width: '23%',
                        aspectRatio: 1.4,
                        marginBottom: 10,
                        borderRadius: 16,
                        backgroundColor: isSelected ? '#F6163C' : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: isSelected ? '#F6163C' : '#E2E8F0',
                        alignItems: 'center',
                        justifyContent: 'center',
                        shadowColor: isSelected ? '#F6163C' : 'transparent',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: isSelected ? 0.3 : 0,
                        shadowRadius: 5,
                        elevation: isSelected ? 4 : 0,
                      }}>
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: isSelected ? '800' : '600',
                          color: isSelected ? '#FFFFFF' : '#1E293B',
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
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: '#F1F5F9',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 10,
              }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748B' }}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleConfirm}
              style={{
                flex: 2,
                paddingVertical: 14,
                borderRadius: 16,
                backgroundColor: '#F6163C',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#F6163C',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 4,
              }}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFFFFF' }}>
                Confirm Time
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default CustomTimePickerModal;
