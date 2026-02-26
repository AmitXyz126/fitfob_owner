import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userDetailsApi } from '@/api/userdetailsApi';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export const useUserDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Onboarding Status Query  
  const { data: userData, isLoading: isFetchingStatus } = useQuery({
    queryKey: ['club-owner-me'],
    queryFn: userDetailsApi.getMe,
  });

  // 2. Step 1 Mutation
  const submitStep1 = useMutation({
    mutationFn: (formData: any) => {
      if (!userData?.id) throw new Error("User ID not!");
      return userDetailsApi.saveStep1(userData.id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Step 1 Saved! ✅' });
      
    
      router.push('/OnBoardingStep');
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    },
  });

  return { userData, isFetchingStatus, submitStep1 };
};