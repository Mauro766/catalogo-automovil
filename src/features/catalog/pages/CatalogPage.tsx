import { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Filter, RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { useCatalogVehicles } from '../../../hooks/useCatalogVehicles';
import type { CatalogSortOption, FuelType, VehicleCondition, VehicleFilters, VehicleStatus } from '../../../types';
import { CatalogLoadMore } from '../components/CatalogLoadMore';
import { VehicleCard } from '../components/VehicleCard';
import '../styles/catalog.css';

const fuelTypes: FuelType[] = ['Gasolina', 'Diésel', 'Híbrido', 'Eléctrico', 'Gas'];
const statusTypes: VehicleStatus[] = ['Disponible', 'Reservado', 'Vendido'];
const parseNumberFilter = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const CatalogPage = () => {
  // Estados de filtros
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('Todas');
  const [status, setStatus] = useState<VehicleStatus | 'Todos'>('Todos');
  const [condition, setCondition] = useState<VehicleCondition | 'Todas'>('Todas');
  const [fuel, setFuel] = useState<FuelType | 'Todos'>('Todos');
  const [currency, setCurrency] = useState<'Todas' | 'ARS' | 'USD'>('Todas');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minYear, setMinYear] = useState('');
  const [maxYear, setMaxYear] = useState('');
  const [maxMileage, setMaxMileage] = useState('');
  const [sortBy, setSortBy] = useState<CatalogSortOption>('newest');
  const filters = useMemo<VehicleFilters>(() => ({
    search,
    brand,
    status,
    condition,
    fuel,
    currency,
    minPrice: parseNumberFilter(minPrice),
    maxPrice: parseNumberFilter(maxPrice),
    minYear: parseNumberFilter(minYear),
    maxYear: parseNumberFilter(maxYear),
    maxMileage: parseNumberFilter(maxMileage),
    sortBy,
  }), [
    brand,
    condition,
    currency,
    fuel,
    maxMileage,
    maxPrice,
    maxYear,
    minPrice,
    minYear,
    search,
    sortBy,
    status,
  ]);
  const {
    vehicles,
    brands: availableBrands,
    loading,
    loadingMore,
    error,
    brandsError,
    total,
    hasMore,
    loadMore,
    retry,
  } = useCatalogVehicles(filters);

  // Estado para colapsar/expandir acordeones de filtros en el panel
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    price: true,
    brand: true,
    status: true,
    condition: true,
    fuel: true,
    year: true,
    mileage: false,
  });

  // Modal / drawer móvil para filtros en Android y tablet
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleResetFilters = () => {
    setSearch('');
    setBrand('Todas');
    setStatus('Todos');
    setCondition('Todas');
    setFuel('Todos');
    setCurrency('Todas');
    setMinPrice('');
    setMaxPrice('');
    setMinYear('');
    setMaxYear('');
    setMaxMileage('');
    setSortBy('newest');
  };

  const brands = useMemo(
    () => ['Todas', ...availableBrands],
    [availableBrands],
  );

  const hasActiveFilters = Boolean(
    search ||
      brand !== 'Todas' ||
      status !== 'Todos' ||
      condition !== 'Todas' ||
      fuel !== 'Todos' ||
      currency !== 'Todas' ||
      minPrice ||
      maxPrice ||
      minYear ||
      maxYear ||
      maxMileage,
  );

  return (
    <div className="dp-catalog-page">
      {/* HEADER DE PÁGINA */}
      <section className="dp-catalog-hero">
        <div className="container">
          <div className="dp-catalog-hero-content">
            <div>
              <p className="dp-catalog-eyebrow">DealPush Vehículos</p>
              <h1 className="dp-catalog-main-title">Catálogo de unidades</h1>
              <p className="dp-catalog-main-sub">
                Encontrá tu próximo vehículo con filtros avanzados por precio, marca, combustible y estado.
              </p>
            </div>
            <div className="dp-catalog-count-badge">
              <strong>{loading || total === null ? '…' : total}</strong>
              <span>unidades disponibles</span>
            </div>
          </div>
        </div>
      </section>

      {/* CONTENIDO PRINCIPAL: PANEL IZQUIERDO DE FILTROS + GRILLA DERECHA DE AUTOS */}
      <div className="container dp-catalog-layout">
        {/* BOTÓN MÓVIL PARA ABRIR FILTROS (Solo visible en pantallas pequeñas) */}
        <div className="dp-mobile-filter-trigger">
          <button
            type="button"
            className="dp-btn-filter-toggle"
            onClick={() => setMobileFilterOpen(true)}
          >
            <Filter size={18} />
            <span>Filtrar y ordenar {hasActiveFilters && '(activos)'}</span>
          </button>
          <span className="dp-mobile-count">{total ?? '…'} vehículos</span>
        </div>

        {/* =========================================================================
            PANEL IZQUIERDO DE FILTROS (Desktop Sidebar / Mobile Drawer)
            ========================================================================= */}
        <aside className={`dp-filter-panel ${mobileFilterOpen ? 'mobile-open' : ''}`}>
          <div className="dp-filter-panel-inner">
            {/* Header del panel con título, limpiar y cerrar en mobile */}
            <div className="dp-filter-header">
              <div className="dp-filter-header-title">
                <SlidersHorizontal size={18} />
                <h3>Filtros</h3>
              </div>
              <div className="dp-filter-header-actions">
                {hasActiveFilters && (
                  <button
                    type="button"
                    className="dp-filter-reset-btn"
                    onClick={handleResetFilters}
                    title="Restablecer filtros"
                  >
                    <RotateCcw size={14} />
                    <span>Limpiar</span>
                  </button>
                )}
                <button
                  type="button"
                  className="dp-filter-close-btn"
                  onClick={() => setMobileFilterOpen(false)}
                  aria-label="Cerrar filtros"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* 1. BUSCADOR RÁPIDO */}
            <div className="dp-filter-group">
              <label htmlFor="catalog-search" className="dp-filter-label">
                Buscar modelo o palabra clave
              </label>
              <div className="dp-search-input-wrap">
                <Search size={16} />
                <input
                  id="catalog-search"
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Ej: Corolla, Focus, SUV..."
                />
              </div>
            </div>

            {/* 2. RANGO DE PRECIO (From - To) COMO EN LA IMAGEN */}
            <div className="dp-filter-accordion">
              <button
                type="button"
                className="dp-accordion-header"
                onClick={() => toggleSection('price')}
              >
                <span>Precio</span>
                {openSections.price ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSections.price && (
                <div className="dp-accordion-content">
                  <div className="dp-price-inputs-row">
                    <div className="dp-price-field">
                      <span className="dp-price-tag">Desde</span>
                      <input
                        type="number"
                        min="0"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        placeholder="Mínimo"
                      />
                    </div>
                    <span className="dp-price-sep">-</span>
                    <div className="dp-price-field">
                      <span className="dp-price-tag">Hasta</span>
                      <input
                        type="number"
                        min="0"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        placeholder="Máximo"
                      />
                    </div>
                  </div>

                  <div className="dp-currency-selector">
                    <span className="dp-small-label">Moneda:</span>
                    <div className="dp-radio-pills">
                      {(['Todas', 'ARS', 'USD'] as const).map((curr) => (
                        <button
                          key={curr}
                          type="button"
                          className={`dp-pill-btn ${currency === curr ? 'active' : ''}`}
                          onClick={() => setCurrency(curr)}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 3. MARCA (Con lista y conteo como en la imagen) */}
            <div className="dp-filter-accordion">
              <button
                type="button"
                className="dp-accordion-header"
                onClick={() => toggleSection('brand')}
              >
                <span>Marca</span>
                {openSections.brand ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSections.brand && (
                <div className="dp-accordion-content">
                  <div className="dp-filter-list">
                    {brandsError && <p className="form-error" role="alert">{brandsError}</p>}
                    {brands.map((brandName) => {
                      return (
                        <label key={brandName} className="dp-checkbox-row">
                          <input
                            type="radio"
                            name="brand-filter"
                            checked={brand === brandName}
                            onChange={() => setBrand(brandName)}
                          />
                          <span className="dp-checkbox-label">{brandName}</span>
                          <span className="dp-checkbox-count">—</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 4. DISPONIBILIDAD / ESTADO */}
            <div className="dp-filter-accordion">
              <button
                type="button"
                className="dp-accordion-header"
                onClick={() => toggleSection('status')}
              >
                <span>Disponibilidad</span>
                {openSections.status ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSections.status && (
                <div className="dp-accordion-content">
                  <div className="dp-filter-list">
                    {(['Todos', ...statusTypes] as const).map((st) => (
                      <label key={st} className="dp-checkbox-row">
                        <input
                          type="radio"
                          name="status-filter"
                          checked={status === st}
                          onChange={() => setStatus(st)}
                        />
                        <span className="dp-checkbox-label">{st}</span>
                        <span className="dp-checkbox-count">—</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. COMBUSTIBLE */}
            <div className="dp-filter-accordion">
              <button
                type="button"
                className="dp-accordion-header"
                onClick={() => toggleSection('condition')}
              >
                <span>Condición</span>
                {openSections.condition ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSections.condition && (
                <div className="dp-accordion-content">
                  <div className="dp-filter-list">
                    {([
                      ['Todas', 'Todos'],
                      ['0km', '0 km'],
                      ['usado', 'Usados'],
                    ] as const).map(([value, label]) => (
                      <label key={value} className="dp-checkbox-row">
                        <input
                          type="radio"
                          name="condition-filter"
                          checked={condition === value}
                          onChange={() => setCondition(value)}
                        />
                        <span className="dp-checkbox-label">{label}</span>
                        <span className="dp-checkbox-count">—</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. COMBUSTIBLE */}
            <div className="dp-filter-accordion">
              <button
                type="button"
                className="dp-accordion-header"
                onClick={() => toggleSection('fuel')}
              >
                <span>Combustible</span>
                {openSections.fuel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSections.fuel && (
                <div className="dp-accordion-content">
                  <div className="dp-filter-list">
                    {(['Todos', ...fuelTypes] as const).map((f) => (
                      <label key={f} className="dp-checkbox-row">
                        <input
                          type="radio"
                          name="fuel-filter"
                          checked={fuel === f}
                          onChange={() => setFuel(f)}
                        />
                        <span className="dp-checkbox-label">{f}</span>
                        <span className="dp-checkbox-count">—</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 6. AÑO Y KILOMETRAJE */}
            <div className="dp-filter-accordion">
              <button
                type="button"
                className="dp-accordion-header"
                onClick={() => toggleSection('year')}
              >
                <span>Año y kilometraje</span>
                {openSections.year ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openSections.year && (
                <div className="dp-accordion-content">
                  <div className="dp-range-inputs">
                    <label className="dp-subfield">
                      <span>Año desde:</span>
                      <input
                        type="number"
                        placeholder="Ej: 2018"
                        value={minYear}
                        onChange={(e) => setMinYear(e.target.value)}
                      />
                    </label>
                    <label className="dp-subfield">
                      <span>Año hasta:</span>
                      <input
                        type="number"
                        placeholder="Ej: 2024"
                        value={maxYear}
                        onChange={(e) => setMaxYear(e.target.value)}
                      />
                    </label>
                    <label className="dp-subfield">
                      <span>Máximo km:</span>
                      <input
                        type="number"
                        placeholder="Ej: 80000"
                        value={maxMileage}
                        onChange={(e) => setMaxMileage(e.target.value)}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* BOTÓN PARA APLICAR EN MÓVIL */}
            <div className="dp-mobile-apply-wrap">
              <button
                type="button"
                className="dp-btn-solid dp-btn-full"
                onClick={() => setMobileFilterOpen(false)}
              >
                Ver {total ?? '…'} resultados
              </button>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            PARTE DERECHA: BARRA SUPERIOR DE ORDEN + GRILLA DE AUTOS
            ========================================================================= */}
        <main className="dp-catalog-main">
          {/* BARRA SUPERIOR: RESULTADOS Y ORDENAR POR */}
          <div className="dp-catalog-topbar">
            <div className="dp-catalog-topbar-info">
              <h3>
                {brand !== 'Todas' ? `${brand} ` : ''}Vehículos disponibles
              </h3>
              <span>
                Mostrando {vehicles.length} de {total ?? '…'} unidades
              </span>
            </div>

            <div className="dp-sort-wrap">
              <label htmlFor="catalog-sort">Ordenar por:</label>
              <select
                id="catalog-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as CatalogSortOption)}
                className="dp-sort-select"
              >
                <option value="newest">Más recientes</option>
                <option value="price-asc">Precio: menor a mayor</option>
                <option value="price-desc">Precio: mayor a menor</option>
                <option value="year-desc">Año: más reciente</option>
              </select>
            </div>
          </div>

          {/* MENSAJES DE ERROR O CARGA */}
          {/* GRILLA DE VEHÍCULOS A LA DERECHA */}
          {loading ? (
            <div className="dp-loading-wrap">
              <p role="status">Cargando vehículos disponibles…</p>
            </div>
          ) : error && vehicles.length === 0 ? (
            <div className="dp-empty-wrap">
              <p className="form-error" role="alert">{error}</p>
              <button type="button" className="dp-btn-outline" onClick={retry}>
                Reintentar
              </button>
            </div>
          ) : vehicles.length ? (
            <>
              <div className="dp-catalog-cars-grid">
                {vehicles.map((vehicle, index) => (
                  <VehicleCard
                    key={vehicle.id}
                    vehicle={vehicle}
                    priority={index < 3}
                  />
                ))}
              </div>
              <CatalogLoadMore
                hasMore={hasMore}
                loading={loading}
                loadingMore={loadingMore}
                error={error}
                onLoadMore={loadMore}
                onRetry={retry}
              />
            </>
          ) : (
            <div className="dp-empty-wrap">
              <EmptyState
                title="No se encontraron vehículos"
                description="Probá ajustando o quitando algunos de los filtros seleccionados."
              />
              <button
                type="button"
                className="dp-btn-outline"
                onClick={handleResetFilters}
                style={{ marginTop: '1rem' }}
              >
                Restablecer todos los filtros
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
