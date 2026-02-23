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
import { GoogleAuthProvider, FacebookAuthProvider, signInWithCredential } from 'firebase/auth';
import { useSignupRequest } from '@/hooks/useAuth';

// Validation Imports
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

WebBrowser.maybeCompleteAuthSession();

const signupSchema = z
  .object({
    identifier: z.string().min(1, 'Email/Phone is required').email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignUp() {
  const router = useRouter();
  const signupMutation = useSignupRequest();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false);

  // Loading indicator shortcut
  const isLoading = signupMutation.isPending;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { identifier: '', password: '', confirmPassword: '' },
  });

  const onSubmit = (data: SignupFormData) => {
    const payload = {
      identifier: data.identifier.toLowerCase().trim(),
      password: data.password,
      confirmPassword: data.confirmPassword,
      role: 'ClubOwner', 
    };
    signupMutation.mutate(payload, {
      onSuccess: (response) => {
        router.push({
          pathname: '/auth/OtpScreen',
          params: { email: data.identifier },
        });
      },
      onError: (error: any) => {
        const serverMessage =
          error?.response?.data?.error?.message || error?.response?.data?.message || '';

        if (serverMessage.toLowerCase().includes('already exists')) {
          setError('identifier', {
            type: 'manual',
            message: 'This email is already registered',
          });
        } else {
          alert(serverMessage || 'Signup failed');
        }
      },
    });
  };

  // Social Auth Hooks
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useIdTokenAuthRequest({
    clientId: '1026944446347-4gpshovr4kn56afecqsevj7o0assovht.apps.googleusercontent.com',
  });

  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: '2349725998870415',
    responseType: ResponseType.Token,
  });

  return (
    <Container>
      {isLoading && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <View className="items-center justify-center rounded-3xl border border-[#CCCECE]  bg-white p-8">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-lg text-slate-900">Creating Account</Text>
            <Text className="mt-1 text-slate-400">Please wait a moment...</Text>
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        pointerEvents={isLoading ? 'none' : 'auto'}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View className="mt-12 items-center">
          <Image
            source={require('../../assets/images/Vector.png')}
            className="h-[54px] w-[54px]"
            resizeMode="contain"
          />
          <Text className="font-bold text-4xl text-darkText">Sign up</Text>
          <Text className="mt-2 text-center font-medium text-sm text-secondaryText">
            Create an account to continue!
          </Text>
        </View>

        <View className="mt-10 space-y-5">
          {/* Email or Phone */}
          <View>
            <Text className="mb-2 ml-1 text-sm text-secondaryText">Email or Phone number</Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 justify-center rounded-2xl border ${errors.identifier ? 'border-red-500' : 'border-border'} bg-white px-4 `}>
                  <TextInput
                    placeholder="Email or Phone number"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full text-darkText"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              )}
            />
            {errors.identifier && (
              <Text className="ml-1 mt-1 text-xs text-red-500">{errors.identifier.message}</Text>
            )}
          </View>

          {/* Password */}
          <View>
            <Text className="mb-2 ml-1 mt-2 text-sm text-secondaryText">Set Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 flex-row items-center rounded-2xl border ${errors.password ? 'border-red-500' : 'border-border'} bg-white px-4  `}>
                  <TextInput
                    placeholder="*******"
                    secureTextEntry={!isPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full flex-1 text-darkText"
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

          {/* Confirm Password */}
          <View>
            <Text className="mb-2 ml-1 mt-2 text-sm text-secondaryText">Confirm Password</Text>
            <Controller
              control={control}
              name="confirmPassword"
              render={({ field: { onChange, onBlur, value } }) => (
                <View
                  className={`h-14 flex-row items-center rounded-2xl border ${errors.confirmPassword ? 'border-red-500' : 'border-border'} bg-white px-4  `}>
                  <TextInput
                    placeholder="*******"
                    secureTextEntry={!isConfirmPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full flex-1 text-darkText"
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

        <View className="mt-8">
          <Button
            className="rounded-xl"
            title="Create Account"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          />
        </View>

        <View className="mb-2 mt-8 flex-row items-center px-4">
          <LinearGradient
            colors={['rgba(0,0,0,0)', '#000000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
          <Text className="mx-2 font-medium text-xs text-darkText">OR</Text>
          <LinearGradient
            colors={['#000000', 'rgba(0,0,0,0)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: 1.5, flex: 1 }}
          />
        </View>

        <View className="mb-6">
          <View className="mt-2 flex-row justify-between">
            <TouchableOpacity
              disabled={isLoading}
              onPress={() => googlePromptAsync()}
              className="h-14 flex-[0.47] flex-row items-center justify-center rounded-2xl bg-[#F2F2F2]">
              <Image source={require('../../assets/images/Google.png')} className="h-6 w-6" />
            </TouchableOpacity>
            <TouchableOpacity
              disabled={isLoading}
              onPress={() => fbPromptAsync()}
              className="h-14 flex-[0.47] flex-row items-center justify-center rounded-2xl bg-[#F2F2F2]">
              <Image source={require('../../assets/images/Facebook.png')} className="h-6 w-6" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="flex-row justify-center pb-6">
          <Text className="text-secondaryText">Already have an account? </Text>
          <TouchableOpacity disabled={isLoading} onPress={() => router.push('/auth/Login')}>
            <Text className="font-bold text-primary">Login</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
