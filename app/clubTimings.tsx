import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import { useUserDetail } from '@/hooks/useUserDetail';

export default function ClubTimingsScreen() {
  const router = useRouter();
  const { profileStatus } = useUserDetail();

  // Clock hands animation values
  const secondValue = React.useRef(new Animated.Value(0)).current;
  const minuteValue = React.useRef(new Animated.Value(0)).current;
  const hourValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Sweep second hand: full rotation in 12 seconds
    Animated.loop(
      Animated.timing(secondValue, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Minute hand: full rotation in 120 seconds
    Animated.loop(
      Animated.timing(minuteValue, {
        toValue: 1,
        duration: 120000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Hour hand: full rotation in 720 seconds
    Animated.loop(
      Animated.timing(hourValue, {
        toValue: 1,
        duration: 720000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [secondValue, minuteValue, hourValue]);

  const secondSpin = secondValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const minuteSpin = minuteValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['60deg', '420deg'], // start at 2 o'clock
  });
  const hourSpin = hourValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['300deg', '660deg'], // start at 10 o'clock
  });

  // Helper to format 24h string to 12h AM/PM
  const formatTime = (timeStr?: string) => {
    if (!timeStr) return null;
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  const openTime = formatTime(profileStatus?.openingTime) || '05:00 AM';
  const closeTime = formatTime(profileStatus?.closingTime) || '10:00 PM';
  const weekdayRange = profileStatus?.workingDays || 'Monday to Friday';
  const weekendRange = 'Saturday & Sunday';

  return (
    <Container style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-sans font-bold text-[18px] text-[#1C1C1C] text-center flex-1 mr-10">
          Club Timings
        </Text>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-1 mt-6">
        {/* Clock Icon Wrapper */}
        <View className="items-center mb-6">
          <View className="h-20 w-20 items-center justify-center rounded-full bg-[#FFF0F2] mb-4">
            {/* Custom Analog Ticking Clock Face */}
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              borderWidth: 3,
              borderColor: '#F6163C',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {/* Center Pivot Pin */}
              <View style={{
                position: 'absolute',
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#F6163C',
                zIndex: 10
              }} />

              {/* Hour Hand */}
              <Animated.View style={{
                position: 'absolute',
                width: 4,
                height: 18,
                transform: [{ rotate: hourSpin }],
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}>
                <View style={{
                  width: 2.5,
                  height: 9,
                  backgroundColor: '#1E293B',
                  borderRadius: 1.5
                }} />
              </Animated.View>

              {/* Minute Hand */}
              <Animated.View style={{
                position: 'absolute',
                width: 3,
                height: 28,
                transform: [{ rotate: minuteSpin }],
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}>
                <View style={{
                  width: 2,
                  height: 14,
                  backgroundColor: '#F6163C',
                  borderRadius: 1
                }} />
              </Animated.View>

              {/* Second Hand */}
              <Animated.View style={{
                position: 'absolute',
                width: 2,
                height: 34,
                transform: [{ rotate: secondSpin }],
                alignItems: 'center',
                justifyContent: 'flex-start'
              }}>
                <View style={{
                  width: 1,
                  height: 17,
                  backgroundColor: '#E11D48',
                  borderRadius: 0.5
                }} />
              </Animated.View>
            </View>
          </View>

          {/* Title */}
          <Text className="font-sans font-extrabold text-[20px] text-[#1C1C1C] text-center">
            Working Hours
          </Text>
          <Text className="mt-2 text-center font-sans text-[12px] font-normal leading-[18px] text-slate-400 max-w-[85%]">
            Gym operational hours set for members. You can modify these timings inside Club Details.
          </Text>
        </View>

        {/* Timings Details Card */}
        <View className="w-full rounded-[12px] border border-[#E2E8F0] bg-white p-5">
          {/* Weekdays */}
          <View className="py-3 border-b border-slate-100 flex-row items-center">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-slate-50 mr-3">
              <Ionicons name="calendar-outline" size={18} color="#475569" />
            </View>
            <View className="flex-1">
              <Text className="font-sans font-bold text-[14px] text-[#1C1C1C]">{weekdayRange}</Text>
              <Text className="font-sans font-semibold text-[12px] text-[#F6163C] mt-1">
                {openTime} - {closeTime}
              </Text>
            </View>
          </View>

          {/* Weekends */}
          <View className="py-3 flex-row items-center">
            <View className="h-9 w-9 items-center justify-center rounded-lg bg-slate-50 mr-3">
              <Ionicons name="calendar-clear-outline" size={18} color="#475569" />
            </View>
            <View className="flex-1">
              <Text className="font-sans font-bold text-[14px] text-[#1C1C1C]">{weekendRange}</Text>
              <Text className="font-sans font-semibold text-[12px] text-slate-400 mt-1">
                06:00 AM - 08:00 PM
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Edit Timings Button */}
      <View className="absolute bottom-6 left-4 right-4 bg-white py-2">
        <TouchableOpacity
          onPress={() => router.push('/EditClubDetails')}
          activeOpacity={0.8}
          className="flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-md"
        >
          <Ionicons name="create-outline" size={20} color="#FFF" />
          <Text className="font-sans font-bold text-[16px] text-white ml-1">
            Edit Timings
          </Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
