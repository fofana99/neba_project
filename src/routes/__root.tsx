import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logo from "@/assets/neba-logo.png";
import { CartProvider, useCart } from "@/lib/cart";
import { CustomerProvider } from "@/lib/customer";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Erreur 404</p>
        <h1 className="mt-4 text-5xl">Page introuvable</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          La page que vous cherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-8">
          <Link to="/" className="btn-luxe">Retour à l'accueil</Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <p className="eyebrow">Une erreur est survenue</p>
        <h1 className="mt-4 text-4xl">Le chargement a échoué</h1>
        <p className="mt-4 text-sm text-muted-foreground">
          Merci de réessayer ou de revenir à l'accueil.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="btn-luxe"
          >
            Réessayer
          </button>
          <a href="/" className="btn-luxe-outline">Accueil</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Nēba | Mode premium, héritage malinké" },
      {
        name: "description",
        content:
          "Nēba, maison de mode premium basée à Abidjan. Prêt-à-porter, haute couture, homme et pièces limitées inspirées de l'héritage malinké.",
      },
      { name: "author", content: "Nēba" },
      { property: "og:site_name", content: "Nēba" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Inter:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin");

  return (
    <QueryClientProvider client={queryClient}>
      <CustomerProvider>
        <CartProvider>
          {!isAdmin && <SiteHeader />}
          <main className="min-h-[60vh]">
            <Outlet />
          </main>
          {!isAdmin && <SiteFooter />}
        </CartProvider>
      </CustomerProvider>
    </QueryClientProvider>
  );
}

function CartBadge() {
  const { count } = useCart();
  return (
    <Link to="/panier" className="eyebrow relative flex items-center gap-2 hover:text-foreground">
      <span aria-hidden>Panier</span>
      <span
        className={`inline-flex min-w-6 justify-center rounded-full border border-border px-2 py-0.5 text-[10px] ${
          count > 0 ? "bg-primary text-primary-foreground border-primary" : ""
        }`}
      >
        {count}
      </span>
    </Link>
  );
}

function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-6 py-4 md:px-10">
        <nav className="hidden flex-1 items-center gap-8 md:flex">
          <Link to="/" className="eyebrow hover:text-foreground" activeOptions={{ exact: true }} activeProps={{ className: "eyebrow text-foreground" }}>
            Accueil
          </Link>
          <Link to="/boutique" className="eyebrow hover:text-foreground" activeProps={{ className: "eyebrow text-foreground" }}>
            Boutique
          </Link>
          <Link to="/notre-histoire" className="eyebrow hover:text-foreground" activeProps={{ className: "eyebrow text-foreground" }}>
            Histoire
          </Link>
        </nav>
        <Link to="/" className="flex flex-1 items-center justify-center gap-3">
          <img src={logo} alt="Nēba" className="h-10 w-auto md:h-12" />
          <span
            className="hidden text-2xl tracking-[0.35em] text-foreground sm:inline md:text-3xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            NĒBA
          </span>
        </Link>
        <div className="hidden flex-1 items-center justify-end gap-6 md:flex">
          <CartBadge />
          <span className="eyebrow text-muted-foreground/70">FR · XOF</span>
        </div>
        <div className="flex items-center gap-4 md:hidden">
          <Link to="/boutique" className="eyebrow">Boutique</Link>
          <CartBadge />
        </div>
      </div>
    </header>
  );
}

function SocialIcon({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border transition-colors hover:border-foreground hover:text-foreground">
      {children}
    </span>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10">
        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <span
              className="text-2xl tracking-[0.35em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              NĒBA
            </span>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Maison de mode premium. Héritage malinké, savoir-faire artisanal,
              silhouettes contemporaines.
            </p>
            <div className="mt-6 flex gap-3 text-muted-foreground">
              <a href="https://wa.me/2250778142432" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
                <SocialIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.52 3.48A11.9 11.9 0 0 0 12 0C5.37 0 0 5.37 0 12a11.9 11.9 0 0 0 1.64 6L0 24l6.2-1.62A11.94 11.94 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.2-1.25-6.21-3.48-8.52ZM12 22a9.94 9.94 0 0 1-5.08-1.39l-.36-.22-3.68.96.98-3.59-.23-.37A9.98 9.98 0 1 1 22 12c0 5.52-4.48 10-10 10Zm5.47-7.48c-.3-.15-1.77-.87-2.05-.97-.28-.1-.48-.15-.68.15s-.78.97-.96 1.17c-.18.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.68-1.64-.93-2.24-.24-.58-.48-.5-.68-.51h-.58c-.2 0-.52.07-.8.37-.27.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.13 3.25 5.15 4.55.72.31 1.28.49 1.72.63.72.23 1.37.2 1.89.12.58-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z"/></svg>
                </SocialIcon>
              </a>
              <a href="https://www.instagram.com/neba_officiel/" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                <SocialIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
                </SocialIcon>
              </a>
              <a href="https://www.facebook.com/" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                <SocialIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 22v-8h2.7l.4-3.2h-3.1V8.7c0-.93.26-1.56 1.6-1.56H17V4.3c-.29-.04-1.29-.13-2.46-.13-2.44 0-4.11 1.49-4.11 4.22v2.36H7.7V14h2.73v8h3.07Z"/></svg>
                </SocialIcon>
              </a>
              <a href="https://www.tiktok.com/" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
                <SocialIcon>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.7 8.4a6.6 6.6 0 0 1-3.9-1.25v7.6a5.6 5.6 0 1 1-5.6-5.6c.3 0 .6.02.88.07v2.85a2.7 2.7 0 1 0 1.9 2.6V2h2.83a3.85 3.85 0 0 0 3.9 3.6V8.4Z"/></svg>
                </SocialIcon>
              </a>
            </div>
          </div>
          <div>
            <p className="eyebrow">Maison</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground">Accueil</Link></li>
              <li><Link to="/boutique" className="hover:text-foreground">Boutique</Link></li>
              <li><Link to="/notre-histoire" className="hover:text-foreground">Notre histoire</Link></li>
              <li><Link to="/panier" className="hover:text-foreground">Panier</Link></li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Showroom</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>Cocody Riviera 3</li>
              <li>Abidjan, Côte d'Ivoire</li>
              <li>Lun à Sam · 10h à 20h</li>
            </ul>
          </div>
          <div>
            <p className="eyebrow">Contact</p>
            <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
              <li>
                <a href="https://wa.me/2250778142432" className="hover:text-foreground">
                  WhatsApp · +225 07 78 14 24 32
                </a>
              </li>
              <li>
                <a href="mailto:contact@neba.ci" className="hover:text-foreground">
                  contact@neba.ci
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="rule-thin mt-16" />
        <div className="mt-8 flex flex-col justify-between gap-4 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Nēba. Tous droits réservés.</p>
          <p>Abidjan · Paris · Bamako · Dakar</p>
        </div>
      </div>
    </footer>
  );
}
