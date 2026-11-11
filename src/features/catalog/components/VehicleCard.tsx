import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { VehicleCardData } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import '../styles/vehicle-card.css';

interface VehicleCardProps {
  vehicle: VehicleCardData;
  priority?: boolean;
}

const VehicleCardComponent = ({ vehicle, priority = false }: VehicleCardProps) => {
  const image = [...vehicle.images].sort(
    (a, b) =>
      Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  )[0];
  const primaryImage = image?.publicUrl ?? '';
  const imageUrl = primaryImage;

  const tagKm = vehicle.mileage === undefined
    ? vehicle.condition === '0km' ? '0 km' : 'KM no informado'
    : `${vehicle.mileage.toLocaleString()} km`;
  const tagFuel = vehicle.fuel || 'Nafta';

  return (
    <article className="dp-card">
      {/* Contenedor de imagen: sin generar imágenes extras para no gastar tokens */}
      <div className="dp-card-img-wrap">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="dp-card-img"
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            fetchPriority={priority ? 'high' : 'auto'}
            width={640}
            height={400}
          />
        ) : (
          <div className="dp-card-img-placeholder" aria-label="Espacio para foto">
            <span>Sin foto</span>
          </div>
        )}
        <span className="dp-card-badge">{vehicle.status}</span>
        <span className="dp-card-condition-badge">
          {vehicle.condition === '0km' ? '0 km' : 'Usado'}
        </span>
      </div>

      <div className="dp-card-body">
        <div className="dp-card-row">
          <h4 className="dp-card-title">
            {vehicle.brand} {vehicle.model}
          </h4>
          <strong className="dp-card-price">
            {formatCurrency(vehicle.price, vehicle.currency)}
          </strong>
        </div>

        <p className="dp-card-subtitle">
          {vehicle.version || `${vehicle.type} · ${vehicle.year}`}
        </p>

        <div className="dp-card-pills">
          <span className="dp-pill">{tagKm}</span>
          <span className="dp-pill">{tagFuel}</span>
          {vehicle.transmission && (
            <span className="dp-pill">{vehicle.transmission}</span>
          )}
        </div>

        <Link
          to={`/vehiculos/${vehicle.id}`}
          className="dp-card-link-overlay"
          aria-label={`Ver detalle de ${vehicle.brand} ${vehicle.model}`}
        />
      </div>
    </article>
  );
};

export const VehicleCard = memo(VehicleCardComponent);
