import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';

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
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'space-between', paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}>
        {/* Main Content */}
        <View className="flex-1 items-center justify-center px-4 pt-6">
          {/* Clean 3D Gym Verified Badge Image (No Wires/Lines, White Background) */}
          <View style={styles.badgeWrapper}>
            <Image
              source={require('@/assets/images/gym_verified_badge.jpg')}
              style={styles.badgeImage}
              resizeMode="contain"
            />
          </View>

          {/* Status Pill Badge */}
          <View className="mb-2 flex-row items-center rounded-full border border-rose-200 bg-rose-50 px-4 py-1.5 shadow-sm">
            <Ionicons name="shield-checkmark" size={15} color="#F6163C" style={{ marginRight: 6 }} />
            <Text className="font-bold text-[11px] uppercase tracking-wider text-[#F6163C]">
              Verification Underway
            </Text>
          </View>

          {/* Celebration Heading */}
          <Text className="text-center font-bold text-[24px] text-slate-900 mt-2">
            Details Submitted! 🎉
          </Text>

          {/* Subtitle */}
          <Text className="mt-1.5 text-center text-xs leading-5 text-slate-500 max-w-[320px]">
            Your club details, operating hours, documents and photos have been received for verification.
          </Text>

          {/* Summary Checklist Card */}
          <View className="mt-6 w-full rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
            <Text className="mb-3 font-bold text-[12px] uppercase tracking-wider text-slate-400">
              Completed Registration Steps
            </Text>

            {/* Checklist Item 1: Gym / Club Info */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/80">
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

            <LinearGradient
              colors={['rgba(246, 22, 60, 0)', 'rgba(246, 22, 60, 0.25)', 'rgba(246, 22, 60, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 1, width: '100%', marginVertical: 3 }}
            />

            {/* Checklist Item 2: Operating Schedule */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/80">
                <Ionicons name="time-outline" size={20} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-slate-800">Operating Schedule</Text>
                <Text className="text-[12px] text-slate-500">Opening & closing timings configured</Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            </View>

            <LinearGradient
              colors={['rgba(246, 22, 60, 0)', 'rgba(248, 11, 51, 0.25)', 'rgba(248, 4, 45, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 1, width: '100%', marginVertical: 3 }}
            />

            {/* Checklist Item 3: Govt Verification Documents */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/80">
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

            <LinearGradient
              colors={['rgba(246, 22, 60, 0)', 'rgba(246, 22, 60, 0.25)', 'rgba(246, 22, 60, 0)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: 1, width: '100%', marginVertical: 3 }}
            />

            {/* Checklist Item 4: Club & Facility Photos */}
            <View className="flex-row items-center py-2.5">
              <View className="mr-3.5 h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100/80">
                <Ionicons name="images-outline" size={20} color="#F6163C" />
              </View>
              <View className="flex-1">
                <Text className="font-bold text-[14px] text-slate-800">Club & Facility Photos</Text>
                <Text className="text-[12px] text-slate-500">Showcasing gym equipment & spaces</Text>
              </View>
              <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-50 border border-emerald-200">
                <Ionicons name="checkmark" size={14} color="#10B981" />
              </View>
            </View>
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
    height: 180,
    width: 220,
    alignItems: 'center',
    justifyContent: 'center',

  },
  badgeImage: {
    height: 260,
    width: 300,
  },
});
