import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface PolicySectionProps {
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  points?: string[];
}

const PolicySection = ({ iconName, title, description, points }: PolicySectionProps) => (
  <View className="mb-6 rounded-2xl border border-[#F3F4F6] bg-white p-5 shadow-sm">
    <View className="mb-3 flex-row items-center">
      <View className="mr-3 items-center justify-center rounded-xl bg-[#E23744]/10 h-10 w-10">
        <Ionicons name={iconName} size={20} color="#E23744" />
      </View>
      <Text className="flex-1 font-sans font-bold text-lg text-[#1C1C1C]">
        {title}
      </Text>
    </View>
    <Text className="font-sans text-sm leading-6 text-[#6B7280]">
      {description}
    </Text>
    {points && points.length > 0 && (
      <View className="mt-4 border-t border-[#F3F4F6] pt-3">
        {points.map((point, index) => (
          <View key={index} className="mb-2 flex-row items-start">
            <Ionicons name="checkmark-circle-outline" size={16} color="#E23744" className="mr-2 mt-0.5" />
            <Text className="flex-1 font-sans text-sm leading-5 text-[#6B7280]">
              {point}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

export default function PrivacyPolicy() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="flex-row items-center border-b border-[#F3F4F6] px-4 py-4">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="mr-4 rounded-xl border border-[#E5E7EB] p-2"
        >
          <Ionicons name="chevron-back" size={20} color="#1C1C1C" />
        </TouchableOpacity>
        <Text className="font-sans font-bold text-xl text-[#1C1C1C]">
          Privacy Policy
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 }}
      >
        {/* Intro */}
        <View className="mb-6">
          <View className="mb-2 self-start rounded-full bg-[#E23744]/10 px-3 py-1">
            <Text className="font-semibold text-xs text-[#E23744]">
              Last Updated: July 2026
            </Text>
          </View>
          <Text className="font-sans font-bold text-2xl text-[#1C1C1C]">
            We Value Your Privacy
          </Text>
          <Text className="mt-2 font-sans text-sm leading-5 text-[#6B7280]">
            At FitFob, we are committed to protecting the personal and professional data of our club partners. This Privacy Policy details how we collect, process, and protect your information.
          </Text>
        </View>

        {/* Policy Sections */}
        <PolicySection
          iconName="document-text-outline"
          title="Information We Collect"
          description="We collect data to set up and manage your fitness club on our platform. This includes registration documents, contact details, and location specifics."
          points={[
            'Personal identification (Name, Email, Phone number).',
            'Business profile details (Gym name, Address, Amenities, Timing).',
            'Financial data (Bank details for payout processing).',
            'Device & Network usage data.'
          ]}
        />

        <PolicySection
          iconName="settings-outline"
          title="How We Use Your Data"
          description="Your details are used exclusively to operate the partner services, calculate scheduling, and facilitate secure financial transactions."
          points={[
            'Verifying the ownership and security of gym spaces.',
            'Displaying accurate gym slots to FitFob users.',
            'Directly crediting your payouts safely to your bank.',
            'Sending system updates and security alerts.'
          ]}
        />

        <PolicySection
          iconName="share-social-outline"
          title="Information Sharing"
          description="We do not sell your personal information. Data is shared only with partners necessary to deliver services, such as payment gateways, maps API, or legal regulatory bodies."
          points={[
            'Gym photos, address, and ratings are displayed to users.',
            'Encrypted bank details are shared with verified gateway providers.',
            'Legal disclosures where required by local authorities.'
          ]}
        />

        <PolicySection
          iconName="shield-checkmark-outline"
          title="Data Security"
          description="We employ high-grade industry-standard security protocols to prevent unauthorized access, theft, or modification of owner credentials and documents."
        />

        <PolicySection
          iconName="person-outline"
          title="Your Rights & Controls"
          description="You maintain full authority to edit your club information, update bank accounts, or terminate your listing partnership."
          points={[
            'Request deletion of account and related files.',
            'Modify schedules, pricing, and contact details anytime.',
            'Opt-out of promotional communications.'
          ]}
        />
      </ScrollView>

      {/* Done Button */}
      <View className="border-t border-[#F3F4F6] px-5 py-4">
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          className="h-14 w-full items-center justify-center rounded-2xl bg-[#E23744]"
        >
          <Text className="font-bold text-base text-white">Understood</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
