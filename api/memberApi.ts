import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface MemberListItem {
  clientDocumentId: string;
  name: string;
  selfieUrl?: string;
  status: 'active' | 'inactive' | 'expired' | string;
  plan?: string;
  totalCheckins?: number;
}

export interface MemberClientInfo {
  name: string;
  selfieUrl?: string;
  clientId: string;
  gender?: 'male' | 'female' | 'other' | string;
  phoneNumber?: string;
  totalCheckins?: number;
  totalVisits?: number;
}

export interface MemberMembership {
  membershipId: string;
  membershipStatus: 'active' | 'inactive' | 'expired' | string;
  startDate: string;
  endDate: string;
  commissionCharged?: boolean;
  plan: string;
  duration: number; // in months
}

export interface MemberCheckinItem {
  id?: string | number;
  checkinType?: 'trial' | 'membership' | string;
  checkinTime: string;
  checkoutTime?: string | null;
  status?: string;
  createdAt?: string;
  date?: string;
  time?: string;
  dayLabel?: string;
}

export interface MemberDetailsResponse {
  client: MemberClientInfo;
  memberships: MemberMembership[];
  totalCheckins?: number;
  totalVisits?: number;
  checkins?: MemberCheckinItem[];
}

export const memberApi = {
  /**
   * Fetch list of gym members
   * GET /api/member-list
   */
  getMemberList: async (): Promise<MemberListItem[]> => {
    try {
      const response = await api.get(ENDPOINTS.MEMBER_LIST);
      const raw = response.data;
      if (Array.isArray(raw)) {
        return raw;
      }
      if (Array.isArray(raw?.data)) {
        return raw.data;
      }
      return [];
    } catch (error: any) {
      console.warn('Failed to fetch member list:', error);
      throw error;
    }
  },

  /**
   * Fetch details of a single member
   * GET /api/member-list/:docId
   */
  getMemberDetails: async (docId: string): Promise<MemberDetailsResponse> => {
    try {
      const response = await api.get(ENDPOINTS.MEMBER_DETAILS(docId));
      const raw = response.data?.data || response.data;
      return {
        client: raw?.client || {
          name: '',
          clientId: '',
          gender: 'male',
          phoneNumber: '',
        },
        memberships: Array.isArray(raw?.memberships) ? raw.memberships : [],
        totalCheckins: raw?.totalCheckins ?? raw?.client?.totalCheckins ?? raw?.totalVisits ?? raw?.client?.totalVisits ?? (Array.isArray(raw?.checkins) ? raw.checkins.length : 0),
        totalVisits: raw?.totalVisits ?? raw?.client?.totalVisits ?? raw?.totalCheckins,
        checkins: Array.isArray(raw?.checkins) ? raw.checkins : [],
      };
    } catch (error: any) {
      console.warn(`Failed to fetch member details for docId ${docId}:`, error);
      throw error;
    }
  },
};
