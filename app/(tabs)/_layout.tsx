import { Tabs, useRouter, usePathname } from 'expo-router';
import React, { useRef } from 'react';
import { View, PanResponder } from 'react-native';
import { CustomTabBar } from '@/components/CustomTabBar';

const TABS = ['index', 'checkins', 'wallet'];

const getActiveTabIndex = (path: string) => {
  if (!path || path === '/' || path === '/(tabs)' || path.includes('index')) return 0;
  if (path.includes('checkins')) return 1;
  if (path.includes('wallet')) return 2;
  return 0;
};

export default function TabLayout() {
  const router = useRouter();
  const pathname = usePathname();

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 18 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const currentIndex = getActiveTabIndex(pathname);

        if (dx < -35 || (dx < -18 && vx < -0.2)) {
          // Swiped Left -> Go Next Tab
          if (currentIndex < TABS.length - 1) {
            router.navigate(`/(tabs)/${TABS[currentIndex + 1]}` as any);
          }
        } else if (dx > 35 || (dx > 18 && vx > 0.2)) {
          // Swiped Right -> Go Prev Tab
          if (currentIndex > 0) {
            router.navigate(`/(tabs)/${TABS[currentIndex - 1]}` as any);
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


