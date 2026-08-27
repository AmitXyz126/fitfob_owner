import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PanResponder,
  Dimensions,
} from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Scan, Wallet } from 'lucide-react-native';
import Svg, { Path } from 'react-native-svg';

export function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // Position tab bar near bottom
  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom - 10, 6) : 6;

  // Filter visible tabs
  const visibleRoutes = state.routes.filter((route) => {
    const { options } = descriptors[route.key];
    return (options as { href?: string | null }).href !== null && route.name !== 'earningDetail';
  });

  const activeVisibleIndex = visibleRoutes.findIndex(
    (r) => r.name === state.routes[state.index]?.name
  );

  // Dynamic bar width
  const screenWidth = Dimensions.get('window').width;
  const [barWidth, setBarWidth] = useState(screenWidth - 32);

  // Real-time finger slide tracking gesture across tabs
  const handleGestureMove = (pageX: number) => {
    if (barWidth <= 0) return;
    const relativeX = pageX - 16;
    const third = barWidth / 3;

    let targetIndex = 0;
    if (relativeX < third) {
      targetIndex = 0; // Home
    } else if (relativeX < third * 2) {
      targetIndex = 1; // Scan
    } else {
      targetIndex = 2; // Wallet
    }

    if (visibleRoutes[targetIndex] && activeVisibleIndex !== targetIndex) {
      navigation.navigate(visibleRoutes[targetIndex].name);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        handleGestureMove(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        handleGestureMove(evt.nativeEvent.pageX);
      },
      onPanResponderRelease: (evt) => {
        handleGestureMove(evt.nativeEvent.pageX);
      },
    })
  ).current;

  // SVG Curve dimensions
  const w = barWidth;
  const h = 72;
  const topY = 16;
  const cx = w / 2;
  const cornerR = 20;

  const d = `
    M ${cornerR},${topY}
    L ${cx - 48},${topY}
    C ${cx - 28},${topY} ${cx - 24},2 ${cx},2
    C ${cx + 24},2 ${cx + 28},${topY} ${cx + 48},${topY}
    L ${w - cornerR},${topY}
    Q ${w},${topY} ${w},${topY + cornerR}
    L ${w},${h - cornerR}
    Q ${w},${h} ${w - cornerR},${h}
    L ${cornerR},${h}
    Q 0,${h} 0,${h - cornerR}
    L 0,${topY + cornerR}
    Q 0,${topY} ${cornerR},${topY}
    Z
  `;

  return (
    <View
      {...panResponder.panHandlers}
      onLayout={(e) => {
        const { width } = e.nativeEvent.layout;
        if (width > 0) setBarWidth(width);
      }}
      style={[styles.container, { bottom: bottomInset }]}>
      {/* SVG Curved Background */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <Path d={d} fill="#FFFFFF" />
        </Svg>
      </View>

      {/* Tab Overlay */}
      <View style={styles.tabRow}>
        {visibleRoutes.map((route) => {
          const { options } = descriptors[route.key];
          const isFocused = state.routes[state.index]?.key === route.key;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          if (route.name === 'index') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || 'Home'}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.8}
                style={styles.sideTabItem}>
                <View style={styles.iconContainer}>
                  <Home
                    size={22}
                    color={isFocused ? '#F6163C' : '#64748B'}
                    strokeWidth={isFocused ? 2.3 : 1.8}
                  />
                </View>
                <Text style={[styles.label, isFocused ? styles.activeLabel : styles.inactiveLabel]}>
                  Home
                </Text>
              </TouchableOpacity>
            );
          }

          if (route.name === 'checkins') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || 'Scan'}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.85}
                style={styles.centerTabItem}>
                <View style={[styles.centerOuterHalo, isFocused && styles.centerOuterHaloActive]}>
                  <View
                    style={[
                      styles.centerRedButton,
                      isFocused ? styles.centerRedButtonActive : styles.centerRedButtonInactive,
                    ]}>
                    <Scan
                      size={24}
                      color={isFocused ? '#FFFFFF' : '#F6163C'}
                      strokeWidth={isFocused ? 2.4 : 2.0}
                    />
                  </View>
                </View>
                <Text
                  style={[
                    styles.label,
                    isFocused ? styles.activeLabel : styles.inactiveLabel,
                    styles.centerLabel,
                  ]}>
                  Scan
                </Text>
              </TouchableOpacity>
            );
          }

          if (route.name === 'wallet') {
            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel || 'Wallet'}
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.8}
                style={styles.sideTabItem}>
                <View style={styles.iconContainer}>
                  <Wallet
                    size={22}
                    color={isFocused ? '#F6163C' : '#64748B'}
                    strokeWidth={isFocused ? 2.3 : 1.8}
                  />
                </View>
                <Text style={[styles.label, isFocused ? styles.activeLabel : styles.inactiveLabel]}>
                  Wallet
                </Text>
              </TouchableOpacity>
            );
          }

          return null;
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 72,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
  },
  tabRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    paddingTop: 16,
    paddingBottom: 6,
  },
  sideTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  centerTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -18,
  },
  centerOuterHalo: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  centerOuterHaloActive: {
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  centerRedButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerRedButtonActive: {
    backgroundColor: '#F6163C',
  },
  centerRedButtonInactive: {
    backgroundColor: '#FFF0F3',
  },
  label: {
    fontSize: 11,
    marginTop: 1,
  },
  centerLabel: {
    marginTop: 2,
  },
  activeLabel: {
    color: '#F6163C',
    fontWeight: '600',
  },
  inactiveLabel: {
    color: '#64748B',
    fontWeight: '500',
  },
});
