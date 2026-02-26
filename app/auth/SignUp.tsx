/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { ResponseType } from 'expo-auth-session';
import { useSignupRequest } from '@/hooks/useAuth';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Toast from 'react-native-toast-message';
import zxcvbn from 'zxcvbn';

WebBrowser.maybeCompleteAuthSession();

// --- Backend Style Validation Logic ---
const validatePasswordSecurity = (identifier: string, password: string): string | null => {
  const lowerPassword = password.toLowerCase();

  // 1. Extract base identifier
  let base = identifier;
  if (identifier.includes('@')) {
    base = identifier.split('@')[0];
  } else {
    // Phone case last 6 digits
    base = identifier.replace(/\D/g, '').slice(-6);
  }

  const lowerBase = base.toLowerCase();

  /* Rule 1: Full match */
  if (lowerBase && lowerPassword.includes(lowerBase)) {
    return 'Password should not contain your email/phone name.';
  }

  /* Rule 2: 4+ character similarity (Consecutive string check) */
  if (lowerBase.length >= 4) {
    for (let i = 0; i <= lowerBase.length - 4; i++) {
      const sub = lowerBase.substring(i, i + 4);
      if (lowerPassword.includes(sub)) {
        return 'Password too similar to your identifier.';
      }
    }
  }

  /* Rule 3: Strong password policy (Regex) */
  const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  if (!strongRegex.test(password)) {
    return 'Password must contain uppercase, lowercase, number and special character (min 8 chars).';
  }

  /* Rule 4: Entropy check (Strength score) */
  const strength = zxcvbn(password);
  if (strength.score < 3) {
    return 'Weak password. Please choose a stronger one.';
  }

  return null;
};

// --- Zod Schema ---
const signupSchema = z
  .object({
    identifier: z
      .string()
      .min(1, 'Email or Phone is required')
      .refine((val) => {
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
        const isPhone = /^\+?[0-9]{10,15}$/.test(val);
        return isEmail || isPhone;
      }, 'Please enter a valid email or phone number'),
    password: z.string().min(1, 'Password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .superRefine((data, ctx) => {
    // Confirm Password match
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Passwords don't match",
        path: ['confirmPassword'],
      });
    }

    // New Advanced Security Validation
    const securityError = validatePasswordSecurity(data.identifier, data.password);
    if (securityError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: securityError,
        path: ['password'],
      });
    }
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUp() {
  const router = useRouter();
  const { mutate: signupMutation, isPending } = useSignupRequest();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // Social Auth Hooks (Existing)
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1026944446347-4gpshovr4kn56afecqsevj7o0assovht.apps.googleusercontent.com',
  });
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: '2349725998870415',
    responseType: ResponseType.Token,
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { identifier: '', password: '', confirmPassword: '' },
  });

  const isLoading = isPending;

  const onSubmit = (data: SignupFormData) => {
    const payload = {
      identifier: data.identifier.toLowerCase().trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: 'Client',
    };

    signupMutation(payload, {
      onSuccess: (responseData: any) => {
        console.log('Backend Response:', responseData);

        const token = responseData?.signupToken || responseData?.data?.signupToken;

        if (!token) {
          Toast.show({
            type: 'error',
            text1: 'Critical Error',
            text2: 'Token not received. Check Console.',
          });
          return;
        }

        Toast.show({
          type: 'success',
          text1: 'OTP Sent!',
          text2: responseData?.message || responseData?.data?.message || 'Check your email/phone.',
        });

        router.push({
          pathname: '/auth/OtpScreen',
          params: {
            email: payload.identifier,
            signupToken: token,
          },
        });
      },
      onError: (error: any) => {
        console.log('Signup Error Detail:', error?.response?.data || error.message);
        const msg = error?.response?.data?.message || error?.message;
        Toast.show({ type: 'error', text1: 'Signup Failed', text2: msg });
      },
    });
  };

  return (
    <Container>
      {isLoading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-white/80">
          <View className="items-center justify-center rounded-3xl border border-[#CCCECE] bg-white p-8">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-lg text-slate-900">Creating Account</Text>
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="mt-12 items-center">
          <Image
            source={require('../../assets/images/Vector.png')}
            className="h-[54px] w-[54px]"
            resizeMode="contain"
          />
          <Text className="font-bold text-4xl text-darkText">Sign up</Text>
        </View>

        <View className="mt-10 space-y-5">
          {/* Identifier Field */}
          <View>
            <Text className="mb-2 ml-1 text-sm text-secondaryText">Email or Phone number</Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 justify-center rounded-2xl border ${errors.identifier ? 'border-red-500' : 'border-border'} bg-white px-4`}>
                  <TextInput
                    placeholder="Email or Phone number"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            {errors.identifier && (
              <Text className="ml-1 mt-1 text-xs text-red-500">{errors.identifier.message}</Text>
            )}
          </View>

          {/* Password Field */}
          <View>
            <Text className="mb-2 ml-1 mt-2 text-sm text-secondaryText">Set Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 flex-row items-center rounded-2xl border ${errors.password ? 'border-red-500' : 'border-border'} bg-white px-4`}>
                  <TextInput
                    placeholder="*******"
                    secureTextEntry={!isPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="flex-1"
                  />
                  <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons
                      name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && (
              <Text className="ml-1 mt-1 text-xs text-red-500">{errors.password.message}</Text>
            )}
          </View>

          {/* Confirm Password Field */}
          <View>
            <Text className="mb-2 ml-1 mt-2 text-sm text-secondaryText">Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 flex-row items-center rounded-2xl border ${errors.confirmPassword ? 'border-red-500' : 'border-border'} bg-white px-4`}>
                  <TextInput
                    placeholder="*******"
                    secureTextEntry={!isConfirmPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="flex-1"
                  />
                  <TouchableOpacity
                    onPress={() => setIsConfirmPasswordVisible(!isConfirmPasswordVisible)}>
                    <Ionicons
                      name={isConfirmPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#6B7280"
                    />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.confirmPassword && (
              <Text className="ml-1 mt-1 text-xs text-red-500">
                {errors.confirmPassword.message}
              </Text>
            )}
          </View>
        </View>

        <Button
          className="mt-8 rounded-xl"
          title="Create Account"
          onPress={handleSubmit(onSubmit)}
          disabled={isLoading}
        />

        {/* Footer Links & Social (Same as before) */}
        <View className="mb-2 mt-8 flex-row items-center px-4">
          <LinearGradient
            colors={['transparent', '#000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
          <Text className="mx-2 font-medium text-xs text-darkText">OR</Text>
          <LinearGradient
            colors={['#000', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
        </View>

        <View className="mb-6 mt-2 flex-row justify-between">
          <TouchableOpacity
            onPress={() => googlePromptAsync()}
            className="h-14 flex-[0.47] items-center justify-center rounded-2xl bg-[#F2F2F2]">
            <Image source={require('../../assets/images/Google.png')} className="h-6 w-6" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => fbPromptAsync()}
            className="h-14 flex-[0.47] items-center justify-center rounded-2xl bg-[#F2F2F2]">
            <Image source={require('../../assets/images/Facebook.png')} className="h-6 w-6" />
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-center pb-6">
          <Text className="text-secondaryText">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/Login')}>
            <Text className="font-bold text-primary">Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
