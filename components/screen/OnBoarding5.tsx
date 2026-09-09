import React, { useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserDetail } from '@/hooks/useUserDetail';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  initialData?: any;
}

const MAX_PHOTOS = 10;
const INITIAL_SLOTS_COUNT = 3;

const SUGGESTED_TAGS = [
  'Cardio Zone',
  'Free Weights',
  'Crossfit Area',
  'Reception & Entry',
  'Locker & Showers',
  'Steam & Sauna',
  'Zumba / Yoga Studio',
  'Strength Machines',
];

const OnBoarding5 = forwardRef<any, Props>((props, ref) => {
  const {
    clubPhotos,
    isClubPhotosLoading,
    refetchClubPhotos,
    uploadSingleClubPhoto,
    deleteClubPhoto,
    confirmOnboarding,
  } = useUserDetail();

  // Unified list of photos (server + instant optimistic local photos)
  const [localPhotos, setLocalPhotos] = useState<any[]>([]);
  // Expand / Collapse state (3 initially, up to 10 on Show More)
  const [showMore, setShowMore] = useState(false);

  // Modal State for Uploading a Single Photo with Description
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [pickedPhoto, setPickedPhoto] = useState<{ uri: string; name: string; type: string } | null>(
    null
  );
  const [photoCaption, setPhotoCaption] = useState('');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Fetch photos on screen mount
  useEffect(() => {
    refetchClubPhotos();
  }, []);

  // Sync server photos whenever clubPhotos query changes, preserving any in-flight uploads
  useEffect(() => {
    const raw =
      clubPhotos?.photos ||
      clubPhotos?.data ||
      clubPhotos?.clubPhotos ||
      (Array.isArray(clubPhotos) ? clubPhotos : []);

    if (Array.isArray(raw)) {
      const serverList = raw.map((item: any, idx: number) => {
        const docId = String(item?.documentId || item?.id || idx);
        const caption = item?.imageInfo || item?.description || item?.caption || '';

        let rawUrl =
          item?.fileUrl ||
          item?.url ||
          item?.images?.[0]?.url ||
          item?.images?.[0]?.fileUrl ||
          '';

        if (
          rawUrl &&
          typeof rawUrl === 'string' &&
          !rawUrl.startsWith('http://') &&
          !rawUrl.startsWith('https://') &&
          !rawUrl.startsWith('file://') &&
          !rawUrl.startsWith('content://') &&
          !rawUrl.startsWith('data:')
        ) {
          const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
          rawUrl = `${apiBase.replace(/\/+$/, '')}/${rawUrl.replace(/^\/+/, '')}`;
        }

        return {
          id: item?.id || idx,
          documentId: docId,
          imageInfo: caption,
          url: rawUrl,
          isUploading: false,
          raw: item,
        };
      });

      setLocalPhotos((prev) => {
        // Keep any currently in-flight uploads that haven't landed on server yet
        const inFlight = prev.filter((p) => p.isUploading);
        const nonDuplicates = inFlight.filter(
          (u) => !serverList.some((s) => s.documentId === u.documentId)
        );
        return [...serverList, ...nonDuplicates];
      });

      // Auto-expand if user already has more than 3 photos saved on backend
      if (serverList.length > INITIAL_SLOTS_COUNT) {
        setShowMore(true);
      }
    }
  }, [clubPhotos]);

  // Expose handleUpload for OnBoardingStep.tsx bottom button
  useImperativeHandle(ref, () => ({
    handleUpload: async () => {
      return await handleFinalConfirm();
    },
    getPhotosCount: () => localPhotos.length,
  }));

  // Pick Image from Gallery
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery permission is required to select photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPickedPhoto({
        uri: asset.uri,
        name: asset.fileName || `club_photo_${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
      setPhotoCaption('');
      setUploadModalVisible(true);
    }
  };

  // Capture Image with Camera
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setPickedPhoto({
        uri: asset.uri,
        name: `club_photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setPhotoCaption('');
      setUploadModalVisible(true);
    }
  };

  // Open Source Picker
  const handleSelectSource = () => {
    if (localPhotos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can upload up to ${MAX_PHOTOS} club photos.`);
      return;
    }

    Alert.alert('Upload Club Photo', 'Choose photo source:', [
      { text: 'Take Photo (Camera)', onPress: pickFromCamera },
      { text: 'Choose from Gallery', onPress: pickFromGallery },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // Upload Single Photo with Instant Optimistic UI (0ms delay!)
  const handleUploadSinglePhoto = async () => {
    if (!pickedPhoto) {
      Alert.alert('Required', 'Please select a photo first.');
      return;
    }

    const trimmedCaption = photoCaption.trim();
    if (!trimmedCaption) {
      Alert.alert(
        'Description Required',
        'Please enter a description for this photo (e.g. Cardio Zone, Free Weights).'
      );
      return;
    }

    // 1. INSTANT OPTIMISTIC DISPLAY: Show photo in grid immediately!
    const tempId = `temp_${Date.now()}`;
    const photoToUpload = pickedPhoto;
    const tempItem = {
      id: tempId,
      documentId: tempId,
      imageInfo: trimmedCaption,
      url: photoToUpload.uri,
      isUploading: true,
    };

    setLocalPhotos((prev) => [...prev, tempItem]);
    setUploadModalVisible(false);
    setPickedPhoto(null);
    setPhotoCaption('');

    // 2. RUN NETWORK UPLOAD IN BACKGROUND
    try {
      const res = await uploadSingleClubPhoto.mutateAsync({
        file: photoToUpload,
        imageInfo: trimmedCaption,
      });

      const serverPhoto = res?.photo || res?.data || res;
      const realDocId = String(serverPhoto?.documentId || serverPhoto?.id || tempId);
      let realUrl =
        serverPhoto?.fileUrl ||
        serverPhoto?.url ||
        serverPhoto?.images?.[0]?.url ||
        photoToUpload.uri;

      if (
        realUrl &&
        typeof realUrl === 'string' &&
        !realUrl.startsWith('http://') &&
        !realUrl.startsWith('https://') &&
        !realUrl.startsWith('file://') &&
        !realUrl.startsWith('content://') &&
        !realUrl.startsWith('data:')
      ) {
        const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
        realUrl = `${apiBase.replace(/\/+$/, '')}/${realUrl.replace(/^\/+/, '')}`;
      }

      // Smoothly update with real server data
      setLocalPhotos((prev) =>
        prev.map((item) =>
          item.documentId === tempId
            ? {
                id: serverPhoto?.id || item.id,
                documentId: realDocId,
                imageInfo: serverPhoto?.imageInfo || trimmedCaption,
                url: realUrl,
                isUploading: false,
                raw: serverPhoto,
              }
            : item
        )
      );

      refetchClubPhotos();
    } catch (e: any) {
      // If upload failed, remove temporary item and notify user
      setLocalPhotos((prev) => prev.filter((item) => item.documentId !== tempId));
      Alert.alert(
        'Upload Failed',
        e?.response?.data?.message || 'Could not upload this photo. Please try again.'
      );
    }
  };

  // Delete an Uploaded Photo (Shows small spinner on trash button while deleting)
  const handleDeletePhoto = (photo: any) => {
    Alert.alert(
      'Delete Club Photo',
      `Are you sure you want to delete "${photo.imageInfo || 'this photo'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const targetDocId = String(photo.documentId || photo.id);
            setDeletingDocId(targetDocId);

            try {
              if (!targetDocId.startsWith('temp_')) {
                await deleteClubPhoto.mutateAsync(targetDocId);
              }
              // Only remove from local state AFTER server deletion completes
              setLocalPhotos((prev) =>
                prev.filter(
                  (p) => String(p.documentId) !== targetDocId && String(p.id) !== targetDocId
                )
              );
              refetchClubPhotos();
            } catch (e: any) {
              Alert.alert(
                'Delete Failed',
                e?.response?.data?.message || 'Could not delete this photo. Please try again.'
              );
            } finally {
              setDeletingDocId(null);
            }
          },
        },
      ]
    );
  };

  // Final Onboarding Submit (POST /api/pending-club-owner/confirm)
  const handleFinalConfirm = async () => {
    // Check if any photo is currently being uploaded/saved
    const isAnyPhotoUploading =
      localPhotos.some((p) => p.isUploading) || uploadSingleClubPhoto.isPending;

    if (isAnyPhotoUploading) {
      Toast.show({
        type: 'info',
        text1: 'Photo Uploading ⏳',
        text2: 'Please wait for your photo to finish uploading.',
      });
      Alert.alert(
        'Please Wait ⏳',
        'Your photo is currently uploading. Please wait a few seconds for it to finish before submitting for verification.'
      );
      return false;
    }

    if (localPhotos.length === 0) {
      Alert.alert(
        'Club Photo Required',
        'Please upload at least 1 club photo with description before submitting your registration.'
      );
      return false;
    }

    try {
      await confirmOnboarding.mutateAsync();
      return true;
    } catch (e: any) {
      console.log('Confirm onboarding error:', e);
      return false;
    }
  };

  const isUploading = uploadSingleClubPhoto.isPending;
  const isConfirming = confirmOnboarding.isPending;

  // Compute visible slots: 3 initially, expands to 10 on showMore
  const visibleSlotsCount = showMore ? MAX_PHOTOS : INITIAL_SLOTS_COUNT;
  const slots = Array.from({ length: visibleSlotsCount }, (_, idx) => localPhotos[idx] || null);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36 }}>
        {/* Title Header */}
        <View className="mt-2 mb-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-[26px] text-slate-900">Upload Club Photos</Text>
            <View className="flex-row items-center rounded-full bg-emerald-50 px-3 py-1 border border-emerald-200">
              <Ionicons name="images" size={13} color="#10B981" />
              <Text className="ml-1.5 text-xs font-bold text-emerald-700">
                {localPhotos.length} / {MAX_PHOTOS} Uploaded
              </Text>
            </View>
          </View>
          <Text className="mt-1.5 text-sm text-slate-500 font-medium">
            Upload clear photos with captions so members know what equipment and facilities to expect.
          </Text>
        </View>

        {/* Initial Loading Indicator */}
        {isClubPhotosLoading && localPhotos.length === 0 && (
          <View className="items-center py-8">
            <ActivityIndicator size="small" color="#F6163C" />
            <Text className="mt-2 text-xs font-medium text-slate-400">
              Loading club photos...
            </Text>
          </View>
        )}

        {/* 3 Boxes Initially (Expands to 10 on Show More) */}
        <View className="flex-row flex-wrap justify-between">
          {slots.map((photo, index) => {
            const isHero = index === 0;
            const isDeletingThis =
              photo &&
              (deletingDocId === String(photo.documentId) || deletingDocId === String(photo.id));

            if (photo) {
              // Filled Photo Card
              return (
                <View
                  key={photo.documentId || index}
                  className={`mb-4 ${
                    isHero ? 'w-full' : 'w-[48%]'
                  } rounded-[20px] border border-slate-100 bg-[#F8FAFC] p-2.5 shadow-sm`}>
                  {/* Image Box */}
                  <View
                    className={`${
                      isHero ? 'h-44' : 'h-32'
                    } w-full overflow-hidden rounded-[15px] bg-slate-200 relative`}>
                    {photo.url ? (
                      <Image
                        source={{ uri: photo.url }}
                        className="h-full w-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="flex-1 items-center justify-center bg-slate-100">
                        <Ionicons name="image-outline" size={32} color="#94A3B8" />
                      </View>
                    )}

                    {/* Top Right Status / Delete Button */}
                    {photo.isUploading ? (
                      <View className="absolute right-2 top-2 flex-row items-center rounded-full bg-black/65 px-2 py-1 shadow-sm">
                        <ActivityIndicator
                          size="small"
                          color="#FFF"
                          style={{ transform: [{ scale: 0.65 }] }}
                        />
                        <Text className="text-[10px] font-bold text-white ml-1">Saving...</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleDeletePhoto(photo)}
                        disabled={isDeletingThis || isConfirming}
                        activeOpacity={0.8}
                        className="absolute right-2 top-2 h-7 w-7 items-center justify-center rounded-full bg-rose-600/90 shadow-sm">
                        {isDeletingThis ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Ionicons name="trash" size={14} color="white" />
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Photo Index Tag */}
                    <View className="absolute bottom-1.5 left-2 rounded-full bg-black/50 px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-white">
                        {isHero ? '#1 Main Photo' : `#${index + 1}`}
                      </Text>
                    </View>
                  </View>

                  {/* Caption / Description Display */}
                  <View className="mt-2.5 flex-row items-center rounded-xl bg-white border border-slate-200/80 px-2.5 py-1.5">
                    <Ionicons name="chatbox-ellipses-outline" size={13} color="#F6163C" />
                    <Text
                      className="ml-1.5 flex-1 text-[11px] font-bold text-slate-800"
                      numberOfLines={1}>
                      {photo.imageInfo || 'Gym Facility'}
                    </Text>
                  </View>
                </View>
              );
            }

            // Empty Slot Box (Direct Tap to Upload)
            return (
              <TouchableOpacity
                key={`empty_slot_${index}`}
                onPress={handleSelectSource}
                disabled={isUploading || isConfirming}
                activeOpacity={0.7}
                className={`mb-4 ${
                  isHero ? 'w-full h-44' : 'w-[48%] h-44'
                } items-center justify-center rounded-[20px] border-2 border-dashed border-rose-200 bg-rose-50/40 p-3`}>
                <View className="h-11 w-11 items-center justify-center rounded-full bg-rose-100 mb-1.5">
                  <Ionicons name="camera" size={22} color="#F6163C" />
                </View>
                <Text className="font-bold text-xs text-center text-slate-800">
                  {isHero ? '+ Add Main Photo #1' : `+ Add Photo #${index + 1}`}
                </Text>
                <Text className="mt-0.5 text-[10px] text-center text-slate-400">
                  With description
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Show More / Show Less Toggle Button */}
        {!showMore ? (
          <TouchableOpacity
            onPress={() => setShowMore(true)}
            activeOpacity={0.85}
            style={{
              marginTop: 6,
              marginBottom: 16,
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: '#FECDD3',
              backgroundColor: '#FFF5F6',
              shadowColor: '#F6163C',
              shadowOpacity: 0.08,
              shadowOffset: { width: 0, height: 3 },
              shadowRadius: 6,
              elevation: 2,
              overflow: 'hidden',
            }}>
            <LinearGradient
              colors={['#FFF5F6', '#FFE8EC']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 16,
                paddingVertical: 14,
                minHeight: 68,
              }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 10 }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    backgroundColor: '#FFFFFF',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#FECDD3',
                    shadowColor: '#000',
                    shadowOpacity: 0.05,
                    shadowOffset: { width: 0, height: 2 },
                    shadowRadius: 4,
                    elevation: 1,
                  }}>
                  <Ionicons name="images" size={22} color="#F6163C" />
                </View>
                <View style={{ marginLeft: 12, flex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#1E293B' }}>
                      Show More Photo Slots
                    </Text>
                    <View
                      style={{
                        marginLeft: 8,
                        borderRadius: 999,
                        backgroundColor: '#F6163C',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                      }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5 }}>
                        +7 SLOTS
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Expand to upload up to 10 facility photos
                  </Text>
                </View>
              </View>
              <View
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 1,
                  borderColor: '#FECDD3',
                }}>
                <Ionicons name="chevron-down" size={16} color="#F6163C" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowMore(false)}
            activeOpacity={0.8}
            style={{
              marginTop: 4,
              marginBottom: 16,
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#E2E8F0',
              backgroundColor: '#F8FAFC',
              paddingVertical: 12,
              paddingHorizontal: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            <Ionicons name="chevron-up-circle-outline" size={18} color="#64748B" />
            <Text style={{ marginLeft: 8, fontSize: 12, fontWeight: '700', color: '#475569' }}>
              Collapse Extra Slots (Show First 3)
            </Text>
          </TouchableOpacity>
        )}

        {/* Photography Tips */}
        <View className="mt-4 rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
          <View className="flex-row items-center mb-2.5">
            <Ionicons name="bulb-outline" size={18} color="#F59E0B" />
            <Text className="ml-1.5 font-bold text-sm text-slate-800">Tips for Great Photos</Text>
          </View>
          <View className="gap-y-1.5">
            <View className="flex-row items-start">
              <Text className="mr-2 text-slate-400">•</Text>
              <Text className="flex-1 text-xs text-slate-500">
                Upload up to 10 photos showcasing your gym facilities, machines, and zones.
              </Text>
            </View>
            <View className="flex-row items-start">
              <Text className="mr-2 text-slate-400">•</Text>
              <Text className="flex-1 text-xs text-slate-500">
                Add descriptive captions like "Cardio Zone", "Free Weights", "Steam Room".
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* UPLOAD MODAL (Single Photo + Caption) */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          if (!isUploading) setUploadModalVisible(false);
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-end bg-black/60">
          <View className="rounded-t-[32px] bg-white p-6 max-h-[90%]">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-4 border-b border-slate-100">
              <View>
                <Text className="font-bold text-lg text-slate-900">Upload Club Photo</Text>
                <Text className="text-xs text-slate-400">Add a caption for this facility</Text>
              </View>
              <TouchableOpacity
                onPress={() => setUploadModalVisible(false)}
                disabled={isUploading}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mt-4">
              {/* Image Preview Box */}
              {pickedPhoto?.uri && (
                <View className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100 relative mb-4">
                  <Image
                    source={{ uri: pickedPhoto.uri }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={handleSelectSource}
                    disabled={isUploading}
                    className="absolute bottom-2 right-2 flex-row items-center rounded-full bg-black/70 px-3 py-1.5">
                    <Ionicons name="camera-reverse" size={14} color="white" />
                    <Text className="ml-1 text-[11px] font-bold text-white">Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Caption Input */}
              <View className="mb-3">
                <Text className="mb-2 text-xs font-bold text-slate-700">
                  Facility Description / Caption <Text className="text-rose-500">*</Text>
                </Text>
                <View className="flex-row items-center rounded-2xl border border-slate-200 bg-[#F8FAFC] px-4 py-3">
                  <Ionicons name="create-outline" size={18} color="#F6163C" />
                  <TextInput
                    value={photoCaption}
                    onChangeText={setPhotoCaption}
                    placeholder="e.g. Cardio Zone, Free Weights Section"
                    placeholderTextColor="#94A3B8"
                    maxLength={60}
                    editable={!isUploading}
                    className="ml-2.5 flex-1 font-semibold text-sm text-slate-900 p-0"
                  />
                </View>
              </View>

              {/* Suggested Quick Tags */}
              <View className="mb-5">
                <Text className="mb-2 text-[11px] font-semibold text-slate-400">
                  Quick suggestions (tap to use):
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((tag) => {
                    const isSelected = photoCaption.toLowerCase() === tag.toLowerCase();
                    return (
                      <TouchableOpacity
                        key={tag}
                        onPress={() => setPhotoCaption(tag)}
                        disabled={isUploading}
                        activeOpacity={0.7}
                        className={`rounded-full px-3 py-1.5 border ${
                          isSelected
                            ? 'bg-rose-50 border-[#F6163C]'
                            : 'bg-slate-100 border-slate-200/60'
                        }`}>
                        <Text
                          className={`text-xs font-semibold ${
                            isSelected ? 'text-[#F6163C]' : 'text-slate-600'
                          }`}>
                          {tag}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Upload Button */}
              <TouchableOpacity
                onPress={handleUploadSinglePhoto}
                disabled={!photoCaption.trim()}
                activeOpacity={0.8}
                className={`h-14 w-full flex-row items-center justify-center rounded-2xl ${
                  !photoCaption.trim() ? 'bg-slate-300' : 'bg-[#F6163C]'
                }`}>
                <View className="flex-row items-center">
                  <Ionicons name="cloud-upload" size={18} color="white" />
                  <Text className="ml-2 font-bold text-[15px] text-white">
                    Upload Club Photo
                  </Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
});

OnBoarding5.displayName = 'OnBoarding5';

export default OnBoarding5;