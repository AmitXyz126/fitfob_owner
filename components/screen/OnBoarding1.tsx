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
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
 
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

  const authPhone = profileStatus?.phoneNumber || profileStatus?.phone || user?.phoneNumber || user?.phone || '';
  const authEmail = profileStatus?.email || user?.email || '';

  const isPhoneLocked = !!authPhone;
  const isEmailLocked = !!authEmail;

  // Sync auth credentials to state if locked
  useEffect(() => {
    if (isPhoneLocked && phone !== authPhone) {
      setPhone(authPhone);
    }
    if (isEmailLocked && email !== authEmail) {
      setEmail(authEmail);
    }
  }, [authPhone, authEmail, isPhoneLocked, isEmailLocked, phone, email]);

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
      const resolvedPhone = authPhone || sourceData.phoneNumber || sourceData.phone || savedLocal?.phone || '';
      const resolvedEmail = authEmail || sourceData.email || savedLocal?.email || '';

      if (resolvedClubName) setClubName(resolvedClubName);
      if (resolvedOwnerName) setOwnerName(resolvedOwnerName);
      if (resolvedPhone) setPhone(resolvedPhone);
      if (resolvedEmail) setEmail(resolvedEmail);

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
        const dataToSave = { clubName, ownerName, phone, email, image, logoId: LogoId };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      };
      saveData();
    }
  }, [clubName, ownerName, phone, email, image, LogoId, isInitialized, STORAGE_KEY]);

  // 3. Validation Logic
  const isLogoValid = !!(image || LogoId) && !isImageLoading;
  const isClubNameValid = clubName.trim().length > 0;
  const isOwnerNameValid = ownerName.trim().length > 0;

  const finalEmail = email.trim() || authEmail;
  const finalPhone = phone.trim() || authPhone;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const digitsCount = finalPhone.replace(/[^0-9]/g, '').length;

  const hasValidPhone = digitsCount >= 10;
  const hasValidEmail = finalEmail.length > 0 && emailRegex.test(finalEmail);
  const isContactValid = hasValidPhone || hasValidEmail;

  const isStep1Valid = isLogoValid && isClubNameValid && isOwnerNameValid && isContactValid;

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

      const finalEmail = email.trim() || authEmail;
      const finalPhone = phone.trim() || authPhone;

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const digitsCount = finalPhone.replace(/[^0-9]/g, '').length;

      const hasValidPhone = digitsCount >= 10;
      const hasValidEmail = finalEmail.length > 0 && emailRegex.test(finalEmail);

      if (!hasValidPhone && !hasValidEmail) {
        return Alert.alert(
          'Required',
          'Please provide either a valid 10-digit phone number or a valid email address.'
        );
      }

      const payload = {
        clubName: clubName.trim(),
        ownerName: ownerName.trim(),
        phone: finalPhone,
        email: finalEmail,
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
      phoneNumber: phone,
      email,
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

        <View>
          <Text className="mb-2 ml-1 mt-4 font-medium text-[13px] text-slate-500">
            Phone Number{isPhoneLocked ? ' (from account)' : isEmailLocked ? ' (optional)' : ''}
          </Text>
          <View
            className={`h-14 w-full flex-row items-center rounded-xl border px-3 ${isSubmitting || isPhoneLocked ? 'border-slate-200 bg-slate-100' : 'border-slate-200 bg-white'}`}>
            <View className="mr-3 h-6 flex-row items-center border-r border-slate-200 pr-3">
              <Image
                source={{ uri: 'https://flagcdn.com/w40/in.png' }}
                className="mr-1 h-4 w-6"
                resizeMode="contain"
              />
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </View>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              editable={!isSubmitting && !isPhoneLocked}
              keyboardType="numeric"
              maxLength={10}
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              className={`flex-1 font-medium text-[15px] ${isSubmitting || isPhoneLocked ? 'text-slate-500' : 'text-slate-900'}`}
            />
            {isPhoneLocked && (
              <View className="ml-2">
                <MaterialIcons name="lock" size={18} color="#94A3B8" />
              </View>
            )}
          </View>
        </View>

        <View className="mb-6 mt-4">
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">
            Email Address{isEmailLocked ? ' (from account)' : isPhoneLocked ? ' (optional)' : ''}
          </Text>
          <View className="relative justify-center">
            <TextInput
              value={email}
              selectTextOnFocus={false}
              onChangeText={setEmail}
              editable={!isSubmitting && !isEmailLocked}
              keyboardType="email-address"
              placeholder="Enter email address"
              placeholderTextColor="#94A3B8"
              className={`h-14 w-full rounded-xl border px-4 font-medium text-[15px] ${isSubmitting || isEmailLocked ? 'border-slate-200 bg-slate-100 text-slate-500 pr-10' : 'border-slate-200 bg-white text-slate-900'}`}
            />
            {isEmailLocked && (
              <View className="absolute right-3">
                <MaterialIcons name="lock" size={18} color="#94A3B8" />
              </View>
            )}
          </View>
        </View>
      </View>
    </>
  );
});

export default OnBoarding1;
