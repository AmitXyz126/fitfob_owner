import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface CheckinItemData {
  id: number | string;
  documentId?: string;
  clientId: string;
  clientName: string;
  clientEmail?: string;
  selfieUploadUrl: string;
  checkinTime: string;
  subscriptionType?: string;
}

export interface TodayCheckinsResponse {
  data: CheckinItemData[];
}

export const checkinApi = {
  /**
   * Fetch today's check-ins for the club owner
   * Endpoint: /club-owners/today-checkins
   */
  getTodayCheckins: async (): Promise<CheckinItemData[]> => {
    try {
      const response = await api.get(ENDPOINTS.TODAY_CHECKINS);
      if (Array.isArray(response.data)) {
        return response.data;
      }
      if (response.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching today checkins:', error);
      throw error;
    }
  },
};
