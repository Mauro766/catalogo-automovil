import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, ImagePlus, Star, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch, type DefaultValues } from 'react-hook-form';
import { z } from 'zod';
import { VehicleCatalogFields } from './VehicleCatalogFields';
import type { VehicleFormValues, VehicleImage } from '../../types';
import { formatDateTimeLocal } from '../../utils/formatters';

const isValidDateTimeLocal = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return false;
  }

  const [datePart, timePart] = value.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const parsedDate = new Date(year, month - 1, day, hours, minutes);
  return parsedDate.getFullYear() === year
    && parsedDate.getMonth() === month - 1
    && parsedDate.getDate() === day
    && parsedDate.getHours() === hours
    && parsedDate.getMinutes() === minutes;
};

const vehicleFormSchema = z.object({
  brand: z.string().trim().min(1, 'Ingresa la marca.'),
  model: z.string().trim().min(1, 'Ingresa el modelo.'),
  version: z.string(),
  year: z.number().optional().pipe(z.number().int('El año debe ser un número entero.').min(1900, 'Ingresa un año válido.').max(new Date().getFullYear() + 1, 'El año no puede ser futuro.')),
  price: z.number().optional().pipe(z.number().positive('El precio debe ser mayor a cero.')),
  currency: z.enum(['ARS', 'USD', '']).pipe(z.enum(['ARS', 'USD'])),
  status: z.enum(['Disponible', 'Reservado', 'Vendido', 'Borrador', '']).pipe(z.enum(['Disponible', 'Reservado', 'Vendido', 'Borrador'])),
  condition: z.enum(['0km', 'usado', '']).pipe(z.enum(['0km', 'usado'])),
  publishedAt: z.string()
    .refine(isValidDateTimeLocal, 'Ingresa una fecha de publicación válida.')
    .transform((value) => new Date(value).toISOString()),
  featured: z.boolean(),
  type: z.enum(['SUV', 'Sedán', 'Hatchback', 'Pickup', 'Coupe', 'Furgón', '']).pipe(z.enum(['SUV', 'Sedán', 'Hatchback', 'Pickup', 'Coupe', 'Furgón'])),
  mileage: z.number().optional().pipe(z.number().int().min(0, 'El kilometraje no puede ser negativo.').optional()),
  fuel: z.enum(['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas', '']).transform((value) => value === '' ? undefined : value),
  transmission: z.enum(['Manual', 'Automática', 'Automatizada', '']).transform((value) => value === '' ? undefined : value),
  engine: z.string(),
  power: z.number().optional().pipe(z.number().min(0, 'La potencia no puede ser negativa.').optional()),
  drivetrain: z.string(),
  color: z.string(),
  doors: z.number().optional().pipe(z.number().int().min(1, 'Ingresa una cantidad válida de puertas.').optional()),
  seats: z.number().optional().pipe(z.number().int().min(1, 'Ingresa una cantidad válida de asientos.').optional()),
  description: z.string(),
  equipment: z.array(z.string()),
  highlights: z.array(z.string()),
  images: z.array(
    z.object({
      id: z.string(),
      publicUrl: z.string().min(1),
      storagePath: z.string().nullable(),
      alt: z.string(),
      isPrimary: z.boolean(),
      sortOrder: z.number().int(),
    }),
  ),
});

type VehicleFormDraft = z.input<typeof vehicleFormSchema>;

const emptyValues: DefaultValues<VehicleFormDraft> = {
  brand: '',
  model: '',
  version: '',
  year: undefined,
  price: undefined,
  currency: '',
  status: '',
  condition: '',
  publishedAt: '',
  featured: false,
  type: '',
  mileage: undefined,
  fuel: undefined,
  transmission: undefined,
  engine: '',
  power: undefined,
  drivetrain: '',
  color: '',
  doors: undefined,
  seats: undefined,
  description: '',
  equipment: [],
  highlights: [],
  images: [],
};

