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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

  // Capture Photo with Camera and Verify Immediately
  const takePicture = async () => {
    if (!cameraRef.current || isCapturing || isVerifying) return;
    try {
      setIsCapturing(true);
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (photo) {
        setIsVerifying(true);
        setVerifyingMessage('Scanning & Verifying Document...');

        const fileData = {
          uri: photo.uri,
          name: `camera_${Date.now()}.jpg`,
          type: 'image/jpeg',
        };

        try {
          const data = await verifyFileItem(fileData);

          if (data?.valid === true) {
            const detectedName = data.displayName || data.documentType || 'Government Document';
            const fileObj = {
              id: `${Date.now()}_${Math.random()}`,
              uri: photo.uri,
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
            // Show verified preview in camera container for this freshly taken photo
            setScannedData(fileObj);
            setDocName(detectedName);

            Toast.show({
              type: 'success',
              text1: 'Document Verified! ✅',
              text2: data.message || `${detectedName} verified successfully.`,
            });
          } else {
            Alert.alert(
              'Document Verification Failed ❌',
              data?.message || 'Invalid government document. Please scan a genuine government document (e.g. GST, PAN, etc.).'
            );
          }
        } catch (err: any) {
          console.error('Verification error:', err);
          Alert.alert(
            'Verification Failed ❌',
            err?.response?.data?.message || err?.message || 'Failed to verify government document. Please try again with a clear photo.'
          );
        } finally {
          setIsVerifying(false);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  const resetCameraCapture = async () => {
    if (scannedData) {
      const updated = selectedFiles.filter((item) => item.id !== scannedData.id);
      setSelectedFiles(updated);
      await AsyncStorage.setItem(STORAGE_KEY_FILES, JSON.stringify(updated));
    }
    setScannedData(null);
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
          failedMessages.push(
            `${f.name || `Document ${i + 1}`}: ${data?.message || 'Not a valid government document.'}`
          );
        }
      } catch (err: any) {
        failedMessages.push(
          `${f.name || `Document ${i + 1}`}: ${err?.response?.data?.message || err?.message || 'Verification failed'}`
        );
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
      Alert.alert(
        'Document Verification Failed ❌',
        failedMessages.join('\n') || 'Only genuine government documents can be accepted.'
      );
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
      { text: 'Photo Gallery', onPress: pickImage },
      { text: 'Files / PDF', onPress: pickDocument },
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
          <View className="relative h-80 w-full overflow-hidden rounded-[30px] border border-slate-100 bg-slate-900">
            {/* Scanning / Verification Overlay */}
            {isVerifying && (
              <View
                className="absolute inset-0 z-30 items-center justify-center p-6"
                style={styles.verifyingOverlay}>
                <View
                  className="h-16 w-16 items-center justify-center rounded-2xl border mb-3"
                  style={styles.verifyingIconBox}>
                  <ActivityIndicator size="large" color="#10B981" />
                </View>
                <Text className="text-white font-bold text-base text-center px-4">
                  {verifyingMessage}
                </Text>
                <Text className="text-slate-400 text-xs text-center mt-1">
                  Validating document with government records...
                </Text>
              </View>
            )}

            {scannedData ? (
              // Captured Preview with Verified Badge
              <View className="flex-1">
                <Image source={{ uri: scannedData.uri }} className="flex-1" resizeMode="cover" />
                <View className="absolute inset-0 items-center justify-center" style={styles.overlayBg}>
                  <View
                    className="mb-2 h-14 w-14 items-center justify-center rounded-full bg-emerald-500"
                    style={styles.verifiedBadgeShadow}>
                    <Ionicons name="shield-checkmark" size={28} color="white" />
                  </View>
                  <Text className="font-bold text-base text-white text-center px-4 mb-1">
                    {scannedData.displayName || scannedData.docName || 'Government Document'}
                  </Text>
                  <View className="flex-row items-center bg-emerald-600 px-3 py-1 rounded-full mb-4">
                    <Ionicons name="checkmark-circle" size={14} color="white" />
                    <Text className="text-white text-xs font-bold ml-1.5">Verified Document</Text>
                  </View>
                  <TouchableOpacity
                    onPress={resetCameraCapture}
                    disabled={isVerifying || isUploading}
                    className="flex-row items-center rounded-full px-6 py-2.5"
                    style={styles.retakeBtnBg}>
                    <Ionicons name="refresh-outline" size={18} color="white" />
                    <Text className="font-bold text-sm text-white ml-1.5">Retake Photo</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : !permission ? (
              // Permission Loading
              <View className="flex-1 items-center justify-center bg-slate-950">
                <ActivityIndicator size="large" color="#F6163C" />
              </View>
            ) : permission.granted ? (
              // Live Camera View with Absolute Overlay
              <View className="flex-1">
                <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />
                <View className="absolute inset-0 items-center justify-center" style={styles.shutterOverlayBg}>
                  {/* Target Frame */}
                  <View className="h-48 w-72 items-center justify-center rounded-2xl border" style={styles.targetBorderColor}>
                    <View className="absolute left-0 top-0 h-6 w-6 rounded-tl-lg border-l-4 border-t-4 border-[#F6163C]" />
                    <View className="absolute right-0 top-0 h-6 w-6 rounded-tr-lg border-r-4 border-t-4 border-[#F6163C]" />
                    <View className="absolute bottom-0 left-0 h-6 w-6 rounded-bl-lg border-b-4 border-l-4 border-[#F6163C]" />
                    <View className="absolute bottom-0 right-0 h-6 w-6 rounded-br-lg border-b-4 border-r-4 border-[#F6163C]" />
                    <View style={styles.frameLabelWrapper}>
                      <Text style={styles.frameLabelText}>
                        Align Government Document
                      </Text>
                    </View>
                  </View>

                  {/* Shutter Button */}
                  <TouchableOpacity
                    onPress={takePicture}
                    disabled={isCapturing || isVerifying}
                    activeOpacity={0.85}
                    className="absolute bottom-6 h-16 w-16 items-center justify-center rounded-full border-4 border-white"
                    style={styles.shutterBtnBg}>
                    {isCapturing || isVerifying ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <View className="h-11 w-11 rounded-full bg-white" />
                    )}
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
                          <View className="flex-row items-center bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                            <Text className="text-[10px] font-bold text-emerald-700 ml-1">Verified</Text>
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
                      <Text className="text-[10px] font-semibold text-emerald-600">
                        {file.displayName}
                      </Text>
                    )}
                  </View>
                  <TextInput
                    value={file.docName}
                    onChangeText={(text) => updateFileDocName(file.id, text)}
                    placeholder="e.g. GST Certificate, PAN"
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
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setPreviewVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          {/* Header Bar */}
          <View
            style={{
              paddingTop: Platform.OS === 'android' ? 14 : 6,
            }}
            className="flex-row items-center justify-between pb-3 px-4 border-b border-slate-800">
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
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
        </SafeAreaView>
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
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  verifiedBadgeShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
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
