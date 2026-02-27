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

  

  // Onboarding Flow
  GET_ONBOARDING_STATUS: `${BASE_URL}/api/pending-club-owner/me`,
  STEP_1: `${BASE_URL}/api/pending-club-owner/club-owner-details`,
  STEP_2: `${BASE_URL}/api/pending-club-owner/map-location`,
  STEP_3: `${BASE_URL}/api/pending-club-owner/address-details`,
  STEP_4: `${BASE_URL}/api/pending-club-owner/configure-club`,
  Step_5: `${BASE_URL}/api/pending-club-owner/upload-government-doc`,
  Step_6: `${BASE_URL}/api/pending-club-owner/confirm-government-docs`,
  STEP_7: `${BASE_URL}/api/pending-club-owner/upload-club-photos`,
};
