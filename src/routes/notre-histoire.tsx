import { createFileRoute, Link } from "@tanstack/react-router";
import look01 from "@/assets/neba-look-05.jpg";
import look02 from "@/assets/neba-look-04.jpeg";
import look03 from "@/assets/neba-heritage.jpg";
import look04 from "@/assets/neba-hero.jpeg";

const heroImage = look03;
const artisanImage = look01;
const heritageImage = look02;
const portraitImage = look04;

export const Route = createFileRoute("/notre-histoire")({
  head: () => ({
    meta: [
      { title: "Notre histoire | Nēba, l'héritage malinké réinventé" },
      {
        name: "description",
        content:
          "L'histoire de Nēba : maison de mode premium née à Abidjan, portée par l'héritage malinké et le geste artisanal.",
      },
      { property: "og:title", content: "Notre histoire | Nēba" },
      {
        property: "og:description",
        content:
          "Une maison née à Abidjan. Un héritage malinké. Un vestiaire contemporain.",
      },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/notre-histoire" },
    ],
    links: [{ rel: "canonical", href: "/notre-histoire" }],
  }),
  component: HistoirePage,
});

function HistoirePage() {
  return (
    <>
      {/* Cover editorial */}
      <section className="relative">
        <div className="mx-auto max-w-[1600px] px-6 pt-16 md:px-10 md:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <p className="eyebrow fade-up">Chapitre I</p>
            <h1
              className="fade-up mt-8 text-5xl leading-[1.05] md:text-7xl"
              style={{ animationDelay: "120ms" }}
            >
              Notre histoire
            </h1>
            <p
              className="fade-up mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground"
              style={{ animationDelay: "240ms" }}
            >
              Une maison née à Abidjan. Un héritage malinké porté par des
              mains contemporaines. Une manière de dire, par le vêtement, qui
              nous sommes.
            </p>
          </div>

          <div className="mt-16 md:mt-24">
            <img
              src={heroImage}
              alt="Portrait éditorial Nēba, silhouette en reseda green"
              width={1280}
              height={1000}
              className="aspect-[16/10] w-full object-cover object-[center_top]"
            />
          </div>
        </div>
      </section>

      {/* Récit, chapitre 1 */}
      <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <p className="eyebrow">L'origine</p>
        <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
          Nēba, un mot, une promesse.
        </h2>
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            En malinké, <em>Nēba</em> veut dire maman : ce qui se transmet, le
            geste juste, la parole donnée, la beauté qu'on hérite sans jamais la
            posséder. C'est de ce mot que naît la maison, en 2024, sous
            l'impulsion de <strong>Fofana Habiba Makoko</strong>.
          </p>
          <p>
            Pensée entre Abidjan et l'Europe, Nēba se veut la voix d'une
            élégance ouest-africaine, longtemps racontée par d'autres, jamais
            tout à fait par elle-même. Une élégance sobre, exigeante, qui ne
            demande pas d'être expliquée.
          </p>
        </div>
      </section>

      {/* Split image + texte */}
      <section className="bg-secondary/40">
        <div className="mx-auto grid max-w-[1600px] gap-0 md:grid-cols-2">
          <div className="relative aspect-[4/5] md:aspect-auto">
            <img
              src={artisanImage}
              alt="Broderie main d'un motif malinké au fil doré"
              width={1408}
              height={1008}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center px-6 py-20 md:px-16 md:py-32">
            <p className="eyebrow">Chapitre II. Le geste</p>
            <h2 className="mt-6 text-4xl leading-tight md:text-5xl">
              L'atelier comme méthode.
            </h2>
            <div className="mt-8 space-y-5 text-base leading-relaxed text-foreground/85">
              <p>
                Chaque collection commence par un dessin, puis par une
                étoffe, puis par une main. Nos artisans : brodeurs,
                teinturiers, couturières. Ils travaillent en séries courtes,
                parfois uniques.
              </p>
              <p>
                Nous refusons la production de masse. Nous préférons la
                lenteur du bon geste : c'est elle qui donne au vêtement sa
                tenue, sa mémoire, son prix juste.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Chapitre III */}
      <section className="mx-auto max-w-3xl px-6 py-24 md:py-32">
        <p className="eyebrow">Chapitre III. L'héritage</p>
        <h2 className="mt-4 text-4xl leading-tight md:text-5xl">
          Une culture qui ne s'expose pas, elle se porte.
        </h2>
        <div className="mt-10 space-y-6 text-lg leading-relaxed text-foreground/85">
          <p>
            Les motifs qui traversent nos pièces viennent des textiles
            traditionnels malinké : géométries brodées, chaînes graphiques,
            symboles familiaux. Nous ne les copions pas. Nous les
            prolongeons, avec la permission du temps.
          </p>
          <p>
            Chaque pièce Nēba est pensée pour durer, se transmettre, se
            re-porter. Elle appartient d'abord à celle qui la choisit ; puis
            à celles qui viendront après elle.
          </p>
        </div>
      </section>

      {/* Image finale */}
      <section className="mx-auto max-w-[1600px] px-6 pb-24 md:px-10 md:pb-32">
        <div className="grid gap-6 md:grid-cols-2">
          <img
            src={heritageImage}
            alt="Duo Nēba, silhouettes safran et chocolat, dialogue de matières"
            width={1408}
            height={1008}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover object-[center_top]"
          />
          <img
            src={portraitImage}
            alt="Portrait Nēba, pièce peinte à la main dans les tons terre"
            width={1408}
            height={1008}
            loading="lazy"
            className="aspect-[4/5] w-full object-cover object-[center_top]"
          />
        </div>
        <p className="mt-6 text-center text-xs tracking-widest text-muted-foreground uppercase">
          Campagne Abidjan, 2026
        </p>
      </section>

      {/* Signature */}
      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-24 text-center md:py-32">
          <p
            className="text-3xl leading-snug md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            «&nbsp;Habiller une femme, c'est lui rendre une histoire,
            la sienne, celle des siens, celle qui viendra.&nbsp;»
          </p>
          <p className="mt-10 text-sm tracking-widest text-muted-foreground">
            FOFANA HABIBA MAKOKO
          </p>
          <div className="mt-12">
            <Link to="/" className="btn-luxe-outline">
              Retour à la maison
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
