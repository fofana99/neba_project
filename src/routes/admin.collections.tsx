import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { checkAdminUnlocked } from "@/lib/admin-gate.functions";
import {
  adminListCollections,
  adminCreateCollection,
  adminUpdateCollection,
  adminDeleteCollection,
  type Collection,
} from "@/lib/admin-collections.functions";
import { adminListProducts } from "@/lib/admin-products.functions";
import { LoginGate, AdminNav } from "./admin";
import { ConfirmDialog } from "@/components/confirm-dialog";

export const Route = createFileRoute("/admin/collections")({
  head: () => ({
    meta: [
      { title: "Collections | Admin Nēba" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async () => {
    const { unlocked } = await checkAdminUnlocked();
    if (!unlocked) return { unlocked: false as const };
    const [collections, products] = await Promise.all([
      adminListCollections(),
      adminListProducts(),
    ]);
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.collection) counts[p.collection] = (counts[p.collection] ?? 0) + 1;
    }
    return { unlocked: true as const, collections, counts };
  },
  component: CollectionsPage,
});

function CollectionsPage() {
  const data = Route.useLoaderData();
  if (!data.unlocked) return <LoginGate />;
  return <CollectionsList collections={data.collections} counts={data.counts} />;
}

function CollectionsList({ collections, counts }: { collections: Collection[]; counts: Record<string, number> }) {
  const router = useRouter();
  const createFn = useServerFn(adminCreateCollection);
  const updateFn = useServerFn(adminUpdateCollection);
  const deleteFn = useServerFn(adminDeleteCollection);

  const [busy, setBusy] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Collection | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? collections.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.slug.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      )
    : collections;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setBusy("new");
    try {
      await createFn({
        data: { name: name.trim(), description: description.trim(), sort_order: 0 },
      });
      setName("");
      setDescription("");
      await router.invalidate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setBusy(null);
    }
  }

  async function handleUpdate(c: Collection, patch: Partial<Collection>) {
    setBusy(c.id);
    try {
      await updateFn({
        data: {
          id: c.id,
          name: patch.name ?? c.name,
          description: patch.description ?? c.description,
          sort_order: patch.sortOrder ?? c.sortOrder,
        },
      });
      await router.invalidate();
    } finally {
      setBusy(null);
    }
  }

  function handleDelete(c: Collection) {
    setPendingDelete(c);
  }

  async function confirmDelete() {
    const c = pendingDelete;
    if (!c) return;
    setBusy(c.id);
    try {
      await deleteFn({ data: { id: c.id } });
      await router.invalidate();
      setPendingDelete(null);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-14">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 text-4xl">Collections signature</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Créez les collections ici, puis attribuez-les à chaque pièce depuis
          l'éditeur produit. Chaque collection apparaîtra dans le filtre Signature de la boutique.
        </p>
      </div>
      <div className="mt-8">
        <AdminNav />
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 border border-border p-5 md:grid-cols-[1fr_2fr_auto]">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nom de la collection (ex. Reseda)"
          required
          className="input-luxe"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description courte (optionnel)"
          className="input-luxe"
        />
        <button disabled={busy === "new"} className="btn-luxe">
          {busy === "new" ? "Création…" : "+ Créer"}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher une collection…"
          className="w-full max-w-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-foreground"
        />
        <p className="text-xs text-muted-foreground">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="mt-4 overflow-x-auto border border-border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-muted/60">
            <tr className="eyebrow">
              <th className="p-3">Nom</th>
              <th className="p-3">Slug</th>
              <th className="p-3">Description</th>
              <th className="p-3 w-20 text-center">Pièces</th>
              <th className="p-3 w-24">Ordre</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <EditableRow
                key={c.id}
                c={c}
                count={counts[c.name] ?? 0}
                busy={busy === c.id}
                onSave={(patch) => handleUpdate(c, patch)}
                onDelete={() => handleDelete(c)}
              />
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  Aucune collection.
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

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Supprimer la collection « ${pendingDelete?.name} » ?`}
        description="Les pièces qui l'utilisent resteront mais perdront ce regroupement."
        confirmLabel="Supprimer"
        busy={pendingDelete !== null && busy === pendingDelete.id}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

function EditableRow({
  c,
  count,
  busy,
  onSave,
  onDelete,
}: {
  c: Collection;
  count: number;
  busy: boolean;
  onSave: (patch: Partial<Collection>) => void;
  onDelete: () => void;
}) {
  const [name, setName] = useState(c.name);
  const [description, setDescription] = useState(c.description);
  const [sortOrder, setSortOrder] = useState(c.sortOrder);
  const dirty =
    name !== c.name || description !== c.description || sortOrder !== c.sortOrder;

  return (
    <tr className="border-t border-border">
      <td className="p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border bg-background px-2 py-1"
        />
      </td>
      <td className="p-3 font-mono text-xs text-muted-foreground">{c.slug}</td>
      <td className="p-3">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border border-border bg-background px-2 py-1"
        />
      </td>
      <td className="p-3 text-center">
        <span className={`eyebrow inline-block min-w-[2rem] border px-2 py-0.5 ${count > 0 ? "border-primary/40 text-primary" : "border-border text-muted-foreground"}`}>
          {count}
        </span>
      </td>
      <td className="p-3">
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
          className="w-20 border border-border bg-background px-2 py-1"
        />
      </td>
      <td className="p-3 text-right">
        <div className="inline-flex gap-2">
          <button
            disabled={!dirty || busy}
            onClick={() => onSave({ name, description, sortOrder })}
            className="eyebrow border border-border px-3 py-1.5 hover:border-foreground disabled:opacity-30"
          >
            Enregistrer
          </button>
          <button
            disabled={busy}
            onClick={onDelete}
            className="eyebrow border border-destructive/40 px-3 py-1.5 text-destructive hover:bg-destructive/5 disabled:opacity-30"
          >
            Supprimer
          </button>
        </div>
      </td>
    </tr>
  );
}
