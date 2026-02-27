import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserDetail } from '@/hooks/useUserDetail';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnBoarding2DetailsProps {
  onBack: () => void;
  onNext?: () => void;
}

const STORAGE_KEY = '@onboarding_step2_details';

const OnBoarding2_Details = forwardRef((props: OnBoarding2DetailsProps, ref) => {
  const { onBack, onNext } = props;
  const { submitStep3, userData } = useUserDetail();

  const [formData, setFormData] = useState({
    clubAddress: '',
    city: 'Mohali',
    state: 'Punjab',
    pincode: '',
  });

  const [isLocalLoaded, setIsLocalLoaded] = useState(false);

  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          setFormData(JSON.parse(savedData));
        }
      } catch (error) {
        console.error('Error loading local data:', error);
      } finally {
        setIsLocalLoaded(true);
      }
    };
    loadSavedData();
  }, []);

  

  useEffect(() => {
    if (isLocalLoaded && userData) {
      setFormData((prev) => ({
        ...prev,
        clubAddress: userData.clubAddress || prev.clubAddress,
        city: userData.city || prev.city,
        state: userData.state || prev.state,
        pincode: userData.pincode || prev.pincode,
      }));
    }
    
  }, [userData, isLocalLoaded]);

  useEffect(() => {
    const saveData = async () => {
      try {
        if (isLocalLoaded) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
      } catch (error) {
        console.error('Error saving local data:', error);
      }
    };
    saveData();
  }, [formData, isLocalLoaded]);

  useImperativeHandle(ref, () => ({
    handleSave: () => {
      // Validation
      if (!formData.clubAddress.trim() || !formData.pincode.trim()) {
        Alert.alert('Required', 'Please fill Building Name and Pincode');
        return;
      }

      if (formData.pincode.length < 6) {
        Alert.alert('Invalid', 'Please enter a valid 6-digit Pincode');
        return;
      }

      // --- FIXED: Added pendingClubOwnerId in Payload ---
      const payload = {
        clubAddress: formData.clubAddress.trim(),
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode.trim().toString(),
      };

       console.log("Submitting Step 3 Payload:", payload);

      if (!payload) {
        Alert.alert('Error', 'Owner ID not found. Please restart the app.');
        return;
      }

      submitStep3.mutate(payload, {
        onSuccess: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          if (onNext) onNext();
        },
        onError: (error: any) => {
          // Error handling
          Alert.alert('API Failed', error?.response?.data?.message || 'Something went wrong');
        }
      });
    },
  }));

  return (
    <View className="flex-1 bg-white">
      <Text className="mb-6 font-bold text-[24px] text-[#1C1C1C]">Add your location details</Text>

      <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <View className="flex-1 pr-4">
          <Text className="font-bold text-slate-900" numberOfLines={1}>
            {userData?.address || 'Selected Location'}
          </Text>
          <Text className="mt-1 text-xs text-slate-500" numberOfLines={1}>
            {userData?.locationName || 'International Airport Road, Mohali...'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.7}
          className="rounded-full border border-slate-200 bg-white px-3 py-1">
          <Text className="font-bold text-xs text-slate-500">Change</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-5">
        <View>
          <Text className="mb-2 ml-1 text-sm font-normal text-[#697281]">Address details*</Text>
          <TextInput
            placeholder="Building Name"
            placeholderTextColor="#94A3B8"
            value={formData.clubAddress}
            onChangeText={(text) => setFormData({ ...formData, clubAddress: text })}
            className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900"
          />
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-3 text-sm font-normal text-[#697281]">City</Text>
          <View className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4">
            <Text className="text-slate-900">{formData.city}</Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </View>
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-3 text-sm font-normal text-[#697281]">State</Text>
          <View className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4">
            <Text className="text-slate-900">{formData.state}</Text>
            <Ionicons name="chevron-down" size={18} color="#64748B" />
          </View>
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-3 text-sm font-normal text-[#697281]">Pincode</Text>
          <TextInput
            placeholder="160067"
            placeholderTextColor="#94A3B8"
            keyboardType="numeric"
            maxLength={6}
            value={formData.pincode}
            onChangeText={(text) => {
              setFormData({ ...formData, pincode: text });
              if (text.length === 6) Keyboard.dismiss();
            }}
            className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900"
          />
        </View>
      </View>
    </View>
  );
});

export default OnBoarding2_Details;