import React from 'react';
import { View, Text, TouchableOpacity, } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';

export default function ReviewStatusScreen() {
  return (
    <Container style={{ flex: 1 }}>
      {/* Back Button */}
      <TouchableOpacity className="mt-5 ml-2 p-2">
        <Ionicons name="chevron-back" size={24} color="#CBD5E1" />
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center px-6">
        {/* Megaphone Icon */}
        <View className="mb-12">
           {/* Agar aapke paas image h toh Image use kro, warna Ionicons best h */}
          <Ionicons name="megaphone" size={120} color="#F6163C" />
        </View>

        <Text className="text-[28px] font-bold text-slate-900 text-center leading-9">
          We’re reviewing your submission
        </Text>
        
        <Text className="mt-5 text-[15px] text-slate-500 text-center leading-6 font-medium">
          We need more time to verify your identity. This may be due to your document requiring manual review or delays with our third-party partner. We’ll update you once the review is complete.
        </Text>
      </View>

      <View className="px-2 mb-6">
        <TouchableOpacity 
          activeOpacity={0.8}
          className="bg-[#F6163C] py-4 rounded-2xl"
        >
          <Text className="text-center text-white font-bold text-lg">Done</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}