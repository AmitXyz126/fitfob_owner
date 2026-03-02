import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserDetail } from '@/hooks/useUserDetail';
import { useIsFocused } from '@react-navigation/native';

interface Props {
  onAddMore: () => void;
}

export default function OnBoarding4_List({ onAddMore }: Props) {
  const isFocused = useIsFocused();
  const { documents, isDocsLoading, refetchDocs } = useUserDetail();

  // Auto-refresh when the screen comes into focus
  useEffect(() => {
    if (isFocused) {
      refetchDocs();
    }
  }, [isFocused]);

  const docList = documents?.documents || documents?.data || documents || [];

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View
      key={item?.id || item?._id || index.toString()}
      className="mb-3 flex-row items-center rounded-[20px] bg-[#F3F4F6] p-4">
      <View className="items-center justify-center rounded-xl bg-white p-2 shadow-sm">
        <Ionicons name="document-text-outline" size={28} color="#6B7280" />
        <Text className="mt-[-4px] font-bold text-[8px] text-gray-500 uppercase">
          {item?.fileType?.includes('pdf') ? 'PDF' : 'IMG'}
        </Text>
      </View>

      <View className="ml-4 flex-1">
        <Text className="font-semibold text-base text-[#374151]" numberOfLines={1}>
          {item?.documentName || 'Untitled Document'}
        </Text>
        <View className="mt-1 flex-row items-center">
          <View className="mr-1 rounded-full bg-[#10B981] p-[2px]">
            <Ionicons name="checkmark" size={10} color="white" />
          </View>
          <Text className="text-xs text-gray-400">
            Uploaded: {item?.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
      </View>
    </View>
  );

  if (isDocsLoading && !documents) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#F6163C" />
        <Text className="mt-4 text-gray-400">Loading documents...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white">
      <Text className="mb-6 font-bold text-2xl text-[#111827]">Uploaded Documents</Text>

      <FlatList
        data={docList}
        renderItem={renderItem}
        keyExtractor={(item, index) => item?.id?.toString() || item?._id?.toString() || index.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
        ListEmptyComponent={
          <View className="items-center py-10">
            <Text className="text-gray-400">No documents uploaded yet.</Text>
          </View>
        }
        refreshControl={
          <RefreshControl refreshing={isDocsLoading} onRefresh={refetchDocs} tintColor="#F6163C" />
        }
        ListFooterComponent={
          <TouchableOpacity
            onPress={onAddMore}
            activeOpacity={0.7}
            className="mt-2 flex-row items-center justify-center rounded-[15px] border border-dashed border-gray-300 bg-[#F3F4F6] py-4">
            <Ionicons name="add" size={20} color="#6B7280" />
            <Text className="ml-2 font-semibold text-[#6B7280]">Add More Documents</Text>
          </TouchableOpacity>
        }
      />
    </View>
  );
}
