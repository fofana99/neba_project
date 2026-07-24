import { createFileRoute, Link } from "@tanstack/react-router";
import look01 from "@/assets/neba-look-01.jpg";
import look02 from "@/assets/neba-logo.png";
import look03 from "@/assets/neba-look-03.jpg";
import look04 from "@/assets/neba-homme.jpg";
import artisanImage from "@/assets/neba-look-07.jpeg";
import presentationVideo from "@/assets/presentation.mp4";
import { useCustomer } from "@/lib/customer";

const heroImage = look03;
const heritageImage = look02;

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nēba | Maison de mode premium à Abidjan" },
      {
        name: "description",
        content:
          "Découvrez Nēba, maison de mode premium inspirée de l'héritage malinké. Prêt-à-porter, haute couture et pièces limitées, façonnées à Abidjan.",
      },
      { property: "og:title", content: "Nēba | Maison de mode premium à Abidjan" },
      {
        property: "og:description",
        content:
          "Prêt-à-porter, haute couture et pièces limitées. Héritage malinké, savoir-faire artisanal.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

function Home() {
  const { customer } = useCustomer();
  const waText = customer
    ? `Bonjour Nēba, je suis ${customer.first_name} ${customer.last_name} (${customer.phone}${customer.email ? `, ${customer.email}` : ""}). J'aimerais échanger avec vous.`
    : "Bonjour Nēba";
  const waHref = `https://wa.me/2250778142432?text=${encodeURIComponent(waText)}`;
  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-[1600px] gap-0 px-0 md:grid-cols-12">
          <div className="order-2 flex flex-col justify-center px-6 py-16 md:order-1 md:col-span-5 md:px-14 md:py-24">
            <p className="eyebrow fade-up">Collection Automne-Hiver</p>
            <h1
              className="fade-up mt-8 text-5xl leading-[1.05] tracking-tight md:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              L'héritage,<br />
              <em className="italic text-primary">réinventé.</em>
            </h1>
            <p
              className="fade-up mt-8 max-w-md text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "240ms" }}
            >
              Nēba dessine une mode où l'artisanat malinké rencontre la
              silhouette contemporaine. Pièces limitées, matières nobles,
              geste juste.
            </p>
            <div
              className="fade-up mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "360ms" }}
            >
              <Link to="/boutique" className="btn-luxe">
                Découvrir la collection
              </Link>
              <Link to="/notre-histoire" className="btn-luxe-outline">
                Notre histoire
              </Link>
            </div>
          </div>

          <div className="relative order-1 md:order-2 md:col-span-7">
            <img
              src={heroImage}
              alt="Duo Nēba, robes teintes à la main dans les tons vanille et safran, silhouette héritage"
              width={1280}
              height={1600}
              className="h-[70vh] w-full object-cover object-[center_top] md:h-[92vh]"
            />
          </div>
        </div>
      </section>

      {/* VIDEO DE PRESENTATION */}
      <section className="bg-background">
        <div className="mx-auto max-w-[1400px] px-6 py-20 md:px-10 md:py-28">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">La maison en mouvement</p>
            <h2 className="mt-4 text-4xl tracking-tight md:text-5xl">
              Nēba, en images
            </h2>
            <p className="mt-6 text-base leading-relaxed text-muted-foreground">
              Une immersion dans l'univers de la maison : matières, gestes et silhouettes.
            </p>
          </div>
          <div className="mt-12">
            <video
              src={presentationVideo}
              controls
              playsInline
              preload="metadata"
              className="block h-auto w-full"
            />
          </div>
        </div>
      </section>

      {/* MANIFESTE */}
      <section className="border-y border-border bg-secondary/40">
        <div className="mx-auto max-w-4xl px-6 py-24 text-center md:py-32">
          <p className="eyebrow">Le mot de la fondatrice</p>
          <div
            className="mt-10 space-y-6 text-left text-xl leading-[1.6] md:text-2xl md:leading-[1.55]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <p>Il y a des histoires qui prennent leur temps.</p>
            <p>
              Des rêves qu'on laisse grandir, nourris par nos origines, nos
              inspirations et nos envies d'ailleurs.
            </p>
            <p>
              Aujourd'hui, je vous dévoile <strong>NĒBA</strong>, une marque qui
              me ressemble et qui est née de la conviction que chaque culture
              est riche d'un savoir-faire unique, et que la mode peut être un
              moyen puissant de transmission et de rencontre entre ces cultures.
            </p>
            <p>
              Nous voulons créer des collections qui ont du sens, où chaque
              pièce s'inscrit dans un dialogue culturel, une conversation
              silencieuse, entre passé et présent, entre ici et ailleurs. Des
              collections qui honorent la beauté de nos traditions, tout en
              étant ancrées dans la modernité.
            </p>
          </div>
          <p
            className="mt-12 text-4xl md:text-5xl"
            style={{ fontFamily: "var(--font-display)", fontStyle: "italic" }}
          >
            Habiba
          </p>
          <p className="mt-2 text-xs tracking-[0.28em] text-muted-foreground uppercase">
            Fofana Habiba Makoko, Fondatrice
          </p>
        </div>
      </section>

      {/* UNIVERS */}
      <section className="mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="eyebrow">Univers</p>
            <h2 className="mt-4 text-4xl tracking-tight md:text-5xl">
              Quatre manières de porter Nēba
            </h2>
          </div>
          <span className="hidden text-sm text-muted-foreground md:block">
            Automne-Hiver 2026
          </span>
        </div>

        <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              slug: "homme",
              label: "Homme",
              title: "Vestiaire homme",
              text: "Lin, coton, coupes épurées. Élégance sans ostentation.",
              image: look04,
              alt: "Look Nēba homme",
            },
            {
              slug: "femme",
              label: "Femme",
              title: "Vestiaire femme",
              text: "Silhouettes fluides, matières nobles, coupes intemporelles.",
              image: look01,
              alt: "Look Nēba femme",
            },
            {
              slug: "enfant",
              label: "Enfant",
              title: "Vestiaire enfant",
              text: "Pièces douces et durables pour les plus jeunes.",
              image: look03,
              alt: "Vestiaire Nēba enfant",
            },
            {
              slug: "signature",
              label: "Collections",
              title: "L'objet héritage",
              text: "Filtre transversal, pièces limitées de la maison.",
              image: look02,
              alt: "Collections Nēba",
            },
          ].map((c) => (
            <Link
              key={c.slug}
              to="/boutique"
              search={{ cat: c.slug, col: "all" }}
              className="group relative flex aspect-[3/4] flex-col justify-end overflow-hidden bg-muted transition-all duration-500 hover:shadow-luxe"
            >
              <img
                src={c.image}
                alt={c.alt}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover object-[center_top] transition-transform duration-[1400ms] group-hover:scale-[1.05]"
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
                aria-hidden
              />
              <div className="relative p-8 text-white">
                <p className="eyebrow text-white/80">{c.label}</p>
                <h3 className="mt-4 text-3xl leading-tight">{c.title}</h3>
                <p className="mt-4 max-w-xs text-sm text-white/85">
                  {c.text}
                </p>
                <p className="eyebrow mt-6 text-white">Découvrir →</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* SAVOIR-FAIRE */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-[1600px] gap-0 md:grid-cols-2">
          <div className="relative aspect-[4/3] md:aspect-auto">
            <img
              src={artisanImage}
              alt="Broderie main d'un motif malinké au fil doré sur soie reseda"
              width={1408}
              height={1008}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-20 md:px-16 md:py-32">
            <p className="eyebrow text-primary-foreground/70">Savoir-faire</p>
            <h2 className="mt-6 text-4xl leading-tight md:text-5xl">
              Le geste, transmis.
            </h2>
            <p className="mt-8 max-w-md text-base leading-relaxed text-primary-foreground/85">
              Chaque pièce Nēba naît dans nos ateliers d'Abidjan. Broderies
              main, tissages traditionnels, teintures végétales. Le temps
              devient la matière première.
            </p>
            <div className="mt-10">
              <Link
                to="/notre-histoire"
                className="btn-luxe-outline border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Découvrir les ateliers
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* JOURNAL / IMAGE FINALE */}
      <section className="mx-auto max-w-[1600px] px-6 py-24 md:px-10 md:py-32">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="eyebrow">Le Journal</p>
            <h2 className="mt-6 text-4xl leading-tight md:text-5xl">
              L'histoire d'une étoffe verte.
            </h2>
            <p className="mt-8 text-base leading-relaxed text-muted-foreground">
              Du coton brut à la pièce achevée : quinze mains, quatre-vingt
              heures, une teinture ancestrale. Suivez le voyage complet de
              notre robe signature Reseda.
            </p>
            <div className="mt-10">
              <Link to="/boutique" className="btn-luxe-outline">
                Voir la boutique
              </Link>
            </div>
          </div>
          <div className="md:col-span-7">
            <img
              src={heritageImage}
              alt="Étoffes Nēba pliées, vanilla et reseda green, broderies malinké"
              width={1408}
              height={1008}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* CONTACT / SHOWROOM */}
      <section className="border-t border-border bg-accent/30">
        <div className="mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-24">
          <div className="grid gap-10 md:grid-cols-3">
            <div>
              <p className="eyebrow">Showroom</p>
              <p
                className="mt-4 text-2xl leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Cocody Riviera 3<br />Abidjan, Côte d'Ivoire
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Près de Roi du Poulet
              </p>
            </div>
            <div>
              <p className="eyebrow">Horaires</p>
              <p
                className="mt-4 text-2xl leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Lundi à Samedi<br />10h à 20h
              </p>
            </div>
            <div>
              <p className="eyebrow">Prendre rendez-vous</p>
              <p
                className="mt-4 text-2xl leading-snug"
                style={{ fontFamily: "var(--font-display)" }}
              >
                +225 07 78 14 24 32
              </p>
              <div className="mt-6">
                <a
                  href={waHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-luxe"
                >
                  Écrire sur WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
