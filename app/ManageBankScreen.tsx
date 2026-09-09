/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
  Pressable,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import { ChevronLeft, MoreVertical } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BankAccount {
  id: string;
  name: string;
  holder: string;
  acc: string;
  ifsc: string;
  branch: string;
  isPrimary: boolean;
  logo?: any;
}

const STORAGE_KEY = '@fitfob_saved_bank_accounts';

// Owner maintains a single verified bank account
const DEFAULT_BANKS: BankAccount[] = [
  {
    id: '1',
    name: 'State Bank of India',
    holder: 'Fitfob Partner',
    acc: '123456781234',
    ifsc: 'SBIN0001234',
    branch: 'Main Branch',
    isPrimary: true,
  },
];

const maskAccount = (accNumber: string) => {
  if (!accNumber) return '•••• 0000';
  const clean = String(accNumber).trim();
  if (clean.length <= 4) return clean;
  const last4 = clean.slice(-4);
  return `•••• •••• ${last4}`;
};

const ManageBankScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [banks, setBanks] = useState<BankAccount[]>(DEFAULT_BANKS);
  const [selectedBank, setSelectedBank] = useState<string>('1');
  const [actionBank, setActionBank] = useState<BankAccount | null>(null);

  const processedAccRef = useRef<string | null>(null);

  useEffect(() => {
    const loadBanks = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        let currentList: BankAccount[] = stored ? JSON.parse(stored) : DEFAULT_BANKS;

        // Ensure only 1 bank detail is maintained
        if (Array.isArray(currentList) && currentList.length > 1) {
          currentList = [currentList[0]];
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
        }

        if (params.newAcc && processedAccRef.current !== params.newAcc) {
          processedAccRef.current = params.newAcc as string;

          const newEntry: BankAccount = {
            id: `bank_${Date.now()}`,
            name: (params.newBankName as string) || 'Bank Account',
            holder: (params.beneficiaryName as string) || 'Account Holder',
            acc: String(params.newAcc),
            ifsc: (params.ifsc as string) || 'IFSC0000000',
            branch: 'Main Branch',
            isPrimary: true,
          };

          // Owner has 1 bank detail, replacing previous
          currentList = [newEntry];
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(currentList));
          setSelectedBank(newEntry.id);
        }

        setBanks(currentList);
        if (currentList.length > 0) {
          setSelectedBank(currentList[0].id);
        }
      } catch (error) {
        console.log('Error loading bank accounts:', error);
      }
    };

    loadBanks();
  }, [params.newAcc, params.newBankName, params.beneficiaryName, params.ifsc, params.isPrimary]);

  const handleDeleteAccount = (bankId: string) => {
    Alert.alert(
      'Delete Bank Account',
      'Are you sure you want to remove your bank account details?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBanks([]);
            setSelectedBank('');
            setActionBank(null);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
          },
        },
      ]
    );
  };

  const handleWithdrawal = () => {
    const current = banks.find((b) => b.id === selectedBank) || banks[0];
    if (!current) {
      Alert.alert('No Account Selected', 'Please add a bank account to proceed.');
      return;
    }

    router.push({
      pathname: '/bankSummary',
      params: {
        name: current.name,
        holder: current.holder,
        acc: current.acc,
        ifsc: current.ifsc,
        branch: current.branch,
        logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
      },
    });
  };

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center justify-between py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="font-medium text-base text-[#697281]">Manage Bank Account</Text>
        <View className="w-8" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 110 }}>
        <View className="mt-3">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="font-sans font-medium text-lg text-[#1C1C1C]">Bank Details</Text>
            {banks.length > 0 && (
              <Text className="text-xs text-slate-400 font-medium">1 account linked</Text>
            )}
          </View>

          {banks.length === 0 ? (
            <View className="my-8 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8">
              <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="card-outline" size={30} color="#94A3B8" />
              </View>
              <Text className="font-bold text-base text-slate-800">No Bank Account Linked</Text>
              <Text className="mt-1 px-4 text-center text-xs text-slate-500">
                Add a bank account to receive payouts, settlement dividends, and withdrawals.
              </Text>
            </View>
          ) : (
            banks.map((bank) => {
              const isSelected = selectedBank === bank.id;
              return (
                <TouchableOpacity
                  key={bank.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedBank(bank.id)}
                  className={`mb-3.5 rounded-2xl border-2 bg-white p-4 shadow-2xs ${
                    isSelected ? 'border-[#F6163C]' : 'border-slate-100'
                  }`}>
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1 flex-row items-center">
                      {/* Radio Selection Indicator */}
                      <View
                        className={`mr-3 h-5 w-5 items-center justify-center rounded-full border ${
                          isSelected
                            ? 'border-[#F6163C] bg-[#F6163C]'
                            : 'border-slate-300 bg-white'
                        }`}>
                        {isSelected && <View className="h-2 w-2 rounded-full bg-white" />}
                      </View>

                      {/* Bank Logo */}
                      <View className="mr-3 h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50">
                        <Image
                          source={require('../assets/images/bank_logo.png')}
                          className="h-7 w-7"
                          resizeMode="contain"
                        />
                      </View>

                      {/* Bank Info */}
                      <View className="flex-1 pr-2">
                        <View className="flex-row items-center flex-wrap gap-1.5">
                          <Text className="font-bold text-[15px] text-slate-900" numberOfLines={1}>
                            {bank.name}
                          </Text>
                          {bank.isPrimary && (
                            <View className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5">
                              <Text className="font-semibold text-[10px] text-emerald-700">
                                Primary
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text className="mt-0.5 font-medium text-xs text-slate-500">
                          {maskAccount(bank.acc)}
                        </Text>
                        <Text className="mt-0.5 text-[11px] text-slate-400" numberOfLines={1}>
                          IFSC: {bank.ifsc} • {bank.holder}
                        </Text>
                      </View>
                    </View>

                    {/* Options Menu Button */}
                    <TouchableOpacity
                      onPress={() => setActionBank(bank)}
                      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      className="p-1 rounded-full active:bg-slate-100">
                      <MoreVertical size={20} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          {/* Add / Update Bank Account CTA */}
          <TouchableOpacity
            onPress={() => router.push('/addBankAccount')}
            activeOpacity={0.8}
            className="mt-2 flex-row items-center justify-center rounded-2xl border border-dashed border-rose-300 bg-rose-50/40 p-4">
            <Ionicons name="add-circle" size={22} color="#F6163C" />
            <Text className="ml-2 font-bold text-sm text-[#F6163C]">
              {banks.length > 0 ? 'Update / Change Bank Account' : 'Add Bank Account'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Action Sheet Modal */}
      <Modal
        visible={Boolean(actionBank)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActionBank(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setActionBank(null)}>
          <Pressable
            style={[
              styles.modalCard,
              {
                paddingBottom:
                  Math.max(insets.bottom, 24) + (Platform.OS === 'android' ? 20 : 12),
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View className="mb-3 flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View className="flex-1 pr-2">
                <Text className="font-bold text-base text-slate-900" numberOfLines={1}>
                  {actionBank?.name}
                </Text>
                <Text className="text-xs text-slate-500">
                  {actionBank && maskAccount(actionBank.acc)} • {actionBank?.ifsc}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActionBank(null)} className="p-1">
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* View Details */}
            <TouchableOpacity
              onPress={() => {
                if (actionBank) {
                  const b = actionBank;
                  setActionBank(null);
                  router.push({
                    pathname: '/bankSummary',
                    params: {
                      name: b.name,
                      holder: b.holder,
                      acc: b.acc,
                      ifsc: b.ifsc,
                      branch: b.branch,
                      logo: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
                    },
                  });
                }
              }}
              className="flex-row items-center py-3">
              <Ionicons name="eye-outline" size={20} color="#334155" />
              <Text className="ml-3 font-medium text-sm text-slate-700">View Bank Details</Text>
            </TouchableOpacity>

            {/* Update / Change Bank Details */}
            <TouchableOpacity
              onPress={() => {
                setActionBank(null);
                router.push('/addBankAccount');
              }}
              className="flex-row items-center border-t border-slate-100 py-3">
              <Ionicons name="create-outline" size={20} color="#334155" />
              <Text className="ml-3 font-medium text-sm text-slate-700">
                Update Bank Account
              </Text>
            </TouchableOpacity>

            {/* Delete Account */}
            <TouchableOpacity
              onPress={() => handleDeleteAccount(actionBank!.id)}
              className="flex-row items-center border-t border-slate-100 py-3">
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
              <Text className="ml-3 font-medium text-sm text-red-500">Delete Account</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Bottom Withdrawal Button - Hidden when modal is open so nothing peeks out on Android */}
      {!actionBank && (
        <View className="absolute bottom-6 left-5 right-5">
          <Button
            onPress={handleWithdrawal}
            title="Withdrawal"
            disabled={banks.length === 0}
            style={{ backgroundColor: banks.length > 0 ? '#F6163C' : '#E5E7EB' }}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
});

export default ManageBankScreen;
