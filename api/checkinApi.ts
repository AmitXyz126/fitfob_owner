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

export interface CheckinQueryParams {
  date?: string;
  startDate?: string;
  endDate?: string;
  from?: string;
  to?: string;
}

export const checkinApi = {
  /**
   * Fetch check-ins for the club owner with optional date/range filter
   * Endpoint: /club-owners/today-checkins
   */
  getTodayCheckins: async (params?: CheckinQueryParams): Promise<CheckinItemData[]> => {
    try {
      // 1. If params are provided, clean them so date does not conflict with range
      const cleanParams: any = {};
      if (params) {
        if (params.startDate) cleanParams.startDate = params.startDate;
        if (params.endDate) cleanParams.endDate = params.endDate;
        if (params.from) cleanParams.from = params.from;
        if (params.to) cleanParams.to = params.to;
        if (params.date && (!params.startDate || params.startDate === params.endDate)) {
          cleanParams.date = params.date;
        }
      }

      const hasParams = Object.keys(cleanParams).length > 0;
      let response: any = null;
      try {
        response = await api.get(ENDPOINTS.TODAY_CHECKINS, hasParams ? { params: cleanParams } : undefined);
      } catch (paramErr: any) {
        // If query with params failed, fallback to base endpoint
        console.warn('API error with params, falling back to base checkins:', paramErr?.message || paramErr);
        try {
          response = await api.get(ENDPOINTS.TODAY_CHECKINS);
        } catch (baseErr: any) {
          console.warn('Base checkins request failed or forbidden:', baseErr?.message || baseErr);
          return [];
        }
      }

      let list: CheckinItemData[] = [];
      if (response && Array.isArray(response.data)) {
        list = response.data;
      } else if (response && response.data && Array.isArray(response.data.data)) {
        list = response.data.data;
      }

      // If param response was unexpectedly empty, try base endpoint as safety fallback
      if (list.length === 0 && hasParams) {
        try {
          const fallbackRes = await api.get(ENDPOINTS.TODAY_CHECKINS);
          const fallbackList = Array.isArray(fallbackRes?.data)
            ? fallbackRes.data
            : fallbackRes?.data && Array.isArray(fallbackRes.data.data)
            ? fallbackRes.data.data
            : [];
          if (fallbackList.length > 0) {
            return fallbackList;
          }
        } catch {}
      }

      return list;
    } catch (error) {
      console.error('Error fetching today checkins:', error);
      return [];
    }
  },
};
