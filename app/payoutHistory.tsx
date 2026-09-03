import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
  TouchableWithoutFeedback,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  ChevronLeft,
  Bell,
  Download,
  SlidersHorizontal,
  RefreshCw,
  Clock,
  FilterX,
  X,
  Sparkles,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

const ITEM_SIZE = 80;

// DUMMY PAYOUT HISTORY DATA (COMMENTED OUT FOR LIVE DATA / EMPTY STATE)
/*
const DUMMY_PAYOUT_HISTORY = [
  { id: '1', date: 'Jan 26, 2026', rawDate: '2026-01-26', amountDisplay: '85,000', amountVal: 85000, status: 'Paid Out', year: '2026' },
  { id: '2', date: 'Dec 25, 2025', rawDate: '2025-12-25', amountDisplay: '70,000', amountVal: 70000, status: 'Paid Out', year: '2025' },
  { id: '3', date: 'Nov 25, 2025', rawDate: '2025-11-25', amountDisplay: '65,000', amountVal: 65000, status: 'Paid Out', year: '2025' },
  { id: '4', date: 'Oct 25, 2025', rawDate: '2025-10-25', amountDisplay: '85,000', amountVal: 85000, status: 'Paid Out', year: '2025' },
  { id: '5', date: 'Sep 25, 2025', rawDate: '2025-09-25', amountDisplay: '60,000', amountVal: 60000, status: 'Processing', year: '2025' },
  { id: '6', date: 'Aug 25, 2025', rawDate: '2025-08-25', amountDisplay: '55,000', amountVal: 55000, status: 'Paid Out', year: '2025' },
  { id: '7', date: 'July 25, 2025', rawDate: '2025-07-25', amountDisplay: '45,000', amountVal: 45000, status: 'Paid Out', year: '2025' },
  { id: '8', date: 'June 20, 2025', rawDate: '2025-06-20', amountDisplay: '50,000', amountVal: 50000, status: 'Pending', year: '2025' },
];
*/

const ALL_PAYOUT_HISTORY: any[] = [];

const PayoutHistoryItem = ({
  item,
  index,
  scrollY,
}: {
  item: any;
  index: number;
  scrollY: SharedValue<number>;
}) => {
  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 0.94],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 0.7],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [0, 0, -10],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View className="mb-3 flex-row items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white p-4">
        <View>
          <Text className="mb-1 font-medium font-sans text-xs text-[#1C1C1C]">{item.date}</Text>
          <Text className="font-bold text-lg text-gray-800">₹{item.amountDisplay}</Text>
        </View>
        <View className="flex-row items-center rounded-lg bg-gray-50 px-3 py-1.5">
          {item.status === 'Paid Out' && (
            <Image
              source={require('../assets/images/tick.png')}
              style={{ width: 16, height: 16 }}
              resizeMode="contain"
            />
          )}
          {item.status === 'Processing' && <RefreshCw size={14} color="#F59E0B" />}
          {item.status === 'Pending' && <Clock size={14} color="#6B7280" />}
          <Text className="ml-1.5 text-[14px] font-normal text-black">{item.status}</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const EmptyPayoutIllustration = () => {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, [floatAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value }],
  }));

  return (
    <View className="items-center justify-center py-2 px-4">
      <Animated.View style={animatedStyle} className="items-center justify-center">
        <Image
          source={require('../assets/images/payout_empty.png')}
          style={{ width: 340, height: 290 }}
          resizeMode="contain"
        />
      </Animated.View>
      <Text className="mt-3 text-center font-bold text-lg text-slate-900">
        No Payout History Yet
      </Text>
      <Text className="mt-1.5 px-6 text-center text-xs leading-5 text-slate-500">
        Your earnings, scheduled bank settlements, and completed transactions will be listed here automatically.
      </Text>
    </View>
  );
};

