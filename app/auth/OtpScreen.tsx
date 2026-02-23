import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { useVerifyOtp } from '@/hooks/useAuth';

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const verifyMutation = useVerifyOtp();

  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer(timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const newOtp = [...otp];
    newOtp[index] = cleanText;
    setOtp(newOtp);

    if (cleanText.length !== 0 && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  const handleVerify = () => {
    console.log("DEBUG: Email from params:", handleVerify);
    const otpString = otp.join('');

    if (otpString.length < 6) return;

    // Email check safe handling
    if (!email) {
      Alert.alert("Error", "Email not found. Please go back and try again.");
      return;
    }

    const finalPayload = {
      identifier: (email as string).toLowerCase().trim(),
      otp: otpString.trim(),
    };
    console.log('🚀 Mutating with:', finalPayload);

    verifyMutation.mutate(finalPayload, {
      onSuccess: (data) => {
        console.log('✅ Screen Level Success:', data);
       },
      onError: (err: any) => {
         const msg = err.response?.data?.error?.message || 'Verification Failed. Please check your OTP.';
        Alert.alert("Error", msg);
      },
    });
  };

  const handleResend = () => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
     Alert.alert('Success', 'New OTP sent to your email!');
  };

  return (
    <Container>
      {/* ---LOADING OVERLAY --- */}
      {verifyMutation.isPending && (
        <View
          className="absolute inset-0 z-50 items-center justify-center"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}>
          <View className="items-center justify-center rounded-3xl border border-slate-50 bg-white p-8 shadow-xl">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-lg text-slate-900">Verifying...</Text>
          </View>
        </View>
      )}

      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 ">
          <View className="mt-4 flex-row items-center justify-between">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center ">
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
            <Text
              className="font-bold text-lg text-slate-900"
              style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              OTP Verification
            </Text>
            <View className="w-10" />
          </View>

          <View className="mt-12 items-center">
            <Text
              className="px-4 text-center text-base leading-6 text-slate-400"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              Please enter the code we just sent to{'\n'}
              <Text className="font-bold text-slate-900">{email || 'your email'}</Text> to proceed
            </Text>
          </View>

          <View className="mt-10 flex-row justify-between px-2">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className={`h-14 w-12 rounded-lg border text-center font-bold text-xl text-slate-900 ${
                  digit ? 'border-[#F6163C]' : 'border-slate-200'
                }`}
                style={{ textAlignVertical: 'center' }}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View className="mt-10 flex-row items-center justify-center">
            <Text className="text-sm text-slate-400">Didn&apos;t receive OTP? </Text>
            <TouchableOpacity disabled={timer > 0} onPress={handleResend}>
              <Text
                className={`font-bold text-sm ${timer > 0 ? 'text-slate-300' : 'text-[#F6163C]'}`}>
                Resend OTP {timer > 0 && `in (00:${timer < 10 ? `0${timer}` : timer})`}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4 mt-auto pt-10">
            <Button
              title={verifyMutation.isPending ? 'Verifying...' : 'Continue'}
              onPress={handleVerify}
              disabled={!isOtpComplete || verifyMutation.isPending}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}