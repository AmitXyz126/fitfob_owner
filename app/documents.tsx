import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Linking,
  ScrollView,
  TextInput,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';
import { useUserDetail } from '@/hooks/useUserDetail';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';

export interface DocumentItem {
  id: string;
  name: string;
  url: string;
  date: string;
  size: string;
  type?: string;
  raw?: any;
}

const DOCUMENT_TYPES = [
  'GST Certificate',
  'Business Registration',
  'Aadhaar / ID Proof',
  'PAN Card',
  'Trade License',
  'Lease Agreement',
  'Other Document',
];

export default function DocumentsScreen() {
  const router = useRouter();
  const { documents, isDocsLoading, refetchDocs, uploadDoc } = useUserDetail();

  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState('GST Certificate');
  const [customDocName, setCustomDocName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Helper for clean document title resolution
  const getCleanDocName = (item: any, fileObj: any, idx: number) => {
    const possibleName =
      item?.documentName ||
      item?.docType ||
      item?.documentType ||
      item?.type ||
      item?.title;

    const ownerName = item?.ownerName || item?.clubOwnerName;

    if (possibleName && possibleName !== item?.name && possibleName !== ownerName) {
      return possibleName;
    }

    const fileName = fileObj?.name || fileObj?.originalName;
    if (fileName && fileName !== ownerName && !fileName.includes('@')) {
      return fileName;
    }

    if (item?.name && item?.name !== ownerName && !item?.name?.includes('@')) {
      return item.name;
    }

    return `Document #${idx + 1}`;
  };

  // Parse API documents or fallback
  const parsedDocuments: DocumentItem[] = useMemo(() => {
    const rawList =
      documents?.documents ||
      documents?.data ||
      documents?.docs ||
      (Array.isArray(documents) ? documents : []);

    if (Array.isArray(rawList) && rawList.length > 0) {
      return rawList.map((item: any, idx: number) => {
        const fileObj = item?.file || item;
        const rawUrl =
          item?.url ||
          item?.fileUrl ||
          fileObj?.url ||
          fileObj?.uri ||
          item?.uri ||
          '';

        const name = getCleanDocName(item, fileObj, idx);

        const rawDate = item?.createdAt || item?.date || item?.updatedAt;
        const formattedDate = rawDate
          ? new Date(rawDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })
          : 'Uploaded';

        return {
          id: String(item?.id || idx + 1),
          name,
          url: rawUrl,
          date: formattedDate,
          size: item?.size || fileObj?.size || '1.2 MB',
          type: item?.mimeType || fileObj?.mimeType || 'application/pdf',
          raw: item,
        };
      });
    }

    // Default mock list if no documents uploaded yet
    return [
      {
        id: 'm1',
        name: 'GST Certificate.pdf',
        url: '',
        date: 'March 5, 2024',
        size: '1.2MB',
      },
      {
        id: 'm2',
        name: 'Business Registration.pdf',
        url: '',
        date: 'February 15, 2024',
        size: '850KB',
      },
    ];
  }, [documents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchDocs();
    setRefreshing(false);
  };

  const handleOpenOptions = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
  };

  const handleViewPreview = (doc?: DocumentItem) => {
    const targetDoc = doc || selectedDoc;
    if (!targetDoc) return;
    setPopupVisible(false);
    setSelectedDoc(targetDoc);
    setPreviewVisible(true);
  };

  const handleOpenExternalUrl = async () => {
    if (!selectedDoc?.url) {
      Toast.show({
        type: 'info',
        text1: 'Document Link Unavailable',
        text2: 'No web URL provided for this document.',
      });
      return;
    }

    try {
      if (
        selectedDoc.url.toLowerCase().endsWith('.pdf') ||
        selectedDoc.url.toLowerCase().includes('.pdf') ||
        selectedDoc.url.startsWith('http')
      ) {
        await WebBrowser.openBrowserAsync(selectedDoc.url);
      } else {
        await Linking.openURL(selectedDoc.url);
      }
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Cannot Open Link',
        text2: 'Unable to open file in browser.',
      });
    }
  };

  // Upload Logic: File Picker / Image Picker
  const handleSelectAndUploadFile = async (pickerType: 'document' | 'image') => {
    const finalDocName =
      selectedDocType === 'Other Document' && customDocName.trim()
        ? customDocName.trim()
        : selectedDocType;

    try {
      let fileToUpload: { uri: string; name: string; type: string } | null = null;

      if (pickerType === 'document') {
        const result = await DocumentPicker.getDocumentAsync({
          type: ['image/*', 'application/pdf'],
          copyToCacheDirectory: true,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          fileToUpload = {
            uri: asset.uri,
            name: asset.name || `${finalDocName.replace(/\s+/g, '_')}.pdf`,
            type: asset.mimeType || 'application/pdf',
          };
        }
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const asset = result.assets[0];
          fileToUpload = {
            uri: asset.uri,
            name: asset.fileName || `${finalDocName.replace(/\s+/g, '_')}.jpg`,
            type: asset.mimeType || 'image/jpeg',
          };
        }
      }

      if (!fileToUpload) return;

      setIsUploading(true);
      setUploadModalVisible(false);

      console.log('Uploading document:', finalDocName, fileToUpload);

      await uploadDoc.mutateAsync({
        name: finalDocName,
        file: fileToUpload,
      });

      Toast.show({
        type: 'success',
        text1: 'Document Uploaded! 📄',
        text2: `${finalDocName} uploaded successfully.`,
      });

      await refetchDocs();
    } catch (error: any) {
      console.log('Upload error:', error?.response?.data || error?.message);
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error?.response?.data?.message || error?.message || 'Failed to upload document.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const renderDocumentItem = ({ item }: { item: DocumentItem }) => {
    return (
      <View className="mb-3.5 flex-row items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm mx-0.5">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleOpenOptions(item)}
          className="flex-row items-center flex-1 pr-3">
          {/* File Icon Container */}
          <View className="h-12 w-12 items-center justify-center rounded-xl bg-red-50 border border-red-100">
            <Ionicons name="document-text" size={22} color="#F6163C" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="font-bold text-[14px] text-slate-800" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="mt-1 font-semibold text-[11px] text-slate-400">
              {item.date}  •  {item.size}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Triple Dot Options Button */}
        <TouchableOpacity
          onPress={() => handleOpenOptions(item)}
          className="h-9 w-9 items-center justify-center rounded-xl bg-slate-100 active:bg-slate-200">
          <Ionicons name="ellipsis-horizontal" size={18} color="#475569" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Container>
      {/* Uploading Spinner Overlay */}
      {isUploading && (
        <View className="absolute inset-0 z-50 items-center justify-center bg-black/40">
          <View className="items-center rounded-3xl bg-white p-8 shadow-2xl">
            <ActivityIndicator size="large" color="#F6163C" />
            <Text className="mt-4 font-bold text-base text-slate-900">Uploading Document...</Text>
            <Text className="mt-1 text-xs font-semibold text-slate-400">Please wait a moment</Text>
          </View>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full border border-slate-200/60 bg-white/80 backdrop-blur-md">
          <Ionicons name="chevron-back" size={22} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-bold text-lg text-slate-800 text-center flex-1 mr-10">
          My Documents
        </Text>
      </View>

      {/* Main Section Header */}
      <View className="mb-4 flex-row items-center justify-between">
        <Text className="font-bold text-xl text-slate-900">
          Uploaded Documents
        </Text>
        <Text className="font-semibold text-xs text-slate-400">
          {parsedDocuments.length} Documents
        </Text>
      </View>

      {/* Document List */}
      {isDocsLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#F6163C" />
          <Text className="mt-3 font-semibold text-sm text-slate-400">Loading Documents...</Text>
        </View>
      ) : (
        <FlatList
          data={parsedDocuments}
          renderItem={renderDocumentItem}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 10 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#F6163C']} />
          }
        />
      )}

      {/* Floating Bottom Upload Button */}
      <View className="absolute bottom-6 left-4 right-4 bg-transparent">
        <TouchableOpacity
          onPress={() => setUploadModalVisible(true)}
          activeOpacity={0.85}
          className="flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-lg">
          <Ionicons name="cloud-upload-outline" size={22} color="#FFF" />
          <Text className="font-bold text-base text-white ml-2">
            Upload Document
          </Text>
        </TouchableOpacity>
      </View>

      {/* 1. OPTIONS BOTTOM SHEET MODAL */}
      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePopup}>
        <Pressable onPress={handleClosePopup} className="flex-1 bg-black/50 justify-end">
          <Pressable className="bg-white rounded-t-[32px] p-6 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-6" />

            <Text className="font-bold text-lg text-slate-900" numberOfLines={1}>
              {selectedDoc?.name}
            </Text>
            <Text className="text-xs font-semibold text-slate-400 mt-1 mb-6">
              {selectedDoc?.date}  •  {selectedDoc?.size}
            </Text>

            {/* Option 1: Preview / View */}
            <TouchableOpacity
              onPress={() => handleViewPreview()}
              className="flex-row items-center py-3.5 border-b border-slate-100 active:opacity-75">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="eye-outline" size={22} color="#334155" />
              </View>
              <Text className="font-bold text-base text-slate-800 ml-3.5">
                Preview / View Document
              </Text>
            </TouchableOpacity>

            {/* Option 2: Download / External URL */}
            <TouchableOpacity
              onPress={handleOpenExternalUrl}
              className="flex-row items-center py-3.5 active:opacity-75">
              <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <Ionicons name="open-outline" size={22} color="#334155" />
              </View>
              <Text className="font-bold text-base text-slate-800 ml-3.5">
                Open in Browser / Download
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 2. FULL DOCUMENT PREVIEW MODAL */}
      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" />
          {/* Header Bar */}
          <View
            style={{
              marginTop: 24,
              paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) : 16,
            }}
            className="flex-row items-center justify-between pb-3 px-4">
            <TouchableOpacity
              onPress={() => setPreviewVisible(false)}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="close" size={22} color="#FFF" />
            </TouchableOpacity>

            <Text className="font-bold text-base text-white flex-1 text-center mx-3" numberOfLines={1}>
              {selectedDoc?.name}
            </Text>

            <TouchableOpacity
              onPress={handleOpenExternalUrl}
              className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Ionicons name="open-outline" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Preview Image or File Link */}
          <View className="flex-1 items-center justify-center p-4">
            {selectedDoc?.url &&
              (selectedDoc.url.toLowerCase().match(/\.(jpg|jpeg|png|webp)/) ||
                selectedDoc.url.startsWith('data:image')) ? (
              <Image
                source={{ uri: selectedDoc.url }}
                className="h-full w-full rounded-2xl"
                resizeMode="contain"
              />
            ) : (
              <View className="items-center justify-center p-8 rounded-3xl bg-slate-800/80 border border-slate-700 w-full max-w-[320px]">
                <Ionicons name="document-text-outline" size={72} color="#F6163C" />
                <Text className="mt-4 font-bold text-lg text-white text-center">
                  {selectedDoc?.name}
                </Text>
                <Text className="mt-2 text-xs font-semibold text-slate-400 text-center">
                  {selectedDoc?.date}  •  {selectedDoc?.size}
                </Text>

                <TouchableOpacity
                  onPress={handleOpenExternalUrl}
                  activeOpacity={0.8}
                  className="mt-6 flex-row items-center rounded-xl bg-[#F6163C] px-5 py-3">
                  <Ionicons name="open-outline" size={18} color="#FFF" />
                  <Text className="ml-2 font-bold text-sm text-white">Open Document</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* 3. UPLOAD DOCUMENT SELECTION MODAL */}
      <Modal
        visible={uploadModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}>
        <Pressable
          onPress={() => setUploadModalVisible(false)}
          className="flex-1 bg-black/50 justify-end">
          <Pressable className="bg-white rounded-t-[32px] p-6 shadow-2xl">
            <View className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4" />

            <Text className="font-bold text-xl text-slate-900 mb-1">Upload New Document</Text>
            <Text className="text-xs font-semibold text-slate-400 mb-4">
              Select document type and choose a file to upload.
            </Text>

            {/* Document Type Selector */}
            <Text className="mb-2 text-xs font-bold text-slate-600">Select Document Type:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
              contentContainerStyle={{ gap: 8 }}>
              {DOCUMENT_TYPES.map((type) => {
                const isSelected = selectedDocType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setSelectedDocType(type)}
                    className={`rounded-xl px-4 py-2 border ${isSelected
                      ? 'bg-[#F6163C] border-[#F6163C]'
                      : 'bg-slate-100 border-slate-200'
                      }`}>
                    <Text
                      className={`font-bold text-xs ${isSelected ? 'text-white' : 'text-slate-700'
                        }`}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {selectedDocType === 'Other Document' && (
              <TextInput
                placeholder="Enter custom document name..."
                value={customDocName}
                onChangeText={setCustomDocName}
                className="mb-4 h-12 rounded-xl border border-slate-200 bg-slate-50 px-4 font-semibold text-sm text-slate-800"
              />
            )}

            {/* File Source Options */}
            <TouchableOpacity
              onPress={() => handleSelectAndUploadFile('document')}
              className="mb-3 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 p-4 active:bg-slate-100">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-red-50">
                <Ionicons name="document-attach-outline" size={24} color="#F6163C" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-bold text-base text-slate-800">Browse Files / PDF</Text>
                <Text className="text-xs font-semibold text-slate-400">
                  Select a document from your device files
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleSelectAndUploadFile('image')}
              className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-slate-50 p-4 active:bg-slate-100">
              <View className="h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
                <Ionicons name="image-outline" size={24} color="#3B82F6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="font-bold text-base text-slate-800">Choose Photo Gallery</Text>
                <Text className="text-xs font-semibold text-slate-400">
                  Upload an image scan or document photo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUploadModalVisible(false)}
              className="w-full items-center justify-center rounded-2xl bg-slate-100 py-3.5">
              <Text className="font-bold text-sm text-slate-700">Cancel</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Container>
  );
}
