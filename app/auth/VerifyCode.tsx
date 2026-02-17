/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
 import { Button } from '@/components/Button';
import { Container } from '@/components/Container';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

export default function OtpScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams();

  const [timer, setTimer] = useState(60);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
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
    if (isOtpComplete) {
       router.push('/auth/CreateNewPassword'); 
    }
  };

  const handleResend = () => {
    setTimer(60);
    setOtp(['', '', '', '', '', '']);
  };

  return (
    <Container>
      <KeyboardAwareScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 ">
          <View className="mt-6">
            <Text className="font-bold text-[32px] leading-tight text-slate-900">
              Check You Email
            </Text>
            <Text className="mt-3 text-base leading-6 text-slate-400">
              We sent a reset link to{' '}
              <Text className="font-semibold text-[#F6163C]">{email || 'xyztest@gmail.com'}</Text>
              {'\n'}
              enter 6 digit code that mentioned in the email
            </Text>
          </View>

          <View className="mt-6 mb-4 flex-row justify-between">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => { inputRefs.current[index] = ref; }}
                className={`h-14 w-[14%] rounded-[10px] border bg-white text-center font-bold text-xl text-slate-900 ${
                  focusedIndex === index || digit ? 'border-[#F6163C]' : 'border-slate-200'
                }`}
                onFocus={() => setFocusedIndex(index)}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                autoFocus={index === 0}
              />
            ))}
          </View>

          <View className="mb-2">
            <Button
              title="Verify Code"
              onPress={handleVerify}
              disabled={!isOtpComplete}
            />
          </View>

          <View className="flex-row justify-center">
            <Text className="text-sm text-slate-400">Haven't got the email yet? </Text>
            <TouchableOpacity disabled={timer > 0} onPress={handleResend}>
              <Text className={`font-bold text-sm ${timer > 0 ? 'text-slate-300' : 'text-[#F6163C]'}`}>
                Resend email {timer > 0 && `(00:${timer < 10 ? `0${timer}` : timer})`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAwareScrollView>
    </Container>
  );
}