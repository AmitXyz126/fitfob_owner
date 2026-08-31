import axios, { isAxiosError } from 'axios';
import { ENDPOINTS } from './endpoint';
import apiInstance from './apiInstance';
 

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
    console.log(response.data)
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

export interface GoogleLoginPayload {
  idToken: string;
}

export interface FacebookLoginPayload {
  accessToken: string;
  userID: string;
}

export async function googleLoginApi(payload: GoogleLoginPayload) {
  try {
    const response = await axios.post(ENDPOINTS.GOOGLE_AUTH, payload);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const msg =
        error.response?.data.error?.message ??
        error.response?.data?.message ??
        'Google login failed';
      console.error('Google Login API error:', msg);
      throw new Error(msg);
    }
    throw new Error('An unexpected error occurred during Google login');
  }
}

export async function facebookLoginApi(payload: FacebookLoginPayload) {
  try {
    const response = await axios.post(ENDPOINTS.FACEBOOK_AUTH, payload);
    return response.data;
  } catch (error) {
    if (isAxiosError(error)) {
      const msg =
        error.response?.data.error?.message ??
        error.response?.data?.message ??
        'Facebook login failed';
      console.error('Facebook Login API error:', msg);
      throw new Error(msg);
    }
    throw new Error('An unexpected error occurred during Facebook login');
  }
}

export const changePasswordApi = async (payload: { oldPassword: string; newPassword: string }) => {
  const response = await apiInstance.post(ENDPOINTS.CHANGE_PASSWORD, payload);
  return response.data;
};
