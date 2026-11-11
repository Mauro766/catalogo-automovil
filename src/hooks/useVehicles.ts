import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getPublicVehicles, getVehicles } from '../services/vehicleService';
import { vehicleQueryKeys } from '../lib/queryClient';

export const useVehicles = (publicOnly = false) => {
  const {
    data,
    error: queryError,
    isPending,
    refetch,
  } = useQuery({
    queryKey: publicOnly ? vehicleQueryKeys.publicList : vehicleQueryKeys.admin,
    queryFn: publicOnly ? getPublicVehicles : getVehicles,
  });
  const reload = useCallback(async () => {
    await refetch();
  }, [refetch]);

  return {
    vehicles: data ?? [],
    loading: isPending && !data,
    error: queryError instanceof Error
      ? queryError.message
      : queryError
        ? 'No se pudieron cargar los vehículos.'
        : null,
    reload,
  };
};
