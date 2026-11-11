import { requireSupabase } from '../lib/supabase';
import type { VehicleImage } from '../types';

const bucketName = 'vehicle-images';
const maxImageSize = 10 * 1024 * 1024;
const dataUrlPattern = /^data:(image\/[a-zA-Z0-9.+-]+);base64,([a-zA-Z0-9+/=\s]+)$/;

const imageBlobFromDataUrl = (dataUrl: string): { blob: Blob; extension: string } => {
  const match = dataUrlPattern.exec(dataUrl);
  if (!match) {
    throw new Error('La vista previa de la imagen no tiene un formato válido.');
  }

  const mimeType = match[1].toLowerCase();
  const binary = atob(match[2].replace(/\s/g, ''));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  if (blob.size === 0 || blob.size > maxImageSize) {
    throw new Error('Cada imagen debe pesar más de 0 y hasta 10 MB.');
  }

  const extensionByMimeType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'image/bmp': 'bmp',
    'image/x-icon': 'ico',
    'image/tiff': 'tiff',
    'image/heic': 'heic',
    'image/heif': 'heif',
  };
  const extension = extensionByMimeType[mimeType];
  if (!extension) {
    throw new Error(`El formato ${mimeType} no está admitido para Storage.`);
  }

  return { blob, extension };
};

export const isLocalImagePreview = (image: VehicleImage): boolean =>
  image.publicUrl.startsWith('data:');

export const uploadVehicleImage = async (
  vehicleId: string,
  image: VehicleImage,
): Promise<VehicleImage> => {
  const { blob, extension } = imageBlobFromDataUrl(image.publicUrl);
  const storagePath = `${vehicleId}/${crypto.randomUUID()}.${extension}`;
  const supabase = requireSupabase();
  const { error } = await supabase.storage
    .from(bucketName)
    .upload(storagePath, blob, {
      cacheControl: '3600',
      contentType: blob.type,
      upsert: false,
    });

  if (error) {
    throw new Error(`No se pudo subir la imagen "${image.alt}": ${error.message}`);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
  return {
    ...image,
    publicUrl: data.publicUrl,
    storagePath,
  };
};

export const removeVehicleImageFile = async (storagePath: string): Promise<void> => {
  const { error } = await requireSupabase().storage.from(bucketName).remove([storagePath]);
  if (error) {
    throw new Error(`No se pudo eliminar el archivo de imagen: ${error.message}`);
  }
};

export const deleteVehicleImage = async (imageId: string): Promise<void> => {
  const supabase = requireSupabase();
  const { data: image, error: readError } = await supabase
    .from('vehicle_images')
    .select('id, storage_path')
    .eq('id', imageId)
    .maybeSingle();

  if (readError) {
    throw new Error(`No se pudo consultar la imagen antes de eliminarla: ${readError.message}`);
  }
  if (!image) {
    throw new Error('No se encontró la imagen que intentas eliminar.');
  }

  if (image.storage_path) {
    await removeVehicleImageFile(image.storage_path);
  }

  const { error: deleteError } = await supabase
    .from('vehicle_images')
    .delete()
    .eq('id', imageId);
  if (deleteError) {
    throw new Error(
      image.storage_path
        ? `El archivo se eliminó, pero no se pudo eliminar su registro. Reintenta la operación. Detalle: ${deleteError.message}`
        : `No se pudo eliminar el registro de la imagen: ${deleteError.message}`,
    );
  }
};
