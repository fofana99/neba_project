
-- Move existing haute-couture and pret-a-porter products to femme category
INSERT INTO public.categories (slug, label, title, description, image, sort_order)
VALUES
  ('femme', 'Femme', 'Le vestiaire femme', 'Silhouettes fluides, matières nobles, coupes intemporelles.', (SELECT image FROM public.categories WHERE slug = 'pret-a-porter'), 1),
  ('enfant', 'Enfant', 'Le vestiaire enfant', 'Pièces douces et durables pour les plus jeunes.', (SELECT image FROM public.categories WHERE slug = 'signature'), 3)
ON CONFLICT (slug) DO NOTHING;

UPDATE public.products SET category_slug = 'femme' WHERE category_slug IN ('haute-couture', 'pret-a-porter');

DELETE FROM public.categories WHERE slug IN ('haute-couture', 'pret-a-porter');

UPDATE public.categories SET sort_order = 0 WHERE slug = 'homme';
UPDATE public.categories SET sort_order = 1 WHERE slug = 'femme';
UPDATE public.categories SET sort_order = 2 WHERE slug = 'enfant';
UPDATE public.categories SET sort_order = 3 WHERE slug = 'signature';
