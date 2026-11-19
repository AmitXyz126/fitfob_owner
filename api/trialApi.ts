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

export interface TrialGuestItem {
  clientId: string;
  clientName: string;
  clientProfile?: string;
  clientPhone?: string;
  trialDate: string;
  trialStatus: 'completed' | 'checked-in' | 'booked' | 'pending' | 'no-show' | 'missed' | 'cancelled' | 'rescheduled' | string;
  info?: string;
  bookedAtText?: string;
  closingTime?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TrialGuestsGroupedDate {
  date: string;
  displayDate: string;
  headerTitle: string;
  capacity: number;
  filled: number;
  capacityText: string;
  trials: TrialGuestItem[];
}

export interface TrialGuestsClubCapacity {
  todayFilled: number;
  todaySlotsLeft: number;
  tomorrowFilled: number;
  tomorrowSlotsOpen: number;
  todayCapacityText: string;
  tomorrowCapacityText: string;
}

export interface TrialGuestsTabCounts {
  all: number;
  today: number;
  tomorrow: number;
}

export interface TrialGuestsSummary {
  total: number;
  checkedIn: number;
  upcoming: number;
  missed: number;
  cancelled: number;
}

export interface TrialGuestsResponse {
  club: TrialGuestsClubCapacity;
  tabCounts: TrialGuestsTabCounts;
  summary: TrialGuestsSummary;
  filter: string;
  selectedDate?: string | null;
  data: TrialGuestItem[];
  trials: TrialGuestItem[];
  groupedByDate: TrialGuestsGroupedDate[];
  groups: {
    toArrive: TrialGuestItem[];
    checkedIn: TrialGuestItem[];
    cancelled: TrialGuestItem[];
    noShow: TrialGuestItem[];
  };
}

export interface TrialGuestsQueryParams {
  filter?: 'all' | 'today' | 'tomorrow' | 'by-date' | string;
  date?: string;
  search?: string;
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

  /**
   * Fetch club owner's trial guests list with filters
   * GET /api/club-owner/trial-guests
   */
  getTrialGuests: async (params?: TrialGuestsQueryParams): Promise<TrialGuestsResponse> => {
    try {
      const response = await api.get(ENDPOINTS.TRIAL_GUESTS, { params });
      const resBody = response.data;

      // In case the API wraps the payload inside a 'data' property e.g. { data: { club: ..., tabCounts: ... } }
      // vs directly returning { club: ..., tabCounts: ..., summary: ..., data: [...] }
      const root =
        resBody?.data &&
        typeof resBody.data === 'object' &&
        !Array.isArray(resBody.data) &&
        (resBody.data.club || resBody.data.tabCounts || resBody.data.summary)
          ? resBody.data
          : resBody;

      // Extract list of trial items
      const dataList: TrialGuestItem[] = Array.isArray(root?.data)
        ? root.data
        : Array.isArray(root?.trials)
        ? root.trials
        : Array.isArray(resBody?.data)
        ? resBody.data
        : Array.isArray(resBody?.trials)
        ? resBody.trials
        : Array.isArray(resBody)
        ? resBody
        : [];

      // Club capacity metrics
      const club: TrialGuestsClubCapacity = {
        todayFilled: Number(root?.club?.todayFilled || 0),
        todaySlotsLeft: Number(root?.club?.todaySlotsLeft || 0),
        tomorrowFilled: Number(root?.club?.tomorrowFilled || 0),
        tomorrowSlotsOpen: Number(root?.club?.tomorrowSlotsOpen || 0),
        todayCapacityText:
          root?.club?.todayCapacityText || `${root?.club?.todayFilled || 0} of 4 filled`,
        tomorrowCapacityText:
          root?.club?.tomorrowCapacityText || `${root?.club?.tomorrowFilled || 0} of 4 filled`,
      };

      // Date helper functions
      const now = new Date();
      const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const tmr = new Date(now);
      tmr.setDate(tmr.getDate() + 1);
      const tomorrowStr = `${tmr.getFullYear()}-${String(tmr.getMonth() + 1).padStart(2, '0')}-${String(tmr.getDate()).padStart(2, '0')}`;

      const formatDisplayDate = (dateStr: string) => {
        try {
          const cleanStr = (dateStr || '').split('T')[0];
          const parts = cleanStr.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
            const monthStr = d.toLocaleDateString('en-US', { month: 'short' });
            return `${weekday}, ${day} ${monthStr}`;
          }
        } catch {}
        return dateStr;
      };

      const formatHeaderDate = (dateStr: string) => {
        try {
          const cleanStr = (dateStr || '').split('T')[0];
          const parts = cleanStr.split('-');
          if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            const weekday = d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
            const monthStr = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
            return `${weekday}, ${day} ${monthStr}`;
          }
        } catch {}
        return (dateStr || '').toUpperCase();
      };

      // Tab Counts
      const todayItemsCount = dataList.filter(
        (t) => (t.trialDate || '').split('T')[0] === todayStr
      ).length;
      const tomorrowItemsCount = dataList.filter(
        (t) => (t.trialDate || '').split('T')[0] === tomorrowStr
      ).length;

