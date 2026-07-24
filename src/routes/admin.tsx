import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { categories, formatPrice, isOnSale, discountPct, type Product } from "@/lib/products";
import { checkAdminUnlocked, unlockAdmin, lockAdmin } from "@/lib/admin-gate.functions";
import { adminListProducts } from "@/lib/admin-products.functions";
import { adminListCustomers } from "@/lib/customer.functions";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administration | Nēba" },
      { name: "description", content: "Espace privé Nēba" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async () => {
    const { unlocked } = await checkAdminUnlocked();
    if (!unlocked)
      return { unlocked: false as const, products: [] as Product[], customerCount: 0 };
    const [products, customers] = await Promise.all([
      adminListProducts(),
      adminListCustomers(),
    ]);
    return { unlocked: true as const, products, customerCount: customers.length };
  },
  component: AdminPage,
});

function AdminPage() {
  const data = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!data.unlocked) return <LoginGate />;
  const isRoot = pathname === "/admin" || pathname === "/admin/";
  if (!isRoot) return <Outlet />;
  return <Dashboard products={data.products} customerCount={data.customerCount} />;
}

export function LoginGate() {
  const router = useRouter();
  const unlock = useServerFn(unlockAdmin);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const password = new FormData(e.currentTarget).get("password") as string;
    try {
      const res = await unlock({ data: { password } });
      if (res.ok) await router.invalidate();
      else
        setError(
          res.reason === "not_configured"
            ? "Configuration serveur manquante."
            : "Mot de passe incorrect.",
        );
    } catch {
      setError("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center px-6 py-20">
      <div className="w-full">
        <p className="eyebrow">Espace privé</p>
        <h1 className="mt-4 text-4xl">Administration Nēba</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Cette zone est réservée à l'équipe Nēba.
        </p>
        <form onSubmit={onSubmit} className="mt-10 space-y-4">
          <label className="block">
            <span className="eyebrow">Mot de passe</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              autoFocus
              className="mt-2 w-full border border-border bg-background px-4 py-3 text-sm outline-none focus:border-foreground"
            />
          </label>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button disabled={loading} className="btn-luxe w-full">
            {loading ? "Vérification…" : "Entrer"}
          </button>
        </form>
        <div className="mt-8">
          <Link to="/" className="eyebrow text-muted-foreground hover:text-foreground">
            ← Retour à l'accueil
          </Link>
        </div>
      </div>
    </div>
  );
}

export function AdminNav() {
  const router = useRouter();
  const lock = useServerFn(lockAdmin);
  async function handleLogout() {
    await lock();
    router.navigate({ to: "/" });
  }
  return (
    <div className="mb-8 flex flex-wrap items-center gap-2 border-b border-border pb-4">
      <Link
        to="/admin"
        activeOptions={{ exact: true }}
        activeProps={{ className: "eyebrow bg-foreground text-background px-3 py-2" }}
        className="eyebrow border border-border px-3 py-2 hover:border-foreground"
      >
        Tableau de bord
      </Link>
      <Link
        to="/admin/produits"
        activeProps={{ className: "eyebrow bg-foreground text-background px-3 py-2" }}
        className="eyebrow border border-border px-3 py-2 hover:border-foreground"
      >
        Produits
      </Link>
      <Link
        to="/admin/collections"
        activeProps={{ className: "eyebrow bg-foreground text-background px-3 py-2" }}
        className="eyebrow border border-border px-3 py-2 hover:border-foreground"
      >
        Collections
      </Link>
      <Link
        to="/admin/clients"
        activeProps={{ className: "eyebrow bg-foreground text-background px-3 py-2" }}
        className="eyebrow border border-border px-3 py-2 hover:border-foreground"
      >
        Clients
      </Link>

      <div className="ml-auto flex gap-2">
        <Link to="/boutique" className="btn-luxe-outline">Voir la boutique</Link>
        <button onClick={handleLogout} className="btn-luxe-outline">Déconnexion</button>
      </div>
    </div>
  );
}

function Dashboard({ products, customerCount }: { products: Product[]; customerCount: number }) {
  const stockLow = products.filter((p) => p.stock > 0 && p.stock <= 3).length;
  const rupture = products.filter((p) => p.stock === 0).length;
  const promo = products.filter(isOnSale).length;
  const unpublished = products.filter((p) => p.published === false).length;
  const totalValue = products.reduce((n, p) => n + p.stock * p.price, 0);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const q = search.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          (p.collection ?? "").toLowerCase().includes(q),
      )
    : products;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div>
        <p className="eyebrow">Tableau de bord</p>
        <h1 className="mt-3 text-4xl md:text-5xl">Administration</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Pilotez le catalogue, les stocks et les promotions Nēba.
        </p>
      </div>
      <div className="mt-8">
        <AdminNav />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <KPI label="Pièces" value={products.length} />
        <KPI label="Catégories" value={categories.length} />
        <KPI label="Clients" value={customerCount} />
        <KPI label="En rupture" value={rupture} tone="danger" />
        <KPI label="Stock faible" value={stockLow} tone="warn" />
        <KPI label="En promo" value={promo} tone="promo" />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="border border-border p-6">
          <p className="eyebrow">Valeur du stock (prix de vente)</p>
          <p
            className="mt-3 text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {formatPrice(totalValue)}
          </p>
        </div>
        <div className="border border-border p-6">
          <p className="eyebrow">Pièces non publiées</p>
          <p
            className="mt-3 text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {unpublished}
          </p>
        </div>
      </div>

      {/* Catégories */}
      <section className="mt-14">
        <h2 className="text-2xl">Catégories</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => {
            const count = products.filter((p) => p.category === c.slug).length;
            return (
              <div key={c.slug} className="border border-border">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={c.image}
                    alt={c.label}
                    className="h-full w-full object-cover object-[center_top]"
                  />
                </div>
                <div className="p-4">
                  <p className="eyebrow">{c.label}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{count} pièces</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-2xl">Catalogue</h2>
          <Link to="/admin/produits" className="btn-luxe-outline">Gérer les produits</Link>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <input
            type="search"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Rechercher une pièce…"
            className="w-full max-w-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
          />
          <p className="text-xs text-muted-foreground">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </p>
        </div>

        <div className="mt-4 overflow-x-auto border border-border">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-muted/60">
              <tr className="eyebrow">
                <th className="p-4">Pièce</th>
                <th className="p-4">Catégorie</th>
                <th className="p-4">Prix</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Statut</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((p) => (
                <tr key={p.id} className="border-t border-border">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={p.image}
                        alt=""
                        className="h-14 w-11 object-cover object-[center_top]"
                      />
                      <Link
                        to="/admin/produits/$id"
                        params={{ id: p.id }}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {categories.find((c) => c.slug === p.category)?.label ?? p.category}
                  </td>
                  <td className="p-4">
                    {isOnSale(p) ? (
                      <span>
                        <span className="text-muted-foreground line-through mr-2">
                          {formatPrice(p.originalPrice!)}
                        </span>
                        {formatPrice(p.price)}
                      </span>
                    ) : (
                      formatPrice(p.price)
                    )}
                  </td>
                  <td className="p-4">
                    <StockBadge stock={p.stock} />
                  </td>
                  <td className="p-4">
                    <div className="flex flex-wrap gap-2">
                      {isOnSale(p) && (
                        <span className="eyebrow bg-primary/10 text-primary px-2 py-1">
                          −{discountPct(p)}%
                        </span>
                      )}
                      {p.isNew && (
                        <span className="eyebrow border border-border px-2 py-1">Nouveau</span>
                      )}
                      {p.published === false && (
                        <span className="eyebrow text-muted-foreground">Brouillon</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Aucune pièce ne correspond.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filtered.length)} sur {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                className="eyebrow border border-border px-3 py-1.5 hover:border-foreground disabled:opacity-30"
              >
                ← Précédent
              </button>
              <span className="text-xs text-muted-foreground">
                Page {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="eyebrow border border-border px-3 py-1.5 hover:border-foreground disabled:opacity-30"
              >
                Suivant →
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function KPI({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger" | "warn" | "promo";
}) {
  return (
    <div className="border border-border p-6">
      <p className="eyebrow">{label}</p>
      <p
        className="mt-3 text-4xl"
        style={{
          fontFamily: "var(--font-display)",
          color:
            tone === "danger"
              ? "hsl(var(--destructive))"
              : tone === "promo"
              ? "var(--color-primary, #687751)"
              : tone === "warn"
              ? "#B67514"
              : undefined,
        }}
      >
        {value}
      </p>
    </div>
  );
}

export function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span className="eyebrow text-destructive">Rupture</span>;
  if (stock <= 3)
    return (
      <span className="eyebrow" style={{ color: "#B67514" }}>
        {stock} restants
      </span>
    );
  return <span className="text-muted-foreground">{stock}</span>;
}
