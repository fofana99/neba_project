import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { registerCustomer, getCustomerById } from "./customer.functions";

export type Customer = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string | null;
};

type CustomerCtx = {
  customer: Customer | null;
  hydrated: boolean;
  register: (input: {
    first_name: string;
    last_name: string;
    phone: string;
    email?: string;
  }) => Promise<Customer>;
  logout: () => void;
};

const Ctx = createContext<CustomerCtx | null>(null);
const KEY = "neba.customer.v1";

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const registerFn = useServerFn(registerCustomer);
  const getByIdFn = useServerFn(getCustomerById);

  useEffect(() => {
    (async () => {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Customer;
          const data = await getByIdFn({ data: { id: parsed.id } });
          if (data) setCustomer(data as Customer);
          else localStorage.removeItem(KEY);
        }
      } catch {}
      setHydrated(true);
    })();
  }, [getByIdFn]);

  const register = useCallback<CustomerCtx["register"]>(async (input) => {
    const c = (await registerFn({
      data: {
        first_name: input.first_name.trim(),
        last_name: input.last_name.trim(),
        phone: input.phone.trim(),
        email: input.email?.trim() ?? "",
      },
    })) as Customer;
    setCustomer(c);
    try {
      localStorage.setItem(KEY, JSON.stringify(c));
    } catch {}
    return c;
  }, [registerFn]);

  const logout = useCallback(() => {
    setCustomer(null);
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ customer, hydrated, register, logout }),
    [customer, hydrated, register, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCustomer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCustomer must be used inside CustomerProvider");
  return ctx;
}

/**
 * Modale de création de compte. S'affiche quand `open` est vrai.
 * Appelle `onSuccess` après enregistrement en base.
 */
export function CustomerRegisterModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess?: (c: Customer) => void;
}) {
  const { register } = useCustomer();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    if (!first.trim() || !last.trim() || !phone.trim()) {
      setErr("Prénom, nom et téléphone sont obligatoires.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr("Email invalide.");
      return;
    }
    setBusy(true);
    try {
      const c = await register({
        first_name: first,
        last_name: last,
        phone,
        email: email || undefined,
      });
      onSuccess?.(c);
      onClose();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md border border-border bg-background p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="eyebrow">Créer votre compte</p>
        <h2 className="mt-2 text-2xl">Avant d'ajouter au panier</h2>
        <p className="mt-3 text-sm text-muted-foreground">
          Vos informations permettent à l'assistant Nēba de vous joindre pour
          confirmer et livrer votre commande.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="eyebrow text-xs">Prénom *</span>
              <input
                value={first}
                onChange={(e) => setFirst(e.target.value)}
                className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="eyebrow text-xs">Nom *</span>
              <input
                value={last}
                onChange={(e) => setLast(e.target.value)}
                className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="block">
            <span className="eyebrow text-xs">Téléphone (WhatsApp) *</span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+225 07 00 00 00 00"
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block">
            <span className="eyebrow text-xs">Email (optionnel)</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            />
          </label>

          {err && <p className="text-sm text-destructive">{err}</p>}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="submit"
              disabled={busy}
              className="btn-luxe disabled:opacity-50"
            >
              {busy ? "Enregistrement..." : "Créer mon compte"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-luxe-outline"
            >
              Annuler
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
