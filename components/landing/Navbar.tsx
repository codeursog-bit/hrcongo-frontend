'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export function Navbar() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Le menu ouvert doit toujours avoir un fond opaque, même tout en haut de page
  const solidBg = scrolled || isOpen;

  const links = [
    { label: 'Accueil', href: '/' },
    { label: 'À propos', href: '/qui-sommes-nous' },
    { label: 'Fonctionnalités', href: '#fonctionnalites' },
    { label: 'Tarifs', href: '/tarifs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Documentation', href: '/docs' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <nav
      className={`fixed inset-x-0 top-0 z-[100] border-b transition-colors duration-300 ${
        solidBg
          ? 'border-white/[0.06] bg-[#050607]/95 backdrop-blur-xl'
          : 'border-transparent bg-transparent'
      }`}
    >
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex h-[72px] items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center" onClick={() => setIsOpen(false)}>
            <Image
              src="/logos/konza_logo_h_color.png"
              alt="Konza RH"
              width={140}
              height={40}
              className="h-9 w-auto object-contain sm:h-10"
              priority
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-1 md:flex">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="rounded-lg px-3.5 py-2 text-[14px] font-medium text-[#8B8F98] transition-colors hover:bg-white/[0.06] hover:text-[#FAFAFA]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA desktop */}
          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-[14px] font-semibold text-[#8B8F98] transition-colors hover:text-[#FAFAFA]"
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              className="rounded-lg bg-[#FAFAFA] px-5 py-2 text-[14px] font-medium text-black transition-colors hover:bg-white"
            >
              Essai gratuit
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center justify-center p-1 text-[#FAFAFA] md:hidden"
            aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={isOpen}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {isOpen ? (
                <>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <path d="M3 12h18" />
                  <path d="M3 6h18" />
                  <path d="M3 18h18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu — panneau opaque indépendant, pas de chevauchement avec le contenu derrière */}
      {isOpen && (
        <div className="border-t border-white/[0.06] bg-[#050607] px-6 pb-6 pt-4 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[15px] font-medium text-[#8B8F98] hover:text-[#FAFAFA]"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-3 flex flex-col gap-2.5 border-t border-white/[0.06] pt-4">
            <Link
              href="/auth/login"
              onClick={() => setIsOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-3 text-center text-[15px] font-medium text-[#FAFAFA]"
            >
              Connexion
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setIsOpen(false)}
              className="rounded-lg bg-[#FAFAFA] px-4 py-3 text-center text-[15px] font-medium text-black"
            >
              Essai gratuit
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}