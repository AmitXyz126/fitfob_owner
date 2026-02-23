import axios from 'axios';
import { ENDPOINTS } from './endpoint';

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// 1. Signup
export const signupStep1Api = async (payload: any) => {
  try {
    const response = await api.post(ENDPOINTS.REGISTER, payload);
    return response.data;
  } catch (error: any) {
    console.error('❌ Signup API Error:', error.response?.data || error.message);
    throw error;
  }
};

// 2. Verify OTP 
export const verifyOtpApi = async (payload: any) => {
  try {
     console.log("📡 Sending OTP Request:", {
      identifier: payload.identifier.toLowerCase().trim(),
      otp: payload.otp.toString(),
    });

    const response = await api.post(ENDPOINTS.VERIFY_OTP, {
      identifier: payload.identifier.toLowerCase().trim(),
      otp: payload.otp.toString(),
    });
    
     return response.data;
  } catch (error: any) {
     console.error(" Verify OTP API Error:", error.response?.data || error.message);
    throw error;
  }
};
  
// 3. Login
export const loginUserApi = async (payload: any) => {
  try {
    console.log('📡 Login Payload:', payload);
    const response = await api.post(ENDPOINTS.LOGIN, payload);
    return response.data;
  } catch (error: any) {
    console.error('❌ Login API Error:', error.response?.data || error.message);
    throw error;
  }
};
