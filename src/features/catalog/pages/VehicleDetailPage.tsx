import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CarFront,
  Fuel,
  Gauge,
  Settings2,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { gsap } from 'gsap';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { useDealership } from '../../../hooks/useDealership';
import { getPublicVehicleById, getRelatedVehicles } from '../../../services/vehicleService';
import type { Vehicle } from '../../../types';
import { formatCurrency, formatDate } from '../../../utils/formatters';
import { VehicleCard } from '../components/VehicleCard';
import '../styles/catalog.css';

export const VehicleDetailPage = () => {
  const { id } = useParams();
  const { dealership } = useDealership();
  const [result, setResult] = useState<{
    id: string | undefined;
    vehicle: Vehicle | null;
    related: Vehicle[];
    error: string | null;
  } | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const request = id ? getPublicVehicleById(id) : Promise.resolve(undefined);
    void request
      .then(async (currentVehicle) => {
        if (!active) {
          return;
        }
        if (!id || !currentVehicle) {
          setResult({ id, vehicle: null, related: [], error: null });
          return;
        }

        const relatedVehicles = await getRelatedVehicles(currentVehicle.id);
        if (active) {
          setResult({ id, vehicle: currentVehicle, related: relatedVehicles, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setResult({
            id,
            vehicle: null,
            related: [],
            error: cause instanceof Error ? cause.message : 'No se pudo cargar el vehículo.',
          });
        }
      });

    return () => {
      active = false;
    };
  }, [id]);

  const currentResult = result?.id === id ? result : null;
  const loading = currentResult === null;
  const vehicle = currentResult?.vehicle ?? null;
  const related = currentResult?.related ?? [];
  const error = currentResult?.error ?? null;
  const detailRootRef = useRef<HTMLElement>(null);
  const vehicleId = vehicle?.id;

  useLayoutEffect(() => {
    const root = detailRootRef.current;
    if (!vehicleId || !root || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const context = gsap.context(() => {
      const timeline = gsap.timeline({
        defaults: { duration: 0.55, ease: 'power2.out' },
      });

      timeline
        .from('.detail-breadcrumb', { autoAlpha: 0, y: 8 })
        .from('.vehicle-detail-hero > *', { autoAlpha: 0, y: 14, stagger: 0.1 }, '-=0.3')
        .from('.detail-information-grid > .card', { autoAlpha: 0, y: 14, stagger: 0.1 }, '-=0.25')
        .from('.detail-specifications', { autoAlpha: 0, y: 14 }, '-=0.3');

      if (related.length > 0) {
        timeline.from('.detail-related-section', { autoAlpha: 0, y: 14 }, '-=0.3');
      }
    }, root);

    return () => context.revert();
  }, [vehicleId, related.length]);

  if (loading) {
    return (
      <div className="container section vehicle-detail-loading" role="status" aria-label="Cargando vehículo">
        <div className="vehicle-detail-loader" aria-hidden="true" />
      </div>
    );
  }
  if (error) {
    return (
      <section className="container section">
        <EmptyState title="No se pudo cargar el vehículo" description={error} />
        <Link to="/catalogo" className="button button-secondary">Volver al catálogo</Link>
      </section>
    );
  }
  if (!vehicle) {
    return (
      <section className="container section">
        <EmptyState title="Vehículo no disponible" description="No encontramos esta publicación o ya no está visible." />
        <Link to="/catalogo" className="button button-secondary">Volver al catálogo</Link>
      </section>
    );
  }

  const whatsapp = dealership?.whatsapp.replace(/\D/g, '') ?? '';
  const images = [...vehicle.images].sort(
    (first, second) =>
      Number(second.isPrimary) - Number(first.isPrimary) ||
      first.sortOrder - second.sortOrder,
  );
  const [primaryImage] = images;
  const activeImage = images.find((image) => image.id === selectedImageId) ?? primaryImage;
  const whatsappMessage = encodeURIComponent(`Hola, quisiera consultar por ${vehicle.brand} ${vehicle.model}.`);
  const specifications = [
    { label: 'Año', value: String(vehicle.year) },
    { label: 'Kilometraje', value: vehicle.mileage === undefined ? 'No informado' : `${vehicle.mileage.toLocaleString()} km` },
    { label: 'Combustible', value: vehicle.fuel ?? 'No informado' },
    { label: 'Transmisión', value: vehicle.transmission ?? 'No informada' },
    { label: 'Motor', value: vehicle.engine || 'No informado' },
    { label: 'Potencia', value: vehicle.power === undefined ? 'No informada' : `${vehicle.power} HP` },
    { label: 'Tracción', value: vehicle.drivetrain || 'No informado' },
    { label: 'Color', value: vehicle.color || 'No informado' },
    { label: 'Puertas', value: vehicle.doors === undefined ? 'No informado' : String(vehicle.doors) },
    { label: 'Asientos', value: vehicle.seats === undefined ? 'No informado' : String(vehicle.seats) },
  ];

  return (
    <section className="section vehicle-detail-page" ref={detailRootRef}>
      <div className="container">
        <nav className="detail-breadcrumb" aria-label="Navegación">
          <Link to="/catalogo"><ArrowLeft size={16} /> Volver al catálogo</Link>
          <span>{vehicle.brand} / {vehicle.model}</span>
        </nav>

        <div className="vehicle-detail-hero">
          <div className="detail-gallery card">
            {activeImage ? (
              <img
                className="detail-gallery-main"
                src={activeImage.publicUrl}
                alt={activeImage.alt || `${vehicle.brand} ${vehicle.model}`}
              />
            ) : (
              <div className="image-placeholder detail-gallery-main">Sin fotografías disponibles</div>
            )}
            {images.length > 0 && (
              <div className="detail-gallery-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    className={`detail-gallery-thumbnail${activeImage?.id === image.id ? ' is-active' : ''}`}
                    type="button"
                    onClick={() => setSelectedImageId(image.id)}
                    aria-label={`Ver fotografía ${index + 1} de ${images.length}`}
                    aria-pressed={activeImage?.id === image.id}
                  >
                    <img
                      src={image.publicUrl}
                      alt=""
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <aside className="detail-summary card">
            <div className="detail-summary-topline">
              <p className="eyebrow">{vehicle.brand}</p>
              <p className="detail-publication-date">
                <CalendarDays size={15} /> Publicado el {formatDate(vehicle.publishedAt)}
              </p>
            </div>
            <h1>{vehicle.model}</h1>
            <div className="detail-summary-meta">
              {vehicle.version && <p className="detail-summary-version">{vehicle.version}</p>}
              <StatusBadge status={vehicle.status} />
              <span className="detail-condition-badge">
                {vehicle.condition === '0km' ? '0 km' : 'Usado'}
              </span>
            </div>

            <div className="detail-summary-price">
              <span>Precio</span>
              <strong>{formatCurrency(vehicle.price, vehicle.currency)}</strong>
            </div>

            <div className="detail-quick-facts" aria-label="Datos principales">
              <div><CarFront size={17} /><span>{vehicle.year}</span></div>
              <div><Gauge size={17} /><span>{vehicle.mileage === undefined ? 'KM no informado' : `${vehicle.mileage.toLocaleString()} km`}</span></div>
              <div><Fuel size={17} /><span>{vehicle.fuel ?? 'Combustible no informado'}</span></div>
              <div><Settings2 size={17} /><span>{vehicle.transmission ?? 'Transmisión no informada'}</span></div>
            </div>

            {whatsapp.length >= 8 ? (
              <a
                href={`https://wa.me/${whatsapp}?text=${whatsappMessage}`}
                className="button button-primary detail-contact-button"
                target="_blank"
                rel="noreferrer"
              >
                Consultar por WhatsApp <ArrowRight size={16} />
              </a>
            ) : (
              <button type="button" className="button button-secondary detail-contact-button" disabled>
                WhatsApp no configurado
              </button>
            )}
          </aside>
        </div>

        <div className="detail-information-grid">
          <section className="card detail-description detail-description-section">
            <div className="detail-section-heading">
              <p className="eyebrow">Descripción</p>
              <h2>Conoce más sobre este vehículo</h2>
            </div>
            <p className="detail-description-text">
              {vehicle.description || 'La concesionaria aún no agregó una descripción.'}
            </p>
          </section>

          <section className="card detail-equipment">
            <div className="detail-section-heading">
              <p className="eyebrow">Equipamiento</p>
              <h2>Detalles incluidos</h2>
            </div>
            {vehicle.equipment.length ? (
              <ul className="feature-list">
                {vehicle.equipment.map((item) => (
                  <li key={item}><ShieldCheck size={17} /><span>{item}</span></li>
                ))}
              </ul>
            ) : (
              <p>La concesionaria no informó el equipamiento.</p>
            )}
          </section>
        </div>

        <section className="card detail-specifications">
          <div className="detail-section-heading">
            <p className="eyebrow">Ficha técnica</p>
            <h2>Características</h2>
          </div>
          <ul className="spec-list">
            {specifications.map((specification) => (
              <li key={specification.label}>
                <span>{specification.label}</span>
                <strong>{specification.value}</strong>
              </li>
            ))}
          </ul>
        </section>

        {related.length > 0 && (
          <section className="detail-related-section">
            <div className="section-header">
              <div>
                <p className="eyebrow">Otras opciones</p>
                <h2>Vehículos relacionados</h2>
              </div>
              <Link to="/catalogo" className="button button-secondary">Ver catálogo</Link>
            </div>
            <div className="related-grid">
              {related.map((candidate) => <VehicleCard key={candidate.id} vehicle={candidate} />)}
            </div>
          </section>
        )}
      </div>
    </section>
  );
};
