import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/Button';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';

export default function ReviewStatusScreen() {
  const { user, setUser } = useAuthStore();
  const isVerified = user?.isVerified;

  const refreshStatus = async () => {
    try {
      const response = await fetch('YOUR_PROFILE_API', {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      const data = await response.json();

      // ✅ Update store
      await setUser({
        ...data.user,
        token: user?.token,
      });

      if (data.user.isVerified) {
        router.push('/(tabs)');
      }
    } catch (error) {
      console.log('Refresh failed', error);
    }
  };

  useEffect(() => {
    if (isVerified) {
      router.push('/(tabs)');
    }
  }, [isVerified]);

  return (
    <Container style={{ flex: 1 }}>
      {/* Back Button */}
      <TouchableOpacity
        className="ml-2 mt-5 w-10 p-2"
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/auth/Login');
          }
        }}
        activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={24} color="#CBD5E1" />
      </TouchableOpacity>

      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center font-bold font-sans text-[24px] leading-8 text-[#1C1C1C]">
          We’re reviewing your submission
        </Text>

        <Text className="mt-2 text-center font-sans text-[12px] font-normal leading-6 text-slate-500">
          We need more time to verify your identity. This may be due to your document requiring
          manual review or delays with our third-party partner. We’ll update you once the review is
          complete.
        </Text>

        <Image
          className="mt-3"
          source={require('../assets/images/submission.png')}
          style={{ width: 124, height: 124 }}
          resizeMode="contain"
        />
      </View>

      <View className="mb-6">
        <TouchableOpacity
          onPress={() => router.replace('/auth/Login')}
          activeOpacity={0.8}
          className="h-16 w-full items-center justify-center rounded-2xl bg-[#F6163C]">
          <Text className="font-bold text-[16px] text-white">Done</Text>
        </TouchableOpacity>
      </View>
    </Container>
  );
}
