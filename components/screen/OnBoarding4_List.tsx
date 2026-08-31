import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserDetail } from '@/hooks/useUserDetail';
interface Props {
  onAddMore: () => void;
}

export default function OnBoarding4_List({ onAddMore }: Props) {
  const { documents, isDocsLoading, refetchDocs } = useUserDetail();

  // Auto-refresh when the screen mounts
  useEffect(() => {
    refetchDocs();
  }, []);

  const docList = documents?.documents || documents?.data || documents || [];

  const renderItem = ({ item, index }: { item: any; index: number }) => (
    <View
      key={item?.id || item?._id || index.toString()}
      className="mb-3 flex-row items-center rounded-[20px] bg-[#F3F4F6] p-4">
      <View className="items-center justify-center rounded-xl bg-white p-2 border border-slate-100">
        <Ionicons name="document-text-outline" size={28} color="#6B7280" />
        <Text className="mt-[-4px] font-bold text-[8px] uppercase text-gray-500">
          {item?.fileType?.includes('pdf') ? 'PDF' : 'IMG'}
        </Text>
      </View>

      <View className="ml-4 flex-1">
        <Text className="font-semibold text-base text-[#374151]" numberOfLines={1}>
          {item?.documentName || item?.name || 'Untitled Document'}
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

      <View className="pb-5">
        {docList.length === 0 ? (
          <View className="items-center py-10">
            <Text className="text-gray-400">No documents uploaded yet.</Text>
          </View>
        ) : (
          docList.map((item: any, index: number) => renderItem({ item, index }))
        )}

        <TouchableOpacity
          onPress={onAddMore}
          activeOpacity={0.7}
          className="mt-4 flex-row items-center justify-center rounded-[15px] border border-dashed border-gray-300 bg-[#F3F4F6] py-4">
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text className="ml-2 font-semibold text-[#6B7280]">Add More Documents</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
