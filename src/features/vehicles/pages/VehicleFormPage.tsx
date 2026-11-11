import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { VehicleForm } from '../../../components/forms/VehicleForm';
import { invalidateVehicleQueries } from '../../../lib/queryClient';
import { createVehicle, getVehicleById, updateVehicle } from '../../../services/vehicleService';
import type { VehicleFormValues } from '../../../types';
import '../styles/vehicles.css';
import '../../dashboard/styles/dashboard.css';

export const VehicleFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loadedVehicle, setLoadedVehicle] = useState<{
    id: string;
    values?: VehicleFormValues;
    error?: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!id) {
      return;
    }

    void getVehicleById(id)
      .then((vehicle) => {
        if (!active) {
          return;
        }
        if (!vehicle) {
          setLoadedVehicle({
            id,
            error: 'No se encontró el vehículo que intentas editar.',
          });
          return;
        }

        setLoadedVehicle({
          id,
          values: {
          brand: vehicle.brand,
          model: vehicle.model,
          version: vehicle.version ?? '',
          year: vehicle.year,
          price: vehicle.price,
          currency: vehicle.currency,
          status: vehicle.status,
          condition: vehicle.condition,
          publishedAt: vehicle.publishedAt,
          featured: vehicle.featured,
          type: vehicle.type,
          mileage: vehicle.mileage,
          fuel: vehicle.fuel,
          transmission: vehicle.transmission,
          engine: vehicle.engine ?? '',
          power: vehicle.power,
          drivetrain: vehicle.drivetrain ?? '',
          color: vehicle.color ?? '',
          doors: vehicle.doors,
          seats: vehicle.seats,
          description: vehicle.description ?? '',
          equipment: [...vehicle.equipment],
          highlights: [...vehicle.highlights],
          images: vehicle.images.map((image) => ({ ...image })),
          },
        });
      })
      .catch((cause: unknown) => {
        if (active) {
          setLoadedVehicle({
            id,
            error: cause instanceof Error ? cause.message : 'No se pudo cargar el vehículo.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const loading = Boolean(id && loadedVehicle?.id !== id);
  const currentLoadedVehicle = loadedVehicle?.id === id ? loadedVehicle : null;
  const initialValues = currentLoadedVehicle?.values;
  const loadError = currentLoadedVehicle?.error;

  const handleSubmit = async (values: VehicleFormValues) => {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (id) {
        await updateVehicle(id, values);
      } else {
        await createVehicle(values);
      }
      await invalidateVehicleQueries();
      navigate('/admin/vehiculos');
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : 'No se pudo guardar el vehículo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <p role="status">Cargando datos del vehículo…</p>;
  }
  if (loadError) {
    return (
      <div className="form-page-error">
        <p className="form-error" role="alert">{loadError}</p>
        <Link to="/admin/vehiculos" className="button button-secondary">Volver al listado</Link>
      </div>
    );
  }

  return (
    <>
      <div className="section-header">
        <div>
          <p className="eyebrow">{id ? 'Editar publicación' : 'Nueva publicación'}</p>
          <h2>{id ? 'Editar vehículo' : 'Crear vehículo'}</h2>
        </div>
      </div>
      <VehicleForm
        key={id ?? 'new'}
        initialValues={initialValues}
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleSubmit}
        onCancel={() => navigate('/admin/vehiculos')}
      />
    </>
  );
};
