import { useMemo, useState } from 'react';
import { Edit, ExternalLink, Star, Trash2 } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { invalidateVehicleQueries } from '../../../lib/queryClient';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { SearchField } from '../../../components/ui/SearchField';
import { useVehicles } from '../../../hooks/useVehicles';
import { deleteVehicle, updateVehicleFeatured, updateVehicleStatus } from '../../../services/vehicleService';
import type { VehicleStatus } from '../../../types';
import { formatCurrency } from '../../../utils/formatters';
import '../styles/dashboard.css';
import '../../vehicles/styles/vehicles.css';

const pageSize = 10;
const vehicleStatuses: VehicleStatus[] = ['Disponible', 'Reservado', 'Vendido', 'Borrador'];
const filterStatuses: Array<VehicleStatus | 'Todos'> = ['Todos', ...vehicleStatuses];

export const VehiclesPage = () => {
  const { vehicles, loading, error: loadError } = useVehicles();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [brand, setBrand] = useState('Todas');
  const [status, setStatus] = useState<VehicleStatus | 'Todos'>('Todos');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(0);
  const [actionError, setActionError] = useState<string | null>(null);

  const brands = useMemo(
    () => ['Todas', ...new Set(vehicles.map((vehicle) => vehicle.brand).sort())],
    [vehicles],
  );
  const filteredVehicles = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    const result = vehicles.filter((vehicle) => {
      const content = `${vehicle.brand} ${vehicle.model} ${vehicle.version} ${vehicle.status}`.toLocaleLowerCase();
      return (
        content.includes(query) &&
        (brand === 'Todas' || vehicle.brand === brand) &&
        (status === 'Todos' || vehicle.status === status)
      );
    });

    return result.sort((first, second) => {
      if (sortBy === 'price') {
        return first.currency.localeCompare(second.currency) || first.price - second.price;
      }
      if (sortBy === 'year') return second.year - first.year;
      return second.createdAt.localeCompare(first.createdAt);
    });
  }, [brand, search, sortBy, status, vehicles]);
  const pageCount = Math.ceil(filteredVehicles.length / pageSize);
  const visibleVehicles = filteredVehicles.slice(page * pageSize, (page + 1) * pageSize);

  const performAction = async (action: () => Promise<unknown>) => {
    setActionError(null);
    try {
      await action();
      await invalidateVehicleQueries();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : 'No se pudo completar la acción.');
    }
  };

  const handleDelete = async (vehicleId: string, label: string) => {
    if (!window.confirm(`¿Eliminar ${label}? Esta acción no se puede deshacer.`)) {
      return;
    }
    await performAction(() => deleteVehicle(vehicleId));
  };

  return (
    <>
      <div className="section-header">
        <div>
          <p className="eyebrow">Gestión</p>
          <h2>Listado de vehículos</h2>
        </div>
        <Link to="/admin/vehiculos/nuevo" className="button button-primary">Nuevo vehículo</Link>
      </div>

      <div className="card filters-panel">
        <div className="admin-vehicle-filters">
          <SearchField
            value={search}
            onChange={(value) => {
              setSearchParams(value ? { search: value } : {}, { replace: true });
              setPage(0);
            }}
            placeholder="Buscar marca, modelo o versión"
          />
          <label className="select-field">
            <span>Marca</span>
            <select value={brand} onChange={(event) => { setBrand(event.target.value); setPage(0); }}>
              {brands.map((brandOption) => <option key={brandOption}>{brandOption}</option>)}
            </select>
          </label>
          <label className="select-field">
            <span>Estado</span>
            <select
              value={status}
              onChange={(event) => {
                const nextStatus = filterStatuses.find((candidate) => candidate === event.target.value);
                if (nextStatus) {
                  setStatus(nextStatus);
                  setPage(0);
                }
              }}
            >
              <option value="Todos">Todos</option>
              <option value="Disponible">Disponible</option>
              <option value="Reservado">Reservado</option>
              <option value="Vendido">Vendido</option>
              <option value="Borrador">Borrador</option>
            </select>
          </label>
          <label className="select-field">
            <span>Orden</span>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option value="newest">Más recientes</option>
              <option value="price">Precio: menor a mayor</option>
              <option value="year">Año: más reciente</option>
            </select>
          </label>
        </div>
      </div>

      {(loadError || actionError) && <p className="form-error" role="alert">{actionError ?? loadError}</p>}
      {loading ? (
        <p role="status">Cargando vehículos…</p>
      ) : visibleVehicles.length === 0 ? (
        <EmptyState title="No hay vehículos para mostrar" description="Cambia los filtros o crea una nueva publicación." />
      ) : (
        <>
          <div className="card table-container table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th>Precio</th>
                  <th>Kilometraje</th>
                  <th>Destacado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {visibleVehicles.map((vehicle) => (
                  <tr key={vehicle.id}>
                    <td><strong>{vehicle.brand}</strong> {vehicle.model} <small>{vehicle.year}</small></td>
                    <td>
                      <label className="sr-only" htmlFor={`status-${vehicle.id}`}>Estado de {vehicle.brand} {vehicle.model}</label>
                      <select
                        id={`status-${vehicle.id}`}
                        className="table-status-select"
                        value={vehicle.status}
                        onChange={(event) => {
                          const nextStatus = vehicleStatuses.find((candidate) => candidate === event.target.value);
                          if (nextStatus) {
                            void performAction(() => updateVehicleStatus(vehicle.id, nextStatus));
                          }
                        }}
                      >
                        <option value="Disponible">Disponible</option>
                        <option value="Reservado">Reservado</option>
                        <option value="Vendido">Vendido</option>
                        <option value="Borrador">Borrador</option>
                      </select>
                    </td>
                    <td>{formatCurrency(vehicle.price, vehicle.currency)}</td>
                    <td>{vehicle.mileage === undefined ? '—' : `${vehicle.mileage.toLocaleString()} km`}</td>
                    <td>
                      <button
                        type="button"
                        className={vehicle.featured ? 'icon-button featured-action active' : 'icon-button featured-action'}
                        aria-label={vehicle.featured ? 'Quitar de destacados' : 'Marcar como destacado'}
                        aria-pressed={vehicle.featured}
                        onClick={() => void performAction(() => updateVehicleFeatured(vehicle.id, !vehicle.featured))}
                      >
                        <Star size={16} />
                      </button>
                    </td>
                    <td>
                      <div className="table-actions">
                        <Link className="icon-button" to={`/vehiculos/${vehicle.id}`} aria-label={`Ver ${vehicle.brand} ${vehicle.model}`}><ExternalLink size={16} /></Link>
                        <Link className="icon-button" to={`/admin/vehiculos/${vehicle.id}/editar`} aria-label={`Editar ${vehicle.brand} ${vehicle.model}`}><Edit size={16} /></Link>
                        <button type="button" className="icon-button danger" aria-label={`Eliminar ${vehicle.brand} ${vehicle.model}`} onClick={() => void handleDelete(vehicle.id, `${vehicle.brand} ${vehicle.model}`)}><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pageCount > 1 && (
            <nav className="pagination" aria-label="Paginación de vehículos">
              <button type="button" className="button button-secondary" disabled={page === 0} onClick={() => setPage((current) => current - 1)}>Anterior</button>
              <span>Página {page + 1} de {pageCount}</span>
              <button type="button" className="button button-secondary" disabled={page + 1 >= pageCount} onClick={() => setPage((current) => current + 1)}>Siguiente</button>
            </nav>
          )}
        </>
      )}
    </>
  );
};
