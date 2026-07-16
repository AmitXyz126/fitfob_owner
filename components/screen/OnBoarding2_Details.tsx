/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import { useUserDetail } from '@/hooks/useUserDetail';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnBoarding2DetailsProps {
  initialData?: any;
  onBack: () => void;
  onNext?: () => void;
}

const OnBoarding2_Details = forwardRef((props: OnBoarding2DetailsProps, ref) => {
  const { onBack, onNext, initialData } = props;
  const { submitStep3, profileStatus } = useUserDetail();
  const userId = profileStatus?.id || profileStatus?.pendingClubOwnerId;
  const STORAGE_KEY = `@onboarding_step2_details_${userId || 'guest'}`;

  const [formData, setFormData] = useState({
    clubAddress: '',
    city: '',
    state: '',
    pincode: '',
  });

  const [locationInfo, setLocationInfo] = useState({
    name: '',
    address: '',
  });

  const [isInitialized, setIsInitialized] = useState(false);

   useEffect(() => {
    if (profileStatus?.address) {
      const fullAddress = profileStatus.address;
      const parts = fullAddress.split(',').map((p: string) => p.trim());

      const pincodeMatch = fullAddress.match(/\b\d{6}\b/);
      const extractedPincode = pincodeMatch ? pincodeMatch[0] : '';

      const countryRemoved = parts.filter((p: string) => p.toLowerCase() !== 'india');
      const statePart = countryRemoved[countryRemoved.length - 1] || '';
      const extractedState = statePart.replace(/[0-9]/g, '').trim();
      const extractedCity = countryRemoved[countryRemoved.length - 2] || '';

      setFormData((prev) => ({
        ...prev,
        city: profileStatus.city || extractedCity || prev.city,
        state: profileStatus.state || extractedState || prev.state,
        pincode: profileStatus.pincode || extractedPincode || prev.pincode,
        clubAddress: prev.clubAddress || parts[0] || '',
      }));
    }
  }, [profileStatus?.address]);

  // --- 2. Initialize logic (Flow Unchanged) ---
  useEffect(() => {
    const initData = async () => {
      const data = initialData || profileStatus;

      //  MAP SCREEN SE SAVED LOCATION LOAD
      const savedMap = await AsyncStorage.getItem(
        `@onboarding_step2_map_data_${userId || 'guest'}`
      );

      if (savedMap) {
        const parsed = JSON.parse(savedMap);

        if (parsed?.locationInfo) {
          setFormData({
            clubAddress: parsed.locationInfo.clubAddress || '',
            city: parsed.locationInfo.city || '',
            state: parsed.locationInfo.state || '',
            pincode: parsed.locationInfo.pincode || '',
          });

          setLocationInfo({
            name: parsed.locationInfo.name || 'Selected Location',
            address: parsed.locationInfo.address || '',
          });

          setIsInitialized(true);
          return;
        }
      }

      //  existing logic
      if (data && (data.clubAddress || data.pincode)) {
        setFormData({
          clubAddress: data.clubAddress || '',
          city: data.city || '',
          state: data.state || '',
          pincode: data.pincode || '',
        });
        setIsInitialized(true);
      } else if (!isInitialized) {
        try {
          const savedData = await AsyncStorage.getItem(STORAGE_KEY);
          if (savedData) {
            setFormData(JSON.parse(savedData));
          }
        } catch (error) {
          console.error('Error loading local data:', error);
        } finally {
          setIsInitialized(true);
        }
      }
    };

    initData();
  }, [initialData, profileStatus, isInitialized, STORAGE_KEY]);

  // --- 3. Draft backup (Flow Unchanged) ---
  useEffect(() => {
    const saveData = async () => {
      try {
        if (isInitialized) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
      } catch (error) {
        console.error('Error saving local data:', error);
      }
    };
    saveData();
  }, [formData, isInitialized, STORAGE_KEY]);

  useImperativeHandle(ref, () => ({
    getFormData: () => formData,
    handleSave: () => {
      if (!formData.clubAddress.trim() || !formData.pincode.trim() || !formData.city.trim()) {
        Alert.alert('Required', 'Please fill all address details');
        return;
      }

      if (formData.pincode.length < 6) {
        Alert.alert('Invalid', 'Please enter a valid 6-digit Pincode');
        return;
      }

      const payload = {
        clubAddress: formData.clubAddress.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim().toString(),
      };

      submitStep3.mutate(payload, {
        onSuccess: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          if (onNext) onNext();
        },
        onError: (error: any) => {
          Alert.alert('API Failed', error?.response?.data?.message || 'Something went wrong');
        },
      });
    },
  }));

  return (
    <View className="flex-1 bg-white">
      <Text className="mb-6 font-bold text-[24px] text-[#1C1C1C]">Add your location details</Text>

      <View className="mb-6 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <View className="flex-1 pr-4">
          <Text className="font-bold text-slate-900" numberOfLines={1}>
            {locationInfo?.name || 'Selected Location'}
          </Text>
          <Text className="mt-1 text-xs text-slate-500" numberOfLines={1}>
            {locationInfo?.address || 'Address not selected'}
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
          <Text className="mb-2 ml-1 text-sm font-normal text-[#697281]">
            Address details (Building/Area)*
          </Text>
          <TextInput
            placeholder="Building name, Street, Landmark"
            placeholderTextColor="#94A3B8"
            value={formData.clubAddress}
            onChangeText={(text) => setFormData({ ...formData, clubAddress: text })}
            className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-slate-900"
          />
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-3 text-sm font-normal text-[#697281]">City*</Text>
          <View className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4">
            <TextInput
              placeholder="City"
              value={formData.city}
              onChangeText={(text) => setFormData({ ...formData, city: text })}
              className="flex-1 text-slate-900"
            />
          </View>
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-3 text-sm font-normal text-[#697281]">State*</Text>
          <View className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-200 bg-white px-4">
            <TextInput
              placeholder="State"
              value={formData.state}
              onChangeText={(text) => setFormData({ ...formData, state: text })}
              className="flex-1 text-slate-900"
            />
          </View>
        </View>

        <View>
          <Text className="mb-2 ml-1 mt-3 text-sm font-normal text-[#697281]">Pincode*</Text>
          <TextInput
            placeholder="160062"
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
