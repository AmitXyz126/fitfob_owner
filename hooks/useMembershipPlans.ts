import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  membershipPlanApi,
  LocalMembershipPlan,
  CreatePlanPayload,
  UpdatePlanPayload,
} from '@/api/membershipPlanApi';
import { useMembershipPlanStore } from '@/store/useMembershipPlanStore';
import { useAuthStore } from '@/store/useAuthStore';
import Toast from 'react-native-toast-message';

export const useMembershipPlans = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userKey = user?.id ? String(user.id) : user?.email || 'guest';
  const queryKey = ['local-membership-plans', userKey];

  const store = useMembershipPlanStore();

  // 1. Query Plans
  const query = useQuery<LocalMembershipPlan[]>({
    queryKey,
    queryFn: async () => {
      // First load from store/cache if empty
      if (store.plans.length === 0) {
        await store.loadCachedPlans();
      }
      try {
        const remoteData = await membershipPlanApi.getMyPlans();
        store.setPlans(remoteData);
        return remoteData;
      } catch (err) {
        console.warn('Network error fetching membership plans, using store cache:', err);
        return store.plans;
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // 2. Create Plan Mutation
  const createMutation = useMutation({
    mutationFn: async (payload: CreatePlanPayload) => {
      const res = await store.createPlan(payload);
      return res;
    },
    onSuccess: (createdPlan) => {
      queryClient.invalidateQueries({ queryKey });
      Toast.show({
        type: 'success',
        text1: 'Plan Created',
        text2: createdPlan?.planName
          ? `${createdPlan.planName} has been added successfully`
          : 'Membership plan created successfully',
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to create membership plan';
      Toast.show({
        type: 'error',
        text1: 'Creation Failed',
        text2: msg,
      });
    },
  });

  // 3. Update Plan Mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      documentId,
      payload,
    }: {
      documentId: string;
      payload: UpdatePlanPayload;
    }) => {
      const res = await store.updatePlan(documentId, payload);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      Toast.show({
        type: 'success',
        text1: 'Plan Updated',
        text2: 'Membership plan updated successfully',
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update membership plan';
      Toast.show({
        type: 'error',
        text1: 'Update Failed',
        text2: msg,
      });
    },
  });

  // 4. Delete Plan Mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      await store.deletePlan(documentId);
      return documentId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      Toast.show({
        type: 'info',
        text1: 'Plan Deleted',
        text2: 'Membership plan removed successfully',
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to delete membership plan';
      Toast.show({
        type: 'error',
        text1: 'Delete Failed',
        text2: msg,
      });
    },
  });

  // 5. Toggle Status Mutation
  const toggleMutation = useMutation({
    mutationFn: async ({
      documentId,
      isActive,
      planName,
    }: {
      documentId: string;
      isActive: boolean;
      planName?: string;
    }) => {
      await store.toggleStatus(documentId, isActive);
      return { documentId, isActive, planName };
    },
    onSuccess: ({ isActive, planName }) => {
      queryClient.invalidateQueries({ queryKey });
      Toast.show({
        type: 'success',
        text1: isActive ? 'Plan Activated' : 'Plan Deactivated',
        text2: planName
          ? `${planName} is now ${isActive ? 'active' : 'paused'}`
          : `Plan is now ${isActive ? 'active' : 'paused'}`,
        visibilityTime: 1800,
      });
    },
    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to update plan status';
      Toast.show({
        type: 'error',
        text1: 'Status Change Failed',
        text2: msg,
      });
    },
  });

  // Ensure plans from query or store
  const plans = (query.data && query.data.length > 0) ? query.data : store.plans;

  return {
    plans,
    isLoading: query.isLoading && plans.length === 0,
    isRefreshing: query.isRefetching,
    refetch: query.refetch,

    // Create
    createPlan: createMutation.mutateAsync,
    isCreating: createMutation.isPending,

    // Update
    updatePlan: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,

    // Delete
    deletePlan: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,

    // Toggle
    toggleStatus: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  };
};
