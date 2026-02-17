import axios from "axios";
import { ENDPOINTS } from "./endpoint";

// 1. Signup  
export const signupStep1Api = async (payload :any) => {
  const response = await axios.post(ENDPOINTS.REGISTER, payload);
  return response.data; // { message: "OTP sent successfully" }
};

 export const verifyOtpApi = async (payload :any) => {
  console.log("📡 API Call to:", ENDPOINTS.VERIFY_OTP);
  console.log("📦 With Payload:", payload);
  const response = await axios.post(ENDPOINTS.VERIFY_OTP, payload);
  return response.data;  
};
export const loginUserApi = async (payload :any) => {

  const response = await axios.post(ENDPOINTS.LOGIN, payload);
  return response.data; 
};