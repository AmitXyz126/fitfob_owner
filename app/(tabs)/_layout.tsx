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
          borderTopWidth: 0,
          elevation: 10,
          ...Platform.select({
            ios: { position: 'absolute' },
            default: {},
          }),
        },
      }}>
      {/* 1. HOME TAB */}
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons size={26} name={focused ? 'home' : 'home-outline'} color={color} />
              {focused && <View className="mt-1 h-[3px] w-6 rounded-full bg-primary" />}
            </View>
          ),
        }}
      />

      {/* 2. CHECK-INS / SCAN TAB */}
      <Tabs.Screen
        name="checkins"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons size={26} name={focused ? 'scan' : 'scan-outline'} color={color} />
              {focused && <View className="mt-1 h-[3px] w-6 rounded-full bg-primary" />}
            </View>
          ),
        }}
      />

      {/* 3. WALLET TAB */}
      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Ionicons size={26} name={focused ? 'wallet' : 'wallet-outline'} color={color} />
              {focused && <View className="mt-1 h-[3px] w-6 rounded-full bg-primary" />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="ViewAllScreen"  
        options={{
          href: null,  
          headerShown: false,
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
