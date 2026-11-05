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
  Pressable,
  StyleSheet,
  BackHandler,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import { LinearGradient } from 'expo-linear-gradient';
import GymLoader from '@/components/GymLoader';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/useAuthStore';
import {
  analyzeGymImage,
  GYM_AREA_CATEGORIES,
  GymAreaAnalysisResult,
} from '@/services/gymAreaAiService';

interface Props {
  initialData?: any;
}


const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'Cardio Area': 'speedometer-outline',
  'Free Weights Area': 'barbell-outline',
  'Weight Training Area': 'fitness-outline',
  'CrossFit / Functional Zone': 'flash-outline',
  'Yoga & Aerobics Studio': 'body-outline',
  'Personal Training Area': 'people-outline',
  'Stretching Area': 'walk-outline',
  'Boxing / Combat Zone': 'shield-outline',
  'Reception & Waiting': 'business-outline',
  'Gym Exterior / Entrance': 'storefront-outline',
  'Swimming Pool': 'water-outline',
  'Steam & Sauna': 'flame-outline',
  'Locker Room': 'lock-closed-outline',
  'Shower & Washroom': 'water-outline',
  'Cafeteria / Juice Bar': 'cafe-outline',
  'Parking Area': 'car-outline',
  'Office': 'briefcase-outline',
  'Other': 'grid-outline',
};

