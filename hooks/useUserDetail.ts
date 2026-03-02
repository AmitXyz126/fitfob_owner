/* eslint-disable @typescript-eslint/no-unused-vars */
import { userDetailsApi, PhotoFile } from '@/api/userDetailsApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export const useUserDetail = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  // 1. Yahan refetch aur isRefetching ko add kiya
  const {
    data: userData,
    isLoading: isFetchingStatus,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['club-owner-me'],
    queryFn: userDetailsApi.getMe,
  });

  const {
    data: documents,
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['club-owner-docs'],
    queryFn: userDetailsApi.getDocuments,
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

  const uploadDoc = useMutation({
    mutationFn: ({ name, file }: { name: string; file: any }) =>
      userDetailsApi.uploadGovtDoc(name, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      queryClient.invalidateQueries({ queryKey: ['club-owner-docs'] });
      Toast.show({ type: 'success', text1: 'Document Uploaded! 📄' });
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.response?.data?.message });
    },
  });

  const confirmDocs = useMutation({
    mutationFn: userDetailsApi.confirmGovtDocs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      queryClient.invalidateQueries({ queryKey: ['club-owner-docs'] });
      Toast.show({ type: 'success', text1: 'All documents confirmed! ✅' });
    },
  });

  // --- NEW: STEP 7 PHOTOS MUTATION ---
  const submitStep7 = useMutation({
    mutationFn: (photos: any[]) => userDetailsApi.uploadClubPhotos(photos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });

      const successMessage = data?.message || 'Club Owner profile created successfully! 📸';

      Toast.show({ type: 'success', text1: successMessage });

      router.replace('/ReviewStatusScreen');
    },
    onError: (error: any) => {
      console.error('Step 7 Mutation Error:', error);
      console.log('Backend Error:', error.response?.data);

      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || 'Check your photos and try again.',
      });
    },
  });

  return {
    userData,
    isFetchingStatus,
    refetch,
    isRefetching,
    submitStep1,
    submitStep2,
    submitStep3,
    submitStep4,
    uploadDoc,
    confirmDocs,
    submitStep7,
    documents,
    isDocsLoading,
    refetchDocs,
  };
};
