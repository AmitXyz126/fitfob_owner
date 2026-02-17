 import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

// 1. Validation Schema
const newPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type NewPasswordData = z.infer<typeof newPasswordSchema>;

export default function CreateNewPassword() {
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPasswordData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = (data: NewPasswordData) => {
    console.log('🚀 Password Reset Success:', data.password);
    router.push('/auth/Login');
  };

  return (
    <Container>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1">
          {/* Header Section as per Image */}
          <View className="mt-8">
            <Text className="font-bold text-[32px] leading-tight text-[#1C1C1C]">
              Create A New{'\n'}Password
            </Text>
            <Text className="mt-3 text-base text-[#697281]">
              Enter a new password and try not to forget it.
            </Text>
          </View>

          {/* Input Section */}
          <View className="mt-10 gap-y-6">
            {/* New Password Field */}
            <View>
              <Text className="mb-2 ml-1 font-medium text-sm text-[#697281]">Set New Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${errors.password ? 'border-red-500' : 'border-slate-200'} bg-white px-4`}>
                    <TextInput
                      placeholder="********"
                      secureTextEntry={!showPass}
                      className="flex-1 text-base text-slate-900"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                      <Ionicons
                        name={showPass ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#697281"
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
              <Text className="mb-2 ml-1 font-medium text-sm text-[#697281]">Confirm Password</Text>
              <Controller
                control={control}
                name="confirmPassword"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View
                    className={`h-14 flex-row items-center rounded-2xl border ${errors.confirmPassword ? 'border-red-500' : 'border-slate-200'} bg-white px-4`}>
                    <TextInput
                      placeholder="********"
                      secureTextEntry={!showConfirmPass}
                      className="flex-1 text-base text-slate-900"
                      onChangeText={onChange}
                      onBlur={onBlur}
                      value={value}
                    />
                    <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                      <Ionicons
                        name={showConfirmPass ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color="#697281"
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

          <View className="flex-1" />

          {/* Continue Button */}
          <View className="mb-6">
            <Button title="Continue" onPress={handleSubmit(onSubmit)} />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
