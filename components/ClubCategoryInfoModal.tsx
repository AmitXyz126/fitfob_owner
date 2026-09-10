import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ClubCategoryInfoModalProps {
  visible: boolean;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  onClose: () => void;
}

export const ClubCategoryInfoModal: React.FC<ClubCategoryInfoModalProps> = ({
  visible,
  selectedCategory = 'Luxury',
  onSelectCategory,
  onClose,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          justifyContent: 'flex-end',
        }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: '#FFFFFF',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: Math.max(insets.bottom, 16) + 12,
            maxHeight: '88%',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 10,
          }}>
          {/* Drag Handle */}
          <View className="mb-4 h-1.5 w-12 self-center rounded-full bg-slate-200" />

          {/* Header */}
          <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
            <View className="flex-1 pr-2">
              <Text className="font-bold text-xl text-slate-900">Club Category Guide</Text>
              <Text className="text-xs text-slate-500 mt-0.5">
                Select the category that best matches your facilities & standards.
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              className="h-8 w-8 rounded-full bg-slate-100 items-center justify-center">
              <Ionicons name="close" size={18} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mt-3">
            {/* LUXURY CATEGORY CARD */}
            <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50/40 p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center space-x-2">
                  <View className="h-8 w-8 rounded-xl bg-amber-500/15 items-center justify-center">
                    <Ionicons name="diamond" size={18} color="#D97706" />
                  </View>
                  <View className="ml-2">
                    <Text className="font-bold text-[16px] text-slate-900">Luxury Club</Text>
                    <Text className="text-[11px] font-medium text-amber-700">5-Star & Boutique Experience</Text>
                  </View>
                </View>
                {selectedCategory === 'Luxury' ? (
                  <View className="rounded-full bg-amber-500 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-white">SELECTED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      onSelectCategory?.('Luxury');
                      onClose();
                    }}
                    activeOpacity={0.7}
                    className="rounded-full bg-white border border-amber-300 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-amber-700">Select Luxury</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-xs text-slate-600 leading-4 mb-3">
                Reserved for elite, high-end fitness clubs offering a 5-star ambiance, top-tier imported biomechanical machinery, and hospitality-grade services.
              </Text>

              <View className="rounded-xl bg-white/95 p-3 border border-amber-100">
                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={15} color="#D97706" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Top-Tier Equipment</Text>
                    <Text className="text-[11px] text-slate-500">Premium imported brands (e.g., Technogym, Life Fitness Elevation, Eleiko, Hammer Strength).</Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={15} color="#D97706" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Elite Wellness & Spa</Text>
                    <Text className="text-[11px] text-slate-500">Steam, Sauna, Jacuzzi / Ice Bath, Luxury Towel Service, Locker with Valet & Designer Showers.</Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={15} color="#D97706" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Premium Ambiance & Facilities</Text>
                    <Text className="text-[11px] text-slate-500">Boutique interior design, acoustic soundproofing, cafe / smoothie bar & dedicated valet parking.</Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={15} color="#D97706" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Master Trainers & Staff</Text>
                    <Text className="text-[11px] text-slate-500">Internationally certified master trainers, dedicated nutritionists & in-house physiotherapists.</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* PREMIUM CATEGORY CARD */}
            <View className="mb-4 rounded-2xl border border-blue-200 bg-blue-50/40 p-4">
              <View className="flex-row items-center justify-between mb-2">
                <View className="flex-row items-center space-x-2">
                  <View className="h-8 w-8 rounded-xl bg-blue-500/15 items-center justify-center">
                    <Ionicons name="star" size={18} color="#2563EB" />
                  </View>
                  <View className="ml-2">
                    <Text className="font-bold text-[16px] text-slate-900">Premium Club</Text>
                    <Text className="text-[11px] font-medium text-blue-700">Commercial & High Standard</Text>
                  </View>
                </View>
                {selectedCategory === 'Premium' ? (
                  <View className="rounded-full bg-blue-600 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-white">SELECTED</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      onSelectCategory?.('Premium');
                      onClose();
                    }}
                    activeOpacity={0.7}
                    className="rounded-full bg-white border border-blue-300 px-2.5 py-0.5">
                    <Text className="text-[10px] font-bold text-blue-700">Select Premium</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text className="text-xs text-slate-600 leading-4 mb-3">
                Ideal for established, well-equipped commercial fitness clubs offering high-standard workout facilities and clean modern amenities.
              </Text>

              <View className="rounded-xl bg-white/95 p-3 border border-blue-100">
                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={15} color="#2563EB" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Commercial Grade Equipment</Text>
                    <Text className="text-[11px] text-slate-500">Complete range of heavy-duty strength and cardio equipment (Matrix, Precor, Jerai, Being Strong).</Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={15} color="#2563EB" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Clean Modern Facilities</Text>
                    <Text className="text-[11px] text-slate-500">Fully air-conditioned workout floors, clean shower and locker facilities, parking & high-speed Wi-Fi.</Text>
                  </View>
                </View>

                <View className="flex-row items-start mb-2">
                  <Ionicons name="checkmark-circle" size={15} color="#2563EB" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Group Classes & Studio</Text>
                    <Text className="text-[11px] text-slate-500">Dedicated studio area for group sessions (Zumba, Yoga, HIIT, Aerobics or Cross-training).</Text>
                  </View>
                </View>

                <View className="flex-row items-start">
                  <Ionicons name="checkmark-circle" size={15} color="#2563EB" style={{ marginTop: 1, marginRight: 6 }} />
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-slate-800">Certified Floor Trainers</Text>
                    <Text className="text-[11px] text-slate-500">Qualified fitness instructors available for workout guidance, form correction & personal training.</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Pro Tip */}
            <View className="mb-4 rounded-xl bg-slate-100 p-3 flex-row items-center">
              <Ionicons name="bulb-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <Text className="text-[11px] text-slate-600 flex-1">
                Accurate categorization helps members know what to expect and ensures higher conversion for your membership plans.
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Button */}
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            className="mt-2 w-full py-3.5 rounded-2xl bg-[#F6163C] items-center justify-center">
            <Text className="font-bold text-white text-[15px]">Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default ClubCategoryInfoModal;
