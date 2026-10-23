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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMembershipPlans } from '@/hooks/useMembershipPlans';
import { LocalMembershipPlan } from '@/api/membershipPlanApi';

interface DurationOption {
  label: string;
  months: number;
}

const DURATION_PRESETS: DurationOption[] = [
  { label: '1 Month', months: 1 },
  { label: '3 Months', months: 3 },
  { label: '6 Months', months: 6 },
  { label: '12 Months', months: 12 },
];

export default function MembershipPlansScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const {
    plans,
    isLoading,
    isRefreshing,
    refetch,
    createPlan,
    isCreating,
    updatePlan,
    isUpdating,
    deletePlan,
    isDeleting,
    toggleStatus,
  } = useMembershipPlans();

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LocalMembershipPlan | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formMonths, setFormMonths] = useState<number>(1);
  const [formPrice, setFormPrice] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formValidUpto, setFormValidUpto] = useState('');

  // Track action loading per plan
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingPlan(null);
    setFormName('Monthly Plan');
    setFormMonths(1);
    setFormPrice('');
    setFormDescription('');
    setFormValidUpto('unlimited');
    setModalVisible(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (plan: LocalMembershipPlan) => {
    setEditingPlan(plan);
    setFormName(plan.planName || '');
    setFormMonths(plan.monthDuration || 1);
    setFormPrice(plan.price != null ? String(plan.price) : '');
    setFormDescription(plan.description || '');
    setFormValidUpto(plan.validUpto || 'unlimited');
    setModalVisible(true);
  };

  // Toggle Plan Status
  const handleToggle = async (plan: LocalMembershipPlan) => {
    const docId = plan.documentId || String(plan.id);
    if (!docId || togglingId) return;

    try {
      setTogglingId(docId);
      await toggleStatus({
        documentId: docId,
        isActive: !plan.isActive,
        planName: plan.planName,
      });
    } catch (err) {
      console.error('Error toggling plan status:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Delete Plan with confirmation
  const handleDelete = (plan: LocalMembershipPlan) => {
    const docId = plan.documentId || String(plan.id);
    if (!docId) return;

    Alert.alert(
      'Delete Plan',
      `Are you sure you want to delete "${plan.planName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(docId);
              await deletePlan(docId);
            } catch (err) {
              console.error('Error deleting plan:', err);
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  // Save Plan from Modal
  const handleSave = async () => {
    const cleanName = (formName || '').trim();
    const cleanDescription = (formDescription || '').trim();
    const priceNum = parseInt((formPrice || '').replace(/[^0-9]/g, ''), 10);
    const monthsNum = Number(formMonths) || 1;

    if (!cleanName) {
      Alert.alert('Required Field', 'Please enter a plan name.');
      return;
    }
    if (isNaN(priceNum) || priceNum <= 0) {
      Alert.alert('Invalid Price', 'Please enter a valid price in Rupees.');
      return;
    }

    try {
      if (editingPlan) {
        // Edit existing plan
        const docId = editingPlan.documentId || String(editingPlan.id);
        await updatePlan({
          documentId: docId,
          payload: {
            planName: cleanName,
            price: priceNum,
            monthDuration: monthsNum,
            description: cleanDescription || 'Full gym access & equipment',
            validUpto: formValidUpto || 'unlimited',
          },
        });
      } else {
        // Add new plan
        await createPlan({
          planName: cleanName,
          price: priceNum,
          monthDuration: monthsNum,
          description: cleanDescription || 'Full gym access & equipment',
          isActive: true,
          validUpto: formValidUpto || 'unlimited',
        });
      }

      Keyboard.dismiss();
      setModalVisible(false);
    } catch (err) {
      console.error('Failed to save plan:', err);
    }
  };

  const isSaving = isCreating || isUpdating;

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

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refetch}
            tintColor="#F6163C"
            colors={['#F6163C']}
          />
        }>
        {/* Simple Info Note */}
        <View className="mb-4 flex-row items-center rounded-2xl bg-slate-50 p-3 border border-slate-200/80">
          <Ionicons name="information-circle-outline" size={18} color="#64748B" />
          <Text className="ml-2 flex-1 text-xs text-slate-600 leading-4">
            Members will see these active plans and prices when joining your gym.
          </Text>
        </View>

        {/* Loading Indicator */}
        {isLoading && plans.length === 0 ? (
          <View className="my-12 items-center justify-center">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-3 text-xs font-semibold text-slate-500">
              Loading membership plans...
            </Text>
          </View>
        ) : plans.length === 0 ? (
          /* Empty State */
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
          /* Plans List */
          plans.map((plan) => {
            const planKey = plan.documentId || String(plan.id);
            const isPlanDeleting = deletingId === planKey;
            const isPlanToggling = togglingId === planKey;
            const durationLabel =
              plan.monthDuration === 1
                ? '1 Month'
                : `${plan.monthDuration || 1} Months`;

            return (
              <View
                key={planKey}
                style={{ opacity: plan.isActive ? 1 : 0.6 }}
                className="mb-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                {/* Row 1: Plan Name & Price */}
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 mr-3">
                    {/* Plan Name */}
                    <Text
                      className="font-bold text-base text-slate-900 leading-tight"
                      numberOfLines={2}>
                      {plan.planName}
                    </Text>

                    {/* Duration & Validity Tags */}
                    <View className="flex-row items-center mt-1.5 flex-wrap gap-1.5">
                      <View className="rounded-md bg-slate-100 px-2 py-0.5 border border-slate-200">
                        <Text className="text-[10px] font-semibold text-slate-600">
                          {durationLabel}
                        </Text>
                      </View>
                      {plan.validUpto && plan.validUpto !== 'unlimited' ? (
                        <View className="rounded-md bg-amber-50 px-2 py-0.5 border border-amber-200">
                          <Text className="text-[10px] font-semibold text-amber-700">
                            Valid: {plan.validUpto}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Description */}
                    {plan.description ? (
                      <Text
                        className="mt-1.5 text-xs text-slate-500 leading-4"
                        numberOfLines={2}>
                        {plan.description}
                      </Text>
                    ) : null}
                  </View>

                  {/* Price Display */}
                  <View className="items-end shrink-0 pl-2">
                    <View className="flex-row items-baseline">
                      <Text className="text-sm font-bold text-slate-800">₹</Text>
                      <Text className="text-xl font-extrabold text-slate-900">
                        {plan.price ? plan.price.toLocaleString('en-IN') : '0'}
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
                      value={Boolean(plan.isActive)}
                      disabled={isPlanToggling}
                      onValueChange={() => handleToggle(plan)}
                      trackColor={{ false: '#CBD5E1', true: '#F6163C' }}
                      thumbColor={
                        Platform.OS === 'android'
                          ? plan.isActive
                            ? '#FFFFFF'
                            : '#F1F5F9'
                          : undefined
                      }
                      ios_backgroundColor="#CBD5E1"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                    {isPlanToggling && (
                      <ActivityIndicator
                        size="small"
                        color="#F6163C"
                        style={{ marginLeft: 4 }}
                      />
                    )}
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
                      disabled={isPlanDeleting}
                      className="flex-row items-center rounded-xl bg-slate-100 px-3 py-1.5 border border-slate-200 active:bg-slate-200">
                      <Ionicons name="create-outline" size={13} color="#1E293B" />
                      <Text className="ml-1 text-xs font-semibold text-slate-700">Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleDelete(plan)}
                      disabled={isPlanDeleting}
                      className="h-8 w-8 items-center justify-center rounded-xl bg-slate-100 border border-slate-200 active:bg-rose-50">
                      {isPlanDeleting ? (
                        <ActivityIndicator size="small" color="#EF4444" />
                      ) : (
                        <Ionicons name="trash-outline" size={14} color="#EF4444" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* --- ADD / EDIT MODAL --- */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => {
          if (!isSaving) {
            Keyboard.dismiss();
            setModalVisible(false);
          }
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
                if (!isSaving) {
                  Keyboard.dismiss();
                  setModalVisible(false);
                }
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
                  {editingPlan ? 'Edit Membership Plan' : 'Add Membership Plan'}
                </Text>
                <TouchableOpacity
                  disabled={isSaving}
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
                  maxHeight:
                    keyboardHeight > 0
                      ? Platform.OS === 'android'
                        ? 220
                        : 260
                      : undefined,
                }}>
                {/* Quick Duration Chips */}
                <Text className="text-xs font-semibold text-slate-700 mb-1.5">
                  Select Duration
                </Text>
                <View className="flex-row flex-wrap gap-1.5 mb-3">
                  {DURATION_PRESETS.map((dur) => {
                    const isSelected = formMonths === dur.months;
                    return (
                      <TouchableOpacity
                        key={dur.months}
                        onPress={() => {
                          setFormMonths(dur.months);
                          if (!editingPlan) {
                            if (!formName || DURATION_PRESETS.some((d) => formName.includes(d.label))) {
                              setFormName(`${dur.label} Plan`);
                            }
                          }
                        }}
                        className={`rounded-xl px-3 py-1.5 border ${
                          isSelected
                            ? 'border-[#F6163C] bg-rose-50'
                            : 'border-slate-200 bg-white'
                        }`}>
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-[#F6163C]' : 'text-slate-600'
                          }`}>
                          {dur.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Plan Name */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">
                    Plan Name *
                  </Text>
                  <TextInput
                    value={formName}
                    onChangeText={setFormName}
                    placeholder="e.g. Monthly, Quarterly, Annual"
                    placeholderTextColor="#94A3B8"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 font-semibold"
                  />
                </View>

                {/* Price (₹) */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">
                    Price (₹) *
                  </Text>
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
                    Description & Features
                  </Text>
                  <TextInput
                    value={formDescription}
                    onChangeText={setFormDescription}
                    placeholder="enter description."
                    placeholderTextColor="#94A3B8"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </View>

                {/* Validity (validUpto) */}
                <View className="mb-3">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">
                    Valid Upto
                  </Text>
                  <TextInput
                    value={formValidUpto}
                    onChangeText={setFormValidUpto}
                    placeholder="e.g. unlimited or 2027-09-09"
                    placeholderTextColor="#94A3B8"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900"
                  />
                </View>
              </ScrollView>

              {/* Modal Buttons (Pinned to bottom) */}
              <View className="flex-row items-center gap-2 pt-3 border-t border-slate-100">
                <TouchableOpacity
                  disabled={isSaving}
                  onPress={() => {
                    Keyboard.dismiss();
                    setModalVisible(false);
                  }}
                  className="flex-1 rounded-xl border border-slate-200 py-3 items-center">
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  disabled={isSaving}
                  onPress={handleSave}
                  className="flex-1 flex-row justify-center rounded-xl bg-[#F6163C] py-3 items-center shadow-xs">
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="text-xs font-bold text-white">
                      {editingPlan ? 'Save Changes' : 'Add Plan'}
                    </Text>
                  )}
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
