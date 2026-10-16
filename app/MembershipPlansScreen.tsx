import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Modal,
  Pressable,
  Alert,
  Platform,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

const STORAGE_KEY = '@club_membership_plans_v1';

export interface MembershipPlan {
  id: string;
  name: string;
  duration: string;
  price: number;
  description?: string;
  isActive: boolean;
}

const DEFAULT_PLANS: MembershipPlan[] = [
  {
    id: '1',
    name: '1 Month Membership',
    duration: '1 Month',
    price: 1500,
    description: 'Full gym floor access, cardio equipment & general trainer guidance',
    isActive: true,
  },
  {
    id: '2',
    name: '3 Months Membership',
    duration: '3 Months',
    price: 4000,
    description: 'All gym equipment, locker facility & free diet chart',
    isActive: true,
  },
  {
    id: '3',
    name: '6 Months Membership',
    duration: '6 Months',
    price: 7500,
    description: 'Unlimited access, steam bath, locker & diet consultation',
    isActive: true,
  },
  {
    id: '4',
    name: '1 Year Annual Pass',
    duration: '12 Months',
    price: 13000,
    description: 'All-access 365 days, personal workout plan & 1 month freeze option',
    isActive: true,
  },
];

const DURATION_PRESETS = ['1 Month', '3 Months', '6 Months', '12 Months'];

