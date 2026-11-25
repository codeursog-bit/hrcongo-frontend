import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import s from './PublicSite.module.css';

export function PublicSite({ children }: { children: React.ReactNode }) {
  return (
    <div className={s.site}>
      <Navbar />
      <main id="contenu">{children}</main>
      <Footer />
    </div>
  );
}
export function ProductShot({
  name,
  src,
  description,
  document = false,
  priority = false,
}: {
  name: string;
  src: string;
  description: string;
  document?: boolean;
  priority?: boolean;
}) {
  const dimensions = document
    ? [794, 1123]
    : src.endsWith('dashboard-fourni.png')
      ? [1276, 906]
      : src.endsWith('pointeuse-mobile-fournie.png')
        ? [720, 1275]
        : [1440, 1120];
  return (
    <figure className={`${s.product} ${document ? s.bulletin : ''}`}>
      {/* Captures de l'application en mode démo ; aucun document client. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <a
        href={src}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Agrandir : ${name} (nouvel onglet)`}
        style={{ cursor: 'zoom-in' }}
      >
        <img
          src={src}
          alt={description}
          width={dimensions[0]}
          height={dimensions[1]}
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </a>
      <figcaption className={s.caption}>
        <span>{name}</span>
        <span>Konza RH · Vue de l’application</span>
      </figcaption>
    </figure>
  );
}
export function PublicClosing() {
  return (
    <section className={`${s.container} ${s.section}`}>
      <div className={s.closing}>
        <div>
          <p className={s.eyebrow}>Voyons votre organisation</p>
          <h2 className={s.sectionTitle}>
            La meilleure façon de choisir :<br />
            voir le produit.
          </h2>
        </div>
        <Link href="/contact" className={s.button}>
          Demander une démonstration <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
