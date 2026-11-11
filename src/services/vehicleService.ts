import { requireSupabase } from '../lib/supabase';
import type { Database } from '../types/database';
import type {
  Vehicle,
  VehicleCardData,
  VehicleCondition,
  VehicleFilters,
  VehicleFormValues,
  VehicleImage,
  VehicleStatus,
} from '../types';
import {
  deleteVehicleImage,
  isLocalImagePreview,
  removeVehicleImageFile,
  uploadVehicleImage,
} from './vehicleImageService';
import { ensureVehicleCatalogPath } from './vehicleCatalogService';

type VehicleRow = Database['public']['Tables']['vehicles']['Row'];
type VehicleInsert = Database['public']['Tables']['vehicles']['Insert'];
type ImageRow = Database['public']['Tables']['vehicle_images']['Row'];
type ImageInsert = Database['public']['Tables']['vehicle_images']['Insert'];
type CatalogVehicleRow = Pick<
  VehicleRow,
  | 'id'
  | 'brand'
  | 'model'
  | 'version'
  | 'year'
  | 'price'
  | 'currency'
  | 'status'
  | 'condition'
  | 'type'
  | 'mileage'
  | 'fuel'
  | 'transmission'
>;

export const CATALOG_PAGE_SIZE = 12;

export interface CatalogVehiclePage {
  vehicles: VehicleCardData[];
  total: number | null;
  hasMore: boolean;
}

const catalogPageRequests = new Map<string, Promise<CatalogVehiclePage>>();
let publicCatalogBrandsRequest: Promise<string[]> | null = null;
let publicCatalogBrandsCache: string[] | null = null;
const catalogVehicleFields =
  'id, brand, model, version, year, price, currency, status, condition, type, mileage, fuel, transmission';

interface VehicleQueryOptions {
  publicOnly?: boolean;
  featuredOnly?: boolean;
  condition?: VehicleCondition;
  limit?: number;
}

const mapVehicle = (row: VehicleRow, images: VehicleImage[]): Vehicle => ({
  id: row.id,
  brand: row.brand,
  model: row.model,
  version: row.version,
  year: row.year,
  price: Number(row.price),
  currency: row.currency,
  status: row.status,
  condition: row.condition,
  featured: row.featured,
  type: row.type,
  mileage: row.mileage ?? undefined,
  fuel: row.fuel ?? undefined,
  transmission: row.transmission ?? undefined,
  engine: row.engine,
  power: row.power ?? undefined,
  drivetrain: row.drivetrain,
  color: row.color,
  doors: row.doors ?? undefined,
  seats: row.seats ?? undefined,
  description: row.description,
  equipment: toStringArray(row.equipment, 'equipamiento'),
  highlights: toStringArray(row.highlights, 'características destacadas'),
  images,
  createdAt: row.created_at,
  publishedAt: row.published_at,
});

const toStringArray = (value: unknown, field: string): string[] => {
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`La columna ${field} tiene un formato inesperado en Supabase.`);
  }
  return value;
};

const mapImage = (row: ImageRow): VehicleImage => ({
  id: row.id,
  publicUrl: row.public_url,
  storagePath: row.storage_path,
  alt: row.alt,
  isPrimary: row.is_primary,
  sortOrder: row.sort_order,
});

const mapCatalogVehicle = (
  row: CatalogVehicleRow,
  image: VehicleImage | undefined,
): VehicleCardData => ({
  id: row.id,
  brand: row.brand,
  model: row.model,
  version: row.version,
  year: row.year,
  price: Number(row.price),
  currency: row.currency,
  status: row.status,
  condition: row.condition,
  type: row.type,
  mileage: row.mileage ?? undefined,
  fuel: row.fuel ?? undefined,
  transmission: row.transmission ?? undefined,
  images: image ? [image] : [],
});

