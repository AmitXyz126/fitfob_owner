import api from '@/api/apiInstance';
import { ENDPOINTS } from '@/api/endpoint';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

// --- 1. API Object ---
export const userDetailsApi = {
  getMe: async () => {
    const response = await api.get(ENDPOINTS.GET_ONBOARDING_STATUS);
    return response.data;
  },

  saveStep1: async (id: number, data: any) => {
    const formData = new FormData();
    
    formData.append('clubName', data.clubName);
    formData.append('ownerName', data.ownerName);
    formData.append('phoneNumber', data.phone); 
    formData.append('email', data.email);
    formData.append('pendingClubOwnerId', id.toString());

    // Logo (Image) handling
    if (data.image) {
      const uriParts = data.image.split('.');
      const fileType = uriParts[uriParts.length - 1];

      formData.append('logo', {
        uri: data.image,
        name: `logo.${fileType}`,
        type: `image/${fileType}`,
      } as any);
    }

    const response = await api.post(ENDPOINTS.STEP_1, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // --- STEP 2 API ADDED ---
  saveStep2: async (id: number, data: { latitude: string; longitude: string }) => {
    const payload = {
      pendingClubOwnerId: id,
      latitude: data.latitude,
      longitude: data.longitude,
    };
    const response = await api.post(ENDPOINTS.STEP_2, payload);
    return response.data;
  },
};

// --- 2. Custom Hook ---
export const useUserDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Onboarding Status Query (ID fetch karne ke liye)
  const { data: userData, isLoading: isFetchingStatus } = useQuery({
    queryKey: ['club-owner-me'],
    queryFn: userDetailsApi.getMe,
  });

  // Step 1 Save Mutation
  const submitStep1 = useMutation({
    mutationFn: (formData: any) => {
      if (!userData?.id) {
        throw new Error("User ID not found!");
      }
      return userDetailsApi.saveStep1(userData.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ 
        type: 'success', 
        text1: 'Step 1 Saved! ✅' 
      });
      router.push('/onBoardingScreen/OnBoardingStep');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    },
  });

  // --- STEP 2 MUTATION ADDED ---
  const submitStep2 = useMutation({
    mutationFn: (locationData: { latitude: string; longitude: string }) => {
      if (!userData?.id) {
        throw new Error("User ID not found!");
      }
      return userDetailsApi.saveStep2(userData.id, locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ 
        type: 'success', 
        text1: 'Location Saved! 📍' 
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Step 2 Error',
        text2: error.response?.data?.message || 'Failed to save location',
      });
    },
  });

  return { 
    userData, 
    isFetchingStatus, 
    submitStep1,
    submitStep2 // Exporting Step 2
  };
};