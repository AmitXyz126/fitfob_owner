import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
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
  Keyboard,
  UIManager,
  LayoutAnimation,
  Animated,
  Easing,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import offlineMemberApi, { CreateOfflineMemberPayload } from '@/api/offlineMemberApi';
import { gymContractApi } from '@/api/gymContractApi';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';

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
  claimStatus?: 'claimed' | 'unclaimed' | string;
  statusBadge?: string;
  statusColor?: string;
  startDate?: string;
  endDate?: string;
}

interface PendingApprovalItem {
  id: string;
  documentId?: string;
  name: string;
  phone: string;
  plan: string;
  amount: string;
  timeAgo: string;
  raw?: any;
}

interface PlanOption {
  id: string;
  name: string;
  price: string;
  months: number;
}

const MEMBERSHIP_PLANS: PlanOption[] = [
  { id: 'monthly', name: '1-Month Basic', price: '₹2,000', months: 1 },
  { id: 'three_months', name: '3-Month Pro', price: '₹4,500', months: 3 },
  { id: 'six_months', name: '6-Month Gold', price: '₹8,000', months: 6 },
  { id: 'twelve_months', name: 'Annual Pro', price: '₹15,000', months: 12 },
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

// Helper: Format relative time (e.g. 2 min ago, 1 hr ago)
function formatTimeAgo(dateString?: string): string {
  if (!dateString) return 'Just now';
  try {
    const diffMs = Date.now() - new Date(dateString).getTime();
    if (isNaN(diffMs) || diffMs < 0) return 'Just now';
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return new Date(dateString).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  } catch {
    return 'Recently';
  }
}

// Helper: Format Date to YYYY-MM-DD
function formatDateToYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// Helper: Format Date for Display (e.g. 24 Nov 2026)
function formatDateDisplay(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// Helper: Compute End Date given Start Date & Months
function computeEndDate(startDate: Date, months: number): Date {
  const end = new Date(startDate);
  end.setMonth(end.getMonth() + months);
  return end;
}

function formatPlanTitle(duration?: string): string {
  switch (duration?.toLowerCase()) {
    case 'monthly':
    case '1_month':
      return '1-Month Basic';
    case 'three_months':
    case '3_months':
      return '3-Month Pro';
    case 'six_months':
    case '6_months':
      return '6-Month Gold';
    case 'twelve_months':
    case '12_months':
    case 'annual':
    case 'yearly':
      return 'Annual Pro';
    default:
      return duration ? duration.replace(/_/g, ' ') : 'Membership Plan';
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

  // Dashboard state (starts empty, loads real members and pending approvals from backend)
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalItem[]>([]);
  const [isLoadingPending, setIsLoadingPending] = useState(false);
  const [isRefreshingPending, setIsRefreshingPending] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'active' | 'pending'>('active');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortMode, setSortMode] = useState<'expiry' | 'name'>('expiry');

  // Plans list state (loaded from gym contract or defaults)
  const [plansList, setPlansList] = useState<PlanOption[]>(MEMBERSHIP_PLANS);
  const [selectedPlan, setSelectedPlan] = useState<PlanOption>(MEMBERSHIP_PLANS[0]); // Default to 1-Month Basic ("monthly")

  // Date objects for Start Date & End Date (API requires YYYY-MM-DD, e.g. "2026-11-10")
  const [startDateObj, setStartDateObj] = useState<Date>(() => new Date());
  const [endDateObj, setEndDateObj] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    return d;
  });

  // Display strings
  const startDateDisplay = useMemo(() => formatDateDisplay(startDateObj), [startDateObj]);
  const endDateDisplay = useMemo(() => formatDateDisplay(endDateObj), [endDateObj]);
  const startDateYMD = useMemo(() => formatDateToYMD(startDateObj), [startDateObj]);
  const endDateYMD = useMemo(() => formatDateToYMD(endDateObj), [endDateObj]);

  // Date picker state for manual start date selection
  const [showDatePicker, setShowDatePicker] = useState(false);

  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (selectedDate && (event.type === 'set' || Platform.OS === 'ios')) {
      setStartDateObj(selectedDate);
      // Auto-compute expiry date according to the selected plan
      setEndDateObj(computeEndDate(selectedDate, selectedPlan.months));
    }
  };

  // Add Member Form state (Default empty so owner fills details themselves)
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSms, setSendSms] = useState(true);

  // Loading & Submitting states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingOfflineMembers, setIsLoadingOfflineMembers] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Invite channel representation for backend payload: "both" | "whatsapp" | "sms"
  const channelPayload = useMemo<'both' | 'whatsapp' | 'sms'>(() => {
    if (sendWhatsApp && sendSms) return 'both';
    if (sendWhatsApp) return 'whatsapp';
    if (sendSms) return 'sms';
    return 'both';
  }, [sendWhatsApp, sendSms]);

  // Fetch offline members list from backend GET /api/club-owner/offline-members
  const fetchMembersList = useCallback(async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) setIsRefreshing(true);
      else setIsLoadingOfflineMembers(true);

      const remote = await offlineMemberApi.getOfflineMembers();
      console.log('📥 [fetchMembersList] Fetched remote members count:', Array.isArray(remote) ? remote.length : 0);

      if (Array.isArray(remote)) {
        if (remote.length === 0) {
          setMembers([]);
          return;
        }

        const avatarBgColors = ['#FCE7F3', '#FFE4E6', '#FEF3C7', '#E0F2FE', '#EDE9FE'];
        const avatarTextColors = ['#BE185D', '#E11D48', '#B45309', '#0369A1', '#6D28D9'];

        const mapped: MemberItem[] = remote.map((rm: any, idx: number) => {
          const name = rm.name || rm.fullName || 'Member';
          const cleanP = rm.phoneNumber || rm.phone || '';
          const phoneFormatted = cleanP ? (cleanP.startsWith('+91') ? cleanP : `+91 ${cleanP}`) : '';
          const planTitle = rm.planName || rm.plan || formatPlanTitle(rm.planId) || 'Monthly';

          // Check if member is unclaimed -> status badge "Invite Sent"
          const isUnclaimed =
            rm.claimStatus?.toLowerCase() === 'unclaimed' ||
            rm.isUnclaimed === true ||
            rm.statusBadge?.toLowerCase() === 'invite sent' ||
            rm.status?.toLowerCase() === 'invite_sent' ||
            rm.status?.toLowerCase() === 'unclaimed';

          let status: 'active' | 'expiring_soon' | 'invite_sent' = 'active';
          let statusBadge = rm.statusBadge || 'Active';

          if (isUnclaimed) {
            status = 'invite_sent';
            statusBadge = 'Invite Sent';
          } else if (rm.isExpiringSoon || rm.status === 'expiring_soon') {
            status = 'expiring_soon';
            statusBadge = 'Expiring Soon';
          } else if (rm.isExpired) {
            status = 'expiring_soon';
            statusBadge = 'Expired';
          } else {
            status = 'active';
            statusBadge = 'Active';
          }

          let expiryText = 'Active';
          if (isUnclaimed) {
            expiryText = 'Invite Sent';
          } else if (rm.endDate) {
            try {
              expiryText = `Exp ${formatDateDisplay(new Date(rm.endDate))}`;
            } catch {
              expiryText = `Exp ${rm.endDate}`;
            }
          }

          const colorIdx = idx % avatarBgColors.length;

          return {
            id: String(rm.id || rm.documentId || rm._id || idx),
            name,
            initials: getInitials(name),
            avatarBg: avatarBgColors[colorIdx],
            avatarText: avatarTextColors[colorIdx],
            plan: planTitle,
            expiryText,
            status,
            phone: phoneFormatted,
            claimStatus: rm.claimStatus || (isUnclaimed ? 'unclaimed' : 'claimed'),
            statusBadge,
            statusColor: rm.statusColor || (isUnclaimed ? 'yellow' : 'green'),
            startDate: rm.startDate,
            endDate: rm.endDate,
          };
        });
        setMembers(mapped);
      }
    } catch (err: any) {
      console.error('Note: Error fetching remote offline members list:', err?.response?.data || err?.message);
    } finally {
      setIsLoadingOfflineMembers(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch pending approvals from backend GET /api/club-owner/pending-approvals
  const fetchPendingList = useCallback(async (isPullRefresh = false) => {
    try {
      if (isPullRefresh) setIsRefreshingPending(true);
      else setIsLoadingPending(true);

      const remote = await offlineMemberApi.getPendingApprovals();
      console.log('📥 [fetchPendingList] Fetched pending approvals count:', Array.isArray(remote) ? remote.length : 0);

      if (Array.isArray(remote)) {
        if (remote.length === 0) {
          setPendingApprovals([]);
          return;
        }

        const mapped: PendingApprovalItem[] = remote.map((item: any, idx: number) => {
          const name =
            item.name ||
            item.clientName ||
            item.userName ||
            item.user?.name ||
            item.client?.name ||
            item.fullName ||
            'Member';
          const cleanP =
            item.phoneNumber ||
            item.phone ||
            item.user?.phoneNumber ||
            item.client?.phoneNumber ||
            '';
          const phoneFormatted = cleanP
            ? cleanP.startsWith('+91')
              ? cleanP
              : `+91 ${cleanP}`
            : '';
          const plan =
            item.planName ||
            item.plan ||
            item.planTitle ||
            item.membershipPlan?.name ||
            item.duration ||
            'Membership';

          let amount = '₹0';
          if (item.amount !== undefined && item.amount !== null) {
            amount = String(item.amount).startsWith('₹')
              ? String(item.amount)
              : `₹${typeof item.amount === 'number' ? item.amount.toLocaleString('en-IN') : item.amount}`;
          } else if (item.price !== undefined && item.price !== null) {
            amount = String(item.price).startsWith('₹')
              ? String(item.price)
              : `₹${typeof item.price === 'number' ? item.price.toLocaleString('en-IN') : item.price}`;
          }

          const timeAgo =
            item.timeAgo ||
            formatTimeAgo(item.createdAt || item.requestedAt || item.date || item.updatedAt);

          return {
            id: String(item.id || item.documentId || item._id || idx),
            documentId: item.documentId ? String(item.documentId) : undefined,
            name,
            phone: phoneFormatted,
            plan,
            amount,
            timeAgo,
            raw: item,
          };
        });

        setPendingApprovals(mapped);
      }
    } catch (err: any) {
      console.error('Note: Error fetching pending approvals list:', err?.response?.data || err?.message);
    } finally {
      setIsLoadingPending(false);
      setIsRefreshingPending(false);
    }
  }, []);

  // Fetch contract plans & existing offline members & pending approvals on mount
  useEffect(() => {
    // 1. Fetch offline members list immediately
    fetchMembersList(false);

    // 2. Fetch pending approvals list immediately
    fetchPendingList(false);

    // 3. Fetch gym contract plans in parallel
    const loadPlans = async () => {
      try {
        const contract = await gymContractApi.getMyContract();
        if (contract?.plans && contract.plans.length > 0) {
          const mapped: PlanOption[] = contract.plans.map((p) => {
            let months = 1;
            if (p.duration === 'three_months') months = 3;
            else if (p.duration === 'six_months') months = 6;
            else if (p.duration === 'twelve_months') months = 12;

            return {
              id: p.duration,
              name: formatPlanTitle(p.duration),
              price: `₹${p.customerPrice?.toLocaleString('en-IN') || 0}`,
              months,
            };
          });
          setPlansList(mapped);
          setSelectedPlan(mapped[0]);
          setEndDateObj(computeEndDate(new Date(), mapped[0].months));
        }
      } catch (err) {
        console.log('Using default membership plans');
      }
    };

    loadPlans();
  }, [fetchMembersList, fetchPendingList]);

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
    setEndDateObj(computeEndDate(startDateObj, plan.months));
    setIsPlanPickerVisible(false);
  };

  // Step 2 -> Step 3: Validate and open Double-Check modal
  const handleReviewAndSend = () => {
    const cleanPhone = phone.trim().replace(/^\+91/, '').replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
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

  // Step 3 -> Step 4: Confirm and Add Member (Calls POST /api/club-owner/offline-members)
  const handleConfirmAddMember = async () => {
    const cleanPhone = phone.trim().replace(/^\+91/, '').replace(/\s+/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
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

    setIsSubmitting(true);
    try {
      const payload: CreateOfflineMemberPayload = {
        name: fullName.trim(),
        phoneNumber: cleanPhone,
        planId: selectedPlan.id,
        startDate: startDateYMD,
        endDate: endDateYMD,
        channel: channelPayload,
      };

      console.log('📤 Submitting to /api/club-owner/offline-members:', payload);
      const res = await offlineMemberApi.createOfflineMember(payload);
      console.log('✅ Offline member created successfully:', res);

      setIsDoubleCheckVisible(false);

      // Add newly invited member to active members list
      const newMember: MemberItem = {
        id: res?.data?.id ? String(res.data.id) : Date.now().toString(),
        name: fullName.trim(),
        initials: getInitials(fullName),
        avatarBg: '#FFE4E6',
        avatarText: '#F6163C',
        plan: selectedPlan.name,
        expiryText: 'Invite sent',
        status: 'invite_sent',
        phone: `+91 ${cleanPhone}`,
      };

      setMembers((prev) => [newMember, ...prev]);

      // Re-fetch in background to sync with server
      fetchMembersList(false).catch(() => {});

      // Transition to Screen 04
      setViewMode('success');

      Toast.show({
        type: 'success',
        text1: 'Member Added Successfully! 🎉',
        text2: res?.message || `Invite link sent to ${fullName.trim()} on ${inviteChannelText}.`,
      });
    } catch (error: any) {
      const errMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to add offline member. Please try again.';

      Toast.show({
        type: 'error',
        text1: 'Failed to Add Member',
        text2: String(errMsg),
      });
    } finally {
      setIsSubmitting(false);
    }
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
    fetchPendingList(false);
    fetchMembersList(false);

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
    fetchPendingList(false);

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
                onPress={() => {
                  setSelectedTab('active');
                  fetchMembersList(false);
                }}
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
                onPress={() => {
                  setSelectedTab('pending');
                  fetchPendingList(false);
                }}
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
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshing}
                    onRefresh={() => fetchMembersList(true)}
                    colors={['#F6163C']}
                    tintColor="#F6163C"
                  />
                }
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
                {isLoadingOfflineMembers && members.length === 0 ? (
                  <View className="items-center py-12">
                    <ActivityIndicator size="large" color="#F6163C" />
                    <Text className="mt-3 text-xs font-semibold text-slate-500">Loading offline members...</Text>
                  </View>
                ) : filteredMembers.length === 0 ? (
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

                        {/* Right: Status Pill */}
                        <View className="flex-row items-center">
                          {isInviteSent ? (
                            <View className="flex-row items-center rounded-full bg-amber-50 border border-amber-200/80 px-2.5 py-1">
                              <Ionicons name="time-outline" size={12} color="#D97706" />
                              <Text className="ml-1 text-[11px] font-bold text-amber-700">
                                {item.statusBadge || 'Invite Sent'}
                              </Text>
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
                refreshControl={
                  <RefreshControl
                    refreshing={isRefreshingPending}
                    onRefresh={() => fetchPendingList(true)}
                    colors={['#F6163C']}
                    tintColor="#F6163C"
                  />
                }
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 60 }}>
                {isLoadingPending && pendingApprovals.length === 0 ? (
                  <View className="items-center py-16">
                    <ActivityIndicator size="large" color="#F6163C" />
                    <Text className="mt-3 text-xs font-semibold text-slate-500">Loading pending approvals...</Text>
                  </View>
                ) : pendingApprovals.length === 0 ? (
                  <View className="items-center py-12 px-6">
                    <View className="mb-2 items-center justify-center">
                      <Image
                        source={require('../assets/images/approval_check_3d_red.jpg')}
                        style={{ width: 140, height: 140 }}
                        resizeMode="contain"
                      />
                    </View>
                    <Text className="text-base font-bold text-slate-800 text-center">
                      No Pending Approvals
                    </Text>
                    <Text className="mt-1 text-xs text-slate-400 text-center max-w-[250px] leading-4">
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
                onPress={() => {
                  setPhone('');
                  setFullName('');
                  setViewMode('add_member');
                }}
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
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
          className="flex-1 bg-white">
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
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingTop: 16,
              paddingBottom: Math.max(insets.bottom, 24) + 40,
            }}>
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
                  placeholder="Enter 10-digit number"
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
                placeholder="Enter member's full name"
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
                  activeOpacity={0.7}
                  onPress={() => setShowDatePicker(true)}
                  className="flex-row items-center justify-between rounded-xl border border-rose-200 bg-rose-50/30 px-3 py-3">
                  <Text className="text-xs font-bold text-slate-900">{startDateDisplay}</Text>
                  <Ionicons name="calendar" size={16} color="#F6163C" />
                </TouchableOpacity>
                <Text className="mt-1 text-[10px] text-slate-400">Tap to select start date</Text>
              </View>

              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-700 mb-1.5">Expiry Date</Text>
                <View className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="text-xs font-bold text-slate-900">{endDateDisplay}</Text>
                  <Ionicons name="lock-closed" size={14} color="#94A3B8" />
                </View>
                <Text className="mt-1 text-[10px] text-emerald-600 font-semibold">
                  Auto-calculated ({selectedPlan.months} mo)
                </Text>
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

            {/* Action Button: Review & Send Invite (Inside ScrollView) */}
            <View className="mt-4 pt-2 pb-4">
              <TouchableOpacity
                onPress={handleReviewAndSend}
                activeOpacity={0.85}
                className="h-12 w-full items-center justify-center rounded-2xl bg-[#F6163C] shadow-sm">
                <Text className="text-[15px] font-bold text-white">Review & Send Invite</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Manual Start Date Picker */}
          {showDatePicker && (
            Platform.OS === 'ios' ? (
              <Modal transparent animationType="fade" visible={showDatePicker}>
                <Pressable
                  className="flex-1 bg-black/40 justify-end"
                  onPress={() => setShowDatePicker(false)}>
                  <View className="bg-white rounded-t-3xl p-5 pb-8">
                    <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <Text className="font-bold text-base text-slate-800">Select Start Date</Text>
                      <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                        <Text className="font-bold text-sm text-[#F6163C]">Done</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePicker
                      value={startDateObj}
                      mode="date"
                      display="spinner"
                      onChange={onStartDateChange}
                      themeVariant="light"
                    />
                  </View>
                </Pressable>
              </Modal>
            ) : (
              <DateTimePicker
                value={startDateObj}
                mode="date"
                display="default"
                onChange={onStartDateChange}
              />
            )
          )}
        </KeyboardAvoidingView>
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
                  <Text className="text-xs font-bold text-slate-900">{startDateDisplay}</Text>
                </View>

                <View className="flex-row items-center justify-between py-2 border-b border-slate-200/60">
                  <Text className="text-xs font-medium text-slate-500">Expiry Date</Text>
                  <Text className="text-xs font-bold text-slate-900">{endDateDisplay}</Text>
                </View>

                <View className="flex-row items-center justify-between pt-2">
                  <Text className="text-xs font-medium text-slate-500">Invite via</Text>
                  <Text className="text-xs font-bold text-[#F6163C]">{inviteChannelText}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                onPress={handleConfirmAddMember}
                disabled={isSubmitting}
                activeOpacity={0.85}
                className={`h-12 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C] mb-2.5 ${
                  isSubmitting ? 'opacity-70' : ''
                }`}>
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text className="text-sm font-bold text-white">Adding Member...</Text>
                  </>
                ) : (
                  <Text className="text-sm font-bold text-white">Confirm & Add Member</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setIsDoubleCheckVisible(false)}
                disabled={isSubmitting}
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
                  <Text className="text-xs font-bold text-slate-800 mt-0.5">{endDateDisplay}</Text>
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
                {plansList.map((plan) => {
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
