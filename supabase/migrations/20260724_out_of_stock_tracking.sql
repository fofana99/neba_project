-- ============================================================
-- Suivi de la rupture de stock : dépublication automatique après
-- 3 jours de rupture continue.
-- ============================================================

BEGIN;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS out_of_stock_since timestamptz;

CREATE OR REPLACE FUNCTION public.track_out_of_stock()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.stock = 0 THEN
    IF TG_OP = 'INSERT' THEN
      NEW.out_of_stock_since := now();
    ELSIF OLD.stock <> 0 THEN
      NEW.out_of_stock_since := now();
    END IF;
  ELSE
    NEW.out_of_stock_since := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_track_out_of_stock ON public.products;
CREATE TRIGGER products_track_out_of_stock
  BEFORE INSERT OR UPDATE OF stock ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.track_out_of_stock();

-- Backfill : produits déjà en rupture, on démarre le compteur maintenant.
UPDATE public.products
SET out_of_stock_since = now()
WHERE stock = 0 AND out_of_stock_since IS NULL;

COMMIT;
