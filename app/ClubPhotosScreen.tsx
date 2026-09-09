import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  ChevronLeft,
  Image as ImageIconLucide,
  Plus as PlusIcon,
  X as XIcon,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { Container } from '@/components/Container';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { userDetailsApi } from '@/api/userdetailsApi';
import { useUserDetail, useClubOwnerMe } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';

const ClubPhotosScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const { profileStatus, updateClubOwner } = useUserDetail();
  const { data: myOwnerData } = useClubOwnerMe();

  const [images, setImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [descriptions, setDescriptions] = useState<string[]>(Array(6).fill(''));
  const [rawIds, setRawIds] = useState<(number | null)[]>(Array(6).fill(null));
  const [uploadingSlots, setUploadingSlots] = useState<boolean[]>(Array(6).fill(false));
  const [showMore, setShowMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  useFocusEffect(
    useCallback(() => {
      const loadPhotos = async () => {
        try {
          const pData = profileStatus?.data || profileStatus || {};
          const remotePhotos =
            myOwnerData?.clubPhotos ||
            myOwnerData?.photos ||
            myOwnerData?.attributes?.clubPhotos ||
            pData?.clubPhotos ||
            pData?.photos ||
            pData?.pendingClubOwner?.clubPhotos ||
            user?.clubOwnerDetail?.clubPhotos ||
            user?.clubOwnerDetail?.photos ||
            [];

          let parsedLocal: any[] = [];
          const savedData = await AsyncStorage.getItem('club_photos');
          if (savedData) {
            try {
              const p = JSON.parse(savedData);
              if (Array.isArray(p)) parsedLocal = p;
            } catch (e) { }
          }

          let sourcePhotos: any[] = [];
          if (Array.isArray(remotePhotos) && remotePhotos.length > 0) {
            sourcePhotos = remotePhotos;
          } else if (parsedLocal.length > 0) {
            sourcePhotos = parsedLocal;
          }

          if (sourcePhotos.length > 0) {
            const newImages = [...Array(6).fill(null)];
            const newDescriptions = [...Array(6).fill('')];
            const newRawIds = [...Array(6).fill(null)];
            let hasMoreThan4 = false;

            sourcePhotos.forEach((item: any, idx: number) => {
              if (idx < 6) {
                const uri = getImageUriString(item);
                if (uri) {
                  newImages[idx] = uri;

                  const localMatch = Array.isArray(parsedLocal)
                    ? parsedLocal.find(
                      (l: any) =>
                        l.uri === uri ||
                        (item.id && l.rawId === item.id) ||
                        l.id === String(idx)
                    )
                    : null;

                  newDescriptions[idx] =
                    item.description ||
                    item.caption ||
                    item.title ||
                    localMatch?.description ||
                    '';

                  newRawIds[idx] =
                    typeof item === 'object' && item?.id
                      ? item.id
                      : item?.rawId || localMatch?.rawId || null;

                  if (idx >= 4) {
                    hasMoreThan4 = true;
                  }
                }
              }
            });

            setImages(newImages);
            setDescriptions(newDescriptions);
            setRawIds(newRawIds);
            if (hasMoreThan4) {
              setShowMore(true);
            }
          }
        } catch (e) {
          console.log('Error loading club photos:', e);
        }
      };
      loadPhotos();
    }, [profileStatus, myOwnerData, user])
  );

  const pickImage = async (index: number) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is required.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets?.[0]?.uri) return;

    const selectedUri = result.assets[0].uri;

    // Set local image immediately & mark slot as uploading
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = selectedUri;
      return updated;
    });
    setUploadingSlots((prev) => {
      const updated = [...prev];
      updated[index] = true;
      return updated;
    });

    try {
      console.log(`Uploading photo slot #${index + 1}...`);
      const uploadRes = await userDetailsApi.uploadFile({
        uri: selectedUri,
        name: `club_photo_${index}_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

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

      setImages((prev) => {
        const updated = [...prev];
        updated[index] = finalUri;
        return updated;
      });
      setRawIds((prev) => {
        const updated = [...prev];
        updated[index] = logoId;
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
    } finally {
      setUploadingSlots((prev) => {
        const updated = [...prev];
        updated[index] = false;
        return updated;
      });
    }
  };

  const removePhoto = (index: number) => {
    setImages((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
    setDescriptions((prev) => {
      const updated = [...prev];
      updated[index] = '';
      return updated;
    });
    setRawIds((prev) => {
      const updated = [...prev];
      updated[index] = null;
      return updated;
    });
  };

  const handleDescriptionChange = (index: number, text: string) => {
    setDescriptions((prev) => {
      const updated = [...prev];
      updated[index] = text;
      return updated;
    });
  };

  const handleSaveAll = async () => {
    const hasAnyPhoto = images.some((img) => !!img);
    if (!hasAnyPhoto) {
      Alert.alert('No Photos', 'Please add at least one photo.');
      return;
    }

    setIsSaving(true);
    try {
      const validItems = images
        .map((uri, idx) => {
          if (!uri) return null;
          return {
            id: String(rawIds[idx] || idx),
            uri,
            rawId: rawIds[idx] || null,
            description: descriptions[idx]?.trim() || '',
          };
        })
        .filter(Boolean) as {
          id: string;
          uri: string;
          rawId: number | null;
          description: string;
        }[];

      await AsyncStorage.setItem('club_photos', JSON.stringify(validItems));

      try {
        const ownerId =
          myOwnerData?.id ||
          myOwnerData?.clubOwnerId ||
          profileStatus?.id ||
          profileStatus?.clubOwnerId ||
          user?.clubOwnerDetail?.id ||
          user?.id;

        const photoUrisOrIds = validItems.map((p) => p.rawId || p.uri);
        const clubPhotoDetails = validItems.map((p) => ({
          id: p.rawId,
          uri: p.uri,
          url: p.uri,
          description: p.description,
          caption: p.description,
        }));

        await updateClubOwner.mutateAsync({
          id: ownerId,
          clubPhotos: photoUrisOrIds,
          photos: photoUrisOrIds,
          clubPhotoDetails,
          photosWithDescription: clubPhotoDetails,
        });
      } catch (e) {
        console.log('updateClubOwner photos sync note:', e);
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

  const isAnyUploading = uploadingSlots.some(Boolean);
  const photosCount = images.filter(Boolean).length;
  const visibleCount = showMore ? 6 : 4;
  const visibleImages = images.slice(0, visibleCount);

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center py-4">
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ChevronLeft color="black" size={24} />
        </TouchableOpacity>
        <Text className="flex-1 text-center font-bold text-lg text-gray-800 mr-8">
          Club Photos
        </Text>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 20 }}
          className="flex-1"
        >
          {/* Title & Subtitle */}
          <View className="mt-4">
            <Text className="font-bold text-[28px] text-slate-900">Upload Club Photos</Text>
            <Text className="mt-2 text-[14px] leading-5 text-slate-400">
              Upload great photos of your gym so members know what to expect
            </Text>
          </View>

          {/* Photo Cards Grid (4 initially, expands to 6 on Show More) */}
          <View className="mt-8 flex-row flex-wrap justify-between">
            {visibleImages.map((imgUri, index) => (
              <View
                key={index}
                className="mb-4 w-[48%] rounded-[20px] border border-slate-100 bg-[#F8FAFC] p-2.5"
              >
                {/* Image Preview / Upload Box */}
                <View className="h-28 w-full overflow-hidden rounded-[15px]">
                  {imgUri ? (
                    <View className="relative h-full w-full bg-slate-100">
                      <Image source={{ uri: imgUri }} className="h-full w-full" resizeMode="cover" />

                      {uploadingSlots[index] ? (
                        <View className="absolute inset-0 items-center justify-center bg-black/40 rounded-[15px]">
                          <ActivityIndicator size="small" color="#FFFFFF" />
                          <Text className="mt-1 text-[10px] font-bold text-white">Uploading...</Text>
                        </View>
                      ) : (
                        <>
                          <TouchableOpacity
                            onPress={() => removePhoto(index)}
                            activeOpacity={0.8}
                            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5"
                          >
                            <XIcon size={12} color="white" strokeWidth={3} />
                          </TouchableOpacity>
                          <View className="absolute bottom-1.5 left-2 rounded-full bg-black/45 px-2 py-0.5">
                            <Text className="text-[10px] font-semibold text-white">
                              Photo #{index + 1}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => pickImage(index)}
                      activeOpacity={0.6}
                      disabled={isAnyUploading}
                      className="h-full w-full items-center justify-center rounded-[15px] border border-dashed border-slate-200 bg-white"
                    >
                      <ImageIconLucide size={28} color="#cbd5e1" strokeWidth={1.5} />
                      <View className="absolute bottom-2 right-2 rounded-full border border-slate-100 bg-slate-50 p-1">
                        <PlusIcon size={10} color="#94a3b8" strokeWidth={3} />
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Clean Caption Input with Pencil Icon */}
                <View
                  className={`mt-2.5 h-9 flex-row items-center rounded-xl border px-2.5 ${imgUri ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-100/50'
                    }`}
                >
                  <Ionicons
                    name="create-outline"
                    size={14}
                    color={imgUri ? '#F6163C' : '#94A3B8'}
                  />
                  <TextInput
                    value={descriptions[index] || ''}
                    onChangeText={(text) => handleDescriptionChange(index, text)}
                    placeholder={imgUri ? 'Add caption (e.g. Cardio)' : 'Add photo first'}
                    placeholderTextColor="#94A3B8"
                    editable={!!imgUri && !uploadingSlots[index]}
                    maxLength={50}
                    className="ml-2 flex-1 text-[11px] font-medium text-slate-800 p-0"
                  />
                </View>
              </View>
            ))}
          </View>

          {/* Show More / Show Less Toggle Button */}
          {!showMore ? (
            <TouchableOpacity
              onPress={() => setShowMore(true)}
              activeOpacity={0.7}
              className="mb-4 w-full flex-row items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 py-3.5"
            >
              <Ionicons name="add-circle-outline" size={17} color="#F6163C" />
              <Text className="ml-2 font-bold text-xs text-[#F6163C]">
                + Show More (+2 Photos)
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => setShowMore(false)}
              activeOpacity={0.7}
              className="mb-4 w-full flex-row items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-2.5"
            >
              <Ionicons name="chevron-up-outline" size={16} color="#64748B" />
              <Text className="ml-1.5 font-semibold text-xs text-slate-600">
                Show Less
              </Text>
            </TouchableOpacity>
          )}

          {/* Tips for high quality photos */}
          <View className="mt-2">
            <Text className="mb-3 font-bold text-[16px] text-slate-800">
              Tips for high quality photos
            </Text>
            <View className="gap-y-2">
              <View className="flex-row items-start">
                <Text className="mr-2 text-slate-400">•</Text>
                <Text className="flex-1 text-[13px] text-slate-500">
                  Upload up to 6 photos showcasing your gym facilities.
                </Text>
              </View>
              <View className="flex-row items-start">
                <Text className="mr-2 text-slate-400">•</Text>
                <Text className="flex-1 text-[13px] text-slate-500">
                  Add clear captions (e.g. Cardio Zone, Free Weights, Steam Bath) for members.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Save Button */}
        <View className="py-4 bg-white">
          <TouchableOpacity
            onPress={handleSaveAll}
            disabled={photosCount === 0 || isAnyUploading || isSaving}
            className={`w-full items-center justify-center rounded-2xl py-4 shadow-lg ${photosCount === 0 || isAnyUploading || isSaving
                ? 'bg-gray-300'
                : 'bg-[#F6163C] shadow-red-200'
              }`}
          >
            {isSaving ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text className="font-bold text-white text-base">
                {photosCount === 0 ? 'Add Photos' : `Save Photos (${photosCount}/6)`}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Container>
  );
};

export default ClubPhotosScreen;