const fetchPrimaryCatalogImages = async (
  vehicleIds: string[],
): Promise<Map<string, VehicleImage>> => {
  const grouped = new Map<string, VehicleImage>();
  if (vehicleIds.length === 0) {
    return grouped;
  }

  const { data, error } = await requireSupabase()
    .from('vehicle_images')
    .select('id, vehicle_id, public_url, storage_path, alt, is_primary, sort_order')
    .in('vehicle_id', vehicleIds)
    .eq('is_primary', true);

  if (error) {
    throw new Error(`No se pudieron cargar las imágenes principales: ${error.message}`);
  }

  for (const row of data) {
    grouped.set(row.vehicle_id, {
      id: row.id,
      publicUrl: row.public_url,
      storagePath: row.storage_path,
      alt: row.alt,
      isPrimary: row.is_primary,
      sortOrder: row.sort_order,
    });
  }
  return grouped;
};

const loadPublicCatalogPage = async (
  filters: VehicleFilters,
  from: number,
): Promise<CatalogVehiclePage> => {
  const supabase = requireSupabase();
  const selectionOptions = from === 0 ? { count: 'exact' as const } : undefined;
  let query = supabase
    .from('vehicles')
    .select(catalogVehicleFields, selectionOptions)
    .neq('status', 'Borrador');

  if (filters.brand !== 'Todas') {
    query = query.eq('brand', filters.brand);
  }
  if (filters.status !== 'Todos') {
    query = query.eq('status', filters.status);
  }
  if (filters.condition !== 'Todas') {
    query = query.eq('condition', filters.condition);
  }
  if (filters.fuel !== 'Todos') {
    query = query.eq('fuel', filters.fuel);
  }
  if (filters.currency !== 'Todas') {
    query = query.eq('currency', filters.currency);
  }
  if (filters.minPrice !== null) {
    query = query.gte('price', filters.minPrice);
  }
  if (filters.maxPrice !== null) {
    query = query.lte('price', filters.maxPrice);
  }
  if (filters.minYear !== null) {
    query = query.gte('year', filters.minYear);
  }
  if (filters.maxYear !== null) {
    query = query.lte('year', filters.maxYear);
  }
  if (filters.maxMileage !== null) {
    query = query.lte('mileage', filters.maxMileage);
  }

  const searchTerms = filters.search
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^\p{L}\p{N}-]/gu, ''))
    .filter(Boolean);
  if (searchTerms.length > 0) {
    const termConditions = searchTerms.map(
      (term) =>
        `or(brand.ilike.%${term}%,model.ilike.%${term}%,version.ilike.%${term}%)`,
    );
    query = query.or(`and(${termConditions.join(',')})`);
  }

  switch (filters.sortBy) {
    case 'price-asc':
      query = query.order('currency', { ascending: true }).order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('currency', { ascending: true }).order('price', { ascending: false });
      break;
    case 'year-desc':
      query = query.order('year', { ascending: false }).order('published_at', { ascending: false });
      break;
    default:
      query = query.order('published_at', { ascending: false });
  }

  const { data, error, count } = await query
    .order('id', { ascending: true })
    .range(from, from + CATALOG_PAGE_SIZE - 1);
  if (error) {
    throw new Error(`No se pudieron cargar los vehículos: ${error.message}`);
  }

  const imagesByVehicle = await fetchPrimaryCatalogImages(data.map((vehicle) => vehicle.id));
  const vehicles = data.map((vehicle) =>
    mapCatalogVehicle(vehicle, imagesByVehicle.get(vehicle.id)),
  );
  const total = count;

  return {
    vehicles,
    total,
    hasMore:
      vehicles.length === CATALOG_PAGE_SIZE &&
      (total === null || from + vehicles.length < total),
  };
};

export const getPublicCatalogPage = (
  filters: VehicleFilters,
  from: number,
): Promise<CatalogVehiclePage> => {
  const key = JSON.stringify([filters, from]);
  const existingRequest = catalogPageRequests.get(key);
  if (existingRequest) {
    return existingRequest;
  }

  const request = loadPublicCatalogPage(filters, from);
  catalogPageRequests.set(key, request);
  const removeRequest = () => {
    if (catalogPageRequests.get(key) === request) {
      catalogPageRequests.delete(key);
    }
  };
  void request.then(removeRequest, removeRequest);
  return request;
};

