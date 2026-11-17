import api from './apiInstance';
import { ENDPOINTS } from './endpoint';

export interface TrialClient {
  clientId: string;
  name: string;
  gender?: string;
  selfieUrl?: string;
  phoneNumber?: string;
  email?: string;
}

export interface TrialItem {
  id?: number | string;
  trialDate: string;
  trialstatus?: 'completed' | 'checked-in' | 'booked' | 'pending' | 'expired' | string;
  trialStatus?: string;
  checkinTime?: string;
  client: TrialClient;
}

export interface TrialSettingsResponse {
  isTrialEnabled: boolean;
  dailyTrialLimit: number;
  monthlyLeads?: number;
  todayTrials?: TrialItem[];
  tomorrowTrials?: TrialItem[];
  trials?: TrialItem[];
  freeLeadsThisMonth?: number;
}

export interface UpdateTrialSettingsPayload {
  isTrialEnabled: boolean;
  dailyTrialLimit: number;
}

export const trialApi = {
  /**
   * Fetch club owner's trial settings & list of trial bookings
   * GET /api/club-owner/trial-settings
   */
  getTrialSettings: async (): Promise<TrialSettingsResponse> => {
    try {
      const response = await api.get(ENDPOINTS.TRIAL_SETTINGS);
      const raw = response.data?.data || response.data;
      return {
        isTrialEnabled: Boolean(raw?.isTrialEnabled),
        dailyTrialLimit: typeof raw?.dailyTrialLimit === 'number' ? raw.dailyTrialLimit : 5,
        monthlyLeads: typeof raw?.monthlyLeads === 'number' ? raw.monthlyLeads : raw?.freeLeadsThisMonth,
        todayTrials: Array.isArray(raw?.todayTrials) ? raw.todayTrials : undefined,
        tomorrowTrials: Array.isArray(raw?.tomorrowTrials) ? raw.tomorrowTrials : undefined,
        trials: Array.isArray(raw?.trials) ? raw.trials : [],
        freeLeadsThisMonth: typeof raw?.monthlyLeads === 'number' ? raw.monthlyLeads : raw?.freeLeadsThisMonth,
      };
    } catch (error: any) {
      console.warn('Failed to fetch trial settings:', error);
      throw error;
    }
  },

  /**
   * Update club owner's trial enabled status and daily limit
   * PUT /api/club-owner/trial-settings
   */
  updateTrialSettings: async (payload: UpdateTrialSettingsPayload): Promise<TrialSettingsResponse> => {
    try {
      const response = await api.put(ENDPOINTS.TRIAL_SETTINGS, payload);
      const raw = response.data?.data || response.data;
      return {
        isTrialEnabled: Boolean(raw?.isTrialEnabled ?? payload.isTrialEnabled),
        dailyTrialLimit: typeof raw?.dailyTrialLimit === 'number' ? raw.dailyTrialLimit : payload.dailyTrialLimit,
        monthlyLeads: typeof raw?.monthlyLeads === 'number' ? raw.monthlyLeads : raw?.freeLeadsThisMonth,
        todayTrials: Array.isArray(raw?.todayTrials) ? raw.todayTrials : undefined,
        tomorrowTrials: Array.isArray(raw?.tomorrowTrials) ? raw.tomorrowTrials : undefined,
        trials: Array.isArray(raw?.trials) ? raw.trials : [],
        freeLeadsThisMonth: typeof raw?.monthlyLeads === 'number' ? raw.monthlyLeads : raw?.freeLeadsThisMonth,
      };
    } catch (error: any) {
      console.warn('Failed to update trial settings:', error);
      throw error;
    }
  },
};
