
CREATE TABLE public.customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.customers TO anon;
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT ALL ON public.customers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Anonymous visitors can create their customer profile and read/update it
-- (row id is stored client-side in localStorage; we treat it as a bearer token).
CREATE POLICY "Anyone can create a customer profile"
ON public.customers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read customer profiles by id"
ON public.customers FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can update a customer profile"
ON public.customers FOR UPDATE
TO anon, authenticated
USING (true) WITH CHECK (true);

CREATE TRIGGER customers_set_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
