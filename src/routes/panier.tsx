import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { useCustomer } from "@/lib/customer";
import { formatPrice } from "@/lib/products";

export const Route = createFileRoute("/panier")({
  head: () => ({
    meta: [
      { title: "Panier | Nēba" },
      { name: "description", content: "Votre sélection Nēba." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, setQty, remove, clear, count, hasStockIssue } = useCart();
  const { customer, logout } = useCustomer();
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);

  if (count === 0) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-32 text-center">
        <p className="eyebrow">Votre panier</p>
        <h1 className="mt-4 text-5xl">Il est encore vide</h1>
        <p className="mt-6 text-muted-foreground">
          Découvrez la collection Automne-Hiver 2026.
        </p>
        <div className="mt-10">
          <Link to="/boutique" className="btn-luxe">Explorer la boutique</Link>
        </div>
      </div>
    );
  }

  const totalItems = items.reduce((n, i) => n + i.qty, 0);

  const siteOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  const customerBlock = customer
    ? `Client : ${customer.first_name} ${customer.last_name}\n` +
      `Téléphone : ${customer.phone}\n` +
      (customer.email ? `Email : ${customer.email}\n` : "") +
      "\n"
    : "Client : (non renseigné, merci de créer un compte)\n\n";

  const itemsBlock = items
    .map((i, idx) => {
      const url = `${siteOrigin}/produit/${i.slug}`;
      return (
        `${idx + 1}. ${i.name}\n` +
        `   Couleur : ${i.color}\n` +
        `   Taille : ${i.size}\n` +
        `   Quantité : ${i.qty}\n` +
        `   Sous-total : ${formatPrice(i.price * i.qty)}\n` +
        `   Photo : ${i.image}\n` +
        `   Fiche : ${url}`
      );
    })
    .join("\n\n");

  const waMessage = encodeURIComponent(
    "Bonjour Nēba, je souhaite commander :\n\n" +
      customerBlock +
      itemsBlock +
      `\n\nTotal : ${formatPrice(subtotal)}`,
  );

  const bump = (
    slug: string,
    color: string,
    size: string,
    qty: number,
  ) => {
    const res = setQty(slug, color, size, qty);
    if (!res.ok) {
      setNotice(`Stock maximum atteint : ${res.max} disponible(s).`);
      setTimeout(() => setNotice(null), 2600);
    }
  };

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-16 md:px-10 md:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="eyebrow">Panier</p>
          <h1 className="mt-3 text-4xl md:text-5xl">Votre sélection</h1>
          {customer && (
            <p className="mt-2 text-sm text-muted-foreground">
              Compte : {customer.first_name} {customer.last_name} · {customer.phone}
              <button
                onClick={logout}
                className="ml-3 underline hover:text-foreground"
              >
                changer
              </button>
            </p>
          )}
        </div>
        <button
          onClick={() => setConfirmClear(true)}
          className="eyebrow text-muted-foreground hover:text-foreground"
        >
          Vider le panier
        </button>
      </div>

      {notice && (
        <p className="mt-4 border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {notice}
        </p>
      )}

      <div className="mt-10 grid gap-12 lg:grid-cols-[1fr_360px]">
        <ul className="divide-y divide-border">
          {items.map((i) => {
            const overStock = i.qty > i.stock;
            const lowStock = !overStock && i.stock > 0 && i.stock <= 3;
            const outOfStock = i.stock <= 0;
            return (
              <li key={i.slug + i.color + i.size} className="flex gap-6 py-6">
                <Link
                  to="/produit/$slug"
                  params={{ slug: i.slug }}
                  className="block h-32 w-24 shrink-0 overflow-hidden bg-muted"
                >
                  <img src={i.image} alt={i.name} className="h-full w-full object-cover object-[center_top]" />
                </Link>
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <Link to="/produit/$slug" params={{ slug: i.slug }} className="text-lg hover:underline">
                      {i.name}
                    </Link>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {i.color} · Taille {i.size}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Prix unitaire : {formatPrice(i.price)}
                    </p>
                    {outOfStock && (
                      <p className="mt-1 text-xs text-destructive">
                        Pièce en rupture. Retirez-la pour continuer.
                      </p>
                    )}
                    {overStock && !outOfStock && (
                      <p className="mt-1 text-xs text-destructive">
                        Stock insuffisant : maximum {i.stock}.
                      </p>
                    )}
                    {lowStock && (
                      <p className="mt-1 text-xs" style={{ color: "#B67514" }}>
                        Plus que {i.stock} en stock.
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center border border-border">
                      <button
                        onClick={() => bump(i.slug, i.color, i.size, i.qty - 1)}
                        className="px-3 py-1 hover:bg-muted"
                        aria-label="Diminuer"
                      >
                        −
                      </button>
                      <span className="min-w-8 px-2 text-center text-sm">{i.qty}</span>
                      <button
                        onClick={() => bump(i.slug, i.color, i.size, i.qty + 1)}
                        className="px-3 py-1 hover:bg-muted disabled:opacity-40"
                        aria-label="Augmenter"
                        disabled={i.qty >= i.stock}
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => remove(i.slug, i.color, i.size)}
                      className="eyebrow text-muted-foreground hover:text-foreground"
                    >
                      Retirer
                    </button>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm">{formatPrice(i.price * i.qty)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {i.qty} × {formatPrice(i.price)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="h-fit border border-border p-6 lg:sticky lg:top-32">
          <p className="eyebrow">Récapitulatif</p>
          <div className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Articles</span>
              <span>{totalItems}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sous-total</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxes</span>
              <span className="text-muted-foreground">Incluses</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Livraison</span>
              <span className="text-muted-foreground">À convenir sur WhatsApp</span>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-6 flex justify-between">
            <span>Total estimé</span>
            <span className="text-lg">{formatPrice(subtotal)}</span>
          </div>

          {hasStockIssue && (
            <p className="mt-4 border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              Un article dépasse le stock disponible. Ajustez les quantités avant de commander.
            </p>
          )}

          <a
            href={hasStockIssue ? undefined : `https://wa.me/2250778142432?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={hasStockIssue}
            onClick={(e) => {
              if (hasStockIssue) e.preventDefault();
            }}
            className={`btn-luxe mt-6 w-full text-center ${
              hasStockIssue ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Acheter maintenant sur WhatsApp
          </a>
          <p className="mt-4 text-xs text-muted-foreground">
            Un assistant Nēba prend le relais sur WhatsApp : confirmation des tailles/couleurs,
            paiement (Wave, Orange Money, virement) et suivi jusqu'à la remise des pièces.
          </p>
        </aside>
      </div>

      {confirmClear && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          onClick={() => setConfirmClear(false)}
        >
          <div
            className="w-full max-w-sm border border-border bg-background p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="eyebrow">Confirmation</p>
            <h2 className="mt-2 text-2xl">Vider le panier ?</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Toutes les pièces sélectionnées seront retirées. Cette action est
              irréversible.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => {
                  clear();
                  setConfirmClear(false);
                }}
                className="btn-luxe"
              >
                Oui, vider
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="btn-luxe-outline"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
