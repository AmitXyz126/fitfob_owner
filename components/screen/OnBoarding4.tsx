/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUserDetail } from '@/hooks/useUserDetail';  

const { height } = Dimensions.get('window');

export interface OnBoarding4Handle {
  openModal: () => void;
}

interface Props {
  onUploadSuccess?: (data: any) => void;
  onUploadDone?: (data: any) => void;
}

const OnBoarding4 = forwardRef<OnBoarding4Handle, Props>((props, ref) => {
  const { onUploadSuccess, onUploadDone } = props;
  const { uploadDoc } = useUserDetail();  

  const [showModal, setShowModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');
  const [scannedData, setScannedData] = useState<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    openModal: () => setShowModal(true),
  }));

  const startScanning = () => {
    setScanStatus('scanning');
    setScannedData(null);
    setDocName('');

    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();

    setTimeout(() => {
      const isDetected = Math.random() > 0.3;
      if (isDetected) {
        setScanStatus('success');
        const mockFile = {
          name: 'GOVT_ID_' + Math.floor(1000 + Math.random() * 9000) + '.jpg',
          uri: 'mock_uri_here', // Real camera implementation mein yahan actual URI aayega
          status: 'Success',
        };
        setScannedData(mockFile);
        setDocName('Aadhar Card');
      } else {
        setScanStatus('failed');
      }
    }, 4000);
  };

  useEffect(() => {
    requestPermission();
    startScanning();
  }, []);

  useEffect(() => {
    if (showModal) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    }
  }, [showModal]);

  const closeModal = () => {
    return new Promise<void>((resolve) => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
        setShowModal(false);
        fadeAnim.setValue(0);
        resolve();
      });
    });
  };




  // --- UPDATED FINAL UPLOAD LOGIC WITH API ---
  const handleFinalUpload = async () => {
    if (!docName || (!selectedFile && !scannedData)) {
      return Alert.alert('Wait', 'Please ensure a document is scanned or selected.');
    }

    // API Mutation Call
    uploadDoc.mutate(
      {
        name: docName,
        file: selectedFile || scannedData, // Passing full object for multipart handling
      },
      {
        onSuccess: (data) => {
          closeModal();
          // Reset states after success
          setSelectedFile(null);
          setScannedData(null);

          if (onUploadDone) onUploadDone(data);
          if (onUploadSuccess) onUploadSuccess(data);
        },
        onError: (error: any) => {
          Alert.alert('Upload Error', error.response?.data?.message || 'Failed to upload document');
        },
      }
    );
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
      });
      if (!result.canceled) {
        setSelectedFile(result.assets[0]);
        setDocName(result.assets[0].name.split('.')[0]);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  return (
    <View className="flex-1 bg-white">
      <Text className="mb-6 font-bold text-2xl text-[#1C1C1C]">Add Govt Document</Text>

      {/* --- Scanner UI (Unchanged) --- */}
      <View
        className={`relative h-80 w-full overflow-hidden rounded-[30px] border-2 shadow-md ${scanStatus === 'failed' ? 'border-red-200' : 'border-gray-100'}`}>
        {permission?.granted ? (
          <CameraView style={StyleSheet.absoluteFill} facing="back">
            <View
              className={`flex-1 items-center justify-center ${scanStatus === 'failed' ? 'bg-red-900/40' : 'bg-black/30'}`}>
              {scanStatus === 'scanning' && (
                <Animated.View
                  style={{
                    transform: [
                      {
                        translateY: scanLineAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-80, 80],
                        }),
                      },
                    ],
                  }}
                  className="z-10 h-[3px] w-[80%] bg-[#F6163C] shadow-lg shadow-red-500"
                />
              )}
              <View className="h-44 w-64 items-center justify-center rounded-2xl">
                <View
                  className={`absolute left-0 top-0 h-8 w-8 rounded-tl-xl border-l-4 border-t-4 ${scanStatus === 'failed' ? 'border-red-500' : 'border-[#F6163C]'}`}
                />
                <View
                  className={`absolute right-0 top-0 h-8 w-8 rounded-tr-xl border-r-4 border-t-4 ${scanStatus === 'failed' ? 'border-red-500' : 'border-[#F6163C]'}`}
                />
                <View
                  className={`absolute bottom-0 left-0 h-8 w-8 rounded-bl-xl border-b-4 border-l-4 ${scanStatus === 'failed' ? 'border-red-500' : 'border-[#F6163C]'}`}
                />
                <View
                  className={`absolute bottom-0 right-0 h-8 w-8 rounded-br-xl border-b-4 border-r-4 ${scanStatus === 'failed' ? 'border-red-500' : 'border-[#F6163C]'}`}
                />
                {scanStatus === 'scanning' && (
                  <Ionicons name="scan-outline" size={48} color="white" />
                )}
                {scanStatus === 'success' && (
                  <Ionicons name="checkmark-circle" size={54} color="#10B981" />
                )}
                {scanStatus === 'failed' && (
                  <TouchableOpacity onPress={startScanning} className="items-center">
                    <Ionicons name="alert-circle-outline" size={54} color="#ef4444" />
                    <Text className="mt-2 font-bold text-white">Tap to Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text className="mt-6 px-10 text-center font-bold tracking-widest text-white">
                {scanStatus === 'scanning'
                  ? 'HOLD STEADY, SCANNING...'
                  : scanStatus === 'success'
                    ? 'SCAN COMPLETE'
                    : 'DETECTION FAILED'}
              </Text>
            </View>
          </CameraView>
        ) : (
          <ActivityIndicator color="#F6163C" className="flex-1" />
        )}
      </View>

      {/* --- Extraction Preview --- */}
      <View
        className={`mt-8 rounded-[30px] border p-6 ${scanStatus === 'failed' ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-semibold text-xs text-gray-400">Live Extraction</Text>
          {scanStatus === 'success' && (
            <Ionicons name="cloud-done-outline" size={20} color="#10B981" />
          )}
        </View>
        <View className="space-y-3">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-[11px] text-gray-400">Document Name</Text>
              <Text className="font-semibold text-base text-black">
                {scanStatus === 'success'
                  ? docName
                  : scanStatus === 'failed'
                    ? 'No Document Found'
                    : 'Analyzing Frame...'}
              </Text>
            </View>
            {scanStatus === 'success' && (
              <TouchableOpacity
                onPress={handleFinalUpload}
                disabled={uploadDoc.isPending}
                className="rounded-xl bg-[#F6163C] px-5 py-2">
                {uploadDoc.isPending ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="font-bold text-xs text-white">Upload</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
          <View className="my-1 h-[1px] w-full bg-gray-200" />
          <View>
            <Text className="text-[11px] text-gray-400">Status</Text>
            <Text
              className={`font-semibold ${scanStatus === 'success' ? 'text-green-600' : scanStatus === 'failed' ? 'text-red-600' : 'text-black'}`}>
              {uploadDoc.isPending
                ? 'Uploading to server...'
                : scanStatus === 'success'
                  ? 'Ready to Upload'
                  : scanStatus === 'failed'
                    ? 'Recognition Failed'
                    : 'Searching...'}
            </Text>
          </View>
        </View>
      </View>

      {/* --- Manual Upload Modal (Unchanged) --- */}
      <Modal
        animationType="none"
        transparent
        visible={showModal}
        onRequestClose={() => closeModal()}>
        <View className="flex-1 justify-end">
          <Animated.View style={{ opacity: fadeAnim }} className="absolute inset-0 bg-black/50">
            <Pressable className="flex-1" onPress={() => closeModal()} />
          </Animated.View>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="justify-end">
            <Animated.View
              style={{
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [height, 0],
                    }),
                  },
                ],
              }}
              className="rounded-t-3xl bg-white p-6 pb-12 shadow-2xl">
              <Pressable onPress={(e) => e.stopPropagation()}>
                <View className="mb-4 items-center">
                  <View className="h-1.5 w-12 rounded-full bg-gray-300" />
                </View>
                <Text className="mb-6 font-bold text-xl text-black">Manual File Upload</Text>
                <Text className="mb-2 text-sm font-normal text-[#697281]">Document Name</Text>
                <TextInput
                  placeholder="e.g. Aadhar Card"
                  value={docName}
                  onChangeText={setDocName}
                  className="mb-5 rounded-xl border border-gray-200 bg-gray-50/50 p-4 font-medium text-black"
                />
                <Text className="mb-2 text-sm font-normal text-[#697281]">Select File</Text>
                <View className="mb-8 flex-row items-center justify-between rounded-xl border border-gray-100 bg-gray-50/30 p-2">
                  <View className="ml-2 flex-1 flex-row items-center">
                    <Ionicons name="document-attach-outline" size={20} color="#94A3B8" />
                    <Text className="ml-2 flex-1 text-gray-500" numberOfLines={1}>
                      {selectedFile ? selectedFile.name : 'Choose from storage'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={pickDocument}
                    className="rounded-lg border border-gray-100 bg-white px-4 py-2 shadow-sm">
                    <Text className="font-bold text-gray-600">Browse</Text>
                  </TouchableOpacity>
                </View>
                <View className="flex-row gap-4">
                  <TouchableOpacity
                    disabled={uploadDoc.isPending}
                    className="flex-1 items-center rounded-2xl bg-[#F6163C] py-4 shadow-lg shadow-red-200"
                    onPress={handleFinalUpload}>
                    {uploadDoc.isPending ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-bold text-lg text-white">Upload Now</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="flex-1 items-center rounded-2xl bg-[#F2F2F2] py-4"
                    onPress={() => closeModal()}>
                    <Text className="font-bold text-lg text-gray-600">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

export default OnBoarding4;
