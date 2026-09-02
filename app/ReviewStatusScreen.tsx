import { View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { userDetailsApi } from '@/api/userdetailsApi';

export default function ReviewStatusScreen() {
  const { user, logOut } = useAuthStore();
  const { profileStatus, isFetchingStatus, refetch } = useUserDetail();
  const queryClient = useQueryClient();

  const [isChecking, setIsChecking] = useState(false);

  const checkStatusFlow = async (showToast: boolean = true) => {
    try {
      setIsChecking(true);
      // 1. Hit /api/verify-approval/verification-status endpoint
      const statusRes = await userDetailsApi.getVerificationStatus();
      
      const vStatus = statusRes?.verification_status || statusRes?.status || profileStatus?.verification_status;
      const reason = statusRes?.rejection_reason || statusRes?.reason || null;

      if (vStatus === 'approved') {
        await userDetailsApi.getMyClubOwner();
        if (showToast) {
          Toast.show({
            type: 'success',
            text1: 'Account Approved! 🎉',
            text2: 'Welcome to your dashboard.',
          });
        }
        router.replace('/(tabs)');
        return;
      }

      if (vStatus === 'rejected') {
        if (showToast) {
          Toast.show({
            type: 'error',
            text1: 'Application Rejected ❌',
            text2: reason || 'Please check the rejection reason.',
          });
        }
        router.replace({
          pathname: '/RejectRequestScreen',
          params: { reason: reason || 'Your submission did not meet verification guidelines.' },
        });
        return;
      }

      // Default: Pending / Under Review
      // Fallback check profileStatus refetch
      const res = await refetch();
      const updatedStatus = res.data;
      const approvedNow =
        updatedStatus?.isApprovedOwner === true ||
        updatedStatus?.verification_status === 'approved' ||
        updatedStatus?.status === 'approved';

      if (approvedNow) {
        await userDetailsApi.getMyClubOwner();
        if (showToast) {
          Toast.show({
            type: 'success',
            text1: 'Account Approved! 🎉',
            text2: 'Welcome to your dashboard.',
          });
        }
        router.replace('/(tabs)');
      } else if (showToast) {
        Toast.show({
          type: 'info',
          text1: 'Under Review ⏳',
          text2: 'Your account is still being reviewed by the admin team.',
        });
      }
    } catch (e: any) {
      console.log('Error checking verification status:', e);
      // Fallback check via profileStatus refetch
      try {
        const res = await refetch();
        const updatedStatus = res.data;
        if (updatedStatus?.isApprovedOwner || updatedStatus?.status === 'approved') {
          router.replace('/(tabs)');
          return;
        }
      } catch (err) {
        // ignore
      }
      if (showToast) {
        Toast.show({
          type: 'info',
          text1: 'Under Review ⏳',
          text2: 'Your profile is currently under review.',
        });
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkStatusFlow(false);
  }, []);

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

  return (
    <Container style={{ flex: 1 }}>
      {/* Header with Switch Account */}
      <View className="mt-4 flex-row items-center justify-between px-2">
        <TouchableOpacity
          className="flex-row items-center p-2"
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#64748B" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} activeOpacity={0.7} className="px-3 py-1">
          <Text className="text-xs font-bold text-[#F6163C]">Switch Account</Text>
        </TouchableOpacity>
      </View>

      {/* --- PENDING / UNDER REVIEW VIEW --- */}
      <View className="flex-1 justify-between px-6 py-4">
        <View className="flex-1 items-center justify-center">
          <Text className="text-center font-sans text-[24px] font-bold leading-8 text-[#1C1C1C]">
            We’re reviewing your submission
          </Text>

          <Text className="mt-2 text-center font-sans text-[12px] font-normal leading-6 text-slate-500">
            We need more time to verify your identity. This may be due to your document requiring
            manual review or delays with our third-party partner. We’ll update you once the review is
            complete.
          </Text>

          <Image
            className="mt-6"
            source={require('../assets/images/submission.png')}
            style={{ width: 130, height: 130 }}
            resizeMode="contain"
          />
        </View>

        <View className="mb-4">
          <TouchableOpacity
            onPress={() => checkStatusFlow(true)}
            disabled={isChecking || isFetchingStatus}
            activeOpacity={0.8}
            className="h-16 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C]">
            {isChecking || isFetchingStatus ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="font-bold text-[16px] text-white">Check Status / Open Dashboard</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Container>
  );
}
