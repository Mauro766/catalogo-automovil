import { CarFront, CircleDollarSign, PackageCheck, Plus, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { StatusBadge } from '../../../components/feedback/StatusBadge';
import { StatCard } from '../../../components/ui/StatCard';
import { useVehicles } from '../../../hooks/useVehicles';
import { formatCurrency } from '../../../utils/formatters';
import '../styles/dashboard.css';

export const DashboardPage = () => {
  const { vehicles, loading, error } = useVehicles();
  const stats = [
    { label: 'Total vehículos', value: vehicles.length, accent: 'primary' as const, icon: <CarFront size={18} /> },
    { label: 'Disponibles', value: vehicles.filter((vehicle) => vehicle.status === 'Disponible').length, accent: 'success' as const, icon: <PackageCheck size={18} /> },
    { label: 'Reservados', value: vehicles.filter((vehicle) => vehicle.status === 'Reservado').length, accent: 'warning' as const, icon: <TrendingUp size={18} /> },
    { label: 'Vendidos', value: vehicles.filter((vehicle) => vehicle.status === 'Vendido').length, accent: 'danger' as const, icon: <CircleDollarSign size={18} /> },
  ];
  const recentVehicles = [...vehicles]
    .sort((first, second) => second.createdAt.localeCompare(first.createdAt))
    .slice(0, 5);

  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} label={stat.label} value={loading ? '…' : `${stat.value}`} accent={stat.accent} icon={stat.icon} />
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="card table-container">
          <div className="section-header">
            <div>
              <p className="eyebrow">Inventario</p>
              <h3>Vehículos agregados recientemente</h3>
            </div>
            <Link to="/admin/vehiculos" className="button button-secondary">Ver listado</Link>
          </div>

          {loading ? (
            <p role="status">Cargando vehículos…</p>
          ) : recentVehicles.length ? (
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr><th>Vehículo</th><th>Estado</th><th>Precio</th></tr>
                </thead>
                <tbody>
                  {recentVehicles.map((vehicle) => (
                    <tr key={vehicle.id}>
                      <td><strong>{vehicle.brand}</strong> {vehicle.model} <small>{vehicle.year}</small></td>
                      <td><StatusBadge status={vehicle.status} /></td>
                      <td>{formatCurrency(vehicle.price, vehicle.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="Aún no hay vehículos" description="Crea la primera ficha para comenzar a administrar el inventario." />
          )}
        </section>

        <aside className="card panel-card">
          <div className="section-header">
            <div>
              <p className="eyebrow">Accesos rápidos</p>
              <h3>Administrar catálogo</h3>
            </div>
          </div>
          <p>Agrega unidades, revisa su publicación o actualiza los datos comerciales.</p>
          <div className="quick-actions">
            <Link to="/admin/vehiculos/nuevo" className="button button-primary"><Plus size={16} /> Crear vehículo</Link>
            <Link to="/admin/vehiculos" className="button button-secondary">Administrar vehículos</Link>
            <Link to="/admin/configuracion" className="button button-secondary">Configurar concesionaria</Link>
          </div>
        </aside>
      </div>
    </>
  );
};