export const getPublicCatalogBrands = (): Promise<string[]> => {
  if (publicCatalogBrandsCache) {
    return Promise.resolve(publicCatalogBrandsCache);
  }
  if (publicCatalogBrandsRequest) {
    return publicCatalogBrandsRequest;
  }

  const request = (async () => {
    const pageSize = 1000;
    const names = new Set<string>();
    let from = 0;
    let pageLength = pageSize;
    while (pageLength === pageSize) {
      const { data, error } = await requireSupabase()
        .from('vehicles')
        .select('brand')
        .neq('status', 'Borrador')
        .order('brand', { ascending: true })
        .order('id', { ascending: true })
        .range(from, from + pageSize - 1);
      if (error) {
        throw new Error(`No se pudieron cargar las marcas: ${error.message}`);
      }
      pageLength = data.length;
      data.forEach((item) => names.add(item.brand));
      from += data.length;
    }
    const result = [...names].sort((first, second) => first.localeCompare(second));
    publicCatalogBrandsCache = result;
    return result;
  })();

  publicCatalogBrandsRequest = request;
  const clearRequest = () => {
    if (publicCatalogBrandsRequest === request) {
      publicCatalogBrandsRequest = null;
    }
  };
  void request.then(clearRequest, clearRequest);
  return request;
};

const toVehicleInsert = (values: VehicleFormValues): VehicleInsert => ({
  brand: values.brand.trim(),
  model: values.model.trim(),
  version: values.version,
  year: values.year,
  price: values.price,
  currency: values.currency,
  status: values.status,
  condition: values.condition,
  featured: values.featured,
  type: values.type,
  mileage: values.mileage ?? null,
  fuel: values.fuel ?? null,
  transmission: values.transmission ?? null,
  engine: values.engine,
  power: values.power ?? null,
  drivetrain: values.drivetrain,
  color: values.color,
  doors: values.doors ?? null,
  seats: values.seats ?? null,
  description: values.description,
  equipment: values.equipment,
  highlights: values.highlights,
  published_at: values.publishedAt,
});

const toImageInsert = (vehicleId: string, image: VehicleImage): ImageInsert => ({
  id: image.id,
  vehicle_id: vehicleId,
  public_url: image.publicUrl,
  storage_path: image.storagePath,
  alt: image.alt,
  is_primary: image.isPrimary,
  sort_order: image.sortOrder,
});

const fetchImages = async (vehicleIds: string[]): Promise<Map<string, VehicleImage[]>> => {
  const grouped = new Map<string, VehicleImage[]>();
  if (vehicleIds.length === 0) {
    return grouped;
  }

  const { data, error } = await requireSupabase()
    .from('vehicle_images')
    .select('*')
    .in('vehicle_id', vehicleIds)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`No se pudieron cargar las imágenes de los vehículos: ${error.message}`);
  }

  for (const row of data) {
    const images = grouped.get(row.vehicle_id) ?? [];
    images.push(mapImage(row));
    grouped.set(row.vehicle_id, images);
  }
  return grouped;
};

const fetchVehicles = async ({
  publicOnly = false,
  featuredOnly = false,
  condition,
  limit,
}: VehicleQueryOptions = {}): Promise<Vehicle[]> => {
  const supabase = requireSupabase();
  let query = supabase
    .from('vehicles')
    .select('*')
    .order('published_at', { ascending: false });

  if (publicOnly) {
    query = query.neq('status', 'Borrador');
  }
  if (featuredOnly) {
    query = query.eq('featured', true);
  }
  if (condition) {
    query = query.eq('condition', condition);
  }
  if (limit !== undefined) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`No se pudieron cargar los vehículos: ${error.message}`);
  }

  const imagesByVehicle = await fetchImages(data.map((vehicle) => vehicle.id));
  return data.map((vehicle) => mapVehicle(vehicle, imagesByVehicle.get(vehicle.id) ?? []));
};

