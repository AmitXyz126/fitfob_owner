import React from 'react';
import { Text, View, TouchableOpacity, Image } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LineGradient from '@/components/lineGradient/LineGradient';
import { Button } from '@/components/Button';

const EarningDetail = () => {
  const router = useRouter();

  const params = useLocalSearchParams();

  return (
    <Container>
      {/* <View className="flex-1 bg-white"> */}
      {/* Custom Header */}
      <View className="flex-row items-center justify-between py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <Ionicons name="chevron-back" size={24} color="black" />
        </TouchableOpacity>
        <Text className="font-medium font-sans text-base leading-6 text-[#697281]">
          Earnings Detail
        </Text>
        <TouchableOpacity className="relative p-1">
          <Ionicons name="notifications" size={24} color="#F6163C" />
          <View className="absolute right-1 top-1 h-2 w-2 items-center justify-center rounded-full bg-white" />
        </TouchableOpacity>
      </View>

      {/* Detail Card */}
      <View className="mt-2 rounded-[24px] border border-[#E5E7EB] bg-white p-5   ">
        {/* User Profile Info */}
        <View className="mb-6 flex-row items-center">
          <Image
            source={{
              uri: (params.image as string) || 'https://randomuser.me/api/portraits/women/1.jpg',
            }}
            className="h-14 w-14 rounded-2xl"
          />
          <View className="ml-4">
            <Text className="font-bold text-xl text-slate-800">
              {params.name || 'Barbara Gordon'}
            </Text>
            <View className="mt-1 self-start rounded-full bg-red-50 px-2 py-0.5">
              <Text className="font-medium text-[10px] text-[#F6163C]">Premium Monthly pass</Text>
            </View>
          </View>
        </View>
        <LineGradient />

        {/* Date & Time Row */}
        <View className="flex-row items-center border-slate-50  py-2">
          <View className="rounded-lg bg-red-50 p-2">
            <Ionicons name="calendar" size={20} color="#F6163C" />
          </View>
          <Text className="ml-3 font-medium text-[15px] text-slate-700">
            {params.date || '22 Jan, 2026'} • 9:30 AM
          </Text>
        </View>

        <LineGradient />

        {/* Credited Amount Row */}
        <View className="flex-row items-center justify-between py-6">
          <Text className="text-[14px] font-normal leading-5 text-[#1C1C1C]">Net Credited</Text>
          <Text className="font-bold font-sans text-[14px] leading-5 text-[#1C1C1C]">
            {params.price || '₹699'}
          </Text>
        </View>

        <Button title={'Chat with Barbara'} />
      </View>
      {/* </View> */}
    </Container>
  );
};

export default EarningDetail;
