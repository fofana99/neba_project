import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import {
  categories,
  formatPrice,
  isOnSale,
  discountPct,
  type Product,
} from "@/lib/products";
import { listPublicProducts } from "@/lib/catalog.functions";
import { listPublicCollections, type Collection } from "@/lib/admin-collections.functions";
import { useState } from "react";

const searchSchema = z.object({
  cat: fallback(z.string(), "all").default("all"),
  col: fallback(z.string(), "all").default("all"),
});

export const Route = createFileRoute("/boutique")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Boutique | Nēba" },
      {
        name: "description",
        content:
          "Découvrez la boutique Nēba : haute couture, prêt-à-porter, homme et pièces signature façonnées à Abidjan.",
      },
      { property: "og:title", content: "Boutique | Nēba" },
      {
        property: "og:description",
        content:
          "Haute couture, prêt-à-porter, homme et pièces signature façonnées à Abidjan.",
      },
    ],
    links: [{ rel: "canonical", href: "/boutique" }],
  }),
  loader: async () => {
    const [products, collections] = await Promise.all([
      listPublicProducts(),
      listPublicCollections(),
    ]);
    return { products, collections };
  },
  component: BoutiquePage,
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="eyebrow">Erreur</p>
      <h1 className="mt-4 text-4xl">Boutique indisponible</h1>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="btn-luxe mt-8">Réessayer</button>
    </div>
  ),
});

function BoutiquePage() {
  const { products, collections } = Route.useLoaderData() as {
    products: Product[];
    collections: Collection[];
  };
  const initial = Route.useSearch();
  const [filter, setFilter] = useState<string>(initial.cat);
  const [collection, setCollection] = useState<string>(initial.col);

  // Liste des collections = base de données (table collections), pas dérivée des produits.
  const allCollections = collections.map((c) => c.name);

  let filtered = products;
  if (filter === "signature") {
    filtered =
      collection === "all"
        ? products.filter((p) => (p.collection ?? "").trim() !== "")
        : products.filter((p) => (p.collection ?? "").trim() === collection);
  } else if (filter !== "all") {
    filtered = products.filter((p) => p.category === filter);
  }


  return (
    <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28">
      <div className="text-center">
        <p className="eyebrow">Collection Automne-Hiver 2026</p>
        <h1 className="mt-6 text-5xl md:text-7xl">Boutique</h1>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          Chaque pièce est façonnée en série courte dans nos ateliers d'Abidjan.
        </p>
      </div>

      <div className="mt-14 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => {
            setFilter("all");
            setCollection("all");
          }}
          className={`eyebrow px-5 py-2 border transition-colors ${
            filter === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border hover:border-foreground"
          }`}
        >
          Toutes
        </button>
        {categories.map((c) => (
          <button
            key={c.slug}
            onClick={() => {
              setFilter(c.slug);
              setCollection("all");
            }}
            className={`eyebrow px-5 py-2 border transition-colors ${
              filter === c.slug
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-foreground"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {filter === "signature" && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <label htmlFor="collection-select" className="eyebrow text-muted-foreground">
            Choisir une collection
          </label>
          <select
            id="collection-select"
            value={collection}
            onChange={(e) => setCollection(e.target.value)}
            className="min-w-[280px] border border-border bg-background px-4 py-2.5 text-sm focus:border-foreground focus:outline-none"
          >
            <option value="all">Toutes les collections</option>
            {allCollections.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
          {allCollections.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              Aucune collection renseignée. Ajoutez le champ « Collection » sur chaque pièce depuis l'admin.
            </p>
          )}
        </div>
      )}

      <div className="mt-14 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((p) => {
          const soldOut = p.stock === 0;
          const promo = isOnSale(p);
          return (
            <Link
              key={p.slug}
              to="/produit/$slug"
              params={{ slug: p.slug }}
              className="group block"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                <img
                  src={p.image || p.images[0] || ""}
                  alt={p.name}
                  loading="lazy"
                  className={`h-full w-full object-cover object-[center_top] transition-transform duration-[1400ms] group-hover:scale-[1.04] ${
                    soldOut ? "opacity-70" : ""
                  }`}
                />
                <div className="absolute left-3 top-3 flex flex-col gap-2">
                  {promo && (
                    <span className="eyebrow bg-primary px-2 py-1 text-primary-foreground">
                      −{discountPct(p)}%
                    </span>
                  )}
                  {p.isNew && !promo && (
                    <span className="eyebrow bg-foreground px-2 py-1 text-background">
                      Nouveau
                    </span>
                  )}
                </div>
                {soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                    <span className="eyebrow border border-foreground bg-background px-4 py-2">
                      Rupture de stock
                    </span>
                  </div>
                )}
                {!soldOut && p.stock <= 3 && (
                  <span
                    className="absolute bottom-3 left-3 eyebrow bg-background/90 px-2 py-1"
                    style={{ color: "#B67514" }}
                  >
                    Plus que {p.stock}
                  </span>
                )}
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="eyebrow text-muted-foreground">
                    {categories.find((c) => c.slug === p.category)?.label}
                  </p>
                  <h3 className="mt-2 text-xl">{p.name}</h3>
                </div>
                <div className="shrink-0 text-right text-sm">
                  {promo ? (
                    <>
                      <p className="text-primary">{formatPrice(p.price)}</p>
                      <p className="text-xs text-muted-foreground line-through">
                        {formatPrice(p.originalPrice!)}
                      </p>
                    </>
                  ) : (
                    <p className="text-foreground/80">{formatPrice(p.price)}</p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                {p.colors.map((c) => (
                  <span
                    key={c.name}
                    title={c.name}
                    className="h-3 w-3 rounded-full border border-border"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <p className="mt-20 text-center text-muted-foreground">
          Aucune pièce dans cette catégorie pour le moment.
        </p>
      )}
    </div>
  );
}
