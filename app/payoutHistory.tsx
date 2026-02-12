import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ChevronLeft, Bell, Download, SlidersHorizontal, CheckCircle2 } from 'lucide-react-native';
import { router } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';

const PayoutHistory = () => {
  const historyData = [
    { date: 'Jan 26', amount: '85,000', status: 'Paid Out' },
    { date: 'Dec 25', amount: '70,000', status: 'Paid Out' },
    { date: 'Nov 25', amount: '65,000', status: 'Paid Out' },
    { date: 'Oct 25', amount: '85,000', status: 'Paid Out' },
    { date: 'Sep 25', amount: '60,000', status: 'Paid Out' },
  ];

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center justify-between py-2">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="font-semibold text-lg text-gray-500">Payout Status</Text>
        <TouchableOpacity className="p-1">
          <Bell color="#EF4444" size={24} fill="#EF4444" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
        {/* Upcoming Payout Card */}
        <View className="mt-2 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-base text-gray-600">Upcoming payout</Text>
            <View className="flex-row items-center space-x-2">
              <View className="rounded-full bg-gray-200 px-3 py-1">
                <Text className="font-bold text-[10px] text-gray-500">Processing</Text>
              </View>
              \
              <TouchableOpacity onPress={() => router.push('/DownloadScreen')} className="mr-2 p-1">
                <Download size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>

          <Text className="my-3 font-bold text-4xl text-gray-900">₹2,40,000</Text>

          {/* Custom Progress Bar */}
          <View className="relative my-4 h-1.5 w-full justify-center rounded-full bg-gray-100">
            <View className="h-full w-[80%] rounded-full bg-[#EF4444]" />
            {/* Knob/Thumb */}
            <View
              className="absolute h-4 w-4 rounded-full border-2 border-white bg-[#EF4444] shadow-sm"
              style={{ left: '78%' }}
            />
          </View>

          <View className="flex-row justify-between">
            <Text className="font-medium text-xs text-gray-400">Payout</Text>
            <Text className="font-medium text-xs text-gray-400">80%</Text>
          </View>

          <Button title={'withdrawal'} onPress={() => router.push('/ManageBankScreen')} />
        </View>

        {/* Payout History Section Header */}
        <View className="mb-4 mt-8 flex-row items-center justify-between">
          <Text className="font-bold text-xl text-gray-900">Payout history</Text>
          <TouchableOpacity className="flex-row items-center rounded-full border border-gray-200 bg-white px-3 py-1.5">
            <SlidersHorizontal size={14} color="#EF4444" />
            <Text className="ml-2 font-medium text-sm text-gray-700">Filter</Text>
          </TouchableOpacity>
        </View>

        {/* History List */}
        {historyData.map((item, index) => (
          <View
            key={index}
            className="mb-3 flex-row items-center justify-between rounded-2xl border border-gray-50 bg-white p-4 shadow-sm">
            <View>
              <Text className="mb-1 font-medium text-xs text-gray-400">{item.date}</Text>
              <Text className="font-bold text-lg text-gray-800">₹{item.amount}</Text>
            </View>
            <View className="flex-row items-center rounded-lg bg-green-50 px-3 py-1.5">
              <CheckCircle2 size={16} color="#10B981" />
              <Text className="ml-2 font-bold text-xs text-green-600">{item.status}</Text>
            </View>
          </View>
        ))}

        {/* Bottom padding for scroll */}
        <View className="h-10" />
      </ScrollView>
    </Container>
  );
};

export default PayoutHistory;
