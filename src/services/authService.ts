import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { isSupabaseConfigured, requireSupabase } from '../lib/supabase';
import type { AuthUser, UserProfile } from '../types';

export interface AdminResolution {
  user: AuthUser;
  profile: UserProfile;
}

const toAuthUser = (
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  },
  profile?: UserProfile,
): AuthUser => ({
  id: user.id,
  email: user.email ?? '',
  name:
    profile?.fullName ||
    (typeof user.user_metadata?.name === 'string'
      ? user.user_metadata.name
      : user.email ?? 'Administrador'),
  profile,
});

/**
 * Consulta la tabla public.profiles de manera segura sin llamar a signOut().
 * Si el usuario no tiene perfil o no es admin, lanza un error con el motivo específico.
 */
export const fetchAdminProfile = async (userId: string): Promise<UserProfile> => {
  const supabase = requireSupabase();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, created_at')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo validar el perfil administrador: ${error.message}`);
  }
  if (!profile) {
    throw new Error('Esta cuenta no tiene un perfil configurado en el sistema.');
  }
  if (profile.role !== 'admin') {
    throw new Error('Esta cuenta no tiene permisos de administrador.');
  }

  return {
    id: profile.id,
    fullName: profile.full_name,
    role: profile.role,
    createdAt: profile.created_at,
  };
};

/**
 * Valida que un usuario sea admin y retorna el AuthUser con su perfil.
 */
export const resolveAdminUser = async (user: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): Promise<AdminResolution> => {
  const profile = await fetchAdminProfile(user.id);
  const authUser = toAuthUser(user, profile);
  return { user: authUser, profile };
};

/**
 * Obtiene la sesión actual persistida (vía getSession()) y valida el rol admin.
 * Si no hay sesión, retorna null de forma segura.
 */
export const getInitialAdminSession = async (): Promise<AdminResolution | null> => {
  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = requireSupabase();
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(`Error al recuperar la sesión: ${error.message}`);
  }
  if (!session?.user) {
    return null;
  }

  return resolveAdminUser(session.user);
};

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const result = await getInitialAdminSession();
  return result ? result.user : null;
};

export type AuthChangeCallback = (params: {
  event: AuthChangeEvent;
  session: Session | null;
}) => void;

/**
 * Suscribe al listener global de eventos auth de Supabase.
 * El callback no bloquea el hilo interno de Supabase.
 */
export const subscribeToAuthEvents = (
  callback: AuthChangeCallback,
): (() => void) => {
  if (!isSupabaseConfigured) {
    return () => undefined;
  }

  const supabase = requireSupabase();
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback({ event, session });
  });

  return () => {
    data.subscription.unsubscribe();
  };
};

export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  if (!email.trim() || !password) {
    throw new Error('Completa tu correo electrónico y contraseña.');
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error('Supabase no devolvió un usuario autenticado.');
  }

  try {
    const { user: adminUser } = await resolveAdminUser(data.user);
    return adminUser;
  } catch (cause) {
    // Si la autenticación fue correcta pero no es admin, cerramos la sesión en Supabase
    await supabase.auth.signOut().catch(() => undefined);
    throw cause;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  if (!email.trim()) {
    throw new Error('Ingresa un correo electrónico válido.');
  }

  const supabase = requireSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/login`,
  });
  if (error) {
    throw new Error(error.message);
  }
};

export const signOut = async (): Promise<void> => {
  const supabase = requireSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new Error(error.message);
  }
};
