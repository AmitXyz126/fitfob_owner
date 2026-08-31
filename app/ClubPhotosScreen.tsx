import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { ChevronLeft, Image as ImageIcon, Plus, X } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Container } from '@/components/Container';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { userDetailsApi } from '@/api/userdetailsApi';
import { useUserDetail } from '@/hooks/useUserDetail';

const ClubPhotosScreen = () => {
  const router = useRouter();
  const { profileStatus } = useUserDetail();

  const [photos, setPhotos] = useState<{ id: string; uri: string; rawId?: number | null; isUploading?: boolean }[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const getImageUriString = (val: any): string => {
    if (!val) return '';
    let str = '';
    if (typeof val === 'string') {
      str = val;
    } else if (typeof val === 'object') {
      str = val.uri || val.url || val.path || val.src || val?.data?.attributes?.url || val?.data?.url || '';
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

  useFocusEffect(
    useCallback(() => {
      const loadPhotos = async () => {
        try {
          const savedData = await AsyncStorage.getItem('club_photos');
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setPhotos(parsed);
              return;
            }
          }

          const pData = profileStatus?.data || profileStatus || {};
          const remotePhotos =
            pData?.clubPhotos ||
            pData?.pendingClubOwner?.clubPhotos ||
            pData?.photos ||
            [];

          if (Array.isArray(remotePhotos) && remotePhotos.length > 0) {
            const mapped = remotePhotos
              .map((item: any, idx: number) => ({
                id: String(item?.id || idx),
                uri: getImageUriString(item),
                rawId: item?.id || null,
                isUploading: false,
              }))
              .filter((item: any) => Boolean(item.uri));

            if (mapped.length > 0) {
              setPhotos(mapped);
              await AsyncStorage.setItem('club_photos', JSON.stringify(mapped));
            }
          }
        } catch (e) {
          console.log('Error loading club photos:', e);
        }
      };
      loadPhotos();
    }, [profileStatus])
  );

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert('Limit Reached', 'Only 6 photos can be uploaded.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const selectedUri = result.assets[0].uri;
    const tempId = Date.now().toString();

    // 1. Render selected photo immediately with per-card uploading overlay
    setPhotos((prev) => [...prev, { id: tempId, uri: selectedUri, isUploading: true }]);

    try {
      console.log('🚀 Uploading photo to /api/upload...');
      const uploadRes = await userDetailsApi.uploadFile({
        uri: selectedUri,
        name: `club_photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      console.log('📸 Upload res from /api/upload:', uploadRes);

      let logoId: number | null = null;
      let uploadedUrl: string | null = null;

      if (Array.isArray(uploadRes) && uploadRes.length > 0) {
        logoId = uploadRes[0]?.id || uploadRes[0]?.documentId || null;
        uploadedUrl = uploadRes[0]?.url || null;
      } else if (uploadRes?.data && Array.isArray(uploadRes.data) && uploadRes.data.length > 0) {
        logoId = uploadRes.data[0]?.id || uploadRes.data[0]?.documentId || null;
        uploadedUrl = uploadRes.data[0]?.url || null;
      } else if (uploadRes && typeof uploadRes === 'object') {
        logoId = uploadRes?.id || uploadRes?.documentId || uploadRes?.data?.id || null;
        uploadedUrl = uploadRes?.url || uploadRes?.data?.url || null;
      }

      const finalUri = getImageUriString(uploadedUrl || selectedUri);

      // 2. Mark upload complete on this specific card & update uri/rawId
      setPhotos((prev) => {
        const updated = prev.map((p) =>
          p.id === tempId ? { ...p, uri: finalUri, rawId: logoId, isUploading: false } : p
        );
        const cleanToStore = updated.map(({ isUploading, ...rest }) => rest);
        AsyncStorage.setItem('club_photos', JSON.stringify(cleanToStore));
        return updated;
      });

      Toast.show({
        type: 'success',
        text1: 'Photo Uploaded! 📸',
        text2: 'Photo uploaded to server successfully.',
      });
    } catch (error: any) {
      console.error('Error uploading club photo:', error?.message || error);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error?.message || 'Failed to upload photo to server.',
      });
      setPhotos((prev) =>
        prev.map((p) => (p.id === tempId ? { ...p, isUploading: false } : p))
      );
    }
  };

  const removePhoto = async (id: string) => {
    const updated = photos.filter((p) => p.id !== id);
    setPhotos(updated);
    try {
      const cleanToStore = updated.map(({ isUploading, ...rest }) => rest);
      await AsyncStorage.setItem('club_photos', JSON.stringify(cleanToStore));
    } catch (e) {
      console.log('Error updating AsyncStorage:', e);
    }
  };

  const handleSaveAll = async () => {
    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo.');
      return;
    }

    setIsSaving(true);
    try {
      const cleanToStore = photos.map(({ isUploading, ...rest }) => rest);
      await AsyncStorage.setItem('club_photos', JSON.stringify(cleanToStore));

      try {
        await userDetailsApi.uploadClubPhotos(cleanToStore);
      } catch (e) {
        console.log('uploadClubPhotos API notice:', e);
      }

      Toast.show({
        type: 'success',
        text1: 'Photos Saved! 📸',
        text2: 'Club photos saved successfully.',
      });
      router.back();
    } catch (error: any) {
      console.error('Save error:', error?.message || error);
      Toast.show({
        type: 'error',
        text1: 'Save Error',
        text2: error?.message || 'Failed to save photos.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isAnyUploading = photos.some((p) => p.isUploading);

  return (
    <Container>
      <View className="flex-row items-center py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-800 mr-8">
          Club Photos
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View className="mt-4">
          <Text className="text-2xl font-bold text-[#1C1C1C]">Upload Club Photos</Text>
          <Text className="mt-1 text-sm text-gray-400 leading-5">
            Upload 1 to 6 photos of your gym so members know what to expect
          </Text>
        </View>

        <View className="mt-8 flex-row flex-wrap justify-between">
          {/* Selected Photos Grid */}
          {photos.map((item) => (
            <View key={item.id} className="relative mb-4 w-[48%] h-32 overflow-hidden rounded-2xl bg-gray-100">
              <Image source={{ uri: item.uri }} className="h-full w-full" resizeMode="cover" />

              {/* Individual Spinner Loading Overlay for uploading photo */}
              {item.isUploading && (
                <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-2xl">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="mt-1.5 text-[11px] font-bold text-white">Uploading...</Text>
                </View>
              )}

              {/* Delete Button (only if not uploading) */}
              {!item.isUploading && (
                <TouchableOpacity 
                  onPress={() => removePhoto(item.id)}
                  activeOpacity={0.8}
                  className="absolute top-2 right-2 h-7 w-7 items-center justify-center rounded-full bg-[#F6163C] border border-white/40 shadow-md z-10"
                >
                  <Ionicons name="trash-outline" size={14} color="#FFFFFF" />
                </TouchableOpacity>
              )}
            </View>
          ))}

          {/* Remaining Empty Slots */}
          {Array.from({ length: Math.max(0, 6 - photos.length) }).map((_, index) => (
            <TouchableOpacity 
              key={`empty-${index}`}
              onPress={pickImage}
              disabled={isAnyUploading}
              className="mb-4 h-32 w-[48%] items-center justify-center rounded-2xl bg-gray-50 border border-dashed border-gray-200"
            >
              <ImageIcon size={32} color="#D1D5DB" />
              <View className="absolute bottom-2 right-2 rounded-full bg-white p-0.5 shadow-sm">
                <Plus size={12} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View className="mt-6">
          <Text className="font-bold text-gray-800">Tips for high quality photos</Text>
          <View className="mt-3">
            <Text className="text-xs text-[#697281] font-sans font-normal leading-4 mb-1">• Upload 1 to 6 photos to showcase your gym facilities.</Text>
            <Text className="text-xs text-[#697281] font-sans font-normal leading-4 mb-1">• High-quality images attract more members.</Text>
            <Text className="text-xs text-[#697281] font-sans font-normal leading-4 mb-1">• Cover gym area, reception, and changing rooms.</Text>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="py-4">
        <TouchableOpacity 
          onPress={handleSaveAll}
          disabled={photos.length === 0 || isAnyUploading || isSaving}
          className={`w-full items-center justify-center rounded-2xl py-4 shadow-lg ${
            photos.length === 0 || isAnyUploading || isSaving
              ? 'bg-gray-300'
              : 'bg-[#F6163C] shadow-red-200'
          }`}
        >
          {isSaving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="font-bold text-white">
              {photos.length === 0 ? 'Add Photos' : `Save Photos (${photos.length}/6)`}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </Container>
  );
};

export default ClubPhotosScreen;