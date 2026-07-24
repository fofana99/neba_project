import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { checkAdminUnlocked } from "@/lib/admin-gate.functions";
import { adminListCustomers } from "@/lib/customer.functions";
import { LoginGate, AdminNav } from "./admin";

type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
  created_at: string;
};

export const Route = createFileRoute("/admin/clients")({
  head: () => ({
    meta: [
      { title: "Clients | Admin Nēba" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  loader: async () => {
    const { unlocked } = await checkAdminUnlocked();
    if (!unlocked) return { unlocked: false as const };
    const customers = await adminListCustomers();
    return { unlocked: true as const, customers: customers as Customer[] };
  },
  component: ClientsPage,
});

function ClientsPage() {
  const data = Route.useLoaderData();
  if (!data.unlocked) return <LoginGate />;
  return <ClientsList customers={data.customers} />;
}

function waLink(phone: string) {
  const digits = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${digits}`;
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function ClientsList({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const q = search.trim().toLowerCase();
  const filtered = q
    ? customers.filter(
        (c) =>
          `${c.first_name} ${c.last_name}`.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q),
      )
    : customers;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="mx-auto max-w-[1200px] px-6 py-10 md:px-10 md:py-14">
      <div>
        <p className="eyebrow">Administration</p>
        <h1 className="mt-3 text-4xl">Clients</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Coordonnées récoltées lors de la prise de contact WhatsApp depuis le panier.
        </p>
      </div>
      <div className="mt-8">
        <AdminNav />
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          placeholder="Rechercher un client (nom, téléphone, email)…"
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
              <th className="p-3">Téléphone</th>
              <th className="p-3">Email</th>
              <th className="p-3">Inscrit le</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="p-3">{c.first_name} {c.last_name}</td>
                <td className="p-3 text-muted-foreground">{c.phone}</td>
                <td className="p-3 text-muted-foreground">
                  {c.email ?? <span className="text-xs italic opacity-60">—</span>}
                </td>
                <td className="p-3 text-muted-foreground">{formatDate(c.created_at)}</td>
                <td className="p-3 text-right">
                  <a
                    href={waLink(c.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="eyebrow border border-border px-3 py-1.5 hover:border-foreground"
                  >
                    WhatsApp
                  </a>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-muted-foreground">
                  Aucun client pour le moment.
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
    </div>
  );
}
