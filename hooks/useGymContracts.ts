import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { gymContractApi, GymContractData } from '@/api/gymContractApi';

export type UseGymContractsOptions = Omit<
  UseQueryOptions<GymContractData, Error>,
  'queryKey' | 'queryFn'
>;

export const useGymContracts = (options?: UseGymContractsOptions) => {
  const query = useQuery<GymContractData>({
    queryKey: ['gym-contracts-my-contract'],
    queryFn: gymContractApi.getMyContract,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    ...options,
  });

  return {
    contractData: query.data,
    plans: query.data?.plans || [],
    zeroCommissionOffer: query.data?.zeroCommissionOffer,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
    error: query.error,
  };
};

