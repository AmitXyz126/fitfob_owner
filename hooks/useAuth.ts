import { useMutation } from '@tanstack/react-query';
import { loginUserApi, signupStep1Api, verifyOtpApi } from '@/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';

export const useSignupRequest = () => {
  return useMutation({
    mutationFn: signupStep1Api,
    onError: (error: any) => {
      console.error('❌ Signup Error:', error.response?.data || error.message);
    },
  });
};

export const useVerifyOtp = () => {
  const { setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (data) => {
      if (data && data.jwt && data.user) {
        console.log('✅ OTP Verified. Finalizing User Session...');

        const userWithToken = {
          ...data.user,
          token: data.jwt,
        };

        setUser(userWithToken, true);

        console.log('🚀 User Data Saved. Redirecting to Dashboard...');
        router.replace('/auth/Login');
      } else {
        console.warn('⚠️ API Success but missing fields in response:', data);
      }
    },
    onError: (error: any) => {
      console.error('❌ OTP Verify Error:', error.response?.data || error.message);
    },
  });
};

export const useLoginRequest = () => {
  const { setUser } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: loginUserApi,
    onSuccess: (data) => {
      if (data && data.jwt && data.user) {
        console.log('✅ Login Success:', data.user.username);

        const userWithToken = {
          ...data.user,
          token: data.jwt,
        };

        setUser(userWithToken, true);
        router.replace('/(tabs)');
      }
    },
    onError: (error: any) => {
      console.error('❌ Login Error:', error.response?.data || error.message);
    },
  });
};
