import React, { useState } from 'react';
import { View, Text, TextInput, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import Toast from 'react-native-toast-message';
import { Ionicons } from '@expo/vector-icons';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  password: z.string().min(6, 'New password must be at least 6 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: ChangePasswordFormData) => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      Toast.show({
        type: 'success',
        text1: 'Password Updated (Design Mode) ✅',
        text2: 'Your password was mock-updated successfully.',
      });
      router.back();
    }, 1200);
  };

  return (
    <Container>
      {/* Loading Overlay */}
      {isPending && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
          <ActivityIndicator size="large" color="#F6163C" />
        </View>
      )}

      {/* Header */}
      <View className="relative mb-4 flex-row items-center py-4">
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute left-0 z-10 p-2 h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
          <Ionicons name="chevron-back" size={20} color="black" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-center font-medium font-sans text-base text-[#697281]">
            Change Password
          </Text>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="flex-1 px-2">
          {/* Title Section */}
          <View className="mt-4">
            <Text
              className="text-3xl font-bold text-slate-900"
              style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              Create New Password
            </Text>
            <Text
              className="mt-2 text-sm text-slate-400"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              Please enter your current password and pick a new secure password.
            </Text>
          </View>

          {/* Form Fields */}
          <View className="mt-8 gap-5">
            {/* Current Password */}
            <View>
              <Text className="mb-2 ml-1 text-sm text-slate-400 font-medium">
                Current Password
              </Text>
              <Controller
                control={control}
                name="currentPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${
                      errors.currentPassword ? 'border-red-500' : 'border-slate-200'
                    } bg-white px-4`}>
                    <TextInput
                      placeholder="Enter current password"
                      placeholderTextColor="#CBD5E1"
                      secureTextEntry={!showCurrent}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 h-full text-slate-900 text-base"
                      autoCapitalize="none"
                      editable={!isPending}
                    />
                    <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} className="p-1">
                      <Ionicons
                        name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.currentPassword && (
                <Text className="ml-1 mt-1 text-xs text-red-500">
                  {errors.currentPassword.message}
                </Text>
              )}
            </View>

            {/* New Password */}
            <View>
              <Text className="mb-2 ml-1 text-sm text-slate-400 font-medium">
                New Password
              </Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${
                      errors.password ? 'border-red-500' : 'border-slate-200'
                    } bg-white px-4`}>
                    <TextInput
                      placeholder="Minimum 6 characters"
                      placeholderTextColor="#CBD5E1"
                      secureTextEntry={!showNew}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 h-full text-slate-900 text-base"
                      autoCapitalize="none"
                      editable={!isPending}
                    />
                    <TouchableOpacity onPress={() => setShowNew(!showNew)} className="p-1">
                      <Ionicons
                        name={showNew ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  </View>
                )}
              />
              {errors.password && (
                <Text className="ml-1 mt-1 text-xs text-red-500">
                  {errors.password.message}
                </Text>
              )}
            </View>

            {/* Confirm New Password */}
            <View>
              <Text className="mb-2 ml-1 text-sm text-slate-400 font-medium">
                Confirm New Password
              </Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${
                      errors.confirmPassword ? 'border-red-500' : 'border-slate-200'
                    } bg-white px-4`}>
                    <TextInput
                      placeholder="Repeat new password"
                      placeholderTextColor="#CBD5E1"
                      secureTextEntry={!showConfirm}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                      className="flex-1 h-full text-slate-900 text-base"
                      autoCapitalize="none"
                      editable={!isPending}
                    />
                    <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} className="p-1">
                      <Ionicons
                        name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                        size={20}
                        color="#64748B"
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

          {/* Spacer */}
          <View className="flex-1" />

          {/* Action Button */}
          <View className="mb-6 mt-10">
            <Button
              title={isPending ? 'Updating...' : 'Update Password'}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
