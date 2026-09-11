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
  UPLOADFILE: `${BASE_URL}/api/upload`,
  UPLOAD: `${BASE_URL}/api/upload`,
  UPLOAD_FILE: `${BASE_URL}/api/upload`,
  GOOGLE_AUTH: `${BASE_URL}/api/clubOwner/google`,
  FACEBOOK_AUTH: `${BASE_URL}/api/clubOwner/facebook`,

  // Onboarding Flow
  GET_ONBOARDING_STATUS: `${BASE_URL}/api/pending-club-owner/me`,
  STEP_1: `${BASE_URL}/api/pending-club-owner/club-owner-details`,
  STEP_2: `${BASE_URL}/api/pending-club-owner/map-location`,
  STEP_3: `${BASE_URL}/api/pending-club-owner/address-details`,
  STEP_4: `${BASE_URL}/api/pending-club-owner/configure-club`,
  Step_5: `${BASE_URL}/api/pending-club-owner/upload-government-doc`,
  VERIFY_GOVERNMENT_DOC: `${BASE_URL}/api/pending-club-owner/verify-government-doc`,
  Step_6: `${BASE_URL}/api/pending-club-owner/confirm-government-docs`,
  Get: `${BASE_URL}/api/pending-club-owner/documents`,
  // Pending-club-owner photo endpoints (Onboarding flow)
  UPLOAD_CLUB_PHOTO: `${BASE_URL}/api/pending-club-owner/upload-club-photo`,
  GET_CLUB_PHOTOS: `${BASE_URL}/api/pending-club-owner/club-photos`,
  DELETE_CLUB_PHOTO: (documentId: string) => `${BASE_URL}/api/pending-club-owner/club-photos/${documentId}`,

  // Club Photos endpoints (Approved club owner - ClubPhotosScreen)
  CLUB_PHOTOS_GET_ME: `${BASE_URL}/api/club-photos/me`,
  CLUB_PHOTOS_UPLOAD: `${BASE_URL}/api/club-photos`,
  CLUB_PHOTOS_DELETE: (documentId: string) => `${BASE_URL}/api/club-photos/${documentId}`,
  CONFIRM_ONBOARDING: `${BASE_URL}/api/pending-club-owner/confirm`,
  GET_CLUB_SERVICES: `${BASE_URL}/api/club-services`,
  GET_CLUB_FACILITIES: `${BASE_URL}/api/club-facilities`,

  
  CHANGE_PASSWORD: `${BASE_URL}/api/change-password`,
  CLUB_OWNERS: `${BASE_URL}/api/club-owners`,
  MY_CLUB_OWNER: `${BASE_URL}/api/club-owner/me`,
  CLIENT_CHECKIN_SCAN: `${BASE_URL}/api/client-checkin/scan`,
  MY_DOCUMENTS: `${BASE_URL}/api/my-documents`,
  VERIFICATION_STATUS: `${BASE_URL}/api/verify-approval/verification-status`,
};

