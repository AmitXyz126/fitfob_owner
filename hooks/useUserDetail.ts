/* eslint-disable @typescript-eslint/no-unused-vars */
import { userDetailsApi } from '@/api/userDetailsApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';


// --- 2. Custom Hook ---
export const useUserDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: userData, isLoading: isFetchingStatus } = useQuery({
    queryKey: ['club-owner-me'],
    queryFn: userDetailsApi.getMe,
  });

const uploadFileOnly = useMutation({
    mutationFn: (file: any) => userDetailsApi.simpleUpload(file),
    onSuccess: (id) => {
      console.log("Uploaded ID:", id);
      Toast.show({ type: 'success', text1: 'File Uploaded!', text2: `ID: ${id}` });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Upload Failed' });
    }
  });

  const submitStep1 = useMutation({
    mutationFn: (formData: any) => {
      const id = userData?.id || userData?.pendingClubOwnerId;
      if (!id) throw new Error('User ID not found!');
      return userDetailsApi.saveStep1(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Step 1 Saved! ✅' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.response?.data?.message || 'Something went wrong',
      });
    },
  });

  const submitStep2 = useMutation({
    mutationFn: (locationData: { latitude: string; longitude: string }) => {
      const id = userData?.id || userData?.pendingClubOwnerId;
      if (!id) throw new Error('User ID not found!');
      return userDetailsApi.saveStep2(id, locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Location Saved! 📍' });
    },
  });

  const submitStep3 = useMutation({
    mutationFn: (addressData: {
      clubAddress: string;
      city: string;
      state: string;
      pincode: string;
    }) => {
      const id = userData?.id || userData?.pendingClubOwnerId;
      if (!id) throw new Error('User ID not found!');
      return userDetailsApi.saveStep3(id, addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Address Details Saved! 🏠' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Step 3 Error',
        text2: error.response?.data?.message || 'Failed to save address',
      });
    },
  });

  const submitStep4 = useMutation({
    mutationFn: (configData: any) => {
      const id = userData?.id || userData?.pendingClubOwnerId;
      if (!id) throw new Error('User ID not found!');
      return userDetailsApi.configureClub(id, configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Club Configured! ⚙️' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Step 4 Error',
        text2: error.response?.data?.message || 'Failed to configure club',
      });
    },
  });

  // Mutation for Step 5
  const uploadDoc = useMutation({
    mutationFn: ({ name, file }: { name: string; file: any }) => 
      userDetailsApi.uploadGovtDoc(name, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Document Uploaded! 📄' });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.response?.data?.message });
    }
  });

  // Mutation for Step 6 (Finalizing Step 4 in UI)
  const confirmDocs = useMutation({
    mutationFn: userDetailsApi.confirmGovtDocs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      Toast.show({ type: 'success', text1: 'All documents confirmed! ✅' });
    }
  });

  return {
    uploadFileOnly,
    userData,
    isFetchingStatus,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    uploadDoc,
    confirmDocs

  };
};
