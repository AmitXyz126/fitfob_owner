/* eslint-disable @typescript-eslint/no-unused-vars */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Image,
  Linking,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { Rejection3DIllustration } from '@/components/Rejection3DIllustration';

const RejectRequestScreen = () => {
  const params = useLocalSearchParams<{ reason?: string }>();
  const rejectionReason = params?.reason || null;

  // Function to handle Email
  const handleEmail = () => {
    const email = 'support@fitfob.com';
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
      <View className="flex-row items-center justify-between px-4 py-2">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.replace('/auth/Login')}
          className="p-1">
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}>
        <View className="flex-1 justify-center px-6 pb-6 pt-2">
          
          {/* Brand New 3D Vector SVG Rejection Graphic */}
          <Rejection3DIllustration />

          {/* Rejection Message */}
          <Text className="mb-2 text-center font-sans text-[24px] font-bold leading-8 text-[#1C1C1C]">
            Application Rejected
          </Text>

          <Text className="mb-6 px-2 text-center font-sans text-[13px] font-normal leading-6 text-[#697281]">
            Unfortunately, your club owner submission could not be verified by the admin team.
          </Text>

          {/* Rejection Reason Card */}
          <View className="mb-6 w-full rounded-2xl border border-red-200 bg-red-50/80 p-4">
            <View className="flex-row items-center gap-2">
              <Ionicons name="alert-circle" size={20} color="#F6163C" />
              <Text className="font-bold text-sm text-[#F6163C]">Rejection Reason:</Text>
            </View>
            <Text className="mt-2 font-medium text-xs text-slate-700 leading-5">
              {rejectionReason || 'Your submitted details or documents did not meet verification guidelines.'}
            </Text>
          </View>

          {/* Contact Section */}
          <View className="w-full">
            <Text className="mb-3 font-sans text-[15px] font-bold text-[#1C1C1C]">
              Contact Support:
            </Text>

            {/* Email Field */}
            <TouchableOpacity
              onPress={handleEmail}
              activeOpacity={0.7}
              style={{
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
              className="mb-3.5 h-16 w-full flex-row items-center rounded-2xl border border-slate-100 bg-white px-4">
              <View className="mr-3 items-center justify-center rounded-xl bg-rose-50 p-2.5">
                <MaterialCommunityIcons name="email-outline" size={22} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-400">Email Admin</Text>
                <Text className="text-[14px] font-bold text-slate-800">support@fitfob.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>

            {/* Phone Field */}
            <TouchableOpacity
              onPress={handleCall}
              activeOpacity={0.7}
              style={{
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
              className="h-16 w-full flex-row items-center rounded-2xl border border-slate-100 bg-white px-4">
              <View className="mr-3 items-center justify-center rounded-xl bg-rose-50 p-2.5">
                <MaterialCommunityIcons name="phone-outline" size={22} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-semibold text-slate-400">Call Support</Text>
                <Text className="text-[14px] font-bold text-slate-800">+91 90000 00000</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons - Fixed at bottom */}
      <View className="gap-2.5 px-6 py-4">
        <TouchableOpacity
          onPress={() => router.replace('/onBoardingScreen/OnBoardingStep')}
          activeOpacity={0.8}
          style={{
            shadowColor: '#F6163C',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
          className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C]">
          <Text className="font-bold text-[16px] text-white">Re-apply / Edit Submission</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/auth/Login')}
          activeOpacity={0.8}
          className="h-12 w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
          <Text className="font-bold text-[14px] text-slate-600">Back to Login</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default RejectRequestScreen;
