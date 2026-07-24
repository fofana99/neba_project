-- ============================================================
-- Nēba — Migration SQL complète pour projet Supabase externe (corrigée)
-- Projet cible: hjtgxmmlrretpyjdprqx
-- À exécuter dans: Supabase SQL Editor → New query → Run
-- ============================================================

BEGIN;

-- ---------- Extensions ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- Fonctions utilitaires ----------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================
-- TABLE categories
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  slug        text PRIMARY KEY,
  label       text NOT NULL,
  title       text NOT NULL,
  description text NOT NULL DEFAULT '',
  image       text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Categories are viewable by everyone" ON public.categories;
CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS categories_set_updated_at ON public.categories;
CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE collections
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collections (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  sort_order  integer NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.collections TO anon, authenticated;
GRANT ALL ON public.collections TO service_role;

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Collections are viewable by everyone" ON public.collections;
CREATE POLICY "Collections are viewable by everyone"
  ON public.collections FOR SELECT
  USING (true);

DROP TRIGGER IF EXISTS update_collections_updated_at ON public.collections;
CREATE TRIGGER update_collections_updated_at
  BEFORE UPDATE ON public.collections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE products
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           text NOT NULL UNIQUE,
  name           text NOT NULL,
  category_slug  text NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  collection     text NOT NULL DEFAULT '',
  price          integer NOT NULL CHECK (price >= 0),
  original_price integer CHECK (original_price IS NULL OR original_price >= 0),
  image          text NOT NULL DEFAULT '',
  images         text[] NOT NULL DEFAULT '{}',
  colors         jsonb NOT NULL DEFAULT '[]'::jsonb,
  sizes          text[] NOT NULL DEFAULT '{}',
  materials      text NOT NULL DEFAULT '',
  description    text NOT NULL DEFAULT '',
  stock          integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_new         boolean NOT NULL DEFAULT false,
  published      boolean NOT NULL DEFAULT true,
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx   ON public.products(category_slug);
CREATE INDEX IF NOT EXISTS products_collection_idx ON public.products(collection);
CREATE INDEX IF NOT EXISTS products_published_idx  ON public.products(published);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Published products are viewable by everyone" ON public.products;
CREATE POLICY "Published products are viewable by everyone"
  ON public.products FOR SELECT
  USING (published = true);

DROP TRIGGER IF EXISTS products_set_updated_at ON public.products;
CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- TABLE customers  (accès service_role uniquement)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.customers (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name  text NOT NULL,
  phone      text NOT NULL,
  email      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.customers TO service_role;
-- Pas de GRANT à anon/authenticated : la table est écrite/lue uniquement
-- via server functions utilisant la service_role.

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
-- Aucune policy : tout accès direct via Data API est bloqué.

DROP TRIGGER IF EXISTS customers_set_updated_at ON public.customers;
CREATE TRIGGER customers_set_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- STORAGE bucket product-images
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', false)
ON CONFLICT (id) DO NOTHING;

-- Accès direct au bucket réservé à la service_role.
-- Les images publiques sont diffusées via URLs signées côté serveur.
DROP POLICY IF EXISTS "product-images service role all" ON storage.objects;
CREATE POLICY "product-images service role all"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'product-images')
  WITH CHECK (bucket_id = 'product-images');

-- ============================================================
-- DONNÉES — categories, collections, products
-- ============================================================

INSERT INTO public.categories (slug, label, title, description, image, sort_order) VALUES
  ('homme', 'Homme', 'Vestiaire homme', 'Lin, coton, coupes épurées. Élégance masculine sans ostentation.', '/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg', 0),
  ('femme', 'Femme', 'Le vestiaire femme', 'Silhouettes fluides, matières nobles, coupes intemporelles.', '/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg', 1),
  ('enfant', 'Enfant', 'Le vestiaire enfant', 'Pièces douces et durables pour les plus jeunes.', '/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg', 2),
  ('signature', 'Signature', 'L''objet héritage', 'Pièces limitées, dialogue entre passé et présent.', '/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg', 3)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.collections (id, slug, name, description, sort_order) VALUES
  ('280acccd-10c4-41fa-a8dd-e551d3498eb7'::uuid, 'h-ritage-safran', 'Héritage Safran', '', 0),
  ('77b3def6-5836-47f0-8be5-9eaa452ac399'::uuid, 'racines-reseda', 'Racines Reseda', '', 0),
  ('265a2620-47d8-42df-bf1c-3a6bca8c2fba'::uuid, 'terre-vanille', 'Terre & Vanille', '', 0),
  ('2d64900f-e443-4988-86d1-6886b1bcffe3'::uuid, 'koko-collection', 'koko collection', '', 0)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.products (id, slug, name, category_slug, collection, price, original_price, image, images, colors, sizes, materials, description, stock, is_new, published, sort_order) VALUES
  ('7f19fd33-9bd1-4e8f-9adb-863a61388d6a'::uuid, 'robe-safran-heritage', 'Robe Safran Héritage', 'femme', 'Héritage Safran', 285000, NULL, 'https://hbperjbkmrlxvzwygjoz.supabase.co/storage/v1/object/sign/product-images/1784742853944-fq1i8b-w.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDNlZTI4MC1hNjc1LTQ2NTMtOTk0Yi1lYTM4YmYyNWQ0ZTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQyODUzOTQ0LWZxMWk4Yi13LmpwZWciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0NzQyODU1LCJleHAiOjIxMDAxMDI4NTV9.ceKbw2DuA2Mmy2-mzQRxnRx_5GCAf2lL3ApHxjLgUvw', ARRAY['https://hbperjbkmrlxvzwygjoz.supabase.co/storage/v1/object/sign/product-images/1784742112930-6tgmp5-whatsapp-image-2026-07-22-at-17-41-10-4.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDNlZTI4MC1hNjc1LTQ2NTMtOTk0Yi1lYTM4YmYyNWQ0ZTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQyMTEyOTMwLTZ0Z21wNS13aGF0c2FwcC1pbWFnZS0yMDI2LTA3LTIyLWF0LTE3LTQxLTEwLTQuanBlZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODQ3NDIxMTQsImV4cCI6MjEwMDEwMjExNH0.NcOJPkdde79OMqghtPztAlDsOsmfQ3siunb785iv3A8']::text[], '[{"hex": "#E8A93A", "name": "Safran"}, {"hex": "#687751", "name": "Reseda"}, {"hex": "#1d1d1b", "name": "Vanille"}]'::jsonb, ARRAY['XS','S','M','L','XL']::text[], 'Coton peigné 100%, teint main au safran végétal. Broderies fil de soie naturelle. Doublure coton respirant. Lavage à froid, à la main uniquement, séchage à plat à l''ombre.', 'Robe cérémonielle longue façonnée en atelier à Abidjan. La teinture safran est obtenue par bain végétal traditionnel, puis fixée à la main pour un rendu profond et vibrant. Les broderies malinké au fil de soie soulignent l''encolure et les poignets. Coupe évasée à taille marquée, doublure intérieure en coton pour un tombé fluide. Chaque robe est numérotée et signée par l''atelier.', 3, true, true, 0),
  ('f9b29d3e-aea6-4d1d-b97c-b163655c053f'::uuid, 'bouuba', 'bouuba', 'enfant', 'Racines Reseda', 23444, NULL, 'https://hbperjbkmrlxvzwygjoz.supabase.co/storage/v1/object/sign/product-images/1784743131275-pv1i59-wo.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDNlZTI4MC1hNjc1LTQ2NTMtOTk0Yi1lYTM4YmYyNWQ0ZTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQzMTMxMjc1LXB2MWk1OS13by5qcGVnIiwic2NvcGUiOiJkb3dubG9hZCIsImlhdCI6MTc4NDc0MzEzMSwiZXhwIjoyMTAwMTAzMTMxfQ.GvyKMisCi5x9FxAjQ-k5ysd8Y4H0tc7Su3YLrCQHXPo', ARRAY['https://hbperjbkmrlxvzwygjoz.supabase.co/storage/v1/object/sign/product-images/1784743141289-dmiec7-what.jpeg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV8xZDNlZTI4MC1hNjc1LTQ2NTMtOTk0Yi1lYTM4YmYyNWQ0ZTQiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwcm9kdWN0LWltYWdlcy8xNzg0NzQzMTQxMjg5LWRtaWVjNy13aGF0LmpwZWciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg0NzQzMTQyLCJleHAiOjIxMDAxMDMxNDJ9.kOuKRbhhq8ezuf5ES3Vqm1aOD6FILHSvdZR_sYqQDQ0']::text[], '[{"hex": "#f5f5d6", "name": "BEIGE"}, {"hex": "#687751", "name": "VERT"}]'::jsonb, ARRAY['XL','M']::text[], 'matiere confortable', 'tenue de style', 2, true, true, 0),
  ('8d32b84e-9ba9-46da-84d8-5bfa09889de5'::uuid, 'ensemble-reseda', 'Ensemble Reseda', 'femme', 'Racines Reseda', 256000, 320000, '/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg', ARRAY['/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg','/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg','/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg']::text[], '[{"hex": "#687751", "name": "Reseda"}, {"hex": "#4A2E1E", "name": "Chocolat"}]'::jsonb, ARRAY['XS','S','M','L']::text[], 'Soie sauvage 70%, viscose 30%. Doublure coton sur la tunique. Broderies fil de soie. Nettoyage à sec recommandé.', 'Ensemble deux pièces composé d''une tunique fluide et d''un pantalon assorti. La tunique tombe légèrement sous la hanche, avec fente latérale et broderies main aux poignets. Le pantalon droit, taille couverte, offre un tombé net et confortable. Coloris Reseda, teinte signature de la maison, obtenue par teinture réactive douce.', 2, false, true, 2),
  ('8acd7d13-f8e6-4b0c-87ae-e968742ffe9e'::uuid, 'top-peint-terre', 'Top Peint Terre', 'femme', 'Terre & Vanille', 95000, NULL, '/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg', ARRAY['/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg','/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg']::text[], '[{"hex": "#8B5A3C", "name": "Terre"}, {"hex": "#F5EFE0", "name": "Ivoire"}]'::jsonb, ARRAY['XS','S','M','L','XL']::text[], 'Coton bio 100% certifié GOTS. Peinture textile à l''eau, fixée à la vapeur. Lavage à 30°C sur l''envers, sans essorage.', 'Top sans manches peint à la main pièce par pièce. Chaque motif, inspiré des textiles malinké et des paysages de la Casamance, est unique et ne se retrouve à l''identique sur aucun autre exemplaire. Encolure ras du cou, emmanchures américaines, longueur cintrée sur les hanches.', 8, false, true, 3),
  ('808d288c-6666-480a-ab90-973f7d461212'::uuid, 'pantalon-large-chocolat', 'Pantalon Large Chocolat', 'femme', 'Terre & Vanille', 110000, NULL, '/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg', ARRAY['/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg','/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg']::text[], '[{"hex": "#4A2E1E", "name": "Chocolat"}, {"hex": "#1A1A1A", "name": "Noir"}]'::jsonb, ARRAY['XS','S','M','L','XL']::text[], 'Laine légère 85%, mohair 15%. Ceinture doublée coton. Boutonnière et zip invisibles. Nettoyage à sec.', 'Pantalon large taille haute, coupe palazzo à tombé impeccable. Ceinture entièrement couverte, fermeture éclair invisible sur le côté, poches passepoilées dissimulées. La laine légère assure une tenue structurée sans rigidité, idéale toute saison. Coloris chocolat profond, se marie avec toutes les pièces de la collection.', 0, false, true, 4),
  ('2a0e372a-0851-42d4-a901-7c1bdc7936f8'::uuid, 'chemise-lin-blanc-homme', 'Chemise Lin Blanc', 'homme', 'Racines Reseda', 85000, NULL, '/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg', ARRAY['/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg']::text[], '[{"hex": "#F5EFE0", "name": "Ivoire"}, {"hex": "#D8C7A8", "name": "Sable"}]'::jsonb, ARRAY['S','M','L','XL','XXL']::text[], 'Lin européen 100%, tissage moyen. Boutons corozo. Étiquette tissée intérieure. Lavage à 30°C, repassage vapeur, se froisse volontairement.', 'Chemise homme col mao en lin premium européen. Coupe droite décontractée, épaules tombées, manches longues avec poignets boutonnés. Détail estampé Nēba discret au poignet gauche. Six boutons corozo naturels sur le devant. Portée sortie ou rentrée dans un pantalon large, elle s''adapte à toutes les occasions.', 12, true, true, 5),
  ('986b61e4-d848-4c4a-a1fa-67ac76f27f58'::uuid, 'duo-safran-chocolat', 'Duo Safran & Chocolat', 'signature', 'Terre & Vanille', 450000, NULL, '/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg', ARRAY['/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg','/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg','/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg']::text[], '[{"hex": "#E8A93A", "name": "Safran"}, {"hex": "#4A2E1E", "name": "Chocolat"}]'::jsonb, ARRAY['Sur-mesure']::text[], 'Édition limitée numérotée 1/12 à 12/12. Coton, soie, teintures végétales. Coffret et certificat inclus. Entretien détaillé fourni dans le coffret.', 'Duo cérémoniel Automne-Hiver 2026 associant une pièce safran et une pièce chocolat. Chaque exemplaire est numéroté à la main sur l''étiquette intérieure et signé par la fondatrice Habiba. Édition limitée à 12 exemplaires dans le monde. Livré dans un coffret Nēba en carton recyclé, avec certificat d''authenticité.', 4, false, true, 7),
  ('5631f4b5-a75b-45a4-8ef3-fab2fcf88578'::uuid, 'voile-vanille', 'Voile Vanille', 'signature', 'Racines Reseda', 180000, NULL, '/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg', ARRAY['/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg','/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg']::text[], '[{"hex": "#F9E6A0", "name": "Vanille"}, {"hex": "#F5EFE0", "name": "Ivoire"}]'::jsonb, ARRAY['Unique']::text[], 'Voile de coton 100%, 220 x 80 cm. Broderies fil doré main. Frange nouée main aux extrémités. Lavage à froid à la main, séchage à plat.', 'Étole cérémonielle en voile de coton léger, brodée main au fil doré. Dimensions généreuses (220 x 80 cm) permettant de la porter sur les épaules, en châle ou nouée en foulard. Chaque broderie reprend un motif calligraphique inspiré du prénom Nēba (maman en malinké). Pièce transmissible.', 0, false, true, 8)
ON CONFLICT (slug) DO NOTHING;


COMMIT;

-- ============================================================
-- FIN
-- Vérifications rapides :
--   SELECT count(*) FROM public.categories;
--   SELECT count(*) FROM public.collections;
--   SELECT count(*) FROM public.products;
-- ============================================================
