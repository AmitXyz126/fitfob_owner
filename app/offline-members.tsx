import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Switch,
  Pressable,
  Platform,
  KeyboardAvoidingView,
  Animated,
  Easing,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';

// -------------------------------------------------------------
// Sample Initial Data (Matching Figma Screenshots 01, 02, 03, 04)
// -------------------------------------------------------------
interface MemberItem {
  id: string;
  name: string;
  initials: string;
  avatarBg: string;
  avatarText: string;
  plan: string;
  expiryText: string;
  status: 'active' | 'expiring_soon' | 'invite_sent';
  phone: string;
}

interface PendingApprovalItem {
  id: string;
  name: string;
  phone: string;
  plan: string;
  amount: string;
  timeAgo: string;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  months: number;
}

const MEMBERSHIP_PLANS: PlanOption[] = [
  { id: '1m', name: '1-Month Basic', price: '₹2,000', months: 1 },
  { id: '3m', name: '3-Month Pro', price: '₹4,500', months: 3 },
  { id: '6m', name: '6-Month Gold', price: '₹8,000', months: 6 },
  { id: '12m', name: 'Annual Pro', price: '₹15,000', months: 12 },
];

const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: '1',
    name: 'Rahul Verma',
    initials: 'RV',
    avatarBg: '#FCE7F3',
    avatarText: '#BE185D',
    plan: 'Annual Pro',
    expiryText: 'Exp 16 Jan 2027',
    status: 'active',
    phone: '+91 98765 11223',
  },
  {
    id: '2',
    name: 'Priya Kaur',
    initials: 'PK',
    avatarBg: '#FFE4E6',
    avatarText: '#E11D48',
    plan: '6-Month Gold',
    expiryText: 'Expires in 3 days',
    status: 'expiring_soon',
    phone: '+91 98765 22334',
  },
  {
    id: '3',
    name: 'Arjun Mehta',
    initials: 'AM',
    avatarBg: '#FEF3C7',
    avatarText: '#B45309',
    plan: '3-Month Pro',
    expiryText: 'Exp 10 Feb 2027',
    status: 'active',
    phone: '+91 98765 33445',
  },
  {
    id: '4',
    name: 'Simran Gill',
    initials: 'SG',
    avatarBg: '#FEE2E2',
    avatarText: '#DC2626',
    plan: '1-Month Basic',
    expiryText: 'Expires in 5 days',
    status: 'expiring_soon',
    phone: '+91 98765 44556',
  },
  {
    id: '5',
    name: 'Neha Joshi',
    initials: 'NJ',
    avatarBg: '#F3E8FF',
    avatarText: '#7E22CE',
    plan: '6-Month Gold',
    expiryText: 'Invite sent',
    status: 'invite_sent',
    phone: '+91 98765 55667',
  },
];

const INITIAL_PENDING: PendingApprovalItem[] = [
  {
    id: 'p1',
    name: 'Karan Singh',
    phone: '+91 98140 55672',
    plan: '3-Month Pro',
    amount: '₹4,500',
    timeAgo: '2 min ago',
  },
  {
    id: 'p2',
    name: 'Ananya Rao',
    phone: '+91 99150 33811',
    plan: '1-Month Basic',
    amount: '₹1,800',
    timeAgo: '18 min ago',
  },
  {
    id: 'p3',
    name: 'Vikram Das',
    phone: '+91 97790 21045',
    plan: '6-Month Gold',
    amount: '₹8,000',
    timeAgo: '1 hr ago',
  },
];