export default function MembershipPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [plans, setPlans] = useState<MembershipPlan[]>(DEFAULT_PLANS);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formDuration, setFormDuration] = useState('1 Month');
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');

  // Track keyboard height (especially for Android transparent modal)
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Load from Storage
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter(
              (p) =>
                !p.duration?.toLowerCase().includes('1 day') &&
                !p.name?.toLowerCase().includes('1-day')
            );
            setPlans(cleaned);
            if (cleaned.length !== parsed.length) {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
            }
          } else {
            setPlans(DEFAULT_PLANS);
          }
        } else {
          setPlans(DEFAULT_PLANS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLANS));
        }
      } catch {
        setPlans(DEFAULT_PLANS);
      } finally {
        setLoading(false);
      }
    };
    loadPlans();
  }, []);

  const saveToStorage = async (updated: MembershipPlan[]) => {
    setPlans(updated);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save plans:', e);
    }
  };

  // Toggle Plan Status
  const handleToggle = (id: string) => {
    setPlans((prev) => {
      const updated = prev.map((p) => {
        if (p.id === id) {
          const next = !p.isActive;
          Toast.show({
            type: 'success',
            text1: next ? 'Plan Activated' : 'Plan Paused',
            text2: `${p.name} is now ${next ? 'active' : 'paused'}`,
            visibilityTime: 1500,
          });
          return { ...p, isActive: next };
        }
        return p;
      });
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to save toggle:', e)
      );
      return updated;
    });
  };

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPlanId(null);
    setFormName('');
    setFormDuration('1 Month');
    setFormPrice('');
    setFormDescription('Full gym floor access & trainer support');
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (plan: MembershipPlan) => {
    setEditingPlanId(plan.id);
    setFormName(plan.name || '');
    setFormDuration(plan.duration || '1 Month');
    setFormPrice(plan.price != null ? String(plan.price) : '');
    setFormDescription(plan.description || '');
    setModalVisible(true);
  };

  // Delete Plan directly through state
  const handleDelete = (plan: MembershipPlan) => {
    setPlans((prev) => {
      const updated = prev.filter((p) => p.id !== plan.id);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch((e) =>
        console.error('Failed to update storage after delete:', e)
      );
      return updated;
    });
    Toast.show({
      type: 'info',
      text1: 'Plan Deleted',
      text2: `${plan.name} removed`,
      visibilityTime: 1500,
    });
  };

  // Save Plan from Modal
  const handleSave = () => {
    const cleanName = (formName || '').trim();
    const cleanDuration = (formDuration || '').trim() || '1 Month';
    const cleanDescription = (formDescription || '').trim();
    const priceNum = parseInt((formPrice || '').replace(/[^0-9]/g, ''), 10);

    if (!cleanName) {
      Alert.alert('Required Field', 'Please enter a plan name.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in Rupees.');
      return;
    }

    if (editingPlanId) {
      // Edit
      const updated = plans.map((p) => {
        if (p.id === editingPlanId) {
          return {
            ...p,
            name: cleanName,
            duration: cleanDuration,
            price: priceNum,
            description: cleanDescription || 'Full gym access & equipment',
          };
        }
        return p;
      });
      saveToStorage(updated);
      Toast.show({
        type: 'success',
        text1: 'Plan Updated',
        text2: `${cleanName} price updated to ₹${priceNum.toLocaleString('en-IN')}`,
      });
    } else {
      // Add
      const newPlan: MembershipPlan = {
        id: String(Date.now()),
        name: cleanName,
        duration: cleanDuration,
        price: priceNum,
        description: cleanDescription || 'Full gym access & equipment',
        isActive: true,
      };
      saveToStorage([...plans, newPlan]);
      Toast.show({
        type: 'success',
        text1: 'Plan Added',
        text2: `${cleanName} added successfully`,
      });
    }

    setModalVisible(false);
  };

  return (
    <Container>
      {/* Header */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}
        className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-xl bg-slate-100 border border-slate-200">
          <Ionicons name="chevron-back" size={22} color="#1E293B" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-2">
          <Text className="font-bold text-base text-slate-900">Membership Plans</Text>
          <Text className="text-xs text-slate-500">Manage your gym fees & packages</Text>
        </View>

        {/* Add Plan Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleOpenAdd}
          className="flex-row items-center rounded-xl bg-[#F6163C] px-3 py-2 shadow-xs">
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text className="ml-1 text-xs font-bold text-white">Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Simple Info Note */}
        <View className="mb-4 flex-row items-center rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text className="ml-2 flex-1 text-xs text-slate-600 leading-4">
            Members will see these active plans and prices when joining your gym.
          </Text>
        </View>

        {/* Plans List */}
        {plans.length === 0 ? (
          <View className="my-8 items-center justify-center px-4">
            <Image
              source={require('../assets/images/plans_empty.png')}
              style={{ width: 220, height: 220 }}
              resizeMode="contain"
            />
            <Text className="mt-4 font-bold text-lg text-slate-900">No Plans Added</Text>
            <Text className="mt-1 text-xs text-slate-500 text-center max-w-[260px] leading-4">
              Add your gym membership packages and fees here.
            </Text>
            <TouchableOpacity
              onPress={handleOpenAdd}
              activeOpacity={0.85}
              className="mt-5 flex-row items-center rounded-xl bg-[#F6163C] px-6 py-3 shadow-sm">
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="ml-1.5 text-xs font-bold text-white">Add First Plan</Text>
            </TouchableOpacity>
          </View>
        ) : (
          plans.map((plan) => (
            <View
              key={plan.id}
              style={{ opacity: plan.isActive ? 1 : 0.6 }}
              className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
              {/* Row 1: Plan Name & Price */}
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  {/* Plan Name */}
                  <Text className="font-bold text-base text-slate-900 leading-tight" numberOfLines={2}>
                    {plan.name}
                  </Text>

                  {/* Duration Tag */}
                  <View className="flex-row items-center mt-1.5 flex-wrap">
                    <View className="rounded-md bg-slate-100 px-2 py-0.5 border border-slate-200">
                      <Text className="text-[10px] font-semibold text-slate-600">
                        {plan.duration}
                      </Text>
                    </View>
                  </View>

                  {/* Description */}
                  {plan.description ? (
                    <Text className="mt-1.5 text-xs text-slate-500 leading-4" numberOfLines={2}>
                      {plan.description}
                    </Text>
                  ) : null}
                </View>

                {/* Price Display */}
                <View className="items-end shrink-0 pl-2">
                  <View className="flex-row items-baseline">
                    <Text className="text-sm font-bold text-slate-800">₹</Text>
                    <Text className="text-xl font-extrabold text-slate-900">
                      {plan.price.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <Text className="text-[10px] text-slate-400 font-medium">Fee</Text>
                </View>
              </View>

              {/* Divider */}
              <View className="my-3 h-[1px] bg-slate-100" />

              {/* Row 2: Status Toggle & Actions */}
              <View className="flex-row items-center justify-between">
                {/* Active Switch */}
                <View className="flex-row items-center">
                  <Switch
                    value={plan.isActive}
                    onValueChange={() => handleToggle(plan.id)}
                    trackColor={{ false: '#CBD5E1', true: '#F6163C' }}
                    thumbColor={Platform.OS === 'android' ? (plan.isActive ? '#FFFFFF' : '#F1F5F9') : undefined}
                    ios_backgroundColor="#CBD5E1"
                    style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                  />
                  <Text
                    className={`ml-1.5 text-xs font-semibold ${
                      plan.isActive ? 'text-[#F6163C]' : 'text-slate-400'
                    }`}>
                    {plan.isActive ? 'Active' : 'Paused'}
                  </Text>
                </View>

                {/* Edit & Delete Buttons */}
                <View className="flex-row items-center gap-2">
                  <TouchableOpacity
                    onPress={() => handleOpenEdit(plan)}
                    className="flex-row items-center rounded-xl bg-slate-100 px-3 py-1.5 border border-slate-200 active:bg-slate-200">
                    <Ionicons name="create-outline" size={13} color="#1E293B" />
                    <Text className="ml-1 text-xs font-semibold text-slate-700">Edit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleDelete(plan)}
                    className="h-8 w-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 active:bg-rose-50">
                    <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* --- SIMPLE ADD / EDIT MODAL --- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => {
          Keyboard.dismiss();
          setModalVisible(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS === 'ios'}
          style={{ flex: 1 }}>
          <View
            style={[
              styles.modalOverlay,
              Platform.OS === 'android' && keyboardHeight > 0
                ? { paddingBottom: keyboardHeight + 22 }
                : null,
            ]}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => {
                Keyboard.dismiss();
                setModalVisible(false);
              }}
            />
            <View
              style={[
                styles.bottomSheet,
                {
                  paddingBottom:
                    keyboardHeight > 0
                      ? 10
                      : Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16) + 6,
                },
              ]}>
              {/* Header */}
              <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <Text className="font-bold text-base text-slate-900">
                  {editingPlanId ? 'Edit Plan' : 'Add Membership Plan'}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                  className="h-7 w-7 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="close" size={16} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView
                bounces={false}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                style={{
                  maxHeight: keyboardHeight > 0 ? (Platform.OS === 'android' ? 170 : 230) : undefined,
                }}>
                {/* Quick Duration Chips */}
                <Text className="text-xs font-semibold text-slate-700 mb-1.5">Select Duration</Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {DURATION_PRESETS.map((dur) => {
                    const isSelected = formDuration === dur;
                    return (
                      <TouchableOpacity
                        key={dur}
                        onPress={() => {
                          setFormDuration(dur);
                          if (!formName || DURATION_PRESETS.some((d) => formName.includes(d))) {
                            setFormName(`${dur} Plan`);
                          }
                        }}
                        className={`rounded-xl px-3 py-1.5 border ${
                          isSelected ? 'border-[#F6163C] bg-rose-50' : 'border-slate-200 bg-white'
                        }`}>
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-[#F6163C]' : 'text-slate-600'
                          }`}>
                          {dur}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Plan Name */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Plan Name *</Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. 1 Month Plan, Quarterly Membership"
                    placeholderTextColor="#94A3B8"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-semibold"
                  />
                </View>

                {/* Price (₹) */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Price (₹) *</Text>
                  <View className="flex-row items-center rounded-xl border border-slate-200 bg-slate-50 px-3">
                    <Text className="font-bold text-sm text-slate-700 mr-1.5">₹</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={formPrice}
                      onChangeText={setFormPrice}
                      placeholder="1500"
                      placeholderTextColor="#94A3B8"
                      className="flex-1 py-2 text-sm font-bold text-slate-900"
                    />
                  </View>
                </View>

                {/* Description / Perks */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">
                    Included Features (Optional)
                  </Text>
                  <TextInput
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="e.g. Gym access, locker, trainer guidance"
                    placeholderTextColor="#94A3B8"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </View>
              </ScrollView>

              {/* Modal Buttons (Pinned to bottom) */}
              <View className="flex-row items-center gap-2 pt-3 border-t border-slate-100">
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 items-center">
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSave}
                  className="flex-1 rounded-xl bg-[#F6163C] py-3 items-center shadow-xs">
                  <Text className="text-xs font-bold text-white">
                    {editingPlanId ? 'Save Changes' : 'Add Plan'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '90%',
    width: '100%',
  },
});