const fetchVehicle = async (
  vehicleId: string,
  publicOnly = false,
): Promise<Vehicle | undefined> => {
  const supabase = requireSupabase();
  let query = supabase.from('vehicles').select('*').eq('id', vehicleId);
  if (publicOnly) {
    query = query.neq('status', 'Borrador');
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`No se pudo cargar el vehículo: ${error.message}`);
  }
  if (!data) {
    return undefined;
  }

  const imagesByVehicle = await fetchImages([data.id]);
  return mapVehicle(data, imagesByVehicle.get(data.id) ?? []);
};

const uploadNewImages = async (
  vehicleId: string,
  images: VehicleImage[],
): Promise<VehicleImage[]> => {
  const uploaded: VehicleImage[] = [];
  try {
    for (const image of images) {
      uploaded.push(await uploadVehicleImage(vehicleId, image));
    }
    return uploaded;
  } catch (cause) {
    const cleanupErrors = await cleanUploadedImages(uploaded);
    const message = cause instanceof Error ? cause.message : 'Error desconocido al subir imágenes.';
    throw new Error(
      cleanupErrors.length
        ? `${message} Además, no se pudieron limpiar todos los archivos subidos: ${cleanupErrors.join('; ')}`
        : message,
      { cause },
    );
  }
};

const cleanUploadedImages = async (images: VehicleImage[]): Promise<string[]> => {
  const errors: string[] = [];
  for (const image of images) {
    if (!image.storagePath) {
      continue;
    }
    try {
      await removeVehicleImageFile(image.storagePath);
    } catch (cause) {
      errors.push(cause instanceof Error ? cause.message : 'No se pudo eliminar un archivo subido.');
    }
  }
  return errors;
};

const saveImages = async (vehicleId: string, images: VehicleImage[]): Promise<void> => {
  if (images.length === 0) {
    return;
  }

  const { error } = await requireSupabase()
    .from('vehicle_images')
    .upsert(images.map((image) => toImageInsert(vehicleId, image)), { onConflict: 'id' });
  if (error) {
    throw new Error(`No se pudieron guardar los registros de imágenes: ${error.message}`);
  }
};

const normalizeImages = (images: VehicleImage[]): VehicleImage[] => {
  const ids = new Set<string>();
  for (const image of images) {
    if (ids.has(image.id)) {
      throw new Error('La lista contiene imágenes duplicadas.');
    }
    ids.add(image.id);
  }

  return images.map((image, index) => ({
    ...image,
    isPrimary: images.some((candidate) => candidate.isPrimary)
      ? image.isPrimary
      : index === 0,
    sortOrder: index,
  }));
};

const restoreImages = async (
  vehicleId: string,
  images: VehicleImage[],
  addedImages: VehicleImage[],
): Promise<string[]> => {
  const errors: string[] = [];
  const supabase = requireSupabase();

  const { error: unsetError } = await supabase
    .from('vehicle_images')
    .update({ is_primary: false })
    .eq('vehicle_id', vehicleId);
  if (unsetError) {
    errors.push(`No se pudo restablecer la imagen principal: ${unsetError.message}`);
  } else {
    try {
      await saveImages(vehicleId, images);
    } catch (cause) {
      errors.push(cause instanceof Error ? cause.message : 'No se pudieron restaurar las imágenes.');
    }
  }

  if (addedImages.length > 0) {
    const { error: deleteError } = await supabase
      .from('vehicle_images')
      .delete()
      .in('id', addedImages.map((image) => image.id));
    if (deleteError) {
      errors.push(`No se pudieron quitar los nuevos registros de imagen: ${deleteError.message}`);
    } else {
      errors.push(...(await cleanUploadedImages(addedImages)));
    }
  }
  return errors;
};

export const getVehicles = (): Promise<Vehicle[]> => fetchVehicles();

export const getPublicVehicles = (): Promise<Vehicle[]> =>
  fetchVehicles({ publicOnly: true });

export const getPublicHomeVehicles = (
  condition: VehicleCondition | null,
): Promise<Vehicle[]> =>
  fetchVehicles({ publicOnly: true, condition: condition ?? undefined, limit: 6 });

export const getFeaturedVehicles = (): Promise<Vehicle[]> =>
  fetchVehicles({ publicOnly: true, featuredOnly: true });

export const getVehicleById = (vehicleId: string): Promise<Vehicle | undefined> =>
  fetchVehicle(vehicleId);

