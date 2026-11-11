import type { ReactNode } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { AuthProvider } from './AuthProvider';
import { isPersistableQuery, queryClient, queryPersister } from '../../lib/queryClient';

interface AppProvidersProps {
  children: ReactNode;
}

export const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: 'public-vehicle-cache-v2',
        dehydrateOptions: {
          shouldDehydrateQuery: (query) =>
            query.state.status === 'success' && isPersistableQuery(query.queryKey),
          shouldDehydrateMutation: () => false,
        },
      }}
      onError={() => console.error('No se pudo restaurar la caché pública del catálogo desde IndexedDB.')}
    >
      <AuthProvider>{children}</AuthProvider>
    </PersistQueryClientProvider>
  );
};
