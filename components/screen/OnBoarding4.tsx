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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useIsFocused } from '@react-navigation/native';

const { height } = Dimensions.get('window');

export interface OnBoarding4Handle {
  openModal: () => void;
}

interface Props {
  onUploadSuccess?: (data: any) => void;
  onUploadDone?: (data: any) => void;
}

const OnBoarding4 = forwardRef<OnBoarding4Handle, Props>((props, ref) => {
  const isFocused = useIsFocused();
  const { onUploadSuccess, onUploadDone } = props;
  const { uploadDoc, refetch } = useUserDetail(); 

  const [showModal, setShowModal] = useState(false);
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const [scanStatus, setScanStatus] = useState<'scanning' | 'success' | 'failed'>('scanning');
  const [scannedData, setScannedData] = useState<any>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    openModal: () => {
      resetScanner();
      setShowModal(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    },
  }));

  const startScanAnimation = () => {
    scanLineAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(scanLineAnim, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  };

  useEffect(() => {
    if (isFocused) {
      requestPermission();
      startScanAnimation();
    }
  }, [isFocused]);

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (photo) {
        setScannedData({
          uri: photo.uri,
          name: `camera_${Date.now()}.jpg`,
          type: 'image/jpeg',
        });
        setScanStatus('success');
        if (!docName) setDocName('Govt Document');
      }
    } catch (error) {
      setScanStatus('failed');
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetScanner = () => {
    setScanStatus('scanning');
    setScannedData(null);
    setSelectedFile(null);
    setDocName('');
    startScanAnimation();
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is needed to upload photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });
      setDocName(asset.fileName ? asset.fileName.split('.')[0] : 'Govt Document');
      setScanStatus('success');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled) {
        const file = result.assets[0];
        setSelectedFile(file);
        setDocName(file.name.split('.')[0]);
        setScanStatus('success');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleSelectSource = () => {
    Alert.alert('Select Document', 'Choose where to pick your document from:', [
      { text: 'Photo Gallery', onPress: pickImage },
      { text: 'Files / PDF', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleFinalUpload = async () => {
    const fileToUpload = selectedFile || scannedData;
    if (!docName || !fileToUpload) {
      return Alert.alert('Wait', 'Please enter a document name and capture/select a file.');
    }

    uploadDoc.mutate(
      { name: docName, file: fileToUpload },
      {
        onSuccess: async (data) => {
      
          await refetch();
    
          if (showModal) closeModal();
          resetScanner();
          // 3. Parent screen ko update karo
          if (onUploadDone) onUploadDone(data);
          if (onUploadSuccess) onUploadSuccess(data);
        },
        onError: (error: any) => {
          Alert.alert('Upload Error', error.response?.data?.message || 'Failed to upload');
        },
      }
    );
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
      setShowModal(false);
      resetScanner();
    });
  };

  return (
    <View className="flex-1 bg-white">
      <Text className="mb-6 font-bold text-2xl text-[#1C1C1C]">Add Govt Document</Text>

      <View
        className={`relative h-80 w-full overflow-hidden rounded-[30px] border-2 shadow-md ${scanStatus === 'failed' ? 'border-red-200' : 'border-gray-100'}`}>
        {scanStatus === 'success' && (scannedData?.uri || selectedFile?.uri) ? (
          <View className="flex-1">
            <Image
              source={{ uri: scannedData?.uri || selectedFile?.uri }}
              className="flex-1"
              resizeMode="cover"
            />
            <View className="absolute inset-0 items-center justify-center bg-black/20">
              <Ionicons name="checkmark-circle" size={60} color="#10B981" />
            </View>
          </View>
        ) : isFocused && permission?.granted ? (
          <CameraView
            key={isFocused ? 'active' : 'inactive'}
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back">
            <View
              className={`flex-1 items-center justify-center ${scanStatus === 'failed' ? 'bg-red-900/40' : 'bg-black/30'}`}>
              {scanStatus === 'scanning' && (
                <>
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
                  <TouchableOpacity
                    onPress={takePicture}
                    disabled={isCapturing}
                    className="absolute bottom-6 h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-black/20">
                    <View className="h-12 w-12 rounded-full bg-white/90" />
                  </TouchableOpacity>
                </>
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
                {scanStatus === 'failed' && (
                  <TouchableOpacity onPress={resetScanner} className="items-center">
                    <Ionicons name="alert-circle-outline" size={54} color="#ef4444" />
                    <Text className="mt-2 font-bold text-white">Retry</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </CameraView>
        ) : (
          <View className="flex-1 items-center justify-center bg-gray-100">
            <ActivityIndicator color="#F6163C" />
            <Text className="mt-2 text-gray-500">Initializing Camera...</Text>
          </View>
        )}
      </View>

      <View
        className={`mt-8 rounded-[30px] border p-6 ${scanStatus === 'failed' ? 'border-red-100 bg-red-50' : 'border-gray-100 bg-gray-50'}`}>
        <View className="mb-4 flex-row items-center justify-between">
          <Text className="font-semibold text-xs text-gray-400">Document Info</Text>
          {scanStatus === 'success' && (
            <TouchableOpacity onPress={resetScanner}>
              <Text className="font-bold text-xs text-[#F6163C]">Retake / Clear</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="space-y-3">
          <View className="flex-row items-end justify-between">
            <View className="flex-1">
              <Text className="text-[11px] text-gray-400">Document Name</Text>
              <TextInput
                value={docName}
                onChangeText={setDocName}
                placeholder="e.g. Aadhar Card"
                placeholderTextColor="#9CA3AF"
                className="mt-1 p-0 font-semibold text-base text-black"
                editable={!uploadDoc.isPending}
              />
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
          <TouchableOpacity onPress={handleSelectSource} className="flex-row items-center">
            <Ionicons name="folder-open-outline" size={16} color="#6B7280" />
            <Text className="ml-2 font-medium text-gray-500">
              {selectedFile ? 'File Selected' : 'Or select from phone storage'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal animationType="none" transparent visible={showModal} onRequestClose={closeModal}>
        <View className="flex-1 justify-end">
          <Animated.View style={{ opacity: fadeAnim }} className="absolute inset-0 bg-black/50">
            <Pressable className="flex-1" onPress={closeModal} />
          </Animated.View>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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
              <View className="mb-4 items-center">
                <View className="h-1.5 w-12 rounded-full bg-gray-300" />
              </View>
              <Text className="mb-6 font-bold text-xl text-black">Manual File Upload</Text>
              <Text className="mb-2 text-sm font-normal text-[#697281]">Document Name</Text>
              <TextInput
                placeholder="Enter document name"
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
                  onPress={handleSelectSource}
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
                  onPress={closeModal}>
                  <Text className="font-bold text-lg text-gray-600">Cancel</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
});

export default OnBoarding4;
