import { QueryClient } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { createStore, del, get, set } from 'idb-keyval';

const cacheDuration = 24 * 60 * 60 * 1000;

export const vehicleQueryKeys = {
  admin: ['adminVehicles'] as const,
  publicList: ['publicVehicles'] as const,
  publicHome: ['publicHomeVehicles'] as const,
  publicCatalog: ['publicCatalog'] as const,
  publicVehicle: (id: string) => ['publicVehicle', id] as const,
  publicRelated: (id: string) => ['publicRelatedVehicles', id] as const,
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: cacheDuration,
    },
  },
});

const catalogCacheStore = createStore('dealpush-query-cache', 'public-catalog');

const indexedDbStorage = {
  getItem: async (key: string) => (await get<string>(key, catalogCacheStore)) ?? null,
  setItem: (key: string, value: string) => set(key, value, catalogCacheStore),
  removeItem: (key: string) => del(key, catalogCacheStore),
};

export const queryPersister = createAsyncStoragePersister({
  storage: indexedDbStorage,
  key: 'dealpush-public-vehicle-cache',
  throttleTime: 1000,
});

export const invalidateVehicleQueries = async (): Promise<void> => {
  try {
    await queryPersister.removeClient();
  } catch (cause) {
    console.error('No se pudo limpiar la caché persistida del catálogo.', cause);
  }

  await Promise.all([
    queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.admin }),
    queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.publicList }),
    queryClient.invalidateQueries({ queryKey: vehicleQueryKeys.publicHome }),
    queryClient.resetQueries({ queryKey: vehicleQueryKeys.publicCatalog }),
    queryClient.invalidateQueries({ queryKey: ['publicVehicle'] }),
    queryClient.invalidateQueries({ queryKey: ['publicRelatedVehicles'] }),
  ]);
};

export const isPersistableQuery = (queryKey: readonly unknown[]): boolean =>
  queryKey[0] === 'publicCatalog';
