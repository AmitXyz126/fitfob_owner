import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

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
    });

    return response.data;
  },

  getMe: async () => {
    try {
      const response = await api.get(ENDPOINTS.GET_ONBOARDING_STATUS);
      const data = response.data;
      if (data) {
        const isApproved =
          data.isApprovedOwner === true ||
          data.verification_status === 'approved' ||
          data.verificationStatus === 'approved' ||
          data.status === 'approved';
        return {
          ...data,
          isApprovedOwner: isApproved,
          verification_status: isApproved
            ? 'approved'
            : data.verification_status || data.verificationStatus || 'pending',
        };
      }
      return data;
    } catch (error: any) {
      console.log('GET_ONBOARDING_STATUS error in getMe, checking club-owners fallback:', error?.response?.status, error?.message);
      // When user is approved by admin, pending-club-owner/me returns 404/400 because they are now in club-owners!
      try {
        const ownerRes = await api.get(ENDPOINTS.CLUB_OWNERS);
        const ownerList = ownerRes.data?.data || ownerRes.data || [];
        const ownerData = Array.isArray(ownerList) ? (ownerList[0] || null) : ownerRes.data;

        if (ownerData && (ownerData.id || ownerData.clubName || ownerData.ownerName || ownerData.attributes)) {
          console.log('✅ Approved Club Owner record found in club-owners:', ownerData);
          return {
            ...ownerData,
            status: 'approved',
            verification_status: 'approved',
            isApprovedOwner: true,
          };
        }
      } catch (e) {
        console.log('Error fetching club-owners in getMe fallback:', e);
      }
      throw error;
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
      },
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
    });

    return response.data;
  },
  // STEP 6: Confirm All Docs
  confirmGovtDocs: async () => {
    const response = await api.post(ENDPOINTS.Step_6, {});
    return response.data;
  },

  getDocuments: async () => {
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
    const response = await api.put(`${ENDPOINTS.CLUB_OWNERS}/${id}`, {
      data: payloadData,
    });
    return response.data;
  },
};
