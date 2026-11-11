-- Catalogo maestro de marcas, modelos y versiones para DealPush.
-- No modifica tablas existentes ni agrega relaciones a public.vehicles.

CREATE TABLE IF NOT EXISTS public.vehicle_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_brands_name_not_empty CHECK (name <> '' AND name = btrim(name)),
  CONSTRAINT vehicle_brands_normalized_name_matches
    CHECK (normalized_name <> '' AND normalized_name = lower(name))
);

CREATE TABLE IF NOT EXISTS public.vehicle_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL
    REFERENCES public.vehicle_brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_models_brand_normalized_name_unique
    UNIQUE (brand_id, normalized_name),
  CONSTRAINT vehicle_models_name_not_empty CHECK (name <> '' AND name = btrim(name)),
  CONSTRAINT vehicle_models_normalized_name_matches
    CHECK (normalized_name <> '' AND normalized_name = lower(name))
);

CREATE TABLE IF NOT EXISTS public.vehicle_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID NOT NULL
    REFERENCES public.vehicle_models(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT vehicle_versions_model_normalized_name_unique
    UNIQUE (model_id, normalized_name),
  CONSTRAINT vehicle_versions_name_not_empty CHECK (name <> '' AND name = btrim(name)),
  CONSTRAINT vehicle_versions_normalized_name_matches
    CHECK (normalized_name <> '' AND normalized_name = lower(name))
);

CREATE INDEX IF NOT EXISTS idx_vehicle_models_brand_id
  ON public.vehicle_models(brand_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_versions_model_id
  ON public.vehicle_versions(model_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_brands_name
  ON public.vehicle_brands(name);

CREATE INDEX IF NOT EXISTS idx_vehicle_models_name
  ON public.vehicle_models(name);

CREATE INDEX IF NOT EXISTS idx_vehicle_versions_name
  ON public.vehicle_versions(name);

CREATE OR REPLACE FUNCTION public.normalize_vehicle_catalog_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.name := btrim(NEW.name);
  IF NEW.name IS NULL OR NEW.name = '' THEN
    RAISE EXCEPTION 'El nombre del catálogo no puede estar vacío'
      USING ERRCODE = '23514';
  END IF;

  NEW.normalized_name := lower(NEW.name);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_vehicle_brands_name
  ON public.vehicle_brands;
CREATE TRIGGER normalize_vehicle_brands_name
  BEFORE INSERT OR UPDATE OF name, normalized_name
  ON public.vehicle_brands
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_vehicle_catalog_name();

DROP TRIGGER IF EXISTS normalize_vehicle_models_name
  ON public.vehicle_models;
CREATE TRIGGER normalize_vehicle_models_name
  BEFORE INSERT OR UPDATE OF name, normalized_name
  ON public.vehicle_models
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_vehicle_catalog_name();

DROP TRIGGER IF EXISTS normalize_vehicle_versions_name
  ON public.vehicle_versions;
CREATE TRIGGER normalize_vehicle_versions_name
  BEFORE INSERT OR UPDATE OF name, normalized_name
  ON public.vehicle_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.normalize_vehicle_catalog_name();

ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read vehicle brands"
  ON public.vehicle_brands;
CREATE POLICY "Public can read vehicle brands"
  ON public.vehicle_brands
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert vehicle brands"
  ON public.vehicle_brands;
CREATE POLICY "Admins can insert vehicle brands"
  ON public.vehicle_brands
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can update vehicle brands"
  ON public.vehicle_brands;
CREATE POLICY "Admins can update vehicle brands"
  ON public.vehicle_brands
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete vehicle brands"
  ON public.vehicle_brands;
CREATE POLICY "Admins can delete vehicle brands"
  ON public.vehicle_brands
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read vehicle models"
  ON public.vehicle_models;
CREATE POLICY "Public can read vehicle models"
  ON public.vehicle_models
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert vehicle models"
  ON public.vehicle_models;
CREATE POLICY "Admins can insert vehicle models"
  ON public.vehicle_models
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can update vehicle models"
  ON public.vehicle_models;
CREATE POLICY "Admins can update vehicle models"
  ON public.vehicle_models
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete vehicle models"
  ON public.vehicle_models;
CREATE POLICY "Admins can delete vehicle models"
  ON public.vehicle_models
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Public can read vehicle versions"
  ON public.vehicle_versions;
CREATE POLICY "Public can read vehicle versions"
  ON public.vehicle_versions
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can insert vehicle versions"
  ON public.vehicle_versions;
CREATE POLICY "Admins can insert vehicle versions"
  ON public.vehicle_versions
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can update vehicle versions"
  ON public.vehicle_versions;
CREATE POLICY "Admins can update vehicle versions"
  ON public.vehicle_versions
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS "Admins can delete vehicle versions"
  ON public.vehicle_versions;
CREATE POLICY "Admins can delete vehicle versions"
  ON public.vehicle_versions
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

GRANT SELECT ON public.vehicle_brands, public.vehicle_models, public.vehicle_versions
  TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE
  ON public.vehicle_brands, public.vehicle_models, public.vehicle_versions
  TO authenticated;

-- Ejecutar este archivo manualmente en el proyecto Supabase.
-- Los nombres históricos de vehicles.brand/model/version no se migran ni se siembran.
