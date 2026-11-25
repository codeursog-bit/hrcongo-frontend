'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import s from './PublicSite.module.css';

const links = [
  ['Produit', '/#fonctionnalites'],
  ['À propos', '/qui-sommes-nous'],
  ['Tarifs', '/tarifs'],
  ['Blog', '/blog'],
  ['Documentation', '/docs'],
  ['Contact', '/contact'],
];
export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const close = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [open]);
  return (
    <header className={s.nav}>
      <a href="#contenu" className="sr-only focus:not-sr-only">
        Aller au contenu
      </a>
      <div className={[s.container, s.navInner].join(' ')}>
        <Link href="/" aria-label="Konza RH — Accueil">
          <Image
            src="/logos/konza_logo_h_color.png"
            alt="Konza RH"
            width={140}
            height={40}
            priority
            className={s.logo}
          />
        </Link>
        <nav aria-label="Navigation principale" className={s.links}>
          {links.map(([label, href]) => (
            <Link key={href} href={href} aria-current={href === pathname ? 'page' : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <div className={s.actions}>
          <Link href="/auth/login">Connexion</Link>
          <Link href="/auth/register" className={s.button}>
            Essayer Konza
          </Link>
        </div>
        <button
          type="button"
          className={s.menuButton}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="public-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>
      {open && (
        <nav id="public-navigation" aria-label="Navigation mobile" className={s.mobileMenu}>
          {links.map(([label, href]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              aria-current={href === pathname ? 'page' : undefined}
            >
              {label}
            </Link>
          ))}
          <Link href="/auth/login">Connexion</Link>
          <Link href="/auth/register" className={s.button}>
            Essayer Konza
          </Link>
        </nav>
      )}
    </header>
  );
}