// Helper: Calculate Expiry Date given Start Date & Months
function calculateExpiry(startDateStr: string, months: number): string {
  try {
    const d = new Date(startDateStr);
    if (isNaN(d.getTime())) {
      const now = new Date();
      now.setMonth(now.getMonth() + months);
      return now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return '23 May 2027';
  }
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || 'MB';
}

export default function OfflineMembersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Navigation flow state: 'dashboard' (01) | 'add_member' (02) | 'success' (04)
  const [viewMode, setViewMode] = useState<'dashboard' | 'add_member' | 'success'>('dashboard');

  // 3D Flip & Pop Animation for Success Badge (Screen 04)
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (viewMode === 'success') {
      flipAnim.setValue(0);
      scaleAnim.setValue(0.3);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 45,
          useNativeDriver: true,
        }),
        Animated.timing(flipAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [viewMode]);

  const rotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '0deg'],
  });

  // Modal 03: Double-check details
  const [isDoubleCheckVisible, setIsDoubleCheckVisible] = useState(false);

  // Dashboard state
  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>(INITIAL_PENDING);
  const [selectedTab, setSelectedTab] = useState<'active' | 'pending'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'expiry' | 'name'>('expiry');

  // Add Member Form state (Default prefilled as per Figma Screen 02)
  const [phone, setPhone] = useState('9876543210');
  const [fullName, setFullName] = useState('Rohit Sharma');
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(MEMBERSHIP_PLANS[2]); // 6-Month Gold
  const [startDate, setStartDate] = useState('23 Nov 2026');
  const [expiryDate, setExpiryDate] = useState('23 May 2027');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  // Plan picker modal
  const [isPlanPickerVisible, setIsPlanPickerVisible] = useState(false);

  // Quick Approval modal for Pending Requests (Screen 06)
  const [confirmingItem, setConfirmingItem] = useState<PendingApprovalItem | null>(null);
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'UPI' | 'Card'>('Cash');

  // Reject modal for Pending Requests (Screen 07)
  const [rejectingItem, setRejectingItem] = useState<PendingApprovalItem | null>(null);

  // Filtered members based on search
  const filteredMembers = useMemo(() => {
    let list = [...members];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) => m.name.toLowerCase().includes(q) || m.phone.includes(q) || m.plan.toLowerCase().includes(q)
      );
    }
    if (sortMode === 'expiry') {
      // Keep natural priority
      return list;
    } else {
      return list.sort((a, b) => a.name.localeCompare(b.name));
    }
  }, [members, searchQuery, sortMode]);

  // Handle plan selection in Screen 02
  const handleSelectPlan = (plan: PlanOption) => {
    setSelectedPlan(plan);
    const newExpiry = calculateExpiry(startDate, plan.months);
    setExpiryDate(newExpiry);
    setIsPlanPickerVisible(false);
  };

  // Step 2 -> Step 3: Validate and open Double-Check modal
  const handleReviewAndSend = () => {
    if (!phone.trim() || phone.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Valid Mobile Number Required',
        text2: 'Please enter a 10-digit mobile number.',
      });
      return;
    }
    if (!fullName.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Full Name Required',
        text2: 'Please enter the member name.',
      });
      return;
    }
    if (!sendWhatsApp && !sendSms) {
      Toast.show({
        type: 'info',
        text1: 'Select Invite Channel',
        text2: 'Please enable at least WhatsApp or SMS to send invite.',
      });
      return;
    }
    setIsDoubleCheckVisible(true);
  };

  // Step 3 -> Step 4: Confirm and Add Member
  const handleConfirmAddMember = () => {
    setIsDoubleCheckVisible(false);

    // Add newly invited member to active members list
    const newMember: MemberItem = {
      id: Date.now().toString(),
      name: fullName.trim(),
      initials: getInitials(fullName),
      avatarBg: '#FFE4E6',
      avatarText: '#F6163C',
      plan: selectedPlan.name,
      expiryText: 'Invite sent',
      status: 'invite_sent',
      phone: `+91 ${phone.trim()}`,
    };

    setMembers((prev) => [newMember, ...prev]);

    // Transition to Screen 04
    setViewMode('success');
  };

  // Approve a Pay at Gym pending request (Screen 06 from Figma)
  const handleConfirmApproval = () => {
    if (!confirmingItem) return;

    // Convert approved customer into active member
    const newActive: MemberItem = {
      id: Date.now().toString(),
      name: confirmingItem.name,
      initials: getInitials(confirmingItem.name),
      avatarBg: '#D1FAE5',
      avatarText: '#047857',
      plan: confirmingItem.plan,
      expiryText: 'Exp 16 Jan 2027',
      status: 'active',
      phone: confirmingItem.phone,
    };

    setMembers((prev) => [newActive, ...prev]);
    setPendingApprovals((prev) => prev.filter((p) => p.id !== confirmingItem.id));
    const approvedName = confirmingItem.name;
    setConfirmingItem(null);

    Toast.show({
      type: 'success',
      text1: 'Membership Activated! 🎉',
      text2: `${approvedName}'s QR Entry Code is now active.`,
    });
  };

  // Reject a Pay at Gym pending request (Screen 07 from Figma)
  const handleConfirmReject = () => {
    if (!rejectingItem) return;
    const name = rejectingItem.name;
    setPendingApprovals((prev) => prev.filter((p) => p.id !== rejectingItem.id));
    setRejectingItem(null);

    Toast.show({
      type: 'info',
      text1: 'Request Declined',
      text2: `${name}'s request has been declined.`,
    });
  };

  // Invite channel text representation
  const inviteChannelText = useMemo(() => {
    if (sendWhatsApp && sendSms) return 'WhatsApp & SMS';
    if (sendWhatsApp) return 'WhatsApp';
    if (sendSms) return 'SMS';
    return 'Direct Link';
  }, [sendWhatsApp, sendSms]);

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top }}>
      <StatusBar style="dark" />

      {/* ========================================================================= */}
      {/* 01 · GYM DASHBOARD SCREEN                                                 */}
      {/* ========================================================================= */}
      {viewMode === 'dashboard' && (
        <View className="flex-1 bg-white">
          {/* Top Bar Header */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100">
            <TouchableOpacity
              onPress={() => router.back()}
              activeOpacity={0.7}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text className="text-lg font-bold text-slate-900">Dashboard</Text>

            <TouchableOpacity
              onPress={() => router.push('/notification')}
              activeOpacity={0.7}
              className="h-9 w-9 items-center justify-center relative">
              <Ionicons name="notifications" size={22} color="#F6163C" />
              {pendingApprovals.length > 0 && (
                <View className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#F6163C]" />
              )}
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View className="px-5 pt-3.5 pb-2">
            <View className="flex-row items-center rounded-2xl bg-slate-50 border border-slate-200/80 px-3.5 py-2.5">
              <Ionicons name="search" size={18} color="#94A3B8" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search by name or phone number"
                placeholderTextColor="#94A3B8"
                className="ml-2.5 flex-1 text-sm font-medium text-slate-900 p-0"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Segmented Tabs: Active Members vs Pending Approvals */}
          <View className="px-5 pt-2 pb-3">
            <View className="flex-row rounded-2xl bg-slate-100 p-1">
              <TouchableOpacity
                onPress={() => setSelectedTab('active')}
                activeOpacity={0.8}
                style={{
                  backgroundColor: selectedTab === 'active' ? '#FFFFFF' : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedTab === 'active' ? 0.08 : 0,
                  shadowRadius: 2,
                  elevation: selectedTab === 'active' ? 2 : 0,
                }}
                className="flex-1 py-2.5 rounded-xl items-center justify-center flex-row">
                <Text
                  className={`text-xs font-bold ${
                    selectedTab === 'active' ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                  Active Members ({members.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setSelectedTab('pending')}
                activeOpacity={0.8}
                style={{
                  backgroundColor: selectedTab === 'pending' ? '#FFFFFF' : 'transparent',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedTab === 'pending' ? 0.08 : 0,
                  shadowRadius: 2,
                  elevation: selectedTab === 'pending' ? 2 : 0,
                }}
                className="flex-1 py-2.5 rounded-xl items-center justify-center flex-row">
                <Text
                  className={`text-xs font-bold mr-1.5 ${
                    selectedTab === 'pending' ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                  Pending Approvals
                </Text>
                {pendingApprovals.length > 0 && (
                  <View className="h-5 px-1.5 items-center justify-center rounded-full bg-[#F6163C]">
                    <Text className="text-[10px] font-bold text-white">
                      {pendingApprovals.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* TAB 1: ACTIVE MEMBERS LIST */}
          {selectedTab === 'active' && (
            <View className="flex-1">
              {/* Filter Indicator & Sort Row */}
              <View className="flex-row items-center justify-between px-5 pb-2.5">
                <View className="flex-row items-center gap-x-4">
                  <View className="flex-row items-center">
                    <View className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
                    <Text className="text-xs font-semibold text-slate-600">Active</Text>
                  </View>
                  <View className="flex-row items-center">
                    <View className="h-2 w-2 rounded-full bg-[#F6163C] mr-1.5" />
                    <Text className="text-xs font-semibold text-slate-600">Expiring soon</Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setSortMode((prev) => (prev === 'expiry' ? 'name' : 'expiry'))}
                  activeOpacity={0.7}
                  className="flex-row items-center">
                  <Text className="text-xs font-semibold text-[#F6163C]">
                    Sort: {sortMode === 'expiry' ? 'Expiry' : 'Name'}
                  </Text>
                  <Ionicons name="swap-vertical" size={13} color="#F6163C" style={{ marginLeft: 3 }} />
                </TouchableOpacity>
              </View>

              {/* Members Scroll List */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
                {filteredMembers.length === 0 ? (
                  <View className="items-center py-12">
                    <Ionicons name="people-outline" size={44} color="#CBD5E1" />
                    <Text className="mt-3 text-sm font-semibold text-slate-600">No members found</Text>
                    <Text className="mt-1 text-xs text-slate-400">
                      Try searching with another name or phone number.
                    </Text>
                  </View>
                ) : (
                  filteredMembers.map((item) => {
                    const isExpiringSoon = item.status === 'expiring_soon';
                    const isInviteSent = item.status === 'invite_sent';

                    return (
                      <View
                        key={item.id}
                        className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-slate-200/70 bg-white p-3.5 shadow-sm">
                        {/* Left: Avatar + Name + Plan */}
                        <View className="flex-row items-center flex-1 mr-2">
                          <View
                            style={{ backgroundColor: item.avatarBg }}
                            className="h-11 w-11 items-center justify-center rounded-full mr-3">
                            <Text
                              style={{ color: item.avatarText }}
                              className="text-sm font-extrabold">
                              {item.initials}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text
                              numberOfLines={1}
                              className="text-[14px] font-bold text-slate-900">
                              {item.name}
                            </Text>
                            <Text className="text-xs text-slate-400 font-medium mt-0.5">
                              {item.plan}
                            </Text>
                          </View>
                        </View>

                        {/* Right: Status Pill & Action */}
                        <View className="flex-row items-center">
                          {isInviteSent ? (
                            <View className="flex-row items-center">
                              <View className="flex-row items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1">
                                <Ionicons name="time-outline" size={12} color="#D97706" />
                                <Text className="ml-1 text-[11px] font-bold text-amber-700">
                                  Invite sent
                                </Text>
                              </View>
                              <TouchableOpacity
                                onPress={() => {
                                  setFullName(item.name);
                                  setPhone(item.phone.replace('+91', '').trim());
                                  setViewMode('add_member');
                                }}
                                className="ml-2 h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                                <Ionicons name="create-outline" size={14} color="#64748B" />
                              </TouchableOpacity>
                            </View>
                          ) : isExpiringSoon ? (
                            <View className="flex-row items-center rounded-full bg-rose-50 border border-rose-200 px-2.5 py-1">
                              <View className="h-1.5 w-1.5 rounded-full bg-[#F6163C] mr-1.5" />
                              <Text className="text-[11px] font-bold text-rose-600">
                                {item.expiryText}
                              </Text>
                            </View>
                          ) : (
                            <View className="flex-row items-center rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-1">
                              <View className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
                              <Text className="text-[11px] font-bold text-emerald-700">
                                {item.expiryText}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          )}

          {/* TAB 2: PENDING APPROVALS LIST (Screen 05 from Figma) */}
          {selectedTab === 'pending' && (
            <View className="flex-1">
              {/* Header Subtitle */}
              <View className="px-5 pb-3">
                <Text className="text-xs font-medium text-slate-500">
                  {`${pendingApprovals.length} "Pay at Gym" requests waiting`}
                </Text>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
                {pendingApprovals.length === 0 ? (
                  <View className="items-center py-16">
                    <View className="h-16 w-16 items-center justify-center rounded-full bg-emerald-50 mb-3">
                      <Ionicons name="checkmark-done-circle" size={36} color="#10B981" />
                    </View>
                    <Text className="text-base font-bold text-slate-800">
                      No Pending Approvals
                    </Text>
                    <Text className="mt-1 text-xs text-slate-400 text-center max-w-[240px]">
                      All front-desk payment requests have been processed.
                    </Text>
                  </View>
                ) : (
                  pendingApprovals.map((req) => (
                    <View
                      key={req.id}
                      className="mb-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
                      {/* Top: Avatar, Name, Phone & Time */}
                      <View className="flex-row items-center justify-between mb-3.5">
                        <View className="flex-row items-center flex-1 mr-2">
                          <View className="h-10 w-10 items-center justify-center rounded-full bg-rose-50 border border-rose-100 mr-3">
                            <Text className="font-extrabold text-xs text-[#F6163C]">
                              {getInitials(req.name)}
                            </Text>
                          </View>
                          <View className="flex-1">
                            <Text numberOfLines={1} className="font-bold text-[15px] text-slate-900">
                              {req.name}
                            </Text>
                            <Text className="text-xs text-slate-400 font-medium mt-0.5">
                              {req.phone}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-center">
                          <Ionicons name="time-outline" size={13} color="#94A3B8" />
                          <Text className="ml-1 text-[11px] font-medium text-slate-400">
                            {req.timeAgo}
                          </Text>
                        </View>
                      </View>

                      {/* Middle: Requested Plan & Amount Due */}
                      <View className="flex-row items-center justify-between pb-3.5 border-b border-slate-100 mb-3.5">
                        <View>
                          <Text className="text-[11px] font-medium text-slate-400">
                            Requested plan
                          </Text>
                          <Text className="font-bold text-xs text-slate-900 mt-0.5">
                            {req.plan}
                          </Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-[11px] font-medium text-slate-400 text-right">
                            Amount due
                          </Text>
                          <Text className="font-extrabold text-[15px] text-[#F6163C] text-right mt-0.5">
                            {req.amount}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons: Reject & Approve */}
                      <View className="flex-row items-center" style={{ gap: 10 }}>
                        <TouchableOpacity
                          onPress={() => setRejectingItem(req)}
                          activeOpacity={0.7}
                          className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white items-center justify-center">
                          <Text className="text-xs font-semibold text-slate-700">Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setConfirmingItem(req)}
                          activeOpacity={0.85}
                          className="flex-1 py-2.5 rounded-xl bg-[#F6163C] items-center justify-center shadow-sm">
                          <Text className="text-xs font-bold text-white">Approve</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* Fixed Bottom Button: + Add Offline Member (Only on Active tab as per Figma) */}
          {selectedTab === 'active' && (
            <View
              className="absolute bottom-0 left-0 right-0 bg-white/95 px-5 pt-3 border-t border-slate-100"
              style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
              <TouchableOpacity
                onPress={() => setViewMode('add_member')}
                activeOpacity={0.85}
                className="h-12 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C] shadow-sm">
                <Ionicons name="add" size={20} color="white" />
                <Text className="ml-1 text-[15px] font-bold text-white">Add Offline Member</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* ========================================================================= */}
      {/* 02 · ADD OFFLINE MEMBER FORM SCREEN                                       */}
      {/* ========================================================================= */}
      {viewMode === 'add_member' && (
        <View className="flex-1 bg-white">
          {/* Top Bar Header */}
          <View className="flex-row items-center justify-between px-5 pt-3 pb-3 border-b border-slate-100">
            <TouchableOpacity
              onPress={() => setViewMode('dashboard')}
              activeOpacity={0.7}
              className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
              <Ionicons name="chevron-back" size={20} color="#0F172A" />
            </TouchableOpacity>

            <Text className="text-lg font-bold text-slate-900">Add Offline Member</Text>

            <TouchableOpacity
              onPress={() => router.push('/notification')}
              activeOpacity={0.7}
              className="h-9 w-9 items-center justify-center">
              <Ionicons name="notifications" size={22} color="#F6163C" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 }}>
            {/* Top Info Banner */}
            <View className="mb-5 flex-row items-start rounded-2xl bg-rose-50/70 border border-rose-100 p-3.5">
              <Ionicons name="information-circle-outline" size={18} color="#F6163C" style={{ marginTop: 1 }} />
              <Text className="ml-2.5 text-xs text-rose-700 leading-5 flex-1">
                For members who already paid at your gym. They'll get an invite to claim their pass.
              </Text>
            </View>

            {/* Field 1: Mobile Number */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">Mobile Number</Text>
              <View className="flex-row items-center rounded-xl border border-slate-200 bg-white overflow-hidden">
                <View className="w-14 items-center justify-center bg-slate-50 border-r border-slate-200 py-3">
                  <Text className="text-sm font-bold text-slate-700">+91</Text>
                </View>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  className="flex-1 px-3.5 py-3 text-sm font-semibold text-slate-900"
                />
              </View>
            </View>

            {/* Field 2: Full Name */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">Full Name</Text>
              <TextInput
                value={fullName}
                onChangeText={setFullName}
                placeholder="e.g. Rohit Sharma"
                placeholderTextColor="#94A3B8"
                className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm font-semibold text-slate-900"
              />
            </View>

            {/* Field 3: Membership Plan Dropdown */}
            <View className="mb-4">
              <Text className="text-xs font-bold text-slate-700 mb-1.5">Membership Plan</Text>
              <TouchableOpacity
                onPress={() => setIsPlanPickerVisible(true)}
                activeOpacity={0.7}
                className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3">
                <Text className="text-sm font-semibold text-slate-900">{selectedPlan.name}</Text>
                <View className="flex-row items-center">
                  <Text className="text-sm font-bold text-slate-500 mr-2">{selectedPlan.price}</Text>
                  <Ionicons name="chevron-down" size={16} color="#64748B" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Field 4: Start Date & Expiry Date (2 Columns) */}
            <View className="mb-5 flex-row gap-3">
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1.5">Start Date</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    Toast.show({
                      type: 'info',
                      text1: 'Start Date',
                      text2: 'Defaults to membership start date (Today).',
                    });
                  }}
                  className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Text className="text-xs font-semibold text-slate-800">{startDate}</Text>
                  <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
                <Text className="mt-1 text-[10px] text-slate-400">Defaults to today</Text>
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1.5">Expiry Date</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    Toast.show({
                      type: 'info',
                      text1: 'Expiry Date',
                      text2: 'Auto-calculated from selected plan duration.',
                    });
                  }}
                  className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-3">
                  <Text className="text-xs font-semibold text-slate-800">{expiryDate}</Text>
                  <Ionicons name="calendar-outline" size={16} color="#94A3B8" />
                </TouchableOpacity>
                <Text className="mt-1 text-[10px] text-slate-400">Auto-filled from plan · editable</Text>
              </View>
            </View>

            {/* Field 5: Send Invite Via (WhatsApp & SMS Toggles) */}
            <View className="mb-5">
              <Text className="text-xs font-bold text-slate-700 mb-2.5">Send Invite Via</Text>

              {/* WhatsApp Toggle */}
              <View className="mb-2.5 flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 mr-3">
                    <Ionicons name="logo-whatsapp" size={18} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">WhatsApp</Text>
                    <Text className="text-[11px] text-slate-400">Invite link via WhatsApp message</Text>
                  </View>
                </View>
                <Switch
                  value={sendWhatsApp}
                  onValueChange={setSendWhatsApp}
                  trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* SMS Toggle */}
              <View className="flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3">
                <View className="flex-row items-center flex-1 mr-2">
                  <View className="h-9 w-9 items-center justify-center rounded-xl bg-slate-700 mr-3">
                    <Ionicons name="chatbox-ellipses" size={18} color="white" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">SMS</Text>
                    <Text className="text-[11px] text-slate-400">Invite link via text message</Text>
                  </View>
                </View>
                <Switch
                  value={sendSms}
                  onValueChange={setSendSms}
                  trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>
          </ScrollView>

          {/* Bottom Fixed Button: Review & Send Invite */}
          <View
            className="absolute bottom-0 left-0 right-0 bg-white/95 px-5 pt-3 border-t border-slate-100"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
            <TouchableOpacity
              onPress={handleReviewAndSend}
              activeOpacity={0.85}
              className="h-12 w-full items-center justify-center rounded-2xl bg-[#F6163C] shadow-sm">
              <Text className="text-[15px] font-bold text-white">Review & Send Invite</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* 03 · DOUBLE-CHECK DETAILS BOTTOM SHEET MODAL                             */}
      {/* ========================================================================= */}
      {isDoubleCheckVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
          onRequestClose={() => setIsDoubleCheckVisible(false)}>
          <View className="flex-1 justify-end bg-black/60">
            <Pressable className="flex-1" onPress={() => setIsDoubleCheckVisible(false)} />

            <View
              className="rounded-t-[32px] bg-white px-6 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 24) }}>
              {/* Grabber Handle */}
              <View className="h-1 w-12 rounded-full bg-slate-300 self-center mb-4" />

              {/* Icon Avatar */}
              <View className="h-12 w-12 items-center justify-center rounded-full bg-rose-50 border border-rose-100 self-center mb-2.5">
                <Ionicons name="person-outline" size={24} color="#F6163C" />
              </View>

              {/* Header Titles */}
              <Text className="text-center font-bold text-lg text-slate-900">
                Double-check details
              </Text>
              <Text className="text-center text-xs text-slate-400 mt-1 mb-5">
                Make sure everything is correct before we send the invite.
              </Text>

              {/* Details Table */}
              <View className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 mb-5">
                <View className="flex-row items-center justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Name</Text>
                  <Text className="text-xs font-bold text-slate-900">{fullName}</Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Phone</Text>
                  <Text className="text-xs font-bold text-slate-900">+91 {phone}</Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Plan</Text>
                  <Text className="text-xs font-bold text-slate-900">{selectedPlan.name}</Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Start Date</Text>
                  <Text className="text-xs font-bold text-slate-900">{startDate}</Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Expiry Date</Text>
                  <Text className="text-xs font-bold text-slate-900">{expiryDate}</Text>
                </View>

                <View className="flex-row items-center justify-between pt-2">
                  <Text className="text-xs font-medium text-slate-500">Invite via</Text>
                  <Text className="text-xs font-bold text-[#F6163C]">{inviteChannelText}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleConfirmAddMember}
                activeOpacity={0.85}
                className="h-12 w-full items-center justify-center rounded-2xl bg-[#F6163C] mb-2.5">
                <Text className="text-sm font-bold text-white">Confirm & Add Member</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsDoubleCheckVisible(false)}
                activeOpacity={0.7}
                className="h-11 w-full flex-row items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Ionicons name="create-outline" size={15} color="#475569" />
                <Text className="ml-1.5 text-xs font-bold text-slate-700">Edit Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 04 · MEMBER ADDED! SUCCESS SCREEN                                         */}
      {/* ========================================================================= */}
      {viewMode === 'success' && (
        <View className="flex-1 bg-white justify-between px-6 pt-2" style={{ paddingBottom: Math.max(insets.bottom, 14) }}>
          {/* Main Success Content Scrollable */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', paddingTop: 16, paddingBottom: 16 }}>
            {/* 3D Member Added Success Badge (#F6163C FitFob Brand Red with 3D Flip & Bounce Animation) */}
            <Animated.View
              style={{
                width: 190,
                height: 190,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 4,
                opacity: opacityAnim,
                transform: [
                  { perspective: 1000 },
                  { rotateY: rotateY },
                  { scale: scaleAnim },
                ],
              }}>
              <Image
                source={require('../assets/images/member_added_3d_red.jpg')}
                style={{ width: 190, height: 190 }}
                resizeMode="contain"
              />
            </Animated.View>

            <Text className="text-2xl font-extrabold text-slate-900 text-center">
              Member Added!
            </Text>
            <Text className="mt-1.5 text-xs text-slate-500 text-center px-4 leading-5">
              The invite link has been sent to {fullName ? fullName.split(' ')[0] : 'Member'}'s phone on {inviteChannelText}.
            </Text>

            {/* Member Summary Card */}
            <View className="w-full mt-6 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
              {/* Member Row */}
              <View className="flex-row items-center mb-3">
                <View className="h-11 w-11 items-center justify-center rounded-full bg-rose-50 border border-rose-100 mr-3">
                  <Text className="font-extrabold text-sm text-[#F6163C]">
                    {getInitials(fullName)}
                  </Text>
                </View>
                <View>
                  <Text className="font-bold text-[15px] text-slate-900">{fullName}</Text>
                  <Text className="text-xs text-slate-400 font-medium">+91 {phone}</Text>
                </View>
              </View>

              <View className="h-[1px] w-full bg-slate-100 mb-3" />

              {/* Plan & Valid Columns */}
              <View className="flex-row items-center justify-between mb-3 px-1">
                <View>
                  <Text className="text-[11px] text-slate-400 font-medium">Plan</Text>
                  <Text className="text-xs font-bold text-slate-800 mt-0.5">
                    {selectedPlan.name}
                  </Text>
                </View>
                <View className="items-end">
                  <Text className="text-[11px] text-slate-400 font-medium">Valid till</Text>
                  <Text className="text-xs font-bold text-slate-800 mt-0.5">{expiryDate}</Text>
                </View>
              </View>

              {/* Waiting Status Pill */}
              <View className="flex-row items-center justify-center rounded-full bg-amber-50 border border-amber-200/80 py-1.5 px-3">
                <Ionicons name="time-outline" size={13} color="#D97706" />
                <Text className="ml-1.5 text-xs font-bold text-amber-700">
                  Waiting for member to claim
                </Text>
              </View>

              {/* Help Note */}
              <Text className="mt-3 text-[11px] text-slate-400 text-center leading-4">
                You can edit or cancel this invite from the dashboard until it's claimed.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons: Back to Dashboard & Add Another */}
          <View>
            <TouchableOpacity
              onPress={() => setViewMode('dashboard')}
              activeOpacity={0.85}
              className="h-12 w-full items-center justify-center rounded-2xl bg-[#F6163C] mb-2.5">
              <Text className="text-[15px] font-bold text-white">Back to Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setFullName('');
                setPhone('');
                setViewMode('add_member');
              }}
              activeOpacity={0.7}
              className="h-12 w-full flex-row items-center justify-center rounded-2xl border border-[#F6163C] bg-white">
              <Ionicons name="add" size={18} color="#F6163C" />
              <Text className="ml-1 text-[14px] font-bold text-[#F6163C]">
                Add Another Member
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* MEMBERSHIP PLAN PICKER MODAL (From Screen 02)                             */}
      {/* ========================================================================= */}
      {isPlanPickerVisible && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          statusBarTranslucent={true}
          onRequestClose={() => setIsPlanPickerVisible(false)}>
          <Pressable
            className="flex-1 justify-center bg-black/60 px-6"
            onPress={() => setIsPlanPickerVisible(false)}>
            <View className="rounded-3xl bg-white p-5 shadow-xl">
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
                <Text className="font-bold text-base text-slate-900">Select Membership Plan</Text>
                <TouchableOpacity onPress={() => setIsPlanPickerVisible(false)}>
                  <Ionicons name="close" size={20} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View className="mt-3 gap-2">
                {MEMBERSHIP_PLANS.map((plan) => {
                  const isSelected = selectedPlan.id === plan.id;
                  return (
                    <TouchableOpacity
                      key={plan.id}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.7}
                      className={`flex-row items-center justify-between p-3.5 rounded-2xl border ${
                        isSelected ? 'bg-rose-50 border-[#F6163C]' : 'bg-slate-50 border-slate-200/80'
                      }`}>
                      <View>
                        <Text
                          className={`text-sm font-bold ${
                            isSelected ? 'text-[#F6163C]' : 'text-slate-800'
                          }`}>
                          {plan.name}
                        </Text>
                        <Text className="text-xs text-slate-400 mt-0.5">{plan.months} Months Duration</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Text
                          className={`text-sm font-bold mr-2 ${
                            isSelected ? 'text-[#F6163C]' : 'text-slate-700'
                          }`}>
                          {plan.price}
                        </Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={18} color="#F6163C" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 06 · CONFIRM PAYMENT RECEIVED BOTTOM SHEET MODAL (Screen 06 from Figma)   */}
      {/* ========================================================================= */}
      {Boolean(confirmingItem) && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
          onRequestClose={() => setConfirmingItem(null)}>
          <View className="flex-1 justify-end bg-black/60">
            <Pressable className="flex-1" onPress={() => setConfirmingItem(null)} />

            <View
              className="rounded-t-[32px] bg-white px-6 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
              {/* Grabber Handle */}
              <View className="h-1 w-12 rounded-full bg-slate-200 self-center mb-3.5" />

              {/* Top Icon Badge */}
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 mb-3">
                <Ionicons name="cash-outline" size={22} color="#10B981" />
              </View>

              {/* Title */}
              <Text className="font-bold text-[18px] text-slate-900 leading-snug">
                Did you collect {confirmingItem?.amount} from {confirmingItem?.name}?
              </Text>

              {/* Subtitle */}
              <Text className="text-xs text-slate-400 leading-5 mt-1.5 mb-4">
                {confirmingItem?.plan} · The membership activates and {confirmingItem?.name ? confirmingItem.name.split(' ')[0] : 'member'}'s entry QR unlocks immediately.
              </Text>

              {/* Payment Mode Selection */}
              <Text className="text-xs font-bold text-slate-700 mb-2.5">
                Payment mode (optional, for your records)
              </Text>

              {/* 3 Payment Mode Cards */}
              <View className="flex-row mb-3.5" style={{ gap: 10 }}>
                {(
                  [
                    { id: 'Cash', label: 'Cash', icon: 'cash-outline' },
                    { id: 'UPI', label: 'UPI', icon: 'flash-outline' },
                    { id: 'Card', label: 'Card', icon: 'card-outline' },
                  ] as const
                ).map((mode) => {
                  const isSelected = paymentMode === mode.id;
                  return (
                    <TouchableOpacity
                      key={mode.id}
                      onPress={() => setPaymentMode(mode.id)}
                      activeOpacity={0.7}
                      className={`flex-1 py-3 px-2 rounded-2xl border items-center justify-center relative ${
                        isSelected
                          ? 'bg-rose-50/70 border-[#F6163C]'
                          : 'bg-white border-slate-200/80'
                      }`}>
                      {/* Top-Right Red Selected Checkmark Badge */}
                      {isSelected && (
                        <View className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-[#F6163C] items-center justify-center">
                          <Ionicons name="checkmark" size={10} color="white" />
                        </View>
                      )}
                      <Ionicons
                        name={mode.icon as any}
                        size={20}
                        color={isSelected ? '#F6163C' : '#64748B'}
                      />
                      <Text
                        className={`text-xs font-bold mt-1 ${
                          isSelected ? 'text-[#F6163C]' : 'text-slate-700'
                        }`}>
                        {mode.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Notification Info Box */}
              <View className="rounded-xl bg-slate-50 border border-slate-200/60 p-2.5 flex-row items-center mb-5">
                <Ionicons name="notifications-outline" size={14} color="#94A3B8" />
                <Text className="ml-2 text-[11px] font-medium text-slate-500">
                  {confirmingItem?.name ? confirmingItem.name.split(' ')[0] : 'Member'} will get a confirmation notification.
                </Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleConfirmApproval}
                activeOpacity={0.85}
                className="h-12 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C] mb-3 shadow-sm">
                <Ionicons name="checkmark" size={16} color="white" style={{ marginRight: 6 }} />
                <Text className="text-sm font-bold text-white">Yes, Activate Membership</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setConfirmingItem(null)}
                activeOpacity={0.7}
                className="py-1.5 items-center justify-center">
                <Text className="text-xs font-semibold text-slate-500">Not yet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 07 · REJECT REQUEST BOTTOM SHEET MODAL (Screen 07 from Figma)             */}
      {/* ========================================================================= */}
      {Boolean(rejectingItem) && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          statusBarTranslucent={true}
          onRequestClose={() => setRejectingItem(null)}>
          <View className="flex-1 justify-end bg-black/60">
            <Pressable className="flex-1" onPress={() => setRejectingItem(null)} />

            <View
              className="rounded-t-[32px] bg-white px-6 pt-3"
              style={{ paddingBottom: Math.max(insets.bottom, 20) }}>
              {/* Grabber Handle */}
              <View className="h-1 w-12 rounded-full bg-slate-200 self-center mb-3.5" />

              {/* Top Icon Badge */}
              <View className="h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 border border-rose-100 mb-3">
                <Ionicons name="close" size={22} color="#F6163C" />
              </View>

              {/* Title */}
              <Text className="font-bold text-[18px] text-slate-900 leading-snug">
                Reject {rejectingItem?.name}'s request?
              </Text>

              {/* Subtitle / Warning Note */}
              <Text className="text-xs text-slate-400 leading-5 mt-1.5 mb-4">
                Only reject if you didn't receive the payment. The request will be declined and {rejectingItem?.name ? rejectingItem.name.split(' ')[0] : 'member'} will be notified so he can try again or pay online.
              </Text>

              {/* Request Summary Card */}
              <View className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-3.5 flex-row items-center justify-between mb-5">
                <View>
                  <Text className="font-bold text-xs text-slate-800">{rejectingItem?.plan}</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">
                    Requested {rejectingItem?.timeAgo}
                  </Text>
                </View>
                <Text className="font-bold text-sm text-slate-900">{rejectingItem?.amount}</Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleConfirmReject}
                activeOpacity={0.85}
                className="h-12 w-full items-center justify-center rounded-2xl bg-[#F6163C] mb-3 shadow-sm">
                <Text className="text-sm font-bold text-white">Yes, Reject Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setRejectingItem(null)}
                activeOpacity={0.7}
                className="h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white">
                <Text className="text-xs font-bold text-slate-700">Go Back</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
