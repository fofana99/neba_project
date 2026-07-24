import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { categories, SIZE_OPTIONS, type ProductColor } from "@/lib/products";
import { checkAdminUnlocked } from "@/lib/admin-gate.functions";
import {
  adminGetProduct,
  adminCreateProduct,
  adminUpdateProduct,
  adminDeleteProduct,
} from "@/lib/admin-products.functions";
import {
  adminListCollections,
  type Collection,
} from "@/lib/admin-collections.functions";
import { adminUploadImage } from "@/lib/admin-uploads.functions";
import { LoginGate, AdminNav } from "./admin";
import { ConfirmDialog } from "@/components/confirm-dialog";


type FormState = {
  slug: string;
  name: string;
  category_slug: string;
  collection: string;
  price: string;
  original_price: string;
  image: string;
  images: string[];
  colors: ProductColor[];
  sizes: string[];
  materials: string;
  description: string;
  stock: string;
  is_new: boolean;
  published: boolean;
  sort_order: string;
};

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || `piece-${Date.now()}`;
}

const EMPTY: FormState = {
  slug: "",
  name: "",
  category_slug: categories[0]?.slug ?? "homme",
  collection: "",
  price: "0",
  original_price: "",
  image: "",
  images: [],
  colors: [],
  sizes: [],
  materials: "",
  description: "",
  stock: "0",
  is_new: false,
  published: true,
  sort_order: "0",
};

