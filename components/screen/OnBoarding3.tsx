import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import LineGradient from '../lineGradient/LineGradient'; // Path sahi hai na bhai?

const OnBoarding3 = () => {
  const [fitnessTypes, setFitnessTypes] = useState(['Gym']);
  const [amenities, setAmenities] = useState(['Parking', 'Wi-Fi']);

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
        className="flex-row items-center py-3">
        <View
          className={`h-6 w-6 rounded border ${isSelected ? 'border-[#F6163C] bg-[#F6163C]' : 'border-slate-300 bg-white'} mr-3 items-center justify-center`}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text
          className={`text-[15px] ${isSelected ? 'font-medium text-slate-900' : 'text-slate-500'}`}>
          {label}
        </Text>
      </TouchableOpacity>
      {/* Har item ke niche fading line */}
      <LineGradient />
    </View>
  );

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        className="pt-4"
        showsVerticalScrollIndicator={false}>
        <Text className="mb-6 font-bold text-[24px] leading-8 text-[#1C1C1C]">
          Configure your club
        </Text>

        {/* --- TYPE OF FITNESS CLUB --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryText">
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
          <Text className="mb-2 ml-1 font-sans text-sm font-normal leading-sm text-secondaryText">
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

        {/* --- TIMINGS --- */}
        <View className="mb-10">
          <Text className="mb-2 ml-1 font-sans text-sm font-normal leading-sm text-secondaryText">
            Timings
          </Text>

          <Text className="mb-2 text-[13px] text-slate-400">Weekday</Text>
          <TouchableOpacity
            className="mb-4 h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5"
            style={styles.inputShadow}>
            <Text className="font-medium text-slate-900">Mon to Friday</Text>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748b" />
          </TouchableOpacity>

          <Text className="mb-2 text-[13px] text-slate-400">Weekend</Text>
          <TouchableOpacity
            className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white px-5"
            style={styles.inputShadow}>
            <Text className="font-medium text-slate-900">Sat or Sunday</Text>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  inputShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
});

export default OnBoarding3;
