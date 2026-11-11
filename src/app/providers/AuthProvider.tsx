import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AuthUser, UserProfile } from '../../types';
import { AuthContext } from './authContext';
import {
  getInitialAdminSession,
  resolveAdminUser,
  signIn as authenticate,
  signOut as endSession,
  subscribeToAuthEvents,
} from '../../services/authService';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mantener referencia al usuario actual para evitar re-consultas en TOKEN_REFRESHED
  const userRef = useRef<AuthUser | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Contador de versión o timestamp para evitar que respuestas asíncronas lentas
  // sobreescriban eventos de autenticación más recientes.
  const latestSeqRef = useRef<number>(0);

  useEffect(() => {
    let active = true;

    // 1. Escuchar eventos de autenticación de Supabase Auth
    const unsubscribe = subscribeToAuthEvents(({ event, session }) => {
      if (!active) return;

      const currentSeq = ++latestSeqRef.current;

      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setProfile(null);
        setError(null);
        setLoading(false);
        return;
      }

      if (event === 'TOKEN_REFRESHED') {
        // En TOKEN_REFRESHED, el token se renovó exitosamente.
        // Si el usuario ya está autenticado, conservamos la sesión sin consultas redundantes a la DB.
        if (userRef.current && userRef.current.id === session.user.id) {
          setLoading(false);
          return;
        }
      }

      if (event === 'SIGNED_IN' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        // Si ya tenemos validado a este usuario en memoria con perfil, evitamos consultas redundantes
        if (userRef.current && userRef.current.id === session.user.id && userRef.current.profile) {
          setLoading(false);
          return;
        }

        // Consultamos y validamos el perfil fuera del callback del listener
        void resolveAdminUser(session.user)
          .then((resolved) => {
            if (active && currentSeq === latestSeqRef.current) {
              setUser(resolved.user);
              setProfile(resolved.profile);
              setError(null);
            }
          })
          .catch((cause: unknown) => {
            if (active && currentSeq === latestSeqRef.current) {
              setUser(null);
              setProfile(null);
              setError(cause instanceof Error ? cause.message : 'Error al validar el perfil de administrador.');
            }
          })
          .finally(() => {
            if (active && currentSeq === latestSeqRef.current) {
              setLoading(false);
            }
          });
      }
    });

    // 2. Restauración explícita mediante getSession() al montar
    const initSeq = ++latestSeqRef.current;
    void getInitialAdminSession()
      .then((resolved) => {
        if (!active || initSeq !== latestSeqRef.current) return;
        if (resolved) {
          setUser(resolved.user);
          setProfile(resolved.profile);
          setError(null);
        } else {
          // No hay sesión guardada
          setUser(null);
          setProfile(null);
        }
      })
      .catch((cause: unknown) => {
        if (!active || initSeq !== latestSeqRef.current) return;
        setUser(null);
        setProfile(null);
        setError(cause instanceof Error ? cause.message : 'No se pudo recuperar la sesión.');
      })
      .finally(() => {
        if (active && initSeq === latestSeqRef.current) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const authenticatedUser = await authenticate(email, password);
    setUser(authenticatedUser);
    setProfile(authenticatedUser.profile ?? null);
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await endSession();
    setUser(null);
    setProfile(null);
  }, []);

  const isAuthenticated = Boolean(user && profile);
  const isAdmin = Boolean(profile && profile.role === 'admin');

  const value = useMemo(
    () => ({
      user,
      profile,
      isAuthenticated,
      isAdmin,
      loading,
      error,
      signIn,
      signOut,
    }),
    [user, profile, isAuthenticated, isAdmin, loading, error, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
