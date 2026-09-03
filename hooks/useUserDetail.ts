import { userDetailsApi } from '@/api/userdetailsApi';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useClubOwnerMe = (enabled: boolean = true) => {
  const { user } = useAuthStore();
  const userKey = user?.id || user?.email || 'guest';

  return useQuery({
    queryKey: ['my-club-owner-me', userKey],
    queryFn: userDetailsApi.getMyClubOwner,
    enabled: !!user && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
};

export const useUserDetail = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userKey = user?.id || user?.email || 'guest';

  const {
    data: profileStatus,
    isLoading: isFetchingStatus,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['club-owner-me', userKey],
    queryFn: userDetailsApi.getMe,
    retry: 1,
    enabled: !!user && (user.clubOwnerDetail === null || user.clubOwnerDetail === undefined),
  });

  const isApprovedOwner = Boolean(user?.clubOwnerDetail?.id || user?.clubOwnerDetail?.clubName);

  const {
    data: documents,
    isLoading: isDocsLoading,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['club-owner-docs', userKey, isApprovedOwner],
    queryFn: () => userDetailsApi.getDocuments(isApprovedOwner),
    enabled: !!user,
    retry: 1,
  });

  const submitStep1 = useMutation({
    mutationFn: (formData: any) => {
      const id = profileStatus?.id || profileStatus?.pendingClubOwnerId || 0;
      return userDetailsApi.saveStep1(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      // Toast.show({ type: 'success', text1: 'Step 1 Saved! ✅' });
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
      const id = profileStatus?.id || profileStatus?.pendingClubOwnerId || 0;
      return userDetailsApi.saveStep2(id, locationData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      // Toast.show({ type: 'success', text1: 'Location Saved! 📍' });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Step 2 Error',
        text2: error.response?.data?.message || 'Failed to save location',
      });
    },
  });

  const submitStep3 = useMutation({
    mutationFn: (addressData: {
      clubAddress: string;
      city: string;
      state: string;
      pincode: string;
    }) => {
      const id = profileStatus?.id || profileStatus?.pendingClubOwnerId || 0;
      return userDetailsApi.saveStep3(id, addressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      // Toast.show({ type: 'success', text1: 'Address Details Saved! 🏠' });
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
      const id = profileStatus?.id || profileStatus?.pendingClubOwnerId || 0;
      return userDetailsApi.configureClub(id, configData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      // Toast.show({ type: 'success', text1: 'Club Configured! ⚙️' });
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
      // Toast.show({ type: 'success', text1: 'Document Uploaded! 📄' });
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
      // Toast.show({ type: 'success', text1: 'All documents confirmed! ✅' });
    },
  });

  // --- NEW: STEP 7 PHOTOS MUTATION ---
  const submitStep7 = useMutation({
    mutationFn: (photos: any[]) => userDetailsApi.uploadClubPhotos(photos),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });

      const successMessage = data?.message || 'Club Owner profile created successfully! 📸';

      // Toast.show({ type: 'success', text1: successMessage });

      router.replace('/Completed');
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

  const updateClubOwner = useMutation({
    mutationFn: async (data: any) => {
      const currentUser = useAuthStore.getState().user;
      const cachedOwnerMe: any = queryClient.getQueryData(['my-club-owner-me', userKey]);

      let id =
        data?.id ||
        currentUser?.clubOwnerDetail?.id ||
        currentUser?.clubOwnerDetail?.clubOwnerId ||
        cachedOwnerMe?.id ||
        cachedOwnerMe?.clubOwnerId ||
        cachedOwnerMe?.data?.id ||
        profileStatus?.clubOwnerDetail?.id ||
        profileStatus?.id ||
        profileStatus?.clubOwnerId ||
        profileStatus?.data?.id ||
        profileStatus?.data?.attributes?.id;

      if (!id) {
        id =
          currentUser?.clubOwnerId ||
          currentUser?.pendingClubOwnerId ||
          profileStatus?.pendingClubOwnerId ||
          profileStatus?.pendingClubOwner?.id;
      }

      if (!id) {
        try {
          const cachedStr = await AsyncStorage.getItem('club_owner_me');
          if (cachedStr) {
            const parsed = JSON.parse(cachedStr);
            id = parsed?.id || parsed?.clubOwnerId || parsed?.data?.id;
          }
          if (!id) {
            const profStr = await AsyncStorage.getItem('club_profile');
            if (profStr) {
              const parsedProf = JSON.parse(profStr);
              id = parsedProf?.id || parsedProf?.clubOwnerId;
            }
          }
        } catch (e) {
          console.log('Error reading cached owner ID from AsyncStorage:', e);
        }
      }

      return userDetailsApi.updateClubOwner(id || 0, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-club-owner-me'] });
      Toast.show({ type: 'success', text1: 'Club Details Updated! ✅' });
    },
    onError: (error: any) => {
      console.error('Update Club Owner Error:', error?.response?.data || error?.message);
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2:
          error?.response?.data?.error?.message ||
          error?.response?.data?.message ||
          'Failed to update club details',
      });
    },
  });

  const checkVerificationStatus = useMutation({
    mutationFn: () => userDetailsApi.getVerificationStatus(),
  });

  return {
    profileStatus,
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
    updateClubOwner,
    checkVerificationStatus,
    documents,
    isDocsLoading,
    refetchDocs,
  };
};
