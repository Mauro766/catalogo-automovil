import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import {
  createVehicleBrand,
  createVehicleModel,
  createVehicleVersion,
  getVehicleBrands,
  getVehicleModels,
  getVehicleVersions,
  type VehicleCatalogItem,
  type VehicleCatalogModel,
  type VehicleCatalogVersion,
} from '../../services/vehicleCatalogService';
import './vehicle-catalog-fields.css';

interface VehicleCatalogFieldsProps {
  brand: string;
  model: string;
  version: string;
  onBrandChange: (brand: string) => void;
  onModelChange: (model: string) => void;
  onVersionChange: (version: string) => void;
}

interface AddOptionFormProps {
  label: string;
  onCreate: (name: string) => Promise<void>;
  onCancel: () => void;
}

const AddOptionForm = ({ label, onCreate, onCancel }: AddOptionFormProps) => {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    const cleanName = name.trim();
    if (!cleanName) {
      setError(`Escribe el nombre de ${label.toLocaleLowerCase()}.`);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await onCreate(cleanName);
      setName('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `No se pudo agregar ${label.toLocaleLowerCase()}.`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="vehicle-catalog-add">
      <label>
        <span>Nuevo {label.toLocaleLowerCase()}</span>
        <input
          autoFocus
          value={name}
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleCreate();
            }
          }}
          disabled={saving}
          maxLength={100}
          required
        />
      </label>
      {error && <small className="vehicle-catalog-error" role="alert">{error}</small>}
      <div className="vehicle-catalog-add-actions">
        <button type="button" className="button button-primary" disabled={saving} onClick={() => void handleCreate()}>
          {saving ? 'Guardando…' : `Agregar ${label.toLocaleLowerCase()}`}
        </button>
        <button type="button" className="button button-secondary" disabled={saving} onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

const legacyOption = (name: string, id: string): VehicleCatalogItem | null =>
  name ? { id, name } : null;

const filterOptions = <T extends VehicleCatalogItem>(items: T[], query: string): T[] => {
  const normalizedQuery = query.trim().toLowerCase();
  return normalizedQuery
    ? items.filter((item) => item.name.toLowerCase().includes(normalizedQuery))
    : items;
};

