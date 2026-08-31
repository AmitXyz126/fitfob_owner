import  { useState, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
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
import { useAuthStore } from '@/store/useAuthStore';
import { useRouter } from 'expo-router';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

export interface OnBoarding4Handle {
  openModal: () => void;
}

interface Props {
  onUploadSuccess?: (data: any) => void;
  onUploadDone?: (data: any) => void;
  onBack?: () => void;
}

const OnBoarding4 = forwardRef<OnBoarding4Handle, Props>((props, ref) => {
  const router = useRouter();
  const isFocused = useIsFocused();
  const { onUploadSuccess, onUploadDone, onBack } = props;
  const { uploadDoc, refetch } = useUserDetail();

  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [docName, setDocName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
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
        const fileObj = {
          id: `${Date.now()}_${Math.random()}`,
          uri: photo.uri,
          name: `camera_${Date.now()}.jpg`,
          type: 'image/jpeg',
          docName: docName.trim() || `Scanned Document ${selectedFiles.length + 1}`,
        };
        setSelectedFiles((prev) => [...prev, fileObj]);
        setScannedData(fileObj);
        setDocName('');
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
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      const newFiles = result.assets.map((asset, idx) => ({
        id: `${Date.now()}_${idx}_${Math.random()}`,
        uri: asset.uri,
        name: asset.fileName || `photo_${Date.now()}_${idx + 1}.jpg`,
        type: asset.mimeType || 'image/jpeg',
        size: asset.fileSize,
        docName: docName.trim()
          ? result.assets.length === 1
            ? docName.trim()
            : `${docName.trim()} ${idx + 1}`
          : asset.fileName
          ? asset.fileName.split('.')[0]
          : `Govt Document ${selectedFiles.length + idx + 1}`,
      }));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
      setDocName('');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const newFiles = result.assets.map((file, idx) => ({
          id: `${Date.now()}_${idx}_${Math.random()}`,
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/pdf',
          size: file.size,
          docName: docName.trim()
            ? result.assets.length === 1
              ? docName.trim()
              : `${docName.trim()} ${idx + 1}`
            : file.name
            ? file.name.split('.')[0]
            : `Govt Document ${selectedFiles.length + idx + 1}`,
        }));
        setSelectedFiles((prev) => [...prev, ...newFiles]);
        setDocName('');
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

  const removeFile = (id: string) => {
    setSelectedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const updateFileDocName = (id: string, text: string) => {
    setSelectedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, docName: text } : item))
    );
  };

  const handleFinalUpload = async () => {
    if (selectedFiles.length === 0) {
      return Alert.alert('Required', 'Please scan or select at least one document file.');
    }

    for (let i = 0; i < selectedFiles.length; i++) {
      if (!selectedFiles[i].docName || !selectedFiles[i].docName.trim()) {
        return Alert.alert(
          'Required',
          `Please enter a document name for file #${i + 1} (${selectedFiles[i].name})`
        );
      }
    }

    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        setUploadingIndex(i + 1);
        const item = selectedFiles[i];
        await uploadDoc.mutateAsync({
          name: item.docName.trim(),
          file: {
            uri: item.uri,
            name: item.name,
            type: item.type,
          },
        });
      }

      await refetch();
      setScannedData(null);
      setSelectedFiles([]);
      setDocName('');
      setUploadingIndex(null);
      if (onUploadDone) onUploadDone(null);
      if (onUploadSuccess) onUploadSuccess(null);
    } catch (error: any) {
      setUploadingIndex(null);
      Alert.alert(
        'Upload Error',
        error.response?.data?.message || error.message || 'Failed to upload document(s)'
      );
    }
  };

  const isUploading = uploadingIndex !== null || uploadDoc.isPending;

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      className="bg-white"
      showsVerticalScrollIndicator={false}>
      {/* Title Header */}
      <View className="mb-6 flex-row items-center justify-between">
        <Text className="font-bold text-[24px] text-[#1C1C1C]">Upload Govt Document</Text>
        {selectedFiles.length > 0 && (
          <View className="rounded-full bg-red-50 px-3 py-1 border border-red-100">
            <Text className="font-bold text-xs text-[#F6163C]">
              {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'} Selected
            </Text>
          </View>
        )}
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

      {/* Default Document Name Input (used for new selections) */}
      {selectedFiles.length === 0 && (
        <View className="mb-6">
          <Text className="mb-2 ml-1 text-sm font-semibold text-slate-500">Document Name</Text>
          <TextInput
            value={docName}
            onChangeText={setDocName}
            placeholder="e.g. Aadhar Card, License, PAN"
            placeholderTextColor="#94A3B8"
            className="h-14 w-full rounded-2xl border border-slate-100 bg-[#F8FAFC] px-5 font-semibold text-slate-900"
            editable={!isUploading}
          />
        </View>
      )}

      {/* Content Body Based on Tab */}
      <View className="mb-6">
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
                    <Text className="font-bold text-sm text-white">Scan Another Photo</Text>
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
            <TouchableOpacity
              onPress={handleSelectSource}
              activeOpacity={0.7}
              style={[styles.dashedBorderBox, { borderStyle: 'dashed' }]}
              className="h-44 items-center justify-center rounded-[30px] border-2 border-slate-200 p-6">
              <View className="h-12 w-12 items-center justify-center rounded-full mb-2" style={styles.cloudIconWrapperBg}>
                <Ionicons name="cloud-upload" size={24} color="#F6163C" />
              </View>
              <Text className="font-bold text-base text-slate-700">
                {selectedFiles.length > 0 ? 'Select More PDF or Image Files' : 'Choose PDF or Image Files'}
              </Text>
              <Text className="mt-1 text-center text-xs text-slate-400">
                Select one or multiple files from gallery or storage
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-bold text-slate-800 text-base">Selected Documents to Upload</Text>
            <TouchableOpacity onPress={handleSelectSource} activeOpacity={0.7}>
              <Text className="font-bold text-xs text-[#F6163C]">+ Add More</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {selectedFiles.map((file, idx) => (
              <View
                key={file.id || idx}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center">
                    <View className="items-center justify-center rounded-xl bg-white p-2.5 border border-slate-100">
                      <Ionicons
                        name={file.type?.includes('pdf') ? 'document-text' : 'image'}
                        size={24}
                        color="#F6163C"
                      />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-slate-700 text-xs" numberOfLines={1}>
                        {file.name}
                      </Text>
                      {file.size && (
                        <Text className="text-[10px] text-slate-400">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFile(file.id)}
                    disabled={isUploading}
                    className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-slate-200/60">
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                {/* Editable Document Name for this file */}
                <View className="mt-3">
                  <Text className="text-[11px] font-semibold text-slate-400 mb-1">
                    Document Name #{idx + 1}
                  </Text>
                  <TextInput
                    value={file.docName}
                    onChangeText={(text) => updateFileDocName(file.id, text)}
                    placeholder="e.g. Aadhar Card, GST, License"
                    placeholderTextColor="#94A3B8"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900"
                    editable={!isUploading}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Main Upload Button at the bottom */}
      <View className="mt-auto pb-8">
        <TouchableOpacity
          onPress={handleFinalUpload}
          disabled={isUploading}
          activeOpacity={0.8}
          className={`h-14 w-full flex-row items-center justify-center rounded-2xl ${
            isUploading ? 'bg-slate-400' : 'bg-[#F6163C]'
          }`}
          style={styles.uploadBtnShadow}>
          {isUploading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" />
              <Text className="ml-3 font-bold text-[15px] text-white">
                {uploadingIndex
                  ? `Uploading ${uploadingIndex} of ${selectedFiles.length}...`
                  : 'Uploading...'}
              </Text>
            </View>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={20} color="white" />
              <Text className="ml-2 font-bold text-[16px] text-white">
                {selectedFiles.length <= 1
                  ? 'Upload Document'
                  : `Upload ${selectedFiles.length} Documents`}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View className="mt-5 flex-row items-center my-2">
          <LinearGradient
            colors={['transparent', '#F6163C']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, height: 1.5 }}
          />
          <View className="px-3 flex-row items-center">
            <TouchableOpacity
              onPress={async () => {
                try {
                  await useAuthStore.getState().logOut();
                } catch (e) {
                  console.log(e);
                } finally {
                  router.replace('/auth/Login');
                }
              }}
              activeOpacity={0.7}
              className="px-1 py-0.5">
              <Text className="text-xs font-bold text-[#F6163C]">Log In</Text>
            </TouchableOpacity>
            <Text className="mx-1.5 text-slate-300">|</Text>
            <TouchableOpacity
              onPress={async () => {
                try {
                  await useAuthStore.getState().logOut();
                } catch (e) {
                  console.log(e);
                } finally {
                  router.replace('/auth/SignUp');
                }
              }}
              activeOpacity={0.7}
              className="px-1 py-0.5">
              <Text className="text-xs font-bold text-[#F6163C]">Sign Up</Text>
            </TouchableOpacity>
          </View>
          <LinearGradient
            colors={['#F6163C', 'transparent']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ flex: 1, height: 1.5 }}
          />
        </View>
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
