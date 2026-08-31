import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Sharp, Crisp Vector Checkmark Badge Component
const CrispTickBadge = () => {
  const scale = useSharedValue(0.95);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);

  useEffect(() => {
    // Smooth breathing pulse animation
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Expanding soft aura ring
    ringScale.value = withRepeat(
      withTiming(1.35, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 1600, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));

  return (
    <View className="relative items-center justify-center h-44 w-44 my-6">
      {/* Outer Pulse Ring */}
      <Animated.View
        className="absolute h-36 w-36 rounded-full bg-emerald-400/25"
        style={ringStyle}
      />

      {/* Ultra-Sharp Vector Checkmark Badge */}
      <Animated.View
        className="h-32 w-32 items-center justify-center rounded-full bg-[#10B981] shadow-2xl border-4 border-white"
        style={[badgeStyle, styles.tickShadow]}>
        <Ionicons name="checkmark" size={72} color="white" />
      </Animated.View>
    </View>
  );
};

const Completed = () => {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      const userKey = user.id || user.email || 'guest';
      AsyncStorage.setItem(`@onboarding_completed_${userKey}`, 'true');
    }
  }, [user]);

  return (
    <Container>
      {/* Main Content */}
      <View className="flex-1 items-center justify-center bg-white px-6">
        <CrispTickBadge />

        <Text className="mt-4 text-center font-bold text-[28px] text-slate-900 leading-9">
          Congratulations! 🎉
        </Text>

        <Text className="mt-2 max-w-xs text-center text-sm leading-6 text-slate-500">
          You have successfully completed your club owner profile onboarding process.
        </Text>
      </View>

      {/* Footer Action */}
      <View className="mb-8 px-4 z-20">
        <Button title="Finish & Go to Dashboard" onPress={() => router.replace('/ReviewStatusScreen')} />
      </View>
    </Container>
  );
};

export default Completed;

const styles = StyleSheet.create({
  tickShadow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
});
