import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface LocalMembershipPlan {
  id: number | string;
  documentId: string;
  planName: string;
  price: number;
  monthDuration: number;
  description: string;
  isActive: boolean;
  validUpto: string;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  locale?: string | null;
  [key: string]: any;
}

export interface CreatePlanPayload {
  planName: string;
  price: number;
  monthDuration: number;
  description?: string;
  isActive?: boolean;
  validUpto?: string;
}

export interface UpdatePlanPayload {
  planName?: string;
  price?: number;
  monthDuration?: number;
  description?: string;
  isActive?: boolean;
  validUpto?: string;
}

export const parseIsActive = (val: any): boolean => {
  if (
    val === false ||
    val === 0 ||
    val === 'false' ||
    val === '0' ||
    val === 'inactive' ||
    val === 'deactivated' ||
    val === 'paused'
  ) {
    return false;
  }
  if (
    val === true ||
    val === 1 ||
    val === 'true' ||
    val === '1' ||
    val === 'active'
  ) {
    return true;
  }
  return val != null ? Boolean(val) : true;
};

/**
 * Normalizes API response item to uniform LocalMembershipPlan
 */
export const normalizeMembershipPlan = (item: any): LocalMembershipPlan => {
  if (!item) return {} as LocalMembershipPlan;
  const attrs = item.attributes || item;

  const docId =
    item.documentId ||
    attrs.documentId ||
    (item.id ? String(item.id) : `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`);

  const rawActive =
    attrs.isActive !== undefined
      ? attrs.isActive
      : attrs.is_active !== undefined
      ? attrs.is_active
      : item.isActive !== undefined
      ? item.isActive
      : item.is_active !== undefined
      ? item.is_active
      : attrs.status !== undefined
      ? attrs.status === 'active'
      : true;

  return {
    id: item.id || attrs.id || docId,
    documentId: String(docId),
    planName: attrs.planName || item.planName || 'Membership Plan',
    price: Number(attrs.price ?? item.price ?? 0),
    monthDuration: Number(attrs.monthDuration ?? item.monthDuration ?? 1),
    description: attrs.description || item.description || '',
    isActive: parseIsActive(rawActive),
    validUpto: attrs.validUpto || item.validUpto || 'unlimited',
    createdAt: attrs.createdAt || item.createdAt,
    updatedAt: attrs.updatedAt || item.updatedAt,
    publishedAt: attrs.publishedAt || item.publishedAt,
    locale: attrs.locale ?? item.locale ?? null,
  };
};

