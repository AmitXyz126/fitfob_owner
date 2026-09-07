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
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { userDetailsApi } from '@/api/userdetailsApi';
import GymLoader from '@/components/GymLoader';

const EditClubDetails = () => {
  const router = useRouter();

  const { user } = useAuthStore();
  const { profileStatus, updateClubOwner } = useUserDetail();
  const { data: myOwnerData } = useClubOwnerMe();

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

  useEffect(() => {
    const populateForm = async () => {
      let savedClubProfile: any = null;
      let savedStep1: any = null;
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
      } catch (e) {
        console.log('AsyncStorage error:', e);
      }

      const pData = profileStatus?.data || profileStatus || {};

      const cName =
        myOwnerData?.clubName ||
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
        myOwnerData?.ownerName ||
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
        myOwnerData?.phoneNumber ||
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
        myOwnerData?.email ||
        pData?.email ||
        savedClubProfile?.email ||
        savedStep1?.email ||
        user?.email ||
        '';

      const rawLogo =
        myOwnerData?.logoUrl ||
        myOwnerData?.logo ||
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

      if (cName) setClubName(cName);
      if (oName) setOwnerName(oName);
      if (pPhone) setPhone(String(pPhone));
      if (pEmail) setEmail(pEmail);
      if (logo) setClubImage(logo);

      if (myOwnerData?.id || pData?.status === 'completed' || pData?.isApprovedOwner) {
        setIsVerified(true);
      }
    };

    populateForm();
  }, [profileStatus, myOwnerData, user]);

  const handlePickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Denied', 'Permission to access gallery is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        const localUri = result.assets[0].uri;
        setClubImage(localUri);
        setIsUploadingLogo(true);

        try {
          const uploadRes = await userDetailsApi.uploadFile({
            uri: localUri,
            name: `club_logo_${Date.now()}.jpg`,
            type: 'image/jpeg',
          });

          const firstItem = Array.isArray(uploadRes)
            ? uploadRes[0]
            : uploadRes?.data && Array.isArray(uploadRes.data)
              ? uploadRes.data[0]
              : uploadRes;

          if (firstItem && (firstItem.id || firstItem.documentId)) {
            setUploadedLogoId(firstItem.id || firstItem.documentId);
            if (firstItem.url) {
              setClubImage(extractUri(firstItem.url));
            }
          }
        } catch (uploadError: any) {
          console.log('Error uploading logo image:', uploadError);
          Alert.alert(
            'Upload Warning',
            'Image selected locally, but server upload failed. The new logo might not save on the server.'
          );
        } finally {
          setIsUploadingLogo(false);
        }
      }
    } catch (error) {
      console.log('Image pick error:', error);
      setIsUploadingLogo(false);
    }
  };
  const pickImage = handlePickImage;

  const handleSaveChanges = async () => {
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

    let savedClubProfile: any = null;
    let savedStep3: any = null;
    let savedStep2Map: any = null;
    try {
      const json1 = await AsyncStorage.getItem('club_profile');
      if (json1) savedClubProfile = JSON.parse(json1);

      const keys = await AsyncStorage.getAllKeys();
      const mapKey = keys.find((k) => k.includes('onboarding_step2_map_data'));
      if (mapKey) {
        const mapJson = await AsyncStorage.getItem(mapKey);
        if (mapJson) savedStep2Map = JSON.parse(mapJson);
      }

      const step3Key = keys.find((k) => k.includes('onboarding_step3_data') || k.includes('onboarding_step4'));
      if (step3Key) {
        const json3 = await AsyncStorage.getItem(step3Key);
        if (json3) savedStep3 = JSON.parse(json3);
      }
    } catch (e) { }

    const existingLogoId =
      uploadedLogoId ||
      (typeof myOwnerData?.logo === 'number' ? myOwnerData.logo : myOwnerData?.logo?.id) ||
      (typeof pData?.logo === 'number' ? pData.logo : pData?.logo?.id || pData?.logo_id) ||
      null;

    const resolvedFacilities =
      myOwnerData?.facilities ||
      pData?.facilities ||
      user?.clubOwnerDetail?.facilities ||
      savedClubProfile?.facilities ||
      savedClubProfile?.amenities ||
      savedStep3?.facilities ||
      savedStep3?.amenities;

    const resolvedServices =
      myOwnerData?.services ||
      pData?.services ||
      user?.clubOwnerDetail?.services ||
      savedClubProfile?.services ||
      savedClubProfile?.fitnessTypes ||
      savedStep3?.services ||
      savedStep3?.fitnessTypes;

    const resolvedLat =
      myOwnerData?.latitude ||
      pData?.latitude ||
      pData?.pendingClubOwner?.latitude ||
      user?.clubOwnerDetail?.latitude ||
      savedClubProfile?.latitude ||
      savedStep2Map?.region?.latitude ||
      savedStep2Map?.latitude;

    const resolvedLng =
      myOwnerData?.longitude ||
      pData?.longitude ||
      pData?.pendingClubOwner?.longitude ||
      user?.clubOwnerDetail?.longitude ||
      savedClubProfile?.longitude ||
      savedStep2Map?.region?.longitude ||
      savedStep2Map?.longitude;

    const resolvedAddress =
      myOwnerData?.clubAddress ||
      myOwnerData?.address ||
      pData?.clubAddress ||
      pData?.address ||
      pData?.pendingClubOwner?.clubAddress ||
      user?.clubOwnerDetail?.clubAddress ||
      user?.clubOwnerDetail?.address ||
      savedClubProfile?.clubAddress ||
      savedClubProfile?.address ||
      savedStep3?.clubAddress ||
      savedStep3?.address;

    const resolvedCity =
      myOwnerData?.city ||
      pData?.city ||
      user?.clubOwnerDetail?.city ||
      savedClubProfile?.city ||
      savedStep3?.city;

    const resolvedState =
      myOwnerData?.state ||
      pData?.state ||
      user?.clubOwnerDetail?.state ||
      savedClubProfile?.state ||
      savedStep3?.state;

    const resolvedPincode =
      myOwnerData?.pincode ||
      pData?.pincode ||
      user?.clubOwnerDetail?.pincode ||
      savedClubProfile?.pincode ||
      savedStep3?.pincode;

    const resolvedCategory =
      myOwnerData?.clubCategory ||
      pData?.clubCategory ||
      user?.clubOwnerDetail?.clubCategory ||
      savedClubProfile?.clubCategory;

    const payloadData: any = {
      ownerName: ownerName.trim(),
      phoneNumber: phone.trim(),
      email: email.trim(),
      clubName: clubName.trim(),
    };

    // Preserve existing scheduling/timings if present
    const existingWeekdayScheduling =
      myOwnerData?.weekdayScheduling ||
      pData?.weekdayScheduling ||
      user?.clubOwnerDetail?.weekdayScheduling ||
      savedClubProfile?.weekdayScheduling ||
      savedStep3?.weekdayScheduling;
    if (existingWeekdayScheduling) payloadData.weekdayScheduling = existingWeekdayScheduling;

    const existingOpeningTime =
      myOwnerData?.openingTime ||
      pData?.openingTime ||
      user?.clubOwnerDetail?.openingTime ||
      savedClubProfile?.openingTime ||
      savedStep3?.openingTime;
    if (existingOpeningTime) payloadData.openingTime = existingOpeningTime;

    const existingClosingTime =
      myOwnerData?.closingTime ||
      pData?.closingTime ||
      user?.clubOwnerDetail?.closingTime ||
      savedClubProfile?.closingTime ||
      savedStep3?.closingTime;
    if (existingClosingTime) payloadData.closingTime = existingClosingTime;

    const existingWeekday =
      myOwnerData?.weekday ||
      pData?.weekday ||
      user?.clubOwnerDetail?.weekday ||
      savedClubProfile?.weekday ||
      savedStep3?.weekday;
    if (existingWeekday) payloadData.weekday = existingWeekday;

    const existingWeekend =
      myOwnerData?.weekend ||
      pData?.weekend ||
      user?.clubOwnerDetail?.weekend ||
      savedClubProfile?.weekend ||
      savedStep3?.weekend;
    if (existingWeekend) payloadData.weekend = existingWeekend;

    if (resolvedFacilities) payloadData.facilities = resolvedFacilities;
    if (resolvedServices) payloadData.services = resolvedServices;
    if (resolvedLat) payloadData.latitude = String(resolvedLat);
    if (resolvedLng) payloadData.longitude = String(resolvedLng);
    if (resolvedAddress) payloadData.clubAddress = resolvedAddress;
    if (resolvedCity) payloadData.city = resolvedCity;
    if (resolvedState) payloadData.state = resolvedState;
    if (resolvedPincode) payloadData.pincode = String(resolvedPincode);
    if (resolvedCategory) payloadData.clubCategory = resolvedCategory;

    if (existingLogoId) {
      payloadData.logo = existingLogoId;
    }

    console.log('Sending update payload from EditClubDetails:', payloadData);

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

          const currentUser = useAuthStore.getState().user;
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              username: payloadData.ownerName || currentUser.username,
              clubOwnerDetail: {
                ...(currentUser.clubOwnerDetail || {}),
                ownerName: payloadData.ownerName,
                clubName: payloadData.clubName,
                phoneNumber: payloadData.phoneNumber,
                email: payloadData.email,
              },
            };
            await useAuthStore.getState().setUser(updatedUser, true);
          }
        } catch (e) {
          console.log('Error updating local storage/auth store:', e);
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
            <TouchableOpacity onPress={handlePickImage} disabled={isUploadingLogo} className="relative">
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

          {/* FORM FIELDS */}
          <View className="px-1">
            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Gym/ Club Name</Text>
            <TextInput
              value={clubName}
              onChangeText={setClubName}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800"
            />

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Owner's Name</Text>
            <TextInput
              value={ownerName}
              onChangeText={setOwnerName}
              className="mb-5 h-14 rounded-xl border border-slate-200 bg-white px-4 text-base text-slate-800"
            />

            <Text className="mb-2 ml-1 text-sm text-[#697281] leading-5 font-sans">Phone Number</Text>
            <View className="mb-5 h-14 flex-row items-center rounded-xl border border-slate-200 bg-white px-3">
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

            <View className="mb-2 ml-1 flex-row items-center justify-between">
              <Text className="text-sm text-[#697281] leading-5 font-sans">Email Address</Text>
              <View className="flex-row items-center">
                <Ionicons name="lock-closed" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                <Text className="text-[11px] font-medium text-slate-400">Non-editable</Text>
              </View>
            </View>
            <View className="mb-8 h-14 flex-row items-center rounded-xl border border-slate-200 bg-slate-100 px-4">
              <TextInput
                value={email}
                editable={false}
                placeholder="Enter email address"
                placeholderTextColor="#94A3B8"
                className="flex-1 text-base text-slate-500"
              />
              <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" />
            </View>
          </View>
        </ScrollView>

        {/* BOTTOM BUTTONS */}
        <View className="flex-row gap-3 bg-white px-6 py-4">
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
    </Container>
  );
};

export default EditClubDetails;