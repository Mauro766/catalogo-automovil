import { Search, Sparkles } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export const Topbar = () => {
  const [search, setSearch] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigate(`/admin/vehiculos?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <header className="topbar">
      <form className="topbar-search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar vehículos, marcas o modelos"
          aria-label="Buscar vehículos"
        />
      </form>

      <div className="topbar-actions">
        <div className="user-chip">
          <div className="avatar">AD</div>
          <div>
            <strong>{user?.name ?? 'Administrador'}</strong>
            <small>{user?.email}</small>
          </div>
        </div>
        <Link to="/admin/vehiculos/nuevo" className="chip-button">
          <Sparkles size={16} />
          Nuevo vehículo
        </Link>
      </div>
    </header>
  );
};
