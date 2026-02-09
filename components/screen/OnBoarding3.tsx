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
        className="flex-row items-center py-3"
      >
        <View className={`w-6 h-6 rounded border ${isSelected ? 'bg-[#F6163C] border-[#F6163C]' : 'bg-white border-slate-300'} items-center justify-center mr-3`}>
          {isSelected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
        <Text className={`text-[15px] ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500'}`}>
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
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[26px] font-bold text-slate-900 mb-6">
          Configure your club
        </Text>

        {/* --- TYPE OF FITNESS CLUB --- */}
        <View className="mb-6">
          <Text className="text-slate-400 text-[13px] mb-3 font-medium uppercase tracking-wider">
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
          <Text className="text-slate-400 text-[13px] mb-3 font-medium uppercase tracking-wider">
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
          <Text className="text-slate-400 text-[13px] mb-4 font-medium uppercase tracking-wider">
            Timings
          </Text>
          
          <Text className="text-slate-400 text-[13px] mb-2">Weekday</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-white border border-slate-100 rounded-2xl h-14 px-5 mb-4"
            style={styles.inputShadow}
          >
            <Text className="text-slate-900 font-medium">Mon to Friday</Text>
            <MaterialCommunityIcons name="clock-outline" size={20} color="#64748b" />
          </TouchableOpacity>

          <Text className="text-slate-400 text-[13px] mb-2">Weekend</Text>
          <TouchableOpacity 
            className="flex-row items-center justify-between bg-white border border-slate-100 rounded-2xl h-14 px-5"
            style={styles.inputShadow}
          >
            <Text className="text-slate-900 font-medium">Sat or Sunday</Text>
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
  }
});

export default OnBoarding3;