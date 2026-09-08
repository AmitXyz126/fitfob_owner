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
} from 'react-native';
import { Image as ImageIconLucide, Plus as PlusIcon, X as XIcon } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useUserDetail } from '@/hooks/useUserDetail';

interface Props {
  initialData?: any;
}

const OnBoarding5 = forwardRef<any, Props>((props, ref) => {
  const { initialData } = props;
  const [images, setImages] = useState<(string | null)[]>(Array(6).fill(null));
  const [descriptions, setDescriptions] = useState<string[]>(Array(6).fill(''));
  const [showMore, setShowMore] = useState(false);

  const { submitStep7 } = useUserDetail();
  const isLoading = submitStep7.isPending;

  // Effect to populate images and descriptions from initialData (userData)
  useEffect(() => {
    const existingPhotos =
      initialData?.clubPhotos ||
      initialData?.data?.clubPhotos ||
      initialData?.pendingClubOwner?.clubPhotos ||
      [];

    if (existingPhotos.length > 0) {
      const newImages = [...Array(6).fill(null)];
      const newDescriptions = [...Array(6).fill('')];
      let hasMoreThan4 = false;

      existingPhotos.forEach((photo: any, index: number) => {
        if (index < 6) {
          newImages[index] = photo.url || photo.uri || photo;
          newDescriptions[index] = photo.description || photo.caption || photo.title || '';
          if (index >= 4 && newImages[index]) {
            hasMoreThan4 = true;
          }
        }
      });

      setImages(newImages);
      setDescriptions(newDescriptions);
      if (hasMoreThan4) {
        setShowMore(true);
      }
    }
  }, [initialData]);

  useImperativeHandle(ref, () => ({
    handleUpload: async () => {
      return await handleUploadLogic();
    },
    getPhotosData: () => {
      return images
        .map((uri, index) => ({
          uri,
          description: descriptions[index] || '',
        }))
        .filter((item) => !!item.uri);
    },
  }));

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

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = [...images];
      newImages[index] = result.assets[0].uri;
      setImages(newImages);
    }
  };

  const removePhoto = (index: number) => {
    const newImages = [...images];
    newImages[index] = null;
    setImages(newImages);

    const newDescriptions = [...descriptions];
    newDescriptions[index] = '';
    setDescriptions(newDescriptions);
  };

  const handleDescriptionChange = (index: number, text: string) => {
    const newDescriptions = [...descriptions];
    newDescriptions[index] = text;
    setDescriptions(newDescriptions);
  };

  const handleUploadLogic = async () => {
    const hasAnyPhoto = images.some((img) => !!img);

    if (!hasAnyPhoto) {
      Alert.alert('Wait', 'Please select at least one photo!');
      return false;
    }

    const selectedPhotos = images
      .map((uri, index) => {
        if (!uri) return null;

        if (uri.startsWith('http')) return null;

        return {
          uri,
          name: `club_photo_${index}_${Date.now()}.jpg`,
          type: 'image/jpeg',
          description: descriptions[index]?.trim() || '',
        };
      })
      .filter((item): item is { uri: string; name: string; type: string; description: string } => item !== null);

    if (selectedPhotos.length > 0) {
      try {
        await submitStep7.mutateAsync(selectedPhotos);
        return true;
      } catch (error) {
        console.error('Error uploading photos:', error);
        return false;
      }
    } else {
      router.replace('/ReviewStatusScreen');
      return true;
    }
  };

  const visibleCount = showMore ? 6 : 4;
  const visibleImages = images.slice(0, visibleCount);

  return (
    <View className="flex-1 bg-white">
      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-white/50">
          <ActivityIndicator size="large" color="#F6163C" />
        </View>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
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
              className="mb-4 w-[48%] rounded-[20px] border border-slate-100 bg-[#F8FAFC] p-2.5">
              {/* Image Preview / Upload Box */}
              <View className="h-28 w-full overflow-hidden rounded-[15px]">
                {imgUri ? (
                  <View className="relative h-full w-full bg-slate-100">
                    <Image source={{ uri: imgUri }} className="h-full w-full" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => removePhoto(index)}
                      activeOpacity={0.8}
                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5">
                      <XIcon size={12} color="white" strokeWidth={3} />
                    </TouchableOpacity>
                    <View className="absolute bottom-1.5 left-2 rounded-full bg-black/45 px-2 py-0.5">
                      <Text className="text-[10px] font-semibold text-white">Photo #{index + 1}</Text>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => pickImage(index)}
                    activeOpacity={0.6}
                    className="h-full w-full items-center justify-center rounded-[15px] border border-dashed border-slate-200 bg-white">
                    <ImageIconLucide size={28} color="#cbd5e1" strokeWidth={1.5} />
                    <View className="absolute bottom-2 right-2 rounded-full border border-slate-100 bg-slate-50 p-1">
                      <PlusIcon size={10} color="#94a3b8" strokeWidth={3} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>

              {/* Clean Caption Input with Pencil Icon */}
              <View
                className={`mt-2.5 h-9 flex-row items-center rounded-xl border px-2.5 ${
                  imgUri ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-100/50'
                }`}>
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
                  editable={!!imgUri}
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
            className="mb-4 w-full flex-row items-center justify-center rounded-2xl border border-dashed border-red-200 bg-red-50/50 py-3.5">
            <Ionicons name="add-circle-outline" size={17} color="#F6163C" />
            <Text className="ml-2 font-bold text-xs text-[#F6163C]">
              + Show More (+2 Photos)
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={() => setShowMore(false)}
            activeOpacity={0.7}
            className="mb-4 w-full flex-row items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-2.5">
            <Ionicons name="chevron-up-outline" size={16} color="#64748B" />
            <Text className="ml-1.5 font-semibold text-xs text-slate-600">
              Show Less
            </Text>
          </TouchableOpacity>
        )}

        <View className="mt-2">
          <Text className="mb-3 font-bold text-[16px] text-slate-800">Tips for high quality photos</Text>
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
    </View>
  );
});

OnBoarding5.displayName = 'OnBoarding5';

export default OnBoarding5;