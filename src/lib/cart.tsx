import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type CartItem = {
  slug: string;
  name: string;
  image: string;
  price: number;
  color: string;
  size: string;
  qty: number;
  stock: number;
};

export type AddResult =
  | { ok: true }
  | { ok: false; reason: "out_of_stock" | "stock_limit"; max: number };

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  hasStockIssue: boolean;
  add: (item: CartItem) => AddResult;
  remove: (slug: string, color: string, size: string) => void;
  setQty: (slug: string, color: string, size: string, qty: number) => AddResult;
  clear: () => void;
};

const CartContext = createContext<CartCtx | null>(null);
const KEY = "neba.cart.v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {}
  }, [items, hydrated]);

  const add = useCallback<CartCtx["add"]>((item) => {
    if (item.stock <= 0) return { ok: false, reason: "out_of_stock", max: 0 };
    let result: AddResult = { ok: true };
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.slug === item.slug && i.color === item.color && i.size === item.size,
      );
      if (idx >= 0) {
        const next = [...prev];
        const target = Math.min(next[idx].qty + item.qty, item.stock);
        if (target === next[idx].qty) {
          result = { ok: false, reason: "stock_limit", max: item.stock };
          return prev;
        }
        next[idx] = { ...next[idx], qty: target, stock: item.stock };
        return next;
      }
      const qty = Math.min(item.qty, item.stock);
      return [...prev, { ...item, qty }];
    });
    return result;
  }, []);

  const remove = useCallback((slug: string, color: string, size: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.slug === slug && i.color === color && i.size === size)),
    );
  }, []);

  const setQty = useCallback<CartCtx["setQty"]>((slug, color, size, qty) => {
    let result: AddResult = { ok: true };
    setItems((prev) =>
      prev
        .map((i) => {
          if (!(i.slug === slug && i.color === color && i.size === size)) return i;
          if (qty > i.stock) {
            result = { ok: false, reason: "stock_limit", max: i.stock };
            return { ...i, qty: i.stock };
          }
          return { ...i, qty: Math.max(1, qty) };
        })
        .filter((i) => i.qty > 0),
    );
    return result;
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartCtx>(() => {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.qty * i.price, 0);
    const hasStockIssue = items.some((i) => i.qty > i.stock || i.stock <= 0);
    return { items, count, subtotal, hasStockIssue, add, remove, setQty, clear };
  }, [items, add, remove, setQty, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
