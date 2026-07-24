import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  getCategory,
  formatPrice,
  isOnSale,
  discountPct,
  type Product,
} from "@/lib/products";
import { getPublicProductBySlug, listPublicProducts } from "@/lib/catalog.functions";
import { useCart } from "@/lib/cart";
import { useCustomer, CustomerRegisterModal } from "@/lib/customer";

export const Route = createFileRoute("/produit/$slug")({
  head: ({ loaderData }) => {
    const data = loaderData as { product?: Product } | undefined;
    const p = data?.product;
    return {
      meta: [
        { title: p ? `${p.name} | Nēba` : "Pièce | Nēba" },
        { name: "description", content: p?.description ?? "Pièce Nēba" },
        { property: "og:title", content: p ? `${p.name} | Nēba` : "Nēba" },
        { property: "og:description", content: p?.description ?? "" },
        ...(p ? [{ property: "og:image", content: p.image }] : []),
        ...(p ? [{ name: "twitter:image", content: p.image }] : []),
      ],
    };
  },
  loader: async ({ params }) => {
    const [product, all] = await Promise.all([
      getPublicProductBySlug({ data: { slug: params.slug } }),
      listPublicProducts(),
    ]);
    if (!product) throw notFound();
    const related = all
      .filter((p) => p.category === product.category && p.slug !== product.slug)
      .slice(0, 3);
    return { product, related };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="eyebrow">Erreur 404</p>
      <h1 className="mt-4 text-4xl">Pièce introuvable</h1>
      <div className="mt-8">
        <Link to="/boutique" className="btn-luxe">Retour à la boutique</Link>
      </div>
    </div>
  ),
  errorComponent: ({ error, reset }) => (
    <div className="mx-auto max-w-xl px-6 py-32 text-center">
      <p className="eyebrow">Erreur</p>
      <h1 className="mt-4 text-4xl">Chargement impossible</h1>
      <p className="mt-4 text-sm text-muted-foreground">{error.message}</p>
      <button onClick={reset} className="btn-luxe mt-8">Réessayer</button>
    </div>
  ),
});

function ProductPage() {
  const { product, related } = Route.useLoaderData() as {
    product: Product;
    related: Product[];
  };
  return <ProductView product={product} related={related} />;
}

