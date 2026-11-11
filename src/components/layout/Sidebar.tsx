import { CarFront, ExternalLink, House, LogOut, Settings, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDealership } from '../../hooks/useDealership';
import { isSupabaseConfigured } from '../../lib/supabase';
import { Button } from '../ui/Button';

const menuItems = [
  { to: '/admin', label: 'Resumen', icon: House, end: true },
  { to: '/admin/vehiculos', label: 'Vehículos', icon: CarFront },
  { to: '/admin/configuracion', label: 'Configuración', icon: Settings },
];

export const Sidebar = () => {
  const { signOut } = useAuth();
  const { dealership } = useDealership();
  const navigate = useNavigate();
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const handleLogout = async () => {
    setLogoutError(null);
    try {
      await signOut();
      navigate('/login', { replace: true });
    } catch (cause) {
      setLogoutError(cause instanceof Error ? cause.message : 'No se pudo cerrar la sesión.');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          {dealership?.logo ? <img src={dealership.logo} alt="" /> : 'DV'}
        </div>
        <div>
          <strong>{dealership?.name ?? 'Concesionaria'}</strong>
          <small>Concesionaria</small>
        </div>
      </div>

      <nav className="sidebar-nav" aria-label="Navegación administrativa">
        {menuItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={label} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
        <a className="nav-item" href="/catalogo" target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          <span>Catálogo público</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="mini-panel">
          <ShieldCheck size={18} />
          <div>
            <strong>Autenticación</strong>
            <small>{isSupabaseConfigured ? 'Supabase configurado' : 'Modo demostración'}</small>
          </div>
        </div>

        {logoutError && <p className="form-error" role="alert">{logoutError}</p>}
        <Button variant="ghost" className="logout-button" onClick={() => void handleLogout()}>
          <LogOut size={16} />
          Cerrar sesión
        </Button>
      </div>
    </aside>
  );
};
