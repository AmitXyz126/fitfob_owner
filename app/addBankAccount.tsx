import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ChevronLeft, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';
import { Button } from '@/components/Button';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

const COMMON_BANKS: Record<string, string> = {
  SBIN: 'State Bank of India',
  HDFC: 'HDFC Bank',
  ICIC: 'ICICI Bank',
  UTIB: 'Axis Bank',
  KKBK: 'Kotak Mahindra Bank',
  PUNB: 'Punjab National Bank',
  BARB: 'Bank of Baroda',
  CNRB: 'Canara Bank',
  UBIN: 'Union Bank of India',
  INDB: 'IndusInd Bank',
  YESB: 'Yes Bank',
  IDFB: 'IDFC FIRST Bank',
  BKID: 'Bank of India',
  CBIN: 'Central Bank of India',
};

const AddBankScreen = () => {
  const router = useRouter();

  const [isPrimary, setIsPrimary] = useState(false);
  const [formData, setFormData] = useState({
    beneficiaryName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifsc: '',
  });

  const [touched, setTouched] = useState({
    beneficiaryName: false,
    accountNumber: false,
    confirmAccountNumber: false,
    ifsc: false,
  });

  // Validation functions
  const validateBeneficiaryName = (name: string): string => {
    const trimmed = name.trim();
    if (!trimmed) {
      return 'Beneficiary name is required';
    }
    if (trimmed.length < 2) {
      return 'Beneficiary name must be at least 2 characters';
    }
    if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
      return 'Beneficiary name should only contain letters and spaces';
    }
    return '';
  };

  const validateAccountNumber = (acc: string): string => {
    const trimmed = acc.trim();
    if (!trimmed) {
      return 'Bank account number is required';
    }
    if (!/^[0-9]+$/.test(trimmed)) {
      return 'Account number must contain numeric digits only';
    }
    if (trimmed.length < 9 || trimmed.length > 18) {
      return 'Account number must be between 9 and 18 digits';
    }
    return '';
  };

  const validateConfirmAccountNumber = (confirmAcc: string, acc: string): string => {
    const trimmed = confirmAcc.trim();
    if (!trimmed) {
      return 'Please confirm your bank account number';
    }
    if (trimmed !== acc.trim()) {
      return 'Account numbers do not match';
    }
    return '';
  };

  const validateIFSC = (ifscCode: string): string => {
    const trimmed = ifscCode.trim().toUpperCase();
    if (!trimmed) {
      return 'IFSC code is required';
    }
    if (trimmed.length !== 11) {
      return 'IFSC code must be exactly 11 characters';
    }
    if (!/^[A-Z]{4}/.test(trimmed)) {
      return 'First 4 characters must be uppercase letters (A-Z)';
    }
    if (trimmed.charAt(4) !== '0') {
      return "5th character must always be '0'";
    }
    if (!IFSC_REGEX.test(trimmed)) {
      return 'Invalid IFSC format. Example: SBIN0001234';
    }
    return '';
  };

  const beneficiaryNameError = validateBeneficiaryName(formData.beneficiaryName);
  const accountNumberError = validateAccountNumber(formData.accountNumber);
  const confirmAccountNumberError = validateConfirmAccountNumber(
    formData.confirmAccountNumber,
    formData.accountNumber
  );
  const ifscError = validateIFSC(formData.ifsc);

  const isFormValid =
    !beneficiaryNameError &&
    !accountNumberError &&
    !confirmAccountNumberError &&
    !ifscError;

  const isIfscFullyValid = !ifscError && formData.ifsc.length === 11;
  const detectedBankName =
    isIfscFullyValid && formData.ifsc.length >= 4
      ? COMMON_BANKS[formData.ifsc.slice(0, 4)] || null
      : null;

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleBeneficiaryNameChange = (text: string) => {
    // Only allow letters, spaces, dots, hyphens, and apostrophes
    const filtered = text.replace(/[^a-zA-Z\s.'-]/g, '');
    setFormData((prev) => ({ ...prev, beneficiaryName: filtered }));
  };

  const handleAccountNumberChange = (text: string) => {
    // Only allow digits up to 18 characters
    const numeric = text.replace(/[^0-9]/g, '').slice(0, 18);
    setFormData((prev) => ({ ...prev, accountNumber: numeric }));
  };

  const handleConfirmAccountNumberChange = (text: string) => {
    // Only allow digits up to 18 characters
    const numeric = text.replace(/[^0-9]/g, '').slice(0, 18);
    setFormData((prev) => ({ ...prev, confirmAccountNumber: numeric }));
  };

  const handleIFSCChange = (text: string) => {
    // Uppercase, reject spaces & special characters, max 11 chars
    const uppercaseAlphanumeric = text
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 11);
    setFormData((prev) => ({ ...prev, ifsc: uppercaseAlphanumeric }));
  };

  const handleSubmit = () => {
    setTouched({
      beneficiaryName: true,
      accountNumber: true,
      confirmAccountNumber: true,
      ifsc: true,
    });

    if (!isFormValid) {
      return;
    }

    const ifscPrefix = formData.ifsc.slice(0, 4).toUpperCase();
    const bankName = detectedBankName || `${ifscPrefix} Bank`;

    router.push({
      pathname: '/ManageBankScreen',
      params: {
        newBankName: bankName,
        newAcc: formData.accountNumber,
        beneficiaryName: formData.beneficiaryName.trim(),
        ifsc: formData.ifsc.trim(),
        isPrimary: String(isPrimary),
      },
    });
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <ChevronLeft color="black" size={24} />
          </TouchableOpacity>
          <Text className="font-medium text-base text-[#697281]">Add Bank Account</Text>
          <TouchableOpacity className="p-1">
            <Bell color="#F6163C" size={24} fill="#F6163C" />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="mt-2"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}>
          <Text className="mb-6 font-sans font-medium text-xl text-[#1C1C1C]">
            Bank Details
          </Text>

          <View className="space-y-4">
            {/* 1. Beneficiary Name */}
            <View>
              <Text className="mb-2 ml-1 font-sans text-sm leading-sm text-secondaryText">
                Beneficiary Name <Text className="text-red-500">*</Text>
              </Text>
              <View
                className={`flex-row items-center rounded-xl border bg-gray-50 px-4 ${
                  touched.beneficiaryName && beneficiaryNameError
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-gray-200'
                }`}>
                <TextInput
                  placeholder="Enter name as per bank records"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  autoCorrect={false}
                  className="h-14 flex-1 text-base text-slate-800"
                  value={formData.beneficiaryName}
                  onChangeText={handleBeneficiaryNameChange}
                  onBlur={() => handleBlur('beneficiaryName')}
                />
                {formData.beneficiaryName.trim().length > 1 && !beneficiaryNameError && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
              {touched.beneficiaryName && beneficiaryNameError ? (
                <Text className="ml-1 mt-1 font-medium text-xs text-red-500">
                  {beneficiaryNameError}
                </Text>
              ) : null}
            </View>

            {/* 2. Beneficiary Account Number */}
            <View>
              <Text className="mb-2 ml-1 mt-2 font-sans text-sm leading-sm text-secondaryText">
                Beneficiary Account Number <Text className="text-red-500">*</Text>
              </Text>
              <View
                className={`flex-row items-center rounded-xl border bg-gray-50 px-4 ${
                  touched.accountNumber && accountNumberError
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-gray-200'
                }`}>
                <TextInput
                  placeholder="Enter 9 to 18-digit account number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={18}
                  className="h-14 flex-1 text-base text-slate-800"
                  value={formData.accountNumber}
                  onChangeText={handleAccountNumberChange}
                  onBlur={() => handleBlur('accountNumber')}
                />
                {formData.accountNumber.length >= 9 && !accountNumberError && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
              {touched.accountNumber && accountNumberError ? (
                <Text className="ml-1 mt-1 font-medium text-xs text-red-500">
                  {accountNumberError}
                </Text>
              ) : null}
            </View>

            {/* 3. Confirm Beneficiary Account Number */}
            <View>
              <Text className="mb-2 ml-1 mt-2 font-sans text-sm leading-sm text-secondaryText">
                Confirm Account Number <Text className="text-red-500">*</Text>
              </Text>
              <View
                className={`flex-row items-center rounded-xl border bg-gray-50 px-4 ${
                  touched.confirmAccountNumber && confirmAccountNumberError
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-gray-200'
                }`}>
                <TextInput
                  placeholder="Re-enter bank account number"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  maxLength={18}
                  className="h-14 flex-1 text-base text-slate-800"
                  value={formData.confirmAccountNumber}
                  onChangeText={handleConfirmAccountNumberChange}
                  onBlur={() => handleBlur('confirmAccountNumber')}
                />
                {formData.confirmAccountNumber.length >= 9 && !confirmAccountNumberError && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
              {touched.confirmAccountNumber && confirmAccountNumberError ? (
                <Text className="ml-1 mt-1 font-medium text-xs text-red-500">
                  {confirmAccountNumberError}
                </Text>
              ) : null}
            </View>

            {/* 4. IFSC Code */}
            <View>
              <View className="mb-2 ml-1 mt-2 flex-row items-center justify-between">
                <Text className="font-sans text-sm leading-sm text-secondaryText">
                  IFSC Code <Text className="text-red-500">*</Text>
                </Text>
                {detectedBankName && (
                  <Text className="font-semibold text-xs text-[#10B981]">
                    {detectedBankName}
                  </Text>
                )}
              </View>
              <View
                className={`flex-row items-center rounded-xl border bg-gray-50 px-4 ${
                  touched.ifsc && ifscError
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-gray-200'
                }`}>
                <TextInput
                  placeholder="e.g. SBIN0001234"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={11}
                  className="h-14 flex-1 text-base text-slate-800 font-medium uppercase"
                  value={formData.ifsc}
                  onChangeText={handleIFSCChange}
                  onBlur={() => handleBlur('ifsc')}
                />
                {isIfscFullyValid ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : (
                  <Text className="font-mono text-xs text-slate-400">
                    {formData.ifsc.length}/11
                  </Text>
                )}
              </View>
              {touched.ifsc && ifscError ? (
                <Text className="ml-1 mt-1 font-medium text-xs text-red-500">
                  {ifscError}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Checkbox Section */}
          <TouchableOpacity
            onPress={() => setIsPrimary(!isPrimary)}
            activeOpacity={0.7}
            className="ml-1 mt-5 flex-row items-center">
            <MaterialCommunityIcons
              name={isPrimary ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              color={isPrimary ? '#F6163C' : '#94A3B8'}
            />
            <Text className="ml-2 font-normal text-sm text-[#666D6D]">
              Set this as my Primary Bank Account
            </Text>
          </TouchableOpacity>

          {/* Info Box */}
          <View className="mt-5 rounded-2xl bg-[#F8FAFC] p-4 border border-slate-100">
            <View className="flex-row items-center mb-1">
              <Ionicons name="information-circle" size={16} color="#64748B" />
              <Text className="ml-1.5 font-bold text-xs text-slate-700">Important Note</Text>
            </View>
            <Text className="font-normal text-xs leading-4 text-slate-500">
              All your dividends, settlements, and default payouts will be securely deposited to this bank account.
            </Text>
          </View>

          <View className="flex-1" />

          {/* Continue Button */}
          <View className="pb-8 pt-6">
            <Button
              title="Continue"
              disabled={!isFormValid}
              style={{ backgroundColor: isFormValid ? '#F6163C' : '#E5E7EB' }}
              onPress={handleSubmit}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default AddBankScreen;