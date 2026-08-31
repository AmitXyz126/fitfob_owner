/* eslint-disable no-unused-expressions */
/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail } from '@/hooks/useUserDetail';
import { userDetailsApi } from '@/api/userdetailsApi';
import GymLoader from '@/components/GymLoader';
import Toast from 'react-native-toast-message';

const EditClubDetails = () => {
  const router = useRouter();

  const { user } = useAuthStore();
  const { profileStatus, updateClubOwner } = useUserDetail();

  // --- FORM STATES ---
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [uploadedLogoId, setUploadedLogoId] = useState<number | null>(null);
  const [clubImage, setClubImage] = useState('');
  const [clubName, setClubName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  // --- TIME & DAY STATES ---
  const [weekdayRange, setWeekdayRange] = useState('Monday to Friday');
  const [weekendRange, setWeekendRange] = useState('Saturday & Sunday');
  const [startTime, setStartTime] = useState(new Date().setHours(5, 0));
  const [endTime, setEndTime] = useState(new Date().setHours(22, 0));

  const extractUri = (val: any): string => {
    if (!val) return '';
    let str = '';
    if (typeof val === 'string') {
      str = val;
    } else if (typeof val === 'object') {
      str = val.uri || val.url || val.path || val.src || '';
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

  const parseTimeToTimestamp = (timeVal: any): number | null => {
    if (!timeVal) return null;
    if (typeof timeVal === 'number' && !isNaN(timeVal)) {
      return timeVal;
    }
    const str = String(timeVal).trim();
    if (!str) return null;

    const ampmMatch = str.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const minutes = parseInt(ampmMatch[2], 10);
      const ampm = ampmMatch[3].toUpperCase();
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      const d = new Date();
      d.setHours(hours, minutes, 0, 0);
      return d.getTime();
    }

    const parts = str.split(':');
    if (parts.length >= 2) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      if (!isNaN(hours) && !isNaN(minutes)) {
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d.getTime();
      }
    }

    return null;
  };

  useEffect(() => {
    const populateForm = async () => {
      let savedClubProfile: any = null;
      let savedStep1: any = null;
      let savedStep3: any = null;
      try {
        const json1 = await AsyncStorage.getItem('club_profile');
        if (json1) savedClubProfile = JSON.parse(json1);

        const userKey = profileStatus?.id || profileStatus?.pendingClubOwnerId || user?.id || user?.email || '';
        const keys = await AsyncStorage.getAllKeys();

        const step1Keys = keys.filter((k) => k.includes('onboarding_step1_data'));
        let step1Key = userKey ? step1Keys.find((k) => k.includes(String(userKey))) : null;
        if (step1Key) {
          const json2 = await AsyncStorage.getItem(step1Key);
          if (json2) savedStep1 = JSON.parse(json2);
        }

        const step3Keys = keys.filter((k) => k.includes('onboarding_step3_data') || k.includes('onboarding_step4'));
        let step3Key = userKey ? step3Keys.find((k) => k.includes(String(userKey))) : null;
        if (step3Key) {
          const json3 = await AsyncStorage.getItem(step3Key);
          if (json3) savedStep3 = JSON.parse(json3);
        }
      } catch (e) {
        console.log('AsyncStorage error:', e);
      }

      const pData = profileStatus?.data || profileStatus || {};

      const cName =
        pData?.clubName ||
        pData?.club_name ||
        pData?.pendingClubOwner?.clubName ||
        pData?.pendingClubOwner?.club_name ||
        profileStatus?.clubName ||
        profileStatus?.club_name ||
        savedClubProfile?.clubName ||
        savedStep1?.clubName ||
        savedStep1?.name ||
        '';

      const cleanOwnerName = (rawName: string) => {
        if (!rawName) return '';
        if (rawName.includes('@')) {
          const namePart = rawName.split('@')[0];
          return namePart
            .replace(/[0-9]/g, '')
            .replace(/[._-]/g, ' ')
            .split(' ')
            .filter(Boolean)
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
        }
        return rawName;
      };

      const rawOwnerName =
        pData?.ownerName ||
        pData?.owner_name ||
        pData?.pendingClubOwner?.ownerName ||
        pData?.pendingClubOwner?.owner_name ||
        profileStatus?.ownerName ||
        profileStatus?.owner_name ||
        savedClubProfile?.ownerName ||
        savedStep1?.ownerName ||
        '';

      const oName = cleanOwnerName(rawOwnerName) || (user?.username ? cleanOwnerName(user.username) : '');

      const pPhone =
        pData?.phoneNumber ||
        pData?.phone_number ||
        pData?.phone ||
        savedClubProfile?.phoneNumber ||
        savedClubProfile?.phone ||
        savedStep1?.phoneNumber ||
        savedStep1?.phone ||
        user?.phoneNumber ||
        user?.phone ||
        '';

      const pEmail =
        pData?.email ||
        savedClubProfile?.email ||
        savedStep1?.email ||
        user?.email ||
        '';

      const rawLogo =
        pData?.logoUrl ||
        pData?.logo ||
        pData?.logo_url ||
        pData?.pendingClubOwner?.logoUrl ||
        pData?.pendingClubOwner?.logo ||
        profileStatus?.logoUrl ||
        profileStatus?.logo ||
        profileStatus?.logo_url ||
        savedClubProfile?.image ||
        savedClubProfile?.logo ||
        savedStep1?.image ||
        savedStep1?.logo ||
        '';

      const logo = extractUri(rawLogo);

      const wDay =
        pData?.weekday || savedClubProfile?.weekday || savedStep3?.weekdayRange || savedStep3?.weekday || 'Monday to Friday';
      const wEnd =
        pData?.weekend || savedClubProfile?.weekend || savedStep3?.weekendRange || savedStep3?.weekend || 'Saturday & Sunday';

      if (cName) setClubName(cName);
      if (oName) setOwnerName(oName);
      if (pPhone) setPhone(String(pPhone));
      if (pEmail) setEmail(pEmail);
      if (logo) setClubImage(logo);
      if (wDay) setWeekdayRange(wDay);
      if (wEnd) setWeekendRange(wEnd);

      const openT =
        pData?.openingTime || pData?.opening_time || savedClubProfile?.openingTime || savedStep3?.openingTime || savedStep3?.startTime;
      const parsedOpen = parseTimeToTimestamp(openT);
      if (parsedOpen) setStartTime(parsedOpen);

      const closeT =
        pData?.closingTime || pData?.closing_time || savedClubProfile?.closingTime || savedStep3?.closingTime || savedStep3?.endTime;
      const parsedClose = parseTimeToTimestamp(closeT);
      if (parsedClose) setEndTime(parsedClose);

      if (pData?.status === 'completed' || pData?.isApprovedOwner) {
        setIsVerified(true);
      }
    };

    populateForm();
  }, [profileStatus, user]);

  const [showPicker, setShowPicker] = useState<'start' | 'end' | null>(null);
  const [showDayModal, setShowDayModal] = useState<'weekday' | 'weekend' | null>(null);

  const weekdayOptions = ['Monday to Friday', 'Monday to Saturday', 'Monday to Sunday', 'Monday to Thursday'];
  const weekendOptions = ['Saturday & Sunday', 'Sunday Only', 'Saturday Only', 'Closed'];

  const formatTimeParts = (timeValue: any) => {
    const date = new Date(timeValue);
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const strHours = hours < 10 ? `0${hours}` : hours;
    const strMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return { time: `${strHours}:${strMinutes}`, ampm };
  };

  const formatTimeToApiStr = (timeValue: any) => {
    const date = new Date(timeValue);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}.000`;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const selectedUri = result.assets[0].uri;
      setClubImage(selectedUri);

      // 🚀 Hit /api/upload IMMEDIATELY upon selection!
      setIsUploadingLogo(true);
      try {
        console.log('Uploading logo immediately to /api/upload...');
        const uploadRes = await userDetailsApi.uploadFile({
          uri: selectedUri,
          name: `logo_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        console.log('Immediate upload result from /api/upload:', uploadRes);

        let id: number | null = null;
        if (Array.isArray(uploadRes) && uploadRes.length > 0) {
          id = uploadRes[0]?.id || uploadRes[0]?.documentId || null;
        } else if (uploadRes?.data && Array.isArray(uploadRes.data) && uploadRes.data.length > 0) {
          id = uploadRes.data[0]?.id || uploadRes.data[0]?.documentId || null;
        } else if (uploadRes && typeof uploadRes === 'object') {
          id = uploadRes?.id || uploadRes?.documentId || uploadRes?.data?.id || null;
        }

        if (id) {
          setUploadedLogoId(id);
          Toast.show({
            type: 'success',
            text1: 'Logo Uploaded! 📸',
            text2: 'Image saved to server successfully.',
          });
        }
      } catch (e: any) {
        console.error('Error uploading logo image:', e?.response?.data || e?.message);
        Toast.show({
          type: 'error',
          text1: 'Upload Failed',
          text2: 'Failed to upload logo image. Please try again.',
        });
      } finally {
        setIsUploadingLogo(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    // ⚠️ Popup if logo is currently uploading
    if (isUploadingLogo) {
      return Alert.alert(
        'Uploading Logo ⏳',
        'Your club logo is currently uploading to the server. Please wait a moment for the upload to finish before saving.'
      );
    }

    if (!clubName.trim()) return Alert.alert('Required', 'Please enter Club Name');
    if (!ownerName.trim()) return Alert.alert('Required', 'Please enter Owner Name');

    setIsSaving(true);
    const pData = profileStatus?.data || profileStatus || {};

    const existingLogoId =
      typeof pData?.logo === 'number'
        ? pData.logo
        : pData?.logo?.id || pData?.logo_id || null;

    const payloadData: any = {
      ownerName: ownerName.trim(),
      phoneNumber: phone.trim(),
      email: email.trim(),
      clubName: clubName.trim(),
      openingTime: formatTimeToApiStr(startTime),
      closingTime: formatTimeToApiStr(endTime),
      weekday: weekdayRange,
      weekend: weekendRange,
      facilities: pData?.facilities || ['Parking', 'WiFi', 'Locker Room'],
      services: pData?.services || ['Gym', 'Personal Training'],
      latitude: pData?.latitude ? String(pData.latitude) : '29.3909',
      longitude: pData?.longitude ? String(pData.longitude) : '76.9635',
      clubAddress: pData?.clubAddress || 'Model Town',
      pincode: pData?.pincode ? String(pData.pincode) : '132103',
      city: pData?.city || 'Panipat',
      state: pData?.state || 'Haryana',
      clubCategory: pData?.clubCategory || 'Premium',
    };

    const finalLogoId = uploadedLogoId || existingLogoId;
    if (finalLogoId) {
      payloadData.logo = finalLogoId;
    }

    console.log('Sending update payload with logo ID:', payloadData);

    updateClubOwner.mutate(payloadData, {
      onSuccess: async (resData: any) => {
        setIsSaving(false);
        try {
          const newLogoUri =
            (Array.isArray(resData?.data?.logo)
              ? resData?.data?.logo[0]?.url
              : resData?.data?.logo?.url) || clubImage;
          const existing = await AsyncStorage.getItem('club_profile');
          const parsed = existing ? JSON.parse(existing) : {};
          const updated = {
            ...parsed,
            clubName: payloadData.clubName,
            ownerName: payloadData.ownerName,
            phoneNumber: payloadData.phoneNumber,
            email: payloadData.email,
            ...(newLogoUri ? { image: newLogoUri, logo: newLogoUri } : {}),
          };
          await AsyncStorage.setItem('club_profile', JSON.stringify(updated));
        } catch (e) {
          console.log('Error updating local storage:', e);
        }
        router.back();
      },
      onError: () => {
        setIsSaving(false);
      },
    });
  };

  return (
    <Container>
      <GymLoader visible={isSaving || updateClubOwner.isPending} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>

        {/* HEADER */}
        <View className="flex-row items-center py-3">
          <TouchableOpacity onPress={() => router.back()} className="p-1">
            <Ionicons name="chevron-back" size={24} color="black" />
          </TouchableOpacity>
          <Text className="mr-6 flex-1 text-center font-semibold text-base text-slate-600">
            Edit Club Details
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} className="flex-1" contentContainerStyle={{ paddingBottom: 40 }}>
          {/* PROFILE IMAGE */}
          <View className="my-6 items-center">
            <TouchableOpacity onPress={pickImage} disabled={isUploadingLogo} className="relative">
              <View className="h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-slate-50 bg-[#F1F5F9]">
                <Image
                  source={
                    clubImage
                      ? { uri: clubImage }
                      : require('../assets/images/fitfob_profile.png')
                  }
                  className="h-full w-full"
                  resizeMode={clubImage ? 'cover' : 'contain'}
                />
                {isUploadingLogo && (
                  <View className="absolute inset-0 items-center justify-center bg-black/40">
                    <ActivityIndicator size="large" color="#F6163C" />
                    <Text className="mt-1 font-bold text-[10px] text-white">Uploading...</Text>
                  </View>
                )}
              </View>
              <View className="absolute bottom-1 right-1 rounded-full border-2 border-white bg-[#F6163C] p-2">
                <Ionicons name="camera" size={16} color="white" />
              </View>
            </TouchableOpacity>
          </View>

          {/* FORM FIELDS - ALL SET TO h-14 */}
          <View className="px-1">
            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Gym/ Club Name</Text>
            <TextInput
              value={clubName}
              onChangeText={setClubName}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 "
            />

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Owner's Name</Text>
            <TextInput
              value={ownerName}
              onChangeText={setOwnerName}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800 "
            />

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Phone Number</Text>
            <View className="mb-5 h-14 flex-row items-center rounded-xl border border-slate-200 bg-white px-3 ">
              <Image source={{ uri: 'https://flagcdn.com/w40/in.png' }} className="mr-2 h-4 w-6 rounded-sm" />
              <Ionicons name="chevron-down" size={14} color="#64748B" />
              <View style={{ width: 1, height: '40%', backgroundColor: '#E2E8F0', marginHorizontal: 12 }} />
              <TextInput
                value={phone}
                keyboardType="numeric"
                onChangeText={setPhone}
                placeholder="Enter phone number"
                placeholderTextColor="#94A3B8"
                className="flex-1 text-base text-slate-800"
              />
            </View>

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Email Address</Text>
            <TextInput
              value={email}
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Enter email address"
              placeholderTextColor="#94A3B8"
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800"
            />

            {/* <View className="mb-8 flex-row items-center justify-between rounded-xl border border-slate-100 bg-white p-4 ">
              <Text className="font-medium text-sm text-slate-500">Verification Status</Text>
              <Switch
                value={isVerified}
                onValueChange={setIsVerified}
                trackColor={{ false: '#E2E8F0', true: '#4ADE80' }}
                thumbColor={'white'}
              />
            </View> */}

            {/* TIMINGS SECTION */}
            <Text className="mb-4 ml-1 font-bold text-xs uppercase  text-[]">Working Hours</Text>
            <View className="mb-6 flex-row items-center justify-between gap-3">
              <TouchableOpacity
                onPress={() => setShowPicker(showPicker === 'start' ? null : 'start')}
                className={`h-14 flex-1 flex-row items-center justify-between rounded-xl px-4 border ${showPicker === 'start' ? 'border-[#F6163C] bg-red-50' : 'border-slate-200 bg-white'} `}>
                <Text className="font-bold text-base text-slate-900">{formatTimeParts(startTime).time}</Text>
                <Text className="font-bold text-[10px] uppercase text-slate-400">{formatTimeParts(startTime).ampm}</Text>
              </TouchableOpacity>

              <Text className="font-bold text-xs italic text-slate-300">To</Text>

              <TouchableOpacity
                onPress={() => setShowPicker(showPicker === 'end' ? null : 'end')}
                className={`h-14 flex-1 flex-row items-center justify-between rounded-xl px-4 border ${showPicker === 'end' ? 'border-[#F6163C] bg-red-50' : 'border-slate-200 bg-white'} `}>
                <Text className="font-bold text-base text-slate-900">{formatTimeParts(endTime).time}</Text>
                <Text className="font-bold text-[10px] uppercase text-slate-400">{formatTimeParts(endTime).ampm}</Text>
              </TouchableOpacity>
            </View>

            {showPicker && (
              <View className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-2 ">
                <View className="flex-row items-center justify-between px-4 py-2">
                  <Text className="font-bold text-[10px] uppercase text-slate-400">Set {showPicker} Time</Text>
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity onPress={() => setShowPicker(null)}>
                      <Text className="font-bold text-[#F6163C]">Done</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <DateTimePicker
                  value={new Date(showPicker === 'start' ? startTime : endTime)}
                  mode="time"
                  is24Hour={false}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(e, date) => {
                    const currentPicker = showPicker;
                    if (Platform.OS === 'android') setShowPicker(null);
                    if (date && currentPicker) {
                      currentPicker === 'start' ? setStartTime(date.getTime()) : setEndTime(date.getTime());
                    }
                  }}
                  style={{ height: 120 }}
                  textColor="#F6163C"
                />
              </View>
            )}

            {/* DAY SELECTORS - Also h-14 */}
            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Weekdays Schedule</Text>
            <TouchableOpacity
              onPress={() => setShowDayModal('weekday')}
              className="mb-5 h-14 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 ">
              <Text className="text-base text-slate-800">{weekdayRange}</Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Weekends Schedule</Text>
            <TouchableOpacity
              onPress={() => setShowDayModal('weekend')}
              className="mb-10 h-14 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-4 ">
              <Text className="text-base text-slate-800">{weekendRange}</Text>
              <Ionicons name="chevron-down" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* BOTTOM BUTTONS */}
        <View className="flex-row gap-3   bg-white px-6 py-4">
          <View className="flex-1">
            <Button
              title={isSaving || updateClubOwner.isPending ? 'Saving...' : 'Save Changes'}
              onPress={handleSaveChanges}
              disabled={isSaving || updateClubOwner.isPending}
              loading={isSaving || updateClubOwner.isPending}
            />
          </View>
          <View className="flex-1">
            <Button
              variant="secondary"
              title={'Cancel'}
              onPress={() => router.back()}
              disabled={isSaving || updateClubOwner.isPending}
            />
          </View>
        </View>

      </KeyboardAvoidingView>

      {/* --- DAY MODAL --- */}
      <Modal visible={!!showDayModal} transparent animationType="slide">
        <TouchableOpacity className="flex-1 justify-end bg-black/40" activeOpacity={1} onPress={() => setShowDayModal(null)}>
          <View className="rounded-t-[32px] bg-white p-6 pb-12 shadow-2xl">
            <View className="mb-6 h-1.5 w-12 self-center rounded-full bg-slate-200" />
            <Text className="mb-6 text-center font-bold text-lg text-slate-800">Select Range</Text>
            {(showDayModal === 'weekday' ? weekdayOptions : weekendOptions).map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => {
                  showDayModal === 'weekday' ? setWeekdayRange(option) : setWeekendRange(option);
                  setShowDayModal(null);
                }}
                className="flex-row items-center justify-between border-b border-slate-50 py-4">
                <Text className={`text-base ${(showDayModal === 'weekday' ? weekdayRange : weekendRange) === option ? 'font-bold text-[#F6163C]' : 'text-slate-700'}`}>
                  {option}
                </Text>
                {(showDayModal === 'weekday' ? weekdayRange : weekendRange) === option && <Ionicons name="checkmark-circle" size={24} color="#F6163C" />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </Container>
  );
};

export default EditClubDetails;