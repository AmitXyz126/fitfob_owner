import { useState, useEffect } from 'react';
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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Container } from '@/components/Container';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

const ALL_CHECKINS = [
  {
    id: '1',
    name: 'Tina Sharma',
    time: '10 minutes ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=tina',
    color: '#94A3B8',
    verified: true,
  },
  {
    id: '2',
    name: 'Amelia Thomas',
    time: '1 hour and 10 minutes ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=amelia',
    color: '#EAB308',
    verified: true,
  },
  {
    id: '3',
    name: 'Sophia Lee',
    time: '35 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=sophia',
    color: '#F6163C',
    verified: true,
  },
  {
    id: '4',
    name: 'Liam Brown',
    time: '20 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=liam',
    color: '#F6163C',
    verified: true,
  },
  {
    id: '5',
    name: 'Noah Martinez',
    time: '45 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=noah1',
    color: '#F6163C',
    verified: true,
  },
  {
    id: '6',
    name: 'Noah Martinez',
    time: '45 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=noah2',
    color: '#F6163C',
    verified: true,
  },
];

const ITEM_SIZE = 84;

const CheckinItem = ({ item, index, scrollY, onSelect }: any) => {
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

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => onSelect(item)}
        className="mb-4 flex-row items-center rounded-2xl border border-[#E5E7EB] bg-white p-3.5 shadow-2xs">
        {/* User Avatar */}
        <Image source={{ uri: item.image }} className="h-14 w-14 rounded-2xl bg-slate-100" />

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
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Reset scroll offset on filter/search change to prevent index interpolation bounds crash
  useEffect(() => {
    scrollY.value = 0;
  }, [selectedCategory, search, scrollY]);

  const filteredData = ALL_CHECKINS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || item.type.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
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

      {/* --- PREMIUM INTERACTIVE SEARCH BAR & CATEGORY FILTERS --- */}
      <View className="mb-5">
        {/* Search Input Bar */}
        <View className="flex-row items-center rounded-2xl border border-slate-200 bg-white px-4 py-1 shadow-sm shadow-slate-100">
          <Ionicons name="search" size={20} color="#F6163C" />
          <TextInput
            placeholder="Search members by name..."
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

        {/* Quick Category Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-1 mt-3 px-1 flex-row">
          {['All', 'Luxury', 'Premium', 'Standard'].map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.7}
                className={`mr-2 rounded-full border px-4 py-2 ${
                  isSelected
                    ? 'border-[#F6163C] bg-[#F6163C]'
                    : 'border-slate-200 bg-white'
                }`}>
                <Text
                  className={`font-semibold text-xs ${
                    isSelected ? 'text-white' : 'text-slate-600'
                  }`}>
                  {cat === 'All' ? 'All Passes' : cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* --- RECENT CHECK-INS LIST WITH STACKING CARD SCROLL ANIMATION --- */}
      <Animated.FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.id + index}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-rose-50">
              <Ionicons name="search-outline" size={32} color="#F6163C" />
            </View>
            <Text className="font-bold text-base text-slate-800">No members found</Text>
            <Text className="mt-1 text-center text-xs text-slate-400">
              No check-ins match your search criteria.
            </Text>
            <TouchableOpacity
              onPress={() => {
                setSearch('');
                setSelectedCategory('All');
              }}
              className="mt-4 rounded-full bg-[#F6163C] px-5 py-2">
              <Text className="font-semibold text-xs text-white">Reset Filters</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item, index }) => (
          <CheckinItem
            item={item}
            index={index}
            scrollY={scrollY}
            onSelect={(selected: any) => setSelectedMember(selected)}
          />
        )}
      />

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
                  <Image source={{ uri: selectedMember?.image }} style={styles.largeAvatar} />
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

                {/* Detailed Parameters */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="card-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Member ID</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      FF-MEMBER-00{selectedMember?.id || '0'}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember?.name?.toLowerCase().replace(/\s+/g, '') || 'member'}
                      @gmail.com
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="phone-portrait-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      +91 98765 {43210 + (parseInt(selectedMember?.id || '1') || 1)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="calendar-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Renewal Date</Text>
                    </View>
                    <Text style={styles.detailValue}>15 Dec 2026</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={[styles.detailLabel, { color: '#10B981', fontWeight: 'bold' }]}>
                        Status
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Active</Text>
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
