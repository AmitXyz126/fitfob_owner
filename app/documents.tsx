import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Pressable,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Container } from '@/components/Container';

interface DocumentItem {
  id: string;
  name: string;
  date: string;
  size: string;
}

const mockDocuments: DocumentItem[] = [
  {
    id: '1',
    name: 'Business Registrantion.pdf',
    date: 'February 15, 2024',
    size: '1.2MB',
  },
  {
    id: '2',
    name: 'Market Analysis.docx',
    date: 'January 10, 2024',
    size: '850KB',
  },
  {
    id: '3',
    name: 'GST Certificate.pdf',
    date: 'March 5, 2024',
    size: '2.5MB',
  },
  {
    id: '4',
    name: 'User Feedback.xlsx',
    date: 'April 1, 2024',
    size: '350KB',
  },
  {
    id: '5',
    name: 'Sales Forecast.csv',
    date: 'February 20, 2024',
    size: '1.0MB',
  },
  {
    id: '6',
    name: 'Lease Agreements.pdf',
    date: 'February 20, 2024',
    size: '1.0MB',
  },
  {
    id: '7',
    name: 'Sales Forecast.csv',
    date: 'February 20, 2024',
    size: '1.0MB',
  },
  {
    id: '8',
    name: 'Sales Forecast.csv',
    date: 'February 20, 2024',
    size: '1.0MB',
  },
];

export default function DocumentsScreen() {
  const router = useRouter();
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  const handleOpenPopup = (doc: DocumentItem) => {
    setSelectedDoc(doc);
    setPopupVisible(true);
  };

  const handleClosePopup = () => {
    setPopupVisible(false);
    setSelectedDoc(null);
  };

  const renderDocumentItem = ({ item }: { item: DocumentItem }) => {
    const isPdf = item.name.toLowerCase().endsWith('.pdf');
    return (
      <View className="mb-4 flex-row items-center justify-between rounded-[8px] border border-[#E2E8F0] bg-white p-4">
        <View className="flex-row items-center flex-1 pr-3">
          {/* File Icon Container */}
          <View className="h-12 w-12 items-center justify-center rounded-[6px] bg-[#FFF0F2]">
            <Ionicons name="document-text" size={22} color="#F6163C" />
          </View>
          <View className="ml-3 flex-1">
            <Text className="font-sans font-bold text-[14px] leading-tight text-[#1C1C1C]" numberOfLines={1}>
              {item.name}
            </Text>
            <Text className="font-sans text-[11px] font-medium text-slate-400 mt-1">
              {item.date}  |  {item.size}
            </Text>
          </View>
        </View>

        {/* Triple Dot Button */}
        <TouchableOpacity
          onPress={() => handleOpenPopup(item)}
          className="h-9 w-9 items-center justify-center rounded-[8px] bg-[#F1F5F9] active:bg-[#E2E8F0]"
        >
          <Ionicons name="ellipsis-horizontal" size={18} color="#475569" />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Container>
      {/* Header */}
      <View className="flex-row items-center justify-between py-3 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-full active:bg-gray-100"
        >
          <Ionicons name="chevron-back" size={24} color="#1C1C1C" />
        </TouchableOpacity>

        <Text className="font-sans font-bold text-[18px] text-[#697281] text-center flex-1 mr-10">
          Documents
        </Text>
      </View>

      {/* Main Section Header */}
      <View className="mb-4">
        <Text className="font-sans font-extrabold text-[19px] text-[#1C1C1C]">
          Uploaded Documents
        </Text>
      </View>

      {/* Document List */}
      <FlatList
        data={mockDocuments}
        renderItem={renderDocumentItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* Floating Bottom Upload Button */}
      <View className="absolute bottom-6 left-4 right-4 bg-white py-2">
        <TouchableOpacity
          activeOpacity={0.8}
          className="flex-row items-center justify-center rounded-2xl bg-[#F6163C] py-4 shadow-md"
        >
          <Ionicons name="add" size={20} color="#FFF" />
          <Text className="font-sans font-bold text-[16px] text-white ml-1">
            Upload Document
          </Text>
        </TouchableOpacity>
      </View>

      {/* Popup Bottom Sheet Modal */}
      <Modal
        visible={popupVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleClosePopup}
      >
        <Pressable
          onPress={handleClosePopup}
          className="flex-1 bg-black/40 justify-end"
        >
          <Pressable className="bg-white rounded-t-[32px] p-6 shadow-2xl">
            {/* Handle Bar */}
            <View className="w-12 h-1.5 bg-slate-200 rounded-full align-self-center mx-auto mb-6" />

            {/* File Info */}
            <Text className="font-sans font-bold text-[18px] text-[#1C1C1C]">
              {selectedDoc?.name}
            </Text>
            <Text className="font-sans text-[12px] font-semibold text-slate-400 mt-1 mb-6">
              {selectedDoc?.date}  |  {selectedDoc?.size}
            </Text>

            {/* Options */}
            <TouchableOpacity
              onPress={handleClosePopup}
              className="flex-row items-center py-4 border-b border-slate-100 active:opacity-75"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                <Ionicons name="arrow-down-circle-outline" size={22} color="#475569" />
              </View>
              <Text className="font-sans font-bold text-[15px] text-[#1C1C1C] ml-3">
                Download Document
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClosePopup}
              className="flex-row items-center py-4 border-b border-slate-100 active:opacity-75"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-50">
                <Ionicons name="eye-outline" size={22} color="#475569" />
              </View>
              <Text className="font-sans font-bold text-[15px] text-[#1C1C1C] ml-3">
                View Document
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleClosePopup}
              className="flex-row items-center py-4 active:opacity-75"
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-red-50">
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </View>
              <Text className="font-sans font-bold text-[15px] text-red-500 ml-3">
                Delete
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </Container>
  );
}
