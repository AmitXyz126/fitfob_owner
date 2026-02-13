/* eslint-disable react/no-unescaped-entities */
import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const RECENT_CHECKINS = [
  {
    id: '1',
    name: 'Tina Sharma',
    time: '10 mins ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=tina',
    color: '#94A3B8',
    icon: 'hexagon', // Standard icon
  },
  {
    id: '2',
    name: 'Amelia Thomas',
    time: '1 hr ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=amelia',
    color: '#EAB308',
  },
  {
    id: '3',
    name: 'Sophia Lee',
    time: '35 mins ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=sophia',
    color: '#F6163C',
  },
  {
    id: '4',
    name: 'Liam Brown',
    time: '20 mins ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=liam',
    color: '#F6163C',
  },
  {
    id: '5',
    name: 'Rahul Dev',
    time: '45 mins ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=rahul',
    color: '#94A3B8',
  },
  {
    id: '6',
    name: 'Zoya Khan',
    time: '50 mins ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=zoya',
    color: '#EAB308',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  return (
    <Container>
      {/* --- FIXED HEADER & CARDS --- */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push('/clubProfile')}>
              <Image
                className="h-12 w-12"
                source={require('../../assets/images/scanIcon.png')}
                resizeMode="contain"
              />
            </TouchableOpacity>
            <View className="ml-3">
              <Text className="text-[12px] font-normal  text-[#1C1C1C]">
                Welcome to Anytime Fitness Gym
              </Text>
              <Text className="font-bold text-xl text-slate-900">Good Morning, Garry</Text>
            </View>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              style={{ elevation: 2 }}
              className="rounded-full border border-slate-100 bg-white p-2 shadow-sm">
              <Ionicons name="notifications" size={20} color="#F6163C" />
            </TouchableOpacity>
            <TouchableOpacity className="rounded-full border border-slate-100 bg-slate-50 p-2 shadow-sm">
              <Ionicons name="paper-plane" size={20} color="#F6163C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Earnings Card */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/payoutHistory')}>
          <LinearGradient
            colors={['#F6163C', '#FF8FA3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 2 }}
            style={{ borderRadius: 16, overflow: 'hidden' }}
            className="relative mb-6 shadow-xl shadow-red-300">
            {/* Background Pattern Image */}
            <Image
              source={require('../../assets/images/bgLayer.png')}
              className="absolute right-0 top-0 h-full w-1/2"
              resizeMode="cover"
            />

            <View className="relative z-10 rounded-lg px-4 py-5">
              <View className="flex-row items-start justify-between">
                <Text className="font-medium text-white/80">Monthly Earnings</Text>
                <View className="rounded-full bg-[#0000001A] px-3 py-1.5 backdrop-blur-md">
                  <Text className="font-bold text-[10px]  text-[#FFF]">+20% this month</Text>
                </View>
              </View>
              <Text className="mt-2 font-bold text-4xl text-white">₹2,40,000</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {/* Stats Row */}
        <View className="mb-8 mt-4 flex-row justify-between">
          {/* Today's Check-ins Card */}
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 3,
            }}
            className="mr-3 flex-1 rounded-[24px] bg-white p-5">
            <Text className="font-medium text-[13px] text-slate-400">Today's Check-ins</Text>
            <View className="mt-2 flex-row items-end justify-between">
              <Text className="font-bold text-3xl">45</Text>
              {/* Green Pill Indicator */}
              <View className="mb-1 flex-row items-center rounded-full bg-emerald-50 px-2 py-1">
                <Ionicons name="arrow-up" size={12} color="#10B981" />
                <Text className="ml-0.5 font-bold text-[12px] text-emerald-500">+5</Text>
              </View>
            </View>
          </View>

          {/* Active Members Card */}
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 3,
            }}
            className="flex-1 rounded-[24px] bg-white p-5">
            <Text className="font-medium text-[13px] text-slate-400">Active Members</Text>
            <View className="mt-2 flex-row items-end justify-between">
              <Text className="font-bold text-3xl">320</Text>
              {/* Green Pill Indicator */}
              <View className="mb-1 flex-row items-center rounded-full bg-emerald-50 px-2 py-1">
                <Ionicons name="arrow-up" size={12} color="#10B981" />
                <Text className="ml-0.5 font-bold text-[12px] text-emerald-500">+5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Title */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-bold text-lg text-slate-900">Recent Check-ins</Text>
          <TouchableOpacity onPress={() => router.push('/ViewAllScreen')}>
            <Text className="rounded-full bg-[#F6163C] px-4 py-1.5 font-bold text-xs text-white">
              View All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- SCROLLABLE LIST --- */}
      <FlatList
        data={RECENT_CHECKINS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        // contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-3 shadow-sm shadow-slate-100">
            <Image source={{ uri: item.image }} className="h-14 w-14 rounded-xl" />

            <View className="ml-4 flex-1 ">
              <View className="flex-row items-center gap-1 ">
                <Text className="font-bold text-[15px] text-slate-900">{item.name}</Text>
                <Image className="h-4 w-4" source={require('../../assets/images/tick.png')} />
              </View>
              <Text className="text-xs text-slate-400">{item.time}</Text>
            </View>
            <View
              style={{ backgroundColor: `${item.color}15`, borderColor: `${item.color}30` }}
              className="flex-row gap-1 rounded-full border px-3 py-1">
              <Ionicons name="shield-checkmark" size={12} color={item.color} />

              <Text style={{ color: item.color }} className="font-bold text-[10px] uppercase">
                {item.type}
              </Text>
            </View>
          </View>
        )}
      />
    </Container>
  );
}
