import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StatusBar,
  ImageBackground,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGymContracts } from '@/hooks/useGymContracts';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import { GymContractPlan } from '@/api/gymContractApi';

const FALLBACK_PLANS: GymContractPlan[] = [
  {
    duration: 'monthly',
    customerPrice: 2500,
    fitfobCommission: 400,
    ownerPayoutAfterPromotionEnds: 2100,
  },
  {
    duration: 'six_months',
    customerPrice: 13000,
    fitfobCommission: 1500,
    ownerPayoutAfterPromotionEnds: 11500,
  },
  {
    duration: 'twelve_months',
    customerPrice: 25000,
    fitfobCommission: 4000,
    ownerPayoutAfterPromotionEnds: 21000,
  },
];

const formatDurationTitle = (duration: string) => {
  switch (duration?.toLowerCase()) {
    case 'monthly':
    case '1_month':
    case '1month':
      return '1 Month';
    case 'three_months':
    case '3_months':
    case '3months':
      return '3 Months';
    case 'six_months':
    case '6_months':
    case '6months':
      return '6 Months';
    case 'twelve_months':
    case '12_months':
    case '12months':
    case 'annual':
    case 'yearly':
      return '12 Months';
    default:
      return duration ? duration.replace(/_/g, ' ') : 'Standard';
  }
};

/**
 * Ensures the first letter of plan / tier name is capitalized
 * e.g. "basic" -> "Basic", "premium" -> "Premium", "luxury" -> "Luxury"
 */
const capitalizeFirstLetter = (str?: string): string => {
  if (!str) return 'Basic';
  const clean = String(str).trim();
  if (!clean) return 'Basic';
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
};

/**
 * Formats club name with capitalized words
 */
const formatClubName = (name?: string): string => {
  if (!name) return 'FitFob Partner Club';
  const clean = String(name).trim();
  if (!clean) return 'FitFob Partner Club';
  return clean
    .split(/\s+/)
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : ''))
    .join(' ');
};

/**
 * Simple Static Gradient Red Line Divider (FitFob Brand Theme #F6163C)
 * Transparent on both ends with a vibrant red center, exactly matching the reference image.
 */
const GradientRedLine = React.memo(
  ({ height = 1.5, marginVertical = 8 }: { height?: number; marginVertical?: number }) => (
    <View
      style={{
        width: '100%',
        height,
        marginVertical,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <LinearGradient
        colors={['rgba(246, 22, 60, 0)', 'rgba(246, 22, 60, 0.9)', 'rgba(246, 22, 60, 0)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  )
);

/**
 * Animated Skeleton Shimmer Element
 */
const SkeletonBox = ({ style, className }: { style?: any; className?: string }) => {
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750 }),
        withTiming(0.35, { duration: 750 })
      ),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[style, animatedStyle]}
      className={`bg-slate-200 ${className || ''}`}
    />
  );
};

/**
 * Full Screen Skeleton Matching Gym Contracts Layout
 */
