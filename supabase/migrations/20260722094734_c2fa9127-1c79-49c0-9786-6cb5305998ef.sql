
CREATE TABLE public.categories (
  slug TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.categories FOR SELECT
  USING (true);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug) ON UPDATE CASCADE,
  price INT NOT NULL CHECK (price >= 0),
  original_price INT CHECK (original_price IS NULL OR original_price >= 0),
  image TEXT NOT NULL DEFAULT '',
  images TEXT[] NOT NULL DEFAULT '{}',
  colors JSONB NOT NULL DEFAULT '[]'::jsonb,
  sizes TEXT[] NOT NULL DEFAULT '{}',
  materials TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_new BOOLEAN NOT NULL DEFAULT false,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX products_category_idx ON public.products(category_slug);
CREATE INDEX products_published_idx ON public.products(published);

GRANT SELECT ON public.products TO anon, authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published products are viewable by everyone"
  ON public.products FOR SELECT
  USING (published = true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER categories_set_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER products_set_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed categories
INSERT INTO public.categories (slug, label, title, description, image, sort_order) VALUES
  ('haute-couture', 'Haute Couture', 'Les pièces uniques', 'Robes cérémonielles, coupes sur-mesure, teintures à la main.', '/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg', 1),
  ('pret-a-porter', 'Prêt-à-porter', 'Le vestiaire quotidien', 'Silhouettes fluides, matières nobles, coupes intemporelles.', '/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg', 2),
  ('homme', 'Homme', 'Vestiaire homme', 'Lin, coton, coupes épurées. Élégance masculine sans ostentation.', '/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg', 3),
  ('signature', 'Signature', 'L''objet héritage', 'Pièces limitées, dialogue entre passé et présent.', '/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg', 4);

-- Seed products
INSERT INTO public.products (slug, name, category_slug, price, original_price, image, images, colors, sizes, materials, description, stock, is_new, sort_order) VALUES
  ('robe-safran-heritage', 'Robe Safran Héritage', 'haute-couture', 285000, NULL,
    '/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg',
    ARRAY['/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg','/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg','/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg'],
    '[{"name":"Safran","hex":"#E8A93A"},{"name":"Reseda","hex":"#687751"},{"name":"Vanille","hex":"#F9E6A0"}]'::jsonb,
    ARRAY['XS','S','M','L','XL'],
    'Coton peigné teint à la main, broderies fil de soie.',
    'Pièce cérémonielle façonnée en atelier à Abidjan. Teinture safran obtenue par bain végétal, broderies malinké au fil de soie.',
    3, true, 1),
  ('ensemble-reseda', 'Ensemble Reseda', 'haute-couture', 256000, 320000,
    '/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg',
    ARRAY['/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg','/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg','/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg'],
    '[{"name":"Reseda","hex":"#687751"},{"name":"Chocolat","hex":"#4A2E1E"}]'::jsonb,
    ARRAY['XS','S','M','L'],
    'Soie sauvage, doublure coton.',
    'Ensemble deux pièces, coupe fluide, broderies main aux poignets.',
    2, false, 2),
  ('top-peint-terre', 'Top Peint Terre', 'pret-a-porter', 95000, NULL,
    '/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg',
    ARRAY['/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg','/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg'],
    '[{"name":"Terre","hex":"#8B5A3C"},{"name":"Ivoire","hex":"#F5EFE0"}]'::jsonb,
    ARRAY['XS','S','M','L','XL'],
    'Coton bio, peinture textile main.',
    'Top sans manches peint à la main, motifs uniques inspirés des textiles malinké.',
    8, false, 3),
  ('pantalon-large-chocolat', 'Pantalon Large Chocolat', 'pret-a-porter', 110000, NULL,
    '/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg',
    ARRAY['/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg','/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg'],
    '[{"name":"Chocolat","hex":"#4A2E1E"},{"name":"Noir","hex":"#1A1A1A"}]'::jsonb,
    ARRAY['XS','S','M','L','XL'],
    'Laine légère, ceinture couverte.',
    'Pantalon large taille haute, tombé impeccable, poches passepoilées.',
    0, false, 4),
  ('chemise-lin-blanc-homme', 'Chemise Lin Blanc', 'homme', 85000, NULL,
    '/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg',
    ARRAY['/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg'],
    '[{"name":"Ivoire","hex":"#F5EFE0"},{"name":"Sable","hex":"#D8C7A8"}]'::jsonb,
    ARRAY['S','M','L','XL','XXL'],
    'Lin européen 100%, col mao, boutons corozo.',
    'Chemise homme col mao en lin premium, coupe droite décontractée. Détail estampé Nēba au poignet.',
    12, true, 5),
  ('bermuda-noir-homme', 'Bermuda Ample Noir', 'homme', 70000, 92000,
    '/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg',
    ARRAY['/__l5e/assets-v1/32ceb13a-573e-4e14-afb1-85471a11c032/neba-homme.jpg'],
    '[{"name":"Noir","hex":"#1A1A1A"},{"name":"Chocolat","hex":"#4A2E1E"}]'::jsonb,
    ARRAY['S','M','L','XL','XXL'],
    'Coton twill lourd, taille élastiquée couverte.',
    'Bermuda ample tombé fluide, taille confortable, longueur mi-mollet. Se porte avec la chemise lin.',
    6, false, 6),
  ('duo-safran-chocolat', 'Duo Safran & Chocolat', 'signature', 450000, NULL,
    '/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg',
    ARRAY['/__l5e/assets-v1/d4348b11-144c-4da0-b546-18ea852d56b3/neba-signature.jpg','/__l5e/assets-v1/e51a1c31-6075-4875-8a70-6a52fdbb9f19/neba-look-02.jpg','/__l5e/assets-v1/44643598-4a2f-4605-a0d0-31491193dba5/neba-look-01.jpg'],
    '[{"name":"Safran","hex":"#E8A93A"},{"name":"Chocolat","hex":"#4A2E1E"}]'::jsonb,
    ARRAY['Sur-mesure'],
    'Édition limitée, série de 12 pièces numérotées.',
    'Pièce signature Automne-Hiver 2026, numérotée et signée à la main.',
    4, false, 7),
  ('voile-vanille', 'Voile Vanille', 'signature', 180000, NULL,
    '/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg',
    ARRAY['/__l5e/assets-v1/32bdbad2-8264-47fd-bbd0-a76aabdd3867/neba-look-03.jpg','/__l5e/assets-v1/c2cf4cb0-8efa-4795-a458-3e0da7987bef/neba-look-04.jpg'],
    '[{"name":"Vanille","hex":"#F9E6A0"},{"name":"Ivoire","hex":"#F5EFE0"}]'::jsonb,
    ARRAY['Unique'],
    'Voile de coton, broderies fil doré.',
    'Étole cérémonielle en voile de coton, broderies fil doré main.',
    0, false, 8);
