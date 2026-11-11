
-- =========================================================
-- DEALPUSH | CATALOGO DE VEHICULOS
-- React + Vite + TypeScript + Supabase
-- Una concesionaria | Un administrador
-- =========================================================

-- =========================================================
-- 1. PERFILES DE USUARIO
-- =========================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY
    REFERENCES auth.users(id) ON DELETE CASCADE,

  full_name TEXT NOT NULL DEFAULT '',

  role TEXT NOT NULL DEFAULT 'admin'
    CHECK (role = 'admin'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- 2. CONFIGURACION DE LA CONCESIONARIA
-- =========================================================

CREATE TABLE IF NOT EXISTS public.dealership_settings (
  id BOOLEAN PRIMARY KEY DEFAULT true
    CHECK (id = true),

  name TEXT NOT NULL DEFAULT '',

  logo_url TEXT NOT NULL DEFAULT '',

  primary_color TEXT NOT NULL DEFAULT '#102a43',

  secondary_color TEXT NOT NULL DEFAULT '#4f46e5',

  whatsapp TEXT NOT NULL DEFAULT '',

  phone TEXT NOT NULL DEFAULT '',

  address TEXT NOT NULL DEFAULT '',

  description TEXT NOT NULL DEFAULT '',

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- 3. VEHICULOS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  brand TEXT NOT NULL,

  model TEXT NOT NULL,

  version TEXT NOT NULL DEFAULT '',

  year INT NOT NULL
    CHECK (year >= 1900 AND year <= 2100),

  price NUMERIC(14, 2) NOT NULL
    CHECK (price > 0),

  currency TEXT NOT NULL
    CHECK (currency IN ('ARS', 'USD')),

  status TEXT NOT NULL DEFAULT 'Borrador'
    CHECK (
      status IN (
        'Disponible',
        'Reservado',
        'Vendido',
        'Borrador'
      )
    ),

  featured BOOLEAN NOT NULL DEFAULT false,

  type TEXT NOT NULL
    CHECK (
      type IN (
        'SUV',
        'Sedán',
        'Hatchback',
        'Pickup',
        'Coupe',
        'Furgón'
      )
    ),

  mileage INT
    CHECK (mileage IS NULL OR mileage >= 0),

  fuel TEXT,

  transmission TEXT,

  engine TEXT NOT NULL DEFAULT '',

  power INT
    CHECK (power IS NULL OR power >= 0),

  drivetrain TEXT NOT NULL DEFAULT '',

  color TEXT NOT NULL DEFAULT '',

  doors INT
    CHECK (doors IS NULL OR doors > 0),

  seats INT
    CHECK (seats IS NULL OR seats > 0),

  description TEXT NOT NULL DEFAULT '',

  equipment JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(equipment) = 'array'),

  highlights JSONB NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(highlights) = 'array'),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- 4. IMAGENES DE VEHICULOS
-- =========================================================

CREATE TABLE IF NOT EXISTS public.vehicle_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  vehicle_id UUID NOT NULL
    REFERENCES public.vehicles(id) ON DELETE CASCADE,

  public_url TEXT NOT NULL,

  storage_path TEXT,

  alt TEXT NOT NULL DEFAULT '',

  is_primary BOOLEAN NOT NULL DEFAULT false,

  sort_order INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


-- =========================================================
-- 5. INDICES
-- =========================================================

CREATE INDEX IF NOT EXISTS idx_vehicles_status
ON public.vehicles(status);

CREATE INDEX IF NOT EXISTS idx_vehicles_brand
ON public.vehicles(brand);

