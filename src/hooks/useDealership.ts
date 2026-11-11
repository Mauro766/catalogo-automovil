import { useCallback, useEffect, useState } from 'react';
import { getDealershipProfile, updateDealershipProfile } from '../services/dealershipService';
import type { Dealership } from '../types';

export const useDealership = () => {
  const [dealership, setDealership] = useState<Dealership | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setDealership(await getDealershipProfile());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo cargar la configuración.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void getDealershipProfile()
      .then((result) => {
        if (active) {
          setDealership(result);
          setError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setError(cause instanceof Error ? cause.message : 'No se pudo cargar la configuración.');
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (values: Dealership) => {
    setError(null);
    try {
      setDealership(await updateDealershipProfile(values));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la configuración.');
      return false;
    }
  }, []);

  return { dealership, loading, error, reload, save };
};