const GymContractsSkeleton = () => {
  return (
    <View>
      {/* 1. Hero Contract Card Skeleton */}
      <View
        className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3.5 justify-between shadow-sm"
        style={{ height: 135 }}>
        <SkeletonBox className="h-6 w-32 rounded-[2px]" />

        <View className="flex-row items-center justify-between rounded-xl bg-slate-100 p-2.5 border border-slate-200/60">
          <View className="flex-row items-center flex-1 pr-2">
            <SkeletonBox className="h-5 w-5 rounded-full mr-2" />
            <SkeletonBox className="h-4 w-28 rounded-md" />
          </View>
          <SkeletonBox className="h-7 w-24 rounded-lg" />
        </View>
      </View>

      {/* 2. All Membership Plans Header Skeleton */}
      <View className="flex-row items-center justify-between mb-3 px-1 mt-1">
        <SkeletonBox className="h-3.5 w-44 rounded-md" />
      </View>

      {/* 3. Three Membership Plan Cards Skeletons */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          className="mb-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          {/* Top Row: Duration & Highlighted Payout */}
          <View className="flex-row items-center justify-between pb-2">
            <SkeletonBox className="h-5 w-24 rounded-md" />
            <SkeletonBox className="h-5 w-20 rounded-md" />
          </View>

          {/* Divider Line */}
          <SkeletonBox className="h-[1.5px] w-full my-2 rounded" />

          {/* Breakdown Rows */}
          <View className="pt-2">
            <View className="flex-row items-center justify-between py-1">
              <SkeletonBox className="h-3.5 w-24 rounded-md" />
              <SkeletonBox className="h-3.5 w-16 rounded-md" />
            </View>

            <View className="flex-row items-center justify-between py-1">
              <SkeletonBox className="h-3.5 w-28 rounded-md" />
              <SkeletonBox className="h-3.5 w-14 rounded-md" />
            </View>

            <SkeletonBox className="h-[1.5px] w-full my-1.5 rounded" />

            <View className="flex-row items-center justify-between py-1">
              <SkeletonBox className="h-3.5 w-44 rounded-md" />
              <SkeletonBox className="h-3.5 w-16 rounded-md" />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

export default function GymContractsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contractData, plans, zeroCommissionOffer, isLoading, isRefetching, refetch } = useGymContracts();
  const { profileStatus } = useUserDetail();
  const { data: myOwnerData } = useClubOwnerMe();
  const { user } = useAuthStore();

  const [storedClubName, setStoredClubName] = useState<string | null>(null);
  const [storedCategory, setStoredCategory] = useState<string | null>(null);

  // Load fallback club profile from local storage if needed
  useEffect(() => {
    const loadCachedProfile = async () => {
      try {
        const savedProfile = await AsyncStorage.getItem('club_profile');
        if (savedProfile) {
          const parsed = JSON.parse(savedProfile);
          if (parsed.clubName) setStoredClubName(parsed.clubName);
          if (parsed.clubCategory) setStoredCategory(parsed.clubCategory);
        }
        const savedOwner = await AsyncStorage.getItem('club_owner_me');
        if (savedOwner) {
          const parsedOwner = JSON.parse(savedOwner);
          if (parsedOwner.clubName && !storedClubName) setStoredClubName(parsedOwner.clubName);
          if (parsedOwner.clubCategory && !storedCategory) setStoredCategory(parsedOwner.clubCategory);
        }
      } catch (e) {
        // Silent catch
      }
    };
    loadCachedProfile();
  }, []);

  const pData = profileStatus?.data || profileStatus || {};

  // Comprehensive fallback resolution for Club Name
  const rawClubName =
    contractData?.clubName ||
    myOwnerData?.clubName ||
    myOwnerData?.name ||
    pData?.clubName ||
    pData?.club_name ||
    pData?.clubOwnerDetail?.clubName ||
    pData?.pendingClubOwner?.clubName ||
    user?.clubOwnerDetail?.clubName ||
    user?.clubOwnerDetail?.name ||
    storedClubName ||
    'FitFob Club';

  // Comprehensive fallback resolution for Category Tier
  const rawCategory =
    contractData?.clubCategory ||
    contractData?.category ||
    myOwnerData?.clubCategory ||
    myOwnerData?.category ||
    pData?.clubCategory ||
    pData?.category ||
    pData?.pendingClubOwner?.clubCategory ||
    user?.clubOwnerDetail?.clubCategory ||
    storedCategory ||
    'Basic';

  const formattedClubName = formatClubName(rawClubName);
  const formattedCategory = capitalizeFirstLetter(rawCategory);

  const displayPlans = plans.length > 0 ? plans : FALLBACK_PLANS;
  const isPromoActive = Boolean(zeroCommissionOffer && !zeroCommissionOffer.completed);

  return (
    <View className="flex-1 bg-[#F8FAFC]" style={{ paddingTop: insets.top }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navigation Header - Standard Mobile App Bar */}
      <View className="flex-row items-center justify-between border-b border-slate-200/70  px-4 py-2.5">
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
          <Ionicons name="chevron-back" size={22} color="#0F172A" />
        </TouchableOpacity>

        <View className="flex-1 items-center px-2">
          <Text className="font-bold text-[16px] text-slate-900">
            Gym Contracts
          </Text>
        </View>

        {/* Empty spacer to keep title centered */}
        <View className="h-9 w-9" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: Math.max(insets.bottom, 24) + 30,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
            }}
            colors={['#F6163C']}
            tintColor="#F6163C"
          />
        }>
        {isLoading ? (
          <GymContractsSkeleton />
        ) : (
          <>
            {/* 1. My Active Contract (Hero Gym Contract Card) */}
            <View
              className="mb-5 overflow-hidden rounded-2xl border border-slate-200/90 shadow-md bg-slate-900"
              style={{ height: 135 }}>
              <ImageBackground
                source={require('../assets/images/contract_gym_bg.jpg')}
                resizeMode="cover"
                style={{ width: '100%', height: '100%' }}>
                <View className="flex-1 justify-between p-3.5">
                  {/* Top: My Active Contract (No red dot, borderRadius: 2px, no right-side active badge) */}
                  <View
                    className="self-start bg-black/50 px-2.5 py-1 border border-white/20"
                    style={{ borderRadius: 5 }}>
                    <Text className="text-xs font-semibold text-white">
                      My Active Contract
                    </Text>
                  </View>

                  {/* Bottom Bar: Gym Barbell Icon + Club Name & Plan Tier */}
                  <View className="flex-row items-center justify-between rounded-xl bg-black/60 px-3.5 py-2.5 border border-white/15">
                    <View className="flex-row items-center flex-1 pr-2">
                      <Ionicons name="barbell" size={18} color="#FFFFFF" />
                      <Text
                        className="ml-2 text-[16px] font-extrabold tracking-tight text-white"
                        numberOfLines={1}>
                        {formattedClubName}
                      </Text>
                    </View>

                    <View className="rounded-lg bg-[#F6163C] px-3 py-1.5 shadow-xs">
                      <Text className="text-xs font-extrabold text-white">
                        {formattedCategory} Plan
                      </Text>
                    </View>
                  </View>
                </View>
              </ImageBackground>
            </View>

            {/* 2. ZERO COMMISSION OFFER CARD */}
            {zeroCommissionOffer && (
              <View className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                {/* Header row */}
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="font-bold text-[15px] text-slate-900">
                    Zero Commission Offer
                  </Text>
                  <View
                    className={`rounded-full px-2.5 py-0.5 ${
                      zeroCommissionOffer.completed ? 'bg-slate-100' : 'bg-emerald-100'
                    }`}>
                    <Text
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        zeroCommissionOffer.completed ? 'text-slate-600' : 'text-emerald-700'
                      }`}>
                      {zeroCommissionOffer.completed ? 'Completed' : 'Active'}
                    </Text>
                  </View>
                </View>

                {/* Big Bold Ratio */}
                <Text className="font-extrabold text-[28px] text-slate-900 my-1">
                  {zeroCommissionOffer.usedUserCount} / {zeroCommissionOffer.userLimit}
                </Text>

                {/* Horizontal Progress Bar */}
                <View className="h-2 w-full overflow-hidden rounded-full bg-slate-100 mb-2.5">
                  <View
                    className="h-full rounded-full bg-emerald-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          4,
                          (zeroCommissionOffer.usedUserCount /
                            Math.max(1, zeroCommissionOffer.userLimit)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </View>

                {/* Subtext info */}
                <Text className="text-xs text-slate-500 leading-4">
                  {zeroCommissionOffer.completed
                    ? `Your first ${zeroCommissionOffer.userLimit} eligible clients received zero Fitfob commission.`
                    : `Your first ${zeroCommissionOffer.userLimit} eligible clients receive zero Fitfob commission.`}
                </Text>

                <Text className="text-xs font-semibold text-slate-800 mt-1">
                  {zeroCommissionOffer.completed
                    ? 'Next client: Commission applicable'
                    : `Next client: 0% Commission (${zeroCommissionOffer.remainingUserCount} slots remaining)`}
                </Text>
              </View>
            )}

            {/* 3. ALL MEMBERSHIP PLANS SECTION */}
            <View className="flex-row items-center justify-between mb-3 px-1 mt-1">
              <Text className="font-bold text-[12px] uppercase tracking-wider text-slate-500">
                All Membership Plans ({displayPlans.length})
              </Text>
              {isPromoActive && (
                <View className="flex-row items-center rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5">
                  <View className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" />
                  <Text className="text-[10px] font-bold text-emerald-700">
                    Promo Payouts Active
                  </Text>
                </View>
              )}
            </View>

            {displayPlans.map((plan, index) => {
              const durationTitle = formatDurationTitle(plan.duration);
              const currentPayout = isPromoActive
                ? plan.customerPrice
                : plan.ownerPayoutAfterPromotionEnds;

              return (
                <View
                  key={index}
                  className="mb-3.5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  {/* Card Top Row: Duration & Highlighted Payout */}
                  <View className="flex-row items-center justify-between pb-2">
                    <Text className="font-bold text-[17px] text-slate-900">
                      {durationTitle}
                    </Text>
                    <View className="items-end">
                      <Text className="font-extrabold text-[18px] text-emerald-600">
                        ₹{currentPayout?.toLocaleString('en-IN')}
                      </Text>
                      {isPromoActive && (
                        <Text className="text-[9px] font-bold text-emerald-700">
                          100% Payout (0% Fee)
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Simple Gradient Red Divider Line */}
                  <GradientRedLine height={1.5} marginVertical={8} />

                  {/* Pricing Breakdown Rows */}
                  <View className="pt-2">
                    {/* Customer pays */}
                    <View className="flex-row items-center justify-between py-1">
                      <Text className="text-xs font-medium text-slate-500">
                        Customer pays
                      </Text>
                      <Text className="text-xs font-semibold text-slate-800">
                        ₹{plan.customerPrice?.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Fitfob commission */}
                    <View className="flex-row items-center justify-between py-1">
                      <Text className="text-xs font-medium text-slate-500">
                        Fitfob commission
                      </Text>
                      {isPromoActive ? (
                        <View className="flex-row items-center">
                          <Text className="text-xs font-medium text-slate-400 line-through mr-1.5">
                            ₹{plan.fitfobCommission?.toLocaleString('en-IN')}
                          </Text>
                          <Text className="text-xs font-bold text-emerald-600">- ₹0</Text>
                        </View>
                      ) : (
                        <Text className="text-xs font-semibold text-rose-500">
                          - ₹{plan.fitfobCommission?.toLocaleString('en-IN')}
                        </Text>
                      )}
                    </View>
 

                    {/* Owner payout after promotion ends */}
                    <View className="flex-row items-center justify-between py-1">
                      <Text className="text-xs font-medium text-slate-500">
                        Owner payout after promotion ends
                      </Text>
                      <Text className="text-xs font-bold text-slate-900">
                        ₹{plan.ownerPayoutAfterPromotionEnds?.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}

            {/* 4. FOOTER DISCLAIMER NOTE */}
            <View className="mt-4 px-2 items-center">
              <Text className="text-[11px] text-slate-400 text-center leading-4">
                Illustrative {formattedCategory} tier values under your active FitFob Gym Agreement.
                Gateway fees are not included.
              </Text>

              <TouchableOpacity
                onPress={() => router.push('/ManageBankScreen')}
                activeOpacity={0.7}
                className="mt-3 flex-row items-center">
                <Ionicons name="card-outline" size={13} color="#F6163C" />
                <Text className="ml-1.5 text-xs font-semibold text-[#F6163C]">
                  View Connected Payout Bank Account →
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
