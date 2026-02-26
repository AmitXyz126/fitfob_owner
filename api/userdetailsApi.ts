 
import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export const userDetailsApi = {
   getMe: async () => {
    try {
      const response = await api.get(ENDPOINTS.GET_ONBOARDING_STATUS);
      return response.data; 
    } catch (error: any) {
      throw error;
    }
  },

 
  saveStep1: async (id: number, data: any) => {
    try {
      
      const response = await api.post(ENDPOINTS.STEP_1, { ...data, pendingClubOwnerId: id });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};