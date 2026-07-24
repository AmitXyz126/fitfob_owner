/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/no-unescaped-entities */
import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  Vibration,
  ActivityIndicator,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Animated as RNAnimated,
  Platform,
  Switch,
} from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import apiInstance from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';

export default function CheckinsScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [status, setStatus] = useState<'success' | 'failed'>('success');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [checkinDetails, setCheckinDetails] = useState<{
    userName?: string;
    userImage?: string;
    time?: string;
    message?: string;
  } | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  // Scanning laser animation
  const scanAnim = useRef(new RNAnimated.Value(0)).current;

  const snapPoints = useMemo(() => ['50%'], []);

  // Reanimated Shared Values for High-Level Background Animations
  const orb1X = useSharedValue(0);
  const orb1Y = useSharedValue(0);
  const orb1Scale = useSharedValue(1);

  const orb2X = useSharedValue(0);
  const orb2Y = useSharedValue(0);
  const orb2Scale = useSharedValue(1);

  const orb3X = useSharedValue(0);
  const orb3Y = useSharedValue(0);

  const scannerAuraScale = useSharedValue(1);
  const scannerAuraOpacity = useSharedValue(0.5);

  const radar1Scale = useSharedValue(0.85);
  const radar1Opacity = useSharedValue(0.6);

  const radar2Scale = useSharedValue(0.85);
  const radar2Opacity = useSharedValue(0.6);

  const radar3Scale = useSharedValue(0.85);
  const radar3Opacity = useSharedValue(0.6);

  const cornerScale = useSharedValue(1);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (!scanned && !loading) {
      RNAnimated.loop(
        RNAnimated.sequence([
          RNAnimated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          RNAnimated.timing(scanAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      scanAnim.setValue(0);
    }
  }, [scanned, loading, scanAnim]);

  // Start continuous silky-smooth 60FPS background animations
  useEffect(() => {
    // Top-left Red/Coral Mesh Orb motion
    orb1X.value = withRepeat(
      withSequence(
        withTiming(35, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
        withTiming(-25, { duration: 4800, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-45, { duration: 4500, easing: Easing.inOut(Easing.quad) }),
        withTiming(30, { duration: 4000, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 4200, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    orb1Scale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 5200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 5200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Bottom-right Violet/Purple Mesh Orb motion
    orb2X.value = withRepeat(
      withSequence(
        withTiming(-40, { duration: 5000, easing: Easing.inOut(Easing.quad) }),
        withTiming(30, { duration: 4400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    orb2Y.value = withRepeat(
      withSequence(
        withTiming(40, { duration: 4800, easing: Easing.inOut(Easing.quad) }),
        withTiming(-35, { duration: 4200, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 4000, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    orb2Scale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: 6200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.95, { duration: 6200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Top-right Cyan/Blue Mesh Orb motion
    orb3X.value = withRepeat(
      withSequence(
        withTiming(25, { duration: 3600, easing: Easing.inOut(Easing.quad) }),
        withTiming(-25, { duration: 3600, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    orb3Y.value = withRepeat(
      withSequence(
        withTiming(-25, { duration: 3900, easing: Easing.inOut(Easing.quad) }),
        withTiming(25, { duration: 3900, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Scanner Backing Aura Breathing Pulse
    scannerAuraScale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.95, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );
    scannerAuraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 2400, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.35, { duration: 2400, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      true
    );

    // Radar Concentric Wave 1
    radar1Scale.value = withRepeat(
      withTiming(1.5, { duration: 2800, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );
    radar1Opacity.value = withRepeat(
      withTiming(0, { duration: 2800, easing: Easing.out(Easing.quad) }),
      -1,
      false
    );

    // Radar Concentric Wave 2 (1000ms delay)
    radar2Scale.value = withDelay(
      950,
      withRepeat(
        withTiming(1.5, { duration: 2800, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    radar2Opacity.value = withDelay(
      950,
      withRepeat(
        withTiming(0, { duration: 2800, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );

    // Radar Concentric Wave 3 (1900ms delay)
    radar3Scale.value = withDelay(
      1900,
      withRepeat(
        withTiming(1.5, { duration: 2800, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );
    radar3Opacity.value = withDelay(
      1900,
      withRepeat(
        withTiming(0, { duration: 2800, easing: Easing.out(Easing.quad) }),
        -1,
        false
      )
    );

    // Target Box Corner Brackets pulse
    cornerScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: 1100, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb1X.value },
      { translateY: orb1Y.value },
      { scale: orb1Scale.value },
    ],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb2X.value },
      { translateY: orb2Y.value },
      { scale: orb2Scale.value },
    ],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: orb3X.value },
      { translateY: orb3Y.value },
    ],
  }));

  const scannerAuraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scannerAuraScale.value }],
    opacity: scannerAuraOpacity.value,
  }));

  const radar1Style = useAnimatedStyle(() => ({
    transform: [{ scale: radar1Scale.value }],
    opacity: radar1Opacity.value,
  }));

  const radar2Style = useAnimatedStyle(() => ({
    transform: [{ scale: radar2Scale.value }],
    opacity: radar2Opacity.value,
  }));

  const radar3Style = useAnimatedStyle(() => ({
    transform: [{ scale: radar3Scale.value }],
    opacity: radar3Opacity.value,
  }));

  const cornerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cornerScale.value }],
  }));

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 205],
  });

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const formatErrorMessage = (error: any): string => {
    if (!error) return 'Invalid QR code. This scanner code is not recognized or booking has expired.';
    if (typeof error === 'string') return error;

    const errorData = error?.response?.data || error;

    if (typeof errorData === 'string') return errorData;

    if (errorData && typeof errorData === 'object') {
      if (typeof errorData.message === 'string' && errorData.message.trim()) {
        return errorData.message;
      }
      if (typeof errorData.error === 'string' && errorData.error.trim()) {
        return errorData.error;
      }
      if (errorData.error && typeof errorData.error === 'object') {
        if (typeof errorData.error.message === 'string' && errorData.error.message.trim()) {
          return errorData.error.message;
        }
        if (typeof errorData.error.name === 'string' && errorData.error.name.trim()) {
          return `${errorData.error.name}: Invalid scanner code.`;
        }
      }
      if (typeof errorData.reason === 'string' && errorData.reason.trim()) {
        return errorData.reason;
      }
      if (typeof errorData.details === 'string' && errorData.details.trim()) {
        return errorData.details;
      }
    }

    if (typeof error.message === 'string' && error.message.trim()) {
      return error.message;
    }

    return 'Invalid QR code. This scanner code is not recognized or booking has expired.';
  };

  const processCheckin = async (scannedValue: string) => {
    if (scanned || loading) return;
    setLoading(true);
    Vibration.vibrate(100);
    setErrorMessage('');

    console.log('------------------ 📲 QR SCAN INITIATED ------------------');
    console.log('RAW SCANNED DATA:', scannedValue);

    try {
      const rawVal = scannedValue.trim();
      if (!rawVal) {
        throw new Error('Invalid or empty QR code.');
      }

      let payload: any = {};
      let extractedClientId = rawVal;

      try {
        const parsed = JSON.parse(rawVal);
        console.log('PARSED QR OBJECT:', parsed);
        if (parsed && typeof parsed === 'object') {
          payload = parsed;
          extractedClientId =
            parsed.clientId ||
            parsed.client_id ||
            parsed.id ||
            parsed.checkInId ||
            parsed.checkinId ||
            parsed.userId ||
            parsed.user_id ||
            parsed.qrData ||
            parsed.code ||
            parsed.token ||
            rawVal;
        }
      } catch {
        console.log('RAW QR STRING (NON-JSON):', rawVal);
        extractedClientId = rawVal;
      }

      const finalPayload = {
        clientId: extractedClientId,
        id: extractedClientId,
        checkInId: extractedClientId,
        qrData: rawVal,
        code: extractedClientId,
        ...payload,
      };

      console.log('🚀 API ENDPOINT:', ENDPOINTS.CLIENT_CHECKIN_SCAN);
      console.log('📦 SENDING PAYLOAD:', JSON.stringify(finalPayload, null, 2));

      const response = await apiInstance.post(ENDPOINTS.CLIENT_CHECKIN_SCAN, finalPayload);

      console.log('✅ API RESPONSE STATUS:', response.status);
      console.log('📄 API RESPONSE DATA:', JSON.stringify(response.data, null, 2));

      const resData = response.data;

      // Strict validation: check if backend returned success: false or failure status even with 200 HTTP code
      const isSuccess =
        resData &&
        resData.success !== false &&
        resData.success !== 'false' &&
        resData.status !== 'failed' &&
        resData.status !== 'error' &&
        resData.valid !== false &&
        !resData.error &&
        (resData.data || resData.user || resData.client || resData.customer || resData.success === true || resData.status === 'success');

      if (!isSuccess) {
        const failMessage = formatErrorMessage(resData);
        console.log('⚠️ VALIDATION FAILED - SERVER RETURNED FAILURE MSG:', failMessage);
        throw new Error(failMessage);
      }

      const dataObj = resData?.data || resData;
      const userObj = dataObj?.user || dataObj?.client || dataObj?.customer || dataObj;

      const userName = userObj?.name || userObj?.fullName || userObj?.userName || userObj?.ownerName || 'Customer';
      const userImage = userObj?.profileImage || userObj?.avatar || userObj?.image || userObj?.logo;
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const msgStr = typeof resData?.message === 'string' ? resData.message : (typeof dataObj?.message === 'string' ? dataObj.message : `${userName} checked in successfully.`);

      setCheckinDetails({
        userName,
        userImage,
        time: timeStr,
        message: msgStr,
      });

      console.log('🎉 CHECKIN SUCCESS FOR:', userName);
      setStatus('success');
      setScanned(true);
      bottomSheetRef.current?.expand();
    } catch (error: any) {
      console.log('❌ CHECKIN API ERROR:', error?.response?.status, error?.response?.data || error?.message);
      const msg = formatErrorMessage(error);
      setErrorMessage(msg);
      setStatus('failed');
      setScanned(true);
      bottomSheetRef.current?.expand();
    } finally {
      setLoading(false);
      console.log('----------------------------------------------------------');
    }
  };

  const handleBarCodeScanned = (scanningResult: any) => {
    console.log('📷 BARCODE DETECTED RAW EVENT:', scanningResult);
    const data = typeof scanningResult === 'string' ? scanningResult : scanningResult?.data;
    if (!scanned && !loading && data) {
      processCheckin(data);
    }
  };

  const handleManualCheckin = () => {
    if (!manualId.trim() || loading) return;
    Keyboard.dismiss();
    processCheckin(manualId.trim());
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container style={{ backgroundColor: '#FAF9FC', overflow: 'hidden' }}>
        {/* HIGH-LEVEL ANIMATED BACKGROUND MESH & ORBS */}
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {/* Orb 1: Top-Left Glowing Red Mesh Blob */}
          <Animated.View style={[styles.orb, styles.orb1, orb1Style]}>
            <LinearGradient
              colors={['rgba(246, 22, 60, 0.32)', 'rgba(255, 107, 129, 0.15)', 'rgba(255, 255, 255, 0)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Orb 2: Bottom-Right Glowing Violet Mesh Blob */}
          <Animated.View style={[styles.orb, styles.orb2, orb2Style]}>
            <LinearGradient
              colors={['rgba(139, 92, 246, 0.28)', 'rgba(236, 72, 153, 0.12)', 'rgba(255, 255, 255, 0)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Orb 3: Top-Right Glowing Cyan Accent Blob */}
          <Animated.View style={[styles.orb, styles.orb3, orb3Style]}>
            <LinearGradient
              colors={['rgba(56, 189, 248, 0.25)', 'rgba(246, 22, 60, 0.08)', 'rgba(255, 255, 255, 0)']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>

          {/* Scanner Aura: Centered pulsating red glow aura */}
          <Animated.View style={[styles.scannerAura, scannerAuraStyle]}>
            <LinearGradient
              colors={['rgba(246, 22, 60, 0.28)', 'rgba(251, 113, 133, 0.08)', 'transparent']}
              style={StyleSheet.absoluteFillObject}
            />
          </Animated.View>
        </View>

        {/* Header */}
        <View className="z-50 flex-row items-center justify-between py-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-md">
            <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
          </TouchableOpacity>
          <Text className="font-bold text-lg text-slate-800">Scan QR Code</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-md">
            <Ionicons name="notifications" size={20} color="#F6163C" />
          </TouchableOpacity>
        </View>

        {/* KeyboardAwareScrollView */}
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 items-center px-2">
              {/* Gym Logo Profile Card */}
              <View style={styles.logoCard} className="mt-6 h-20 w-20 items-center justify-center ">
                <Image
                  source={require('../../assets/images/fitfob_profile.png')}
                  className="h-14 w-14 rounded-2xl"
                  resizeMode="contain"
                />
              </View>

              <Text className="mb-6 mt-4 text-center font-semibold text-slate-500 text-sm max-w-[280px]">
                Scan QR code at the gym's entrance to check in customers instantly.
              </Text>

              {/* CAMERA SCANNER WRAPPER WITH RADAR SONAR WAVE RINGS */}
              <View className="relative items-center justify-center py-2 my-2">
                {/* Concentric Pulsing Radar Sonar Waves */}
                <View style={StyleSheet.absoluteFillObject} pointerEvents="none" className="items-center justify-center">
                  <Animated.View style={[styles.radarRing, radar1Style]} />
                  <Animated.View style={[styles.radarRing, radar2Style]} />
                  <Animated.View style={[styles.radarRing, radar3Style]} />
                </View>

                {/* CAMERA SCANNER BOX */}
                <View className="relative h-[310px] w-[310px] items-center justify-center overflow-hidden rounded-[32px] bg-slate-950 shadow-2xl">
                  {permission?.granted ? (
                    <CameraView
                      facing="back"
                      onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                      barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                      enableTorch={torch}
                      style={StyleSheet.absoluteFillObject}
                    />
                  ) : (
                    <View className="items-center p-6">
                      <Ionicons name="camera-outline" size={48} color="#94A3B8" />
                      <Text className="mt-4 mb-6 text-center text-sm font-semibold text-slate-400">
                        Camera permission is required
                      </Text>
                      <TouchableOpacity
                        onPress={requestPermission}
                        className="rounded-xl bg-[#F6163C] px-5 py-2.5">
                        <Text className="font-bold text-xs text-white">Grant Permission</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* High-Tech Glowing Laser Line Overlay */}
                  {permission?.granted && !scanned && !loading && (
                    <RNAnimated.View style={[styles.laserContainer, { transform: [{ translateY }] }]}>
                      <LinearGradient
                        colors={['rgba(246, 22, 60, 0)', '#F6163C', '#FF6B81', '#F6163C', 'rgba(246, 22, 60, 0)']}
                        start={{ x: 0, y: 0.5 }}
                        end={{ x: 1, y: 0.5 }}
                        style={styles.laserGradient}
                      />
                    </RNAnimated.View>
                  )}

                  {/* Scanner Target Frame with Pulsing Glowing Corners */}
                  {permission?.granted && (
                    <View style={StyleSheet.absoluteFillObject} pointerEvents="none" className="items-center justify-center">
                      <Animated.View style={[{ width: 180, height: 180, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)' }, cornerStyle]}>
                        <View className="absolute -left-1 -top-1 h-7 w-7 rounded-tl-xl border-l-4 border-t-4 border-[#F6163C]" style={styles.cornerGlow} />
                        <View className="absolute -right-1 -top-1 h-7 w-7 rounded-tr-xl border-r-4 border-t-4 border-[#F6163C]" style={styles.cornerGlow} />
                        <View className="absolute -bottom-1 -left-1 h-7 w-7 rounded-bl-xl border-b-4 border-l-4 border-[#F6163C]" style={styles.cornerGlow} />
                        <View className="absolute -bottom-1 -right-1 h-7 w-7 rounded-br-xl border-b-4 border-r-4 border-[#F6163C]" style={styles.cornerGlow} />
                      </Animated.View>
                    </View>
                  )}

                  {/* Loading State Overlay */}
                  {loading && (
                    <View className="absolute inset-0 items-center justify-center bg-black/60">
                      <ActivityIndicator size="large" color="#F6163C" />
                      <Text className="mt-3 font-bold text-white text-sm">Verifying Ticket...</Text>
                    </View>
                  )}

                  {/* Flashlight / Torch Floating Button in Top-Right Corner */}
                  {permission?.granted && (
                    <TouchableOpacity
                      onPress={() => setTorch((prev) => !prev)}
                      activeOpacity={0.8}
                      className={`absolute top-3.5 right-3.5 z-30 h-10 w-10 items-center justify-center rounded-full border shadow-lg ${
                        torch
                          ? 'bg-[#F6163C] border-[#F6163C]'
                          : 'bg-black/60 border-white/30'
                      }`}>
                      <Ionicons
                        name={torch ? 'flash' : 'flash-off'}
                        size={20}
                        color="#FFFFFF"
                      />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Torch Toggle Pill Button below scanner viewport */}
                {permission?.granted && (
                  <TouchableOpacity
                    onPress={() => setTorch((prev) => !prev)}
                    activeOpacity={0.8}
                    className={`mt-3 flex-row items-center rounded-full px-4 py-2 border shadow-sm ${
                      torch
                        ? 'bg-[#F6163C] border-[#F6163C]'
                        : 'bg-white border-slate-200'
                    }`}>
                    <Ionicons
                      name={torch ? 'flash' : 'flash-outline'}
                      size={16}
                      color={torch ? '#FFFFFF' : '#64748B'}
                      style={{ marginRight: 6 }}
                    />
                    <Text className={`font-bold text-xs ${torch ? 'text-white' : 'text-slate-700'}`}>
                      {torch ? 'Torch ON' : 'Torch OFF'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* MANUAL ID SECTION */}
              <View className="mb-6 mt-6 w-full">
                <Text className="mb-2 ml-1 text-sm font-semibold text-slate-500">
                  Or Check In Manually
                </Text>
                <View className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-white/90 pl-4 pr-2 shadow-sm">
                  <TextInput
                    placeholder="Enter customer ID..."
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={manualId}
                    onChangeText={setManualId}
                    className="h-full flex-1 font-semibold text-slate-800 text-sm"
                  />
                  {manualId.trim().length > 0 && (
                    <TouchableOpacity
                      onPress={handleManualCheckin}
                      activeOpacity={0.85}
                      className="bg-[#F6163C] px-5 py-2.5 rounded-xl">
                      <Text className="font-bold text-xs text-white">Check In</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>

        {/* BOTTOM SHEET */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 28 }}
          onClose={() => {
            setScanned(false);
            setManualId('');
          }}>
          <BottomSheetView style={{ padding: 24, alignItems: 'center' }}>
            {status === 'success' ? (
              <View className="w-full items-center">
                {/* Pulsing Avatar Frame */}
                <View style={styles.successAvatarBorder} className="mb-4 rounded-full p-1 bg-emerald-50 border-2 border-emerald-400">
                  <Image
                    source={{ uri: checkinDetails?.userImage || 'https://i.pravatar.cc/150?u=tina' }}
                    className="h-20 w-20 rounded-full"
                    resizeMode="cover"
                  />
                </View>
                {/* User info */}
                <View className="flex-row justify-center items-center gap-1.5">
                  <Text className="font-bold text-xl text-slate-900">{checkinDetails?.userName || 'Customer'}</Text>
                  <Image
                    source={require('../../assets/images/tick.png')}
                    style={{ width: 18, height: 18 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Success Message */}
                <Text className="mt-5 text-center font-bold text-2xl text-emerald-500">
                  Check-in Successful!
                </Text>

                <Text className="mt-1 text-center text-xs font-semibold text-slate-400">
                  {checkinDetails?.message || `${checkinDetails?.userName || 'Customer'} has checked in at ${checkinDetails?.time || '9:41 AM'}`}
                </Text>

                {/* Done Button */}
                <TouchableOpacity
                  onPress={() => bottomSheetRef.current?.close()}
                  activeOpacity={0.8}
                  className="mt-8 w-full items-center justify-center rounded-2xl bg-[#F6163C] py-4">
                  <Text className="font-bold text-base text-white">Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="w-full items-center py-2">
                {/* Failed Indicator */}
                <View className="mb-4 items-center justify-center">
                  <Image
                    source={require('../../assets/images/wrong.png')}
                    style={{ width: 96, height: 96 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Fail Text */}
                <Text className="font-bold text-2xl text-red-500">
                  Check-in Failed!
                </Text>
                <Text className="mt-1 text-center text-xs font-semibold text-slate-400 max-w-[260px]">
                  {typeof errorMessage === 'string' && errorMessage.trim()
                    ? errorMessage
                    : 'Invalid QR code. This code is not recognized or booking has expired.'}
                </Text>

                {/* Done Button */}
                <TouchableOpacity
                  onPress={() => bottomSheetRef.current?.close()}
                  activeOpacity={0.8}
                  className="mt-8 w-full items-center justify-center rounded-2xl bg-[#F6163C] py-4">
                  <Text className="font-bold text-base text-white">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>
      </Container>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  orb: {
    position: 'absolute',
    borderRadius: 999,
    overflow: 'hidden',
  },
  orb1: {
    top: -50,
    left: -50,
    width: 300,
    height: 300,
  },
  orb2: {
    bottom: -30,
    right: -50,
    width: 320,
    height: 320,
  },
  orb3: {
    top: 40,
    right: -40,
    width: 220,
    height: 220,
  },
  scannerAura: {
    position: 'absolute',
    top: '26%',
    alignSelf: 'center',
    width: 360,
    height: 360,
    borderRadius: 180,
    overflow: 'hidden',
  },
  radarRing: {
    position: 'absolute',
    width: 310,
    height: 310,
    borderRadius: 155,
    borderWidth: 2,
    borderColor: 'rgba(246, 22, 60, 0.35)',
  },
  logoCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  laserContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    zIndex: 10,
  },
  laserGradient: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  cornerGlow: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 6,
      },
    }),
  },
  torchActive: {
    backgroundColor: '#EAB308',
  },
  torchInactive: {
    backgroundColor: 'rgba(246, 22, 60, 0.95)',
  },
  successAvatarBorder: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
});

