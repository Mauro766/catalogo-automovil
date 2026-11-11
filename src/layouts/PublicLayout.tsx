import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutGrid, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useDealership } from '../hooks/useDealership';
import './layouts.css';
import '../components/layout/header.css';
import '../components/layout/footer.css';

export const PublicLayout = () => {
  const { dealership, error: dealershipError } = useDealership();
  const { user, profile, isAuthenticated, isAdmin, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const brandTitle = dealership?.name || 'DealPush';

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setUserMenuOpen(false);
      navigate('/login', { replace: true });
    } finally {
      setLoggingOut(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const isUserAdmin = !authLoading && isAuthenticated && isAdmin;
  const isHomePage = pathname === '/';
  const isCatalogPage = pathname === '/catalogo';
  const isVehicleDetailPage = pathname.startsWith('/vehiculos/');
  const isAuthPage = pathname === '/login' || pathname === '/forgot-password';
  const displayName = profile?.fullName || user?.name || user?.email?.split('@')[0] || 'Admin';
  const userFirstName = displayName.trim().split(' ')[0] || 'Admin';

  return (
    <div className="dp-public-shell">
      {/* HEADER azul con branding y navegación alineada */}
      <header className={isVehicleDetailPage ? 'dp-header dp-header-static' : 'dp-header'}>
        <div className="container dp-header-inner">
          <Link to="/" className="dp-logo">
            {dealership?.logo ? (
              <img src={dealership.logo} alt={brandTitle} className="dp-logo-img" />
            ) : (
              <span>{brandTitle}</span>
            )}
          </Link>

          <div className="dp-header-right">
            <nav className="dp-nav" aria-label="Navegación principal">
              <NavLink to="/" className={({ isActive }) => `dp-nav-link ${isActive ? 'active' : ''}`} end>
                Inicio
              </NavLink>
              <NavLink to="/catalogo" className={({ isActive }) => `dp-nav-link ${isActive ? 'active' : ''}`}>
                Catálogo
              </NavLink>
              <a href="#contacto" className="dp-nav-link">
                Local
              </a>
            </nav>

            {/* Stack de usuario y panel */}
            {isUserAdmin ? (
              <div className="dp-header-admin-stack" ref={userMenuRef}>
                <button
                  type="button"
                  className="dp-user-pill"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  aria-expanded={userMenuOpen}
                  aria-label="Perfil de usuario"
                  title={`Usuario: ${displayName}`}
                >
                  <span className="dp-user-name">{userFirstName}</span>
                  <User size={15} strokeWidth={2.2} />
                </button>

                {userMenuOpen && (
                  <div className="dp-user-dropdown" role="menu">
                    <div className="dp-user-dropdown-info">
                      <strong className="dp-user-dropdown-name">{displayName}</strong>
                      <span className="dp-user-dropdown-email">{user?.email}</span>
                      <span className="dp-role-badge">Administrador</span>
                    </div>
                    <div className="dp-user-dropdown-divider" />
                    <Link
                      to="/admin"
                      className="dp-user-dropdown-item dp-panel-item"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutGrid size={15} />
                      <span>Panel administrador</span>
                    </Link>
                    <button
                      type="button"
                      className="dp-user-dropdown-item dp-logout-item"
                      onClick={() => void handleLogout()}
                      disabled={loggingOut}
                    >
                      <LogOut size={14} />
                      <span>{loggingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Usuario no autenticado: solo icono de usuario sin nombre y sin botón de panel */
              <div className="dp-header-guest-stack">
                <Link to="/login" className="dp-guest-pill" aria-label="Iniciar sesión" title="Iniciar sesión">
                  <User size={17} strokeWidth={2.2} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Admin indicator floating pill if logged in */}


      <main
        className={
          isHomePage || isCatalogPage || isVehicleDetailPage
            ? 'dp-public-main-no-offset'
            : isAuthPage
              ? 'dp-public-main-auth'
              : undefined
        }
      >
        {dealershipError && (
          <div className="container" style={{ marginTop: '1.5rem' }}>
            <p className="form-error" role="alert">
              No se pudo cargar la información comercial. Verifica la conexión con Supabase.
            </p>
          </div>
        )}
        <Outlet />
      </main>

      {/* FOOTER tal cual está en la imagen: fondo blanco, logo negro, columnas y pie con redes y créditos */}
      <footer className={`dp-footer${isCatalogPage || isVehicleDetailPage ? ' dp-footer-catalog' : ''}`} id="contacto">
        <div className="container dp-footer-main">
          {/* Columna Izquierda: Logo DealPush */}
          <div className="dp-footer-brand">
            <Link to="/" className="dp-footer-logo">
              {dealership?.logo ? (
                <img src={dealership.logo} alt={brandTitle} style={{ maxHeight: '36px' }} />
              ) : (
                <strong>{brandTitle}</strong>
              )}
            </Link>
          </div>

          {/* Columna Central: Navegación vertical */}
          <nav className="dp-footer-nav" aria-label="Navegación del pie">
            <ul>
              <li><Link to="/">Inicio</Link></li>
              <li><Link to="/catalogo">Catálogo</Link></li>
              <li><Link to="/catalogo?status=Disponible">Vehículos nuevos</Link></li>
              <li><Link to="/catalogo?maxMileage=100000">Vehículos usados</Link></li>
              <li><a href="#contacto">Local</a></li>
              <li><a href="#contacto">Contacto</a></li>
            </ul>

            {/* Redes sociales con iconos minimalistas como en la imagen */}
            <div className="dp-footer-socials">
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
              </a>
              <a href="#" aria-label="Facebook">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
              </a>
              <a href="#" aria-label="Twitter">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
              </a>
              <a href="#" aria-label="WhatsApp">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              </a>
              <a href="#" aria-label="LinkedIn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
              </a>
            </div>
          </nav>

          {/* Columna Derecha: Enlaces legales / privacidad */}
          <div className="dp-footer-legal">
            <ul>
              <li><a href="#">Términos y condiciones</a></li>
              <li><a href="#">Políticas de privacidad</a></li>
            </ul>
          </div>
        </div>

        {/* Barra inferior: 4 columnas pequeñas con copyright, dirección, etc. */}
        <div className="container dp-footer-sub">
          <div>
            <small className="dp-footer-sub-title">Contacto</small>
            <p>{dealership?.phone || '+54 11 0000-0000'}</p>
            <p>{dealership?.whatsapp ? `WA: ${dealership.whatsapp}` : 'info@dealpush.com'}</p>
          </div>

          <div>
            <small className="dp-footer-sub-title">Ubicación</small>
            <p>{dealership?.address || 'Av. Libertador 1234, CABA'}</p>
            <p>Buenos Aires, Argentina</p>
          </div>

          <div>
            <small className="dp-footer-sub-title">Horarios</small>
            <p>Lunes a Viernes: 9:00 - 19:00</p>
            <p>Sábados: 9:00 - 14:00</p>
          </div>

          <div>
            <small className="dp-footer-sub-title">DealPush</small>
            <p>© {new Date().getFullYear()} DealPush.</p>
            <p>Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