export const getPublicVehicleById = (vehicleId: string): Promise<Vehicle | undefined> =>
  fetchVehicle(vehicleId, true);

export const getRelatedVehicles = async (vehicleId: string): Promise<Vehicle[]> => {
  const vehicle = await getPublicVehicleById(vehicleId);
  if (!vehicle) {
    return [];
  }

  const { data, error } = await requireSupabase()
    .from('vehicles')
    .select('*')
    .eq('type', vehicle.type)
    .neq('id', vehicleId)
    .neq('status', 'Borrador')
    .order('published_at', { ascending: false })
    .limit(3);
  if (error) {
    throw new Error(`No se pudieron cargar los vehículos relacionados: ${error.message}`);
  }

  const imagesByVehicle = await fetchImages(data.map((item) => item.id));
  return data.map((item) => mapVehicle(item, imagesByVehicle.get(item.id) ?? []));
};

export const createVehicle = async (values: VehicleFormValues): Promise<Vehicle> => {
  await ensureVehicleCatalogPath(values.brand, values.model, values.version);
  const images = normalizeImages(values.images);
  if (images.some((image) => !isLocalImagePreview(image))) {
    throw new Error('Las imágenes nuevas deben seleccionarse desde el dispositivo.');
  }

  const supabase = requireSupabase();
  const { data: row, error } = await supabase
    .from('vehicles')
    .insert(toVehicleInsert(values))
    .select('*')
    .single();
  if (error) {
    throw new Error(`No se pudo crear el vehículo: ${error.message}`);
  }

  let uploaded: VehicleImage[];
  try {
    uploaded = await uploadNewImages(row.id, images);
  } catch (cause) {
    const { error: rollbackError } = await supabase.from('vehicles').delete().eq('id', row.id);
    const message = cause instanceof Error ? cause.message : 'No se pudieron subir las imágenes.';
    throw new Error(
      rollbackError
        ? `${message} Tampoco se pudo revertir el vehículo vacío: ${rollbackError.message}`
        : message,
      { cause },
    );
  }
  try {
    await saveImages(row.id, uploaded);
  } catch (cause) {
    const cleanupErrors = await cleanUploadedImages(uploaded);
    const { error: rollbackError } = await supabase.from('vehicles').delete().eq('id', row.id);
    const message = cause instanceof Error ? cause.message : 'No se pudieron guardar las imágenes.';
    throw new Error(
      [
        message,
        ...cleanupErrors.map((cleanupError) => `No se limpió un archivo subido: ${cleanupError}`),
        ...(rollbackError ? [`No se pudo revertir el vehículo vacío: ${rollbackError.message}`] : []),
      ].join(' '),
      { cause },
    );
  }

  return mapVehicle(row, uploaded);
};

