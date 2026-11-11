import { requireSupabase } from '../lib/supabase';
import type { Dealership } from '../types';

const initialSettings = {
  id: true,
  name: '',
  logo_url: '',
  primary_color: '#102a43',
  secondary_color: '#4f46e5',
  whatsapp: '',
  phone: '',
  address: '',
  description: '',
};

const mapDealership = (row: {
  name: string;
  logo_url: string;
  primary_color: string;
  secondary_color: string;
  whatsapp: string;
  phone: string;
  address: string;
  description: string;
}): Dealership => ({
  name: row.name,
  logo: row.logo_url,
  primaryColor: row.primary_color,
  secondaryColor: row.secondary_color,
  whatsapp: row.whatsapp,
  phone: row.phone,
  address: row.address,
  description: row.description,
});

export const getDealershipProfile = async (): Promise<Dealership> => {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from('dealership_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo cargar la configuración de la concesionaria: ${error.message}`);
  }
  if (data) {
    return mapDealership(data);
  }

  const { data: authData, error: authError } = await supabase.auth.getSession();
  if (authError) {
    throw new Error(`No se pudo comprobar la sesión para inicializar la configuración: ${authError.message}`);
  }
  if (!authData.session) {
    throw new Error(
      'La configuración de la concesionaria todavía no existe. Inicia sesión como administrador para inicializarla.',
    );
  }

  const { error: insertError } = await supabase
    .from('dealership_settings')
    .upsert(initialSettings, { onConflict: 'id', ignoreDuplicates: true });
  if (insertError) {
    throw new Error(
      `No existe la configuración inicial. Inicia sesión como administrador para crearla o verifica los permisos de Supabase. Detalle: ${insertError.message}`,
    );
  }

  const { data: initialized, error: readError } = await supabase
    .from('dealership_settings')
    .select('*')
    .eq('id', true)
    .maybeSingle();
  if (readError) {
    throw new Error(`No se pudo leer la configuración inicial: ${readError.message}`);
  }
  if (!initialized) {
    throw new Error('Supabase no devolvió la configuración de la concesionaria.');
  }
  return mapDealership(initialized);
};

export const updateDealershipProfile = async (
  values: Dealership,
): Promise<Dealership> => {
  const supabase = requireSupabase();
  const { error: initializeError } = await supabase
    .from('dealership_settings')
    .upsert(initialSettings, { onConflict: 'id', ignoreDuplicates: true });
  if (initializeError) {
    throw new Error(
      `No se pudo asegurar la configuración inicial. Verifica que la sesión tenga rol administrador. Detalle: ${initializeError.message}`,
    );
  }

  const { data, error } = await supabase
    .from('dealership_settings')
    .update({
      name: values.name.trim(),
      logo_url: values.logo.trim(),
      primary_color: values.primaryColor,
      secondary_color: values.secondaryColor,
      whatsapp: values.whatsapp.trim(),
      phone: values.phone.trim(),
      address: values.address.trim(),
      description: values.description.trim(),
    })
    .eq('id', true)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo guardar la configuración de la concesionaria: ${error.message}`);
  }
  if (!data) {
    throw new Error('No se actualizó la configuración. Verifica que la sesión tenga rol administrador.');
  }
  return mapDealership(data);
};
