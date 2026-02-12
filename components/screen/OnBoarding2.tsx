/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet
} from 'react-native';
import { Entypo } from '@expo/vector-icons';
import CountryPicker, { CountryCode, Country } from 'react-native-country-picker-modal';
 import { LinearGradient } from 'expo-linear-gradient';

const OnBoarding2 = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [countryCode, setCountryCode] = useState<CountryCode>('IN');
  const [callingCode, setCallingCode] = useState('91');
  const [visible, setVisible] = useState<boolean>(false);

  const onSelect = (country: Country) => {
    setCountryCode(country.cca2);
    setCallingCode(country.callingCode[0]);
    setVisible(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: 'white' }}
    >
      <ScrollView 
        contentContainerStyle={{ flexGrow: 1,  paddingTop: 20 }} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[26px] font-bold text-slate-900 mb-8">
          Fill your personal details
        </Text>

        {/* --- OWNER NAME --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 text-sm text-slate-500 font-medium">Owner's name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(txt) => setFormData({ ...formData, name: txt })}
            placeholder="Enter Name" 
            placeholderTextColor="#cbd5e1"
            className="w-full h-14 px-5 bg-white border border-[#CCCECE] rounded-2xl text-slate-900 font-medium"
            style={styles.inputShadow}
          />
        </View>

        {/* --- PHONE NUMBER --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 text-sm text-slate-500 font-medium">Phone Number</Text>
          <View 
            className="flex-row items-center w-full h-14 bg-white border border-[#CCCECE] rounded-2xl overflow-hidden"
            style={styles.inputShadow}
          >
            {/* Country Picker Section */}
            <TouchableOpacity 
              onPress={() => setVisible(true)}
              activeOpacity={0.7}
              className="flex-row items-center pl-4 pr-1"
            >
              <CountryPicker
                {...{
                  countryCode,
                  withFlag: true,
                  onSelect,
                  visible,
                }}
                onClose={() => setVisible(false)}
                withFilter
                withCallingCode
                containerButtonStyle={{ marginRight: 2 }}
              />
              <Entypo name="chevron-small-down" size={20} color="#64748b" />
            </TouchableOpacity>

            {/* --- THE FADED LINE (LINEAR GRADIENT) --- */}
            <LinearGradient
               colors={['rgba(204, 206, 206, 0)', 'rgba(204, 206, 206, 1)', 'rgba(204, 206, 206, 0)']}
              style={{
                width: 1.4,
                height: '60%', 
                marginHorizontal: 5
              }}
            />
            
            <View className="flex-row items-center flex-1">
               <Text className="text-slate-900 font-medium ml-2">+{callingCode}</Text>
               <TextInput
                 value={formData.phone}
                 onChangeText={(txt) => setFormData({ ...formData, phone: txt })}
                 placeholder="9400000000" 
                 placeholderTextColor="#cbd5e1"
                 keyboardType="phone-pad"
                 className="flex-1 h-full px-3 text-slate-900 font-medium"
               />
            </View>
          </View>
        </View>

        {/* --- EMAIL ADDRESS --- */}
        <View className="mb-10">
          <Text className="mb-2 ml-1 text-sm text-slate-500 font-medium">Email Address</Text>
          <TextInput
            value={formData.email}
            onChangeText={(txt) => setFormData({ ...formData, email: txt })}
            placeholder="Enter Email Address"  
            placeholderTextColor="#cbd5e1"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full h-14 px-5 bg-white border border-[#CCCECE] rounded-2xl text-slate-900 font-medium"
            style={styles.inputShadow}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  inputShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
  }
});

export default OnBoarding2;