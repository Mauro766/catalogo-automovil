import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye, EyeOff, Lock, Mail, Shield } from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import { isSupabaseConfigured } from '../../../lib/supabase';
import '../styles/auth.css';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { signIn, loading: authLoading, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Si el usuario ya está autenticado como administrador, redirigir directo a /admin
  useEffect(() => {
    if (!authLoading && isAuthenticated && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (authLoading) {
      return;
    }
    setMessage(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate('/admin', { replace: true });
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : 'No se pudo iniciar sesión.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dp-auth-layout">
      {/* Curvas decorativas de pista en el fondo azul (#2343C4) */}
      <div className="dp-auth-decorations" aria-hidden="true">
        <svg
          className="dp-auth-curve dp-auth-curve-top"
          viewBox="0 0 500 250"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 10 200 C 120 190, 240 180, 280 90 C 310 20, 310 0, 310 0"
            stroke="#DCE6F5"
            strokeWidth="10"
            strokeDasharray="22 18"
            strokeLinecap="round"
          />
        </svg>
        <svg
          className="dp-auth-curve dp-auth-curve-bottom"
          viewBox="0 0 500 300"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M 500 130 C 380 130, 290 140, 280 230 C 275 270, 280 300, 280 300"
            stroke="#DCE6F5"
            strokeWidth="10"
            strokeDasharray="22 18"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="dp-auth-card">
        <div className="dp-auth-header">
          <span className="dp-auth-badge">
            <Shield size={12} strokeWidth={2.5} />
            Acceso administrativo
          </span>
          <h1 className="dp-auth-title">Iniciar sesión</h1>
          <p className="dp-auth-subtitle">Gestiona vehículos y la información de tu concesionaria.</p>
        </div>

        <form className="dp-auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="dp-auth-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <div className="dp-input-wrapper">
              <Mail size={18} className="dp-input-icon" />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@dealpush.com"
                required
              />
            </div>
          </div>

          <div className="dp-auth-field">
            <div className="dp-label-row">
              <label htmlFor="login-password">Contraseña</label>
              <Link to="/forgot-password" className="dp-auth-link">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <div className="dp-input-wrapper">
              <Lock size={18} className="dp-input-icon" />
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="dp-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="dp-auth-submit-btn"
            disabled={submitting || authLoading}
          >
            {authLoading ? 'Comprobando sesión…' : submitting ? 'Ingresando…' : 'Iniciar sesión'}
          </button>
        </form>

        {message && (
          <div className="dp-auth-message error" role="alert">
            {message}
          </div>
        )}

        {!isSupabaseConfigured && (
          <p className="dp-auth-demo-notice" role="note">
            El acceso administrativo no está disponible hasta configurar Supabase Auth.
          </p>
        )}

        <div className="dp-auth-footer">
          <Link to="/" className="dp-back-link">
            <ArrowLeft size={16} />
            <span>Volver al catálogo</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
