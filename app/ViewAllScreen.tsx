import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { Container } from '@/components/Container';
import { useTodayCheckins } from '@/hooks/useTodayCheckins';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

// Dynamic item sizing for check-in animated list
const ITEM_SIZE = 84;

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

const CheckinItemSkeleton = () => (
  <View className="mb-4 flex-row items-center rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-2xs">
    <SkeletonBox className="h-14 w-14 rounded-2xl" />
    <View className="ml-4 flex-1">
      <SkeletonBox className="h-4 w-32 rounded-md mb-2" />
      <SkeletonBox className="h-3 w-20 rounded-md" />
    </View>
    <SkeletonBox className="h-7 w-20 rounded-full" />
  </View>
);

const CheckinItem = ({ item, index, scrollY, onSelect }: any) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const animatedStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * ITEM_SIZE,
      index * ITEM_SIZE,
      (index + 1) * ITEM_SIZE,
    ];

    const scale = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 0.92],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      inputRange,
      [1, 1, 0.65],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      inputRange,
      [0, 0, -12],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const hasValidImage = Boolean(item.image && !imageError);

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onSelect(item)}
        className="mb-4 flex-row items-center rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-2xs">
        {/* User Avatar with Skeleton while loading */}
        <View className="relative h-14 w-14 overflow-hidden rounded-2xl bg-slate-100 items-center justify-center">
          {!imageLoaded && hasValidImage && (
            <SkeletonBox style={StyleSheet.absoluteFill} />
          )}
          <Image
            source={
              hasValidImage
                ? { uri: item.image }
                : require('../assets/images/fitfob_profile.png')
            }
            className="h-14 w-14 rounded-2xl"
            resizeMode="cover"
            onLoad={() => setImageLoaded(true)}
            onLoadEnd={() => setImageLoaded(true)}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </View>

        {/* User Details */}
        <View className="ml-4 flex-1">
          <View className="flex-row items-center">
            <Text className="mr-1 font-bold text-[15px] text-slate-900">{item.name}</Text>
            {item.verified && (
              <Image className="h-4 w-4" source={require('../assets/images/tick.png')} />
            )}
          </View>
          <Text className="mt-0.5 font-medium text-xs text-slate-400">{item.time}</Text>
        </View>

        {/* Membership Badge with Image */}
        <View
          style={{
            backgroundColor: `${item.color}15`,
            borderColor: `${item.color}25`,
            width: 90,
          }}
          className="flex-row items-center justify-center rounded-full border py-1.5">
          <Image
            source={
              item.type === 'Luxury'
                ? require('../assets/images/luxury.png')
                : item.type === 'Premium'
                  ? require('../assets/images/premium.png')
                  : require('../assets/images/standardicon.png')
            }
            style={{ width: 14, height: 14 }}
            resizeMode="contain"
          />
          <Text style={{ color: item.color }} className="ml-1.5 font-bold text-[11px]">
            {item.type}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const ViewAllScreen = () => {
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const { checkins: allCheckins, isLoading, refetch } = useTodayCheckins();

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Reset scroll offset on search change to prevent index interpolation bounds crash
  // Auto-refresh when returning to view all screen
  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const [filterType, setFilterType] = useState<'all' | 'local' | 'outdoor'>('all');

  const counts = useMemo(() => {
    const list = allCheckins || [];
    const local = list.filter((i) =>
      (i.subscriptionType || i.type || '').toLowerCase().includes('local')
    ).length;
    const outdoor = list.filter((i) =>
      (i.subscriptionType || i.type || '').toLowerCase().includes('outdoor')
    ).length;
    return {
      all: list.length,
      local,
      outdoor,
    };
  }, [allCheckins]);

  const filteredData = (allCheckins || []).filter((item) => {
    const searchLower = search.toLowerCase().trim();
    const matchesSearch =
      !searchLower ||
      item.name.toLowerCase().includes(searchLower) ||
      item.clientId.toLowerCase().includes(searchLower);

    const subType = (item.subscriptionType || item.type || '').toLowerCase();
    let matchesFilter = true;
    if (filterType === 'local') {
      matchesFilter = subType.includes('local');
    } else if (filterType === 'outdoor') {
      matchesFilter = subType.includes('outdoor');
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <Container>
      {/* --- HEADER --- */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}
        className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-medium text-base leading-6 text-[#697281]">Recent Check-ins</Text>

        <TouchableOpacity className="p-2">
          <Ionicons name="notifications" size={24} color="#F6163C" />
        </TouchableOpacity>
      </View>

      {/* --- PREMIUM INTERACTIVE SEARCH BAR --- */}
      <View className="mb-3">
        {/* Search Input Bar */}
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-sm shadow-slate-100">
          <Ionicons name="search" size={20} color="#F6163C" />
          <TextInput
            placeholder="Search members by name or ID..."
            placeholderTextColor="#94A3B8"
            className="ml-3 h-11 flex-1 font-medium text-slate-800 text-sm"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 ? (
            <TouchableOpacity
              onPress={() => setSearch('')}
              activeOpacity={0.7}
              className="rounded-full bg-slate-100 p-1.5">
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          ) : (
            <View className="rounded-full border border-rose-100 bg-rose-50 px-2.5 py-1">
              <Text className="font-bold text-[11px] text-[#F6163C]">
                {filteredData.length} {filteredData.length === 1 ? 'member' : 'members'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* --- ATTRACTIVE SEGMENTED SWITCH FILTER BAR --- */}
      <View className="mb-4">
        <View className="flex-row items-center rounded-2xl bg-slate-100/90 p-1 border border-slate-200/60 shadow-xs">
          {/* ALL OPTION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterType('all')}
            style={
              filterType === 'all'
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              filterType === 'all'
                ? 'border-slate-200/70'
                : 'border-transparent'
            }`}>
            <Ionicons
              name={filterType === 'all' ? 'grid' : 'grid-outline'}
              size={13}
              color={filterType === 'all' ? '#F6163C' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs ${
                filterType === 'all' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}>
              All
            </Text>
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                filterType === 'all' ? 'bg-rose-50 border border-rose-100' : 'bg-slate-200/70'
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  filterType === 'all' ? 'text-[#F6163C]' : 'text-slate-500'
                }`}>
                {counts.all}
              </Text>
            </View>
          </TouchableOpacity>

          {/* LOCAL OPTION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterType('local')}
            style={
              filterType === 'local'
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#3B82F6',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              filterType === 'local'
                ? 'border-blue-100'
                : 'border-transparent'
            }`}>
            <Ionicons
              name={filterType === 'local' ? 'home' : 'home-outline'}
              size={13}
              color={filterType === 'local' ? '#3B82F6' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs ${
                filterType === 'local' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}>
              Local
            </Text>
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                filterType === 'local' ? 'bg-blue-50 border border-blue-100' : 'bg-slate-200/70'
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  filterType === 'local' ? 'text-[#3B82F6]' : 'text-slate-500'
                }`}>
                {counts.local}
              </Text>
            </View>
          </TouchableOpacity>

          {/* OUTDOOR OPTION */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => setFilterType('outdoor')}
            style={
              filterType === 'outdoor'
                ? {
                    backgroundColor: '#FFFFFF',
                    shadowColor: '#10B981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 4,
                    elevation: 2,
                  }
                : {}
            }
            className={`flex-1 flex-row items-center justify-center py-2 rounded-xl border ${
              filterType === 'outdoor'
                ? 'border-emerald-100'
                : 'border-transparent'
            }`}>
            <Ionicons
              name={filterType === 'outdoor' ? 'compass' : 'compass-outline'}
              size={13}
              color={filterType === 'outdoor' ? '#10B981' : '#64748B'}
            />
            <Text
              className={`ml-1.5 text-xs ${
                filterType === 'outdoor' ? 'font-bold text-slate-900' : 'font-medium text-slate-500'
              }`}>
              Outdoor
            </Text>
            <View
              className={`ml-1.5 px-1.5 py-0.5 rounded-full ${
                filterType === 'outdoor' ? 'bg-emerald-50 border border-emerald-100' : 'bg-slate-200/70'
              }`}>
              <Text
                className={`text-[10px] font-bold ${
                  filterType === 'outdoor' ? 'text-[#10B981]' : 'text-slate-500'
                }`}>
                {counts.outdoor}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* --- RECENT CHECK-INS LIST / LOADING STATE --- */}
      {isLoading ? (
        <View className="py-2">
          <CheckinItemSkeleton />
          <CheckinItemSkeleton />
          <CheckinItemSkeleton />
          <CheckinItemSkeleton />
        </View>
      ) : (
        <Animated.FlatList
          data={filteredData}
          keyExtractor={(item, index) => item.id + index}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListEmptyComponent={
            <View className="items-center justify-center py-4">
              <Image
                source={require('../assets/images/view_all_empty.png')}
                className="h-80 w-80"
                resizeMode="contain"
              />
              <Text className="mt-1 text-center font-bold text-lg text-slate-900">
                No Check-in History Found
              </Text>
              <Text className="mt-1 px-8 text-center text-[13px] leading-5 text-slate-500">
                {search.length > 0
                  ? 'No check-ins match your search criteria.'
                  : filterType !== 'all'
                    ? `No ${filterType === 'local' ? 'Local' : 'Outdoor'} check-ins found for today.`
                    : 'All member check-in activities will be logged and listed right here.'}
              </Text>
              {(search.length > 0 || filterType !== 'all') && (
                <TouchableOpacity
                  onPress={() => {
                    setSearch('');
                    setFilterType('all');
                  }}
                  className="mt-4 rounded-full bg-[#F6163C] px-5 py-2.5 shadow-sm">
                  <Text className="font-semibold text-sm text-white">Reset Filters</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item, index }) => (
            <CheckinItem
              item={item}
              index={index}
              scrollY={scrollY}
              onSelect={(selected: any) => setSelectedMember({ ...selected, verified: true })}
            />
          )}
        />
      )}

      {/* --- MEMBER DETAIL BOTTOM SHEET --- */}
      <Modal
        visible={Boolean(selectedMember)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMember(null)} />
          {selectedMember && (
            <View style={styles.bottomSheet}>
              {/* Drag handle */}
              <View style={styles.dragHandle} />

              {/* Header with Close */}
              <View style={styles.sheetHeader}>
                <Text style={styles.sheetTitle}>Member Profile</Text>
                <TouchableOpacity onPress={() => setSelectedMember(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={styles.sheetContent}>
                {/* Top row: Avatar & basic info */}
                <View style={styles.profileHeader}>
                  <Image
                    source={
                      selectedMember?.image
                        ? { uri: selectedMember.image }
                        : require('../assets/images/fitfob_profile.png')
                    }
                    style={styles.largeAvatar}
                  />
                  <View style={styles.profileMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.profileName}>{selectedMember?.name || 'Member'}</Text>
                      {selectedMember?.verified && (
                        <Image
                          style={styles.checkIcon}
                          source={require('../assets/images/tick.png')}
                        />
                      )}
                    </View>
                    <Text style={styles.profileTime}>Checked in: {selectedMember?.time}</Text>

                    {/* Badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: `${selectedMember?.color || '#F6163C'}15`,
                          borderColor: `${selectedMember?.color || '#F6163C'}25`,
                        },
                      ]}>
                      <Image
                        source={
                          selectedMember?.type === 'Luxury'
                            ? require('../assets/images/luxury.png')
                            : selectedMember?.type === 'Premium'
                              ? require('../assets/images/premium.png')
                              : require('../assets/images/standardicon.png')
                        }
                        style={{ width: 12, height: 12 }}
                        resizeMode="contain"
                      />
                      <Text
                        style={[
                          styles.badgeText,
                          { color: selectedMember?.color || '#F6163C' },
                        ]}>
                        {selectedMember?.type} Member
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Detailed Parameters - Real Check-in Details */}
                <View style={styles.detailsList}>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {selectedMember?.clientEmail || selectedMember?.email || 'Not provided'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="time-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Check-in Time</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember?.time || 'Today'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="ribbon-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Subscription</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember?.subscriptionType || selectedMember?.type || 'Standard'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={[styles.detailLabel, { color: '#10B981', fontWeight: 'bold' }]}>
                        Status
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Checked In</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom button */}
                <View style={styles.footerBtns}>
                  <TouchableOpacity
                    onPress={() => setSelectedMember(null)}
                    style={styles.primaryBtn}
                    activeOpacity={0.8}>
                    <Text style={styles.primaryBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 15,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  sheetContent: {
    marginTop: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  profileMeta: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  checkIcon: {
    width: 18,
    height: 18,
    marginLeft: 6,
  },
  profileTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  detailsList: {
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: 'bold',
  },
  footerBtns: {
    marginTop: 24,
  },
  primaryBtn: {
    backgroundColor: '#F6163C',
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ViewAllScreen;
