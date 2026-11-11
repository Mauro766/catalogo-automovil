import { requireSupabase } from '../lib/supabase';

export interface VehicleCatalogItem {
  id: string;
  name: string;
}

export interface VehicleCatalogModel extends VehicleCatalogItem {
  brandId: string;
}

export interface VehicleCatalogVersion extends VehicleCatalogItem {
  modelId: string;
}

const normalizeName = (name: string): string => name.trim().toLowerCase();

const validateName = (name: string, label: string): string => {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error(`Escribe el nombre de ${label}.`);
  }
  return trimmedName;
};

const getBrandByNormalizedName = async (
  normalizedName: string,
): Promise<VehicleCatalogItem | undefined> => {
  const { data, error } = await requireSupabase()
    .from('vehicle_brands')
    .select('id, name')
    .eq('normalized_name', normalizedName)
    .maybeSingle();
  if (error) {
    throw new Error(`No se pudo comprobar la marca: ${error.message}`);
  }
  return data ?? undefined;
};

const getModelByNormalizedName = async (
  brandId: string,
  normalizedName: string,
): Promise<VehicleCatalogModel | undefined> => {
  const { data, error } = await requireSupabase()
    .from('vehicle_models')
    .select('id, brand_id, name')
    .eq('brand_id', brandId)
    .eq('normalized_name', normalizedName)
    .maybeSingle();
  if (error) {
    throw new Error(`No se pudo comprobar el modelo: ${error.message}`);
  }
  return data ? { id: data.id, brandId: data.brand_id, name: data.name } : undefined;
};

const getVersionByNormalizedName = async (
  modelId: string,
  normalizedName: string,
): Promise<VehicleCatalogVersion | undefined> => {
  const { data, error } = await requireSupabase()
    .from('vehicle_versions')
    .select('id, model_id, name')
    .eq('model_id', modelId)
    .eq('normalized_name', normalizedName)
    .maybeSingle();
  if (error) {
    throw new Error(`No se pudo comprobar la versión: ${error.message}`);
  }
  return data ? { id: data.id, modelId: data.model_id, name: data.name } : undefined;
};

export const getVehicleBrands = async (): Promise<VehicleCatalogItem[]> => {
  const { data, error } = await requireSupabase()
    .from('vehicle_brands')
    .select('id, name')
    .order('name', { ascending: true });
  if (error) {
    throw new Error(`No se pudieron cargar las marcas: ${error.message}`);
  }
  return data;
};

export const getVehicleModels = async (brandId: string): Promise<VehicleCatalogModel[]> => {
  if (!brandId) {
    return [];
  }
  const { data, error } = await requireSupabase()
    .from('vehicle_models')
    .select('id, brand_id, name')
    .eq('brand_id', brandId)
    .order('name', { ascending: true });
  if (error) {
    throw new Error(`No se pudieron cargar los modelos: ${error.message}`);
  }
  return data.map((item) => ({
    id: item.id,
    brandId: item.brand_id,
    name: item.name,
  }));
};

export const getVehicleVersions = async (modelId: string): Promise<VehicleCatalogVersion[]> => {
  if (!modelId) {
    return [];
  }
  const { data, error } = await requireSupabase()
    .from('vehicle_versions')
    .select('id, model_id, name')
    .eq('model_id', modelId)
    .order('name', { ascending: true });
  if (error) {
    throw new Error(`No se pudieron cargar las versiones: ${error.message}`);
  }
  return data.map((item) => ({
    id: item.id,
    modelId: item.model_id,
    name: item.name,
  }));
};

export const createVehicleBrand = async (name: string): Promise<VehicleCatalogItem> => {
  const cleanName = validateName(name, 'la marca');
  const normalizedName = normalizeName(cleanName);
  const existing = await getBrandByNormalizedName(normalizedName);
  if (existing) {
    throw new Error(`La marca "${existing.name}" ya existe.`);
  }

  const { data, error } = await requireSupabase()
    .from('vehicle_brands')
    .insert({ name: cleanName, normalized_name: normalizedName })
    .select('id, name')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error(`La marca "${cleanName}" ya existe.`);
    }
    throw new Error(`No se pudo guardar la marca: ${error.message}`);
  }
  return data;
};

export const createVehicleModel = async (
  brandId: string,
  name: string,
): Promise<VehicleCatalogModel> => {
  if (!brandId) {
    throw new Error('Selecciona una marca antes de agregar un modelo.');
  }
  const cleanName = validateName(name, 'el modelo');
  const normalizedName = normalizeName(cleanName);
  const existing = await getModelByNormalizedName(brandId, normalizedName);
  if (existing) {
    throw new Error(`El modelo "${existing.name}" ya existe para esta marca.`);
  }

  const { data, error } = await requireSupabase()
    .from('vehicle_models')
    .insert({ brand_id: brandId, name: cleanName, normalized_name: normalizedName })
    .select('id, brand_id, name')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error(`El modelo "${cleanName}" ya existe para esta marca.`);
    }
    throw new Error(`No se pudo guardar el modelo: ${error.message}`);
  }
  return { id: data.id, brandId: data.brand_id, name: data.name };
};

export const createVehicleVersion = async (
  modelId: string,
  name: string,
): Promise<VehicleCatalogVersion> => {
  if (!modelId) {
    throw new Error('Selecciona un modelo antes de agregar una versión.');
  }
  const cleanName = validateName(name, 'la versión');
  const normalizedName = normalizeName(cleanName);
  const existing = await getVersionByNormalizedName(modelId, normalizedName);
  if (existing) {
    throw new Error(`La versión "${existing.name}" ya existe para este modelo.`);
  }

  const { data, error } = await requireSupabase()
    .from('vehicle_versions')
    .insert({ model_id: modelId, name: cleanName, normalized_name: normalizedName })
    .select('id, model_id, name')
    .single();
  if (error) {
    if (error.code === '23505') {
      throw new Error(`La versión "${cleanName}" ya existe para este modelo.`);
    }
    throw new Error(`No se pudo guardar la versión: ${error.message}`);
  }
  return { id: data.id, modelId: data.model_id, name: data.name };
};

export const ensureVehicleCatalogPath = async (
  brandName: string,
  modelName: string,
  versionName: string,
): Promise<void> => {
  const cleanBrand = validateName(brandName, 'la marca');
  const cleanModel = validateName(modelName, 'el modelo');
  const cleanVersion = versionName.trim();

  const normalizedBrand = normalizeName(cleanBrand);
  let brand = await getBrandByNormalizedName(normalizedBrand);
  if (!brand) {
    try {
      brand = await createVehicleBrand(cleanBrand);
    } catch (cause) {
      brand = await getBrandByNormalizedName(normalizedBrand);
      if (!brand) throw cause;
    }
  }

  const normalizedModel = normalizeName(cleanModel);
  let model = await getModelByNormalizedName(brand.id, normalizedModel);
  if (!model) {
    try {
      model = await createVehicleModel(brand.id, cleanModel);
    } catch (cause) {
      model = await getModelByNormalizedName(brand.id, normalizedModel);
      if (!model) throw cause;
    }
  }

  if (cleanVersion) {
    const normalizedVersion = normalizeName(cleanVersion);
    const existingVersion = await getVersionByNormalizedName(
      model.id,
      normalizedVersion,
    );
    if (!existingVersion) {
      try {
        await createVehicleVersion(model.id, cleanVersion);
      } catch (cause) {
        const duplicate = await getVersionByNormalizedName(model.id, normalizedVersion);
        if (!duplicate) throw cause;
      }
    }
  }
};
