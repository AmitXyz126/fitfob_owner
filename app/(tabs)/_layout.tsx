import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#F6163C',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          height: 70,
          backgroundColor: 'white',
          borderTopWidth: 1,

          elevation: 10,
          ...Platform.select({
            ios: { position: 'absolute' },
            default: {},
          }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons size={26} name={focused ? 'home' : 'home-outline'} color={color} />
              {focused && <View className="mt-1 h-[3px] w-6 rounded-full bg-[#F6163C]" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="checkins"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons size={26} name={focused ? 'scan' : 'scan-outline'} color={color} />
              {focused && <View className="mt-1 h-[3px] w-6 rounded-full bg-[#F6163C]" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons size={26} name={focused ? 'wallet' : 'wallet-outline'} color={color} />
              {focused && <View className="mt-1 h-[3px] w-6 rounded-full bg-[#F6163C]" />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="earningDetail"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
