import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
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

const STORAGE_KEY_STEP1 = '@onboarding_step1_data';

const OnBoarding1 = forwardRef(({ initialData }: any, ref) => {
  const { submitStep1 } = useUserDetail();
  const isSubmitting = submitStep1.isPending;

  const [clubName, setClubName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [isImageLoading, setIsImageLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setClubName(initialData.clubName || '');
      setOwnerName(initialData.ownerName || '');
      setPhone(initialData.phoneNumber || '');
      setEmail(initialData.email || '');
      setImage(initialData.logoUrl || null);
    }
  }, [initialData]);

  useEffect(() => {
    const loadDraft = async () => {
      if (!initialData?.clubName) {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY_STEP1);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setClubName(parsed.clubName || '');
          setOwnerName(parsed.ownerName || '');
          setPhone(parsed.phone || '');
          setEmail(parsed.email || '');
          setImage(parsed.image || null);
        }
      }
    };
    loadDraft();
  }, [initialData?.clubName]);

  useEffect(() => {
    const saveData = async () => {
      const dataToSave = { clubName, ownerName, phone, email, image };
      await AsyncStorage.setItem(STORAGE_KEY_STEP1, JSON.stringify(dataToSave));
    };
    saveData();
  }, [clubName, ownerName, phone, email, image]);

  // --- VALIDATION & API SUBMIT LOGIC ---
  useImperativeHandle(ref, () => ({
    handleSave: () => {
      // 1. Required Validations
      if (!image) return Alert.alert('Required', 'Please upload a club logo');
      if (!clubName.trim()) return Alert.alert('Required', 'Club Name is required');
      if (!ownerName.trim()) return Alert.alert('Required', 'Owner Name is required');
      if (!phone.trim() || phone.length < 10)
        return Alert.alert('Required', 'Enter a valid 10-digit phone number');

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim() || !emailRegex.test(email))
        return Alert.alert('Required', 'Enter a valid email address');

       
      const payload = {
        clubName: clubName.trim(),
        ownerName: ownerName.trim(),
        phoneNumber: phone.trim(),
        email: email.trim(),
        logoUrl: image,
      };

      // 3. API Call with Loading handled by isSubmitting
      submitStep1.mutate(payload);
    },
    getFormData: () => ({ clubName, ownerName, phone, email, image }),
    clearLocalData: async () => {
      await AsyncStorage.removeItem(STORAGE_KEY_STEP1);
      setClubName('');
      setOwnerName('');
      setPhone('');
      setEmail('');
      setImage(null);
    },
  }));

  const pickImage = async () => {
    if (isSubmitting) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    setIsImageLoading(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) setImage(result.assets[0].uri);
    setIsImageLoading(false);
  };

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
            editable={!isSubmitting}
            placeholder="Enter owner name"
            placeholderTextColor="#94A3B8"
            className={`h-14 w-full rounded-xl border px-4 font-medium text-[15px] ${isSubmitting ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-900'}`}
          />
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-4 font-medium text-[13px] text-slate-500">
            Phone Number
          </Text>
          <View
            className={`h-14 w-full flex-row items-center rounded-xl border px-3 ${isSubmitting ? 'border-slate-100 bg-slate-50' : 'border-slate-200 bg-white'}`}>
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
              editable={!isSubmitting}
              keyboardType="numeric"
              maxLength={10}
              placeholder="Enter mobile number"
              placeholderTextColor="#94A3B8"
              className={`flex-1 font-medium text-[15px] ${isSubmitting ? 'text-slate-400' : 'text-slate-900'}`}
            />
          </View>
        </View>

        <View className="mb-6 mt-4">
          <Text className="mb-2 ml-1 font-medium text-[13px] text-slate-500">Email Address</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            editable={!isSubmitting}
            keyboardType="email-address"
            placeholder="Enter email address"
            placeholderTextColor="#94A3B8"
            className={`h-14 w-full rounded-xl border px-4 font-medium text-[15px] ${isSubmitting ? 'border-slate-100 bg-slate-50 text-slate-400' : 'border-slate-200 bg-white text-slate-900'}`}
          />
        </View>
      </View>
    </>
  );
});

export default OnBoarding1;
