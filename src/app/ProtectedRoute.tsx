import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute = () => {
  const { user, profile, isAuthenticated, isAdmin, loading, error } = useAuth();

  // Caso D: Sesión todavía comprobándose - no redirigir prematuramente
  if (loading) {
    return <p className="route-state" role="status">Comprobando sesión…</p>;
  }

  // Caso B: Usuario sin sesión
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Caso C: Usuario autenticado pero sin rol admin
  if (!isAdmin || profile?.role !== 'admin') {
    return (
      <div className="container section">
        <div className="card form-error" role="alert" style={{ maxWidth: '600px', margin: '2rem auto' }}>
          <h3>Acceso denegado</h3>
          <p>Esta cuenta no cuenta con permisos de administrador para ingresar al panel de gestión.</p>
          <div style={{ marginTop: '1rem' }}>
            <Link to="/login" className="button button-secondary">
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Si hay error en la validación pero se perdió el estado de admin
  if (error) {
    return <p className="route-state form-error" role="alert">{error}</p>;
  }

  // Caso A: Administrador con sesión válida y persistida
  return <Outlet />;
};
