
-- Customers: remove permissive policies and public grants
DROP POLICY IF EXISTS "Anyone can create a customer profile" ON public.customers;
DROP POLICY IF EXISTS "Anyone can read customer profiles by id" ON public.customers;
DROP POLICY IF EXISTS "Anyone can update a customer profile" ON public.customers;

REVOKE ALL ON public.customers FROM anon, authenticated;
GRANT ALL ON public.customers TO service_role;

-- RLS stays enabled; with no policies for anon/authenticated all direct access
-- is denied. All customer reads/writes go through server functions using the
-- service role client (validated + scoped by id).

-- Storage: explicit policies for the private product-images bucket
DROP POLICY IF EXISTS "product_images_service_all" ON storage.objects;
CREATE POLICY "product_images_service_all"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

-- Deny anon/authenticated direct access to product-images objects.
-- Reads happen via short-lived signed URLs generated server-side.
DROP POLICY IF EXISTS "product_images_no_public_select" ON storage.objects;
CREATE POLICY "product_images_no_public_select"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (false);

DROP POLICY IF EXISTS "product_images_no_public_write" ON storage.objects;
CREATE POLICY "product_images_no_public_write"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (false);

DROP POLICY IF EXISTS "product_images_no_public_update" ON storage.objects;
CREATE POLICY "product_images_no_public_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (false)
WITH CHECK (false);

DROP POLICY IF EXISTS "product_images_no_public_delete" ON storage.objects;
CREATE POLICY "product_images_no_public_delete"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (false);
