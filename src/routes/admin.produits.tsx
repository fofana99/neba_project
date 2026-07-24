import {
  createFileRoute,
  Link,
  Outlet,
  useRouter,
  useRouterState,
} from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  categories,
  formatPrice,
  isOnSale,
  discountPct,
  daysUntilAutoUnpublish,
  type Product,
} from "@/lib/products";
import { checkAdminUnlocked } from "@/lib/admin-gate.functions";
import {
  adminListProducts,
  adminDeleteProduct,
  adminUpdateStock,
  adminTogglePublished,
} from "@/lib/admin-products.functions";
import { adminListCollections, type Collection } from "@/lib/admin-collections.functions";
import { LoginGate, AdminNav, StockBadge } from "./admin";
import { ConfirmDialog } from "@/components/confirm-dialog";


export const Route = createFileRoute("/admin/produits")({
  head: () => ({
    meta: [
      { title: "Produits | Admin Nēba" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async () => {
    const { unlocked } = await checkAdminUnlocked();
    if (!unlocked) return { unlocked: false as const };
    const [products, collections] = await Promise.all([
      adminListProducts(),
      adminListCollections(),
    ]);
    return { unlocked: true as const, products, collections };
  },
  component: ProduitsPage,
});

function ProduitsPage() {
  const data = Route.useLoaderData();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (!data.unlocked) return <LoginGate />;
  const isListPage = pathname === "/admin/produits" || pathname === "/admin/produits/";
  if (!isListPage) return <Outlet />;
  return <ProduitsList products={data.products} collections={data.collections} />;
}


function ProduitsList({ products, collections = [] }: { products: Product[]; collections?: Collection[] }) {
  const router = useRouter();
  const deleteFn = useServerFn(adminDeleteProduct);
  const stockFn = useServerFn(adminUpdateStock);
  const publishFn = useServerFn(adminTogglePublished);
  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [collectionFilter, setCollectionFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const q = search.trim().toLowerCase();
  const min = priceMin === "" ? NaN : Number(priceMin);
  const max = priceMax === "" ? NaN : Number(priceMax);
  const filtered = products.filter((p) => {
    if (filter !== "all" && p.category !== filter) return false;
    if (collectionFilter !== "all") {
      if (collectionFilter === "__none__") {
        if (p.collection) return false;
      } else if (p.collection !== collectionFilter) return false;
    }
    if (statusFilter === "published" && p.published === false) return false;
    if (statusFilter === "draft" && p.published !== false) return false;
    if (statusFilter === "promo" && !isOnSale(p)) return false;
    if (statusFilter === "new" && !p.isNew) return false;
    if (stockFilter === "out" && p.stock !== 0) return false;
    if (stockFilter === "low" && !(p.stock > 0 && p.stock <= 5)) return false;
    if (stockFilter === "in" && p.stock <= 5) return false;
    if (!Number.isNaN(min) && p.price < min) return false;
    if (!Number.isNaN(max) && p.price > max) return false;
    if (!q) return true;
    return (
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      (p.collection ?? "").toLowerCase().includes(q)
    );
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const activeFilterCount =
    (filter !== "all" ? 1 : 0) +
    (collectionFilter !== "all" ? 1 : 0) +
    (statusFilter !== "all" ? 1 : 0) +
    (stockFilter !== "all" ? 1 : 0) +
    (priceMin !== "" ? 1 : 0) +
    (priceMax !== "" ? 1 : 0);

  const resetFilters = () => {
    setFilter("all");
    setCollectionFilter("all");
    setStatusFilter("all");
    setStockFilter("all");
    setPriceMin("");
    setPriceMax("");
    setPage(1);
  };

  function handleDelete(p: Product) {
    setPendingDelete(p);
  }

  async function confirmDelete() {
    const p = pendingDelete;
    if (!p) return;
    setBusy(p.id);
    try {
      await deleteFn({ data: { id: p.id } });
      await router.invalidate();
      setPendingDelete(null);
    } finally {
      setBusy(null);
    }
  }

  async function handleStock(p: Product, delta: number) {
    const next = Math.max(0, p.stock + delta);
    if (next === p.stock) return;
    setBusy(p.id);
    try {
      await stockFn({ data: { id: p.id, stock: next } });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish(p: Product) {
    setBusy(p.id);
    try {
      await publishFn({ data: { id: p.id, published: !(p.published ?? true) } });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-10 md:py-14">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 text-4xl">Produits</h1>
      </div>
      <div className="mt-8">
        <AdminNav />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <FilterBtn active={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }}>
            Toutes ({products.length})
          </FilterBtn>
          {categories.map((c) => {
            const n =
              c.slug === "signature"
                ? new Set(
                    products
                      .map((p) => (p.collection ?? "").trim())
                      .filter((v) => v !== ""),
                  ).size
                : products.filter((p) => p.category === c.slug).length;
            return (
              <FilterBtn
                key={c.slug}
                active={filter === c.slug}
                onClick={() => { setFilter(c.slug); setPage(1); }}
              >
                {c.label} ({n})
              </FilterBtn>
            );
          })}
        </div>
        <Link to="/admin/produits/$id" params={{ id: "nouveau" }} className="btn-luxe">
          + Nouvelle pièce
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher une pièce (nom, slug, collection)…"
          className="w-full max-w-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <p className="text-xs text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-4 grid gap-3 border border-border bg-muted/30 p-4 md:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-xs">Collection</span>
          <select
            value={collectionFilter}
            onChange={(e) => { setCollectionFilter(e.target.value); setPage(1); }}
            className="border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Toutes</option>
            <option value="__none__">Sans collection</option>
            {collections.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-xs">Statut</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            <option value="published">Publié</option>
            <option value="draft">Brouillon</option>
            <option value="promo">En promo</option>
            <option value="new">Nouveau</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-xs">Stock</span>
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value); setPage(1); }}
            className="border border-border bg-background px-2 py-1.5 text-sm"
          >
            <option value="all">Tous</option>
            <option value="in">Disponible (&gt; 5)</option>
            <option value="low">Faible (1–5)</option>
            <option value="out">Rupture (0)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-xs">Prix min (F CFA)</span>
          <input
            type="number"
            min={0}
            value={priceMin}
            onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
            placeholder="0"
            className="border border-border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="eyebrow text-xs">Prix max (F CFA)</span>
          <input
            type="number"
            min={0}
            value={priceMax}
            onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
            placeholder="∞"
            className="border border-border bg-background px-2 py-1.5 text-sm"
          />
        </label>
        {activeFilterCount > 0 && (
          <button
            onClick={resetFilters}
            className="eyebrow border border-border bg-background px-3 py-1.5 hover:border-foreground lg:col-span-5 lg:justify-self-end"
          >
            Réinitialiser les filtres ({activeFilterCount})
          </button>
        )}
      </div>


      <div className="mt-4 overflow-x-auto border border-border">
        <table className="w-full min-w-[1100px] text-left text-sm">
          <thead className="bg-muted/60">
            <tr className="eyebrow">
              <th className="p-3">Pièce</th>
              <th className="p-3">Catégorie</th>
              <th className="p-3">Collection</th>
              <th className="p-3">Prix</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Statut</th>
              <th className="p-3 text-right">Actions</th>
            </tr>

          </thead>
          <tbody>
            {pageItems.map((p) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={p.image}
                      alt=""
                      className="h-16 w-12 object-cover object-[center_top]"
                    />
                    <div>
                      <Link
                        to="/admin/produits/$id"
                        params={{ id: p.id }}
                        className="hover:underline"
                      >
                        {p.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-muted-foreground">{p.slug}</p>
                    </div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">
                  {categories.find((c) => c.slug === p.category)?.label ?? p.category}
                </td>
                <td className="p-3 text-muted-foreground">
                  {p.collection ? (
                    <span>{collections.find((c) => c.name === p.collection)?.name ?? p.collection}</span>
                  ) : (
                    <span className="text-xs italic opacity-60">—</span>
                  )}
                </td>

                <td className="p-3">
                  {isOnSale(p) ? (
                    <div className="flex flex-col">
                      <span>{formatPrice(p.price)}</span>
                      <span className="text-xs text-muted-foreground line-through">
                        {formatPrice(p.originalPrice!)}
                      </span>
                    </div>
                  ) : (
                    formatPrice(p.price)
                  )}
                </td>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStock(p, -1)}
                      disabled={busy === p.id || p.stock === 0}
                      className="h-7 w-7 border border-border hover:border-foreground disabled:opacity-30"
                      aria-label="−1"
                    >
                      −
                    </button>
                    <StockBadge stock={p.stock} />
                    <button
                      onClick={() => handleStock(p, +1)}
                      disabled={busy === p.id}
                      className="h-7 w-7 border border-border hover:border-foreground disabled:opacity-30"
                      aria-label="+1"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {isOnSale(p) && (
                      <span className="eyebrow bg-primary/10 text-primary px-2 py-0.5">
                        −{discountPct(p)}%
                      </span>
                    )}
                    {p.isNew && (
                      <span className="eyebrow border border-border px-2 py-0.5">Nouveau</span>
                    )}
                    {p.published === false ? (
                      <span className="eyebrow text-muted-foreground">Brouillon</span>
                    ) : (
                      <span className="eyebrow text-primary">Publié</span>
                    )}
                  </div>
                  {p.published !== false && daysUntilAutoUnpublish(p) !== null && (
                    <p className="mt-1.5 text-xs text-destructive">
                      Dépubliée auto. dans {daysUntilAutoUnpublish(p)} j
                    </p>
                  )}
                </td>
                <td className="p-3 text-right">
                  <div className="inline-flex gap-2">
                    <Link
                      to="/admin/produits/$id"
                      params={{ id: p.id }}
                      className="eyebrow border border-border px-3 py-1.5 hover:border-foreground"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => handlePublish(p)}
                      disabled={busy === p.id}
                      className="eyebrow border border-border px-3 py-1.5 hover:border-foreground disabled:opacity-30"
                    >
                      {p.published === false ? "Publier" : "Dépublier"}
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      disabled={busy === p.id}
                      className="eyebrow border border-destructive/40 px-3 py-1.5 text-destructive hover:bg-destructive/5 disabled:opacity-30"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-muted-foreground">
                  Aucune pièce ne correspond.
                </td>
              </tr>
            )}

          </tbody>
        </table>
      </div>

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={pageSize}
        onPage={setPage}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Supprimer « ${pendingDelete?.name} » ?`}
        description="Cette action est définitive et ne peut pas être annulée."
        confirmLabel="Supprimer"
        busy={pendingDelete !== null && busy === pendingDelete.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  if (total === 0) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted-foreground">
        {from}–{to} sur {total}
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="eyebrow border border-border px-3 py-1.5 hover:border-foreground disabled:opacity-30"
        >
          ← Précédent
        </button>
        <span className="text-xs text-muted-foreground">
          Page {page} / {totalPages}
        </span>
        <button
          onClick={() => onPage(page + 1)}
          disabled={page >= totalPages}
          className="eyebrow border border-border px-3 py-1.5 hover:border-foreground disabled:opacity-30"
        >
          Suivant →
        </button>
      </div>
    </div>
  );
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`eyebrow border px-3 py-2 transition-colors ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "border-border hover:border-foreground"
      }`}
    >
      {children}
    </button>
  );
}
