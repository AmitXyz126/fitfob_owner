import React, { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
  Linking,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';

export interface OnBoarding4Handle {
  openModal: () => void;
}

interface Props {
  onUploadSuccess?: (data: any) => void;
  onUploadDone?: (data: any) => void;
  onBack?: () => void;
}

const OnBoarding4 = forwardRef<OnBoarding4Handle, Props>((props, ref) => {
  const { onUploadSuccess, onUploadDone, onBack } = props;
  const { uploadDoc, verifyGovtDoc, refetch, documents, refetchDocs } = useUserDetail();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();

  const docList = documents?.documents || documents?.data || documents || [];

  useEffect(() => {
    refetchDocs?.();
  }, []);

  const userKey = user?.id || user?.email || 'guest';
  const STORAGE_KEY_FILES = `@onboarding_verified_files_${userKey}`;
  const STORAGE_KEY_SCANNED = `@onboarding_scanned_data_${userKey}`;
  const STORAGE_KEY_DOCNAME = `@onboarding_doc_name_${userKey}`;

  const [activeTab, setActiveTab] = useState<'camera' | 'file'>('camera');
  const [docName, setDocName] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  // Verification State
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyingMessage, setVerifyingMessage] = useState('Scanning & Verifying Document...');

  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Hands-Free Auto Document Scanner State
  const [documentDetected, setDocumentDetected] = useState<boolean>(false);
  const [containerLayout, setContainerLayout] = useState<{ width: number; height: number }>({
    width: 340,
    height: 288,
  });
  const isAutoCapturingRef = useRef<boolean>(false);

  // Document Edge Detection & Corner Indicator Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    const scan = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: 1,
          duration: 2200,
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 2200,
          useNativeDriver: true,
        }),
      ])
    );
    scan.start();

    return () => {
      pulse.stop();
      scan.stop();
    };
  }, [pulseAnim, scanLineAnim]);

  const getCleanDocUrl = (item: any) => {
    let rawUrl =
      item?.url ||
      item?.fileUrl ||
      item?.documentUrl ||
      item?.docUrl ||
      item?.filePath ||
      item?.file?.url ||
      item?.file?.fileUrl ||
      item?.file?.uri ||
      item?.uri ||
      '';

    if (
      rawUrl &&
      typeof rawUrl === 'string' &&
      !rawUrl.startsWith('http://') &&
      !rawUrl.startsWith('https://') &&
      !rawUrl.startsWith('file://') &&
      !rawUrl.startsWith('content://') &&
      !rawUrl.startsWith('data:')
    ) {
      const apiBase = process.env.EXPO_PUBLIC_API_URL || '';
      rawUrl = `${apiBase.replace(/\/+$/, '')}/${rawUrl.replace(/^\/+/, '')}`;
    }
    return rawUrl;
  };

  const getPdfSource = (url?: string) => {
    if (!url) return { uri: '' };
    const isPdf =
      url.toLowerCase().includes('.pdf') ||
      url.toLowerCase().includes('/pdf') ||
      previewDoc?.fileType?.includes('pdf');

    if (
      Platform.OS === 'android' &&
      isPdf &&
      !url.includes('docs.google.com/gview') &&
      url.startsWith('http')
    ) {
      return {
        uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(url)}`,
      };
    }
    return { uri: url };
  };

  const handleOpenExternalUrl = async (url?: string) => {
    if (!url) {
      Toast.show({
        type: 'info',
        text1: 'Document Link Unavailable',
        text2: 'No file URL available for this document.',
      });
      return;
    }
    try {
      const isPdf = url.toLowerCase().includes('.pdf');
      const targetUrl =
        Platform.OS === 'android' &&
        isPdf &&
        !url.includes('docs.google.com') &&
        url.startsWith('http')
          ? `https://docs.google.com/viewer?url=${encodeURIComponent(url)}`
          : url;

      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(targetUrl);
      } else {
        await Linking.openURL(targetUrl);
      }
    } catch (e) {
      console.log('Error opening external url:', e);
    }
  };

  const handleOpenPreview = (item: any) => {
    setPreviewDoc(item);
    setPreviewVisible(true);
  };

  useImperativeHandle(ref, () => ({
    openModal: () => { },
  }));

  // Ensure camera preview starts clean - old photos are NEVER shown in camera view
  useEffect(() => {
    setScannedData(null);
    AsyncStorage.removeItem(STORAGE_KEY_SCANNED).catch(() => {});
  }, [userKey]);

  // When already uploaded documents exist on server, keep camera & pending queue fresh
  useEffect(() => {
    if (docList.length > 0) {
      setScannedData(null);
      setSelectedFiles([]);
      setDocName('');
      AsyncStorage.removeItem(STORAGE_KEY_FILES).catch(() => {});
      AsyncStorage.removeItem(STORAGE_KEY_SCANNED).catch(() => {});
      AsyncStorage.removeItem(STORAGE_KEY_DOCNAME).catch(() => {});
    }
  }, [docList.length]);

  // Helper to verify a single document with the backend API
  const verifyFileItem = async (fileData: { uri: string; name?: string; type?: string }) => {
    const verifyRes = await verifyGovtDoc.mutateAsync(fileData);
    const data = verifyRes?.data?.valid !== undefined ? verifyRes.data : verifyRes;
    return data;
  };

  // Helper to extract clean, human-readable error text (prevents status code strings like "Request failed with status code 400")
  const getReadableErrorMessage = (err: any, fallback: string = 'Document is not properly aligned or readable'): string => {
    if (!err) return fallback;

    const resData = err?.response?.data;
    if (typeof resData === 'string' && resData.trim() && !resData.startsWith('<')) {
      return resData.trim();
    }

    if (resData && typeof resData === 'object') {
      if (typeof resData.message === 'string' && resData.message.trim()) {
        return resData.message.trim();
      }
      if (Array.isArray(resData.message) && resData.message.length > 0) {
        return resData.message.map((m: any) => (typeof m === 'string' ? m : m?.message || JSON.stringify(m))).join(', ');
      }
      if (typeof resData.error === 'string' && resData.error.trim()) {
        return resData.error.trim();
      }
      if (typeof resData.msg === 'string' && resData.msg.trim()) {
        return resData.msg.trim();
      }
      if (typeof resData.detail === 'string' && resData.detail.trim()) {
        return resData.detail.trim();
      }
      if (Array.isArray(resData.errors) && resData.errors.length > 0) {
        const first = resData.errors[0];
        if (typeof first === 'string') return first;
        if (first?.message) return first.message;
        if (first?.msg) return first.msg;
      } else if (resData.errors && typeof resData.errors === 'object') {
        const keys = Object.keys(resData.errors);
        if (keys.length > 0) {
          const val = resData.errors[keys[0]];
          if (Array.isArray(val) && val.length > 0) return String(val[0]);
          if (typeof val === 'string') return val;
        }
      }
    }

    const msg = typeof err === 'string' ? err : err?.message;
    if (msg && typeof msg === 'string') {
      const isHttpCodeMsg =
        /request failed with status code/i.test(msg) ||
        /status code \d+/i.test(msg) ||
        /network error/i.test(msg) ||
        /axios/i.test(msg);

      if (!isHttpCodeMsg && msg.trim()) {
        return msg.trim();
      }

      if (/network error/i.test(msg)) {
        return 'Please check your internet connection and try again.';
      }

      const statusCode = err?.response?.status;
      if (statusCode === 400 || statusCode === 422) {
        return 'Document is not properly aligned or valid. Please place a clear government document inside the red frame.';
      }
      if (statusCode === 413) {
        return 'Document file size is too large. Please scan again with a smaller size.';
      }
      if (statusCode === 500) {
        return 'Document verification service is temporarily unavailable. Please try again later.';
      }
    }

    return fallback;
  };

  // Hands-Free Automatic Document Capture, Background Cropping & Verification
  const autoCaptureAndCrop = async () => {
    if (!cameraRef.current || isCapturing || isVerifying || isAutoCapturingRef.current) return;

    try {
      isAutoCapturingRef.current = true;
      setIsCapturing(true);

      const photo = await cameraRef.current.takePictureAsync({ quality: 1 });
      if (!photo || !photo.uri) {
        throw new Error('Camera capture returned empty result');
      }

      setIsVerifying(true);
      setVerifyingMessage('Scanning & Cropping Document...');

      // Calculate document boundary relative to viewfinder to eliminate desk/table/background
      const cW = containerLayout.width || 340;
      const cH = containerLayout.height || 288;
      const fW = Math.round(cW * 0.78);
      const fH = Math.round(cH * 0.70);

      const pW = photo.width || 1080;
      const pH = photo.height || 1920;

      const scale = Math.max(pW / cW, pH / cH);
      const visiblePW = cW * scale;
      const visiblePH = cH * scale;
      const offsetX = (visiblePW - pW) / 2;
      const offsetY = (visiblePH - pH) / 2;

      const frameXInContainer = (cW - fW) / 2;
      const frameYInContainer = (cH - fH) / 2;

      const originX = Math.max(0, Math.round(frameXInContainer * scale - offsetX));
      const originY = Math.max(0, Math.round(frameYInContainer * scale - offsetY));
      const cropWidth = Math.min(pW - originX, Math.round(fW * scale));
      const cropHeight = Math.min(pH - originY, Math.round(fH * scale));

      // Losslessly crop out the table/background so ONLY the document remains
      const croppedImage = await manipulateAsync(
        photo.uri,
        [
          {
            crop: {
              originX,
              originY,
              width: Math.max(10, cropWidth),
              height: Math.max(10, cropHeight),
            },
          },
        ],
        { compress: 0.95, format: SaveFormat.JPEG }
      );

      const fileData = {
        uri: croppedImage.uri,
        name: `scanned_doc_${Date.now()}.jpg`,
        type: 'image/jpeg',
      };

      try {
        const data = await verifyFileItem(fileData);

        if (data?.valid === true) {
          const detectedName = data.displayName || data.documentType || 'Government Document';
          const fileObj = {
            id: `${Date.now()}_${Math.random()}`,
            uri: croppedImage.uri,
            name: fileData.name,
            type: fileData.type,
            docName: detectedName,
            verified: true,
            documentType: data.documentType,
            displayName: data.displayName,
            verificationMessage: data.message,
          };

          const updatedFiles = [...selectedFiles.filter((f) => f.id !== fileObj.id), fileObj];
          setSelectedFiles(updatedFiles);
          setScannedData(fileObj);
          setDocName(detectedName);

          Toast.show({
            type: 'success',
            text1: 'Document Auto-Scanned! ✅',
            text2: data.message || `${detectedName} verified successfully.`,
          });
        } else {
          setDocumentDetected(false);
          const errorMsg =
            (typeof data?.message === 'string' && data.message.trim()) ||
            (typeof data?.error === 'string' && data.error.trim()) ||
            'Document is not properly aligned. Please place the document straight inside the red frame.';
          Toast.show({
            type: 'error',
            text1: 'Document Not Aligned ❌',
            text2: errorMsg,
            visibilityTime: 4000,
            position: 'top',
          });
        }
      } catch (err: any) {
        console.error('Verification error:', err);
        setDocumentDetected(false);
        const errorMsg = getReadableErrorMessage(
          err,
          'Document is not aligned or clearly visible. Please ensure good lighting and place it inside the red frame.'
        );
        Toast.show({
          type: 'error',
          text1: 'Alignment / Verification Error ⚠️',
          text2: errorMsg,
          visibilityTime: 4500,
          position: 'top',
        });
      } finally {
        setIsVerifying(false);
      }
    } catch (error: any) {
      console.error('Auto capture error:', error);
      setDocumentDetected(false);
      const errorMsg = getReadableErrorMessage(
        error,
        'Document was not detected properly. Please hold the document straight in front of the camera.'
      );
      Toast.show({
        type: 'error',
        text1: 'Scan Error ⚠️',
        text2: errorMsg,
        visibilityTime: 4000,
        position: 'top',
      });
    } finally {
      setIsCapturing(false);
      isAutoCapturingRef.current = false;
    }
  };


  const resetCameraCapture = async () => {
    if (scannedData) {
      const updated = selectedFiles.filter((item) => item.id !== scannedData.id);
      setSelectedFiles(updated);
      await AsyncStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
    }
    setScannedData(null);
    setDocumentDetected(false);
    await AsyncStorage.removeItem(STORAGE_KEY_SCANNED);
    await AsyncStorage.removeItem(STORAGE_KEY_DOCNAME);
  };

  // Helper to verify and add files from gallery or document picker
  const verifyAndAddFiles = async (
    files: Array<{ uri: string; name?: string; type?: string; size?: number }>
  ) => {
    if (!files || files.length === 0) return;

    setIsVerifying(true);
    let verifiedCount = 0;
    const failedMessages: string[] = [];
    const newVerifiedList: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setVerifyingMessage(
        files.length > 1
          ? `Verifying document ${i + 1} of ${files.length}...`
          : 'Scanning & Verifying Document...'
      );

      try {
        const filePayload = {
          uri: f.uri,
          name: f.name || `doc_${Date.now()}.jpg`,
          type: f.type || 'image/jpeg',
        };
        const data = await verifyFileItem(filePayload);

        if (data?.valid === true) {
          const detectedName = data.displayName || data.documentType || 'Government Document';
          const fileObj = {
            id: `${Date.now()}_${i}_${Math.random()}`,
            uri: f.uri,
            name: filePayload.name,
            type: filePayload.type,
            size: f.size,
            docName: detectedName,
            verified: true,
            documentType: data.documentType,
            displayName: data.displayName,
            verificationMessage: data.message,
          };
          newVerifiedList.push(fileObj);
          verifiedCount++;
        } else {
          const msg =
            (typeof data?.message === 'string' && data.message.trim()) ||
            (typeof data?.error === 'string' && data.error.trim()) ||
            'Document is not a valid government document or not properly aligned.';
          failedMessages.push(`${f.name || `Document ${i + 1}`}: ${msg}`);
        }
      } catch (err: any) {
        const readableErr = getReadableErrorMessage(err, 'Verification failed. Document is not valid or readable.');
        failedMessages.push(`${f.name || `Document ${i + 1}`}: ${readableErr}`);
      }
    }

    if (newVerifiedList.length > 0) {
      setSelectedFiles((prev) => {
        const combined = [...prev, ...newVerifiedList];
        AsyncStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(combined)).catch(console.log);
        return combined;
      });
    }

    setIsVerifying(false);

    if (verifiedCount > 0) {
      Toast.show({
        type: 'success',
        text1: `${verifiedCount} Document(s) Verified! ✅`,
        text2: 'Government document verified successfully.',
      });
    }

    if (failedMessages.length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Document Verification Failed ❌',
        text2: failedMessages[0] || 'Only genuine government documents can be accepted.',
        visibilityTime: 4000,
        position: 'top',
      });
    }
  };

  // Gallery Picker
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Gallery access is needed to select photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      await verifyAndAddFiles(
        result.assets.map((asset) => ({
          uri: asset.uri,
          name: asset.fileName || `photo_${Date.now()}.jpg`,
          type: asset.mimeType || 'image/jpeg',
          size: asset.fileSize,
        }))
      );
    }
  };

  // File / PDF Picker
  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        await verifyAndAddFiles(
          result.assets.map((file) => ({
            uri: file.uri,
            name: file.name,
            type: file.mimeType || 'application/pdf',
            size: file.size,
          }))
        );
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to select document.');
    }
  };

  const handleSelectSource = () => {
    Alert.alert('Select File Source', 'Choose how you would like to select your files:', [
      { text: 'Auto Document Scanner 📷', onPress: () => setActiveTab('camera') },
      { text: 'Photo Gallery 🖼️', onPress: pickImage },
      { text: 'Files / PDF 📄', onPress: pickDocument },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const removeFile = async (id: string) => {
    const updated = selectedFiles.filter((item) => item.id !== id);
    setSelectedFiles(updated);
    await AsyncStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));

    if (scannedData?.id === id) {
      setScannedData(null);
      await AsyncStorage.removeItem(STORAGE_KEY_SCANNED);
      await AsyncStorage.removeItem(STORAGE_KEY_DOCNAME);
    }
  };

  const updateFileDocName = (id: string, text: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, docName: text } : item));
      AsyncStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated)).catch(console.log);
      return updated;
    });
    if (scannedData?.id === id) {
      setScannedData((prev: any) => (prev ? { ...prev, docName: text } : prev));
    }
  };

  // Upload Logic - Only verified documents can be uploaded
  const handleFinalUpload = async () => {
    if (isVerifying) {
      return Alert.alert('Please Wait ⏳', 'Document verification is currently in progress. Please wait a moment.');
    }

    if (uploadingIndex !== null || uploadDoc.isPending) {
      return Alert.alert('Please Wait ⏳', 'Document upload is currently in progress. Please wait a moment.');
    }

    if (selectedFiles.length === 0) {
      return Alert.alert(
        'Document Required',
        'Please scan or upload a verified government document first. Only verified documents can proceed.'
      );
    }

    // Check if any file is unverified
    const unverifiedFiles = selectedFiles.filter((item) => !item.verified);
    if (unverifiedFiles.length > 0) {
      return Alert.alert(
        'Verification Required ❌',
        'One or more selected documents could not be verified as a government document. Please scan a valid document.'
      );
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
      if (refetchDocs) {
        try {
          await refetchDocs();
        } catch (e) {}
      }
      setScannedData(null);
      setSelectedFiles([]);
      setDocName('');
      setUploadingIndex(null);

      // Clean up local verified persistence since it is now uploaded to server
      await AsyncStorage.removeItem(STORAGE_KEY_FILES);
      await AsyncStorage.removeItem(STORAGE_KEY_SCANNED);
      await AsyncStorage.removeItem(STORAGE_KEY_DOCNAME);

      Toast.show({
        type: 'success',
        text1: 'Document Uploaded! 📄',
        text2: 'Document uploaded successfully.',
      });

      if (onUploadDone) onUploadDone(null);
      if (onUploadSuccess) onUploadSuccess(null);
    } catch (error: any) {
      setUploadingIndex(null);
      const readable = getReadableErrorMessage(error, 'Failed to upload document(s). Please try again.');
      Toast.show({
        type: 'error',
        text1: 'Upload Error ❌',
        text2: readable,
        visibilityTime: 4000,
        position: 'top',
      });
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
        <View className="flex-row items-center">
          {/* {onBack && (
            <TouchableOpacity
              onPress={onBack}
              className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-slate-100 active:bg-slate-200">
              <Ionicons name="arrow-back" size={20} color="#1C1C1C" />
            </TouchableOpacity>
          )} */}
          <Text className="font-bold text-[24px] text-[#1C1C1C]">Upload Govt Document</Text>
        </View>
      </View>

      {/* Mode Selector Tabs */}
      <View className="mb-6 flex-row rounded-2xl bg-slate-100 p-1">
        <TouchableOpacity
          onPress={() => setActiveTab('camera')}
          disabled={isVerifying || isUploading}
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
          disabled={isVerifying || isUploading}
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

      {/* Document Name Input */}
      {selectedFiles.length === 0 && (
        <View className="mb-6">
          <Text className="mb-2 ml-1 text-sm font-semibold text-slate-500">Document Name</Text>
          <TextInput
            value={docName}
            onChangeText={setDocName}
            placeholder="e.g. GST Certificate, PAN, License (Auto-detected on scan)"
            placeholderTextColor="#94A3B8"
            className="h-14 w-full rounded-2xl border border-slate-100 bg-[#F8FAFC] px-5 font-semibold text-slate-900"
            editable={!isUploading && !isVerifying}
          />
        </View>
      )}

      {/* Tab Content */}
      <View className="mb-6">
        {activeTab === 'camera' ? (
          // Camera Tab
          <View
            className="relative h-72 w-full overflow-hidden rounded-[26px] border border-slate-800 bg-black"
            onLayout={(e) => {
              const { width, height } = e.nativeEvent.layout;
              if (width > 0 && height > 0) {
                setContainerLayout({ width, height });
              }
            }}>
            {/* Scanning / Verification Overlay */}
            {isVerifying && (
              <View
                className="absolute inset-0 z-30 items-center justify-center p-6"
                style={styles.verifyingOverlay}>
                <View
                  className="h-14 w-14 items-center justify-center rounded-2xl border mb-2.5"
                  style={styles.verifyingIconBox}>
                  <ActivityIndicator size="large" color="#F6163C" />
                </View>
                <Text className="text-white font-bold text-sm text-center px-4">
                  {verifyingMessage}
                </Text>
                <Text className="text-slate-400 text-xs text-center mt-1">
                  Auto-cropping document & validating with records...
                </Text>
              </View>
            )}

            {scannedData ? (
              // Captured Preview with Verified Badge in RED theme
              <View className="flex-1">
                <Image source={{ uri: scannedData.uri }} className="flex-1" resizeMode="cover" />
                <View className="absolute inset-0 items-center justify-center" style={styles.overlayBg}>
                  <View
                    className="mb-2 h-12 w-12 items-center justify-center rounded-full bg-[#F6163C]"
                    style={styles.verifiedBadgeShadow}>
                    <Ionicons name="shield-checkmark" size={24} color="white" />
                  </View>
                  <Text className="font-bold text-sm text-white text-center px-4 mb-1" numberOfLines={1}>
                    {scannedData.displayName || scannedData.docName || 'Government Document'}
                  </Text>
                  <View className="flex-row items-center bg-[#F6163C] px-3 py-0.5 rounded-full mb-3 shadow-sm">
                    <Ionicons name="checkmark-circle" size={12} color="white" />
                    <Text className="text-white text-[11px] font-bold ml-1">Verified & Cropped</Text>
                  </View>
                  <TouchableOpacity
                    onPress={resetCameraCapture}
                    disabled={isVerifying || isUploading}
                    className="flex-row items-center rounded-full px-5 py-2 border border-white/30"
                    style={styles.retakeBtnBg}>
                    <Ionicons name="refresh-outline" size={16} color="white" />
                    <Text className="font-bold text-xs text-white ml-1.5">Retake / Scan Another</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !permission ? (
              // Permission Loading
              <View className="flex-1 items-center justify-center bg-slate-950">
                <ActivityIndicator size="large" color="#F6163C" />
              </View>
            ) : permission.granted ? (
              // Live Camera View with Intelligent Document Detection & Auto-Cropping
              <View className="flex-1">
                <CameraView
                  ref={cameraRef}
                  style={StyleSheet.absoluteFill}
                  facing="back"
                  barcodeScannerSettings={{
                    barcodeTypes: ['qr', 'pdf417', 'aztec', 'code128', 'code39', 'datamatrix', 'ean13', 'upc_a'],
                  }}
                  onBarcodeScanned={() => {
                    if (!isCapturing && !isVerifying && !scannedData) {
                      setDocumentDetected(true);
                      autoCaptureAndCrop();
                    }
                  }}
                />
                <View className="absolute inset-0 items-center justify-center bg-black/20">
                  {/* Top Scanbot-Style Pill Badge */}
                  <View className="absolute top-3 z-20 flex-row items-center rounded-full bg-black/85 px-3.5 py-1.5 border border-[#F6163C]/40 shadow-xl">
                    <View className="h-2 w-2 rounded-full mr-2 bg-[#F6163C]" />
                    <Text className="text-[11px] font-bold text-white tracking-wide">
                      {isCapturing
                        ? 'Auto-Capturing & Cropping...'
                        : isVerifying
                        ? 'Verifying Document...'
                        : documentDetected
                        ? 'Document Detected! Hold steady...'
                        : 'Align Document in Red Frame'}
                    </Text>
                  </View>

                  {/* Document Edge Detection Bounding Frame (Red outline) */}
                  <TouchableOpacity
                    activeOpacity={0.95}
                    onPress={autoCaptureAndCrop}
                    disabled={isCapturing || isVerifying}
                    style={{
                      width: Math.round((containerLayout?.width || 340) * 0.78),
                      height: Math.round((containerLayout?.height || 288) * 0.70),
                      borderColor: '#F6163C',
                      borderWidth: 2.5,
                      borderRadius: 14,
                      backgroundColor: 'rgba(246, 22, 60, 0.05)',
                    }}
                    className="items-center justify-center relative overflow-hidden shadow-2xl">
                    {/* Animated Red Laser Scanning Line */}
                    <Animated.View
                      style={{
                        position: 'absolute',
                        left: 2,
                        right: 2,
                        height: 2.5,
                        backgroundColor: '#F6163C',
                        shadowColor: '#F6163C',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: 1,
                        shadowRadius: 8,
                        elevation: 6,
                        transform: [
                          {
                            translateY: scanLineAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [6, Math.round((containerLayout?.height || 288) * 0.70) - 12],
                            }),
                          },
                        ],
                      }}
                    />

                    {/* Corner Brackets in Red */}
                    <View className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#F6163C]" />
                    <View className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#F6163C]" />
                    <View className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#F6163C]" />
                    <View className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#F6163C]" />

                    {/* 4 Corner Pulsing Dot Indicators */}
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: -5,
                        left: -5,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#F6163C',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ scale: pulseAnim }],
                      }}
                    />
                    <Animated.View
                      style={{
                        position: 'absolute',
                        top: -5,
                        right: -5,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#F6163C',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ scale: pulseAnim }],
                      }}
                    />
                    <Animated.View
                      style={{
                        position: 'absolute',
                        bottom: -5,
                        left: -5,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#F6163C',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ scale: pulseAnim }],
                      }}
                    />
                    <Animated.View
                      style={{
                        position: 'absolute',
                        bottom: -5,
                        right: -5,
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: '#F6163C',
                        borderWidth: 2,
                        borderColor: '#FFFFFF',
                        transform: [{ scale: pulseAnim }],
                      }}
                    />

                    <View className="rounded-full bg-black/65 px-3 py-1 border border-[#F6163C]/40">
                      <Text className="text-[11px] font-semibold text-red-200">
                        Align Document • Tap to Auto-Crop
                      </Text>
                    </View>
                  </TouchableOpacity>


                </View>
              </View>
            ) : (
              // Request Permission View
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
          // File / Gallery Tab
          <View>
            {isVerifying ? (
              <View
                className="h-44 items-center justify-center rounded-[30px] border-2 border-dashed border-emerald-300 p-6"
                style={styles.fileVerifyingBox}>
                <View className="h-12 w-12 items-center justify-center rounded-full bg-emerald-100 mb-2">
                  <ActivityIndicator size="small" color="#10B981" />
                </View>
                <Text className="font-bold text-base text-emerald-800 text-center">
                  {verifyingMessage}
                </Text>
                <Text className="mt-1 text-center text-xs text-emerald-600">
                  Validating document with government records...
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleSelectSource}
                disabled={isUploading}
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
                  Files are automatically verified upon selection
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Selected Files Queue */}
      {selectedFiles.length > 0 && (
        <View className="mb-6">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="font-bold text-slate-800 text-base">Verified Documents</Text>
            <TouchableOpacity
              onPress={handleSelectSource}
              disabled={isVerifying || isUploading}
              activeOpacity={0.7}>
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
                      <View className="flex-row items-center gap-1.5 flex-wrap">
                        <Text className="font-semibold text-slate-700 text-xs" numberOfLines={1}>
                          {file.name}
                        </Text>
                        {file.verified && (
                          <View className="flex-row items-center bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <Ionicons name="shield-checkmark" size={10} color="#F6163C" />
                            <Text className="text-[10px] font-bold text-[#F6163C] ml-1">Verified</Text>
                          </View>
                        )}
                      </View>
                      {file.size && (
                        <Text className="text-[10px] text-slate-400 mt-0.5">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </Text>
                      )}
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeFile(file.id)}
                    disabled={isUploading || isVerifying}
                    className="ml-2 h-8 w-8 items-center justify-center rounded-full"
                    style={styles.deleteBtnBg}>
                    <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>

                <View className="mt-3">
                  <View className="flex-row items-center justify-between mb-1">
                    <Text className="text-[11px] font-semibold text-slate-400">
                      Document Name #{idx + 1}
                    </Text>
                    {file.displayName && (
                      <Text className="text-[10px] font-semibold text-[#F6163C]">
                        {file.displayName}
                      </Text>
                    )}
                  </View>
                  <TextInput
                    value={file.docName}
                    onChangeText={(text) => updateFileDocName(file.id, text)}
                    placeholder="e.g. Aadhaar Card, PAN, Driving License"
                    placeholderTextColor="#94A3B8"
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-900"
                    editable={!isUploading && !isVerifying}
                  />
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Uploaded Documents List ("niche list me woh document ho") */}
      {docList.length > 0 && (
        <View className="mt-2 mb-6">
          <View className="flex-row items-center justify-between mb-3 px-1">
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={18} color="#1E293B" />
              <Text className="ml-2 font-bold text-base text-slate-900">
                Uploaded Documents ({docList.length})
              </Text>
            </View>
            <View className="flex-row items-center rounded-full bg-emerald-50 px-2.5 py-0.5 border border-emerald-200">
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
              <Text className="ml-1 text-[11px] font-bold text-emerald-700">Saved</Text>
            </View>
          </View>

          {docList.map((item: any, index: number) => {
            const isPdf = item?.fileType?.includes('pdf') || item?.type?.includes('pdf');
            return (
              <TouchableOpacity
                key={item?.id || item?._id || index.toString()}
                onPress={() => handleOpenPreview(item)}
                activeOpacity={0.8}
                className="mb-3 flex-row items-center rounded-[20px] bg-[#F3F4F6] p-4"
              >
                <View className="items-center justify-center rounded-xl bg-white p-2 border border-slate-100 shadow-sm">
                  <Ionicons name={isPdf ? "document-text" : "image"} size={26} color="#6B7280" />
                  <Text className="mt-[-3px] font-bold text-[8px] uppercase text-gray-500">
                    {isPdf ? 'PDF' : 'IMG'}
                  </Text>
                </View>

                <View className="ml-3.5 flex-1">
                  <Text className="font-bold text-sm text-[#1F2937]" numberOfLines={1}>
                    {item?.documentName || item?.name || 'Government Document'}
                  </Text>
                  <View className="mt-1 flex-row items-center">
                    <View className="mr-1.5 rounded-full bg-[#10B981] p-[2px]">
                      <Ionicons name="checkmark" size={10} color="white" />
                    </View>
                    <Text className="text-xs text-gray-500">
                      Uploaded: {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                    </Text>
                  </View>
                </View>

                <View className="ml-2 flex-row items-center rounded-xl bg-white px-2.5 py-1.5 border border-slate-200 shadow-sm">
                  <Ionicons name="eye-outline" size={14} color="#F6163C" />
                  <Text className="ml-1 text-xs font-bold text-[#F6163C]">View</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Submit / Next Step Button */}
      <View className="mt-auto pb-8">
        <TouchableOpacity
          onPress={
            selectedFiles.length > 0
              ? handleFinalUpload
              : () => {
                  if (onUploadDone) onUploadDone(null);
                  if (onUploadSuccess) onUploadSuccess(null);
                }
          }
          disabled={
            isUploading ||
            isVerifying ||
            (selectedFiles.length === 0 && docList.length === 0)
          }
          activeOpacity={0.8}
          className={`h-14 w-full flex-row items-center justify-center rounded-2xl ${
            isUploading ||
            isVerifying ||
            (selectedFiles.length === 0 && docList.length === 0)
              ? 'bg-slate-300'
              : 'bg-[#F6163C]'
          }`}
          style={
            (selectedFiles.length > 0 || docList.length > 0) &&
            !isUploading &&
            !isVerifying
              ? styles.uploadBtnShadow
              : null
          }
        >
          {isUploading ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" />
              <Text className="ml-3 font-bold text-[15px] text-white">
                {uploadingIndex
                  ? `Uploading ${uploadingIndex} of ${selectedFiles.length}...`
                  : 'Uploading...'}
              </Text>
            </View>
          ) : isVerifying ? (
            <View className="flex-row items-center">
              <ActivityIndicator color="white" size="small" />
              <Text className="ml-3 font-bold text-[15px] text-white">
                Verifying Document...
              </Text>
            </View>
          ) : selectedFiles.length > 0 ? (
            <>
              <Ionicons name="shield-checkmark-outline" size={20} color="white" />
              <Text className="ml-2 font-bold text-[16px] text-white">
                {selectedFiles.length === 1
                  ? 'Submit Verified Document'
                  : `Submit ${selectedFiles.length} Verified Documents`}
              </Text>
            </>
          ) : docList.length > 0 ? (
            <View className="flex-row items-center">
              <Text className="font-bold text-[16px] text-white">
                Next Step (Photos)
              </Text>
              <Ionicons name="arrow-forward" size={18} color="white" style={{ marginLeft: 6 }} />
            </View>
          ) : (
            <Text className="font-bold text-[16px] text-white">
              Scan Document to Proceed
            </Text>
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

      {/* DOCUMENT PREVIEW MODAL */}
      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="fade"
        statusBarTranslucent={true}
        onRequestClose={() => setPreviewVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent={true} />
          {/* Header Bar */}
          <View
            style={{
              paddingTop:
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : Math.max(insets.top, 24) + 12)
                  : Math.max(insets.top, 16) + 8,
              paddingBottom: 14,
              paddingHorizontal: 16,
            }}
            className="flex-row items-center justify-between border-b border-slate-800 bg-[#0F172A]">
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20">
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>

            <View className="flex-1 mx-3 items-center">
              <Text className="font-bold text-base text-white text-center" numberOfLines={1}>
                {previewDoc?.documentName || previewDoc?.name || 'Document Preview'}
              </Text>
              <View className="flex-row items-center mt-0.5">
                <Ionicons name="shield-checkmark" size={11} color="#10B981" />
                <Text className="ml-1 text-[11px] text-emerald-400 font-semibold">
                  Verified Document
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => handleOpenExternalUrl(getCleanDocUrl(previewDoc))}
              activeOpacity={0.7}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/10 active:bg-white/20">
              <Ionicons name="open-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Document Content View */}
          <View className="flex-1 bg-slate-950 p-2">
            {(() => {
              const url = getCleanDocUrl(previewDoc);
              const isPdf =
                url.toLowerCase().includes('.pdf') ||
                previewDoc?.fileType?.includes('pdf') ||
                previewDoc?.type?.includes('pdf');

              if (!url) {
                return (
                  <View className="flex-1 items-center justify-center p-6">
                    <Ionicons name="document-text-outline" size={64} color="#64748B" />
                    <Text className="text-white font-bold text-lg mt-4 text-center">
                      {previewDoc?.documentName || previewDoc?.name || 'Document'}
                    </Text>
                    <Text className="text-slate-400 text-sm mt-2 text-center">
                      Direct preview URL not available. Document is verified and safely stored.
                    </Text>
                  </View>
                );
              }

              if (isPdf) {
                return (
                  <WebView
                    source={getPdfSource(url)}
                    startInLoadingState={true}
                    renderLoading={() => (
                      <View className="absolute inset-0 items-center justify-center bg-slate-950">
                        <ActivityIndicator size="large" color="#F6163C" />
                        <Text className="text-slate-400 text-xs mt-2">Loading PDF Document...</Text>
                      </View>
                    )}
                    style={{ flex: 1, backgroundColor: '#020617' }}
                  />
                );
              }

              return (
                <View className="flex-1 items-center justify-center">
                  <Image
                    source={{ uri: url }}
                    resizeMode="contain"
                    style={{ width: '100%', height: '100%' }}
                  />
                </View>
              );
            })()}
          </View>
        </View>
      </Modal>
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  targetBorderColor: {
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  frameLabelWrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  frameLabelText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
  },
  shutterBtnBg: {
    backgroundColor: 'rgba(246, 22, 60, 0.9)',
  },
  verifyingOverlay: {
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
  },
  verifyingIconBox: {
    backgroundColor: 'rgba(246, 22, 60, 0.15)',
    borderColor: 'rgba(246, 22, 60, 0.4)',
  },
  verifiedBadgeShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  fileVerifyingBox: {
    backgroundColor: 'rgba(236, 253, 245, 0.5)',
  },
  deleteBtnBg: {
    backgroundColor: 'rgba(226, 232, 240, 0.6)',
  },
  uploadBtnShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#F6163C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  cloudIconWrapperBg: {
    backgroundColor: '#FFF1F2',
  },
  dashedBorderBox: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FAFAFA',
  },
});

export default OnBoarding4;