interface VehicleFormProps {
  initialValues?: VehicleFormValues;
  submitting?: boolean;
  submitError?: string | null;
  onSubmit: (values: VehicleFormValues) => Promise<void>;
  onCancel: () => void;
}

const parseList = (value: string): string[] =>
  value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const readImage = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error(`No se pudo leer ${file.name}.`));
      }
    };
    reader.onerror = () => reject(new Error(`No se pudo leer ${file.name}.`));
    reader.readAsDataURL(file);
  });

export const VehicleForm = ({
  initialValues,
  submitting = false,
  submitError,
  onSubmit,
  onCancel,
}: VehicleFormProps) => {
  const [imageError, setImageError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormDraft, unknown, VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      ...emptyValues,
      ...initialValues,
      publishedAt: formatDateTimeLocal(initialValues?.publishedAt ?? new Date().toISOString()),
    },
  });

  const images = useWatch({ control, name: 'images' }) ?? [];
  const equipment = useWatch({ control, name: 'equipment' }) ?? [];
  const highlights = useWatch({ control, name: 'highlights' }) ?? [];
  const brand = useWatch({ control, name: 'brand' }) ?? '';
  const model = useWatch({ control, name: 'model' }) ?? '';
  const version = useWatch({ control, name: 'version' }) ?? '';

  const handleValidSubmit = async (values: VehicleFormValues) => {
    const originalPublishedAt = initialValues?.publishedAt;
    if (
      originalPublishedAt &&
      formatDateTimeLocal(values.publishedAt) === formatDateTimeLocal(originalPublishedAt)
    ) {
      await onSubmit({ ...values, publishedAt: originalPublishedAt });
      return;
    }

    await onSubmit(values);
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) {
      return;
    }

    setImageError(null);
    try {
      const selectedFiles = Array.from(files);
      const invalidFile = selectedFiles.find(
        (file) => !file.type.startsWith('image/') || file.size > 10 * 1024 * 1024,
      );
      if (invalidFile) {
        throw new Error('Selecciona imágenes de hasta 10 MB cada una.');
      }

      const nextImages = await Promise.all(
        selectedFiles.map(async (file, index): Promise<VehicleImage> => ({
          id: crypto.randomUUID(),
          publicUrl: await readImage(file),
          storagePath: null,
          alt: file.name.replace(/\.[^.]+$/, ''),
          isPrimary: images.length === 0 && index === 0,
          sortOrder: images.length + index,
        })),
      );
      setValue('images', [...images, ...nextImages], { shouldDirty: true });
    } catch (cause) {
      setImageError(cause instanceof Error ? cause.message : 'No se pudieron cargar las vistas previas.');
    }
  };

  const setPrimaryImage = (imageId: string) => {
    setValue(
      'images',
      images.map((image, index) => ({
        ...image,
        isPrimary: image.id === imageId,
        sortOrder: index,
      })),
      { shouldDirty: true },
    );
  };

  const moveImage = (index: number, offset: -1 | 1) => {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= images.length) {
      return;
    }

    const reordered = [...images];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    setValue(
      'images',
      reordered.map((image, sortOrder) => ({ ...image, sortOrder })),
      { shouldDirty: true },
    );
  };

  const removeImage = (imageId: string) => {
    const remaining = images
      .filter((image) => image.id !== imageId)
      .map((image, sortOrder) => ({ ...image, sortOrder }));
    if (remaining.length > 0 && !remaining.some((image) => image.isPrimary)) {
      remaining[0].isPrimary = true;
    }
    setValue('images', remaining, { shouldDirty: true });
  };

  return (
    <form className="vehicle-form card" onSubmit={handleSubmit(handleValidSubmit)} noValidate>
      <section className="form-section" aria-labelledby="vehicle-general-heading">
        <div className="form-section-heading">
          <h3 id="vehicle-general-heading">Información general</h3>
          <p>Identificación, publicación y precio.</p>
        </div>
        <div className="form-grid">
          <label>
            <span>Año *</span>
            <input type="number" inputMode="numeric" aria-invalid={Boolean(errors.year)} {...register('year', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} />
            {errors.year && <small role="alert">{errors.year.message}</small>}
          </label>
          <label>
            <span>Precio *</span>
            <input type="number" min="0" step="any" inputMode="decimal" aria-invalid={Boolean(errors.price)} {...register('price', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} />
            {errors.price && <small role="alert">{errors.price.message}</small>}
          </label>
          <label>
            <span>Moneda *</span>
            <select aria-invalid={Boolean(errors.currency)} {...register('currency')}>
              <option value="">Seleccionar moneda</option>
              <option value="ARS">ARS</option>
              <option value="USD">USD</option>
            </select>
            {errors.currency && <small role="alert">Selecciona una moneda.</small>}
          </label>
          <label>
            <span>Tipo de vehículo *</span>
            <select aria-invalid={Boolean(errors.type)} {...register('type')}>
              <option value="">Seleccionar tipo</option>
              <option value="SUV">SUV</option>
              <option value="Sedán">Sedán</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Pickup">Pickup</option>
              <option value="Coupe">Coupé</option>
              <option value="Furgón">Furgón</option>
            </select>
            {errors.type && <small role="alert">Selecciona un tipo de vehículo.</small>}
          </label>
          <label>
            <span>Estado *</span>
            <select aria-invalid={Boolean(errors.status)} {...register('status')}>
              <option value="">Seleccionar estado</option>
              <option value="Borrador">Borrador</option>
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
            </select>
            {errors.status && <small role="alert">Selecciona un estado.</small>}
          </label>
          <label>
            <span>Condición *</span>
            <select aria-invalid={Boolean(errors.condition)} {...register('condition')}>
              <option value="">Seleccionar condición</option>
              <option value="0km">0 km</option>
              <option value="usado">Usado</option>
            </select>
            {errors.condition && <small role="alert">Selecciona una condición.</small>}
          </label>
          <label>
            <span>Fecha de publicación *</span>
            <input
              type="datetime-local"
              aria-invalid={Boolean(errors.publishedAt)}
              {...register('publishedAt')}
            />
            {errors.publishedAt && <small role="alert">{errors.publishedAt.message}</small>}
          </label>
          <label className="checkbox-field">
            <input type="checkbox" {...register('featured')} />
            <span>Mostrar como vehículo destacado</span>
          </label>
        </div>
      </section>

      <VehicleCatalogFields
        brand={brand}
        model={model}
        version={version}
        onBrandChange={(value) => setValue('brand', value, { shouldDirty: true, shouldValidate: true })}
        onModelChange={(value) => setValue('model', value, { shouldDirty: true, shouldValidate: true })}
        onVersionChange={(value) => setValue('version', value, { shouldDirty: true, shouldValidate: true })}
      />

      <section className="form-section" aria-labelledby="vehicle-details-heading">
        <div className="form-section-heading">
          <h3 id="vehicle-details-heading">Características</h3>
          <p>Los datos técnicos son opcionales si aún no están disponibles.</p>
        </div>
        <div className="form-grid">
          <label>
            <span>Kilometraje</span>
            <input type="number" min="0" inputMode="numeric" aria-invalid={Boolean(errors.mileage)} {...register('mileage', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} />
            {errors.mileage && <small role="alert">{errors.mileage.message}</small>}
          </label>
          <label>
            <span>Combustible</span>
            <select {...register('fuel')}>
              <option value="">Sin especificar</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Diésel">Diésel</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Eléctrico">Eléctrico</option>
              <option value="Gas">Gas</option>
            </select>
          </label>
          <label>
            <span>Transmisión</span>
            <select {...register('transmission')}>
              <option value="">Sin especificar</option>
              <option value="Automática">Automática</option>
              <option value="Manual">Manual</option>
              <option value="Automatizada">Automatizada</option>
            </select>
          </label>
          <label>
            <span>Motor</span>
            <input {...register('engine')} />
          </label>
          <label>
            <span>Potencia (HP)</span>
            <input type="number" min="0" inputMode="numeric" aria-invalid={Boolean(errors.power)} {...register('power', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} />
            {errors.power && <small role="alert">{errors.power.message}</small>}
          </label>
          <label>
            <span>Tracción</span>
            <input {...register('drivetrain')} />
          </label>
          <label>
            <span>Color</span>
            <input {...register('color')} />
          </label>
          <label>
            <span>Puertas</span>
            <input type="number" min="1" inputMode="numeric" aria-invalid={Boolean(errors.doors)} {...register('doors', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} />
            {errors.doors && <small role="alert">{errors.doors.message}</small>}
          </label>
          <label>
            <span>Asientos</span>
            <input type="number" min="1" inputMode="numeric" aria-invalid={Boolean(errors.seats)} {...register('seats', { setValueAs: (value: string) => value === '' ? undefined : Number(value) })} />
            {errors.seats && <small role="alert">{errors.seats.message}</small>}
          </label>
          <label className="span-2">
            <span>Descripción</span>
            <textarea rows={4} {...register('description')} />
          </label>
          <label className="span-2">
            <span>Equipamiento (un elemento por línea)</span>
            <textarea
              rows={3}
              value={equipment.join('\n')}
              onChange={(event) => setValue('equipment', parseList(event.target.value), { shouldDirty: true })}
            />
          </label>
          <label className="span-2">
            <span>Características destacadas (una por línea)</span>
            <textarea
              rows={3}
              value={highlights.join('\n')}
              onChange={(event) => setValue('highlights', parseList(event.target.value), { shouldDirty: true })}
            />
          </label>
        </div>
      </section>

      <section className="form-section" aria-labelledby="vehicle-images-heading">
        <div className="form-section-heading">
          <h3 id="vehicle-images-heading">Fotografías</h3>
          <p>Las imágenes se subirán al almacenamiento al guardar el vehículo.</p>
        </div>
        <label className="image-upload">
          <ImagePlus size={20} />
          <span>Agregar imágenes</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void handleFiles(event.target.files);
              event.target.value = '';
            }}
          />
        </label>
        {imageError && <p className="form-error" role="alert">{imageError}</p>}
        {images.length > 0 && (
          <div className="image-preview-grid">
            {images.map((image, index) => (
              <article className="image-preview" key={image.id}>
                <img src={image.publicUrl} alt={image.alt} />
                <div className="image-preview-actions">
                  <button
                    type="button"
                    className={image.isPrimary ? 'image-action selected' : 'image-action'}
                    aria-label={image.isPrimary ? 'Imagen principal seleccionada' : 'Seleccionar imagen principal'}
                    aria-pressed={image.isPrimary}
                    onClick={() => setPrimaryImage(image.id)}
                  >
                    <Star size={15} />
                  </button>
                  <button type="button" className="image-action" aria-label="Mover imagen arriba" disabled={index === 0} onClick={() => moveImage(index, -1)}>
                    <ArrowUp size={15} />
                  </button>
                  <button type="button" className="image-action" aria-label="Mover imagen abajo" disabled={index === images.length - 1} onClick={() => moveImage(index, 1)}>
                    <ArrowDown size={15} />
                  </button>
                  <button type="button" className="image-action danger" aria-label="Eliminar imagen" onClick={() => removeImage(image.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
                {image.isPrimary && <span className="primary-image-label">Principal</span>}
              </article>
            ))}
          </div>
        )}
      </section>

      {submitError && <p className="form-error" role="alert">{submitError}</p>}
      <div className="form-actions">
        <button type="button" className="button button-secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button type="submit" className="button button-primary" disabled={submitting || isSubmitting}>
          {submitting || isSubmitting ? 'Guardando…' : 'Guardar vehículo'}
        </button>
      </div>
    </form>
  );
};
