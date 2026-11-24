import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface CreateOfflineMemberPayload {
  name: string;
  phoneNumber: string; // 10-digit phone number, e.g. "7018235911"
  planId: string; // e.g. "monthly" | "three_months" | "six_months" | "twelve_months"
  startDate: string; // YYYY-MM-DD, e.g. "2026-11-10"
  endDate: string; // YYYY-MM-DD, e.g. "2026-12-10"
  channel: 'both' | 'whatsapp' | 'sms' | string;
}

export interface OfflineMemberItem {
  id?: string | number;
  documentId?: string;
  name: string;
  phoneNumber?: string;
  phone?: string;
  planName?: string;
  planId?: string;
  plan?: string;
  startDate?: string;
  endDate?: string;
  claimStatus?: 'claimed' | 'unclaimed' | string;
  subscriptionStatus?: 'active' | string;
  statusBadge?: string;
  statusColor?: string;
  isExpiringSoon?: boolean;
  isExpired?: boolean;
  isUnclaimed?: boolean;
  channel?: string;
  status?: string;
  createdAt?: string;
  [key: string]: any;
}

export interface CreateOfflineMemberResponse {
  message?: string;
  data?: any;
  status?: boolean | string;
  [key: string]: any;
}

export const offlineMemberApi = {
  /**
   * Fetch list of offline members
   * GET /api/club-owner/offline-members
   */
  getOfflineMembers: async (): Promise<OfflineMemberItem[]> => {
    try {
      console.log('📥 [offlineMemberApi.getOfflineMembers] Fetching from:', ENDPOINTS.OFFLINE_MEMBERS);
      const response = await api.get(ENDPOINTS.OFFLINE_MEMBERS);
      const raw = response.data;
      console.log('📥 [offlineMemberApi.getOfflineMembers] Response received:', Array.isArray(raw) ? `Array(${raw.length})` : typeof raw);

      if (Array.isArray(raw)) {
        return raw;
      }
      if (Array.isArray(raw?.data)) {
        return raw.data;
      }
      if (Array.isArray(raw?.members)) {
        return raw.members;
      }
      if (Array.isArray(raw?.offlineMembers)) {
        return raw.offlineMembers;
      }
      return [];
    } catch (error: any) {
      console.error('❌ [offlineMemberApi.getOfflineMembers] Error:', error?.response?.data || error?.message);
      throw error;
    }
  },

  /**
   * Create an offline member invite
   * POST /api/club-owner/offline-members
   */
  createOfflineMember: async (
    payload: CreateOfflineMemberPayload
  ): Promise<CreateOfflineMemberResponse> => {
    try {
      console.log('📤 [offlineMemberApi.createOfflineMember] Submitting payload:', JSON.stringify(payload, null, 2));
      const response = await api.post(ENDPOINTS.OFFLINE_MEMBERS, payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ [offlineMemberApi.createOfflineMember] Error:', error?.response?.data || error?.message);
      throw error;
    }
  },
};

export default offlineMemberApi;
