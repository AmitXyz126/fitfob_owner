import React, { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  Animated,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useIsFocused } from '@react-navigation/native';

export interface OnBoarding4Handle {
  openModal: () => void;
}

interface Props {
  onUploadSuccess?: (data: any) => void;
  onUploadDone?: (data: any) => void;
  onBack?: () => void;
}

const OnBoarding4 = forwardRef<OnBoarding4Handle, Props>((props, ref) => {
  const isFocused = useIsFocused();
  const { onUploadSuccess, onUploadDone, onBack } = props;
  const { uploadDoc, refetch } = useUserDetail();

  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [docName, setDocName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);

  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({
    openModal: () => {
      // Stub for legacy compat if called from parent
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
    if (isFocused && activeTab === 'camera') {
      requestPermission();
      startScanAnimation();
    }
  }, [isFocused, activeTab]);

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
        if (!docName) setDocName('Govt Document');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetCameraCapture = () => {
    setScannedData(null);
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
        type: asset.mimeType || 'image/jpeg',
      });
      setDocName(asset.fileName ? asset.fileName.split('.')[0] : 'Govt Document');
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
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleSelectSource = () => {
    Alert.alert('Choose File source', 'Select a file format from your phone:', [
      { text: 'Photo Gallery', onPress: pickImage },
      { text: 'Files / PDF', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleFinalUpload = async () => {
    const fileToUpload = activeTab === 'camera' ? scannedData : selectedFile;
    if (!docName.trim()) {
      return Alert.alert('Required', 'Please enter a document name.');
    }
    if (!fileToUpload) {
      return Alert.alert('Required', 'Please scan or select a document file.');
    }

    uploadDoc.mutate(
      { name: docName.trim(), file: fileToUpload },
      {
        onSuccess: async (data) => {
          await refetch();
          setScannedData(null);
          setSelectedFile(null);
          setDocName('');
          if (onUploadDone) onUploadDone(data);
          if (onUploadSuccess) onUploadSuccess(data);
        },
        onError: (error: any) => {
          Alert.alert('Upload Error', error.response?.data?.message || 'Failed to upload');
        },
      }
    );
  };

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-white"
      showsVerticalScrollIndicator={false}>
      {/* Title Header */}
      <View className="mb-6 flex-row items-center">
        {onBack && (
          <TouchableOpacity
            onPress={onBack}
            className="mr-3 h-10 w-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50">
            <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
          </TouchableOpacity>
        )}
        <Text className="font-bold text-[24px] text-[#1C1C1C]">Upload Govt Document</Text>
      </View>

      {/* Tabs */}
      <View className="mb-6 flex-row rounded-2xl bg-slate-100 p-1">
        <TouchableOpacity
          onPress={() => setActiveTab('camera')}
          className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
          style={activeTab === 'camera' ? styles.activeTabShadow : null}>
          <Ionicons
            name="camera-outline"
            size={18}
            color={activeTab === 'camera' ? '#F6163C' : '#64748B'}
          />
          <Text
            className={`ml-2 text-sm font-semibold ${activeTab === 'camera' ? 'text-slate-900' : 'text-slate-500'}`}>
            Camera Scanner
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('file')}
          className="flex-1 flex-row items-center justify-center rounded-xl py-3.5"
          style={activeTab === 'file' ? styles.activeTabShadow : null}>
          <Ionicons
            name="document-attach-outline"
            size={18}
            color={activeTab === 'file' ? '#F6163C' : '#64748B'}
          />
          <Text
            className={`ml-2 text-sm font-semibold ${activeTab === 'file' ? 'text-slate-900' : 'text-slate-500'}`}>
            Upload File / PDF
          </Text>
        </TouchableOpacity>
      </View>

      {/* Input Field (Document Name) */}
      <View className="mb-6">
        <Text className="mb-2 ml-1 text-sm font-semibold text-slate-500">Document Name</Text>
        <TextInput
          value={docName}
          onChangeText={setDocName}
          placeholder="e.g. Aadhar Card, License, PAN"
          placeholderTextColor="#94A3B8"
          className="h-14 w-full rounded-2xl border border-slate-100 bg-[#F8FAFC] px-5 font-semibold text-slate-900"
          editable={!uploadDoc.isPending}
        />
      </View>

      {/* Content Body Based on Tab */}
      <View className="mb-8">
        {activeTab === 'camera' ? (
          // Camera Tab
          <View className="relative h-80 w-full overflow-hidden rounded-[30px] border border-slate-100 bg-slate-900">
            {scannedData ? (
              // Scanned Preview
              <View className="flex-1">
                <Image source={{ uri: scannedData.uri }} className="flex-1" resizeMode="cover" />
                <View className="absolute inset-0 items-center justify-center" style={styles.overlayBg}>
                  <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emerald-500">
                    <Ionicons name="checkmark" size={32} color="white" />
                  </View>
                  <TouchableOpacity
                    onPress={resetCameraCapture}
                    className="rounded-full px-6 py-2 border border-white/30"
                    style={styles.retakeBtnBg}>
                    <Text className="font-bold text-sm text-white">Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : isFocused && permission?.granted ? (
              // Live Shutter Scan View
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back">
                <View className="flex-1 items-center justify-center" style={styles.shutterOverlayBg}>
                  <Animated.View
                    style={[
                      styles.scanLine,
                      {
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [-100, 100],
                            }),
                          },
                        ],
                      },
                    ]}
                  />

                  {/* Corner Targets */}
                  <View className="h-48 w-72 items-center justify-center rounded-2xl border" style={styles.targetBorderColor}>
                    <View className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#F6163C]" />
                    <View className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#F6163C]" />
                    <View className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#F6163C]" />
                    <View className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#F6163C]" />
                  </View>

                  {/* Capture Button */}
                  <TouchableOpacity
                    onPress={takePicture}
                    disabled={isCapturing}
                    activeOpacity={0.85}
                    className="absolute bottom-6 h-16 w-16 items-center justify-center rounded-full border-4 border-white"
                    style={styles.shutterBtnBg}>
                    {isCapturing ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <View className="h-11 w-11 rounded-full bg-white" />
                    )}
                  </TouchableOpacity>
                </View>
              </CameraView>
            ) : (
              // Requiring Permissions fallback
              <View className="flex-1 items-center justify-center p-6 bg-slate-950">
                <Ionicons name="camera" size={48} color="#94A3B8" />
                <Text className="mt-4 text-center text-sm font-semibold text-slate-300">
                  Camera Permission Required
                </Text>
                <TouchableOpacity
                  onPress={requestPermission}
                  className="mt-4 rounded-xl bg-[#F6163C] px-5 py-2">
                  <Text className="font-bold text-xs text-white">Grant Permission</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          // File / PDF Tab
          <View>
            {selectedFile ? (
              // Selected File Preview Card
              <View className="flex-row items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 p-5">
                <View className="flex-1 flex-row items-center">
                  <View className="items-center justify-center rounded-xl bg-white p-3 border border-slate-100">
                    <Ionicons
                      name={
                        selectedFile.type?.includes('pdf')
                          ? 'document-text'
                          : 'image'
                      }
                      size={28}
                      color="#F6163C"
                    />
                  </View>
                  <View className="ml-4 flex-1">
                    <Text className="font-bold text-[15px] text-slate-800" numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    {selectedFile.size && (
                      <Text className="mt-0.5 text-xs text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                      </Text>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-slate-100">
                  <Ionicons name="trash-outline" size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            ) : (
              // Dashed File Upload Select Box
              <TouchableOpacity
                onPress={handleSelectSource}
                activeOpacity={0.7}
                style={[styles.dashedBorderBox, { borderStyle: 'dashed' }]}
                className="h-56 items-center justify-center rounded-[30px] border-2 border-slate-200 p-6">
                <View className="h-12 w-12 items-center justify-center rounded-full mb-4" style={styles.cloudIconWrapperBg}>
                  <Ionicons name="cloud-upload" size={24} color="#F6163C" />
                </View>
                <Text className="font-bold text-base text-slate-700">Choose PDF or Image File</Text>
                <Text className="mt-1 text-center text-xs text-slate-400">
                  Browse and select from gallery or documents storage
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Main Upload Button at the bottom */}
      <View className="mt-auto pb-8">
        <TouchableOpacity
          onPress={handleFinalUpload}
          disabled={uploadDoc.isPending}
          activeOpacity={0.8}
          className="h-14 w-full flex-row items-center justify-center rounded-2xl bg-[#F6163C]"
          style={styles.uploadBtnShadow}>
          {uploadDoc.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="white" />
              <Text className="ml-2 font-bold text-[16px] text-white">Upload Document</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
});

const styles = StyleSheet.create({
  activeTabShadow: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  overlayBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  shutterOverlayBg: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  retakeBtnBg: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scanLine: {
    position: 'absolute',
    zIndex: 10,
    height: 3,
    width: '80%',
    backgroundColor: '#F6163C',
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
      },
    }),
  },
  targetBorderColor: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  shutterBtnBg: {
    backgroundColor: 'rgba(246, 22, 60, 0.1)',
  },
  dashedBorderBox: {
    backgroundColor: 'rgba(248, 250, 252, 0.5)',
  },
  cloudIconWrapperBg: {
    backgroundColor: 'rgba(246, 22, 60, 0.05)',
  },
  uploadBtnShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
});

export default OnBoarding4;
