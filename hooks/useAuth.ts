import { useMutation } from "@tanstack/react-query";
import { loginUserApi, signupStep1Api, verifyOtpApi } from "@/api/authApi";
import { useAuthStore } from "@/store/useAuthStore";

 export const useSignupRequest = () => {
  return useMutation({
    mutationFn: signupStep1Api,
  });
};

 export const useVerifyOtp = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: verifyOtpApi,
    onSuccess: (data) => {
   
      const userWithToken = {
        ...data.user,
        token: data.jwt, 
      };
      
       setUser(userWithToken, true);
    },
  });
};

 export const useLoginRequest = () => {
  const { setUser } = useAuthStore();

  return useMutation({
    mutationFn: loginUserApi, 
    onSuccess: (data) => {
      console.log("✅ Store update after login:", data);
      
     
      const userWithToken = {
        ...data.user,
        token: data.jwt, 
      };
      
    
      setUser(userWithToken, true);
    },
  });
};