import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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

// FitFob Premium Brand Checkmark Badge with Smooth Pulse Aura
const FitFobTickBadge = () => {
  const scale = useSharedValue(0.95);
  const ringScale = useSharedValue(1);
  const ringOpacity = useSharedValue(0.5);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.35);

  useEffect(() => {
    // Smooth breathing pulse animation on badge
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 1000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Expanding outer brand aura ring 1
    ringScale.value = withRepeat(
      withTiming(1.4, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    ringOpacity.value = withRepeat(
      withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
      -1,
      false
    );

    // Expanding secondary aura ring 2 (offset)
    ring2Scale.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(1.55, { duration: 1800, easing: Easing.out(Easing.ease) })
      ),
      -1,
      false
    );

    ring2Opacity.value = withRepeat(
      withSequence(
        withTiming(0.35, { duration: 400 }),
        withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) })
      ),
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

  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));

  return (
    <View style={styles.badgeWrapper}>
      {/* Outer Pulse Ring 2 (Largest Aura) */}
      <Animated.View style={[styles.pulseRing2, ring2Style]} />

      {/* Outer Pulse Ring 1 */}
      <Animated.View style={[styles.pulseRing1, ringStyle]} />

      {/* FitFob Red Brand Badge with Gradient & Border */}
      <Animated.View style={[styles.badgeContainer, badgeStyle]}>
        <LinearGradient
          colors={['#FF2A4D', '#F6163C', '#D90429']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientBadge}>
          {/* Inner subtle glow ring with Gym Barbell + Verified Badge */}
          <View style={styles.innerGlowRing}>
            <View style={styles.iconCenterWrapper}>
              <Ionicons name="barbell" size={54} color="#FFFFFF" />
              <View style={styles.miniVerifyBadge}>
                <Ionicons name="checkmark-sharp" size={13} color="#FFFFFF" />
              </View>
            </View>
          </View>
        </LinearGradient>
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
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-4 pt-8">
          {/* Brand Tick Animation */}
          <FitFobTickBadge />

          {/* Tag Pill */}
          <View className="mb-3 flex-row items-center rounded-lg border border-red-200 bg-red-50 px-3.5 py-1">
            <Ionicons name="shield-checkmark" size={14} color="#F6163C" style={{ marginRight: 5 }} />
            <Text className="font-bold text-[10px] uppercase tracking-wider text-[#F6163C]">
              Onboarding Complete
            </Text>
          </View>

          {/* Heading */}
          {/* <Text className="text-center font-bold text-[26px] leading-10 text-slate-900 mt-4">
            Congratulations 🎉
          </Text> */}

          {/* Subtitle */}
          {/* <Text className="mt-2 text-center text-sm leading-6 text-slate-500 max-w-[320px]">
            Your club details, timings schedule, and documents have been successfully submitted for review.
          </Text> */}

          {/* Summary Checklist Card */}
          <View className="mt-8 w-full rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
            <Text className="mb-3 font-bold text-[13px]  tracking-wider text-slate-400">
              Completed Steps
            </Text>

            {/* Checklist Item 1: Gym / Club Info */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-red-50 border border-red-100/80">
                <Ionicons name="barbell-outline" size={20} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-slate-800">Basic & Gym Details</Text>
                <Text className="text-[12px] text-slate-500">Club name, type & location verified</Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            </View>

            <View className="my-0.5 h-[1px] bg-slate-200/50" />

            {/* Checklist Item 2: Operating Schedule */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-red-50 border border-red-100/80">
                <Ionicons name="time-outline" size={20} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-slate-800">Operating Schedule</Text>
                <Text className="text-[12px] text-slate-500">Opening and closing timings configured</Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            </View>

            <View className="my-0.5 h-[1px] bg-slate-200/50" />

            {/* Checklist Item 3: Govt Verification Documents */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-red-50 border border-red-100/80">
                <Ionicons name="shield-checkmark-outline" size={20} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-slate-800">Govt Verification Documents</Text>
                <Text className="text-[12px] text-slate-500">Documents uploaded for compliance</Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            </View>

            <View className="my-0.5 h-[1px] bg-slate-200/50" />

            {/* Checklist Item 4: Club & Facility Photos */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-red-50 border border-red-100/80">
                <Ionicons name="images-outline" size={20} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-slate-800">Club & Facility Photos</Text>
                <Text className="text-[12px] text-slate-500">Showcasing gym areas and facilities</Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            </View>
          </View>

          {/* Quick Notice Card */}
          <View className="mt-4 w-full flex-row items-center rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5">
            <Ionicons name="information-circle" size={20} color="#D97706" style={{ marginRight: 10 }} />
            <Text className="flex-1 text-[12px] leading-5 text-amber-900">
              Our team usually reviews club profiles within <Text className="font-bold">24-48 hours</Text>. You can track status anytime.
            </Text>
          </View>
        </View>

        {/* Footer Action Button */}
        <View className="mt-6 px-4">
          <Button
            title="Track Verification Status"
            onPress={() => router.replace('/ReviewStatusScreen')}
            icon={<Ionicons name="arrow-forward-outline" size={18} color="#FFFFFF" />}
          />
        </View>
      </ScrollView>
    </Container>
  );
};

export default Completed;

const styles = StyleSheet.create({
  badgeWrapper: {
    height: 160,
    width: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  pulseRing1: {
    position: 'absolute',
    height: 140,
    width: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(246, 22, 60, 0.22)',
  },
  pulseRing2: {
    position: 'absolute',
    height: 160,
    width: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(246, 22, 60, 0.12)',
  },
  badgeContainer: {
    height: 120,
    width: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.38,
    shadowRadius: 20,
    elevation: 12,
  },
  gradientBadge: {
    flex: 1,
    borderRadius: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerGlowRing: {
    height: 96,
    width: 96,
    borderRadius: 48,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCenterWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  miniVerifyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -10,
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 3,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
