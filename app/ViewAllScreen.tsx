import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, TextInput, Platform, Modal, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Container } from '@/components/Container';

const ALL_CHECKINS = [
  {
    id: '1',
    name: 'Tina Sharma',
    time: '10 minutes ago',
    type: 'Standard',
    image: 'https://i.pravatar.cc/150?u=tina',
    color: '#94A3B8',
    verified: true,
  },
  {
    id: '2',
    name: 'Amelia Thomas',
    time: '1 hour and 10 minutes ago',
    type: 'Premium',
    image: 'https://i.pravatar.cc/150?u=amelia',
    color: '#EAB308',
    verified: true,
  },
  {
    id: '3',
    name: 'Sophia Lee',
    time: '35 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=sophia',
    color: '#F6163C',
    verified: true,
  },
  {
    id: '4',
    name: 'Liam Brown',
    time: '20 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=liam',
    color: '#F6163C',
    verified: true,
  },
  {
    id: '5',
    name: 'Noah Martinez',
    time: '45 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=noah1',
    color: '#F6163C',
    verified: true,
  },
  {
    id: '6',
    name: 'Noah Martinez',
    time: '45 minutes ago',
    type: 'Luxury',
    image: 'https://i.pravatar.cc/150?u=noah2',
    color: '#F6163C',
    verified: true,
  },
];

const ViewAllScreen = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const filteredData = ALL_CHECKINS.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Container>
      {/* --- HEADER --- */}
      <View
        style={{ paddingTop: Platform.OS === 'ios' ? 10 : 20 }}
        className="mb-4 flex-row items-center justify-between">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>

        <Text className="font-medium text-base leading-6 text-[#697281]">Recent Check-ins</Text>

        <TouchableOpacity className="p-2">
          <Ionicons name="notifications" size={24} color="#F6163C" />
        </TouchableOpacity>
      </View>

      {/* --- SEARCH BAR --- */}
      <View className="mb-6">
        <View className="flex-row items-center rounded-full border border-[#E5E7EB] bg-white px-4 py-1">
          <TextInput
            placeholder="Search Members"
            placeholderTextColor="#94A3B8"
            className="h-11 flex-1 font-medium text-slate-600"
            value={search}
            onChangeText={setSearch}
          />
          <TouchableOpacity className="my-1 rounded-full bg-[#F6163C] p-2.5">
            <Ionicons name="search" size={18} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* --- RECENT CHECK-INS LIST --- */}
      <FlatList
        data={filteredData}
        keyExtractor={(item, index) => item.id + index}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setSelectedMember(item)}
            className="mb-4 flex-row items-center rounded-[8px] border border-[#E5E7EB] bg-white p-3">
            {/* User Avatar */}
            <Image source={{ uri: item.image }} className="h-14 w-14 rounded-2xl bg-slate-100" />

            {/* User Details */}
            <View className="ml-4 flex-1">
              <View className="flex-row items-center">
                <Text className="mr-1 font-bold text-[15px] text-slate-900">{item.name}</Text>
                {item.verified && (
                  <Image className="h-4 w-4" source={require('../assets/images/tick.png')} />
                )}
              </View>
              <Text className="mt-0.5 font-medium text-xs text-slate-400">{item.time}</Text>
            </View>

            {/* Membership Badge with Image */}
            <View
              style={{
                backgroundColor: `${item.color}15`,
                borderColor: `${item.color}25`,
                width: 90,
              }}
              className="flex-row items-center justify-center  rounded-full border py-1.5">
              <Image
                source={
                  item.type === 'Luxury'
                    ? require('../assets/images/luxury.png')
                    : item.type === 'Premium'
                      ? require('../assets/images/premium.png')
                      : require('../assets/images/standardicon.png')
                }
                style={{ width: 14, height: 14 }}
                resizeMode="contain"
              />
              <Text style={{ color: item.color }} className="ml-1.5 font-bold text-[11px]">
                {item.type}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* --- MEMBER DETAIL BOTTOM SHEET --- */}
      <Modal
        visible={!!selectedMember}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMember(null)}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedMember(null)} />
          <View style={styles.bottomSheet}>
            {/* Drag handle */}
            <View style={styles.dragHandle} />
            
            {/* Header with Close */}
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Member Profile</Text>
              <TouchableOpacity onPress={() => setSelectedMember(null)} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedMember && (
              <View style={styles.sheetContent}>
                {/* Top row: Avatar & basic info */}
                <View style={styles.profileHeader}>
                  <Image source={{ uri: selectedMember.image }} style={styles.largeAvatar} />
                  <View style={styles.profileMeta}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text style={styles.profileName}>{selectedMember.name}</Text>
                      {selectedMember.verified && (
                        <Image style={styles.checkIcon} source={require('../assets/images/tick.png')} />
                      )}
                    </View>
                    <Text style={styles.profileTime}>Checked in: {selectedMember.time}</Text>
                    
                    {/* Badge */}
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor: `${selectedMember.color}15`,
                          borderColor: `${selectedMember.color}25`,
                        }
                      ]}
                    >
                      <Image
                        source={
                          selectedMember.type === 'Luxury'
                            ? require('../assets/images/luxury.png')
                            : selectedMember.type === 'Premium'
                              ? require('../assets/images/premium.png')
                              : require('../assets/images/standardicon.png')
                        }
                        style={{ width: 12, height: 12 }}
                        resizeMode="contain"
                      />
                      <Text style={[styles.badgeText, { color: selectedMember.color }]}>
                        {selectedMember.type} Member
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Detailed Parameters */}
                <View style={styles.detailsList}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="card-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Member ID</Text>
                    </View>
                    <Text style={styles.detailValue}>FF-MEMBER-00{selectedMember.id}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="mail-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Email Address</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {selectedMember.name.toLowerCase().replace(/\s+/g, '')}@gmail.com
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="phone-portrait-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Phone Number</Text>
                    </View>
                    <Text style={styles.detailValue}>+91 98765 {43210 + parseInt(selectedMember.id)}</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="calendar-outline" size={18} color="#64748B" />
                      <Text style={styles.detailLabel}>Renewal Date</Text>
                    </View>
                    <Text style={styles.detailValue}>15 Dec 2026</Text>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailLeft}>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#10B981" />
                      <Text style={[styles.detailLabel, { color: '#10B981', fontWeight: 'bold' }]}>Status</Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusText}>Active</Text>
                    </View>
                  </View>
                </View>

                {/* Bottom button */}
                <View style={styles.footerBtns}>
                  <TouchableOpacity
                    onPress={() => setSelectedMember(null)}
                    style={styles.primaryBtn}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.primaryBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </Container>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 15,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  dragHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 15,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeBtn: {
    padding: 4,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  sheetContent: {
    marginTop: 5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
  },
  profileMeta: {
    marginLeft: 18,
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    marginRight: 6,
  },
  checkIcon: {
    width: 16,
    height: 16,
    resizeMode: 'contain',
  },
  profileTime: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 20,
  },
  detailsList: {
    gap: 15,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#E8F8F5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: 'bold',
  },
  footerBtns: {
    marginTop: 30,
  },
  primaryBtn: {
    backgroundColor: '#F6163C',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F6163C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});

export default ViewAllScreen;
