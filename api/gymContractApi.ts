import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface GymContractPlan {
  duration: 'monthly' | 'three_months' | 'six_months' | 'twelve_months' | string;
  customerPrice: number;
  fitfobCommission: number;
  ownerPayoutAfterPromotionEnds: number;
}

export interface ZeroCommissionOffer {
  userLimit: number;
  usedUserCount: number;
  remainingUserCount: number;
  completed: boolean;
}

export interface GymContractData {
  plans: GymContractPlan[];
  zeroCommissionOffer?: ZeroCommissionOffer;
  clubName?: string;
  category?: string;
  clubCategory?: string;
  status?: string;
}

export const gymContractApi = {
  getMyContract: async (): Promise<GymContractData> => {
    const response = await api.get(ENDPOINTS.GYM_CONTRACTS_MY_CONTRACT);
    const raw = response.data?.data || response.data;
    return {
      plans: Array.isArray(raw?.plans) ? raw.plans : [],
      zeroCommissionOffer: raw?.zeroCommissionOffer,
      clubName: raw?.clubName || raw?.club_name,
      category: raw?.category || raw?.clubCategory,
      clubCategory: raw?.clubCategory || raw?.category,
      status: raw?.status,
    };
  },
};

