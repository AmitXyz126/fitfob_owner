import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
// KeyboardAwareScrollView import kiya
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

export default function OtpScreen() {
  const router = useRouter();
  const [timer, setTimer] = useState(28);
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (timer > 0) setTimer(timer - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text.length !== 0 && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const isOtpComplete = otp.every((digit) => digit !== '');

  return (
    <Container>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 ">
          {/* Header */}
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

          {/* Text Section */}
          <View className="mt-12 items-center">
            <Text
              className="px-4 text-center text-base leading-6 text-slate-400"
              style={{ fontFamily: 'PlusJakartaSans-Medium' }}>
              Please enter the code we just sent to{'\n'}
              <Text className="font-bold text-slate-900">xyztest@gmail.com</Text> to proceed
            </Text>
          </View>

          {/* OTP Input Section */}
          <View className="mt-10 flex-row justify-between">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                className={`h-14 w-14 rounded-lg border border-[#E5E7EB] text-center font-bold text-xl text-slate-900 ${
                  digit ? 'border-[#F6163C]' : 'border-slate-100 '
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

          {/* Resend Section */}
          <View className="mt-10 flex-row items-center justify-center">
            <Text className="text-sm text-slate-400">Didn&apos;t receive OTP? </Text>
            <TouchableOpacity disabled={timer > 0} onPress={() => setTimer(28)}>
              <Text
                className={`font-bold text-sm ${timer > 0 ? 'text-slate-300' : 'text-[#F6163C]'}`}>
                Resend OTP {timer > 0 && `in (00:${timer < 10 ? `0${timer}` : timer})`}
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mb-4 mt-auto pt-10">
            <Button
              title="Continue"
              onPress={() => router.push('/onBoardingScreen/OnBoardingStep')}
              disabled={!isOtpComplete}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}
