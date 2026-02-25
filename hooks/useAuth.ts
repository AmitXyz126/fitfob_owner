import { useMutation } from '@tanstack/react-query';
import {
  forgotResendOtpApi,
  forgotSendOtpApi,
  forgotVerifyOtpApi,
  loginUserApi,
  resendOtpApi,
  resetPasswordApi,
  signupStep1Api,
  verifyOtpApi,
} from '@/api/authApi';
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export const useSignupRequest = () => {
  return useMutation({
    mutationFn: signupStep1Api,
    onError: (error: any) => {
      console.error('❌ Signup Error:', error.response?.data || error.message);
    },
  });
};

export const useResendOtp = () => {
  return useMutation({
    mutationFn: resendOtpApi, 
    onSuccess: (data) => {
      console.log('✅ OTP Resent Successfully:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: 'A new code has been sent to your email.',
        position: 'top',
        visibilityTime: 4000,
      });
    },
    onError: (error: any) => {
      const errorMsg = error.response?.data?.error?.message || 'Failed to resend OTP.';
      console.error('❌ Resend OTP Error:', errorMsg);
      Toast.show({
        type: 'error',
        text1: 'Request Failed',
        text2: errorMsg,
        position: 'top',
      });
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

        Toast.show({
          type: 'success',
          text1: 'Verification Success ✅',
          text2: 'Welcome to the app!',
        });

        console.log('🚀 User Data Saved. Redirecting to Dashboard...');

        router.replace('/(tabs)');
      } else {
        console.warn('⚠️ API Success but missing fields in response:', data);

        router.replace('/auth/Login');
      }
    },
    onError: (error: any) => {
      const errorData = error.response?.data;
      const msg = errorData?.error?.message || errorData?.message || 'Verification Failed';

      console.error('❌ OTP Verify Error:', msg);

      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: msg,
      });
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

export const useForgotSendOtp = () => {
  return useMutation({
    mutationFn: forgotSendOtpApi,
    onSuccess: (data) => {
      console.log('✅ Forgot Password OTP Sent:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: 'Check your email for the recovery code.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Failed to send OTP';
      console.error('❌ Forgot OTP Error:', msg);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

export const useForgotResendOtp = () => {
  return useMutation({
    mutationFn: forgotResendOtpApi,
    onSuccess: (data) => {
      console.log('✅ Forgot Password OTP Resent:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: 'A new code has been sent to your email.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Failed to resend OTP';
      console.error('❌ Forgot Resend OTP Error:', msg);
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};

// verify
export const useForgotVerifyOtp = () => {
  return useMutation<any, any, { identifier: string; otp: string }>({
    mutationFn: forgotVerifyOtpApi,
    onSuccess: (data) => {
      console.log('✅ Forgot OTP Verified:', data);
      Toast.show({
        type: 'success',
        text1: 'OTP Verified! ✅',
        text2: 'Set your new password now.',
      });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error?.message || 'Invalid OTP code';
      Toast.show({ type: 'error', text1: 'Verification Failed', text2: msg });
    },
  });
};
//  set password
export const useResetPassword = () => {
  const router = useRouter();
  return useMutation({
    mutationFn: resetPasswordApi,
    onSuccess: (data) => {
      console.log('✅ Password Reset Success:', data);
      Toast.show({ type: 'success', text1: 'Password Changed Successfully!' });
      router.replace('/auth/Login');
    },
    onError: (error: any) => {
      console.log('❌ BACKEND FULL ERROR:', JSON.stringify(error.response?.data, null, 2));

      const msg = error.response?.data?.error?.message || 'Unable to reset password.';
      Toast.show({ type: 'error', text1: 'Error', text2: msg });
    },
  });
};
