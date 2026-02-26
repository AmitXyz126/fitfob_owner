import axios from 'axios';
import { ENDPOINTS } from './endpoint';
 

const api = axios.create({
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});
// Auth API Functions 

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

// 2. Resend OTP

export const resendOtpApi = async (payload: { identifier: string; signupToken: string }) => {
  try {
    const response = await api.post(ENDPOINTS.RESENDOTP, {
      identifier: payload.identifier.toLowerCase().trim(),
      signupToken: payload.signupToken,
    });
    return response.data;
  } catch (error: any) {
    console.error('❌ Resend OTP API Error:', error.response?.data || error.message);
    throw error;
  }
};

// 3. Verify OTP
export const verifyOtpApi = async (payload: any) => {
  try {
    console.log('📡 Sending OTP Request:', {
      identifier: payload.identifier.toLowerCase().trim(),
      otp: payload.otp.toString(),
      signupToken: payload.signupToken,
    });

    const response = await api.post(ENDPOINTS.VERIFY_OTP, {
      identifier: payload.identifier.toLowerCase().trim(),
      otp: payload.otp.toString(),
      signupToken: payload.signupToken,
    });

    return response.data;
  } catch (error: any) {
    const errorData = error.response?.data;
    console.error('❌ Verify OTP API Error Details:', {
      status: error.response?.status,
      message: errorData?.error?.message || errorData?.message || error.message,
      details: errorData?.error?.details || errorData?.details || 'No details provided',
    });
    throw error;
  }
};

// 4. Login
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


// Forgot password APIs Flow 

// 1. Send OTP (Forgot Password)
export const forgotSendOtpApi = async (payload: { identifier: string }) => {
  const response = await api.post(ENDPOINTS.FORGOT_SEND_OTP, {
    identifier: payload.identifier.toLowerCase().trim(),
  });
  return response.data;
};

// 2. Resend OTP (Forgot Password)
export const forgotResendOtpApi = async (payload: { identifier: string }) => {
  const response = await api.post(ENDPOINTS.FORGOT_RESEND_OTP, {
    identifier: payload.identifier.toLowerCase().trim(),
  });
  return response.data;
};

// 3. Verify OTP (Forgot Password)
export const forgotVerifyOtpApi = async (payload: { identifier: string; otp: string }) => {
  console.log('🚀 Payload being sent to Backend:', {
    identifier: payload.identifier.toLowerCase().trim(),
    otp: String(payload.otp).trim(),
  });

  const response = await api.post(ENDPOINTS.FORGOT_VERIFY_OTP, {
    identifier: payload.identifier.toLowerCase().trim(),
    otp: String(payload.otp).trim(),
  });
  return response.data;
};

// 4. set Password

export const resetPasswordApi = async (payload: any) => {
  try {
    const finalPayload = {
      identifier: payload.identifier,
      password: payload.password,
      confirmPassword: payload.confirmPassword,
      resetToken: payload.resetToken,
    };
    const response = await api.post(ENDPOINTS.FORGOT_SET_PASSWORD, finalPayload);
    return response.data;
  } catch (error: any) {
    console.error('❌ Reset Password API Error:', error.response?.data || error.message);
    throw error;
  }
};
