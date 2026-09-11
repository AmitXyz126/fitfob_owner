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

  const isApprovedOwner = Boolean(
    user?.clubOwnerDetail?.id ||
    user?.clubOwnerDetail?.clubName ||
    profileStatus?.isApprovedOwner ||
    profileStatus?.verification_status === 'approved' ||
    profileStatus?.status === 'approved'
  );

  const {
    data: documents,
    isLoading: isDocsLoading,
    isFetching: isDocsFetching,
    refetch: refetchDocs,
  } = useQuery({
    queryKey: ['club-owner-docs', userKey, isApprovedOwner],
    queryFn: async () => {
      // 1. Check local persistent storage for this user first
      let localDocs: any = null;
      try {
        const saved =
          (await AsyncStorage.getItem(`@club_owner_user_documents_${userKey}`)) ||
          (await AsyncStorage.getItem(`@onboarding_documents_cache_${userKey}`));
        if (saved) {
          localDocs = JSON.parse(saved);
        }
      } catch (e) {}

      // 2. Fetch from backend API
      try {
        const res = await userDetailsApi.getDocuments(isApprovedOwner);
        const list =
          res?.documents ||
          res?.data ||
          res?.docs ||
          (Array.isArray(res) ? res : []);

        if (Array.isArray(list) && list.length > 0) {
          AsyncStorage.setItem(`@club_owner_user_documents_${userKey}`, JSON.stringify(res)).catch(console.log);
          AsyncStorage.setItem(`@onboarding_documents_cache_${userKey}`, JSON.stringify(res)).catch(console.log);
          return res;
        }
      } catch (err) {
        console.log('Error fetching documents in useQuery:', err);
      }

      // If backend returned empty or errored, fallback to locally stored documents for this user
      if (localDocs) {
        return localDocs;
      }
      return [];
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
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
    onSuccess: (res: any, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });

      // Directly update TanStack Query cache with the uploaded document
      const docsKey = ['club-owner-docs', userKey, isApprovedOwner];
      const newDoc = res?.data || res?.document || {
        id: res?.id || `doc_${Date.now()}`,
        documentName: variables?.name,
        name: variables?.name,
        fileUrl: variables?.file?.uri,
        url: variables?.file?.uri,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData(docsKey, (old: any) => {
        if (!old) return [newDoc];
        if (Array.isArray(old)) return [newDoc, ...old];
        if (old?.documents && Array.isArray(old.documents)) {
          return { ...old, documents: [newDoc, ...old.documents] };
        }
        if (old?.data && Array.isArray(old.data)) {
          return { ...old, data: [newDoc, ...old.data] };
        }
        return [newDoc];
      });

      // Also persist to AsyncStorage for instant local retrieval across logout/login
      const persistDocToStorage = (storageKey: string) => {
        AsyncStorage.getItem(storageKey)
          .then((saved) => {
            let list = [];
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                list = Array.isArray(parsed)
                  ? parsed
                  : parsed?.documents || parsed?.data || [];
              } catch (e) {}
            }
            AsyncStorage.setItem(
              storageKey,
              JSON.stringify([newDoc, ...list])
            ).catch(console.log);
          })
          .catch(console.log);
      };

      persistDocToStorage(`@club_owner_user_documents_${userKey}`);
      persistDocToStorage(`@onboarding_documents_cache_${userKey}`);
    },
    onError: (error: any) => {
      Toast.show({ type: 'error', text1: 'Upload Failed', text2: error.response?.data?.message });
    },
  });

  const verifyGovtDoc = useMutation({
    mutationFn: (file: any) => userDetailsApi.verifyGovernmentDoc(file),
  });

  const confirmDocs = useMutation({
    mutationFn: userDetailsApi.confirmGovtDocs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      // Keep club-owner-docs cache intact so back navigation from step 5 is instant
    },
  });

  const {
    data: clubPhotos,
    isLoading: isClubPhotosLoading,
    refetch: refetchClubPhotos,
  } = useQuery({
    queryKey: ['pending-club-photos', userKey],
    queryFn: async () => {
      // 1. Check local persistent storage for this user first
      let localCached: any = null;
      try {
        const saved =
          (await AsyncStorage.getItem(`@club_photos_cache_${userKey}`)) ||
          (await AsyncStorage.getItem(`@onboarding_photos_cache_${userKey}`));
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localCached = parsed;
          }
        }
      } catch (e) {}

      // 2. Fetch from backend API
      try {
        const res = await userDetailsApi.getClubPhotos();
        const list =
          res?.photos ||
          res?.clubPhotos ||
          res?.data?.photos ||
          res?.data?.clubPhotos ||
          (Array.isArray(res?.data) ? res.data : null) ||
          (Array.isArray(res) ? res : []);

        if (Array.isArray(list) && list.length > 0) {
          AsyncStorage.setItem(`@club_photos_cache_${userKey}`, JSON.stringify(list)).catch(console.log);
          AsyncStorage.setItem(`@onboarding_photos_cache_${userKey}`, JSON.stringify(list)).catch(console.log);
          return { ...res, photos: list };
        }
      } catch (err) {
        console.log('Error fetching club photos in useQuery:', err);
      }

      // Fallback: If backend returned empty or errored, use persistent cached photos for this user
      if (localCached && localCached.length > 0) {
        return { photos: localCached, data: localCached };
      }
      return { photos: [] };
    },
    enabled: !!user,
    retry: 1,
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  const uploadSingleClubPhoto = useMutation({
    mutationFn: (data: { file: { uri: string; name?: string; type?: string }; imageInfo: string }) =>
      userDetailsApi.uploadSingleClubPhoto(data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['pending-club-photos'] });
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-club-owner-me'] });

      // Save directly to local persistent cache so it's instantly preserved
      const serverPhoto = res?.photo || res?.data || res;
      const newPhotoItem = {
        id: serverPhoto?.id || `local_${Date.now()}`,
        documentId: String(serverPhoto?.documentId || serverPhoto?.id || Date.now()),
        imageInfo: serverPhoto?.imageInfo || variables?.imageInfo || '',
        url: serverPhoto?.fileUrl || serverPhoto?.url || variables?.file?.uri,
        fileUrl: serverPhoto?.fileUrl || serverPhoto?.url || variables?.file?.uri,
        isUploading: false,
      };

      const updatePhotoStorage = (key: string) => {
        AsyncStorage.getItem(key)
          .then((saved) => {
            let list = [];
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                list = Array.isArray(parsed) ? parsed : parsed?.photos || [];
              } catch (e) {}
            }
            const updated = [newPhotoItem, ...list.filter((p: any) => String(p.documentId) !== String(newPhotoItem.documentId))];
            AsyncStorage.setItem(key, JSON.stringify(updated)).catch(console.log);
          })
          .catch(console.log);
      };

      updatePhotoStorage(`@club_photos_cache_${userKey}`);
      updatePhotoStorage(`@onboarding_photos_cache_${userKey}`);

      Toast.show({
        type: 'success',
        text1: 'Photo Uploaded! 📸',
        text2: res?.message || 'Club photo uploaded successfully',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || 'Failed to upload club photo',
      });
    },
  });

  const deleteClubPhoto = useMutation({
    mutationFn: (documentId: string) => userDetailsApi.deleteClubPhoto(documentId),
    onSuccess: (res, documentId) => {
      queryClient.invalidateQueries({ queryKey: ['pending-club-photos'] });
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      queryClient.invalidateQueries({ queryKey: ['my-club-owner-me'] });

      // Remove from persistent storage
      const removePhotoFromStorage = (key: string) => {
        AsyncStorage.getItem(key)
          .then((saved) => {
            if (saved) {
              try {
                const parsed = JSON.parse(saved);
                const list = Array.isArray(parsed) ? parsed : parsed?.photos || [];
                const filtered = list.filter((p: any) => String(p.documentId) !== String(documentId) && String(p.id) !== String(documentId));
                AsyncStorage.setItem(key, JSON.stringify(filtered)).catch(console.log);
              } catch (e) {}
            }
          })
          .catch(console.log);
      };

      removePhotoFromStorage(`@club_photos_cache_${userKey}`);
      removePhotoFromStorage(`@onboarding_photos_cache_${userKey}`);

      Toast.show({
        type: 'success',
        text1: 'Photo Deleted 🗑️',
        text2: res?.message || 'Club photo deleted successfully',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error.response?.data?.message || 'Failed to delete photo',
      });
    },
  });

  // --- Club Photos (Approved Owner) hooks: /api/club-photos ---

  const {
    data: myClubPhotos,
    isLoading: isMyClubPhotosLoading,
    refetch: refetchMyClubPhotos,
  } = useQuery({
    queryKey: ['my-club-photos', userKey],
    queryFn: async () => {
      const res = await userDetailsApi.getMyClubPhotos();
      // response: { data: [...] }
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      return list;
    },
    enabled: !!user,
    retry: 1,
    staleTime: 3 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const uploadMyClubPhoto = useMutation({
    mutationFn: (data: { file: { uri: string; name?: string; type?: string }; imageInfo: string }) =>
      userDetailsApi.uploadClubPhoto(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-club-photos'] });
      Toast.show({
        type: 'success',
        text1: 'Photo Uploaded! 📸',
        text2: res?.message || 'Club photo uploaded successfully',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: error.response?.data?.message || 'Failed to upload club photo',
      });
    },
  });

  const deleteMyClubPhoto = useMutation({
    mutationFn: (documentId: string) => userDetailsApi.deleteMyClubPhoto(documentId),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-club-photos'] });
      Toast.show({
        type: 'success',
        text1: 'Photo Deleted 🗑️',
        text2: res?.message || 'Club photo deleted successfully',
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: error.response?.data?.message || 'Failed to delete photo',
      });
    },
  });

  const confirmOnboarding = useMutation({
    mutationFn: userDetailsApi.confirmOnboarding,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['club-owner-me'] });
      const successMessage =
        data?.message || 'Club Owner onboarding details submitted. Awaiting verification approval.';
      Toast.show({
        type: 'success',
        text1: 'Onboarding Submitted! 🎉',
        text2: successMessage,
      });
      router.replace('/Completed');
    },
    onError: (error: any) => {
      console.error('Confirm Onboarding Error:', error);
      Toast.show({
        type: 'error',
        text1: 'Submission Failed',
        text2: error.response?.data?.message || 'Failed to submit onboarding details.',
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
    verifyGovtDoc,
    confirmDocs,
    updateClubOwner,
    checkVerificationStatus,
    documents,
    isDocsLoading,
    isDocsFetching,
    refetchDocs,
    clubPhotos,
    isClubPhotosLoading,
    refetchClubPhotos,
    uploadSingleClubPhoto,
    deleteClubPhoto,
    confirmOnboarding,
    // Club Photos (Approved Owner) - /api/club-photos
    myClubPhotos,
    isMyClubPhotosLoading,
    refetchMyClubPhotos,
    uploadMyClubPhoto,
    deleteMyClubPhoto,
  };
};
