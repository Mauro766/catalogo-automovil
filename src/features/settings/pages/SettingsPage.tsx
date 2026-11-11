import { useState, type FormEvent } from 'react';
import { useDealership } from '../../../hooks/useDealership';
import type { Dealership } from '../../../types';
import '../styles/settings.css';

interface DealershipSettingsFormProps {
  dealership: Dealership;
  save: (values: Dealership) => Promise<boolean>;
  error: string | null;
}

const DealershipSettingsForm = ({ dealership, save, error }: DealershipSettingsFormProps) => {
  const [values, setValues] = useState(dealership);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateField = <K extends keyof Dealership,>(key: K, value: Dealership[K]) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await save(values);
      setMessage(saved ? 'Configuración guardada correctamente.' : null);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {error && <p className="form-error" role="alert">{error}</p>}
      <form className="settings-form-root" onSubmit={(event) => void handleSubmit(event)}>
        <section className="card panel-card">
          <h3>Datos comerciales y contacto</h3>
          <div className="settings-form">
            <label>
              <span>Nombre</span>
              <input required value={values.name} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              <span>WhatsApp (con prefijo internacional)</span>
              <input type="tel" value={values.whatsapp} onChange={(event) => updateField('whatsapp', event.target.value)} />
            </label>
            <label>
              <span>Teléfono</span>
              <input type="tel" value={values.phone} onChange={(event) => updateField('phone', event.target.value)} />
            </label>
            <label>
              <span>Dirección</span>
              <input value={values.address} onChange={(event) => updateField('address', event.target.value)} />
            </label>
            <label className="settings-wide">
              <span>Descripción</span>
              <textarea rows={4} value={values.description} onChange={(event) => updateField('description', event.target.value)} />
            </label>
          </div>
        </section>

        <section className="card panel-card">
          <h3>Identidad visual</h3>
          <div className="settings-form">
            <label className="settings-wide">
              <span>URL del logo</span>
              <input type="url" value={values.logo} onChange={(event) => updateField('logo', event.target.value)} placeholder="https://" />
            </label>
            <label>
              <span>Color principal</span>
              <input type="color" value={values.primaryColor} onChange={(event) => updateField('primaryColor', event.target.value)} />
            </label>
            <label>
              <span>Color secundario</span>
              <input type="color" value={values.secondaryColor} onChange={(event) => updateField('secondaryColor', event.target.value)} />
            </label>
            <button type="submit" className="button button-primary settings-wide" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            {message && <p className="status-message success settings-wide" role="status">{message}</p>}
          </div>
        </section>
      </form>
    </>
  );
};

export const SettingsPage = () => {
  const { dealership, loading, error, save } = useDealership();

  if (loading) {
    return <p role="status">Cargando configuración…</p>;
  }
  if (!dealership) {
    return <p className="form-error" role="alert">{error ?? 'No se pudo cargar la concesionaria.'}</p>;
  }
  return (
    <>
      <div className="section-header">
        <div>
          <p className="eyebrow">Configuración</p>
          <h2>Datos de la concesionaria</h2>
        </div>
      </div>

      <DealershipSettingsForm dealership={dealership} save={save} error={error} />
    </>
  );
};
