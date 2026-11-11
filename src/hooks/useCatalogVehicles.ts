import { useCallback, useEffect, useMemo, useState } from 'react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import {
  getPublicCatalogBrands,
  getPublicCatalogPage,
} from '../services/vehicleService';
import { vehicleQueryKeys } from '../lib/queryClient';
import type { VehicleCardData, VehicleFilters } from '../types';

export const useCatalogVehicles = (filters: VehicleFilters) => {
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search.trim());

  const immediateSearch = filters.search.trim();
  const searchPending = immediateSearch !== debouncedSearch;
  const requestFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  useEffect(() => {
    if (filters.search.trim() === debouncedSearch) {
      return;
    }
    const timer = window.setTimeout(() => {
      setDebouncedSearch(filters.search.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [debouncedSearch, filters.search]);

  const brandsQuery = useQuery({
    queryKey: [...vehicleQueryKeys.publicCatalog, 'brands'],
    queryFn: getPublicCatalogBrands,
  });
  const {
    data,
    error: catalogError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    refetch,
  } = useInfiniteQuery({
    queryKey: [...vehicleQueryKeys.publicCatalog, 'pages', requestFilters],
    queryFn: ({ pageParam }) => getPublicCatalogPage(requestFilters, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.hasMore
        ? pages.reduce((offset, page) => offset + page.vehicles.length, 0)
        : undefined,
    enabled: !searchPending,
  });

  const loadMore = useCallback(async () => {
    if (!hasNextPage || isFetchingNextPage || searchPending) {
      return;
    }
    await fetchNextPage({ cancelRefetch: false });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage, searchPending]);

  const retry = useCallback(() => {
    if (!data?.pages.length) {
      void refetch();
      return;
    }
    void loadMore();
  }, [data?.pages.length, loadMore, refetch]);

  const catalogVehicles = useMemo(
    () => data?.pages.flatMap((page) => page.vehicles) ?? [],
    [data],
  );
  const vehicles = searchPending ? [] : catalogVehicles;
  const availableBrands = useMemo(
    () => brandsQuery.data?.length
      ? brandsQuery.data
      : [...new Set(catalogVehicles.map((vehicle: VehicleCardData) => vehicle.brand))].sort(),
    [brandsQuery.data, catalogVehicles],
  );

  return {
    vehicles,
    brands: availableBrands,
    loading: searchPending || (isPending && !data),
    loadingMore: isFetchingNextPage,
    error: searchPending
      ? null
      : catalogError instanceof Error
        ? catalogError.message
        : catalogError
          ? 'No se pudieron cargar los vehículos.'
          : null,
    brandsError: brandsQuery.error instanceof Error
      ? brandsQuery.error.message
      : brandsQuery.error
        ? 'No se pudieron cargar las marcas.'
        : null,
    total: searchPending ? null : data?.pages[0]?.total ?? null,
    hasMore: !searchPending && Boolean(hasNextPage),
    loadMore,
    retry,
  };
};