export const Route = createFileRoute("/admin/produits/$id")({
  head: () => ({
    meta: [
      { title: "Édition produit | Admin Nēba" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async ({ params }) => {
    const { unlocked } = await checkAdminUnlocked();
    if (!unlocked) return { unlocked: false as const };
    const collections = await adminListCollections();
    if (params.id === "nouveau")
      return { unlocked: true as const, mode: "create" as const, product: null, collections };
    const product = await adminGetProduct({ data: { id: params.id } });
    return { unlocked: true as const, mode: "edit" as const, product, collections };
  },
  component: ProductEditPage,
});


function ProductEditPage() {
  const data = Route.useLoaderData();
  if (!data.unlocked) return <LoginGate />;
  if (data.mode === "edit" && !data.product) {
    return (
      <div className="mx-auto max-w-xl px-6 py-24 text-center">
        <p className="eyebrow">Introuvable</p>
        <h1 className="mt-4 text-3xl">Cette pièce n'existe plus.</h1>
        <div className="mt-8">
          <Link to="/admin/produits" className="btn-luxe">Retour à la liste</Link>
        </div>
      </div>
    );
  }
  return <ProductForm mode={data.mode} product={data.product} collections={data.collections} />;
}


type ProductLike = {
  id: string;
  slug: string;
  name: string;
  category: string;
  collection?: string;
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
};

function toInitial(p: ProductLike): FormState {
  return {
    slug: p.slug,
    name: p.name,
    category_slug: p.category,
    collection: p.collection ?? "",
    price: String(p.price),
    original_price: p.originalPrice == null ? "" : String(p.originalPrice),
    image: p.image,
    images: p.images ?? [],
    colors: p.colors ?? [],
    sizes: p.sizes ?? [],
    materials: p.materials,
    description: p.description,
    stock: String(p.stock),
    is_new: !!p.isNew,
    published: p.published !== false,
    sort_order: "0",
  };
}

function ProductForm({
  mode,
  product,
  collections,
}: {
  mode: "create" | "edit";
  product: ProductLike | null;
  collections: Collection[];
}) {

  const router = useRouter();
  const createFn = useServerFn(adminCreateProduct);
  const updateFn = useServerFn(adminUpdateProduct);
  const deleteFn = useServerFn(adminDeleteProduct);
  const uploadFn = useServerFn(adminUploadImage);

  const [state, setState] = useState<FormState>(product ? toInitial(product) : EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<null | "main" | "gallery">(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const mainInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);

  function set<K extends keyof FormState>(k: K, v: FormState[K]) {
    setState((s) => ({ ...s, [k]: v }));
  }

  async function fileToBase64(file: File): Promise<string> {
    const buf = await file.arrayBuffer();
    // browser-safe base64
    let binary = "";
    const bytes = new Uint8Array(buf);
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  async function uploadOne(file: File): Promise<string> {
    if (file.size > 8 * 1024 * 1024) throw new Error(`${file.name} dépasse 8 Mo.`);
    const dataBase64 = await fileToBase64(file);
    const { url } = await uploadFn({
      data: {
        filename: file.name,
        contentType: file.type || "image/jpeg",
        dataBase64,
      },
    });
    return url;
  }

  async function onPickMain(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setUploading("main");
    try {
      const url = await uploadOne(file);
      set("image", url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(null);
    }
  }

  async function onPickGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;
    setError(null);
    setUploading("gallery");
    try {
      const urls: string[] = [];
      for (const f of files) urls.push(await uploadOne(f));
      setState((s) => ({ ...s, images: [...s.images, ...urls] }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'upload");
    } finally {
      setUploading(null);
    }
  }

  function removeGallery(idx: number) {
    setState((s) => ({ ...s, images: s.images.filter((_, i) => i !== idx) }));
  }

  function addColor() {
    setState((s) => ({ ...s, colors: [...s.colors, { name: "", hex: "#687751" }] }));
  }
  function updateColor(idx: number, patch: Partial<ProductColor>) {
    setState((s) => ({
      ...s,
      colors: s.colors.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    }));
  }
  function removeColor(idx: number) {
    setState((s) => ({ ...s, colors: s.colors.filter((_, i) => i !== idx) }));
  }

  function toggleSize(size: string) {
    setState((s) => ({
      ...s,
      sizes: s.sizes.includes(size)
        ? s.sizes.filter((x) => x !== size)
        : [...s.sizes, size],
    }));
  }

  function parsePayload() {
    const colors = state.colors
      .map((c) => ({ name: c.name.trim(), hex: c.hex.trim() }))
      .filter((c) => c.name && /^#[0-9a-fA-F]{3,8}$/.test(c.hex));
    const images = state.images.map((s) => s.trim()).filter(Boolean);
    const mainImage = state.image.trim() || images[0] || "";

    return {
      slug: state.slug.trim() || slugify(state.name),

      name: state.name.trim(),
      category_slug: state.category_slug,
      collection: state.collection.trim(),
      price: Number(state.price) || 0,
      original_price: state.original_price.trim() ? Number(state.original_price) : null,
      image: mainImage,
      images: images.length > 0 ? images : mainImage ? [mainImage] : [],
      colors,
      sizes: state.sizes,
      materials: state.materials,
      description: state.description,
      stock: Number(state.stock) || 0,
      is_new: state.is_new,
      published: state.published,
      sort_order: Number(state.sort_order) || 0,
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const payload = parsePayload();
      if (payload.original_price != null && payload.original_price <= payload.price) {
        throw new Error(
          "Le prix barré doit être strictement supérieur au prix de vente, sinon laissez ce champ vide.",
        );
      }
      if (mode === "create") {
        await createFn({ data: payload });
      } else {
        await updateFn({ data: { id: product!.id, ...payload } });
      }
      await router.invalidate();
      router.navigate({ to: "/admin/produits" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur inconnue");
    } finally {
      setBusy(false);
    }
  }


  function onDelete() {
    if (!product) return;
    setConfirmingDelete(true);
  }

  async function confirmDelete() {
    if (!product) return;
    setBusy(true);
    try {
      await deleteFn({ data: { id: product.id } });
      await router.invalidate();
      router.navigate({ to: "/admin/produits" });
    } finally {
      setBusy(false);
      setConfirmingDelete(false);
    }
  }

  const priceNum = Number(state.price) || 0;
  const originalPriceNum = state.original_price.trim() ? Number(state.original_price) : null;
  const promoInvalid = originalPriceNum != null && originalPriceNum <= priceNum;

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-14">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 text-4xl">
          {mode === "create" ? "Nouvelle pièce" : product?.name}
        </h1>
      </div>
      <div className="mt-8">
        <AdminNav />
      </div>

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Field label="Nom">
            <input
              value={state.name}
              onChange={(e) => set("name", e.target.value)}
              required
              className="input-luxe"
            />
          </Field>
          <Field label="Catégorie">
            <select
              value={state.category_slug}
              onChange={(e) => set("category_slug", e.target.value)}
              className="input-luxe"
            >
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>


          <Field label="Collection (Signature)" hint="Sélectionnez une collection existante ou créez-en depuis Admin › Collections.">
            <select
              value={state.collection}
              onChange={(e) => set("collection", e.target.value)}
              className="input-luxe"
            >
              <option value="">— Aucune —</option>
              {collections.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
              {state.collection &&
                !collections.some((c) => c.name === state.collection) && (
                  <option value={state.collection}>
                    {state.collection} (non listée)
                  </option>
                )}
            </select>
            <p className="mt-2 text-xs text-muted-foreground">
              Besoin d'une nouvelle collection ?{" "}
              <Link to="/admin/collections" className="underline">
                Gérer les collections
              </Link>
            </p>
          </Field>


          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Prix de vente (F CFA)" hint="Le prix affiché et facturé aujourd'hui.">
              <input
                type="number"
                min={0}
                value={state.price}
                onChange={(e) => set("price", e.target.value)}
                required
                className="input-luxe"
              />
            </Field>
            <Field
              label="Prix barré (avant réduction, optionnel)"
              hint="Doit être strictement supérieur au prix de vente."
            >
              <input
                type="number"
                min={priceNum + 1}
                value={state.original_price}
                onChange={(e) => set("original_price", e.target.value)}
                placeholder=""
                className={`input-luxe ${promoInvalid ? "border-destructive" : ""}`}
              />
              {promoInvalid && (
                <p className="mt-1.5 text-xs text-destructive">
                  Le prix barré doit être supérieur au prix de vente ({priceNum.toLocaleString("fr-FR")} F CFA), sinon laissez ce champ vide.
                </p>
              )}
            </Field>
            <Field label="Stock">
              <input
                type="number"
                min={0}
                value={state.stock}
                onChange={(e) => set("stock", e.target.value)}
                required
                className="input-luxe"
              />
            </Field>
          </div>

          <Field label="Image principale" hint="Format recommandé : portrait, JPG/PNG/WebP, moins de 8 Mo.">
            <div className="flex items-start gap-4">
              <div className="h-28 w-24 shrink-0 overflow-hidden border border-border bg-muted">
                {state.image ? (
                  <img src={state.image} alt="" className="h-full w-full object-cover object-[center_top]" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-widest text-muted-foreground">
                    Aucune
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={mainInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onPickMain}
                  className="hidden"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => mainInputRef.current?.click()}
                    disabled={uploading !== null}
                    className="btn-luxe-outline"
                  >
                    {uploading === "main" ? "Téléversement…" : state.image ? "Remplacer" : "Téléverser une image"}
                  </button>
                  {state.image && (
                    <button
                      type="button"
                      onClick={() => set("image", "")}
                      className="eyebrow border border-border px-4 py-3 hover:bg-muted"
                    >
                      Retirer
                    </button>
                  )}
                </div>
              </div>
            </div>
          </Field>

          <Field label="Galerie" hint="Ajoutez plusieurs vues (dos, détail, porté).">
            <div className="space-y-3">
              {state.images.length > 0 && (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {state.images.map((url, i) => (
                    <div key={`${url}-${i}`} className="group relative aspect-[3/4] overflow-hidden border border-border bg-muted">
                      <img src={url} alt="" className="h-full w-full object-cover object-[center_top]" />
                      <button
                        type="button"
                        onClick={() => removeGallery(i)}
                        className="absolute right-1 top-1 rounded-full bg-background/90 px-2 py-1 text-[10px] uppercase tracking-widest opacity-0 transition group-hover:opacity-100"
                      >
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={onPickGallery}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                disabled={uploading !== null}
                className="btn-luxe-outline"
              >
                {uploading === "gallery" ? "Téléversement…" : "Ajouter des images"}
              </button>
            </div>
          </Field>

          <Field label="Couleurs" hint="Sélectionnez la teinte dans la palette et nommez-la (ex. Reseda).">
            <div className="space-y-2">
              {state.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-3">
                  <input
                    type="color"
                    value={/^#[0-9a-fA-F]{6}$/.test(c.hex) ? c.hex : "#687751"}
                    onChange={(e) => updateColor(i, { hex: e.target.value })}
                    className="h-10 w-14 cursor-pointer border border-border bg-transparent p-1"
                    aria-label="Choisir la couleur"
                  />
                  <input
                    value={c.name}
                    onChange={(e) => updateColor(i, { name: e.target.value })}
                    placeholder="Nom (ex. Safran)"
                    className="input-luxe flex-1"
                  />
                  <span className="font-mono text-xs text-muted-foreground">{c.hex}</span>
                  <button
                    type="button"
                    onClick={() => removeColor(i)}
                    className="eyebrow px-3 py-2 text-destructive hover:bg-destructive/5"
                  >
                    Retirer
                  </button>
                </div>
              ))}
              <button type="button" onClick={addColor} className="btn-luxe-outline">
                + Ajouter une couleur
              </button>
            </div>
          </Field>


          <Field label="Tailles" hint="Cochez toutes les tailles disponibles pour cette pièce.">
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS.map((sz) => {
                const checked = state.sizes.includes(sz);
                return (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => toggleSize(sz)}
                    aria-pressed={checked}
                    className={`min-w-12 px-4 py-2 border text-sm transition-colors ${
                      checked
                        ? "border-foreground bg-foreground text-background"
                        : "border-border hover:border-foreground"
                    }`}
                  >
                    {sz}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Description">
            <textarea
              value={state.description}
              onChange={(e) => set("description", e.target.value)}
              rows={4}
              className="input-luxe"
            />
          </Field>

          <Field label="Matières & savoir-faire">
            <textarea
              value={state.materials}
              onChange={(e) => set("materials", e.target.value)}
              rows={3}
              className="input-luxe"
            />
          </Field>
        </div>

        <aside className="h-fit space-y-6 border border-border p-6 lg:sticky lg:top-24">
          {state.image && (
            <div className="aspect-[3/4] overflow-hidden bg-muted">
              <img
                src={state.image}
                alt=""
                className="h-full w-full object-cover object-[center_top]"
              />
            </div>
          )}
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={state.published}
              onChange={(e) => set("published", e.target.checked)}
            />
            <span>Publié (visible dans la boutique)</span>
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={state.is_new}
              onChange={(e) => set("is_new", e.target.checked)}
            />
            <span>Marquer « Nouveau »</span>
          </label>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex flex-col gap-2">
            <button type="submit" disabled={busy || promoInvalid} className="btn-luxe disabled:cursor-not-allowed disabled:opacity-40">
              {busy ? "Enregistrement…" : mode === "create" ? "Créer la pièce" : "Enregistrer"}
            </button>
            <Link to="/admin/produits" className="btn-luxe-outline text-center">
              Annuler
            </Link>
            {mode === "edit" && (
              <button
                type="button"
                onClick={onDelete}
                disabled={busy}
                className="eyebrow border border-destructive/40 px-4 py-3 text-destructive hover:bg-destructive/5 disabled:opacity-30"
              >
                Supprimer la pièce
              </button>
            )}
          </div>
        </aside>
      </form>

      {product && (
        <ConfirmDialog
          open={confirmingDelete}
          title={`Supprimer « ${product.name} » ?`}
          description="Cette action est définitive et ne peut pas être annulée."
          confirmLabel="Supprimer"
          busy={busy}
          onConfirm={confirmDelete}
          onCancel={() => setConfirmingDelete(false)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="eyebrow">{label}</span>
      {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}
