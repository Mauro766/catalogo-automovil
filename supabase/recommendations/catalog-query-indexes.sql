-- Optional catalog-query index recommendations.
-- Review and execute manually in Supabase; this file is not applied by the app.

CREATE INDEX IF NOT EXISTS idx_vehicles_public_published_at
  ON public.vehicles (published_at DESC, id ASC)
  WHERE status <> 'Borrador';

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_vehicles_brand_trgm
  ON public.vehicles USING gin (brand gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_model_trgm
  ON public.vehicles USING gin (model gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_vehicles_version_trgm
  ON public.vehicles USING gin (version gin_trgm_ops);
