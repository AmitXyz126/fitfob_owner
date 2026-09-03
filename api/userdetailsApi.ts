import api from './apiInstance';
import { ENDPOINTS } from './endpoint';
import { useAuthStore } from '@/store/useAuthStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PhotoFile {
  uri: string;
  name: string;
  type: string;
}

export const userDetailsApi = {
  simpleUpload: async (file: File) => {
    const formData = new FormData();
    formData.append('files', file);
    const response = await api.post(ENDPOINTS.UPLOADFILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Return only the ID from response
    return response.data;
  },

  uploadFile: async (fileData: { uri: string; name?: string; type?: string }) => {
    const formData = new FormData();
    const fileToUpload = {
      uri: fileData.uri,
      name: fileData.name || `file_${Date.now()}.jpg`,
      type: fileData.type || 'image/jpeg',
    };
    formData.append('files', fileToUpload as any);

    const response = await api.post(ENDPOINTS.UPLOADFILE, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      transformRequest: (data) => data,
    });

    return response.data;
  },

  getMe: async () => {
    try {
      const currentUser = useAuthStore.getState().user;
      const currentUserEmail = currentUser?.email ? String(currentUser.email).toLowerCase().trim() : '';

      const response = await api.get(ENDPOINTS.GET_ONBOARDING_STATUS);
      const data = response.data;
      if (data) {
        const details = data.details || (data.data ? data.data : {});
        const recordEmail = (details.email || data.email || data.user?.email)
          ? String(details.email || data.email || data.user?.email).toLowerCase().trim()
          : '';

        // Safety check: If API returns a record for a different user email, ignore it and treat as fresh draft
        if (recordEmail && currentUserEmail && recordEmail !== currentUserEmail) {
          console.warn(`⚠️ [getMe] Email mismatch: backend record is for (${recordEmail}), but logged in user is (${currentUserEmail}). Defaulting to fresh draft.`);
          return {
            status: 'draft',
            currentStep: 1,
            isApprovedOwner: false,
            verification_status: 'draft',
            email: currentUserEmail,
          };
        }

        const mergedData = {
          ...details,
          ...data,
        };

        const currentStep = data.currentStep ?? details.currentStep ?? 1;
        const realStatus = details.status || (data.status === 'pending' ? 'draft' : data.status) || 'draft';

        const isApproved =
          mergedData.isApprovedOwner === true ||
          mergedData.verification_status === 'approved' ||
          mergedData.verificationStatus === 'approved' ||
          realStatus === 'approved';

        return {
          ...mergedData,
          id: details.id || data.id || data.pendingClubOwnerId,
          pendingClubOwnerId: details.id || data.id || data.pendingClubOwnerId,
          currentStep,
          status: realStatus,
          isApprovedOwner: isApproved,
          verification_status: isApproved
            ? 'approved'
            : mergedData.verification_status || mergedData.verificationStatus || (realStatus === 'in_review' || realStatus === 'completed' ? 'in_review' : 'draft'),
        };
      }
      return data;
    } catch (error: any) {
      // console.log('GET_ONBOARDING_STATUS error in getMe, checking club-owners fallback:', error?.response?.status, error?.message);

      const currentUserId = useAuthStore.getState().user?.id;
      const currentUserEmail = useAuthStore.getState().user?.email;

      try {
        const ownerRes = await api.get(ENDPOINTS.CLUB_OWNERS);
        const ownerList = ownerRes.data?.data || ownerRes.data || [];

        if (Array.isArray(ownerList) && ownerList.length > 0) {
          const matchingOwner = ownerList.find((o: any) => {
            const ownerUserId = o?.user?.id || o?.userId || o?.attributes?.user?.data?.id || o?.user_id;
            const ownerEmail = o?.email || o?.user?.email || o?.attributes?.email;
            if (currentUserId && ownerUserId && String(ownerUserId) === String(currentUserId)) return true;
            if (currentUserEmail && ownerEmail && String(ownerEmail).toLowerCase() === String(currentUserEmail).toLowerCase()) return true;
            return false;
          });

          if (matchingOwner) {
            // console.log('✅ Approved Club Owner record found for current user:', matchingOwner);
            return {
              ...matchingOwner,
              status: 'approved',
              verification_status: 'approved',
              isApprovedOwner: true,
            };
          }
        }
      } catch (e) {
        console.log('Error fetching club-owners in getMe fallback:', e);
      }

      return {
        status: 'draft',
        currentStep: 1,
        isApprovedOwner: false,
        verification_status: 'draft',
      };
    }
  },

  saveStep1: async (id: number, data: any) => {
    const formData = new FormData();

    formData.append('clubName', data.clubName);
    formData.append('ownerName', data.ownerName);
    formData.append('phoneNumber', data.phone);
    formData.append('email', data.email);

    if (data.logo?.uri) {
      const file = {
        uri: data.logo.uri,
        name: data.logo.name || `logo_${Date.now()}.jpg`,
        type: data.logo.type || 'image/jpeg',
      };

      formData.append('logo', file as any);
    } else if (typeof data.logo === 'string' && data.logo) {
      formData.append('logo', data.logo);
    }

    const response = await api.post(
      ENDPOINTS.STEP_1,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
          Accept: 'application/json',
        },
        transformRequest: (data) => data,
      }
    );

    return response.data;
  },

  saveStep2: async (id: number, data: { latitude: string; longitude: string }) => {
    const payload = {
      latitude: String(data.latitude),
      longitude: String(data.longitude),
    };
    const response = await api.post(ENDPOINTS.STEP_2, payload);
    return response.data;
  },
  saveStep3: async (
    id: number,
    data: { clubAddress: string; city: string; state: string; pincode: string }
  ) => {
    const payload = {
      clubAddress: data.clubAddress,
      city: data.city,
      state: data.state,
      pincode: data.pincode,
    };
    const response = await api.post(ENDPOINTS.STEP_3, payload);
    return response.data;
  },

  configureClub: async (id: number, data: any) => {
    const payload = {
      clubCategory: data.clubCategory,
      services: data.services,
      facilities: data.facilities,
      openingTime: data.openingTime,
      closingTime: data.closingTime,
      weekday: data.weekday,
      weekend: data.weekend,
    };
    const response = await api.post(ENDPOINTS.STEP_4, payload);
    return response.data;
  },
  // STEP 5: Document Upload (Multipart)

  uploadGovtDoc: async (docName: string, fileData: any) => {
    const formData = new FormData();

    formData.append('documentName', docName);

    const fileToUpload = {
      uri: fileData.uri,
      name: fileData.name || 'document.jpg',
      type: fileData.type || fileData.mimeType || 'image/jpeg',
    };

    formData.append('file', fileToUpload as any);

    console.log('Sending Payload:', docName, fileToUpload.uri);

    const response = await api.post(ENDPOINTS.Step_5, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      transformRequest: (data) => data,
    });

    return response.data;
  },
  // STEP 6: Confirm All Docs
  confirmGovtDocs: async () => {
    const response = await api.post(ENDPOINTS.Step_6, {});
    return response.data;
  },

  getDocuments: async (isApprovedOwner: boolean = false) => {
    if (isApprovedOwner) {
      try {
        const response = await api.get(ENDPOINTS.MY_DOCUMENTS);
        if (response.data) return response.data;
      } catch (e) {
        console.log('MY_DOCUMENTS endpoint error, using pending-club-owner fallback:', e);
      }
    }
    const response = await api.get(ENDPOINTS.Get);
    return response.data;
  },

  uploadClubPhotos: async (photos: any[]) => {
    const formData = new FormData();

    photos.forEach((photo, index) => {
      formData.append('clubPhotos', {
        uri: photo.uri,
        name: photo.name || `photo_${index}_${Date.now()}.jpg`,
        type: photo.type || 'image/jpeg',
      } as any);
    });

    const response = await api.post(ENDPOINTS.STEP_7, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      transformRequest: (data) => data,
    });

    return response.data;
  },

  updateClubOwner: async (id: number | string, payloadData: any) => {
    // 1. Try PUT /api/club-owners/:id (for approved owners)
    if (id && id !== 0 && id !== '0') {
      try {
        const response = await api.put(`${ENDPOINTS.CLUB_OWNERS}/${id}`, {
          data: payloadData,
        });
        return response.data;
      } catch (error: any) {
        console.warn(`PUT ${ENDPOINTS.CLUB_OWNERS}/${id} failed (${error?.response?.status}), trying fallbacks...`);
      }
    }

    // 2. Try PUT /api/club-owner/me
    try {
      const response = await api.put(ENDPOINTS.MY_CLUB_OWNER, {
        data: payloadData,
      });
      return response.data;
    } catch (e: any) {
      console.warn('PUT MY_CLUB_OWNER fallback notice:', e?.response?.status || e?.message);
    }

    // 3. Fallback for pending owners - Step 1 details (clubName/ownerName)
    if (payloadData.clubName || payloadData.ownerName) {
      try {
        const formData = new FormData();
        if (payloadData.clubName) formData.append('clubName', payloadData.clubName);
        if (payloadData.ownerName) formData.append('ownerName', payloadData.ownerName);
        if (payloadData.phoneNumber || payloadData.phone) {
          formData.append('phoneNumber', payloadData.phoneNumber || payloadData.phone);
        }
        if (payloadData.email) formData.append('email', payloadData.email);
        if (payloadData.logo) formData.append('logo', payloadData.logo);

        const response = await api.post(ENDPOINTS.STEP_1, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            Accept: 'application/json',
          },
          transformRequest: (data) => data,
        });
        return response.data;
      } catch (e: any) {
        console.warn('STEP_1 fallback notice:', e?.response?.status || e?.message);
      }
    }

    // 4. Fallback for pending owners - Step 4 config (services, facilities, timings)
    try {
      const response = await api.post(ENDPOINTS.STEP_4, payloadData);
      return response.data;
    } catch (e: any) {
      console.warn('STEP_4 fallback notice:', e?.response?.status || e?.message);
    }

    // 5. Fallback for pending owners - Step 3 address
    if (payloadData.clubAddress || payloadData.latitude) {
      try {
        const response = await api.post(ENDPOINTS.STEP_3, {
          clubAddress: payloadData.clubAddress,
          city: payloadData.city,
          state: payloadData.state,
          pincode: payloadData.pincode,
        });
        return response.data;
      } catch (e: any) {
        console.warn('STEP_3 fallback notice:', e?.response?.status || e?.message);
      }
    }

    // Final attempt: PUT /api/club-owners
    const response = await api.put(ENDPOINTS.CLUB_OWNERS, {
      data: payloadData,
    });
    return response.data;
  },

  getVerificationStatus: async () => {
    const response = await api.get(ENDPOINTS.VERIFICATION_STATUS);
    return response.data;
  },

  getMyClubOwner: async () => {
    try {
      const response = await api.get(ENDPOINTS.MY_CLUB_OWNER);
      const ownerData = response.data?.data || response.data || null;

      if (ownerData) {
        try {
          await AsyncStorage.setItem('club_owner_me', JSON.stringify(ownerData));
        } catch (e) {
          console.log('Error caching club_owner_me in AsyncStorage:', e);
        }
        return ownerData;
      }
    } catch (e: any) {
      console.log('Error fetching MY_CLUB_OWNER (/api/club-owner/me):', e?.response?.status || e?.message);
    }
    return null;
  },
};
