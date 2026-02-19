import React from 'react';
import { View, Text, TouchableOpacity, FlatList, Platform, Image } from 'react-native';
import { ChevronLeft, Bell, Download, SlidersHorizontal } from 'lucide-react-native';
import { router } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';

const PayoutHistory = () => {
  const historyData = [
    { id: '1', date: 'Jan 26', amount: '85,000', status: 'Paid Out' },
    { id: '2', date: 'Dec 25', amount: '70,000', status: 'Paid Out' },
    { id: '3', date: 'Nov 25', amount: '65,000', status: 'Paid Out' },
    { id: '4', date: 'Oct 25', amount: '85,000', status: 'Paid Out' },
    { id: '5', date: 'Sep 25', amount: '60,000', status: 'Paid Out' },
    { id: '6', date: 'Aug 25', amount: '55,000', status: 'Paid Out' },
    { id: '7', date: 'July 25', amount: '45,000', status: 'Paid Out' },
  ];

  return (
    <Container>
      <View>
        {/* Top Nav */}
        <View className="flex-row items-center justify-between py-2">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ChevronLeft color="black" size={24} />
          </TouchableOpacity>
          <Text className="font-sans font-semibold text-base text-[#697281]">Payout Status</Text>
          <TouchableOpacity className="p-1">
            <Bell color="#EF4444" size={24} fill="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Upcoming Payout Card */}
        <View className="mt-2 rounded-[10px] border border-[#E5E7EB] bg-white p-5 ">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-base text-[#1C1C1C]">Upcoming payout</Text>
            <View className="flex-row items-center">
              <View className="rounded-full bg-gray-200 px-3 py-2.5">
                <Text className="font-bold text-[10px] text-gray-500">Processing</Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/DownloadScreen')}
                className="ml-2 rounded-full bg-[#E5E7EB] p-2 ">
                <Download size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="my-3 font-bold text-4xl text-gray-900">₹2,40,000</Text>

          <View className="relative my-2 h-1.5 w-full justify-center rounded-full bg-gray-100">
            <View className="h-full w-[80%] rounded-full bg-[#EF4444]" />
            <View
              className="absolute h-4 w-4 rounded-full border-2 border-white bg-[#EF4444] shadow-sm"
              style={{ left: '78%' }}
            />
          </View>

          <View className="flex-row justify-between">
            <Text className="font-medium text-xs text-[#1C1C1C]">Payout</Text>
            <Text className="text-xs font-normal text-[#1C1C1C]">80%</Text>
          </View>
          <Button
            className="mt-3"
            title={'withdrawal'}
            onPress={() => router.push('/ManageBankScreen')}
          />
        </View>

        {/* List Title & Filter */}
        <View className="mb-4 mt-8 flex-row items-center justify-between">
          <Text className="font-medium font-sans text-base leading-6 text-[#1C1C1C]">
            Payout history
          </Text>
          <TouchableOpacity className="flex-row items-center rounded-full border border-gray-200 bg-white px-4 py-2.5">
            <SlidersHorizontal size={17} color="#EF4444" />
            <Text className="ml-2 font-medium text-sm text-[#1C1C1C]">Filter</Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={historyData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        }}
        renderItem={({ item }) => (
          <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4 ">
            <View>
              <Text className="mb-1 font-medium font-sans text-xs text-[#1C1C1C]">{item.date}</Text>
              <Text className="font-bold text-lg text-gray-800">₹{item.amount}</Text>
            </View>
            <View className="flex-row items-center rounded-lg  px-3 py-1.5">
              <Image
                source={require('../assets/images/tick.png')}
                style={{ width: 16, height: 16 }}
                resizeMode="contain"
              />
              <Text className="ml-1 text-[14px] font-normal text-black">{item.status}</Text>
            </View>
          </View>
        )}
      />
    </Container>
  );
};

export default PayoutHistory;
