import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';

export default function ReviewStatusScreen() {
  const { user, logOut } = useAuthStore();
  const { profileStatus, isFetchingStatus, refetch } = useUserDetail();
  const queryClient = useQueryClient();

  const isApproved =
    profileStatus?.isApprovedOwner === true ||
    profileStatus?.verification_status === 'approved' ||
    profileStatus?.status === 'approved' ||
    user?.isVerified;

  useEffect(() => {
    if (isApproved) {
      if (router.canGoBack()) {
        router.dismissAll();
      }
      router.replace('/(tabs)');
    }
  }, [isApproved]);

  const handleLogout = async () => {
    try {
      queryClient.clear();
      await logOut();
    } catch (e) {
      console.log('Error logging out from review screen:', e);
    } finally {
      if (router.canGoBack()) {
        router.dismissAll();
      }
      router.replace('/welcome');
    }
  };

  const handleCheckStatus = async () => {
    try {
      const res = await refetch();
      const updatedStatus = res.data;
      const approvedNow =
        updatedStatus?.isApprovedOwner === true ||
        updatedStatus?.verification_status === 'approved' ||
        updatedStatus?.status === 'approved';

      if (approvedNow) {
        Toast.show({
          type: 'success',
          text1: 'Account Approved! 🎉',
          text2: 'Welcome to your dashboard.',
        });
        if (router.canGoBack()) {
          router.dismissAll();
        }
        router.replace('/(tabs)');
      } else {
        Toast.show({
          type: 'info',
          text1: 'Under Review ⏳',
          text2: 'Your account is still being reviewed by the admin team.',
        });
      }
    } catch (e) {
      console.log('Error checking status:', e);
    }
  };

  return (
    <Container style={{ flex: 1 }}>
      {/* Header with Back / Logout */}
      <View className="flex-row items-center justify-between px-2 mt-4">
        <TouchableOpacity
          className="p-2 flex-row items-center"
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#64748B" />
         
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} className="px-3 py-1">
          <Text className="text-xs font-bold text-[#F6163C]">Switch Account</Text>
        </TouchableOpacity>
      </View>

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

      <View className="mb-6 px-4">
        <TouchableOpacity
          onPress={handleCheckStatus}
          disabled={isFetchingStatus}
          activeOpacity={0.8}
          className="h-16 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C]">
          {isFetchingStatus ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="font-bold text-[16px] text-white">Check Status / Open Dashboard</Text>
          )}
        </TouchableOpacity>
      </View>
    </Container>
  );
}
