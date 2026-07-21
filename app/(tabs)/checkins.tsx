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
  Animated,
  Platform,
} from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';
import { router } from 'expo-router';

export default function CheckinsScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [status, setStatus] = useState<'success' | 'failed'>('success');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  // Scanning laser animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  const snapPoints = useMemo(() => ['50%'], []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

  useEffect(() => {
    if (!scanned && !loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
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

  const translateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 290],
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

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setLoading(true);
    Vibration.vibrate(100);

    setTimeout(() => {
      setLoading(false);
      setScanned(true);
      setStatus(data && !data.toLowerCase().includes('error') ? 'success' : 'failed');
      bottomSheetRef.current?.expand();
    }, 1500);
  };

  const handleManualCheckin = () => {
    if (!manualId.trim() || loading) return;
    setLoading(true);
    Keyboard.dismiss();
    Vibration.vibrate(100);

    setTimeout(() => {
      setLoading(false);
      setScanned(true);
      setStatus(!manualId.toLowerCase().includes('error') && manualId.trim() !== '0000' ? 'success' : 'failed');
      bottomSheetRef.current?.expand();
    }, 1200);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        {/* Header */}
        <View className="z-50 flex-row items-center justify-between py-2">
          <TouchableOpacity
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
            <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
          </TouchableOpacity>
          <Text className="font-bold text-lg text-slate-800">Scan QR Code</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
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
              <View style={styles.logoCard} className="mt-8 h-18 w-18 items-center justify-center rounded-2xl bg-white border border-slate-100">
                <Image
                  source={require('../../assets/images/fitfob_profile.png')}
                  className="h-14 w-14 rounded-2xl"
                  resizeMode="contain"
                />
              </View>

              <Text className="mb-8 mt-5 text-center font-semibold text-slate-400 text-sm max-w-[280px]">
                Scan QR code at the gym's entrance to check in customers instantly.
              </Text>

              {/* CAMERA SCANNER BOX */}
              <View className="relative h-[310px] w-[310px] items-center justify-center overflow-hidden rounded-[32px] bg-slate-950">
                {permission?.granted ? (
                  <CameraView
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

                {/* Laser line overlay when active */}
                {permission?.granted && !scanned && !loading && (
                  <Animated.View style={[styles.laserLine, { transform: [{ translateY }] }]} />
                )}

                {/* Scanner Target Frame Borders */}
                {permission?.granted && (
                  <View style={StyleSheet.absoluteFillObject} pointerEvents="none" className="items-center justify-center">
                    <View className="h-44 w-44 rounded-2xl border border-white/20">
                      <View className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#F6163C]" />
                      <View className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#F6163C]" />
                      <View className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#F6163C]" />
                      <View className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#F6163C]" />
                    </View>
                  </View>
                )}

                {/* Loading State Overlay */}
                {loading && (
                  <View className="absolute inset-0 items-center justify-center bg-black/60">
                    <ActivityIndicator size="large" color="#F6163C" />
                    <Text className="mt-3 font-bold text-white text-sm">Verifying Ticket...</Text>
                  </View>
                )}

                {/* Torch Toggle Overlay */}
                {permission?.granted && (
                  <TouchableOpacity
                    onPress={() => setTorch(!torch)}
                    activeOpacity={0.8}
                    style={torch ? styles.torchActive : styles.torchInactive}
                    className="absolute bottom-4 flex-row items-center rounded-full py-1 pl-1 pr-4">
                    <View className="h-7 w-7 items-center justify-center rounded-full bg-white">
                      <Ionicons name="flash" size={14} color={torch ? '#EAB308' : '#F6163C'} />
                    </View>
                    <Text className="ml-2.5 font-bold text-[11px] text-white">
                      {torch ? 'TORCH ON' : 'TORCH OFF'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* MANUAL ID SECTION */}
              <View className="mb-16 mt-10 w-full">
                <Text className="mb-2 ml-1 text-sm font-semibold text-slate-500">
                  Or Check In Manually
                </Text>
                <View className="h-14 flex-row items-center justify-between rounded-2xl border border-slate-100 bg-white pl-4 pr-2 border-slate-200">
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
          onClose={() => setScanned(false)}>
          <BottomSheetView style={{ padding: 24, alignItems: 'center' }}>
            {status === 'success' ? (
              <View className="w-full items-center">
                {/* Pulsing Avatar Frame */}
                <View style={styles.successAvatarBorder} className="mb-4 rounded-full p-1 bg-emerald-50 border-2 border-emerald-400">
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/150?u=tina' }}
                    className="h-20 w-20 rounded-full"
                    resizeMode="cover"
                  />
                </View>
                {/* User info */}
                <View className="flex-row justify-center items-center gap-1.5">
                  <Text className="font-bold text-xl text-slate-900">Amit Singh</Text>
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
                  Amit Singh has checked in at 9:41 AM
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
                <View className="mb-4 h-24 w-24 items-center justify-center rounded-full bg-red-50 border-2 border-red-200">
                  <Image
                    source={require('../../assets/images/wrong.png')}
                    style={{ width: 72, height: 72 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Fail Text */}
                <Text className="font-bold text-2xl text-red-500">
                  Check-in Failed!
                </Text>
                <Text className="mt-1 text-center text-xs font-semibold text-slate-400 max-w-[240px]">
                  Invalid OR code or booking expired. Please check and try again.
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
  logoCard: {
    ...Platform.select({
      ios: {
        shadowColor: '#1C1C1C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  laserLine: {
    position: 'absolute',
    left: 10,
    right: 10,
    height: 3,
    backgroundColor: '#F6163C',
    zIndex: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
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
