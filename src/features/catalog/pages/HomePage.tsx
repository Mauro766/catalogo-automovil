import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getPublicHomeVehicles } from '../../../services/vehicleService';
import { vehicleQueryKeys } from '../../../lib/queryClient';
import type { VehicleCondition } from '../../../types';
import { useDealership } from '../../../hooks/useDealership';
import { VehicleCard } from '../components/VehicleCard';
import '../styles/home.css';

type FilterTab = 'todos' | 'nuevos' | 'usados';

export const HomePage = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('todos');
  const { dealership } = useDealership();
  const condition: VehicleCondition | null =
    activeTab === 'nuevos' ? '0km' : activeTab === 'usados' ? 'usado' : null;
  const {
    data: filteredVehicles = [],
    isPending: loading,
    isError,
  } = useQuery({
    queryKey: [...vehicleQueryKeys.publicHome, condition ?? 'todos'],
    queryFn: () => getPublicHomeVehicles(condition),
  });

  const phoneDisplay = dealership?.phone || '+54 11 0000-0000';
  const addressDisplay = dealership?.address || 'Av. Libertador 1234, CABA';
  const whatsappNum = dealership?.whatsapp?.replace(/\D/g, '') || '';
  const whatsappUrl = whatsappNum
    ? `https://wa.me/${whatsappNum}?text=${encodeURIComponent('Hola DealPush, quisiera consultar por vehículos disponibles.')}`
    : '#contacto';

  return (
    <div className="dp-home">
      {/* =========================================================================
          SECCIÓN 1: HERO AZUL (#2343C4) con pista de líneas punteadas y tipografía Poppins
          ========================================================================= */}
      <section className="dp-hero">
        <div className="dp-hero-decorations" aria-hidden="true">


          <svg className="dp-hero-curve dp-hero-curve-top" width="538" height="403" viewBox="0 0 538 403" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M511.715 0C513.632 13.8879 515.299 27.3571 516.7 40.4148M0 372.609C13.7734 374.226 27.2228 375.711 40.3538 377.063M521.944 121.305C522.338 150.941 520.662 177.836 516.64 202.118M491.403 278.718C478.156 302.602 460.277 322.238 437.136 337.915M363.253 370.338C339.669 376.732 313.097 381.224 283.304 383.92M202.41 386.981C177.113 386.83 150.062 385.801 121.173 383.935" strokeWidth="31" stroke="#DCE6F5" />
          </svg>

          <img
            className="dp-hero-vehicle-animation"
            src="/VehiculoAnim.svg"
            alt=""
          />

        </div>


        <div className="container dp-hero-content">
          <div className="dp-hero-text">
            <h1 className="dp-hero-title">
              Encontrá tu próximo camino.
            </h1>
            <p className="dp-hero-sub">
              Descubrí vehículos seleccionados para
              <br />
              acompañarte en cada destino.
            </p>
          </div>
        </div>

      </section>

      {/* =========================================================================
          SECCIÓN 2: Consulta cada detalle antes de decidir (Fondo #DCE6F5, 3 cards #2343C4)
          ========================================================================= */}
      <section className="dp-features-section">
        <div className="container">
          <h2 className="dp-features-title">
            Consulta cada detalle antes
            <br />
            de decidir
          </h2>

          <div className="dp-features-grid">
            <article className="dp-feature-card">
              <h3>Datos del vehículo</h3>
              <p>
                Revisa las características, el
                <br />
                recorrido y las fotografías de
                <br />
                cada unidad.
              </p>
            </article>

            <article className="dp-feature-card">
              <h3>Estado actualizado</h3>
              <p>
                Identifica si una unidad está
                <br />
                disponible, reservada o
                <br />
                vendida.
              </p>
            </article>

            <article className="dp-feature-card">
              <h3>Atención directa</h3>
              <p>
                Comunícate con la
                <br />
                concesionaria para consultar
                <br />
                por una publicación.
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECCIÓN 3: Catálogo de vehículos (Fondo #DCE6F5 claro con cards blancas)
          ========================================================================= */}
      <section className="dp-catalog-section">
        <div className="container">
          <div className="dp-catalog-header">
            <div>
              <h2 className="dp-catalog-title">Catálogo de vehículos</h2>
              <p className="dp-catalog-desc">
                Explora las unidades disponibles, fotos, estado, precio detallado y
                <br />
                reserva con la concesionaria de manera inmediata.
              </p>
            </div>

            <div className="dp-catalog-tabs" role="tablist">
              <button
                type="button"
                className={`dp-tab ${activeTab === 'todos' ? 'active' : ''}`}
                onClick={() => setActiveTab('todos')}
              >
                Todos
              </button>
              <button
                type="button"
                className={`dp-tab ${activeTab === 'nuevos' ? 'active' : ''}`}
                onClick={() => setActiveTab('nuevos')}
              >
                Nuevos
              </button>
              <button
                type="button"
                className={`dp-tab ${activeTab === 'usados' ? 'active' : ''}`}
                onClick={() => setActiveTab('usados')}
              >
                Usados
              </button>
            </div>
          </div>

          {loading ? (
            <p className="dp-loading" role="status">Cargando vehículos…</p>
          ) : isError ? (
            <p className="dp-loading" role="alert">No se pudieron cargar los vehículos.</p>
          ) : filteredVehicles.length === 0 ? (
            <p className="dp-loading">No hay vehículos en esta categoría por el momento.</p>
          ) : (
            <div className="dp-cards-grid">
              {filteredVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}

          <div className="dp-catalog-footer">
            <small className="dp-catalog-disclaimer">
              * Precios y disponibilidad sujetos a confirmación con la concesionaria.
            </small>

            <div className="dp-catalog-actions">
              <Link to="/catalogo" className="dp-btn-outline">
                Ver todos
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="dp-btn-solid">
                Solicitar cotización
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECCIÓN 4: Banner Azul (#2343C4) con "¿Necesitás ayuda para encontrar...?"
          ========================================================================= */}
      <section className="dp-cta-section">
        <div className="container dp-cta-grid">
          <div className="dp-cta-left">
            <h2 className="dp-cta-title">
              ¿Necesitás ayuda para
              <br />
              encontrar tu próximo
              <br />
              vehículo?
            </h2>
            <p className="dp-cta-desc">
              Comunicate con nuestro equipo para recibir asesoramiento
              <br />
              personalizado, cotizaciones a medida y opciones de
              <br />
              financiamiento exclusivas.
            </p>

            <div className="dp-cta-buttons">
              <a href={whatsappUrl} target="_blank" rel="noreferrer" className="dp-cta-btn-white">
                Enviar un mensaje
              </a>
              <Link to="/catalogo" className="dp-cta-btn-ghost">
                Ver catálogo
              </Link>
            </div>
          </div>

          <div className="dp-cta-cards">
            <div className="dp-cta-info-card">
              <div className="dp-cta-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" /><circle cx="12" cy="10" r="3" /></svg>
              </div>
              <div className="dp-cta-info-text">
                <strong>Local de atención</strong>
                <p>{addressDisplay}</p>
              </div>
            </div>

            <div className="dp-cta-info-card">
              <div className="dp-cta-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              </div>
              <div className="dp-cta-info-text">
                <strong>Correo comercial</strong>
                <p>contacto@dealpush.com</p>
              </div>
            </div>

            <div className="dp-cta-info-card">
              <div className="dp-cta-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </div>
              <div className="dp-cta-info-text">
                <strong>Contacto</strong>
                <p>{phoneDisplay}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