function ProductView({ product, related }: { product: Product; related: Product[] }) {
  const category = getCategory(product.category);
  const [activeImg, setActiveImg] = useState(0);
  const [color, setColor] = useState(product.colors[0]?.name ?? "");
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [added, setAdded] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "buy" | null>(null);
  const cart = useCart();
  const router = useRouter();
  const { customer, hydrated: customerHydrated } = useCustomer();

  const soldOut = product.stock === 0;
  const promo = isOnSale(product);
  const gallery = product.images.filter((img) => img !== product.image);
  const imgList = product.image ? [product.image, ...gallery] : product.images;

  const buildItem = () => ({
    slug: product.slug,
    name: product.name,
    image: product.image,
    price: product.price,
    color,
    size,
    qty: 1,
    stock: product.stock,
  });

  const doAdd = (goToCart: boolean) => {
    const res = cart.add(buildItem());
    if (!res.ok) {
      setNotice(
        res.reason === "out_of_stock"
          ? "Cette pièce est en rupture de stock."
          : `Stock maximum atteint : ${res.max} disponible(s).`,
      );
      setTimeout(() => setNotice(null), 2600);
      return;
    }
    if (goToCart) {
      router.navigate({ to: "/panier" });
    } else {
      setAdded(true);
      setTimeout(() => setAdded(false), 1600);
    }
  };

  const gate = (action: "add" | "buy") => {
    if (soldOut) return;
    if (!customerHydrated) return;
    if (!customer) {
      setPendingAction(action);
      setShowRegister(true);
      return;
    }
    doAdd(action === "buy");
  };

  const handleAdd = () => gate("add");
  const handleBuyNow = () => gate("buy");

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-16 md:px-10 md:py-24">
      <nav className="eyebrow flex flex-wrap items-center gap-2 text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Accueil</Link>
        <span>/</span>
        <Link to="/boutique" className="hover:text-foreground">Boutique</Link>
        {category && (
          <>
            <span>/</span>
            <span>{category.label}</span>
          </>
        )}
      </nav>

      <div className="mt-10 grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <div className="relative aspect-[3/4] overflow-hidden bg-muted">
            <img
              src={imgList[activeImg]}
              alt={product.name}
              className={`h-full w-full object-cover object-[center_top] ${soldOut ? "opacity-70" : ""}`}
            />
            <div className="absolute left-4 top-4 flex flex-col gap-2">
              {promo && (
                <span className="eyebrow bg-primary px-3 py-1.5 text-primary-foreground">
                  Promo −{discountPct(product)}%
                </span>
              )}
              {product.isNew && !promo && (
                <span className="eyebrow bg-foreground px-3 py-1.5 text-background">
                  Nouveau
                </span>
              )}
            </div>
            {soldOut && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="eyebrow border border-foreground bg-background px-4 py-2">
                  Rupture de stock
                </span>
              </div>
            )}
          </div>
          {imgList.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-3">
              {imgList.map((img: string, i: number) => (
                <button
                  key={img + i}
                  onClick={() => setActiveImg(i)}
                  className={`relative aspect-[3/4] overflow-hidden border transition-colors ${
                    activeImg === i ? "border-foreground" : "border-transparent"
                  }`}
                >
                  <img src={img} alt="" className="h-full w-full object-cover object-[center_top]" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:sticky md:top-32 md:self-start">
          <p className="eyebrow">{category?.label}</p>
          <h1 className="mt-4 text-4xl md:text-5xl">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <p className="text-lg">{formatPrice(product.price)}</p>
            {promo && (
              <>
                <p className="text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice!)}
                </p>
                <span className="eyebrow bg-primary/10 px-2 py-1 text-primary">
                  −{discountPct(product)}%
                </span>
              </>
            )}
          </div>

          {!soldOut && product.stock <= 3 && (
            <p className="mt-3 text-sm" style={{ color: "#B67514" }}>
              Plus que {product.stock} en stock. Dernière chance.
            </p>
          )}
          {soldOut && (
            <p className="mt-3 text-sm text-destructive">
              Cette pièce est actuellement en rupture. Contactez-nous pour une pré-commande.
            </p>
          )}

          <p className="mt-8 text-base leading-relaxed text-foreground/85">
            {product.description}
          </p>

          {product.colors.length > 0 && (
            <div className="mt-10">
              <p className="eyebrow">Couleur : {color}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => setColor(c.name)}
                    title={c.name}
                    className={`h-10 w-10 rounded-full border-2 transition-all ${
                      color === c.name ? "border-foreground scale-110" : "border-border"
                    }`}
                    style={{ backgroundColor: c.hex }}
                    aria-label={`Couleur ${c.name}`}
                  />
                ))}
              </div>
            </div>
          )}

          {product.sizes.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">Taille</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`min-w-12 px-4 py-2 border text-sm transition-colors ${
                      size === s
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            <button
              onClick={handleAdd}
              disabled={soldOut}
              className="btn-luxe disabled:cursor-not-allowed disabled:opacity-40"
            >
              {soldOut ? "Indisponible" : added ? "✓ Ajouté au panier" : "Ajouter au panier"}
            </button>
            <button
              onClick={handleBuyNow}
              disabled={soldOut}
              className="btn-luxe-outline disabled:cursor-not-allowed disabled:opacity-40"
            >
              Acheter maintenant
            </button>
          </div>
          {notice && (
            <p className="mt-3 text-sm text-destructive">{notice}</p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            « Acheter maintenant » ajoute la pièce au panier puis vous mène au récapitulatif.
            Vous finalisez toute la commande sur WhatsApp avec notre assistant.
            {!customer && customerHydrated && (
              <> Un compte rapide (nom, prénom, téléphone) est requis avant d'ajouter au panier.</>
            )}
          </p>

          <CustomerRegisterModal
            open={showRegister}
            onClose={() => {
              setShowRegister(false);
              setPendingAction(null);
            }}
            onSuccess={() => {
              const action = pendingAction;
              setPendingAction(null);
              if (action) doAdd(action === "buy");
            }}
          />

          <div className="mt-12 border-t border-border pt-8">
            <p className="eyebrow">Matières & savoir-faire</p>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {product.materials}
            </p>
          </div>

          <div className="mt-8 border-t border-border pt-8">
            <p className="eyebrow">Caractéristiques de la pièce</p>
            <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">Référence</dt>
                <dd className="text-right">{product.slug}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">Catégorie</dt>
                <dd className="text-right">{category?.label ?? product.category}</dd>
              </div>
              {product.collection && (
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">Collection</dt>
                  <dd className="text-right">{product.collection}</dd>
                </div>
              )}
              {product.colors.length > 0 && (
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">Coloris</dt>
                  <dd className="text-right">{product.colors.map((c) => c.name).join(", ")}</dd>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">Tailles</dt>
                  <dd className="text-right">{product.sizes.join(" · ")}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="text-muted-foreground">Disponibilité</dt>
                <dd className="text-right">{soldOut ? "Rupture" : `${product.stock} en stock`}</dd>
              </div>
              {promo && (
                <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">Prix initial</dt>
                  <dd className="text-right line-through">{formatPrice(product.originalPrice!)}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24 md:mt-32">
          <p className="eyebrow">Vous aimerez aussi</p>
          <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p: Product) => (
              <Link
                key={p.slug}
                to="/produit/$slug"
                params={{ slug: p.slug }}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-full w-full object-cover object-[center_top] transition-transform duration-[1400ms] group-hover:scale-[1.04]"
                  />
                  {p.stock === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60">
                      <span className="eyebrow border border-foreground bg-background px-3 py-1.5">
                        Rupture
                      </span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-start justify-between gap-3">
                  <h3 className="text-lg">{p.name}</h3>
                  <p className="shrink-0 text-sm">{formatPrice(p.price)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