CREATE INDEX IF NOT EXISTS idx_vehicles_created_at
ON public.vehicles(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_vehicles_featured
ON public.vehicles(featured)
WHERE featured = true;

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id
ON public.vehicle_images(vehicle_id);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_sort_order
ON public.vehicle_images(vehicle_id, sort_order);

-- Como maximo una imagen principal por vehiculo.
CREATE UNIQUE INDEX IF NOT EXISTS one_primary_image_per_vehicle
ON public.vehicle_images(vehicle_id)
WHERE is_primary = true;


-- =========================================================
-- 6. ACTUALIZACION AUTOMATICA DE updated_at
-- =========================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_vehicles_updated_at
ON public.vehicles;

CREATE TRIGGER set_vehicles_updated_at
BEFORE UPDATE ON public.vehicles
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


DROP TRIGGER IF EXISTS set_dealership_settings_updated_at
ON public.dealership_settings;

CREATE TRIGGER set_dealership_settings_updated_at
BEFORE UPDATE ON public.dealership_settings
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();


-- =========================================================
-- 7. FUNCION PARA COMPROBAR SI EL USUARIO ES ADMIN
-- =========================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = (SELECT auth.uid())
      AND profiles.role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin()
TO anon, authenticated;


-- =========================================================
-- 8. ACTIVAR ROW LEVEL SECURITY
-- =========================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.dealership_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- 9. POLITICAS DE PROFILES
-- =========================================================

DROP POLICY IF EXISTS "Admins can read profiles"
ON public.profiles;

CREATE POLICY "Admins can read profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id = (SELECT auth.uid())
  OR (SELECT public.is_admin())
);


-- =========================================================
-- 10. POLITICAS DE DEALERSHIP SETTINGS
-- =========================================================

DROP POLICY IF EXISTS "Public can read dealership settings"
ON public.dealership_settings;

CREATE POLICY "Public can read dealership settings"
ON public.dealership_settings
FOR SELECT
TO anon, authenticated
USING (true);


DROP POLICY IF EXISTS "Admins manage dealership settings"
ON public.dealership_settings;

CREATE POLICY "Admins manage dealership settings"
ON public.dealership_settings
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


-- =========================================================
-- 11. POLITICAS DE VEHICULOS
-- =========================================================

DROP POLICY IF EXISTS "Public reads published vehicles"
ON public.vehicles;

CREATE POLICY "Public reads published vehicles"
ON public.vehicles
FOR SELECT
TO anon, authenticated
USING (status <> 'Borrador');


DROP POLICY IF EXISTS "Admins manage vehicles"
ON public.vehicles;

CREATE POLICY "Admins manage vehicles"
ON public.vehicles
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


-- =========================================================
-- 12. POLITICAS DE IMAGENES
-- =========================================================

DROP POLICY IF EXISTS "Public reads published vehicle images"
ON public.vehicle_images;

CREATE POLICY "Public reads published vehicle images"
ON public.vehicle_images
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.vehicles
    WHERE vehicles.id = vehicle_images.vehicle_id
      AND vehicles.status <> 'Borrador'
  )
);


DROP POLICY IF EXISTS "Admins manage vehicle images"
ON public.vehicle_images;

CREATE POLICY "Admins manage vehicle images"
ON public.vehicle_images
FOR ALL
TO authenticated
USING ((SELECT public.is_admin()))
WITH CHECK ((SELECT public.is_admin()));


-- =========================================================
-- 13. PERMISOS DE TABLAS
-- =========================================================

GRANT SELECT ON public.dealership_settings TO anon, authenticated;

GRANT SELECT ON public.vehicles TO anon, authenticated;

GRANT SELECT ON public.vehicle_images TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.dealership_settings TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.vehicles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE
ON public.vehicle_images TO authenticated;


-- =========================================================
-- FIN DEL ESQUEMA
-- =========================================================

-- IMPORTANTE:
-- 1. Crear el usuario administrador desde Supabase Auth.
-- 2. Insertar su perfil manualmente desde un entorno confiable.
-- 3. No permitir que el frontend asigne el rol de administrador.
-- 4. Configurar Storage y sus politicas por separado.
-- 5. Nunca exponer la clave service_role en el frontend.