const PayoutHistory = () => {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Upcoming Payout Card Background Animations
  const orb1TranslateX = useSharedValue(0);
  const orb1TranslateY = useSharedValue(0);
  const orb2TranslateX = useSharedValue(0);
  const orb2TranslateY = useSharedValue(0);
  const shimmerTranslateX = useSharedValue(-250);
  const progressBarWidth = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Floating Glowing Orb 1
    orb1TranslateX.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-20, { duration: 3600, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb1TranslateY.value = withRepeat(
      withSequence(
        withTiming(-18, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(18, { duration: 3400, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Floating Glowing Orb 2
    orb2TranslateX.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 3800, easing: Easing.inOut(Easing.ease) }),
        withTiming(20, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    orb2TranslateY.value = withRepeat(
      withSequence(
        withTiming(20, { duration: 3200, easing: Easing.inOut(Easing.ease) }),
        withTiming(-15, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Continuous Shimmer Light Scan Sweep
    shimmerTranslateX.value = withRepeat(
      withTiming(450, { duration: 2800, easing: Easing.linear }),
      -1,
      false
    );

    // Smooth Spring Fill for Range Bar
    progressBarWidth.value = withTiming(0.8, {
      duration: 1400,
      easing: Easing.out(Easing.quad),
    });

    // Thumb Pulse Animation
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.4, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const orb1AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1TranslateX.value },
      { translateY: orb1TranslateY.value },
    ],
  }));

  const orb2AnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2TranslateX.value },
      { translateY: orb2TranslateY.value },
    ],
  }));

  const shimmerAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shimmerTranslateX.value }],
  }));

  const progressAnimStyle = useAnimatedStyle(() => ({
    width: `${progressBarWidth.value * 100}%`,
  }));

  const thumbAnimStyle = useAnimatedStyle(() => ({
    left: `${progressBarWidth.value * 100 - 2}%`,
  }));

  const pulseAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  // Filter States
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Newest');

  // Modal Temp States
  const [tempYear, setTempYear] = useState('All');
  const [tempStatus, setTempStatus] = useState('All');
  const [tempSort, setTempSort] = useState('Newest');

  const openFilterModal = () => {
    setTempYear(selectedYear);
    setTempStatus(selectedStatus);
    setTempSort(selectedSort);
    setShowFilterModal(true);
  };

  const applyFilters = () => {
    setSelectedYear(tempYear);
    setSelectedStatus(tempStatus);
    setSelectedSort(tempSort);
    setShowFilterModal(false);
  };

  const clearAllFilters = () => {
    setTempYear('All');
    setTempStatus('All');
    setTempSort('Newest');
  };

  const isFilterActive =
    selectedYear !== 'All' || selectedStatus !== 'All' || selectedSort !== 'Newest';

  const filteredData = useMemo(() => {
    let result = [...ALL_PAYOUT_HISTORY];

    if (selectedYear !== 'All') {
      result = result.filter((item) => item.year === selectedYear);
    }

    if (selectedStatus !== 'All') {
      result = result.filter((item) => item.status === selectedStatus);
    }

    if (selectedSort === 'Newest') {
      result.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
    } else if (selectedSort === 'Oldest') {
      result.sort((a, b) => a.rawDate.localeCompare(b.rawDate));
    } else if (selectedSort === 'HighAmount') {
      result.sort((a, b) => b.amountVal - a.amountVal);
    } else if (selectedSort === 'LowAmount') {
      result.sort((a, b) => a.amountVal - b.amountVal);
    }

    return result;
  }, [selectedYear, selectedStatus, selectedSort]);

  return (
    <Container>
      <View>
        {/* Top Nav */}
        <View className="flex-row items-center justify-between py-2">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ChevronLeft color="black" size={24} />
          </TouchableOpacity>
          <Text className="font-sans font-semibold text-base text-[#697281]">Payout Status</Text>
          <TouchableOpacity className="p-1">
            <Bell color="#EF4444" size={24} fill="#EF4444" />
          </TouchableOpacity>
        </View>

        {/* Upcoming Payout Card with Next-Level Animated Background & Range */}
        <View className="relative mt-2 overflow-hidden rounded-3xl border border-rose-200/80 bg-white p-5 shadow-lg shadow-rose-100/50">
          {/* Soft Gradient Background */}
          <LinearGradient
            colors={['#FFFFFF', '#FFF1F2', '#FEF2F2', '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />

          {/* Background Floating Animated Glowing Orbs */}
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: -30,
                right: -30,
                width: 170,
                height: 170,
                borderRadius: 85,
                backgroundColor: '#FECDD3',
                opacity: 0.6,
              },
              orb1AnimStyle,
            ]}
          />
          <Animated.View
            style={[
              {
                position: 'absolute',
                bottom: -40,
                left: -20,
                width: 190,
                height: 190,
                borderRadius: 95,
                backgroundColor: '#FFE4E6',
                opacity: 0.7,
              },
              orb2AnimStyle,
            ]}
          />

          {/* Card Content */}
          <View className="relative z-10">
            {/* Top Info Row */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="mr-2 h-2.5 w-2.5 rounded-full bg-[#EF4444]" />
                <Text className="font-semibold text-sm tracking-wide text-gray-700">
                  Upcoming Payout
                </Text>
              </View>
              <View className="flex-row items-center">
                <View className="flex-row items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1">
                  <Sparkles size={12} color="#059669" />
                  <Text className="ml-1 font-bold text-[11px] text-emerald-700">Processing (80%)</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/DownloadScreen')}
                  activeOpacity={0.7}
                  className="ml-2 rounded-full border border-gray-200 bg-white p-2 shadow-sm">
                  <Download size={17} color="#475569" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Payout Amount */}
            <View className="my-3 flex-row items-baseline justify-between">
              <Text className="font-extrabold text-4xl tracking-tight text-gray-900">₹2,40,000</Text>
              <Text className="font-medium text-xs text-gray-500">Limit: ₹3,00,000</Text>
            </View>

            {/* Animated Range Bar Section */}
            <View className="relative my-3">
              {/* Range Bar Track */}
              <View className="h-3.5 w-full overflow-hidden rounded-full border border-rose-200/60 bg-rose-50/80">
                <Animated.View style={[{ height: '100%', borderRadius: 9999 }, progressAnimStyle]}>
                  <LinearGradient
                    colors={['#EF4444', '#F43F5E', '#FB7185']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: '100%', height: '100%' }}
                  />
                </Animated.View>
              </View>

              {/* Pulsing Thumb Indicator */}
              <Animated.View
                style={[
                  {
                    position: 'absolute',
                    top: -3,
                    width: 20,
                    height: 20,
                    justifyContent: 'center',
                    alignItems: 'center',
                  },
                  thumbAnimStyle,
                ]}>
                <Animated.View
                  style={[
                    {
                      position: 'absolute',
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      backgroundColor: '#EF4444',
                      opacity: 0.35,
                    },
                    pulseAnimStyle,
                  ]}
                />
                <View className="h-4 w-4 rounded-full border-2 border-white bg-[#EF4444] shadow-md" />
              </Animated.View>
            </View>

            {/* Range Percentage & Milestone Info */}
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Text className="text-xs font-semibold text-gray-500">Completed: </Text>
                <Text className="text-xs font-bold text-gray-900">80%</Text>
              </View>
              <View className="flex-row items-center">
                <Text className="text-xs font-semibold text-gray-500">Est. Release: </Text>
                <Text className="text-xs font-bold text-emerald-600">Jan 31</Text>
              </View>
            </View>

            <Button
              className="mt-4 bg-[#EF4444]"
              title={'Withdrawal'}
              onPress={() => router.push('/ManageBankScreen')}
            />
          </View>
        </View>

        {/* List Title & Filter Button */}
        <View className="mb-4 mt-8 flex-row items-center justify-between">
          <Text className="font-medium font-sans text-base leading-6 text-[#1C1C1C]">
            Payout history
          </Text>
          <TouchableOpacity
            onPress={openFilterModal}
            activeOpacity={0.7}
            className={`flex-row items-center rounded-full border px-4 py-2.5 ${
              isFilterActive ? 'border-[#EF4444] bg-red-50' : 'border-gray-200 bg-white'
            }`}>
            <SlidersHorizontal size={17} color={isFilterActive ? '#EF4444' : '#1C1C1C'} />
            <Text
              className={`ml-2 font-medium text-sm ${
                isFilterActive ? 'text-[#EF4444]' : 'text-[#1C1C1C]'
              }`}>
              {isFilterActive ? 'Filter (Active)' : 'Filter'}
            </Text>
            {isFilterActive && <View className="ml-1.5 h-2 w-2 rounded-full bg-[#EF4444]" />}
          </TouchableOpacity>
        </View>
      </View>

      <Animated.FlatList
        className="flex-1"
        data={filteredData}
        keyExtractor={(item) => item.id}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        }}
        ListEmptyComponent={<EmptyPayoutIllustration />}
        renderItem={({ item, index }) => (
          <PayoutHistoryItem item={item} index={index} scrollY={scrollY} />
        )}
      />

      {/* Filter Bottom Sheet Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}>
        <TouchableWithoutFeedback onPress={() => setShowFilterModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Pull Handle */}
                <View style={styles.pullHandle} />

                {/* Modal Header */}
                <View className="mb-4 flex-row items-center justify-between">
                  <Text className="font-bold text-xl text-slate-900">Filter Payouts</Text>
                  <TouchableOpacity onPress={clearAllFilters} activeOpacity={0.7}>
                    <Text className="font-bold text-sm text-[#EF4444]">Clear All</Text>
                  </TouchableOpacity>
                </View>

                {/* Scrollable Filter Options */}
                <ScrollView showsVerticalScrollIndicator={false} className="max-h-[360px]">
                  {/* Filter by Year */}
                  <View className="mb-5">
                    <Text className="mb-3 font-bold text-xs uppercase tracking-wider text-slate-400">
                      Year / Time Period
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[
                        { label: 'All Time', value: 'All' },
                        { label: '2026', value: '2026' },
                        { label: '2025', value: '2025' },
                      ].map((yearOpt) => {
                        const isSelected = tempYear === yearOpt.value;
                        return (
                          <TouchableOpacity
                            key={yearOpt.value}
                            onPress={() => setTempYear(yearOpt.value)}
                            activeOpacity={0.7}
                            style={isSelected ? styles.pillActive : styles.pillInactive}
                            className="rounded-full border px-4 py-2">
                            <Text
                              style={isSelected ? styles.pillTextActive : styles.pillTextInactive}
                              className="font-semibold text-xs">
                              {yearOpt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Filter by Status */}
                  <View className="mb-5">
                    <Text className="mb-3 font-bold text-xs uppercase tracking-wider text-slate-400">
                      Payout Status
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[
                        { label: 'All Statuses', value: 'All' },
                        { label: 'Paid Out', value: 'Paid Out' },
                        { label: 'Processing', value: 'Processing' },
                        { label: 'Pending', value: 'Pending' },
                      ].map((statusOpt) => {
                        const isSelected = tempStatus === statusOpt.value;
                        return (
                          <TouchableOpacity
                            key={statusOpt.value}
                            onPress={() => setTempStatus(statusOpt.value)}
                            activeOpacity={0.7}
                            style={isSelected ? styles.pillActive : styles.pillInactive}
                            className="rounded-full border px-4 py-2">
                            <Text
                              style={isSelected ? styles.pillTextActive : styles.pillTextInactive}
                              className="font-semibold text-xs">
                              {statusOpt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Sort By */}
                  <View className="mb-4">
                    <Text className="mb-3 font-bold text-xs uppercase tracking-wider text-slate-400">
                      Sort By
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {[
                        { label: 'Newest First', value: 'Newest' },
                        { label: 'Oldest First', value: 'Oldest' },
                        { label: 'Highest Amount', value: 'HighAmount' },
                        { label: 'Lowest Amount', value: 'LowAmount' },
                      ].map((sortOpt) => {
                        const isSelected = tempSort === sortOpt.value;
                        return (
                          <TouchableOpacity
                            key={sortOpt.value}
                            onPress={() => setTempSort(sortOpt.value)}
                            activeOpacity={0.7}
                            style={isSelected ? styles.pillActive : styles.pillInactive}
                            className="rounded-full border px-4 py-2">
                            <Text
                              style={isSelected ? styles.pillTextActive : styles.pillTextInactive}
                              className="font-semibold text-xs">
                              {sortOpt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </ScrollView>

                {/* Fixed Footer with Apply Button */}
                <View className="pt-3 border-t border-gray-100">
                  <TouchableOpacity
                    onPress={applyFilters}
                    activeOpacity={0.8}
                    className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-primary">
                    <Text className="font-bold text-base text-white">Apply Filters</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
  },
  pullHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  pillActive: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  pillInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  pillTextActive: {
    color: '#EF4444',
  },
  pillTextInactive: {
    color: '#475569',
  },
});

export default PayoutHistory;
