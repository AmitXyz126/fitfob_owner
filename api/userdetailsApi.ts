import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export const userDetailsApi = {

  simpleUpload: async (file: any) => {
    const formData = new FormData();
    
    // File preparation
    const fileToUpload = {
      uri: file.uri || file,
      name: file.name || 'upload.jpg',
      type: file.type || 'image/jpeg',
    };
    
    formData.append('file', fileToUpload as any);

    const response = await api.post('/api/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Return only the ID from response
    return response.data.id; 
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
    

    if (data.image) {
      
      const uriParts = data.image
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
      pincode:data.pincode,  
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
    
    // File structure handling
    const fileToUpload = {
      uri: fileData.uri || fileData, 
      name: fileData.name || 'document.jpg',
      type: fileData.type || 'image/jpeg',
    };
    
    formData.append('file', fileToUpload as any);

    const response = await api.post(ENDPOINTS.Step_5, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  // STEP 6: Confirm All Docs
  confirmGovtDocs: async () => {
    const response = await api.post(ENDPOINTS.Step_6, {});
    return response.data;
  },
};
 