BEGIN;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

UPDATE public.vehicles
SET published_at = created_at
WHERE published_at IS NULL;

ALTER TABLE public.vehicles
  ALTER COLUMN published_at SET DEFAULT now(),
  ALTER COLUMN published_at SET NOT NULL;

COMMIT;
