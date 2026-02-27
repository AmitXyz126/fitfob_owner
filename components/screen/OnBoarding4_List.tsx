import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserDetail } from '@/hooks/useUserDetail'; 

interface Props {
  onAddMore: () => void;
}

export default function OnBoarding4_List({ onAddMore }: Props) {
  // Real data fetching from your hook
  const { userData } = useUserDetail();
 
  const uploadedDocs = userData?.governmentDocuments || [];

  return (
    <View className="flex-1 bg-white ">
      <Text className="mb-6 font-bold text-2xl text-[#111827]">Add Govt Document</Text>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {uploadedDocs.length > 0 ? (
          uploadedDocs.map((item: any) => (
            <View
              key={item.id || item._id}
              className="mb-3 flex-row items-center rounded-[20px] bg-[#F3F4F6] p-4">
              {/* PDF Icon Container */}
              <View className="items-center justify-center rounded-xl bg-white p-2 shadow-sm">
                <Ionicons name="document-text-outline" size={28} color="#6B7280" />
                <Text className="mt-[-4px] font-bold text-[8px] text-gray-500">
                  {item.fileType?.includes('pdf') ? 'PDF' : 'IMG'}
                </Text>
              </View>

              {/* Document Info */}
              <View className="ml-4 flex-1">
                <Text className="font-semibold text-base text-[#374151]" numberOfLines={1}>
                  {item.documentName || 'Untitled Document'}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <View className="mr-1 rounded-full bg-[#10B981] p-[2px]">
                    <Ionicons name="checkmark" size={10} color="white" />
                  </View>
                  <Text className="text-xs text-gray-400">
                    Uploaded:{' '}
                    {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                  </Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          /* Empty State if no docs */
          <View className="items-center py-10">
            <Text className="text-gray-400">No documents uploaded yet.</Text>
          </View>
        )}

        {/* Add Upload More Button */}
        <TouchableOpacity
          onPress={onAddMore}
          activeOpacity={0.7}
          className="mt-2 flex-row items-center justify-center rounded-[15px] border border-dashed border-gray-300 bg-[#F3F4F6] py-4">
          <Ionicons name="add" size={20} color="#6B7280" />
          <Text className="ml-2 font-semibold text-[#6B7280]">Add Upload more</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
