import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export const userDetailsApi = {
  // 1. Get Me (Initial Status)
  getMe: async () => {
    const response = await api.get(ENDPOINTS.GET_ONBOARDING_STATUS);
    return response.data;
  },

  // 2. Step 1: Save Club Owner Details (With Logo)
  saveStep1: async (data: any) => {
    try {
      const formData = new FormData();
      
      // Text data append kar rahe hain
      formData.append('clubName', data.clubName);
      formData.append('ownerName', data.ownerName);
      formData.append('phoneNumber', data.phone);  
      formData.append('email', data.email);
      // Backend ke liye pendingClubOwnerId agar zaroori ho toh id yahan append karein
      if (data.pendingClubOwnerId) {
        formData.append('pendingClubOwnerId', data.pendingClubOwnerId.toString());
      }

      if (data.image) {
        const uriParts = data.image.split('.');
        const fileType = uriParts[uriParts.length - 1];

        formData.append('logo', {
          uri: data.image,
          name: `logo.${fileType}`,
          type: `image/${fileType}`,
        } as any);
      }

      const response = await api.post(ENDPOINTS.STEP_1, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },

  // 3. Step 2: Save Map Location (Latitude & Longitude)
  saveStep2: async (data: { pendingClubOwnerId: number; latitude: string; longitude: string }) => {
    try {
      const payload = {
        pendingClubOwnerId: data.pendingClubOwnerId,
        latitude: data.latitude,
        longitude: data.longitude,
      };

      // Isme simple JSON ja raha hai
      const response = await api.post(ENDPOINTS.STEP_2, payload);
      return response.data;
    } catch (error: any) {
      throw error;
    }
  },
};