      const tabCounts: TrialGuestsTabCounts = {
        all: Number(root?.tabCounts?.all ?? dataList.length),
        today: Number(root?.tabCounts?.today ?? todayItemsCount),
        tomorrow: Number(root?.tabCounts?.tomorrow ?? tomorrowItemsCount),
      };

      // Summary metrics
      const checkedInCalc = dataList.filter(
        (t) => t.trialStatus === 'completed' || t.trialStatus === 'checked-in'
      ).length;
      const upcomingCalc = dataList.filter(
        (t) =>
          t.trialStatus === 'booked' ||
          t.trialStatus === 'pending' ||
          t.trialStatus === 'rescheduled'
      ).length;
      const missedCalc = dataList.filter(
        (t) =>
          t.trialStatus === 'no-show' ||
          t.trialStatus === 'missed' ||
          t.trialStatus === 'expired'
      ).length;
      const cancelledCalc = dataList.filter((t) => t.trialStatus === 'cancelled').length;

      const summary: TrialGuestsSummary = {
        total: Number(root?.summary?.total ?? (dataList.length || 0)),
        checkedIn: Number(root?.summary?.checkedIn ?? checkedInCalc),
        upcoming: Number(root?.summary?.upcoming ?? upcomingCalc),
        missed: Number(root?.summary?.missed ?? missedCalc),
        cancelled: Number(root?.summary?.cancelled ?? cancelledCalc),
      };

      // Grouped by Date (build client-side fallback if backend doesn't provide it)
      let groupedByDate: TrialGuestsGroupedDate[] = [];
      if (Array.isArray(root?.groupedByDate) && root.groupedByDate.length > 0) {
        groupedByDate = root.groupedByDate;
      } else if (dataList.length > 0) {
        const groupsMap = new Map<string, TrialGuestItem[]>();
        dataList.forEach((item) => {
          const d = (item.trialDate || todayStr).split('T')[0];
          if (!groupsMap.has(d)) {
            groupsMap.set(d, []);
          }
          groupsMap.get(d)!.push(item);
        });

        // Sort descending by date
        const sortedDates = Array.from(groupsMap.keys()).sort((a, b) => b.localeCompare(a));

        groupedByDate = sortedDates.map((dateKey) => {
          const items = groupsMap.get(dateKey) || [];
          const isToday = dateKey === todayStr;
          const isTomorrow = dateKey === tomorrowStr;

          const displayDate = formatDisplayDate(dateKey);
          let headerTitle = formatHeaderDate(dateKey);
          let capacityText = `${items.length} guests`;

          if (isToday) {
            headerTitle = `TODAY · ${formatHeaderDate(dateKey)}`;
            capacityText = club.todayCapacityText || `${items.length} filled`;
          } else if (isTomorrow) {
            headerTitle = `TOMORROW · ${formatHeaderDate(dateKey)}`;
            capacityText = club.tomorrowCapacityText || `${items.length} filled`;
          }

          return {
            date: dateKey,
            displayDate,
            headerTitle,
            capacity: 5,
            filled: items.length,
            capacityText,
            trials: items,
          };
        });
      }

      // Grouping for Today / status categories
      let groups = {
        toArrive: Array.isArray(root?.groups?.toArrive) ? root.groups.toArrive : [],
        checkedIn: Array.isArray(root?.groups?.checkedIn) ? root.groups.checkedIn : [],
        cancelled: Array.isArray(root?.groups?.cancelled) ? root.groups.cancelled : [],
        noShow: Array.isArray(root?.groups?.noShow) ? root.groups.noShow : [],
      };

      const hasRootGroups =
        groups.toArrive.length > 0 ||
        groups.checkedIn.length > 0 ||
        groups.cancelled.length > 0 ||
        groups.noShow.length > 0;

      if (!hasRootGroups && dataList.length > 0) {
        const targetDate = params?.date || todayStr;
        const targetTrials = dataList.filter(
          (t) => (t.trialDate || '').split('T')[0] === targetDate
        );

        groups = {
          toArrive: targetTrials.filter(
            (t) =>
              t.trialStatus === 'booked' ||
              t.trialStatus === 'pending' ||
              t.trialStatus === 'rescheduled'
          ),
          checkedIn: targetTrials.filter(
            (t) => t.trialStatus === 'completed' || t.trialStatus === 'checked-in'
          ),
          cancelled: targetTrials.filter((t) => t.trialStatus === 'cancelled'),
          noShow: targetTrials.filter(
            (t) =>
              t.trialStatus === 'no-show' ||
              t.trialStatus === 'missed' ||
              t.trialStatus === 'expired'
          ),
        };
      }

      return {
        club,
        tabCounts,
        summary,
        filter: root?.filter || params?.filter || 'all',
        selectedDate: root?.selectedDate || params?.date || null,
        data: dataList,
        trials: dataList,
        groupedByDate,
        groups,
      };
    } catch (error: any) {
      console.warn('Failed to fetch trial guests:', error);
      throw error;
    }
  },
};
