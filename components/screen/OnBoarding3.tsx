/* eslint-disable no-unused-expressions */
import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import LineGradient from '../lineGradient/LineGradient';
import { useUserDetail } from '@/hooks/useUserDetail';

// Props interface for TypeScript safety
interface OnBoarding3Props {
  onNext?: () => void;
}

const OnBoarding3 = forwardRef((props: OnBoarding3Props, ref) => {
  const { submitStep4} = useUserDetail();

  // --- NEW STATE FOR CLUB CATEGORY ---
  const [clubCategory, setClubCategory] = useState('Luxury');
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const categoryOptions = ['Luxury', 'Premium', 'Standard'];

  const [fitnessTypes, setFitnessTypes] = useState(['Gym']);
  const [amenities, setAmenities] = useState(['Parking', 'Wi-Fi']);

  const [startTime, setStartTime] = useState(new Date().setHours(5, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(22, 0));
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  const [weekdayRange, setWeekdayRange] = useState('Monday to Friday');
  const [weekendRange, setWeekendRange] = useState('Saturday & Sunday');
  const [showDayModal, setShowDayModal] = useState<'weekday' | 'weekend' | null>(null);

  const weekdayOptions = [
    'Monday to Friday',
    'Monday to Saturday',
    'Monday to Thursday',
    'Everyday (Mon - Sun)',
  ];

  const weekendOptions = [
    'Saturday & Sunday',
    'Sunday Only',
    'Saturday Only',
    'Closed on Weekends',
  ];

  const formatTimeForApi = (timeValue: any) => {
    const date = new Date(timeValue);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}:00.000`;
  };

  const formatTimeParts = (timeValue: any) => {
    const date = new Date(timeValue);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return { time: `${strHours}:${strMinutes}`, ampm };
  };

  // --- FIXED: EXPOSE SAVE METHOD WITH SUCCESS CALLBACK ---
  useImperativeHandle(ref, () => ({
    handleSave: () => {
      const payload = {
        clubCategory: clubCategory, // Category added here
        services: fitnessTypes,
        facilities: amenities,
        openingTime: formatTimeForApi(startTime),
        closingTime: formatTimeForApi(endTime),
        weekday: weekdayRange,
        weekend: weekendRange,
      };

      // Mutate with onSuccess handler
      submitStep4.mutate(payload as any, {
        onSuccess: () => {
          props.onNext && props.onNext();
        },
        onError: (err) => {
          console.error('Step 3 Save Error:', err);
        },
      });
    },
  }));

  const onTimeChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowPicker(null);
    }
    if (selectedDate) {
      if (showPicker === 'start') setStartTime(selectedDate.getTime());
      if (showPicker === 'end') setEndTime(selectedDate.getTime());
    }
  };

  const toggleSelection = (item: string, state: any, setState: any) => {
    if (state.includes(item)) {
      setState(state.filter((i: string) => i !== item));
    } else {
      setState([...state, item]);
    }
  };

  const CheckboxItem = ({ label, isSelected, onPress }: any) => (
    <View>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        className="flex-row items-center py-4">
        <View
          className={`h-5 w-5 rounded border ${isSelected ? 'border-[#F6163C] bg-[#F6163C]' : 'border-slate-300 bg-white'} mr-3 items-center justify-center`}>
          {isSelected && <Ionicons name="checkmark" size={14} color="white" />}
        </View>
        <Text
          className={`text-[15px] ${isSelected ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
          {label}
        </Text>
      </TouchableOpacity>
      <LineGradient />
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="px-1 pt-4"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-6 font-bold text-[24px] leading-8 text-[#1C1C1C]">
          Configure your club
        </Text>

        {/* --- ADDED CLUB CATEGORY DROPDOWN --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal text-[#697281]">
            Club Category
          </Text>
          <TouchableOpacity
            onPress={() => setShowCategoryModal(true)}
            activeOpacity={0.7}
            className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5">
            <Text className="font-medium text-slate-900">{clubCategory}</Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal text-[#697281]">
            Type of Fitness club
          </Text>
          {['Gym', 'Yoga', 'Pilates', 'Dance', 'Other'].map((item) => (
            <CheckboxItem
              key={item}
              label={item}
              isSelected={fitnessTypes.includes(item)}
              onPress={() => toggleSelection(item, fitnessTypes, setFitnessTypes)}
            />
          ))}
        </View>

        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal text-[#697281]">Amenities</Text>
          {['Parking', 'Wi-Fi', 'Showers', 'AC', 'Trainers'].map((item) => (
            <CheckboxItem
              key={item}
              label={item}
              isSelected={amenities.includes(item)}
              onPress={() => toggleSelection(item, amenities, setAmenities)}
            />
          ))}
        </View>

        <View className="mb-10">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal text-[#697281]">Timings</Text>

          <View className="mb-6 h-16 w-full flex-row items-center justify-between rounded-2xl">
            <TouchableOpacity
              onPress={() => setShowPicker(showPicker === 'start' ? null : 'start')}
              className={`h-12 flex-1 flex-row items-center justify-between rounded-xl px-4 ${showPicker === 'start' ? 'border border-red-100 bg-red-50' : 'bg-slate-50'}`}>
              <Text className="font-bold text-[16px] text-slate-900">
                {formatTimeParts(startTime).time}
              </Text>
              <Text className="font-bold text-[11px] uppercase text-slate-400">
                {formatTimeParts(startTime).ampm}
              </Text>
            </TouchableOpacity>

            <Text className="mx-4 font-bold text-xs italic text-slate-300">To</Text>

            <TouchableOpacity
              onPress={() => setShowPicker(showPicker === 'end' ? null : 'end')}
              className={`h-12 flex-1 flex-row items-center justify-between rounded-xl px-4 ${showPicker === 'end' ? 'border border-red-100 bg-red-50' : 'bg-slate-50'}`}>
              <Text className="font-bold text-[16px] text-slate-900">
                {formatTimeParts(endTime).time}
              </Text>
              <Text className="font-bold text-[11px] uppercase text-slate-400">
                {formatTimeParts(endTime).ampm}
              </Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <View className="shadow-inner mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-2">
              <View className="flex-row items-center justify-between px-4 py-1">
                <Text className="font-bold text-[10px] uppercase text-slate-400">
                  Set {showPicker} Time
                </Text>
                {Platform.OS === 'ios' && (
                  <TouchableOpacity onPress={() => setShowPicker(null)}>
                    <Text className="font-bold text-[#F6163C]">Done</Text>
                  </TouchableOpacity>
                )}
              </View>
              <DateTimePicker
                value={new Date(showPicker === 'start' ? startTime : endTime)}
                mode="time"
                is24Hour={false}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onTimeChange}
                style={{ height: 120, borderRadius: 50 }}
                textColor="#F6163C"
                accentColor="#F6163C"
              />
            </View>
          )}

          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-400">Weekday Schedule</Text>
          <TouchableOpacity
            onPress={() => setShowDayModal('weekday')}
            className="mb-4 h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5">
            <Text className="font-medium text-slate-900">{weekdayRange}</Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>

          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-400">Weekend Schedule</Text>
          <TouchableOpacity
            onPress={() => setShowDayModal('weekend')}
            className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5">
            <Text className="font-medium text-slate-900">{weekendRange}</Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- REUSABLE MODAL FOR CATEGORY AND SCHEDULES --- */}
      <Modal visible={showCategoryModal || !!showDayModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPress={() => {
            setShowCategoryModal(false);
            setShowDayModal(null);
          }}>
          <View className="rounded-t-[32px] bg-white p-6 pb-12 shadow-2xl">
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-200" />
            <Text className="mb-6 text-center font-bold text-xl text-slate-900">
              {showCategoryModal
                ? 'Select Category'
                : `Select ${showDayModal === 'weekday' ? 'Weekday' : 'Weekend'}`}
            </Text>

            {(showCategoryModal
              ? categoryOptions
              : showDayModal === 'weekday'
                ? weekdayOptions
                : weekendOptions
            ).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  if (showCategoryModal) {
                    setClubCategory(option);
                    setShowCategoryModal(false);
                  } else {
                    showDayModal === 'weekday' ? setWeekdayRange(option) : setWeekendRange(option);
                    setShowDayModal(null);
                  }
                }}
                className="flex-row items-center justify-between border-b border-slate-50 py-5">
                <Text
                  className={`text-[16px] ${
                    (showCategoryModal
                      ? clubCategory
                      : showDayModal === 'weekday'
                        ? weekdayRange
                        : weekendRange) === option
                      ? 'font-bold text-[#F6163C]'
                      : 'text-slate-700'
                  }`}>
                  {option}
                </Text>
                {(showCategoryModal
                  ? clubCategory
                  : showDayModal === 'weekday'
                    ? weekdayRange
                    : weekendRange) === option && (
                  <Ionicons name="checkmark-circle" size={24} color="#F6163C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
});

export default OnBoarding3;
