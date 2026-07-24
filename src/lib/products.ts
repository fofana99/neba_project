// Types & helpers partagés. Les données produits vivent en base (Cloud).
// Les catégories restent statiques (peu changeantes).

import look01 from "@/assets/neba-look-01.jpg";
import look04 from "@/assets/neba-look-05.jpg";
import signature from "@/assets/neba-signature.jpg";
import homme from "@/assets/neba-homme.jpg";

export type Category = {
  slug: string;
  label: string;
  title: string;
  description: string;
  image: string;
};

export type ProductColor = { name: string; hex: string };

export const SIZE_OPTIONS = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "Unique",
  "Sur-mesure",
] as const;

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection: string;
  price: number;
  originalPrice?: number | null;
  image: string;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  materials: string;
  description: string;
  stock: number;
  isNew?: boolean;
  published?: boolean;
  outOfStockSince?: string | null;
};

const GRACE_DAYS = 3;

export const daysUntilAutoUnpublish = (p: Product): number | null => {
  if (p.stock !== 0 || !p.outOfStockSince) return null;
  const elapsedMs = Date.now() - new Date(p.outOfStockSince).getTime();
  const remaining = GRACE_DAYS - elapsedMs / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(remaining));
};

export const categories: Category[] = [
  {
    slug: "homme",
    label: "Homme",
    title: "Vestiaire homme",
    description: "Lin, coton, coupes épurées. Élégance masculine sans ostentation.",
    image: homme,
  },
  {
    slug: "femme",
    label: "Femme",
    title: "Vestiaire femme",
    description: "Silhouettes fluides, matières nobles, coupes intemporelles.",
    image: look04,
  },
  {
    slug: "enfant",
    label: "Enfant",
    title: "Vestiaire enfant",
    description: "Pièces douces et durables pour les plus jeunes.",
    image: look01,
  },
  {
    slug: "signature",
    label: "Collections",
    title: "L'objet héritage",
    description: "Filtre transversal, pièces limitées de la maison.",
    image: signature,
  },
];

export const getCategory = (slug: string) =>
  categories.find((c) => c.slug === slug);

export const formatPrice = (xof: number) =>
  new Intl.NumberFormat("fr-FR").format(xof) + " F CFA";

export const isOnSale = (p: Product) =>
  typeof p.originalPrice === "number" &&
  p.originalPrice !== null &&
  p.originalPrice > p.price;

export const discountPct = (p: Product) =>
  isOnSale(p)
    ? Math.round(((p.originalPrice! - p.price) / p.originalPrice!) * 100)
    : 0;

/**
 * Normalise une ligne DB en Product front.
 */
export function rowToProduct(row: {
  id: string;
  slug: string;
  name: string;
  category_slug: string;
  collection?: string | null;
  price: number;
  original_price: number | null;
  image: string;
  images: string[];
  colors: unknown;
  sizes: string[];
  materials: string;
  description: string;
  stock: number;
  is_new: boolean;
  published: boolean;
  out_of_stock_since?: string | null;
}): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category_slug,
    collection: row.collection ?? "",
    price: row.price,
    originalPrice: row.original_price,
    image: row.image,
    images: row.images ?? [],
    colors: Array.isArray(row.colors) ? (row.colors as ProductColor[]) : [],
    sizes: row.sizes ?? [],
    materials: row.materials,
    description: row.description,
    stock: row.stock,
    isNew: row.is_new,
    published: row.published,
    outOfStockSince: row.out_of_stock_since ?? null,
  };
}
