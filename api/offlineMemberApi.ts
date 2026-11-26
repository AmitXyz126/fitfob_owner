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

export interface PendingApprovalApiItem {
  id?: string | number;
  documentId?: string;
  name?: string;
  clientName?: string;
  userName?: string;
  phone?: string;
  phoneNumber?: string;
  plan?: string;
  planName?: string;
  amount?: string | number;
  price?: string | number;
  status?: string;
  paymentMode?: string;
  createdAt?: string;
  requestedAt?: string;
  date?: string;
  timeAgo?: string;
  user?: any;
  client?: any;
  membershipPlan?: any;
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

  /**
   * Fetch list of pending approvals ("Pay at Gym" requests)
   * GET /api/club-owner/pending-approvals
   */
  getPendingApprovals: async (): Promise<PendingApprovalApiItem[]> => {
    try {
      console.log('📥 [offlineMemberApi.getPendingApprovals] Fetching from:', ENDPOINTS.PENDING_APPROVALS);
      const response = await api.get(ENDPOINTS.PENDING_APPROVALS);
      const raw = response.data;
      console.log('📥 [offlineMemberApi.getPendingApprovals] Response received:', Array.isArray(raw) ? `Array(${raw.length})` : typeof raw);

      if (Array.isArray(raw)) {
        return raw;
      }
      if (Array.isArray(raw?.data)) {
        return raw.data;
      }
      if (Array.isArray(raw?.pendingApprovals)) {
        return raw.pendingApprovals;
      }
      if (Array.isArray(raw?.requests)) {
        return raw.requests;
      }
      if (Array.isArray(raw?.items)) {
        return raw.items;
      }
      if (Array.isArray(raw?.approvals)) {
        return raw.approvals;
      }
      if (Array.isArray(raw?.result)) {
        return raw.result;
      }
      return [];
    } catch (error: any) {
      console.error('❌ [offlineMemberApi.getPendingApprovals] Error:', error?.response?.data || error?.message);
      throw error;
    }
  },

  /**
   * Decline / Reject a pending approval request
   * Endpoint: POST /api/club-owner/pending-approvals/:id/reject
   * Payload: { "reason": "Payment not received at reception" }
   * Response: { "success": true, "message": "Request declined and customer notified" }
   */
  declinePendingApproval: async (
    id: string | number,
    reason: string = 'Payment not received at reception'
  ): Promise<{ success: boolean; message: string; [key: string]: any }> => {
    const payload = { reason };
    try {
      const url = ENDPOINTS.PENDING_APPROVAL_REJECT(id);
      console.log('📤 [offlineMemberApi.declinePendingApproval] Calling POST:', url, 'with payload:', payload);
      try {
        const response = await api.post(url, payload);
        console.log('✅ [offlineMemberApi.declinePendingApproval] POST Success:', response.data);
        return response.data;
      } catch (postErr: any) {
        const status = postErr?.response?.status;
        if (status === 404 || status === 405) {
          console.log('⚠️ [offlineMemberApi.declinePendingApproval] POST returned', status, ', trying DELETE fallback:', ENDPOINTS.OFFLINE_MEMBER_BY_ID(id));
          const delRes = await api.delete(ENDPOINTS.OFFLINE_MEMBER_BY_ID(id), { data: payload });
          return delRes.data;
        }
        throw postErr;
      }
    } catch (error: any) {
      console.error('❌ [offlineMemberApi.declinePendingApproval] Error:', error?.response?.data || error?.message);
      throw error;
    }
  },

  /**
   * Approve / Accept a pending approval request ("Pay at Gym")
   * Endpoint: POST /api/club-owner/pending-approvals/:id/approve
   * Supported modes: "cash", "upi", "card", "pos", "bank_transfer"
   * Payload: { "paymentMode": "cash" }
   * Response: {
   *   "success": true,
   *   "message": "Membership activated successfully and Customer Entry QR unlocked!",
   *   "data": { ... }
   * }
   */
  approvePendingApproval: async (
    id: string | number,
    paymentMode: 'cash' | 'upi' | 'card' | 'pos' | 'bank_transfer' | string = 'cash'
  ): Promise<{ success: boolean; message: string; data?: any; [key: string]: any }> => {
    const payload = {
      paymentMode: paymentMode.toLowerCase(),
    };
    try {
      // Primary: POST /api/club-owner/pending-approvals/:id/approve
      const url = ENDPOINTS.PENDING_APPROVAL_APPROVE(id);
      console.log('📤 [offlineMemberApi.approvePendingApproval] Calling POST:', url, 'with payload:', payload);
      try {
        const response = await api.post(url, payload);
        console.log('✅ [offlineMemberApi.approvePendingApproval] POST Success:', response.data);
        return response.data;
      } catch (postErr: any) {
        const status = postErr?.response?.status;
        if (status === 404 || status === 405) {
          console.log('⚠️ [offlineMemberApi.approvePendingApproval] POST /approve returned', status, ', trying PUT fallback:', ENDPOINTS.PENDING_APPROVAL_BY_ID(id));
          try {
            const putRes = await api.put(ENDPOINTS.PENDING_APPROVAL_BY_ID(id), payload);
            return putRes.data;
          } catch (putErr: any) {
            console.log('⚠️ Trying POST /api/club-owner/pending-approvals with { id, paymentMode }');
            const postRootRes = await api.post(ENDPOINTS.PENDING_APPROVALS, { id, ...payload });
            return postRootRes.data;
          }
        }
        throw postErr;
      }
    } catch (error: any) {
      console.error('❌ [offlineMemberApi.approvePendingApproval] Error:', error?.response?.data || error?.message);
      throw error;
    }
  },
};

export default offlineMemberApi;
