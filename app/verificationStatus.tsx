import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail } from '@/hooks/useUserDetail';

const CONFETTI_COUNT = 45;
const COLORS = ['#F6163C', '#FFD700', '#3B82F6', '#10B981', '#EC4899', '#8B5CF6', '#F59E0B'];

interface ConfettiPiece {
  id: number;
  color: string;
  width: number;
  height: number;
  borderRadius: number;
  position: Animated.ValueXY;
  rotation: Animated.Value;
  opacity: Animated.Value;
}

const createParticles = (): ConfettiPiece[] => {
  return Array.from({ length: CONFETTI_COUNT }).map((_, index) => {
    return {
      id: index,
      color: COLORS[index % COLORS.length],
      width: Math.random() * 8 + 6,
      height: Math.random() * 12 + 6,
      borderRadius: Math.random() > 0.5 ? 0 : 3,
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      rotation: new Animated.Value(0),
      opacity: new Animated.Value(1),
    };
  });
};

export default function VerificationStatusScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profileStatus } = useUserDetail();

  // Animation values for check and shield
  const shieldScale = React.useRef(new Animated.Value(0)).current;
  const checkScale = React.useRef(new Animated.Value(0)).current;

  // Radar/Ripple background loop
  const rippleValue = React.useRef(new Animated.Value(0)).current;

  // Confetti particles
  const [particles] = useState<ConfettiPiece[]>(createParticles);

  React.useEffect(() => {
    // 1. Pop the Shield
    Animated.spring(shieldScale, {
      toValue: 1,
      tension: 50,
      friction: 6,
      useNativeDriver: true,
    }).start();

    // 2. Pop the Checkmark after shield pop
    Animated.sequence([
      Animated.delay(350),
      Animated.spring(checkScale, {
        toValue: 1,
        tension: 60,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Start radar ripple loop
    Animated.loop(
      Animated.timing(rippleValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    ).start();

    // 4. Confetti Blast animations
    const blastAnimations = particles.map((p) => {
      const blastX = (Math.random() - 0.5) * 360; // shoot sideways
      const blastY = -120 - Math.random() * 180;  // shoot upwards
      const fallX = blastX + (Math.random() - 0.5) * 100; // drift sideways
      const fallY = 600; // fall past bottom of screen
      const fallDuration = 2000 + Math.random() * 1200;

      return Animated.sequence([
        Animated.delay(450 + Math.random() * 100), // staggered timing
        // Blast up
        Animated.parallel([
          Animated.timing(p.position, {
            toValue: { x: blastX, y: blastY },
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(p.rotation, {
            toValue: 360 + Math.random() * 360,
            duration: 600,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        // Gravity Fall
        Animated.parallel([
          Animated.timing(p.position, {
            toValue: { x: fallX, y: fallY },
            duration: fallDuration,
            easing: Easing.in(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(p.rotation, {
            toValue: 1080 + Math.random() * 1080,
            duration: fallDuration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: fallDuration * 0.9,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(blastAnimations).start();
  }, [shieldScale, checkScale, rippleValue, particles]);

  const rippleScale = rippleValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.8],
  });

  const rippleOpacity = rippleValue.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.2, 0],
  });

  // Format ID or use a default one
  const ownerId = user?.clubOwnerDetail?.clubId
  console.log(user , "hey user")
  const ownerEmail = user?.email || profileStatus?.email || 'owner@fitfob.com';

  return (
    <Container>
      {/* Confetti Overlay */}
      <View style={StyleSheet.absoluteFillObject} pointerEvents="none" className="z-50 items-center justify-center">
        {particles.map((p) => {
          const spin = p.rotation.interpolate({
            inputRange: [0, 360],
            outputRange: ['0deg', '360deg'],
          });

          return (
            <Animated.View
              key={p.id}
              style={{
                position: 'absolute',
                width: p.width,
                height: p.height,
                backgroundColor: p.color,
                borderRadius: p.borderRadius,
                transform: [
                  { translateX: p.position.x },
                  { translateY: p.position.y },
                  { rotate: spin },
                ],
                opacity: p.opacity,
              }}
            />
          );
        })}
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-sans font-bold text-[18px] text-[#1C1C1C] text-center flex-1 mr-10">
          Verification Status
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-1 mt-6">
        {/* Shield Icon Wrapper */}
        <View className="items-center mb-6">
          {/* Animated Glowing Radar Ripple & Pop Icon */}
          <View style={{ width: 100, height: 100, alignItems: 'center', justifycontent: 'center', position: 'relative' } as any} className="mb-4">
            {/* Pulsing Ripple Circle */}
            <Animated.View style={{
              position: 'absolute',
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#A7F3D0',
              transform: [{ scale: rippleScale }],
              opacity: rippleOpacity,
              zIndex: 1,
            }} />

            {/* Shield Body popping up */}
            <Animated.View style={{
              position: 'absolute',
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#E8F8F5',
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ scale: shieldScale }],
              zIndex: 2,
            }}>
              {/* Checkmark popping up inside shield */}
              <Animated.View style={{ transform: [{ scale: checkScale }] }}>
                <Ionicons name="shield-checkmark" size={40} color="#10B981" />
              </Animated.View>
            </Animated.View>
          </View>

          {/* Title & Badge */}
          <Text className="font-sans font-extrabold text-[20px] text-[#1C1C1C] text-center">
            Your Account is Verified!
          </Text>

          <View className="mt-2.5 rounded-full bg-[#E8F8F5] px-4 py-1.5 border border-[#A3E635]/20">
            <Text className="font-sans font-bold text-[11px] text-[#10B981] uppercase tracking-wider">
              Approved & Active
            </Text>
          </View>

          {/* Informative message */}
          <Text className="mt-3.5 text-center font-sans text-[12px] font-normal leading-[18px] text-slate-400 max-w-[85%]">
            Thank you for completing your verification. Your business documents and club details have been approved. You now have full access to manage memberships, payouts, and edit club preferences.
          </Text>
        </View>

        {/* Detail Parameters Card */}
        <View className="w-full rounded-[12px] border border-[#E2E8F0] bg-white p-5">
          <View className="flex-row justify-between py-3 border-b border-slate-100">
            <Text className="font-sans font-medium text-slate-400 text-[13px]">Verified ID</Text>
            <Text className="font-sans font-bold text-[#1C1C1C] text-[13px]">{ownerId}</Text>
          </View>

          <View className="flex-row justify-between py-3 border-b border-slate-100">
            <Text className="font-sans font-medium text-slate-400 text-[13px]">Document Type</Text>
            <Text className="font-sans font-bold text-[#1C1C1C] text-[13px]">Business License & ID</Text>
          </View>

          <View className="flex-row justify-between py-3">
            <Text className="font-sans font-medium text-slate-400 text-[13px]">Registered Email</Text>
            <Text className="font-sans font-bold text-[#1C1C1C] text-[13px]">{ownerEmail}</Text>
          </View>
        </View>
      </View>

      {/* Done Button */}
      <View className="absolute bottom-6 left-4 right-4 bg-white py-2">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.8}
          className="flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-md"
        >
          <Ionicons name="checkmark" size={20} color="#FFF" />
          <Text className="font-sans font-bold text-[16px] text-white ml-1">
            Done
          </Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
