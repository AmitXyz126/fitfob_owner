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
        contentContainerStyle={{ flexGrow: 1 }} 
        className="pt-4"
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[26px] font-bold text-slate-900 mb-8 mt-4">
          Fill your personal details
        </Text>

        {/* --- OWNER NAME --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryText">Owner&lsquo;s name</Text>
          <TextInput
            value={formData.name}
            onChangeText={(txt) => setFormData({ ...formData, name: txt })}
            placeholder="Enter Name" 
            placeholderTextColor="#cbd5e1"
            className="w-full h-14 px-5 bg-white border border-slate-100 rounded-2xl text-slate-900 font-medium"
            style={styles.inputShadow}
          />
        </View>

        {/* --- PHONE NUMBER --- */}
        <View className="mb-6">
          <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryText">Phone Number</Text>
          <View 
            className="flex-row w-full h-14 bg-white border border-slate-100 rounded-2xl overflow-hidden"
            style={styles.inputShadow}
          >
            <TouchableOpacity 
              onPress={() => setVisible(true)}
              className="flex-row items-center px-3 border-r border-slate-50 bg-slate-50/10"
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
                containerButtonStyle={{ marginLeft: 5 }}
              />
              <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryTexttext-slate-900 font-medium ml-1">+{callingCode}</Text>
              <Entypo name="chevron-small-down" size={18} color="#64748b" />
            </TouchableOpacity>
            
            <TextInput
              value={formData.phone}
              onChangeText={(txt) => setFormData({ ...formData, phone: txt })}
              placeholder="Enter mobile number" 
              placeholderTextColor="#cbd5e1"
              keyboardType="phone-pad"
              className="flex-1 px-4 text-slate-900 font-medium"
            />
          </View>
        </View>

        {/* --- EMAIL ADDRESS --- */}
        <View className="mb-10">
          <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryText">Email Address</Text>
          <TextInput
            value={formData.email}
            onChangeText={(txt) => setFormData({ ...formData, email: txt })}
            placeholder="Enter Email Address"  
            placeholderTextColor="#cbd5e1"
            keyboardType="email-address"
            autoCapitalize="none"
            className="w-full h-14 px-5 bg-white border border-slate-100 rounded-2xl text-slate-900 font-medium"
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
  },
  buttonShadow: {
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  }
});

export default OnBoarding2;