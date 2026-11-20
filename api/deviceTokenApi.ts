import apiInstance from './apiInstance';
import { ENDPOINTS } from './endpoint';
import { Platform } from 'react-native';

export interface DeviceTokenPayload {
  token: string;
  platform?: 'android' | 'ios' | 'web' | string;
}

export interface DeviceTokenResponse {
  message: string;
  data?: any;
}

export const deviceTokenApi = {
  /**
   * Register push notification device token with backend
   * POST /api/device-tokens/register
   */
  registerDeviceToken: async (token: string, platform?: string): Promise<DeviceTokenResponse> => {
    const payload: DeviceTokenPayload = {
      token: token.trim(),
      platform: platform || Platform.OS,
    };
    const response = await apiInstance.post(ENDPOINTS.REGISTER_DEVICE_TOKEN, payload);
    return response.data;
  },

  /**
   * Unregister push notification device token on logout
   * POST /api/device-tokens/unregister
   */
  unregisterDeviceToken: async (token: string): Promise<DeviceTokenResponse> => {
    const payload = { token: token.trim() };
    const response = await apiInstance.post(ENDPOINTS.UNREGISTER_DEVICE_TOKEN, payload);
    return response.data;
  },
};
