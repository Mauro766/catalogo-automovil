BEGIN;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS condition TEXT NOT NULL DEFAULT 'usado';

ALTER TABLE public.vehicles
  ADD CONSTRAINT vehicles_condition_check
  CHECK (condition IN ('0km', 'usado'));

COMMIT;
