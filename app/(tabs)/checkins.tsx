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
} from 'react-native';
import { Container } from '@/components/Container';
import { Ionicons } from '@expo/vector-icons';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { KeyboardAwareScrollView } from '@pietile-native-kit/keyboard-aware-scrollview';

export default function CheckinsScreen() {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [status, setStatus] = useState<'success' | 'failed'>('success');
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [torch, setTorch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [manualId, setManualId] = useState('');

  const snapPoints = useMemo(() => ['50%'], []);

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission]);

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Container>
        <View className="z-50 flex-row items-center justify-between ">
          <TouchableOpacity onPress={() => Keyboard.dismiss()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text className="font-bold text-xl text-darkText">Scan QR Code</Text>
          <TouchableOpacity className="">
            <Ionicons name="notifications" size={20} color="#F6163C" />
          </TouchableOpacity>
        </View>

        {/*  KeyboardAwareScrollView */}
        <KeyboardAwareScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View className="flex-1 items-center">
              <Image
                source={require('../../assets/images/scanIcon.png')}
                className="mt-10 h-[64px] w-[64px]"
                resizeMode="contain"
              />

              <Text className="mb-7  mt-10 text-center font-medium text-secondaryText">
                Scan code at the gym's entrance to check in.
              </Text>

              {/* CAMERA SCANNER BOX */}
              <View className="relative h-[340px] w-[340px] items-center justify-center overflow-hidden rounded-[20px] border-2 border-dashed border-gray-400 ">
                {permission?.granted ? (
                  <CameraView
                    onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                    barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                    enableTorch={torch}
                    style={StyleSheet.absoluteFillObject}
                  />
                ) : (
                  <View className="items-center ">
                    <Text className="mb-4 text-center text-white">
                      Camera permission is required
                    </Text>
                    <TouchableOpacity
                      onPress={requestPermission}
                      className="rounded-xl bg-primary px-4 py-2">
                      <Text className="font-bold text-white">Grant</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {loading && (
                  <View className="absolute inset-0 items-center justify-center bg-black/70">
                    <ActivityIndicator size="large" color="#F6163C" />
                    <Text className="mt-3 font-bold text-white">Verifying...</Text>
                  </View>
                )}

                {/* Torch Toggle */}
                <TouchableOpacity
                  onPress={() => setTorch(!torch)}
                  className={`absolute bottom-6 flex-row items-center rounded-full border border-white/30 py-1 pl-1 pr-3 ${torch ? 'bg-yellow-500' : 'bg-[#F6163C]'}`}>
                  <View className="h-8 w-8 items-center justify-center rounded-full bg-white">
                    <Ionicons name="flash" size={16} color={torch ? '#EAB308' : '#F6163C'} />
                  </View>
                  <Text className="ml-2 font-bold text-xs text-white">{torch ? 'ON' : '01'}</Text>
                </TouchableOpacity>
              </View>

              {/* MANUAL ID SECTION */}
              <View className="mb-10 mt-12 w-full">
                <Text className="mb-2 ml-1 font-sans text-sm font-normal text-secondaryText">
                  Use ID
                </Text>
                <View className="h-14 flex-row items-center justify-between rounded-2xl border border-[#E5E7EB] bg-white px-4 ">
                  <TextInput
                    placeholder="Enter ID:"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={manualId}
                    onChangeText={setManualId}
                    className="h-full flex-1 font-medium "
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAwareScrollView>

        {/* BOTTOM SHEET (Outside ScrollView) */}
        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          enablePanDownToClose
          backdropComponent={renderBackdrop}
          backgroundStyle={{ borderRadius: 20 }}
          onClose={() => setScanned(false)}>
          <BottomSheetView style={{ padding: 32, alignItems: 'center' }}>
            {status === 'success' ? (
              <View className="w-full items-center py-2">
                {/* User Profile Image */}
                <Image
                  source={{ uri: 'https://i.pravatar.cc/150?u=tina' }}
                  className="mb-4 h-24 w-24 rounded-[6px]"
                  resizeMode="cover"
                />

                {/* Name and Blue/Green Tick Row */}
                <View className="flex-row justify-center gap-1">
                  <Text className="font-bold text-xl text-slate-900">Amit Singh</Text>
                  <Image
                    source={require('../../assets/images/tick.png')}
                    style={{ width: 16, height: 16 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Success Message */}
                <Text className="mt-8 text-center font-bold text-2xl text-[#00C94F]">
                  Check-in Successful!
                </Text>

                <Text className="mt-1 text-xs font-normal text-[#697281]">
                  Tina Sharma har checked in at 9:41 AM
                </Text>

                {/* Done Button */}
                <TouchableOpacity
                  onPress={() => bottomSheetRef.current?.close()}
                  activeOpacity={0.8}
                  className="mt-10 w-full items-center rounded-2xl bg-[#F6163C] py-4  ">
                  <Text className="font-bold text-lg text-white">Done</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="w-full items-center  py-6">
                {/* Check-in Failed Icon/Image */}
                <View className="mb-6 h-32 w-32 items-center justify-center">
                  <Image
                    source={require('../../assets/images/wrong.png')}
                    style={{ width: 120, height: 120 }}
                    resizeMode="contain"
                  />
                </View>

                {/* Text Section */}
                <Text className="font-bold font-sans text-2xl text-[#FC383A]">
                  Check-in Failed!
                </Text>
                <Text className="mt-1 text-center font-sans text-xs font-normal text-[#697281]">
                  invalid OR code. Please try again
                </Text>

                <TouchableOpacity
                  onPress={() => bottomSheetRef.current?.close()}
                  activeOpacity={0.8}
                  className="mt-5 w-full items-center rounded-2xl bg-[#F6163C] py-4 ">
                  <Text className="font-bold text-lg text-white">Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>
      </Container>
    </GestureHandlerRootView>
  );
}
