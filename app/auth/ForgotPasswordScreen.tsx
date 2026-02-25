import React from 'react';
import { View, Text, TextInput, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
 import { useForgotSendOtp } from '@/hooks/useAuth';

 const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

type ForgotFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  // --- ADDED: Mutation Hook ---
  const { mutate: sendOtp, isPending } = useForgotSendOtp();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ForgotFormData) => {
    // --- FIXED: Hook call with proper navigation on success ---
    sendOtp(
      { identifier: data.email.toLowerCase().trim() }, 
      {
        onSuccess: () => {
          router.push({
            pathname: '/auth/VerifyCode',  
            params: { email: data.email.toLowerCase().trim() }
          });
        },
      }
    );
  };

  return (
    <Container>
      {/* --- LOADING OVERLAY --- */}
      {isPending && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}>
          <ActivityIndicator size="large" color="#F6163C" />
        </View>
      )}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 ">
          {/* Title Section */}
          <View className="mt-8">
            <Text 
              className="text-4xl font-bold text-slate-900"
              style={{ fontFamily: 'PlusJakartaSans-Bold' }}
            >
              Forgot Password
            </Text>
            <Text 
              className="mt-3 text-base text-slate-400"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}
            >
              Please enter your email to reset the password
            </Text>
          </View>

          {/* Input Section */}
          <View className="mt-10">
            <Text className="mb-2 ml-1 text-sm text-slate-400 font-medium">
              Email Address
            </Text>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View 
                  className={`h-14 justify-center rounded-2xl border ${
                    errors.email ? 'border-red-500' : 'border-slate-200'
                  } bg-white px-4`}
                >
                  <TextInput
                    placeholder="xyztest@gmail.com"
                    placeholderTextColor="#CBD5E1"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    className="h-full text-slate-900 text-base"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!isPending} 
                  />
                </View>
              )}
            />
            {errors.email && (
              <Text className="ml-1 mt-1 text-xs text-red-500">
                {errors.email.message}
              </Text>
            )}
          </View>

          {/* Spacer - pushes button to bottom */}
          <View className="flex-1" />

          {/* Action Button */}
          <View className="mb-6">
            <Button
              title={isPending ? "Sending..." : "Reset Password"}
              onPress={handleSubmit(onSubmit)}
              disabled={isPending}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}