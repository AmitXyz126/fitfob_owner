import React from 'react';
import { Text, View, TouchableOpacity, Image, } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons,  } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import LineGradient from '@/components/lineGradient/LineGradient';

const EarningDetail = () => {
  const router = useRouter();
 
  const params = useLocalSearchParams();

  return (
    <Container>
      <View className="flex-1 bg-white">
        {/* Custom Header */}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-slate-800">Earnings Detail</Text>
          <TouchableOpacity className="p-1 relative">
             <Ionicons name="notifications" size={24} color="#F6163C" />
             <View className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full items-center justify-center" />
          </TouchableOpacity>
        </View>

        {/* Detail Card */}
        <View className="border border-slate-100 rounded-[24px] p-5 shadow-sm bg-white mt-2">
          {/* User Profile Info */}
          <View className="flex-row items-center mb-6">
            <Image 
              source={{ uri: params.image as string || 'https://randomuser.me/api/portraits/women/1.jpg' }} 
              className="h-14 w-14 rounded-2xl" 
            />
            <View className="ml-4">
              <Text className="text-xl font-bold text-slate-800">{params.name || 'Barbara Gordon'}</Text>
              <View className="bg-red-50 self-start px-2 py-0.5 rounded-full mt-1">
                <Text className="text-[#F6163C] text-[10px] font-medium">Premium Monthly pass</Text>
              </View>
            </View>
          </View>
            <LineGradient />

          {/* Date & Time Row */}
          <View className="flex-row items-center py-2  border-slate-50">
            <View className="bg-red-50 p-2 rounded-lg">
              <Ionicons name="calendar" size={20} color="#F6163C" />
            </View>
            <Text className="ml-3 text-slate-700 font-medium text-[15px]">
              {params.date || '22 Jan, 2026'}  •  9:30 AM
            </Text>
          </View>
          
            <LineGradient />

          {/* Credited Amount Row */}
          <View className="flex-row justify-between items-center py-6">
            <Text className="text-slate-500 text-lg">Net Credited</Text>
            <Text className="text-2xl font-bold text-slate-900">{params.price || '₹699'}</Text>
          </View>

          {/* Chat Button */}
          <TouchableOpacity 
            className="bg-primary rounded-2xl py-4 flex-row items-center justify-center shadow-lg shadow-red-200"
            activeOpacity={0.8}
          >
            <Text className="text-white font-bold text-lg">Chat with {params.name?.toString().split(' ')[0] || 'Barbara'}</Text>
            
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
};

export default EarningDetail;