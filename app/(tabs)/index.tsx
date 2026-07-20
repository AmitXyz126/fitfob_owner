/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, Platform, Modal, StyleSheet, Pressable } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import Toast from 'react-native-toast-message';

const RECENT_CHECKINS = [
  {
    id: '1',
    name: 'Tina Sharma',
    time: '10 mins ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=tina',
    color: '#94A3B8',
  },
  {
    id: '2',
    name: 'Amelia Thomas',
    time: '1 hr ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=amelia',
    color: '#EAB308',
  },
  {
    id: '3',
    name: 'Sophia Lee',
    time: '35 mins ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=sophia',
    color: '#F6163C',
  },
  {
    id: '4',
    name: 'Liam Brown',
    time: '20 mins ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=liam',
    color: '#F6163C',
  },
  {
    id: '5',
    name: 'Rahul Dev',
    time: '45 mins ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=rahul',
    color: '#94A3B8',
  },
  {
    id: '6',
    name: 'Zoya Khan',
    time: '50 mins ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=zoya',
    color: '#EAB308',
  },
];

const HomeScreen = () => {
  const router = useRouter();
  const { profileStatus } = useUserDetail();
  const { user } = useAuthStore();
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const getDisplayName = () => {
    const rawName = profileStatus?.ownerName || user?.username || 'User';
    const namePart = rawName.includes('@') ? rawName.split('@')[0] : rawName;
    if (/^\+?[0-9]+$/.test(namePart)) {
      return 'User';
    }
    const cleanedName = namePart
      .replace(/[0-9]/g, '')
      .replace(/[._-]/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return cleanedName || 'User';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 16) return 'Good Afternoon';
    if (hour < 20) return 'Good Evening';
    return 'Good Night';
  };

  const ownerName = getDisplayName();
  const truncatedOwnerName = ownerName.length > 6 ? `${ownerName.slice(0, 6)}...` : ownerName;
  const clubName = profileStatus?.clubName || 'Fitfob fitness Club';
  const logoUrl = profileStatus?.logoUrl || null;
  const greeting = getGreeting();

  return (
    <Container style={{ paddingBottom: 0 }}>
      <View style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}>
        {/* Header */}
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.push('/clubProfile')}>
              <Image
                className="h-12 w-12 rounded-full"
                source={
                  logoUrl
                    ? { uri: logoUrl }
                    : require('../../assets/images/fitfob_profile.png')
                }
                resizeMode={logoUrl ? 'cover' : 'contain'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={ownerName.length > 6 ? 0.7 : 1}
              onPress={() => {
                if (ownerName.length > 6) {
                  Toast.show({
                    type: 'info',
                    text1: 'Club Owner',
                    text2: ownerName,
                    position: 'top',
                  });
                }
              }}
              className="ml-3">
              <Text className="text-[12px] font-normal  text-[#1C1C1C]">
                Welcome to {clubName}
              </Text>
              <Text className="font-bold text-xl text-slate-900">{greeting}, {truncatedOwnerName}</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => router.push('/notification')}
              style={{ elevation: 2 }}
              className="rounded-full border border-white bg-white p-2 shadow-sm">
              <Ionicons name="notifications" size={20} color="#F6163C" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/chat')}
              className="rounded-full border border-slate-100 bg-white p-2 shadow-sm">
              <Ionicons name="paper-plane" size={20} color="#F6163C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Earnings Card */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/payoutHistory')}>
          <LinearGradient
            colors={['#F6163C', '#FF8FA3']}
            start={{ x: 0, y: 0 }}
            end={{ x: 2, y: 2 }}
            style={{ borderRadius: 16, overflow: 'hidden' }}
            className="relative mb-6 shadow-xl shadow-red-300">
            {/* Background Pattern Image */}
            <Image
              source={require('../../assets/images/bgLayer.png')}
              className="absolute right-0 top-0 h-full w-1/2"
              resizeMode="cover"
            />

            <View className="relative z-10 rounded-lg px-4 py-5">
              <View className="flex-row items-start justify-between">
                <Text className="font-medium text-white/80">Monthly Earnings</Text>
                <View className="flex-row items-center gap-1 rounded-full bg-[#0000001A] px-3 py-1.5 backdrop-blur-md">
                  <Ionicons name="arrow-up" size={15} color="#FFF" />

                  <Text className="font-bold text-[10px]  text-[#FFF]">+20% this month</Text>
                </View>
              </View>
              <Text className="mt-2 font-bold text-4xl text-white">₹2,40,000</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
        {/* Stats Row */}
        <View className="mb-8 mt-4 flex-row justify-between ">
          {/* Today's Check-ins Card */}
          <View
            style={{
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.09,
              shadowRadius: 10,
              elevation: 1,
            }}
            className="mr-3 flex-1 rounded-[24px] bg-white p-5">
            <Text className="mb-3 font-medium text-[12px] text-[#B3B3B3]">Today's Check-ins</Text>
            <View className="mt-2 flex-row items-end justify-between">
              <Text className="font-bold text-3xl">45</Text>
              {/* Green Pill Indicator */}
              <View className="m mb-1 flex-row items-center rounded-full bg-emerald-50 px-2 py-2">
                <Ionicons name="arrow-up" size={15} color="#10B981" />
                <Text className="ml-0.5 font-bold text-[12px] text-emerald-500">+5</Text>
              </View>
            </View>
          </View>

          {/* Active Members Card */}
          <View
            style={{
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.09,
              shadowRadius: 10,
              elevation: 1,
            }}
            className="flex-1 rounded-[24px] bg-white p-5">
            <Text className="mb-3 font-sans text-[12px] font-normal leading-4 text-[#B3B3B3]">
              Active Members
            </Text>
            <View className="mt-2 flex-row items-end justify-between">
              <Text className="font-bold text-3xl">320</Text>
              {/* Green Pill Indicator */}
              <View className="mb-1 flex-row items-center rounded-full bg-emerald-50 px-2 py-1">
                <Ionicons name="arrow-up" size={15} color="#10B981" />
                <Text className="ml-0.5 font-bold text-[12px] text-emerald-500">+5</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Title */}
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-bold text-lg text-slate-900">Recent Check-ins</Text>
          <TouchableOpacity onPress={() => router.push('/ViewAllScreen')}>
            <Text className="rounded-full bg-[#F6163C] px-4 py-2.5 font-normal leading-4 text-white">
              View All
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* --- SCROLLABLE LIST --- */}
      <FlatList
        data={RECENT_CHECKINS}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: Platform.OS === 'ios' ? 100 : 20,
        }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedMember({ ...item, verified: true })}
            className="mb-3 flex-row items-center rounded-2xl border border-slate-100 bg-white p-3">
            <Image source={{ uri: item.image }} className="h-14 w-14 rounded-xl" />

            <View className="ml-4 flex-1 ">
              <View className="flex-row items-center gap-1 ">
                <Text className="font-bold text-[15px] text-slate-900">{item.name}</Text>
                <Image className="h-4 w-4" source={require('../../assets/images/tick.png')} />
              </View>
              <Text className="text-xs text-slate-400">{item.time}</Text>
            </View>

            <View
              style={{
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}30`,
                width: 95,
              }}
              className="flex-row items-center justify-center gap-1 rounded-full border py-1.5">
              <Image
                source={
                  item.type === 'Luxury'
                    ? require('../../assets/images/luxury.png')
                    : item.type === 'Premium'
                      ? require('../../assets/images/premium.png')
                      : require('../../assets/images/standardicon.png')
                }
                style={{ width: 15, height: 15 }}
                resizeMode="contain"
              />

              <Text
                style={{ color: item.color }}
                className="text-[12px] font-normal "
                numberOfLines={1}>
                {item.type}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* --- MEMBER DETAIL BOTTOM SHEET --- */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMember(null)} />
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

            {selectedMember && (
              <View style={styles.sheetContent}>
                {/* Top row: Avatar & basic info */}
                <View style={styles.profileHeader}>
                  <Image source={{ uri: selectedMember.image }} style={styles.largeAvatar} />
                  <View style={styles.profileMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.profileName}>{selectedMember.name}</Text>
                      {selectedMember.verified && (
                        <Image style={styles.checkIcon} source={require('../../assets/images/tick.png')} />
                      )}
                    </View>
                    <Text style={styles.profileTime}>Checked in: {selectedMember.time}</Text>
                    
                    {/* Badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: `${selectedMember.color}15`,
                          borderColor: `${selectedMember.color}25`,
                        }
                      ]}
                    >
                      <Image
                        source={
                          selectedMember.type === 'Luxury'
                            ? require('../../assets/images/luxury.png')
                            : selectedMember.type === 'Premium'
                              ? require('../../assets/images/premium.png')
                              : require('../../assets/images/standardicon.png')
                        }
                        style={{ width: 12, height: 12 }}
                        resizeMode="contain"
                      />
                      <Text style={[styles.badgeText, { color: selectedMember.color }]}>
                        {selectedMember.type} Member
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
                    <Text style={styles.detailValue}>FF-MEMBER-00{selectedMember.id}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember.name.toLowerCase().replace(/\s+/g, '')}@gmail.com
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="phone-portrait-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.detailValue}>+91 98765 {43210 + parseInt(selectedMember.id)}</Text>
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
                      <Text style={[styles.detailLabel, { color: '#10B981', fontWeight: 'bold' }]}>Status</Text>
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
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
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
    marginLeft: 18,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginRight: 6,
  },
  checkIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  profileTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  detailsList: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  footerBtns: {
    marginTop: 30,
  },
  primaryBtn: {
    backgroundColor: '#F6163C',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
