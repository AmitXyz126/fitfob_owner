import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { CustomTabBar } from '@/components/CustomTabBar';

const TABS = ['/index', '/checkins', '/wallet'];

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Allow horizontal swipe gestures across screen
        return Math.abs(gestureState.dx) > 35 && Math.abs(gestureState.dy) < 35;
      },
      onPanResponderRelease: (_, gestureState) => {
        const currentPath = pathname === '/' ? '/index' : pathname;
        const currentIndex = TABS.findIndex((t) => currentPath.includes(t.replace('/', '')));

        if (gestureState.dx < -60) {
          // Swiped Left -> Go Next Tab
          if (currentIndex >= 0 && currentIndex < TABS.length - 1) {
            router.navigate(TABS[currentIndex + 1] as any);
          }
        } else if (gestureState.dx > 60) {
          // Swiped Right -> Go Prev Tab
          if (currentIndex > 0) {
            router.navigate(TABS[currentIndex - 1] as any);
          }
        }
      },
    })
  ).current;

  return (
    <View style={{ flex: 1 }} {...panResponder.panHandlers}>
      <Tabs
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
          }}
        />
        <Tabs.Screen
          name="checkins"
          options={{
            title: 'Scan',
          }}
        />
        <Tabs.Screen
          name="wallet"
          options={{
            title: 'Wallet',
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
    </View>
  );
}


