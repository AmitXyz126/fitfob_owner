/* eslint-disable react-hooks/exhaustive-deps */
import  { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import api from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';
import { userDetailsApi } from '@/api/userdetailsApi';
import { VerificationOtpModal } from '@/components/VerificationOtpModal';
 
const OnBoarding1 = forwardRef(({ initialData, onNext, onValidationChange }: any, ref) => {
  const { profileStatus, submitStep1 } = useUserDetail();
  const { user } = useAuthStore();
  const userId = profileStatus?.id || profileStatus?.pendingClubOwnerId;
  const STORAGE_KEY = `@onboarding_step1_data_${userId || user?.id || user?.email || 'guest'}`;
  const isSubmitting = submitStep1.isPending;

  const [clubName, setClubName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [LogoId, setLogoId] = useState<any>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // OTP Verification States
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [targetOtpType, setTargetOtpType] = useState<'phone' | 'email'>('email');

  // Use a flag to ensure single initialization
  const [isInitialized, setIsInitialized] = useState(false);

console.log (ref ,"ref")
console.log(initialData,"initialdata")
  const getImageUriString = (val: any): string => {
    if (!val) return '';
    let str = '';
    if (typeof val === 'string') {
      str = val;
    } else if (typeof val === 'object') {
      str =
        val.uri ||
        val.url ||
        val.path ||
        val.src ||
        val.logoUrl ||
        val?.attributes?.url ||
        val?.data?.attributes?.url ||
        val?.data?.url ||
        '';
    }
    if (!str) return '';
    if (str.startsWith('/')) {
      const baseUrl = process.env.EXPO_PUBLIC_API_URL || '';
      if (baseUrl) {
        const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
        return `${cleanBase}${str}`;
      }
    }
    return str;
  };

  const isDummyEmail = (val?: string | null): boolean => {
    if (!val) return false;
    const lower = String(val).toLowerCase().trim();
    return (
      lower.endsWith('@phone.user') ||
      lower.includes('@phone.') ||
      lower.endsWith('@dummy.user') ||
      lower.endsWith('@temp.user')
    );
  };

  const formatPhoneDigits = (raw: any): string => {
    if (!raw) return '';
    const digits = String(raw).replace(/\D/g, '');
    if (digits.length > 10) {
      return digits.slice(-10);
    }
    return digits;
  };

  const rawAuthEmail = profileStatus?.email || user?.email || '';
  const isEmailDummy = isDummyEmail(rawAuthEmail);
  const realAuthEmail = isEmailDummy ? '' : rawAuthEmail.trim();

  // If email is dummy (e.g. +917018235911@phone.user), the phone number is embedded before the '@'
  const phoneFromEmail = isEmailDummy && rawAuthEmail.includes('@') ? rawAuthEmail.split('@')[0] : '';
  const rawAuthPhone =
    profileStatus?.phoneNumber ||
    profileStatus?.phone ||
    user?.phoneNumber ||
    user?.phone ||
    phoneFromEmail ||
    (user?.username && /^\+?[0-9]{10,15}$/.test(user.username) ? user.username : '');

  const cleanAuthPhone = formatPhoneDigits(rawAuthPhone);

  // If signed up with phone:
  // - Email was dummy (@phone.user) or absent, and cleanAuthPhone exists
  const isSignedUpWithPhone = isEmailDummy || (!realAuthEmail && !!cleanAuthPhone);

  // When signed up with phone: phone is locked from account, email is editable
  // When signed up with email: email is locked from account, phone is editable
  const isPhoneLocked = isSignedUpWithPhone && !!cleanAuthPhone;
  const isEmailLocked = !isSignedUpWithPhone && !!realAuthEmail;

  // Sync auth credentials to state if locked
  useEffect(() => {
    if (isPhoneLocked && cleanAuthPhone && phone !== cleanAuthPhone) {
      setPhone(cleanAuthPhone);
    }
    if (isEmailLocked && realAuthEmail && email !== realAuthEmail) {
      setEmail(realAuthEmail);
    }
  }, [cleanAuthPhone, realAuthEmail, isPhoneLocked, isEmailLocked]);

  // 1. Initialize logic
  useEffect(() => {
    const initData = async () => {
      let savedLocal: any = null;
      try {
        const savedStr = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedStr) savedLocal = JSON.parse(savedStr);
      } catch (e) {}

      const sourceData = initialData || profileStatus || {};

      const resolvedClubName = sourceData.clubName || savedLocal?.clubName || '';
      const resolvedOwnerName = sourceData.ownerName || savedLocal?.ownerName || '';

      // Phone resolution: if phone is locked from account, use cleanAuthPhone; otherwise take source/draft
      const rawCandidatePhone = sourceData.phoneNumber || sourceData.phone || savedLocal?.phone || '';
      const sourcePhone = formatPhoneDigits(rawCandidatePhone);
      const resolvedPhone = isPhoneLocked ? cleanAuthPhone : (sourcePhone || cleanAuthPhone || '');

      // Email resolution: NEVER load dummy emails into user editable email field
      const rawLocalEmail = savedLocal?.email;
      const validLocalEmail = isDummyEmail(rawLocalEmail) ? '' : (rawLocalEmail || '');
      const validSourceEmail = isDummyEmail(sourceData.email) ? '' : (sourceData.email || '');

      const resolvedEmail = isEmailLocked
        ? realAuthEmail
        : (validLocalEmail || validSourceEmail || '');

      if (resolvedClubName) setClubName(resolvedClubName);
      if (resolvedOwnerName) setOwnerName(resolvedOwnerName);
      if (resolvedPhone) setPhone(resolvedPhone);
      if (resolvedEmail) setEmail(resolvedEmail);

      // Verify states initialization
      if (isPhoneLocked) {
        setIsPhoneVerified(true);
      } else if (savedLocal?.isPhoneVerified && savedLocal?.phone === resolvedPhone && resolvedPhone.length >= 10) {
        setIsPhoneVerified(true);
      }

      if (isEmailLocked) {
        setIsEmailVerified(true);
      } else if (savedLocal?.isEmailVerified && savedLocal?.email === resolvedEmail && resolvedEmail.length > 0) {
        setIsEmailVerified(true);
      }

      // Resolve Logo: Prioritize local file URI if set, then remote API URI, then saved local
      const localFileUri = savedLocal?.image;
      const localLogoObj = savedLocal?.logoId || savedLocal?.logo;

      const rawLogo =
        sourceData.logoId ||
        sourceData.logo ||
        sourceData.logoUrl ||
        sourceData.image ||
        null;

      const remoteUri = getImageUriString(rawLogo);

      const finalImageUri =
        localFileUri && (localFileUri.startsWith('file://') || localFileUri.startsWith('content://'))
          ? localFileUri
          : remoteUri || localFileUri || null;

      if (finalImageUri) {
        setImage(finalImageUri);
      }

      if (localLogoObj && typeof localLogoObj === 'object') {
        setLogoId(localLogoObj);
      } else if (rawLogo && typeof rawLogo === 'object') {
        setLogoId(rawLogo);
      } else if (finalImageUri) {
        setLogoId(finalImageUri);
      }

      setIsInitialized(true);
    };

    initData();
  }, [userId, profileStatus, STORAGE_KEY]);

  // 2. Continuous draft backup
  useEffect(() => {
    if (isInitialized) {
      const saveData = async () => {
        const dataToSave = {
          clubName,
          ownerName,
          phone,
          email,
          image,
          logoId: LogoId,
          isPhoneVerified,
          isEmailVerified,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      };
      saveData();
    }
  }, [
    clubName,
    ownerName,
    phone,
    email,
    image,
    LogoId,
    isInitialized,
    STORAGE_KEY,
    isPhoneVerified,
    isEmailVerified,
  ]);

  // 3. Validation Logic
  const isLogoValid = !!(image || LogoId) && !isImageLoading;
  const isClubNameValid = clubName.trim().length > 0;
  const isOwnerNameValid = ownerName.trim().length > 0;

  const finalEmail = isEmailLocked ? realAuthEmail : email.trim();
  const finalPhone = formatPhoneDigits(phone.trim() || cleanAuthPhone);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const digitsCount = finalPhone.replace(/[^0-9]/g, '').length;

  const hasValidPhone = digitsCount >= 10;
  const hasValidEmail = finalEmail.length > 0 && emailRegex.test(finalEmail);
  const isTargetVerified = isPhoneVerified && isEmailVerified;

  const isStep1Valid =
    isLogoValid &&
    isClubNameValid &&
    isOwnerNameValid &&
    hasValidPhone &&
    hasValidEmail &&
    isTargetVerified;

  // Trigger Send OTP for unverified email or phone
  const handleSendOtp = async (type?: 'phone' | 'email') => {
    const verifyType = type || (isSignedUpWithPhone ? 'email' : 'phone');
    const targetVal = verifyType === 'phone' ? phone.trim() : email.trim();

    if (verifyType === 'phone') {
      if (targetVal.length < 10) {
        Alert.alert('Required', 'Please enter a valid 10-digit mobile number before verifying.');
        return;
      }
    } else {
      if (!targetVal || !emailRegex.test(targetVal)) {
        Alert.alert('Required', 'Please enter a valid email address before verifying.');
        return;
      }
    }

    setTargetOtpType(verifyType);

    // If OTP was already sent for this target and modal was closed, re-open without re-sending
    if (otpSent && targetOtpType === verifyType) {
      setOtpModalVisible(true);
      return;
    }

    setIsSendingOtp(true);
    try {
      const payload: any = {
        type: verifyType,
      };
      if (verifyType === 'phone') {
        payload.phone = targetVal.trim();
        payload.phoneNumber = targetVal.trim();
        payload.identifier = targetVal.trim();
      } else {
        payload.email = targetVal.toLowerCase().trim();
        payload.identifier = targetVal.toLowerCase().trim();
      }

      console.log('📡 [POST ' + ENDPOINTS.PENDING_RESEND_OTP + '] Sending OTP');
      const res = await api.post(ENDPOINTS.PENDING_RESEND_OTP, {});
      console.log('✅ resendPendingOtp success:', res);
      setOtpSent(true);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: `Verification code sent to ${verifyType === 'phone' ? `+91 ${targetVal}` : targetVal}`,
        position: 'top',
      });
      // Automatically open the bottom sheet modal
      setOtpModalVisible(true);
    } catch (error: any) {
      console.error('Send OTP error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Failed to send OTP. Please check the details and try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  useEffect(() => {
    if (onValidationChange) {
      onValidationChange(isStep1Valid);
    }
  }, [isStep1Valid, onValidationChange]);

  const pickImage = async () => {
    if (isSubmitting) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    setIsImageLoading(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        setIsImageLoading(false);
        return;
      }

      const asset = result.assets[0];

      const fileToUpload = {
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      };

      setImage(asset.uri);
      setLogoId(fileToUpload);
      if (!fileToUpload.uri) {
        setIsImageLoading(false);
        return Alert.alert('Error', 'Unable to process the selected image. Please try again.');
      }
    } catch (error) {
      console.error('Upload Error:', error);
      Alert.alert('Upload Failed', 'Unable to upload image. Please try again.');
    } finally {
      setIsImageLoading(false);
    }
  };

  // --- VALIDATION & API SUBMIT LOGIC ---

  useImperativeHandle(ref, () => ({
    handleSave: async () => {
      const logoToUse =
        LogoId ||
        (image
          ? typeof image === 'object'
            ? image
            : typeof image === 'string' && (image.startsWith('file://') || image.startsWith('content://'))
              ? { uri: image, name: `logo_${Date.now()}.jpg`, type: 'image/jpeg' }
              : image
          : null);

      if (!image && !logoToUse) return Alert.alert('Required', 'Please upload a club logo');
      if (!clubName.trim()) return Alert.alert('Required', 'Club Name is required');
      if (!ownerName.trim()) return Alert.alert('Required', 'Owner Name is required');

      const trimmedEmail = email.trim();
      const phoneToSubmit = formatPhoneDigits(phone.trim() || cleanAuthPhone);
      const emailToSubmit = isEmailLocked ? realAuthEmail : trimmedEmail;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (phoneToSubmit.length < 10) {
        return Alert.alert('Required', 'Please enter a valid 10-digit phone number.');
      }

      if (!emailToSubmit) {
        return Alert.alert('Required', 'Email Address is required.');
      }

      if (!emailRegex.test(emailToSubmit)) {
        return Alert.alert('Invalid Email', 'Please enter a valid email address.');
      }

      if (!isPhoneVerified) {
        Alert.alert(
          'Phone Verification Required',
          'Please verify your phone number before proceeding.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => handleSendOtp('phone') },
          ]
        );
        return;
      }

      if (!isEmailVerified) {
        Alert.alert(
          'Email Verification Required',
          'Please verify your email address before proceeding.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Verify Now', onPress: () => handleSendOtp('email') },
          ]
        );
        return;
      }

      const payload = {
        clubName: clubName.trim(),
        ownerName: ownerName.trim(),
        phone: phoneToSubmit,
        email: emailToSubmit,
        logo: logoToUse,
      };

      try {
        await submitStep1.mutateAsync(payload);
        if (onNext) onNext();
      } catch (error: any) {
        console.error('Error submitting step 1:', error);
      }
    },
    getFormData: () => ({
      clubName,
      ownerName,
      phoneNumber: formatPhoneDigits(phone) || phone,
      email: isDummyEmail(email) ? '' : email,
      logo: LogoId,
    }),
    clearLocalData: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setClubName('');
      setOwnerName('');
      setPhone('');
      setEmail('');
      setImage(null);
    },
  }));

  return (
    <>
      <Text className="mb-8 font-bold text-[24px] text-[#1C1C1C]">Fill your club details</Text>

      <View className="mb-10 items-center">
        <TouchableOpacity
          onPress={pickImage}
          disabled={isSubmitting}
          activeOpacity={0.8}
          className="relative">
          <View
            style={{ borderStyle: 'dashed' }}
            className={`h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 bg-white ${isSubmitting ? 'border-slate-100' : 'border-[#CBD5E1]'}`}>
            {isImageLoading ? (
              <ActivityIndicator color="#F6163C" />
            ) : image ? (
              <Image source={{ uri: image }} className="h-full w-full" />
            ) : (
              <View className="items-center justify-center">
                <Ionicons name="images-outline" size={48} color="#FFC1C1" />
              </View>
            )}
          </View>
          {!isSubmitting && (
            <View className="absolute bottom-1 right-2 h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#F6163C]">
              <MaterialIcons name="photo-camera" size={18} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">Gym/ Club Name</Text>
          <TextInput
            autoCapitalize="words"
            value={clubName}
            onChangeText={setClubName}
            editable={!isSubmitting}
            placeholder="Enter gym name"
            placeholderTextColor="#94A3B8"
            className={`h-14 w-full rounded-xl border px-4 font-medium text-[15px] ${isSubmitting ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-900'}`}
          />
        </View>

        <Text className="mb-2 mt-4 font-bold text-[16px] text-[#1C1C1C]">Owner’s details</Text>

        <View>
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">Owner’s name</Text>
          <TextInput
            value={ownerName}
            onChangeText={setOwnerName}
            autoCapitalize="words"
            editable={!isSubmitting}
            placeholder="Enter owner name"
            placeholderTextColor="#94A3B8"
            className={`h-14 w-full rounded-xl border px-4 font-medium text-[15px] ${isSubmitting ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-900'}`}
          />
        </View>

        {/* PHONE NUMBER FIELD */}
        <View>
          <Text className="mb-2 ml-1 mt-4 font-medium text-[13px] text-slate-500">
            Phone Number{isPhoneLocked ? ' (from account)' : ''}
          </Text>
          <View
            className={`h-14 w-full flex-row items-center rounded-xl border px-3 ${
              isSubmitting || isPhoneLocked
                ? 'border-slate-200 bg-slate-100'
                : isPhoneVerified
                  ? 'border-emerald-300 bg-emerald-50/20'
                  : 'border-slate-200 bg-white'
            }`}>
            <View className="mr-3 h-6 flex-row items-center border-r border-slate-200 pr-3">
              <Image
                source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                className="mr-1.5 h-4 w-6"
                resizeMode="contain"
              />
              <Text className="mr-1 font-semibold text-[14px] text-slate-700">+91</Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </View>
            <TextInput
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
                setPhone(cleaned);
                if (!isPhoneLocked) {
                  setIsPhoneVerified(false);
                  setOtpSent(false);
                }
              }}
              editable={!isSubmitting && !isPhoneLocked}
              keyboardType="numeric"
              maxLength={10}
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              className={`flex-1 font-medium text-[15px] ${isSubmitting || isPhoneLocked ? 'text-slate-500' : 'text-slate-900'}`}
            />
            {/* RIGHT ACTION INSIDE PHONE FIELD */}
            <View className="ml-2 flex-row items-center">
              {isPhoneLocked ? (
                <MaterialIcons name="lock" size={18} color="#94A3B8" />
              ) : isPhoneVerified ? (
                <View className="flex-row items-center rounded-lg bg-emerald-50 px-2.5 py-1.5 border border-emerald-200">
                  <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-bold text-emerald-600">Verified</Text>
                </View>
              ) : phone.length === 10 ? (
                <TouchableOpacity
                  onPress={() => handleSendOtp('phone')}
                  disabled={isSendingOtp}
                  activeOpacity={0.8}
                  className="flex-row items-center rounded-lg bg-[#F6163C] px-3 py-2 shadow-sm">
                  {isSendingOtp && targetOtpType === 'phone' ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-[12px] font-bold text-white">
                      {otpSent && targetOtpType === 'phone' ? 'Enter OTP' : 'Send OTP'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>

        {/* EMAIL ADDRESS FIELD */}
        <View className="mb-6 mt-4">
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">
            Email Address{isEmailLocked ? ' (from account)' : ''}
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={email}
              selectTextOnFocus={false}
              onChangeText={(text) => {
                setEmail(text);
                if (!isEmailLocked) {
                  setIsEmailVerified(false);
                  setOtpSent(false);
                }
              }}
              editable={!isSubmitting && !isEmailLocked}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="Enter email address"
              placeholderTextColor="#94A3B8"
              className={`h-14 w-full rounded-xl border pl-4 font-medium text-[15px] ${
                isSubmitting || isEmailLocked
                  ? 'border-slate-200 bg-slate-100 text-slate-500 pr-10'
                  : isEmailVerified
                    ? 'border-emerald-300 bg-emerald-50/20 text-slate-900 pr-24'
                    : emailRegex.test(email.trim())
                      ? 'border-slate-200 bg-white text-slate-900 pr-28'
                      : 'border-slate-200 bg-white text-slate-900 pr-4'
              }`}
            />
            {/* RIGHT ACTION INSIDE EMAIL FIELD */}
            <View className="absolute right-2.5 flex-row items-center">
              {isEmailLocked ? (
                <MaterialIcons name="lock" size={18} color="#94A3B8" style={{ marginRight: 6 }} />
              ) : isEmailVerified ? (
                <View className="flex-row items-center rounded-lg bg-emerald-50 px-2.5 py-1.5 border border-emerald-200">
                  <Ionicons name="checkmark-circle" size={14} color="#059669" style={{ marginRight: 4 }} />
                  <Text className="text-[11px] font-bold text-emerald-600">Verified</Text>
                </View>
              ) : emailRegex.test(email.trim()) ? (
                <TouchableOpacity
                  onPress={() => handleSendOtp('email')}
                  disabled={isSendingOtp}
                  activeOpacity={0.8}
                  className="flex-row items-center rounded-lg bg-[#F6163C] px-3 py-2 shadow-sm">
                  {isSendingOtp && targetOtpType === 'email' ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text className="text-[12px] font-bold text-white">
                      {otpSent && targetOtpType === 'email' ? 'Enter OTP' : 'Send OTP'}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </View>
      </View>

      {/* VERIFICATION OTP BOTTOM SHEET MODAL */}
      <VerificationOtpModal
        visible={otpModalVisible}
        type={targetOtpType}
        targetValue={targetOtpType === 'phone' ? phone.trim() : email.trim()}
        onClose={() => setOtpModalVisible(false)}
        onSuccess={() => {
          if (targetOtpType === 'phone') {
            setIsPhoneVerified(true);
          } else {
            setIsEmailVerified(true);
          }
        }}
      />
    </>
  );
});

export default OnBoarding1;
