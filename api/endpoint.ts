const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const ENDPOINTS = {
  REGISTER: `${BASE_URL}/api/register-with-role`,
  RESENDOTP: `${BASE_URL}/api/resend-register-otp`,
  VERIFY_OTP: `${BASE_URL}/api/verify-register-otp`,
  LOGIN: `${BASE_URL}/api/login`,
  FORGOT_SEND_OTP: `${BASE_URL}/api/auth/forgot-password`,
  FORGOT_RESEND_OTP: `${BASE_URL}/api/auth/resend-reset-otp`,
  FORGOT_VERIFY_OTP: `${BASE_URL}/api/auth/verify-otp`,
  FORGOT_SET_PASSWORD: `${BASE_URL}/api/auth/reset-password`,
};
