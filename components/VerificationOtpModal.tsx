import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import api from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';
import { userDetailsApi } from '@/api/userdetailsApi';

interface VerificationOtpModalProps {
  visible: boolean;
  type: 'phone' | 'email';
  targetValue: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const VerificationOtpModal: React.FC<VerificationOtpModalProps> = ({
  visible,
  type,
  targetValue,
  onClose,
  onSuccess,
}) => {
  const insets = useSafeAreaInsets();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(120);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>([]);

  // Format seconds to mm:ss
  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins < 10 ? `0${mins}` : mins}:${secs < 10 ? `0${secs}` : secs}`;
  };

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setOtp(['', '', '', '', '', '']);
      setTimer(120);
      setErrorMessage('');
      const timerId = setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 350);
      return () => clearTimeout(timerId);
    }
  }, [visible]);

  // Countdown timer for resend
  useEffect(() => {
    let interval: any = null;
    if (visible && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [visible, timer]);

  const handleChange = (text: string, index: number) => {
    setErrorMessage('');
    const cleanText = text.replace(/[^0-9]/g, '');

    // Handle full OTP paste
    if (cleanText.length > 1) {
      const pastedOtp = cleanText.split('').slice(0, 6);
      const newOtp = [...otp];
      pastedOtp.forEach((char, i) => {
        if (index + i < 6) newOtp[index + i] = char;
      });
      setOtp(newOtp);
      const nextFocus = Math.min(index + pastedOtp.length - 1, 5);
      inputRefs.current[nextFocus]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = cleanText.slice(-1);
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

  const handleVerify = async () => {
    const otpString = otp.join('').trim();
    if (otpString.length < 6) {
      setErrorMessage('Please enter all 6 digits of the OTP.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      console.log('📡 Verifying pending OTP with payload: { otp:', otpString, '}');
      // POST /api/pending-club-owner/verify-otp with { "otp": "946542" }
      const res = await api.post(ENDPOINTS.PENDING_VERIFY_OTP, { otp: otpString });
      console.log('✅ Pending OTP Verified:', res);

      Toast.show({
        type: 'success',
        text1: 'Verification Successful! ✅',
        text2: `${type === 'phone' ? 'Phone number' : 'Email address'} verified.`,
        position: 'top',
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('❌ Verify OTP Error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Invalid or expired OTP. Please try again.';
      setErrorMessage(msg);

      // If OTP was not found or expired, unlock the resend timer so user can immediately request a new one
      if (msg.toLowerCase().includes('not found') || msg.toLowerCase().includes('expired')) {
        setTimer(0);
      }

      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: msg,
        position: 'top',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0 || isResending) return;

    setIsResending(true);
    setErrorMessage('');

    try {
      console.log('📡 [POST ' + ENDPOINTS.PENDING_RESEND_OTP + '] Resending OTP');
      // POST /api/pending-club-owner/resend-otp
      const res = await api.post(ENDPOINTS.PENDING_RESEND_OTP, {});
      console.log('✅ [PENDING_RESEND_OTP] Success:', res.data);

      Toast.show({
        type: 'success',
        text1: 'OTP Sent! 📩',
        text2: `A new 6-digit code has been sent.`,
        position: 'top',
      });

      setTimer(120);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('❌ Resend OTP Error:', error?.response?.data || error.message);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error?.message ||
        'Failed to resend OTP. Please try again.';
      setErrorMessage(msg);
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: msg,
        position: 'top',
      });
    } finally {
      setIsResending(false);
    }
  };

  const isOtpComplete = otp.every((d) => d !== '');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.55)',
          justifyContent: 'flex-end',
        }}>
        {/* Backdrop Dismiss Area - only occupies space ABOVE the bottom sheet */}
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />

        {/* Bottom Sheet Card */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 24,
          }}>
          {/* Drag Handle */}
          <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-slate-200" />

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            className="absolute right-4 top-3 h-8 w-8 items-center justify-center rounded-full bg-slate-100">
            <Ionicons name="close" size={18} color="#64748B" />
          </TouchableOpacity>

          {/* Icon Banner */}
          <View className="mb-3 items-center">
            <View className="h-13 w-13 p-3 items-center justify-center rounded-2xl bg-red-50 border border-red-100 shadow-sm">
              {type === 'phone' ? (
                <Ionicons name="chatbox-ellipses" size={26} color="#F6163C" />
              ) : (
                <MaterialCommunityIcons name="email-check-outline" size={26} color="#F6163C" />
              )}
            </View>
          </View>

          {/* Titles */}
          <View className="items-center px-2">
            <Text className="font-bold text-[20px] text-slate-900 text-center">
              Verify {type === 'phone' ? 'Phone Number' : 'Email Address'}
            </Text>
            <Text className="mt-1.5 text-center text-[13px] leading-5 text-slate-500">
              Enter the 6-digit code sent to{' '}
              <Text className="font-bold text-slate-800">
                {type === 'phone' ? `+91 ${targetValue}` : targetValue}
              </Text>
              {'\n'}
              <Text className="text-[11px] text-slate-400 font-medium">Valid for 2 minutes</Text>
            </Text>
          </View>

          {/* OTP Input Boxes */}
          <View className="my-4 flex-row justify-between px-1">
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  inputRefs.current[index] = ref;
                }}
                value={digit}
                onChangeText={(text) => handleChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                editable={!isVerifying && !isResending}
                className={`h-12 w-11 rounded-xl border text-center font-bold text-xl ${
                  digit
                    ? 'border-[#F6163C] bg-red-50/30 text-slate-900'
                    : 'border-slate-200 bg-slate-50 text-slate-900'
                }`}
              />
            ))}
          </View>

          {/* Error Message */}
          {errorMessage ? (
            <View className="mb-2 flex-row items-center justify-center px-2">
              <Ionicons name="alert-circle" size={15} color="#EF4444" style={{ marginRight: 5 }} />
              <Text className="text-center font-medium text-[12px] text-red-500">{errorMessage}</Text>
            </View>
          ) : null}

          {/* Resend Section */}
          <View className="mb-4 flex-row items-center justify-center">
            <Text className="text-[13px] text-slate-400">Didn&apos;t receive code? </Text>
            <TouchableOpacity
              disabled={timer > 0 || isResending || isVerifying}
              onPress={handleResend}
              activeOpacity={0.7}
              className="py-1">
              <Text
                className={`font-semibold text-[13px] ${
                  timer > 0 || isResending || isVerifying ? 'text-slate-300' : 'text-[#F6163C]'
                }`}>
                {isResending
                  ? 'Sending...'
                  : timer > 0
                    ? `Resend in (${formatTimer(timer)})`
                    : 'Resend OTP'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            onPress={handleVerify}
            disabled={!isOtpComplete || isVerifying}
            activeOpacity={0.8}
            className={`h-13 w-full flex-row items-center justify-center rounded-xl shadow-sm ${
              !isOtpComplete || isVerifying ? 'bg-[#FFC1C1]' : 'bg-[#F6163C]'
            }`}
            style={{ height: 50 }}>
            {isVerifying ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={19} color="white" style={{ marginRight: 6 }} />
                <Text className="font-bold text-[15px] text-white">Verify & Proceed</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

export default VerificationOtpModal;