export const membershipPlanApi = {
  /**
   * Fetch all club membership plans
   * GET /api/local-membership-plans/my-plans
   */
  getMyPlans: async (): Promise<LocalMembershipPlan[]> => {
    try {
      const response = await api.get(ENDPOINTS.LOCAL_MEMBERSHIP_MY_PLANS);
      const resData = response.data;

      let list: any[] = [];
      if (Array.isArray(resData)) {
        list = resData;
      } else if (resData && Array.isArray(resData.data)) {
        list = resData.data;
      } else if (resData?.data && typeof resData.data === 'object') {
        list = [resData.data];
      }

      return list.map(normalizeMembershipPlan);
    } catch (error) {
      console.error('Error fetching membership plans:', error);
      throw error;
    }
  },

  /**
   * Create a new local membership plan
   * POST /api/local-membership-plans
   */
  createPlan: async (payload: CreatePlanPayload): Promise<{ message: string; data?: LocalMembershipPlan }> => {
    try {
      const body = {
        planName: payload.planName.trim(),
        price: Number(payload.price),
        monthDuration: Number(payload.monthDuration) || 1,
        description: (payload.description || '').trim(),
        isActive: payload.isActive !== undefined ? payload.isActive : true,
        validUpto: payload.validUpto || 'unlimited',
      };

      console.log('📤 [createPlan] Submitting payload to /api/local-membership-plans:', JSON.stringify(body));
      const response = await api.post(ENDPOINTS.LOCAL_MEMBERSHIP_PLANS, body);
      const resData = response.data;

      const normalized = resData?.data ? normalizeMembershipPlan(resData.data) : undefined;
      return {
        message: resData?.message || 'Local membership plan created successfully',
        data: normalized,
      };
    } catch (error) {
      console.error('Error creating membership plan:', error);
      throw error;
    }
  },

  /**
   * Update an existing membership plan
   * PUT /api/local-membership-plans/:documentId
   */
  updatePlan: async (
    documentId: string,
    payload: UpdatePlanPayload
  ): Promise<{ message: string; data?: LocalMembershipPlan }> => {
    try {
      const body: any = {};
      if (payload.planName !== undefined) body.planName = payload.planName.trim();
      if (payload.price !== undefined) body.price = Number(payload.price);
      if (payload.monthDuration !== undefined) body.monthDuration = Number(payload.monthDuration);
      if (payload.description !== undefined) body.description = payload.description.trim();
      if (payload.validUpto !== undefined) body.validUpto = payload.validUpto;
      if (payload.isActive !== undefined) body.isActive = payload.isActive;

      console.log(`📤 [updatePlan] Submitting to /api/local-membership-plans/${documentId}:`, JSON.stringify(body));
      const response = await api.put(ENDPOINTS.LOCAL_MEMBERSHIP_PLAN_BY_ID(documentId), body);
      const resData = response.data;

      const normalized = resData?.data ? normalizeMembershipPlan(resData.data) : undefined;
      return {
        message: resData?.message || 'Local membership plan updated successfully',
        data: normalized,
      };
    } catch (error) {
      console.error(`Error updating membership plan ${documentId}:`, error);
      throw error;
    }
  },

  /**
   * Delete a membership plan
   * DELETE /api/local-membership-plans/:documentId
   */
  deletePlan: async (documentId: string): Promise<{ message: string }> => {
    try {
      console.log(`🗑️ [deletePlan] Deleting plan with documentId: ${documentId}`);
      const response = await api.delete(ENDPOINTS.LOCAL_MEMBERSHIP_PLAN_BY_ID(documentId));
      return {
        message: response.data?.message || 'Local membership plan deleted successfully',
      };
    } catch (error) {
      console.error(`Error deleting membership plan ${documentId}:`, error);
      throw error;
    }
  },

  /**
   * Toggle plan active/inactive status
   * Supports:
   * 1. PUT /api/local-membership/:documentId
   * 2. PUT /api/local-membership (with body)
   * 3. PUT /api/local-membership-plans/:documentId
   */
  togglePlanStatus: async (
    documentId: string,
    isActive: boolean
  ): Promise<{ message: string; data?: LocalMembershipPlan }> => {
    const statusPayload = { isActive };

    // 1. Try PUT /api/local-membership/:documentId
    try {
      console.log(`🔄 [togglePlanStatus] Trying /api/local-membership/${documentId}:`, statusPayload);
      const response = await api.put(ENDPOINTS.LOCAL_MEMBERSHIP_STATUS(documentId), statusPayload, {
        timeout: 10000,
      });
      return {
        message:
          response.data?.message ||
          `Local membership plan ${isActive ? 'activated' : 'deactivated'} successfully`,
        data: response.data?.data ? normalizeMembershipPlan(response.data.data) : undefined,
      };
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404 || status === 405) {
        // 2. Try PUT /api/local-membership with body
        try {
          console.log(`🔄 [togglePlanStatus] Trying fallback /api/local-membership:`, { documentId, isActive });
          const response2 = await api.put(ENDPOINTS.LOCAL_MEMBERSHIP_BASE, { documentId, isActive }, {
            timeout: 10000,
          });
          return {
            message:
              response2.data?.message ||
              `Local membership plan ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: response2.data?.data ? normalizeMembershipPlan(response2.data.data) : undefined,
          };
        } catch (err2: any) {
          if (err2?.response?.status === 404 || err2?.response?.status === 405) {
            // 3. Fallback to PUT /api/local-membership-plans/:documentId
            console.log(`🔄 [togglePlanStatus] Trying fallback /api/local-membership-plans/${documentId}:`, statusPayload);
            const response3 = await api.put(ENDPOINTS.LOCAL_MEMBERSHIP_PLAN_BY_ID(documentId), statusPayload, {
              timeout: 10000,
            });
            return {
              message:
                response3.data?.message ||
                `Local membership plan ${isActive ? 'activated' : 'deactivated'} successfully`,
              data: response3.data?.data ? normalizeMembershipPlan(response3.data.data) : undefined,
            };
          }
          throw err2;
        }
      }
      throw err;
    }
  },
};
