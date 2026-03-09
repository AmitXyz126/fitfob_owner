/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const RejectRequestScreen = () => {
  // Function to handle Email
  const handleEmail = () => {
    const email = 'Amit@gmail.com';
    Linking.openURL(`mailto:${email}`).catch(() => {
      Alert.alert('Error', 'Could not open email app');
    });
  };

  // Function to handle Phone Call
  const handleCall = () => {
    const phoneNumber = '+919000000000';
    Linking.openURL(`tel:${phoneNumber}`).catch(() => {
      Alert.alert('Error', 'Could not open dialer');
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="px-4 py-2">
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#CBD5E1" />
        </TouchableOpacity>
      </View>

      {/* --- CONTENT SECTION SHIFTED UP --- */}
      <View className="flex-1 px-6 pt-10">
        <View className="mb-8 items-center justify-center">
          <Image
            source={require('../assets/images/cancel.png')}
            style={{ width: 120, height: 120 }}
            resizeMode="contain"
          />
        </View>

        <Text className="mb-4 text-center font-bold font-sans text-[24px] leading-8 text-[#1C1C1C] ">
          Your Request Was Not Approved
        </Text>

        <Text className="mb-10 px-2 text-center text-[12px] font-normal leading-4 text-[#697281]">
          Unfortunately, your club request was not approved by the admin. If you&rsquo;d like to
          apply again, please contact the admin using the email or phone number below.
        </Text>

        <View className="w-full">
          <Text className="mb-4 font-sans font-medium text-[18px] text-[#1C1C1C]">Contact:</Text>

          {/* Email Clickable Field */}
          <TouchableOpacity
            onPress={handleEmail}
            activeOpacity={0.6}
            className="mb-4 h-16 w-full flex-row items-center rounded-2xl border border-[#EBF1F3] bg-white px-4">
            <View className="mr-3 rounded-xl  p-2.5">
              <MaterialCommunityIcons name="email" size={24} color="#64748B" />
            </View>
            <Text className=" font-medium text-[15px] text-[#697281]">Amit@gmail.com</Text>
          </TouchableOpacity>

          {/* Phone Clickable Field */}
          <TouchableOpacity
            onPress={handleCall}
            activeOpacity={0.6}
            className="h-16 w-full flex-row items-center rounded-2xl border border-[#EBF1F3] bg-white px-4">
            <View className="mr-1 rounded-xl  p-2.5">
              <MaterialCommunityIcons name="phone" size={24} color="#64748B" />
            </View>
            <Text className=" font-medium text-[15px] text-[#697281]">+91 90000 00000</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Close Button - Fixed at bottom */}
      <View className="px-6 ">
        <TouchableOpacity
        onPress={()=> router.replace('/auth/Login')}
          activeOpacity={0.8}
          className="h-16 w-full items-center justify-center rounded-2xl bg-[#F2F2F2]">
          <Text className="font-bold text-[16px] text-[#64748B]">Close</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RejectRequestScreen;