export const updateVehicle = async (
  vehicleId: string,
  values: VehicleFormValues,
): Promise<Vehicle> => {
  const supabase = requireSupabase();
  const currentVehicle = await getVehicleById(vehicleId);
  if (!currentVehicle) {
    throw new Error('No se encontró el vehículo que intentas editar.');
  }

  await ensureVehicleCatalogPath(values.brand, values.model, values.version);
  const images = normalizeImages(values.images);
  const existingById = new Map(currentVehicle.images.map((image) => [image.id, image]));
  const addedImages = images.filter((image) => !existingById.has(image.id));
  if (addedImages.some((image) => !isLocalImagePreview(image))) {
    throw new Error('Una imagen nueva no tiene una vista previa local válida.');
  }

  const uploaded = await uploadNewImages(vehicleId, addedImages);
  const uploadedById = new Map(uploaded.map((image) => [image.id, image]));
  const selectedImages = images.map((image) => {
    const existing = existingById.get(image.id);
    if (existing) {
      return {
        ...existing,
        alt: image.alt,
        isPrimary: image.isPrimary,
        sortOrder: image.sortOrder,
      };
    }
    const newlyUploaded = uploadedById.get(image.id);
    if (!newlyUploaded) {
      throw new Error('No se pudo preparar una de las imágenes seleccionadas.');
    }
    return newlyUploaded;
  });

  const { error: unsetError } = await supabase
    .from('vehicle_images')
    .update({ is_primary: false })
    .eq('vehicle_id', vehicleId);
  if (unsetError) {
    const cleanupErrors = await cleanUploadedImages(uploaded);
    throw new Error(
      `No se pudieron preparar las imágenes para guardar: ${unsetError.message}${cleanupErrors.length ? ` También falló la limpieza: ${cleanupErrors.join('; ')}` : ''}`,
    );
  }

  try {
    await saveImages(vehicleId, selectedImages);
  } catch (cause) {
    const restoreErrors = await restoreImages(vehicleId, currentVehicle.images, uploaded);
    const message = cause instanceof Error ? cause.message : 'No se pudieron guardar las imágenes.';
    throw new Error(
      restoreErrors.length ? `${message} La recuperación quedó incompleta: ${restoreErrors.join('; ')}` : message,
      { cause },
    );
  }

  const { data: row, error: updateError } = await supabase
    .from('vehicles')
    .update(toVehicleInsert(values))
    .eq('id', vehicleId)
    .select('*')
    .maybeSingle();
  if (updateError || !row) {
    const restoreErrors = await restoreImages(vehicleId, currentVehicle.images, uploaded);
    const reason = updateError?.message ?? 'No se encontró el vehículo o no hay permisos para editarlo.';
    throw new Error(
      `No se pudieron guardar los datos del vehículo: ${reason}${restoreErrors.length ? ` La recuperación de imágenes quedó incompleta: ${restoreErrors.join('; ')}` : ''}`,
    );
  }

  const selectedIds = new Set(selectedImages.map((image) => image.id));
  const removedImages = currentVehicle.images.filter((image) => !selectedIds.has(image.id));
  for (const image of removedImages) {
    try {
      await deleteVehicleImage(image.id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Error desconocido al eliminar una imagen.';
      throw new Error(
        `El vehículo y las imágenes seleccionadas se guardaron, pero no se completó la eliminación de "${image.alt}". ${message}`,
        { cause },
      );
    }
  }

  return mapVehicle(row, selectedImages);
};

export const deleteVehicle = async (vehicleId: string): Promise<void> => {
  const supabase = requireSupabase();
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) {
    throw new Error('No se encontró el vehículo que intentas eliminar.');
  }

  for (const image of vehicle.images) {
    try {
      await deleteVehicleImage(image.id);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'Error desconocido al eliminar una imagen.';
      throw new Error(
        `No se eliminó el vehículo porque no se pudo completar la limpieza de sus imágenes. ${message}`,
        { cause },
      );
    }
  }

  const { error } = await supabase.from('vehicles').delete().eq('id', vehicleId);
  if (error) {
    throw new Error(
      `Se limpiaron las imágenes, pero no se pudo eliminar el vehículo. Reintenta la operación. Detalle: ${error.message}`,
    );
  }
};

export const updateVehicleStatus = async (
  vehicleId: string,
  status: VehicleStatus,
): Promise<Vehicle> => {
  const { data, error } = await requireSupabase()
    .from('vehicles')
    .update({ status })
    .eq('id', vehicleId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo actualizar el estado del vehículo: ${error.message}`);
  }
  if (!data) {
    throw new Error('No se encontró el vehículo o no hay permisos para actualizarlo.');
  }
  const imagesByVehicle = await fetchImages([vehicleId]);
  return mapVehicle(data, imagesByVehicle.get(vehicleId) ?? []);
};

export const updateVehicleFeatured = async (
  vehicleId: string,
  featured: boolean,
): Promise<Vehicle> => {
  const { data, error } = await requireSupabase()
    .from('vehicles')
    .update({ featured })
    .eq('id', vehicleId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo actualizar el vehículo destacado: ${error.message}`);
  }
  if (!data) {
    throw new Error('No se encontró el vehículo o no hay permisos para actualizarlo.');
  }
  const imagesByVehicle = await fetchImages([vehicleId]);
  return mapVehicle(data, imagesByVehicle.get(vehicleId) ?? []);
};
