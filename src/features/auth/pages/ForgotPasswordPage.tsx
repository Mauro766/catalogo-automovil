import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound, Mail } from 'lucide-react';
import { resetPassword } from '../../../services/authService';
import '../styles/auth.css';

export const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      await resetPassword(email);
      setMessage({ type: 'success', text: 'Te enviamos un enlace para recuperar la contraseña.' });
    } catch (cause) {
      setMessage({
        type: 'error',
        text: cause instanceof Error ? cause.message : 'No se pudo completar la recuperación.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="dp-auth-layout">
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
      </div>

      <div className="dp-auth-card">
        <div className="dp-auth-header">
          <span className="dp-auth-badge">
            <KeyRound size={12} strokeWidth={2.5} />
            Recuperación de cuenta
          </span>
          <h2 className="dp-auth-title">Restablecer contraseña</h2>
          <p className="dp-auth-subtitle">
            Ingresa tu correo y te enviaremos las instrucciones para recuperar el acceso.
          </p>
        </div>

        <form className="dp-auth-form" onSubmit={(event) => void handleSubmit(event)}>
          <div className="dp-auth-field">
            <label htmlFor="reset-email">Correo electrónico</label>
            <div className="dp-input-wrapper">
              <Mail size={18} className="dp-input-icon" />
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="tu@correo.com"
                required
              />
            </div>
          </div>

          <button type="submit" className="dp-auth-submit-btn" disabled={submitting}>
            {submitting ? 'Enviando…' : 'Enviar enlace'}
          </button>
        </form>

        {message && (
          <div className={`dp-auth-message ${message.type}`} role={message.type === 'error' ? 'alert' : 'status'}>
            {message.text}
          </div>
        )}

        <div className="dp-auth-footer">
          <Link to="/login" className="dp-back-link">
            <ArrowLeft size={16} />
            <span>Volver a iniciar sesión</span>
          </Link>
        </div>
      </div>
    </section>
  );
};
