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

    // ✅ SAFE ANDROID VERSION

    if (data.logo?.uri) {
      formData.append('logo', {
        uri: data.logo.uri,
        name: data.logo.name || `upload_${Date.now()}.jpg`,
        type: data.logo.type || 'image/jpeg',
      } as any);
    }

    const response = await api.post(ENDPOINTS.STEP_1, formData);

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
      type: fileData.type || 'image/jpeg',
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
      // React Native requires the { uri, name, type } structure to recognize a file
      formData.append('clubPhotos', {
        uri: photo.uri,
        name: photo.name || `photo_${index}_${Date.now()}.jpg`,
        type: photo.type || 'image/jpeg',
      } as any);
    });

    // We MUST override the global 'application/json' default from apiInstance
    const response = await api.post(ENDPOINTS.STEP_7, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      },
      // IMPORTANT: Prevent Axios from trying to serialize FormData into JSON
      transformRequest: (data) => data,
    });

    return response.data;
  },
};
