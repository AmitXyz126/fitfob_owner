/* eslint-disable react/no-unescaped-entities */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ActivityIndicator } from 'react-native'; 
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { LinearGradient } from 'expo-linear-gradient';

// Validation Imports
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLoginRequest } from '@/hooks/useAuth';
import Toast from 'react-native-toast-message';

// 1. Validation Schema
const loginSchema = z.object({
  identifier: z.string().min(1, 'Email/Phone is required').email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const loginMutation = useLoginRequest(); 
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);  

  // Loading state shortcut
  const isLoading = loginMutation.isPending;

  // 2. Form Hook Setup
  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '' },
  });

 

const onSubmit = (data: LoginFormData) => {
  loginMutation.mutate(data, {
    onSuccess: (response) => {
      Toast.show({
        type: 'success',
        text1: 'Login Successful',
        text2: 'Welcome back! 👋',
      });
      router.replace('/onBoardingScreen/OnBoardingStep');
    },
    onError: (error: any) => {
      const serverMsg = error?.response?.data?.error?.message || "Something went wrong";
      const status = error?.response?.status;

      // 1.  incorrect password
      if (status === 401 || serverMsg.toLowerCase().includes("password")) {
        setError('password', { 
          type: 'manual', 
          message: 'Incorrect password! Please try again.' 
        });
        Toast.show({
          type: 'error',
          text1: 'Authentication Failed',
          text2: 'The password you entered is incorrect. 🔑',
        });
      } 
      
    
      else if (status === 404 || serverMsg.toLowerCase().includes("user") || serverMsg.toLowerCase().includes("identifier")) {
        setError('identifier', { 
          type: 'manual', 
          message: 'Email/Phone is not registered. Please sign up first.' 
        });
        Toast.show({
          type: 'error',
          text1: 'User Not Found',
          text2: 'Please check your email or sign up. ✉️',
        });
      } 
      
      // 3. Generic Error (Network/Server Down)
      else {
        Toast.show({
          type: 'error',
          text1: 'Connection Error',
          text2: serverMsg,
        });
      }
    },
  });
};

  return (
    <Container>
      {/* --- FULL SCREEN LOADING OVERLAY --- */}
      {isLoading && (
        <View 
          className="absolute inset-0 z-50 items-center justify-center" 
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
        >
          <View className="items-center justify-center p-8 bg-white rounded-3xl  border border-[#CCCECE]">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-lg text-slate-900">Logging In</Text>
            <Text className="text-slate-400 mt-1">Authenticating your account...</Text>
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
         pointerEvents={isLoading ? 'none' : 'auto'}
        contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        
        {/* Header Section */}
        <View className="mt-12 items-center">
          <Image
            source={require('../../assets/images/Vector.png')}
            className="h-[54px] w-[54px]"
            resizeMode="contain"
          />
          <Text className="font-bold text-4xl text-darkText">Welcome Back</Text>
          <Text className="mt-2 text-center font-medium text-sm text-secondaryText">
            Please login to your account!
          </Text>
        </View>

        <View className="mt-10 space-y-5">
          {/* Identifier Field */}
          <View>
            <Text className="mb-2 ml-1 text-sm text-secondaryText">Email or Phone number</Text>
            <Controller
              control={control}
              name="identifier"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`h-14 justify-center rounded-2xl border ${errors.identifier ? 'border-red-500' : 'border-border'} bg-white px-4 `}>
                  <TextInput
                    placeholder="Email or Phone number"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full text-darkText"
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              )}
            />
            {errors.identifier && <Text className="ml-1 mt-1 text-xs text-red-500">{errors.identifier.message}</Text>}
          </View>

          {/* Password Field */}
          <View>
            <Text className="mb-2 ml-1 mt-3 text-sm text-secondaryText">Password</Text>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View className={`h-14 flex-row items-center rounded-2xl border ${errors.password ? 'border-red-500' : 'border-border'} bg-white px-4 `}>
                  <TextInput
                    placeholder="*******"
                    secureTextEntry={!isPasswordVisible}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    editable={!isLoading}
                    className="h-full flex-1 text-darkText"
                  />
                  <TouchableOpacity disabled={isLoading} onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                    <Ionicons name={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'} size={20} color="#6B7280" />
                  </TouchableOpacity>
                </View>
              )}
            />
            {errors.password && <Text className="ml-1 mt-1 text-xs text-red-500">{errors.password.message}</Text>}
          </View>

          {/* Remember Me & Forgot Password Row */}
          <View className="flex-row items-center justify-between px-1 mt-3">
            <TouchableOpacity 
              disabled={isLoading}
              onPress={() => setRememberMe(!rememberMe)} 
              className="flex-row items-center"
            >
              <View className={`h-5 w-5 rounded border items-center justify-center ${rememberMe ? 'bg-[#F6163C] border-[#F6163C]' : 'border-slate-300'}`}>
                {rememberMe && <Ionicons name="checkmark" size={14} color="white" />}
              </View>
              <Text className="ml-2 text-sm text-secondaryText font-medium">Remember me</Text>
            </TouchableOpacity>

            <TouchableOpacity disabled={isLoading} onPress={() => router.push('/auth/ForgotPasswordScreen')}>
              <Text className="font-bold text-primary text-sm">Forgot Password?</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Action Button */}
        <View className="mt-8">
          <Button
            className="rounded-xl"
            title="Login"
            onPress={handleSubmit(onSubmit)}
            disabled={isLoading}
          />
        </View>

        {/* Divider */}
        <View className="mb-2 mt-8 flex-row items-center px-4">
          <LinearGradient colors={['rgba(0,0,0,0)', '#000000']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1.5, flex: 1 }} />
          <Text className="mx-2 font-medium text-xs text-darkText">OR</Text>
          <LinearGradient colors={['#000000', 'rgba(0,0,0,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ height: 1.5, flex: 1 }} />
        </View>

        {/* Social Buttons */}
        <View className="mb-6 flex-row justify-between mt-2">
            <TouchableOpacity disabled={isLoading} className="h-14 flex-[0.47] items-center justify-center rounded-2xl bg-[#F2F2F2]">
              <Image source={require('../../assets/images/Google.png')} className="h-6 w-6" />
            </TouchableOpacity>
            <TouchableOpacity disabled={isLoading} className="h-14 flex-[0.47] items-center justify-center rounded-2xl bg-[#F2F2F2]">
              <Image source={require('../../assets/images/Facebook.png')} className="h-6 w-6" />
            </TouchableOpacity>
        </View>

        {/* Footer */}
        <View className="flex-row justify-center pb-6">
          <Text className="text-secondaryText">Don't have an account?{' '}</Text>
          <TouchableOpacity disabled={isLoading} onPress={() => router.push('/auth/SignUp')}>
            <Text className="font-bold text-primary">Sign Up</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}