export const VehicleCatalogFields = ({
  brand,
  model,
  version,
  onBrandChange,
  onModelChange,
  onVersionChange,
}: VehicleCatalogFieldsProps) => {
  const [brandCatalog, setBrandCatalog] = useState<{
    items: VehicleCatalogItem[];
    loaded: boolean;
    error: string | null;
  }>({ items: [], loaded: false, error: null });
  const [modelCatalog, setModelCatalog] = useState<{
    brandId: string;
    items: VehicleCatalogModel[];
    loaded: boolean;
    error: string | null;
  }>({ brandId: '', items: [], loaded: false, error: null });
  const [versionCatalog, setVersionCatalog] = useState<{
    modelId: string;
    items: VehicleCatalogVersion[];
    loaded: boolean;
    error: string | null;
  }>({ modelId: '', items: [], loaded: false, error: null });
  const [adding, setAdding] = useState<'brand' | 'model' | 'version' | null>(null);
  const [brandSearch, setBrandSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [versionSearch, setVersionSearch] = useState('');
  const brands = brandCatalog.items;
  const loadingBrands = !brandCatalog.loaded;
  const selectedBrand = brands.find(
    (item) => item.name.toLowerCase() === brand.trim().toLowerCase(),
  );
  const selectedBrandId = selectedBrand?.id ?? '';
  const models = useMemo(
    () => selectedBrandId && modelCatalog.brandId === selectedBrandId ? modelCatalog.items : [],
    [modelCatalog.brandId, modelCatalog.items, selectedBrandId],
  );
  const selectedModel = models.find(
    (item) => item.name.toLowerCase() === model.trim().toLowerCase(),
  );
  const selectedModelId = selectedModel?.id ?? '';
  const versions = useMemo(
    () => selectedModelId && versionCatalog.modelId === selectedModelId ? versionCatalog.items : [],
    [selectedModelId, versionCatalog.modelId, versionCatalog.items],
  );
  const loadingModels = Boolean(
    selectedBrandId && (!modelCatalog.loaded || modelCatalog.brandId !== selectedBrandId),
  );
  const loadingVersions = Boolean(
    selectedModelId && (!versionCatalog.loaded || versionCatalog.modelId !== selectedModelId),
  );
  const loadError =
    brandCatalog.error ??
    (modelCatalog.brandId === selectedBrandId ? modelCatalog.error : null) ??
    (versionCatalog.modelId === selectedModelId ? versionCatalog.error : null);

  useEffect(() => {
    let active = true;
    void getVehicleBrands()
      .then((result) => {
        if (active) {
          setBrandCatalog({ items: result, loaded: true, error: null });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setBrandCatalog({
            items: [],
            loaded: true,
            error: cause instanceof Error ? cause.message : 'No se pudieron cargar las marcas.',
          });
        }
      })

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    if (!selectedBrandId) {
      return () => {
        active = false;
      };
    }

    void getVehicleModels(selectedBrandId)
      .then((result) => {
        if (active) {
          setModelCatalog({
            brandId: selectedBrandId,
            items: result,
            loaded: true,
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setModelCatalog({
            brandId: selectedBrandId,
            items: [],
            loaded: true,
            error: cause instanceof Error ? cause.message : 'No se pudieron cargar los modelos.',
          });
        }
      })

    return () => {
      active = false;
    };
  }, [selectedBrandId]);

  useEffect(() => {
    let active = true;
    if (!selectedModelId) {
      return () => {
        active = false;
      };
    }

    void getVehicleVersions(selectedModelId)
      .then((result) => {
        if (active) {
          setVersionCatalog({
            modelId: selectedModelId,
            items: result,
            loaded: true,
            error: null,
          });
        }
      })
      .catch((cause: unknown) => {
        if (active) {
          setVersionCatalog({
            modelId: selectedModelId,
            items: [],
            loaded: true,
            error: cause instanceof Error ? cause.message : 'No se pudieron cargar las versiones.',
          });
        }
      })

    return () => {
      active = false;
    };
  }, [selectedModelId]);

  const visibleBrands = useMemo(() => {
    const options = [...brands];
    if (brand && !selectedBrand) {
      const option = legacyOption(brand, '__legacy_brand__');
      if (option) options.unshift(option);
    }
    const filtered = filterOptions(options, brandSearch);
    if (selectedBrand && !filtered.some((item) => item.id === selectedBrand.id)) {
      filtered.unshift(selectedBrand);
    }
    return filtered;
  }, [brand, brandSearch, brands, selectedBrand]);

  const visibleModels = useMemo(() => {
    const options: VehicleCatalogModel[] = [...models];
    if (model && !selectedModel) {
      options.unshift({ id: '__legacy_model__', brandId: selectedBrandId, name: model });
    }
    const filtered = filterOptions(options, modelSearch);
    if (selectedModel && !filtered.some((item) => item.id === selectedModel.id)) {
      filtered.unshift(selectedModel);
    }
    return filtered;
  }, [model, modelSearch, models, selectedBrandId, selectedModel]);

  const visibleVersions = useMemo(() => {
    const options: VehicleCatalogVersion[] = [...versions];
    if (version && !versions.some((item) => item.name.toLowerCase() === version.trim().toLowerCase())) {
      options.unshift({ id: '__legacy_version__', modelId: selectedModelId, name: version });
    }
    const selectedVersion = versions.find(
      (item) => item.name.toLowerCase() === version.trim().toLowerCase(),
    );
    const filtered = filterOptions(options, versionSearch);
    if (selectedVersion && !filtered.some((item) => item.id === selectedVersion.id)) {
      filtered.unshift(selectedVersion);
    }
    return filtered;
  }, [selectedModelId, version, versionSearch, versions]);

  const handleBrandCreate = async (name: string) => {
    const created = await createVehicleBrand(name);
    setBrandCatalog((current) => ({
      ...current,
      items: [...current.items, created].sort((first, second) => first.name.localeCompare(second.name)),
      loaded: true,
      error: null,
    }));
    onBrandChange(created.name);
    onModelChange('');
    onVersionChange('');
    setBrandSearch('');
    setAdding(null);
  };

  const handleModelCreate = async (name: string) => {
    const created = await createVehicleModel(selectedBrandId, name);
    setModelCatalog((current) => ({
      brandId: selectedBrandId,
      items: [...(current.brandId === selectedBrandId ? current.items : []), created]
        .sort((first, second) => first.name.localeCompare(second.name)),
      loaded: true,
      error: null,
    }));
    onModelChange(created.name);
    onVersionChange('');
    setModelSearch('');
    setAdding(null);
  };

  const handleVersionCreate = async (name: string) => {
    const created = await createVehicleVersion(selectedModelId, name);
    setVersionCatalog((current) => ({
      modelId: selectedModelId,
      items: [...(current.modelId === selectedModelId ? current.items : []), created]
        .sort((first, second) => first.name.localeCompare(second.name)),
      loaded: true,
      error: null,
    }));
    onVersionChange(created.name);
    setVersionSearch('');
    setAdding(null);
  };

  const currentBrandSelectValue = selectedBrand?.id ??
    (brand && !loadingBrands ? '__legacy_brand__' : '');
  const currentModelSelectValue = selectedModel?.id ??
    (model && !loadingModels ? '__legacy_model__' : '');
  const currentVersionSelectValue = versions.find(
    (item) => item.name.toLowerCase() === version.trim().toLowerCase(),
  )?.id ?? (version && !loadingVersions ? '__legacy_version__' : '');

  return (
    <section className="form-section vehicle-catalog-section" aria-labelledby="vehicle-catalog-heading">
      <div className="form-section-heading">
        <h3 id="vehicle-catalog-heading">Marca, modelo y versión</h3>
        <p>Selecciona opciones existentes o agrega nuevas al catálogo.</p>
      </div>
      {loadError && <p className="form-error" role="alert">{loadError}</p>}
      <div className="vehicle-catalog-grid">
        <div className="vehicle-catalog-field">
          <label htmlFor="vehicle-brand-search">Marca *</label>
          <input
            id="vehicle-brand-search"
            type="search"
            value={brandSearch}
            onChange={(event) => setBrandSearch(event.target.value)}
            placeholder="Buscar marca"
            aria-label="Buscar marca"
          />
          <select
            id="vehicle-brand-select"
            value={currentBrandSelectValue}
            aria-invalid={!brand}
            onChange={(event) => {
              const nextBrand = brands.find((item) => item.id === event.target.value);
              if (!nextBrand) {
                if (event.target.value === '__add_brand__') setAdding('brand');
                return;
              }
              onBrandChange(nextBrand.name);
              onModelChange('');
              onVersionChange('');
              setModelSearch('');
              setVersionSearch('');
              setAdding(null);
            }}
          >
            <option value="">{loadingBrands ? 'Cargando marcas…' : 'Seleccionar marca'}</option>
            {visibleBrands.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
            <option value="__add_brand__">Agregar nueva marca…</option>
          </select>
          {adding === 'brand' && (
            <AddOptionForm label="marca" onCreate={handleBrandCreate} onCancel={() => setAdding(null)} />
          )}
        </div>

        <div className="vehicle-catalog-field">
          <label htmlFor="vehicle-model-search">Modelo *</label>
          <input
            id="vehicle-model-search"
            type="search"
            value={modelSearch}
            onChange={(event) => setModelSearch(event.target.value)}
            placeholder="Buscar modelo"
            aria-label="Buscar modelo"
          />
          <select
            id="vehicle-model-select"
            value={currentModelSelectValue}
            disabled={!selectedBrandId || loadingModels}
            aria-invalid={!model}
            onChange={(event) => {
              const nextModel = models.find((item) => item.id === event.target.value);
              if (!nextModel) {
                if (event.target.value === '__add_model__') setAdding('model');
                return;
              }
              onModelChange(nextModel.name);
              onVersionChange('');
              setVersionSearch('');
              setAdding(null);
            }}
          >
            <option value="">
              {!selectedBrandId ? 'Selecciona una marca primero' : loadingModels ? 'Cargando modelos…' : 'Seleccionar modelo'}
            </option>
            {visibleModels.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
            <option value="__add_model__">Agregar nuevo modelo…</option>
          </select>
          {adding === 'model' && selectedBrandId && (
            <AddOptionForm label="modelo" onCreate={handleModelCreate} onCancel={() => setAdding(null)} />
          )}
        </div>

        <div className="vehicle-catalog-field">
          <label htmlFor="vehicle-version-search">Versión</label>
          <input
            id="vehicle-version-search"
            type="search"
            value={versionSearch}
            onChange={(event) => setVersionSearch(event.target.value)}
            placeholder="Buscar versión"
            aria-label="Buscar versión"
          />
          <select
            id="vehicle-version-select"
            value={currentVersionSelectValue}
            disabled={!selectedModelId || loadingVersions}
            onChange={(event) => {
              const nextVersion = versions.find((item) => item.id === event.target.value);
              if (!nextVersion) {
                if (event.target.value === '__add_version__') setAdding('version');
                else onVersionChange('');
                return;
              }
              onVersionChange(nextVersion.name);
              setAdding(null);
            }}
          >
            <option value="">
              {!selectedModelId ? 'Selecciona un modelo primero' : loadingVersions ? 'Cargando versiones…' : 'Sin versión'}
            </option>
            {visibleVersions.map((item) => (
              <option key={item.id} value={item.id}>{item.name}</option>
            ))}
            <option value="__add_version__">Agregar nueva versión…</option>
          </select>
          {adding === 'version' && selectedModelId && (
            <AddOptionForm label="versión" onCreate={handleVersionCreate} onCancel={() => setAdding(null)} />
          )}
        </div>
      </div>
    </section>
  );
};