// Shimmer Skeleton with smooth left-to-right light sweep animation over images
const PhotoShimmerCard = ({ isHero }: { isHero?: boolean }) => {
  const animatedValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 1300,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [animatedValue]);

  const translateX = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [-350, 350],
  });

  return (
    <View
      className={`mb-4 ${isHero ? 'w-full' : 'w-[48%]'} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}>
      {/* Image Skeleton Box */}
      <View className={`${isHero ? 'h-52' : 'h-36'} w-full overflow-hidden bg-slate-200 relative`}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { transform: [{ translateX }], width: '100%' },
          ]}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
      </View>

      {/* Caption Skeleton Bar */}
      <View className="flex-row items-center border-t border-slate-100 bg-white px-3 py-2.5">
        <View className="h-3 w-28 rounded bg-slate-200 overflow-hidden relative">
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              { transform: [{ translateX }] },
            ]}>
            <LinearGradient
              colors={['transparent', 'rgba(255, 255, 255, 0.55)', 'transparent']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ width: '100%', height: '100%' }}
            />
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const MAX_PHOTOS = 17;
const MIN_REQUIRED_PHOTOS = 2;
const INITIAL_SLOTS_COUNT = 5;

const normalizePhotoUrl = (item: any): string => {
  if (!item) return '';

  const formatStringUrl = (str: string): string => {
    let clean = str.trim().replace(/\\/g, '/');
    if (!clean) return '';

    if (clean.startsWith('http://backend.fitfob.com')) {
      clean = clean.replace('http://backend.fitfob.com', 'https://backend.fitfob.com');
    }

    if (
      !clean.startsWith('http://') &&
      !clean.startsWith('https://') &&
      !clean.startsWith('file://') &&
      !clean.startsWith('content://') &&
      !clean.startsWith('data:')
    ) {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || 'https://backend.fitfob.com';
      return `${apiBase.replace(/\/+$/, '')}/${clean.replace(/^\/+/, '')}`;
    }
    return clean;
  };

  if (typeof item === 'string') {
    return formatStringUrl(item);
  }

  const rawUrl =
    item?.url ||
    item?.fileUrl ||
    item?.uri ||
    item?.path ||
    item?.src ||
    item?.photoUrl ||
    item?.imageUrl ||
    item?.image_url ||
    item?.file_url ||
    item?.raw?.url ||
    item?.raw?.fileUrl ||
    item?.image?.url ||
    item?.image?.fileUrl ||
    (Array.isArray(item?.image) ? item.image[0]?.url || item.image[0]?.fileUrl : '') ||
    item?.photo?.url ||
    item?.photo?.fileUrl ||
    (Array.isArray(item?.photo) ? item.photo[0]?.url || item.photo[0]?.fileUrl : '') ||
    item?.file?.url ||
    item?.file?.fileUrl ||
    item?.images?.[0]?.url ||
    item?.images?.[0]?.fileUrl ||
    item?.attributes?.url ||
    item?.attributes?.fileUrl ||
    item?.attributes?.image?.data?.attributes?.url ||
    item?.attributes?.image?.data?.[0]?.attributes?.url ||
    item?.image?.data?.attributes?.url ||
    item?.image?.data?.[0]?.attributes?.url ||
    item?.formats?.medium?.url ||
    item?.formats?.small?.url ||
    item?.formats?.thumbnail?.url ||
    item?.image?.formats?.medium?.url ||
    item?.image?.formats?.small?.url ||
    item?.image?.formats?.thumbnail?.url ||
    (typeof item?.image === 'string' ? item.image : '') ||
    (typeof item?.photo === 'string' ? item.photo : '') ||
    '';

  if (!rawUrl || typeof rawUrl !== 'string') return '';
  return formatStringUrl(rawUrl);
};

const OnBoarding5 = forwardRef<any, Props>((props, ref) => {
  const insets = useSafeAreaInsets();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const { user } = useAuthStore();
  const userKey = user?.id || user?.email || 'guest';
  const CACHE_KEY = `@club_photos_cache_${userKey}`;
  const ONBOARDING_KEY = `@onboarding_photos_cache_${userKey}`;

  const {
    clubPhotos,
    isClubPhotosLoading,
    refetchClubPhotos,
    uploadSingleClubPhoto,
    deleteClubPhoto,
    confirmOnboarding,
  } = useUserDetail({ fetchPhotos: true });

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
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [aiResult, setAiResult] = useState<GymAreaAnalysisResult | null>(null);

  // Automatically detect gym area (e.g. Cardio Area, Free Weights Area)
  const runAiAnalysis = async (uri: string) => {
    setIsAnalyzingAi(true);
    setAiResult(null);
    try {
      const res = await analyzeGymImage(uri);
      if (res && res.area && res.area !== 'Other') {
        setAiResult(res);
        setPhotoCaption(res.area);
        Toast.show({
          type: 'success',
          text1: ` Detected: ${res.area}`,
          text2: 'Tap upload or select another category below',
          visibilityTime: 2500,
        });
      }
    } catch (e: any) {
      console.warn('AI Area Analysis error:', e?.message || e);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  // 1. Instant Cache Initialization from AsyncStorage on mount
  useEffect(() => {
    const loadCached = async () => {
      try {
        const saved = (await AsyncStorage.getItem(CACHE_KEY)) || (await AsyncStorage.getItem(ONBOARDING_KEY));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setLocalPhotos((prev) => (prev.length === 0 ? parsed : prev));
            if (parsed.length > INITIAL_SLOTS_COUNT) {
              setShowMore(true);
            }
          }
        }
      } catch (e) { }
    };
    loadCached();
    refetchClubPhotos();
  }, [userKey]);

  // 2. Sync server photos whenever clubPhotos query changes, preserving any in-flight uploads
  useEffect(() => {
    const raw =
      clubPhotos?.photos ||
      clubPhotos?.clubPhotos ||
      clubPhotos?.data?.photos ||
      clubPhotos?.data?.clubPhotos ||
      clubPhotos?.data ||
      (Array.isArray(clubPhotos) ? clubPhotos : []);

    if (Array.isArray(raw) && raw.length > 0) {
      const serverList = raw
        .map((item: any, idx: number) => {
          const docId = String(item?.documentId || item?.id || idx);
          const caption =
            item?.imageInfo ||
            item?.description ||
            item?.caption ||
            item?.title ||
            item?.name ||
            item?.attributes?.imageInfo ||
            item?.attributes?.caption ||
            '';

          const rawUrl = normalizePhotoUrl(item);

          return {
            id: item?.id || idx,
            documentId: docId,
            imageInfo: caption,
            url: rawUrl,
            fileUrl: rawUrl,
            isUploading: false,
            raw: item,
          };
        })
        .filter((p: any) => !!p.url);

      if (serverList.length > 0) {
        setLocalPhotos((prev) => {
          const inFlight = prev.filter((p) => p.isUploading);
          const nonDuplicates = inFlight.filter(
            (u) => !serverList.some((s) => s.documentId === u.documentId)
          );
          // Sort server photos by id ascending (oldest first) so slot #1 = first uploaded
          const sortedServer = [...serverList].sort((a, b) => {
            const aId = typeof a.id === 'number' ? a.id : parseInt(a.id, 10) || 0;
            const bId = typeof b.id === 'number' ? b.id : parseInt(b.id, 10) || 0;
            return aId - bId;
          });
          // In-flight (uploading) go at the end, after confirmed photos
          const combined = [...sortedServer, ...nonDuplicates];
          AsyncStorage.setItem(CACHE_KEY, JSON.stringify(combined)).catch(console.log);
          AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(combined)).catch(console.log);
          return combined;
        });

        if (serverList.length > INITIAL_SLOTS_COUNT) {
          setShowMore(true);
        }
      }
    }
  }, [clubPhotos, userKey]);

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
      mediaTypes: ['images'],
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
      setAiResult(null);
      setUploadModalVisible(true);
      runAiAnalysis(asset.uri);
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
      setAiResult(null);
      setUploadModalVisible(true);
      runAiAnalysis(asset.uri);
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
    setAiResult(null);
    setIsAnalyzingAi(false);

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
      setLocalPhotos((prev) => {
        const updated = prev.map((item) =>
          item.documentId === tempId
            ? {
              id: serverPhoto?.id || item.id,
              documentId: realDocId,
              imageInfo: serverPhoto?.imageInfo || trimmedCaption,
              url: realUrl,
              fileUrl: realUrl,
              isUploading: false,
              raw: serverPhoto,
            }
            : item
        );
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated)).catch(console.log);
        AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated)).catch(console.log);
        return updated;
      });

      refetchClubPhotos();
    } catch (e: any) {
      // If upload failed, remove temporary item and notify user
      setLocalPhotos((prev) => {
        const reverted = prev.filter((item) => item.documentId !== tempId);
        AsyncStorage.setItem(CACHE_KEY, JSON.stringify(reverted)).catch(console.log);
        AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(reverted)).catch(console.log);
        return reverted;
      });
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
              setLocalPhotos((prev) => {
                const updated = prev.filter(
                  (p) => String(p.documentId) !== targetDocId && String(p.id) !== targetDocId
                );
                AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updated)).catch(console.log);
                AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(updated)).catch(console.log);
                return updated;
              });
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
    // 1. Minimum photos are required
    if (!localPhotos || localPhotos.length < MIN_REQUIRED_PHOTOS) {
      Toast.show({
        type: 'error',
        text1: `Minimum ${MIN_REQUIRED_PHOTOS} Photos Required 📷`,
        text2: `Please upload at least ${MIN_REQUIRED_PHOTOS} club photos (${localPhotos?.length || 0}/${MIN_REQUIRED_PHOTOS} uploaded).`,
        visibilityTime: 4000,
      });
      return false;
    }

    // 2. Check if any photo is currently being uploaded/saved
    const isAnyPhotoUploading =
      localPhotos.some((p) => p.isUploading) || uploadSingleClubPhoto.isPending;

    if (isAnyPhotoUploading) {
      Toast.show({
        type: 'info',
        text1: 'Photo Uploading ⏳',
        text2: 'Your photo is currently uploading. Please wait a moment.',
        visibilityTime: 4000,
      });
      return false;
    }

    setIsSubmittingVerification(true);
    try {
      await confirmOnboarding.mutateAsync();
      return true;
    } catch (e: any) {
      console.log('Confirm onboarding error:', e);
      return false;
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  const isUploading = uploadSingleClubPhoto.isPending;
  const isConfirming = confirmOnboarding.isPending || isSubmittingVerification;

    const displayedCategories = React.useMemo(() => {
    if (showAllCategories) {
      return GYM_AREA_CATEGORIES;
    }
    const top8 = GYM_AREA_CATEGORIES.slice(0, 8);
    if (aiResult?.area && !top8.includes(aiResult.area as any)) {
      return [...top8.slice(0, 7), aiResult.area as any];
    }
    return top8;
  }, [showAllCategories, aiResult]);

  const categoryRows = React.useMemo(() => {
    const rows: (typeof GYM_AREA_CATEGORIES[number])[][] = [];
    for (let i = 0; i < displayedCategories.length; i += 2) {
      rows.push(displayedCategories.slice(i, i + 2));
    }
    return rows;
  }, [displayedCategories]);

  // Hardware back press on Android to dismiss bottom sheet
  useEffect(() => {
    if (!uploadModalVisible) return;
    const onBackPress = () => {
      if (!isUploading) {
        setUploadModalVisible(false);
        setPickedPhoto(null);
        setPhotoCaption('');
        setAiResult(null);
        setIsAnalyzingAi(false);
        setShowAllCategories(false);
        return true;
      }
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [uploadModalVisible, isUploading]);

  // Compute visible slots: INITIAL_SLOTS_COUNT initially, expands to MAX_PHOTOS (17) on showMore
  const visibleSlotsCount = showMore ? MAX_PHOTOS : INITIAL_SLOTS_COUNT;
  const slots = Array.from({ length: visibleSlotsCount }, (_, idx) => localPhotos[idx] || null);

  return (
    <View className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 36, paddingHorizontal: 2 }}>
        {/* Title Header */}
        <View className="mt-2 mb-5">
          <View className="flex-row items-center justify-between">
            <Text className="font-bold text-[24px] text-slate-900">Upload Club Photos</Text>
            <View
              className={`flex-row items-center rounded-full px-3 py-1 border ${
                localPhotos.length >= MIN_REQUIRED_PHOTOS
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-rose-50 border-rose-200'
              }`}>
              <Ionicons
                name={localPhotos.length >= MIN_REQUIRED_PHOTOS ? 'checkmark-circle' : 'images'}
                size={13}
                color={localPhotos.length >= MIN_REQUIRED_PHOTOS ? '#10B981' : '#F6163C'}
              />
              <Text
                className={`ml-1.5 text-xs font-bold ${
                  localPhotos.length >= MIN_REQUIRED_PHOTOS ? 'text-emerald-700' : 'text-rose-600'
                }`}>
                {localPhotos.length} / {MAX_PHOTOS} ({localPhotos.length < MIN_REQUIRED_PHOTOS ? `Min ${MIN_REQUIRED_PHOTOS} Req` : 'Required'})
              </Text>
            </View>
          </View>
          <Text className="mt-1.5 text-sm text-slate-500 font-medium">
            Upload clear photos with captions. Minimum {MIN_REQUIRED_PHOTOS} required (up to {MAX_PHOTOS} photos allowed).
          </Text>
        </View>

        {/* Shimmer Swipe Loading over Images */}
        {isClubPhotosLoading && localPhotos.length === 0 ? (
          <View className="flex-row flex-wrap justify-between">
            <PhotoShimmerCard isHero={true} />
            <PhotoShimmerCard isHero={false} />
            <PhotoShimmerCard isHero={false} />
          </View>
        ) : (
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
                  className={`mb-4 ${isHero ? 'w-full' : 'w-[48%]'
                    } overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm`}>
                  {/* Image Box */}
                  <View
                    className={`${isHero ? 'h-52' : 'h-36'
                      } w-full overflow-hidden bg-slate-100 relative`}>
                    {(() => {
                      const imageUri = normalizePhotoUrl(photo.url || photo.fileUrl || photo.raw || photo);
                      return imageUri ? (
                        <Image
                          source={{ uri: imageUri }}
                          style={{ width: '100%', height: '100%' }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />
                      ) : (
                        <View className="flex-1 items-center justify-center bg-slate-100">
                          <Ionicons name="image-outline" size={32} color="#94A3B8" />
                        </View>
                      );
                    })()}

                    {/* Top Right Status / Delete Button */}
                    {photo.isUploading ? (
                      <View className="absolute right-2.5 top-2.5 flex-row items-center rounded-full bg-black/70 px-2.5 py-1 shadow-sm">
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
                        className="absolute right-2.5 top-2.5 h-7 w-7 items-center justify-center rounded-full bg-rose-600/90 shadow-sm">
                        {isDeletingThis ? (
                          <ActivityIndicator size="small" color="white" />
                        ) : (
                          <Ionicons name="trash" size={14} color="white" />
                        )}
                      </TouchableOpacity>
                    )}

                    {/* Photo Index Tag */}
                    <View className="absolute bottom-2 left-2.5 rounded-full bg-black/60 px-2.5 py-0.5">
                      <Text className="text-[10px] font-semibold text-white">
                        {isHero ? '#1 Main Photo' : `#${index + 1}`}
                        {index < MIN_REQUIRED_PHOTOS ? ' • Req' : ''}
                      </Text>
                    </View>
                  </View>

                  {/* Caption / Description Display */}
                  <View className="flex-row items-center border-t border-slate-100 bg-white px-3 py-2.5">
                    <Ionicons name="chatbox-ellipses-outline" size={14} color="#F6163C" />
                    <Text
                      className="ml-2 flex-1 text-xs font-semibold text-slate-800"
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
                className={`mb-4 ${isHero ? 'w-full h-52' : 'w-[48%] h-44'
                  } items-center justify-center rounded-2xl border-2 border-dashed ${
                    index < MIN_REQUIRED_PHOTOS
                      ? 'border-rose-300 bg-rose-50/50'
                      : 'border-slate-200 bg-slate-50/60'
                  } p-3`}>
                <View
                  className={`h-11 w-11 items-center justify-center rounded-full mb-1.5 ${
                    index < MIN_REQUIRED_PHOTOS ? 'bg-rose-100' : 'bg-slate-100'
                  }`}>
                  <Ionicons
                    name="camera"
                    size={22}
                    color={index < MIN_REQUIRED_PHOTOS ? '#F6163C' : '#64748B'}
                  />
                </View>
                <Text
                  className={`font-bold text-xs text-center ${
                    index < MIN_REQUIRED_PHOTOS ? 'text-slate-800' : 'text-slate-600'
                  }`}>
                  {isHero
                    ? '+ Add Main Photo #1 (Required)'
                    : index < MIN_REQUIRED_PHOTOS
                    ? `+ Add Photo #${index + 1} (Required)`
                    : `+ Add Photo #${index + 1} (Optional)`}
                </Text>
                <Text className="mt-0.5 text-[10px] text-center text-slate-400">
                  {index < MIN_REQUIRED_PHOTOS ? 'Required • with caption' : 'Optional • with caption'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
                        +{MAX_PHOTOS - INITIAL_SLOTS_COUNT} SLOTS
                      </Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    Expand to upload up to {MAX_PHOTOS} facility photos ({MIN_REQUIRED_PHOTOS} required)
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
              Collapse Extra Slots (Show First {INITIAL_SLOTS_COUNT})
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
                Upload at least {MIN_REQUIRED_PHOTOS} photos (up to {MAX_PHOTOS} total) showcasing your gym facilities, machines, and zones.
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

      {/* IN-TREE BULLETPROOF BOTTOM SHEET (Anchored at bottom: 0, 100% gap-free across all devices) */}
      {uploadModalVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]}>
          {/* Dark Backdrop (tap to dismiss) */}
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!isUploading) {
                setUploadModalVisible(false);
                setPickedPhoto(null);
                setPhotoCaption('');
                setAiResult(null);
                setIsAnalyzingAi(false);
                setShowAllCategories(false);
              }
            }}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />
          </Pressable>

          {/* Bottom Sheet Card - Sits Flush at the bottom of the device */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              maxHeight: '90%',
              paddingHorizontal: 20,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 24),
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.2,
              shadowRadius: 16,
              elevation: 32,
            }}>
            {/* Drag Handle Indicator */}
            <View className="items-center pb-2 pt-1">
              <View className="w-12 h-1.5 rounded-full bg-slate-200" />
            </View>

            {/* Modal Header */}
            <View className="flex-row items-center justify-between pb-3.5 border-b border-slate-100">
              <View>
                <Text className="font-bold text-lg text-slate-900">Upload Club Photo</Text>
                <Text className="text-xs text-slate-400">Add a caption for this facility</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (!isUploading) {
                    setUploadModalVisible(false);
                    setPickedPhoto(null);
                    setPhotoCaption('');
                    setAiResult(null);
                    setIsAnalyzingAi(false);
                    setShowAllCategories(false);
                  }
                }}
                disabled={isUploading}
                className="h-9 w-9 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flexShrink: 1 }}
              className="mt-3.5"
              contentContainerStyle={{ paddingBottom: 16 }}>
              {/* Image Preview Box */}
              {pickedPhoto?.uri && (
                <View className="h-44 w-full overflow-hidden rounded-2xl bg-slate-100 relative mb-3.5 shadow-sm">
                  <Image
                    source={{ uri: pickedPhoto.uri }}
                    className="h-full w-full"
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    onPress={handleSelectSource}
                    disabled={isUploading}
                    className="absolute bottom-2.5 right-2.5 flex-row items-center rounded-full bg-black/75 px-3 py-1.5">
                    <Ionicons name="camera-reverse" size={14} color="white" />
                    <Text className="ml-1 text-[11px] font-bold text-white">Change</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* AI Detection Loading Banner */}
              {isAnalyzingAi && (
                <View className="mb-3.5 flex-row items-center rounded-2xl border border-rose-200 bg-rose-50/80 p-3">
                  <ActivityIndicator size="small" color="#F6163C" />
                  <View className="ml-3 flex-1">
                    <Text className="text-xs font-bold text-rose-800">
                       AI Detecting Gym Area...
                    </Text>
                    <Text className="text-[11px] text-rose-600 mt-0.5">
                      Classifying zone (Cardio, Free Weights, etc.)
                    </Text>
                  </View>
                </View>
              )}

              {/* AI Detection Result Badge */}
              {!isAnalyzingAi && aiResult && (
                <View className="mb-3.5 flex-row items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50/90 px-3.5 py-2.5">
                  <View className="flex-row items-center flex-1 mr-2">
                    <View className="h-6 w-6 items-center justify-center rounded-full bg-emerald-100 mr-2">
                      <Ionicons name="sparkles" size={13} color="#059669" />
                    </View>
                    <View>
                      <Text className="text-xs font-bold text-emerald-950">
                        {aiResult.area}
                      </Text>
                      <Text className="text-[10px] text-emerald-700">
                        Auto-detected with {Math.round(aiResult.confidence * 100)}% match
                      </Text>
                    </View>
                  </View>
                  {photoCaption !== aiResult.area && (
                    <TouchableOpacity
                      onPress={() => setPhotoCaption(aiResult.area)}
                      className="rounded-full bg-emerald-600 px-3 py-1">
                      <Text className="text-[11px] font-bold text-white">Apply</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Area Name / Caption Input */}
              <View className="mb-4">
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-xs font-bold text-slate-700">
                    Facility Area / Caption <Text className="text-rose-500">*</Text>
                  </Text>
                  {pickedPhoto?.uri && !isAnalyzingAi && (
                    <TouchableOpacity
                      onPress={() => runAiAnalysis(pickedPhoto.uri)}
                      disabled={isUploading}
                      className="flex-row items-center bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200">
                      <Ionicons name="sparkles" size={11} color="#F6163C" />
                      <Text className="ml-1 text-[10px] font-bold text-[#F6163C]">
                        Re-detect
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <View className="rounded-2xl border border-slate-200 bg-[#F8FAFC] px-3.5 py-3">
                  <View className="flex-row items-center">
                    <Ionicons name="pricetag-outline" size={18} color="#F6163C" />
                    <TextInput
                      value={photoCaption}
                      onChangeText={setPhotoCaption}
                      placeholder="e.g. Cardio Area, Free Weights Area"
                      placeholderTextColor="#94A3B8"
                      maxLength={60}
                      editable={!isUploading}
                      className="ml-2.5 flex-1 font-semibold text-xs text-slate-900 p-0"
                    />
                    {photoCaption ? (
                      <TouchableOpacity onPress={() => setPhotoCaption('')} disabled={isUploading}>
                        <Ionicons name="close-circle" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Enhanced 2-Column Balanced Quick Categories Grid */}
              <View className="mb-2">
                <View className="flex-row items-center justify-between mb-2.5">
                  <Text className="text-xs font-bold text-slate-700">
                    Quick Categories
                  </Text>
                  <Text className="text-[11px] font-medium text-slate-400">
                    Tap any to apply
                  </Text>
                </View>

                <View className="gap-2">
                  {categoryRows.map((row, rowIdx) => (
                    <View key={rowIdx} className="flex-row gap-2">
                      {row.map((tag) => {
                        const isSelected = photoCaption.toLowerCase() === tag.toLowerCase();
                        const isAiSuggested = aiResult?.area?.toLowerCase() === tag.toLowerCase();
                        const iconName = CATEGORY_ICONS[tag] || 'fitness-outline';

                        return (
                          <TouchableOpacity
                            key={tag}
                            onPress={() => setPhotoCaption(tag)}
                            disabled={isUploading}
                            activeOpacity={0.7}
                            className={`flex-1 flex-row items-center justify-between rounded-xl px-2.5 py-2.5 border ${
                              isSelected
                                ? 'bg-rose-50 border-[#F6163C]'
                                : isAiSuggested
                                ? 'bg-emerald-50/90 border-emerald-400'
                                : 'bg-[#F8FAFC] border-slate-200/80'
                            }`}>
                            <View className="flex-row items-center flex-1 mr-1">
                              <View
                                className={`h-7 w-7 items-center justify-center rounded-lg mr-2 ${
                                  isSelected
                                    ? 'bg-[#F6163C]'
                                    : isAiSuggested
                                    ? 'bg-emerald-500'
                                    : 'bg-white border border-slate-200/70'
                                }`}>
                                <Ionicons
                                  name={iconName}
                                  size={14}
                                  color={isSelected || isAiSuggested ? '#FFFFFF' : '#64748B'}
                                />
                              </View>
                              <Text
                                numberOfLines={1}
                                className={`text-[11px] flex-1 ${
                                  isSelected
                                    ? 'text-[#F6163C] font-bold'
                                    : isAiSuggested
                                    ? 'text-emerald-900 font-bold'
                                    : 'text-slate-700 font-medium'
                                }`}>
                                {tag}
                              </Text>
                            </View>

                            {isSelected && (
                              <Ionicons name="checkmark-circle" size={15} color="#F6163C" />
                            )}
                            {!isSelected && isAiSuggested && (
                              <Ionicons name="sparkles" size={13} color="#059669" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                      {row.length === 1 && <View className="flex-1" />}
                    </View>
                  ))}
                </View>

                {/* Expand / Collapse All Categories Toggle */}
                <TouchableOpacity
                  onPress={() => setShowAllCategories((prev) => !prev)}
                  activeOpacity={0.7}
                  className="mt-2.5 flex-row items-center justify-center py-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <Ionicons
                    name={showAllCategories ? 'chevron-up' : 'chevron-down'}
                    size={14}
                    color="#475569"
                  />
                  <Text className="ml-1.5 text-xs font-semibold text-slate-700">
                    {showAllCategories
                      ? 'Show Fewer Categories'
                      : `View All Categories (${GYM_AREA_CATEGORIES.length})`}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Upload Button Pinned At Bottom */}
            <View className="pt-2 border-t border-slate-100">
              <TouchableOpacity
                onPress={handleUploadSinglePhoto}
                disabled={!photoCaption.trim() || isUploading}
                activeOpacity={0.8}
                className={`h-14 w-full flex-row items-center justify-center rounded-2xl ${
                  !photoCaption.trim() || isUploading ? 'bg-slate-300' : 'bg-[#F6163C]'
                }`}>
                {isUploading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <View className="flex-row items-center">
                    <Ionicons name="cloud-upload" size={18} color="white" />
                    <Text className="ml-2 font-bold text-[15px] text-white">
                      Upload Club Photo
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Motivational GymLoader while submitting for verification */}
      <GymLoader visible={isConfirming} />
    </View>
  );
});

OnBoarding5.displayName = 'OnBoarding5';

export default OnBoarding5;