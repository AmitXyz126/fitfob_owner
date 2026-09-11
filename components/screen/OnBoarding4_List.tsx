import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  StatusBar,
  Platform,
  Linking,
  Image,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WebView } from 'react-native-webview';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';

interface Props {
  onAddMore: () => void;
  onNext?: () => void;
}

export default function OnBoarding4_List({ onAddMore, onNext }: Props) {
  const { documents, isDocsLoading, isDocsFetching, refetchDocs } = useUserDetail();
  const { user } = useAuthStore();
  const userKey = user?.id || user?.email || 'guest';
  const STORAGE_KEY = `@onboarding_documents_cache_${userKey}`;

  const [cachedDocs, setCachedDocs] = useState<any>(null);
  const [previewDoc, setPreviewDoc] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);

  // Load from local storage immediately on mount for 0ms instant display
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) {
        try {
          setCachedDocs(JSON.parse(saved));
        } catch (e) {}
      }
    });
  }, [STORAGE_KEY]);

  // Keep local storage synced with TanStack query data
  useEffect(() => {
    if (documents) {
      setCachedDocs(documents);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(documents)).catch(console.log);
    }
  }, [documents, STORAGE_KEY]);

  // Only refetch if neither TanStack query nor local storage has documents
  useEffect(() => {
    if (!documents && !cachedDocs) {
      refetchDocs();
    }
  }, []);

  const activeDocs = documents || cachedDocs;
  const docList =
    activeDocs?.documents ||
    activeDocs?.data ||
    (Array.isArray(activeDocs) ? activeDocs : []);

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

  if (isDocsLoading && docList.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-white py-16">
        <ActivityIndicator size="large" color="#F6163C" />
        <Text className="mt-4 font-semibold text-slate-400">Loading documents...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white px-0.5">
      {/* Header */}
      <View className="mb-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-bold text-2xl text-slate-900">Uploaded Documents</Text>
          <View className="flex-row items-center rounded-full bg-emerald-50 px-2.5 py-1 border border-emerald-200">
            <Ionicons name="shield-checkmark" size={13} color="#10B981" />
            <Text className="ml-1 text-xs font-bold text-emerald-700">
              {docList.length} Verified
            </Text>
            {isDocsFetching && (
              <ActivityIndicator
                size="small"
                color="#10B981"
                style={{ marginLeft: 6, transform: [{ scale: 0.65 }] }}
              />
            )}
          </View>
        </View>
        <Text className="mt-1 text-sm text-slate-500 font-medium">
          Review your verified government documents before proceeding to club photos.
        </Text>
      </View>

      {/* Document List */}
      <View className="pb-4">
        {docList.length === 0 ? (
          <View className="items-center py-12 rounded-2xl bg-slate-50 border border-slate-200 mb-4">
            <Ionicons name="document-text-outline" size={48} color="#94A3B8" />
            <Text className="mt-3 font-semibold text-slate-600">No documents uploaded yet.</Text>
            <Text className="text-xs text-slate-400 mt-1">
              Please upload at least one verified government document.
            </Text>
          </View>
        ) : (
          docList.map((item: any, index: number) => {
            const isPdf = item?.fileType?.includes('pdf') || item?.type?.includes('pdf');
            return (
              <TouchableOpacity
                key={item?.id || item?._id || index.toString()}
                onPress={() => handleOpenPreview(item)}
                activeOpacity={0.8}
                className="mb-3.5 flex-row items-center rounded-2xl bg-white border border-slate-200 p-3.5 shadow-sm">
                <View className="items-center justify-center rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                  <Ionicons
                    name={isPdf ? 'document-text' : 'image'}
                    size={24}
                    color="#F6163C"
                  />
                  <Text className="mt-[-2px] font-bold text-[8px] uppercase text-slate-500">
                    {isPdf ? 'PDF' : 'IMG'}
                  </Text>
                </View>

                <View className="ml-3 flex-1">
                  <View className="flex-row items-center gap-1.5 flex-wrap">
                    <Text className="font-bold text-sm text-slate-800" numberOfLines={1}>
                      {item?.documentName || item?.name || 'Government Document'}
                    </Text>
                    <View className="flex-row items-center bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <Ionicons name="shield-checkmark" size={10} color="#10B981" />
                      <Text className="text-[10px] font-bold text-emerald-700 ml-1">Verified</Text>
                    </View>
                  </View>
                  <View className="mt-1 flex-row items-center">
                    <Ionicons name="checkmark-circle" size={12} color="#10B981" />
                    <Text className="text-xs text-slate-400 ml-1">
                      Uploaded:{' '}
                      {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
                    </Text>
                  </View>
                </View>

                <View className="ml-2 flex-row items-center rounded-xl bg-rose-50 px-3 py-1.5 border border-rose-100">
                  <Ionicons name="eye-outline" size={14} color="#F6163C" />
                  <Text className="ml-1 text-xs font-bold text-[#F6163C]">View</Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Add More Documents Button */}
        <TouchableOpacity
          onPress={onAddMore}
          activeOpacity={0.7}
          className="mt-2 flex-row items-center justify-center rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/50 py-4">
          <Ionicons name="add-circle-outline" size={20} color="#F6163C" />
          <Text className="ml-2 font-bold text-sm text-[#F6163C]">
            + Add Another Document (Camera / File)
          </Text>
        </TouchableOpacity>
      </View>

      {/* DOCUMENT PREVIEW MODAL */}
      <Modal
        visible={previewVisible}
        transparent={false}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setPreviewVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#0F172A' }}>
          <StatusBar barStyle="light-content" backgroundColor="#0F172A" translucent={true} />
          {/* Header Bar */}
          <View
            style={{
              paddingTop:
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight ? StatusBar.currentHeight + 12 : 36)
                  : 44,
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
    </View>
  );
}
