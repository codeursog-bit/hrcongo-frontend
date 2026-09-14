'use client';

import Link from 'next/link';
import Image from 'next/image';

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050607]">
      <div className="mx-auto max-w-6xl px-6 pt-16">
        <div className="grid grid-cols-1 gap-12 border-b border-white/[0.06] pb-12 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-flex">
              <Image
                src="/logos/konza_logo_h_color.png"
                alt="Konza RH"
                width={140}
                height={40}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="mb-6 max-w-[300px] text-[14px] leading-relaxed text-[#8B8F98]">
              La première plateforme RH conçue pour le marché congolais. Paie
              conforme, pointage GPS, recrutement — tout en un.
            </p>
            <div className="flex flex-col gap-2.5">
              {[
                { icon: '✉', text: 'contact@konza-rh.cg', href: 'mailto:contact@konza-rh.cg' },
                { icon: '☎', text: '+242 06 413 3693', href: 'tel:+242064133693' },
                { icon: '⌖', text: 'Pointe-Noire, Congo-Brazzaville', href: null },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-[13px] text-[#10B981]">{item.icon}</span>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-[13px] text-[#8B8F98] transition-colors hover:text-[#FAFAFA]"
                    >
                      {item.text}
                    </a>
                  ) : (
                    <span className="text-[13px] text-[#8B8F98]">{item.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Produit */}
          <FooterColumn
            title="Produit"
            items={['Fonctionnalités', 'Tarification', 'Changelog', 'Statut système', 'API Docs'].map(
              (label) => ({ label, href: '#' })
            )}
          />

          {/* Entreprise */}
          <FooterColumn
            title="Entreprise"
            items={[
              { label: 'À propos', href: '/qui-sommes-nous' },
              { label: 'Blog', href: '/blog' },
              { label: 'Partenaires', href: '#' },
              { label: 'Contact', href: '/contact' },
            ]}
          />

          {/* Légal + newsletter */}
          <div>
            <FooterColumn
              title="Légal & Support"
              items={[
                { label: 'FAQ', href: '/faq' },
                { label: 'CGU', href: '#' },
                { label: 'Confidentialité', href: '#' },
                { label: 'Cookies', href: '#' },
              ]}
            />

            <div className="mt-7">
              <p className="mb-2.5 text-[13px] text-[#8B8F98]">Newsletter RH Congo :</p>
              <form className="flex gap-2">
                <input
                  type="email"
                  placeholder="votre@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] text-[#FAFAFA] outline-none placeholder:text-[#5A5E66] focus:border-white/20"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#10B981] px-3.5 py-2 text-[13px] font-medium text-black transition-colors hover:bg-[#34D399]"
                >
                  OK
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-6">
          <p className="text-[13px] text-[#5A5E66]">
            © 2026 Konza RH. Tous droits réservés. Fait avec ❤ à Pointe-Noire.
          </p>
          <div className="flex gap-4">
            {['Facebook', 'LinkedIn', 'Twitter'].map((sn) => (
              <a
                key={sn}
                href="#"
                className="text-[13px] text-[#5A5E66] transition-colors hover:text-[#10B981]"
              >
                {sn}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="mb-5 text-[13px] font-semibold tracking-[0.04em] text-[#FAFAFA]">
        {title}
      </h4>
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li key={item.label}>
            <Link
              href={item.href}
              className="text-[14px] text-[#8B8F98] transition-colors hover:text-[#FAFAFA]"
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}