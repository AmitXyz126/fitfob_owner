/* eslint-disable no-unused-expressions */
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Platform, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import LineGradient from '../lineGradient/LineGradient';

const OnBoarding3 = () => {
  const [fitnessTypes, setFitnessTypes] = useState(['Gym']);
  const [amenities, setAmenities] = useState(['Parking', 'Wi-Fi']);

  // --- TIME STATES ---
  const [startTime, setStartTime] = useState(new Date().setHours(5, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(22, 0));
  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);

  // --- DAY SELECTION STATES ---
  const [weekdayRange, setWeekdayRange] = useState('Mon to Friday');
  const [weekendRange, setWeekendRange] = useState('Sat or Sunday');
  const [showDayModal, setShowDayModal] = useState<'weekday' | 'weekend' | null>(null);

  // Gym related all possible day ranges
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

  // Time format
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
    <View>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="pt-4"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-6 font-bold text-[24px] leading-8 text-[#1C1C1C]">
          Configure your club
        </Text>

        {/* --- TYPE OF FITNESS CLUB --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-normal font-sans text-sm text-[#697281]">
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

        {/* --- AMENITIES --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-normal font-sans text-sm text-[#697281]">
            Amenities
          </Text>
          {['Parking', 'Wi-Fi', 'Showers', 'AC', 'Trainers'].map((item) => (
            <CheckboxItem
              key={item}
              label={item}
              isSelected={amenities.includes(item)}
              onPress={() => toggleSelection(item, amenities, setAmenities)}
            />
          ))}
        </View>

        {/* --- TIMINGS SECTION --- */}
        <View className="mb-10">
          <Text className="mb-2 ml-1 font-normal font-sans text-sm text-[#697281]">
            Timings
          </Text>

          {/* Time Selector Row */}
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

          {/* Inline Time Picker */}
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
                style={{ height: 120 , borderRadius:50}}
                 textColor="#F6163C"
                 accentColor="#F6163C"
                 
                 
              />
            </View>
          )}

          {/* Weekday Selector */}
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-400">Weekday Schedule</Text>
          <TouchableOpacity
            onPress={() => setShowDayModal('weekday')}
            className="mb-4 h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5  ">
            <Text className="font-medium text-slate-900">{weekdayRange}</Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>

          {/* Weekend Selector */}
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-400">Weekend Schedule</Text>
          <TouchableOpacity
            onPress={() => setShowDayModal('weekend')}
            className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5 ">
            <Text className="font-medium text-slate-900">{weekendRange}</Text>
            <Ionicons name="chevron-down" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- DAY SELECTION MODAL --- */}
      <Modal visible={!!showDayModal} transparent animationType="fade">
        <TouchableOpacity
          className="flex-1 justify-end bg-black/40"
          activeOpacity={1}
          onPress={() => setShowDayModal(null)}>
          <View className="rounded-t-[32px] bg-white p-6 pb-12 shadow-2xl">
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-200" />
            <Text className="mb-6 text-center font-bold text-xl text-slate-900">
              Select {showDayModal === 'weekday' ? 'Weekday' : 'Weekend'}
            </Text>

            {(showDayModal === 'weekday' ? weekdayOptions : weekendOptions).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  showDayModal === 'weekday' ? setWeekdayRange(option) : setWeekendRange(option);
                  setShowDayModal(null);
                }}
                className="flex-row items-center justify-between border-b border-slate-50 py-5">
                <Text
                  className={`text-[16px] ${(showDayModal === 'weekday' ? weekdayRange : weekendRange) === option ? 'font-bold text-[#F6163C]' : 'text-slate-700'}`}>
                  {option}
                </Text>
                {(showDayModal === 'weekday' ? weekdayRange : weekendRange) === option && (
                  <Ionicons name="checkmark-circle" size={24} color="#F6163C" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// const styles = StyleSheet.create({
//   inputShadow: {
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.05,
//     shadowRadius: 8,
//     elevation: 2,
//   },
// });

export default OnBoarding3;
