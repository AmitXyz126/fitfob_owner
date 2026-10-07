import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface HolidayItemData {
  id: number | string;
  documentId?: string;
  title: string;
  closureType: 'full_day' | 'partial_day' | string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endtime?: string;
  endTime?: string;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: any;
}

export interface CreateHolidayPayload {
  title: string;
  closureType: 'full_day' | 'partial_day' | string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endtime?: string;
  endTime?: string;
}

/**
 * Normalizes single holiday entry from Strapi v4/v5 or custom response
 */
export const normalizeHolidayItem = (item: any): HolidayItemData => {
  if (!item) return {} as HolidayItemData;
  const attrs = item.attributes || item;

  return {
    id: item.id || item.documentId || attrs.id || attrs.documentId || Math.random().toString(),
    documentId: item.documentId || attrs.documentId || (item.id ? String(item.id) : undefined),
    title: attrs.title || item.title || '',
    closureType: attrs.closureType || item.closureType || 'full_day',
    startDate: attrs.startDate || item.startDate || '',
    endDate: attrs.endDate || item.endDate || attrs.startDate || item.startDate || '',
    startTime: attrs.startTime || item.startTime || '00:00:00.000',
    endtime: attrs.endtime || attrs.endTime || item.endtime || item.endTime || '23:59:59.000',
    endTime: attrs.endTime || attrs.endtime || item.endTime || item.endtime || '23:59:59.000',
    createdAt: attrs.createdAt || item.createdAt,
    updatedAt: attrs.updatedAt || item.updatedAt,
    ...attrs,
  };
};

export const holidayApi = {
  /**
   * Fetch all holidays / closures for the club
   * Endpoint: GET /api/holidays
   */
  getHolidays: async (): Promise<HolidayItemData[]> => {
    try {
      const response = await api.get(ENDPOINTS.HOLIDAYS);
      const resData = response.data;

      let list: any[] = [];
      if (Array.isArray(resData)) {
        list = resData;
      } else if (resData && Array.isArray(resData.data)) {
        list = resData.data;
      } else if (resData?.data && typeof resData.data === 'object') {
        list = [resData.data];
      }

      return list.map(normalizeHolidayItem);
    } catch (error) {
      console.error('Error fetching holidays:', error);
      throw error;
    }
  },

  /**
   * Create a new holiday / closure
   * Endpoint: POST /api/holidays
   * Payload:
   * {
   *   "data": {
   *     "title": "gandhi jayanti",
   *     "closureType": "full_day" | "partial_day",
   *     "startDate": "2026-10-02",
   *     "endDate": "2026-10-02",
   *     "startTime": "14:00:00.000",
   *     "endtime": "16:00:00.000"
   *   }
   * }
   */
  createHoliday: async (holidayData: CreateHolidayPayload): Promise<HolidayItemData> => {
    try {
      const normalizedClosureType =
        holidayData.closureType === 'partial' || holidayData.closureType === 'partial_day'
          ? 'partial_day'
          : 'full_day';

      const payload = {
        data: {
        title: holidayData.title,
        closureType: normalizedClosureType,
        startDate: holidayData.startDate,
        endDate: holidayData.endDate,
          startTime: holidayData.startTime || '00:00:00.000',
          endtime: holidayData.endtime || holidayData.endTime || '23:59:59.000',
          endTime: holidayData.endTime || holidayData.endtime || '23:59:59.000',
        },
      };

      console.log('📤 [createHoliday] Submitting payload to /api/holidays:', JSON.stringify(payload));
      const response = await api.post(ENDPOINTS.HOLIDAYS, payload);
      const returnedData = response.data?.data || response.data;
      return normalizeHolidayItem(returnedData);
    } catch (error) {
      console.error('Error creating holiday:', error);
      throw error;
    }
  },

  /**
   * Delete a holiday by documentId or numeric id
   * Endpoint: DELETE /api/holidays/:id
   */
  deleteHoliday: async (id: string | number): Promise<boolean> => {
    try {
      await api.delete(ENDPOINTS.HOLIDAY_BY_ID(id));
      return true;
    } catch (error) {
      console.error(`Error deleting holiday ${id}:`, error);
      throw error;
    }
  },

  /**
   * Update a holiday by documentId or numeric id
   * Endpoint: PUT /api/holidays/:id
   */
  updateHoliday: async (
    id: string | number,
    holidayData: Partial<CreateHolidayPayload>
  ): Promise<HolidayItemData> => {
    try {
      const normalizedClosureType =
        holidayData.closureType === 'partial' || holidayData.closureType === 'partial_day'
          ? 'partial_day'
          : holidayData.closureType === 'full_day'
          ? 'full_day'
          : holidayData.closureType;

      const payload = {
        data: {
          ...holidayData,
          ...(normalizedClosureType ? { closureType: normalizedClosureType } : {}),
          startTime: holidayData.startTime || '00:00:00.000',
          endtime: holidayData.endtime || holidayData.endTime || '23:59:59.000',
          endTime: holidayData.endTime || holidayData.endtime || '23:59:59.000',
        },
      };
      console.log(`📤 [updateHoliday] Submitting payload to /api/holidays/${id}:`, JSON.stringify(payload));
      const response = await api.put(ENDPOINTS.HOLIDAY_BY_ID(id), payload);
      const returnedData = response.data?.data || response.data;
      return normalizeHolidayItem(returnedData);
    } catch (error) {
      console.error(`Error updating holiday ${id}:`, error);
      throw error;
    }
  },
};
