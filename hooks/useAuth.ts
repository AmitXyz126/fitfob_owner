import { useMutation } from "@tanstack/react-query";
import { loginUserApi, signupStep1Api, verifyOtpApi } from "@/api/authApi";
import { useAuthStore } from "@/store/useAuthStore";

// Pehla Hook: Sirf OTP mangwane ke liye
export const useSignupRequest = () => {
  return useMutation({
    mutationFn: signupStep1Api,
  });
};

// Dusra Hook: OTP verify karke Login karwane ke liye
export const useVerifyOtp = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (data) => {
      // Jo data tune bheja (jwt + user), usse yahan process karenge
      const userWithToken = {
        ...data.user,
        token: data.jwt, // jwt ko token key mein save kar rahe hain
      };
      
      // Zustand + AsyncStorage mein save ho jayega automatically
      setUser(userWithToken, true);
    },
  });
};

// 3. Login Hook: Direct Login ke liye (Identifier + Password)
export const useLoginRequest = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: loginUserApi, // Ye aapki banayi hui API function hai
    onSuccess: (data) => {
      console.log("✅ Store update after login:", data);
      
      // Backend response ke hisaab se mapping (jwt -> token)
      const userWithToken = {
        ...data.user,
        token: data.jwt, 
      };
      
      // Session save kar rahe hain
      setUser(userWithToken, true);
    },
  });
};