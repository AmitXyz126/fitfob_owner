const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export const ENDPOINTS ={
     REGISTER: `${BASE_URL}/api/register-with-role`,
     VERIFY_OTP:`${BASE_URL}/api/verify-register-otp`,
     LOGIN:`${BASE_URL}/api/login`,
}