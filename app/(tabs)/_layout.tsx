import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, Image } from 'react-native';

export default function TabLayout() {
  const homeFill = require('../../assets/images/home_fill.png');
  const homeUnfill = require('../../assets/images/home_unfill.png');

  const iconFill = require('../../assets/images/Or_fill.png');
  const iconUnfill = require('../../assets/images/Qr_unfill.png');

  const walletFill = require('../../assets/images/wallet_fill.png');
  const walletUnfill = require('../../assets/images/wallet_unfill.png');

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#F6163C',
        tabBarInactiveTintColor: '#1b55a5ff',
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: Platform.OS === 'android' ? 0 : 8,
        },
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          elevation: 8,
          ...Platform.select({
            ios: {
              position: 'absolute',
              height: 65,
              paddingBottom: 10,
            },
            android: {
              height: 56,
              paddingBottom: 0,
            },
          }),
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center">
              <Image
                source={focused ? homeFill : homeUnfill}
                style={{ width: 26, height: 26 }}
                resizeMode="contain"
              />
              {focused && <View className="mt-3 h-[3px] w-9 rounded-t-full bg-[#F6163C]" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="checkins"
        options={{
          tabBarIcon: ({ focused }) => (
            <View className="items-center justify-center">
              <Image
                source={focused ? iconFill : iconUnfill}
                style={{ width: 26, height: 26 }}
                resizeMode="contain"
              />
              {focused && <View className="mt-3 h-[3px] w-9 rounded-t-full bg-[#F6163C]" />}
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="wallet"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <View className="items-center justify-center">
              <Image
                source={focused ? walletFill : walletUnfill}
                style={{ width: 26, height: 26 }}
                resizeMode="contain"
              />
              {focused && <View className="mt-3 h-[3px] w-9 rounded-t-full bg-[#F6163C]" />}
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
