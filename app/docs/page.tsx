'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────
type PageMode   = 'doc' | 'videos';
type TypeMode   = 'entreprise' | 'cabinet';

// ─── Sous-composants internes ────────────────────────────────────────────────

function SidebarLink({ href, label, active, onClick }: {
  href: string; label: string; active: boolean; onClick: () => void;
}) {
  return (
    <a
      href={href}
      onClick={e => { e.preventDefault(); onClick(); }}
      className={`flex items-center gap-2 px-5 py-[0.5rem] text-[0.82rem] font-medium border-l-2 transition-all duration-150
        ${active
          ? 'text-cyan-400 border-l-cyan-400 bg-cyan-400/5 font-semibold'
          : 'text-slate-400 border-l-transparent hover:text-white hover:bg-white/[0.03]'
        }`}
    >
      <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 transition-opacity ${active ? 'opacity-100 bg-cyan-400' : 'opacity-40 bg-current'}`} />
      {label}
    </a>
  );
}

function StepItem({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-[10px] items-start text-[0.83rem] text-slate-400 py-[0.55rem] border-b border-white/[0.04] last:border-b-0">
      <span className="w-5 h-5 rounded-full bg-[#111827] border border-white/10 text-[0.62rem] font-mono text-cyan-400 flex items-center justify-center flex-shrink-0 mt-[1px]">
        {n}
      </span>
      <div>{children}</div>
    </li>
  );
}

function GuideCard({ icon, iconBg, title, children }: {
  icon: string; iconBg: string; title: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] p-[1.4rem] mb-4 hover:border-white/[0.11] transition-colors">
      <div className="flex items-center gap-2 text-[0.9rem] font-semibold text-white mb-4">
        <span className={`w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] flex-shrink-0 ${iconBg}`}>{icon}</span>
        {title}
      </div>
      <ul className="list-none flex flex-col">{children}</ul>
    </div>
  );
}

function InfoBlock({ type, icon, children }: { type: 'tip' | 'warn' | 'note'; icon: string; children: React.ReactNode }) {
  const styles = {
    tip:  'bg-emerald-500/[0.07] text-emerald-200 border-l-2 border-emerald-500',
    warn: 'bg-amber-500/[0.07]   text-amber-200   border-l-2 border-amber-500',
    note: 'bg-cyan-500/[0.06]    text-cyan-200    border-l-2 border-cyan-400',
  }[type];
  return (
    <div className={`flex gap-[10px] items-start rounded-[10px] px-4 py-[0.9rem] text-[0.82rem] my-4 ${styles}`}>
      <span className="text-[15px] flex-shrink-0 mt-[1px]">{icon}</span>
      <div>{children}</div>
    </div>
  );
}

function FlowStep({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div className="relative pl-5 py-4">
      <div className="absolute left-[-2.5rem] top-4 w-[38px] h-[38px] rounded-full bg-[#111827] border border-white/[0.11] font-mono text-[0.7rem] text-cyan-400 flex items-center justify-center z-10">
        {n}
      </div>
      <h3 className="text-[0.95rem] font-semibold text-white mb-1">{title}</h3>
      <div className="text-[0.82rem] text-slate-400 leading-[1.65]">{children}</div>
    </div>
  );
}

function SectionHead({ num, title, badge }: { num: string; title: string; badge?: { label: string; type: 'req' | 'opt' | 'crit' } }) {
  const badgeStyle = badge ? {
    req:  'bg-amber-500/10 text-amber-400',
    opt:  'bg-emerald-500/10 text-emerald-400',
    crit: 'bg-red-500/10 text-red-400',
  }[badge.type] : '';
  return (
    <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
      <div>
        <span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">{num}</span>
        <h2 className="text-[1.3rem] font-bold tracking-[-0.025em] text-white">{title}</h2>
      </div>
      {badge && (
        <span className={`text-[0.62rem] font-mono px-[7px] py-[2px] rounded-[4px] font-semibold mb-[2px] ${badgeStyle}`}>
          {badge.label}
        </span>
      )}
    </div>
  );
}

function PathCrumb({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-[#111827] border border-white/[0.11] rounded-[6px] px-[10px] py-1 text-slate-400 mb-5">
      {children}
    </div>
  );
}

function RoleCard({ badge, badgeClass, perms }: { badge: string; badgeClass: string; perms: string[] }) {
  return (
    <div className="bg-[#0b1121] border border-white/[0.06] rounded-[12px] p-[1rem_1.15rem] hover:border-white/[0.11] transition-colors">
      <span className={`text-[0.72rem] font-mono font-semibold px-2 py-[3px] rounded-[5px] mb-3 inline-block ${badgeClass}`}>{badge}</span>
      <ul className="list-none text-[0.78rem] text-slate-400 leading-[1.9]">
        {perms.map((p, i) => (
          <li key={i} className="before:content-['›_'] before:text-cyan-400/60">{p}</li>
        ))}
      </ul>
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-white/[0.06] last:border-b-0">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-[0.87rem] font-medium text-slate-200 text-left hover:bg-white/[0.02] transition-colors"
      >
        {q}
        <span className={`w-[22px] h-[22px] rounded-full border border-white/[0.11] flex items-center justify-center text-slate-400 font-mono text-[0.9rem] flex-shrink-0 transition-all duration-200
          ${open ? 'rotate-45 bg-cyan-400/10 border-cyan-400 text-cyan-400' : ''}`}>
          +
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 text-[0.83rem] text-slate-400 leading-[1.8] px-5
        ${open ? 'max-h-[600px] pb-[1.1rem]' : 'max-h-0'}`}>
        {a}
      </div>
    </div>
  );
}

function VideoCard({ href, module: mod, duration, title, desc }: {
  href: string; module: string; duration: string; title: string; desc: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener" className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] overflow-hidden block hover:-translate-y-[3px] hover:border-cyan-400/25 transition-all duration-200">
      <div className="w-full aspect-video bg-gradient-to-br from-[#111827] to-[#1a2235] flex flex-col items-center justify-center gap-2 relative">
        <span className="absolute top-2 left-[10px] text-[0.65rem] font-mono font-semibold bg-cyan-400/15 text-cyan-400 border border-cyan-400/20 px-[7px] py-[2px] rounded-full">
          {mod}
        </span>
        <div className="w-12 h-12 rounded-full bg-cyan-400/12 border-2 border-cyan-400/30 flex items-center justify-center hover:bg-cyan-400 transition-colors group-hover:border-cyan-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
        </div>
        <span className="absolute bottom-2 right-[10px] text-[0.7rem] font-mono font-semibold bg-[#020617]/85 text-white px-[6px] py-[2px] rounded">{duration}</span>
      </div>
      <div className="px-4 pt-[0.9rem] pb-4">
        <p className="text-[0.87rem] font-semibold text-white mb-[0.35rem] leading-[1.4]">{title}</p>
        <p className="text-[0.78rem] text-slate-400 leading-[1.55]">{desc}</p>
      </div>
    </a>
  );
}

// ─── Sections IDs pour le scroll tracking ────────────────────────────────────
const DOC_SECTIONS = [
  'inscription','roles','entreprise-cabinet','departements','utilisateurs',
  'paie-config','employes','import','contrats','pointage','pointage-manuel',
  'shifts','paie','paie-masse','impayes','loans','conges','cnss',
  'recrutement','formation','materiel','faq',
];

const VIDEO_SECTIONS = ['vid-demarrage','vid-employes','vid-presences','vid-paie','vid-autres'];

// ─── Page principale ──────────────────────────────────────────────────────────
export default function DocsPage() {
  const [page,        setPage]        = useState<PageMode>('doc');
  const [typeMode,    setTypeMode]    = useState<TypeMode>('entreprise');
  const [activeSection, setActive]   = useState('inscription');
  const mainRef = useRef<HTMLDivElement>(null);

  // Scroll tracking
  useEffect(() => {
    const sections = page === 'doc' ? DOC_SECTIONS : VIDEO_SECTIONS;
    const handler = () => {
      let current = sections[0];
      sections.forEach(id => {
        const el = document.getElementById(id);
        if (el && window.scrollY >= el.offsetTop - 110) current = id;
      });
      setActive(current);
    };
    window.addEventListener('scroll', handler, { passive: true });
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, [page]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) { window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' }); setActive(id); }
  };

  // ── Sidebar doc links
  const docLinks: Array<{ group: string; items: Array<{ href: string; label: string }> }> = [
    { group: 'Démarrage', items: [
      { href: 'inscription',       label: 'Inscription & connexion' },
      { href: 'roles',             label: 'Rôles & permissions' },
    ]},
    { group: 'Configuration', items: [
      { href: 'entreprise-cabinet',label: 'Entreprise / Cabinet' },
      { href: 'departements',      label: 'Départements' },
      { href: 'utilisateurs',      label: 'Utilisateurs' },
      { href: 'paie-config',       label: 'Paramètres paie' },
    ]},
    { group: 'Employés', items: [
      { href: 'employes',          label: 'Créer un employé' },
      { href: 'import',            label: 'Import Excel' },
      { href: 'contrats',          label: 'Contrats' },
    ]},
    { group: 'Présences', items: [
      { href: 'pointage',          label: 'Pointage GPS' },
      { href: 'pointage-manuel',   label: 'Pointage manuel' },
      { href: 'shifts',            label: 'Planning shifts' },
    ]},
    { group: 'Paie', items: [
      { href: 'paie',              label: 'Bulletin individuel' },
      { href: 'paie-masse',        label: 'Paie en masse' },
      { href: 'impayes',           label: 'Suivi impayés' },
      { href: 'loans',             label: 'Prêts & avances' },
    ]},
    { group: 'Autres modules', items: [
      { href: 'conges',            label: 'Congés' },
      { href: 'cnss',              label: 'Déclaration CNSS' },
      { href: 'recrutement',       label: 'Recrutement' },
      { href: 'formation',         label: 'Formation' },
      { href: 'materiel',          label: 'Matériel' },
    ]},
    { group: 'FAQ', items: [
      { href: 'faq',               label: 'Questions fréquentes' },
    ]},
  ];

  const videoLinks = [
    { href: 'vid-demarrage', label: 'Démarrage' },
    { href: 'vid-employes',  label: 'Employés' },
    { href: 'vid-presences', label: 'Présences' },
    { href: 'vid-paie',      label: 'Paie' },
    { href: 'vid-autres',    label: 'Autres modules' },
  ];

  return (
    <>
      {/* Topbar de la landing */}
      <Navbar />

      <div className="flex min-h-screen pt-16 bg-[#020617]">

        {/* ══ SIDEBAR ════════════════════════════════════════════════════════ */}
        <aside className="hidden lg:flex w-[268px] flex-shrink-0 flex-col fixed top-16 left-0 bottom-0 overflow-y-auto bg-[#0b1121] border-r border-white/[0.06] z-40 pb-12">

          {/* Brand info */}
          <div className="px-5 py-5 border-b border-white/[0.06]">
            <p className="text-[0.65rem] font-mono text-cyan-400 uppercase tracking-widest mb-[2px]">Centre d'aide</p>
            <p className="text-[0.72rem] font-mono text-slate-500">v2.0 · Documentation officielle</p>
          </div>

          {/* Mode switcher */}
          <div className="flex mx-4 my-3 bg-[#111827] border border-white/[0.06] rounded-[10px] p-[3px] gap-[2px]">
            {(['doc','videos'] as PageMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setPage(m); setActive(m === 'doc' ? 'inscription' : 'vid-demarrage'); window.scrollTo({ top: 0 }); }}
                className={`flex-1 py-[0.45rem] text-[0.73rem] font-semibold rounded-[7px] transition-all duration-200 font-sans
                  ${page === m
                    ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#020617] font-bold'
                    : 'text-slate-400 hover:text-white'
                  }`}
              >
                {m === 'doc' ? '📖 Guide' : '▶ Vidéos'}
              </button>
            ))}
          </div>

          {/* Nav doc */}
          {page === 'doc' && (
            <nav>
              {docLinks.map(group => (
                <div key={group.group}>
                  <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-500 px-5 pt-4 pb-[6px] font-mono">
                    {group.group}
                  </p>
                  {group.items.map(item => (
                    <SidebarLink
                      key={item.href}
                      href={`#${item.href}`}
                      label={item.label}
                      active={activeSection === item.href}
                      onClick={() => scrollTo(item.href)}
                    />
                  ))}
                </div>
              ))}
            </nav>
          )}

          {/* Nav vidéos */}
          {page === 'videos' && (
            <nav>
              <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-500 px-5 pt-4 pb-[6px] font-mono">
                Par module
              </p>
              {videoLinks.map(item => (
                <SidebarLink
                  key={item.href}
                  href={`#${item.href}`}
                  label={item.label}
                  active={activeSection === item.href}
                  onClick={() => scrollTo(item.href)}
                />
              ))}
            </nav>
          )}
        </aside>

        {/* ══ CONTENU PRINCIPAL ══════════════════════════════════════════════ */}
        <main ref={mainRef} className="lg:ml-[268px] flex-1 min-w-0 max-w-[860px] px-6 sm:px-10 lg:px-16 py-12 pb-32">

          {/* Tabs mobiles + desktop */}
          <div className="flex items-center gap-2 mb-10">
            {(['doc','videos'] as PageMode[]).map(m => (
              <button
                key={m}
                onClick={() => { setPage(m); setActive(m === 'doc' ? 'inscription' : 'vid-demarrage'); window.scrollTo({ top: 0 }); }}
                className={`px-[1.1rem] py-[0.45rem] text-[0.82rem] font-semibold rounded-[8px] border transition-all duration-200 font-sans
                  ${page === m
                    ? 'bg-gradient-to-r from-cyan-400/12 to-blue-500/12 border-cyan-400/30 text-cyan-400'
                    : 'border-white/[0.06] text-slate-400 hover:border-white/[0.11] hover:text-white'
                  }`}
              >
                {m === 'doc' ? '📖 Documentation' : '▶ Tutoriels vidéo'}
              </button>
            ))}
          </div>

          {/* ════════════════════════════════════════════════════════════════
              PAGE DOC
          ════════════════════════════════════════════════════════════════ */}
          {page === 'doc' && (
            <>
              {/* HERO */}
              <div className="mb-16 pb-12 border-b border-white/[0.06]">
                <p className="text-[0.7rem] font-mono text-cyan-400 uppercase tracking-[0.12em] mb-3">
                  Documentation officielle · v2.0
                </p>
                <h1 className="text-[2.6rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-4"
                  style={{ background: 'linear-gradient(135deg,#fff 20%,#94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Centre d'aide<br />Konza RH
                </h1>
                <p className="text-[0.95rem] text-slate-400 max-w-[520px] leading-[1.8]">
                  De l'inscription à votre première paie, tout ce qu'il vous faut pour prendre en main la plateforme — sans contacter le support.
                </p>
                <div className="flex gap-2 flex-wrap mt-6">
                  <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-3 py-[0.3rem] rounded-full border border-cyan-400/20 text-cyan-400 bg-cyan-400/[0.06]">✦ Guide complet A–Z</span>
                  <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-3 py-[0.3rem] rounded-full border border-emerald-400/20 text-emerald-400 bg-emerald-400/[0.06]">✓ Mis à jour 2025</span>
                  <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-3 py-[0.3rem] rounded-full border border-white/[0.11] text-slate-400 bg-[#0b1121]">🇨🇬 Conforme droit congolais</span>
                </div>
              </div>

              {/* ── 01 INSCRIPTION ────────────────────────────────────────────── */}
              <section id="inscription" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="01" title="Inscription & première connexion" badge={{ label: 'Point de départ', type: 'req' }} />
                <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
                  Tout commence ici. Suivez ces étapes dans l'ordre — chaque étape débloque la suivante. Ne sautez pas la configuration entreprise : les bulletins de paie en dépendent.
                </p>

                {/* Flow */}
                <div className="relative pl-10 my-6">
                  <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-400 to-cyan-400/10" />
                  {[
                    { n:'01', t:'Créer votre compte', c: <><strong className="text-white">hrcongo.app/auth/register</strong>. Saisissez votre email professionnel, choisissez un mot de passe fort. Un email de confirmation est envoyé automatiquement.</> },
                    { n:'02', t:'Confirmer votre email', c: <>Cliquez sur le lien reçu par email (valable 24h). Sans cette étape, votre accès est limité. Vérifiez vos spams si vous ne recevez rien.</> },
                    { n:'03', t:'Configurer votre entreprise ou cabinet', c: <>Après connexion, un assistant vous guide pour créer votre entreprise (PME) ou votre cabinet. C'est la seule fois que cet assistant apparaît — ne le fermez pas.</> },
                    { n:'04', t:'Créer vos départements', c: <>Avant d'ajouter des employés, créez au moins un département. Les employés y seront rattachés lors de leur création.</> },
                    { n:'05', t:'Ajouter vos employés & générer la paie', c: <>Une fois les départements créés, ajoutez vos employés (manuellement ou via Excel), puis rendez-vous dans <strong className="text-white">Paie</strong> pour générer votre premier bulletin.</> },
                  ].map(s => (
                    <FlowStep key={s.n} n={s.n} title={s.t}>{s.c}</FlowStep>
                  ))}
                </div>

                <InfoBlock type="tip" icon="💡">
                  <strong className="font-semibold block mb-[2px]">Conseil</strong>
                  Pour un premier test, créez un seul département + un employé fictif, puis générez son bulletin. Cela vous permet de valider la configuration avant l'import de masse.
                </InfoBlock>
              </section>

              {/* ── 02 RÔLES ──────────────────────────────────────────────────── */}
              <section id="roles" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="02" title="Rôles & permissions" />
                <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
                  Konza RH dispose de 4 niveaux d'accès. L'accès aux modules dépend du rôle assigné lors de la création du compte.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
                  <RoleCard badge="ADMIN"      badgeClass="bg-cyan-400/10 text-cyan-400"   perms={['Accès total à tous les modules','Configuration entreprise & système','Gestion de la paie & validation','Gestion des utilisateurs & rôles']} />
                  <RoleCard badge="RH MANAGER" badgeClass="bg-emerald-400/10 text-emerald-400" perms={['Gestion complète des employés','Création & validation bulletins','Gestion présences & congés','Prêts & avances sur salaire']} />
                  <RoleCard badge="MANAGER"    badgeClass="bg-amber-400/10 text-amber-400"  perms={['Voir les profils de son équipe','Valider les congés de son équipe','Pointage et présences équipe','Ses propres présences']} />
                  <RoleCard badge="EMPLOYÉ"    badgeClass="bg-white/[0.06] text-slate-400"  perms={['Consulter sa fiche de paie','Pointer via GPS','Soumettre des demandes de congé','Voir son planning & matériel']} />
                </div>
                <InfoBlock type="note" icon="ℹ️">
                  <strong className="font-semibold block mb-[2px]">Inviter un utilisateur</strong>
                  Allez dans <code className="font-mono text-[0.77em] bg-[#111827] border border-white/[0.11] rounded px-[5px] py-[1px] text-cyan-300">Paramètres → Gestion Utilisateurs → Inviter un utilisateur</code>. Saisissez l'email, choisissez le rôle, validez. L'utilisateur reçoit un lien d'activation valable 24h.
                </InfoBlock>
              </section>

              {/* ── 03 ENTREPRISE / CABINET ───────────────────────────────────── */}
              <section id="entreprise-cabinet" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="03" title="Entreprise & Cabinet" badge={{ label: 'Priorité 1', type: 'req' }} />
                <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
                  Selon votre situation, choisissez le mode qui correspond. Les deux modes sont distincts — un bouton vous permet de basculer entre les configurations.
                </p>

                {/* Type selector */}
                <div className="flex gap-4 my-4 mb-6">
                  {(['entreprise','cabinet'] as TypeMode[]).map(t => (
                    <div
                      key={t}
                      onClick={() => setTypeMode(t)}
                      className={`flex-1 border rounded-[12px] p-[1.1rem] cursor-pointer transition-all duration-200 bg-[#0b1121]
                        ${typeMode === t ? 'border-cyan-400 bg-cyan-400/[0.04]' : 'border-white/[0.06] hover:border-white/[0.11]'}`}
                    >
                      <div className="text-[1.5rem] mb-2">{t === 'entreprise' ? '🏢' : '🏛️'}</div>
                      <h4 className="text-[0.88rem] font-semibold text-white mb-[0.25rem]">
                        {t === 'entreprise' ? 'Mode Entreprise' : 'Mode Cabinet'}
                      </h4>
                      <p className="text-[0.75rem] text-slate-500 leading-[1.55]">
                        {t === 'entreprise'
                          ? 'Je gère une seule société (PME, TPE, start-up)'
                          : 'Je gère plusieurs sociétés (cabinet RH, comptable, DRH externalisée)'}
                      </p>
                    </div>
                  ))}
                </div>

                {typeMode === 'entreprise' && (
                  <>
                    <PathCrumb>Paramètres → <span className="text-cyan-400">Entreprise</span></PathCrumb>
                    <GuideCard icon="🏢" iconBg="bg-cyan-400/10" title="Configurer votre entreprise">
                      {[
                        <>Renseignez la <strong className="text-white">raison sociale</strong> telle qu'elle apparaît sur vos documents officiels.</>,
                        <>Entrez le <strong className="text-white">RCCM / NIF</strong> de votre société (utilisé sur les déclarations CNSS).</>,
                        <>Saisissez l'<strong className="text-white">adresse complète</strong>, le téléphone et l'email RH.</>,
                        <>Téléversez votre <strong className="text-white">logo</strong> (PNG fond transparent recommandé) — il apparaîtra sur tous les bulletins.</>,
                        <>Configurez le <strong className="text-white">rayon GPS autorisé</strong> en mètres pour le pointage des employés.</>,
                        <>Définissez le <strong className="text-white">jour de paiement des salaires</strong> (ex : le 5 du mois suivant).</>,
                        <>Cliquez sur <strong className="text-white">Enregistrer</strong>. Ces paramètres prennent effet immédiatement.</>,
                      ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                    </GuideCard>
                    <InfoBlock type="warn" icon="⚠️">
                      <strong className="font-semibold block mb-[2px]">Attention GPS</strong>
                      Si vous ne configurez pas la localisation GPS, le module de pointage GPS sera désactivé pour tous vos employés.
                    </InfoBlock>
                  </>
                )}

                {typeMode === 'cabinet' && (
                  <>
                    <PathCrumb>Cabinet → <span className="text-cyan-400">Créer / Gérer mes PME</span></PathCrumb>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <GuideCard icon="🏛️" iconBg="bg-cyan-400/10" title="Créer un cabinet">
                        {[
                          <>Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Cabinet → Créer mon cabinet</code>.</>,
                          <>Donnez un <strong className="text-white">nom à votre structure</strong> (ex : "Cabinet Dupont RH").</>,
                          <>Votre compte devient le compte principal avec accès total à toutes les PME.</>,
                          <>Votre tableau de bord affiche maintenant toutes les PME rattachées.</>,
                        ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                      </GuideCard>
                      <GuideCard icon="🏢" iconBg="bg-emerald-400/10" title="Ajouter une PME">
                        {[
                          <>Dans le dashboard cabinet, cliquez <strong className="text-white">Ajouter une PME</strong>.</>,
                          <>Renseignez les infos légales : raison sociale, RCCM, adresse.</>,
                          <>Chaque PME dispose de sa propre config, ses employés et sa paie.</>,
                          <>Basculez entre PME via le <strong className="text-white">sélecteur d'entreprise</strong> en haut à gauche.</>,
                        ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                      </GuideCard>
                    </div>
                    <InfoBlock type="note" icon="ℹ️">
                      <strong className="font-semibold block mb-[2px]">Isolation totale</strong>
                      Chaque PME est isolée : ses employés, sa paie, ses documents et sa configuration sont totalement indépendants. Un seul abonnement Cabinet couvre toutes les PME rattachées.
                    </InfoBlock>
                  </>
                )}
              </section>

              {/* ── 04 DÉPARTEMENTS ───────────────────────────────────────────── */}
              <section id="departements" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="04" title="Créer des départements" badge={{ label: 'Priorité 2', type: 'req' }} />
                <PathCrumb>Paramètres → <span className="text-cyan-400">Départements</span></PathCrumb>
                <GuideCard icon="📂" iconBg="bg-cyan-400/10" title="Ajouter un département">
                  {[
                    <>Cliquez sur <strong className="text-white">Nouveau département</strong>.</>,
                    <>Saisissez le <strong className="text-white">nom du service</strong> (ex : Direction, RH, Comptabilité, Terrain).</>,
                    <>Assignez un <strong className="text-white">Manager responsable</strong> si l'utilisateur existe déjà.</>,
                    <>Sauvegardez. Le département est disponible immédiatement lors de la création d'un employé.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
                <InfoBlock type="tip" icon="💡">
                  <strong className="font-semibold block mb-[2px]">Bonne pratique</strong>
                  Créez tous vos départements avant d'importer vos employés via Excel — sinon le rattachement échouera.
                </InfoBlock>
              </section>

              {/* ── 05 UTILISATEURS ───────────────────────────────────────────── */}
              <section id="utilisateurs" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="05" title="Gestion des utilisateurs" />
                <PathCrumb>Paramètres → <span className="text-cyan-400">Gestion Utilisateurs</span></PathCrumb>
                <GuideCard icon="👥" iconBg="bg-emerald-400/10" title="Inviter un utilisateur">
                  {[
                    <>Cliquez sur <strong className="text-white">Inviter un utilisateur</strong>.</>,
                    <>Saisissez l'adresse email et choisissez le <strong className="text-white">rôle</strong> approprié.</>,
                    <>Validez. L'utilisateur reçoit un email d'invitation avec un lien d'activation valable <strong className="text-white">24h</strong>.</>,
                    <>Pour réinitialiser un mot de passe : options <code className="font-mono text-[0.77em] text-cyan-300">⋯</code> → <em>« Envoyer un lien de réinitialisation »</em>.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
              </section>

              {/* ── 06 PARAMÈTRES PAIE ────────────────────────────────────────── */}
              <section id="paie-config" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="06" title="Paramètres de paie" badge={{ label: 'Critique', type: 'crit' }} />
                <PathCrumb>Paramètres → <span className="text-cyan-400">Paramètres de Paie</span></PathCrumb>
                <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
                  Les calculs (CNSS, ITS, TOL, CAMU) sont automatisés selon la législation congolaise. Ces paramètres pilotent chaque bulletin généré — vérifiez-les avant toute paie.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GuideCard icon="%" iconBg="bg-emerald-400/10" title="CNSS & ITS">
                    {[
                      <>Vérifiez le <strong className="text-white">taux CNSS salarial</strong> (4 % par défaut).</>,
                      <>Vérifiez le <strong className="text-white">taux CNSS patronal</strong> (16,5 % par défaut).</>,
                      <>Configurez le <strong className="text-white">barème ITS</strong> selon vos options fiscales.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                  <GuideCard icon="⚙️" iconBg="bg-amber-400/10" title="Heures supp & primes">
                    {[
                      <>Définissez le <strong className="text-white">taux majoré</strong> des heures supplémentaires.</>,
                      <>Créez vos <strong className="text-white">types de primes</strong> dans le Catalogue des Primes.</>,
                      <>Configurez <strong className="text-white">TOL, CAMU</strong> et autres cotisations.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                </div>
              </section>

              {/* ── 07 EMPLOYÉS ───────────────────────────────────────────────── */}
              <section id="employes" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="07" title="Créer un employé" />
                <PathCrumb>Employés → <span className="text-cyan-400">Nouveau → Formulaire</span></PathCrumb>
                <GuideCard icon="👤" iconBg="bg-cyan-400/10" title="Formulaire en 4 étapes">
                  {[
                    <><strong className="text-white">Identité</strong> — Nom, prénom, date de naissance, photo, nationalité.</>,
                    <><strong className="text-white">Situation familiale</strong> — Statut matrimonial, nombre d'enfants (impacte les calculs ITS).</>,
                    <><strong className="text-white">Poste & contrat</strong> — Département, poste, type de contrat (CDI/CDD/Stage), date d'embauche, salaire de base.</>,
                    <><strong className="text-white">Validation</strong> — Vérifiez le récapitulatif avant de confirmer.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
              </section>

              {/* ── 08 IMPORT ─────────────────────────────────────────────────── */}
              <section id="import" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="08" title="Import en masse via Excel" badge={{ label: 'Recommandé', type: 'opt' }} />
                <PathCrumb>Employés → <span className="text-cyan-400">Importer</span></PathCrumb>
                <GuideCard icon="📊" iconBg="bg-emerald-400/10" title="Procédure d'import">
                  {[
                    <>Téléchargez le <strong className="text-white">modèle Excel</strong> fourni sur la page d'import.</>,
                    <>Remplissez les colonnes obligatoires : <code className="font-mono text-[0.77em] text-cyan-300">prénom</code>, <code className="font-mono text-[0.77em] text-cyan-300">nom</code>, <code className="font-mono text-[0.77em] text-cyan-300">département</code>, <code className="font-mono text-[0.77em] text-cyan-300">salaire_base</code>.</>,
                    <>Vérifiez que les <strong className="text-white">noms de départements</strong> correspondent exactement à ceux créés dans Paramètres.</>,
                    <>Glissez le fichier dans la zone d'import ou cliquez pour le sélectionner.</>,
                    <>L'interface affiche un <strong className="text-white">rapport de validation</strong> avec les lignes en erreur avant confirmation.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
                <InfoBlock type="warn" icon="⚠️">
                  <strong className="font-semibold block mb-[2px]">Format requis</strong>
                  Seul le format <code className="font-mono text-[0.77em] text-amber-200">.xlsx</code> est accepté. Les lignes avec un département inexistant seront rejetées.
                </InfoBlock>
              </section>

              {/* ── 09 CONTRATS ───────────────────────────────────────────────── */}
              <section id="contrats" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="09" title="Gestion des contrats" />
                <PathCrumb>Employé → <span className="text-cyan-400">Fiche → Contrat</span></PathCrumb>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GuideCard icon="📄" iconBg="bg-cyan-400/10" title="Créer un contrat">
                    {[
                      <>Ouvrez la fiche de l'employé concerné.</>,
                      <>Onglet Contrat → cliquez <strong className="text-white">Nouveau contrat</strong>.</>,
                      <>Choisissez le type (CDI, CDD…), la date de début, la durée si CDD.</>,
                      <>Téléversez le document signé en PDF.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                  <GuideCard icon="✂️" iconBg="bg-amber-400/10" title="Rupture de contrat">
                    {[
                      <>Depuis la fiche employé, cliquez <strong className="text-white">Rompre le contrat</strong>.</>,
                      <>Sélectionnez le motif (démission, licenciement, fin CDD…).</>,
                      <>Indiquez la date de fin effective.</>,
                      <>Le statut passe automatiquement à <code className="font-mono text-[0.77em] text-cyan-300">Suspendu</code>.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                </div>
                <InfoBlock type="tip" icon="💡">
                  <strong className="font-semibold block mb-[2px]">Alertes CDD</strong>
                  Konza affiche une alerte automatique lorsqu'un contrat CDD arrive à échéance dans les 30 jours.
                </InfoBlock>
              </section>

              {/* ── 10 POINTAGE GPS ───────────────────────────────────────────── */}
              <section id="pointage" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="10" title="Pointage GPS" />
                <PathCrumb>Présences → <span className="text-cyan-400">Ma Pointeuse GPS</span></PathCrumb>
                <GuideCard icon="📍" iconBg="bg-emerald-400/10" title="Comment pointer (employé / manager)">
                  {[
                    <>Ouvrez Konza RH sur votre téléphone ou navigateur depuis les locaux.</>,
                    <>Autorisez la <strong className="text-white">géolocalisation</strong> du navigateur quand la demande apparaît.</>,
                    <>L'application vérifie votre distance par rapport au périmètre autorisé.</>,
                    <>Si validé, cliquez <strong className="text-white">Pointer l'arrivée</strong>. En fin de journée : <strong className="text-white">Pointer le départ</strong>.</>,
                    <>La présence est enregistrée en temps réel dans la vue journalière.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <InfoBlock type="warn" icon="⚠️"><strong className="font-semibold block mb-[2px]">Hors zone</strong>Si l'employé est hors périmètre, l'app bloque le pointage. L'admin peut corriger via le Pointage manuel.</InfoBlock>
                  <InfoBlock type="note" icon="📱"><strong className="font-semibold block mb-[2px]">Mode hors-ligne</strong>Le pointage est mis en file d'attente et synchronisé dès que la connexion revient.</InfoBlock>
                </div>
              </section>

              {/* ── 11 POINTAGE MANUEL ────────────────────────────────────────── */}
              <section id="pointage-manuel" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="11" title="Pointage manuel" />
                <PathCrumb>Présences → <span className="text-cyan-400">Pointage Manuel</span></PathCrumb>
                <GuideCard icon="✏️" iconBg="bg-amber-400/10" title="Saisir ou corriger une présence">
                  {[
                    <>Sélectionnez l'<strong className="text-white">employé</strong> concerné dans la liste.</>,
                    <>Choisissez la <strong className="text-white">date</strong> à corriger ou à compléter.</>,
                    <>Saisissez l'heure d'<strong className="text-white">arrivée</strong> et l'heure de <strong className="text-white">départ</strong>.</>,
                    <>Ajoutez une <strong className="text-white">note de justification</strong> (obligatoire pour les corrections).</>,
                    <>Enregistrez. La correction apparaît avec la mention <code className="font-mono text-[0.77em] text-cyan-300">Manuel</code>.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
              </section>

              {/* ── 12 SHIFTS ─────────────────────────────────────────────────── */}
              <section id="shifts" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="12" title="Planning de shifts" />
                <PathCrumb>Présences → <span className="text-cyan-400">Shifts</span></PathCrumb>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GuideCard icon="📅" iconBg="bg-cyan-400/10" title="Créer un shift">
                    {[
                      <>Cliquez sur <strong className="text-white">Nouveau shift</strong>.</>,
                      <>Nommez-le (ex : <code className="font-mono text-[0.77em] text-cyan-300">Matin 7h–15h</code>) et définissez les horaires.</>,
                      <>Activez <strong className="text-white">Shift de nuit</strong> si applicable (déclenche la prime nuit).</>,
                      <>Choisissez une couleur et sauvegardez.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                  <GuideCard icon="👤" iconBg="bg-emerald-400/10" title="Assigner un shift">
                    {[
                      <>Cliquez <strong className="text-white">Assigner</strong> en haut de la page.</>,
                      <>Sélectionnez le shift, puis l'employé.</>,
                      <>Choisissez <strong className="text-white">Date précise</strong> ou <strong className="text-white">Récurrent</strong> (par jour de semaine).</>,
                      <>Confirmez — l'employé apparaît dans <em>Employés &amp; Plannings</em>.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                </div>
              </section>

              {/* ── 13 PAIE INDIVIDUELLE ──────────────────────────────────────── */}
              <section id="paie" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="13" title="Bulletin de paie individuel" />
                <PathCrumb>Paie → <span className="text-cyan-400">Nouveau bulletin</span></PathCrumb>
                <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
                  Les calculs (CNSS, ITS, TOL, CAMU) sont entièrement automatisés selon la législation congolaise. Vous n'avez rien à configurer manuellement.
                </p>
                <GuideCard icon="💸" iconBg="bg-emerald-400/10" title="Générer un bulletin">
                  {[
                    <>Cliquez sur <strong className="text-white">Nouveau bulletin</strong> dans le menu Paie.</>,
                    <>Sélectionnez l'<strong className="text-white">employé</strong> et le <strong className="text-white">mois de paie</strong>.</>,
                    <>Le système pré-remplit le salaire de base depuis la fiche employé.</>,
                    <>Ajoutez les <strong className="text-white">heures supplémentaires</strong>, <strong className="text-white">primes</strong> ou <strong className="text-white">déductions</strong> si applicable.</>,
                    <>Vérifiez l'<strong className="text-white">aperçu</strong> avec CNSS, ITS et net à payer calculés automatiquement.</>,
                    <>Validez. Une fois le virement effectué, marquez le bulletin comme <strong className="text-white">Payé</strong>.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
              </section>

              {/* ── 14 PAIE EN MASSE ──────────────────────────────────────────── */}
              <section id="paie-masse" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="14" title="Paie en masse" badge={{ label: 'Gain de temps', type: 'opt' }} />
                <PathCrumb>Paie → <span className="text-cyan-400">Paie en masse</span></PathCrumb>
                <GuideCard icon="⚡" iconBg="bg-cyan-400/10" title="Lancer une paie groupée">
                  {[
                    <><strong className="text-white">Période</strong> — Choisissez le mois et l'année de paie.</>,
                    <><strong className="text-white">Sélection</strong> — Filtrez par département ou sélectionnez tous les employés.</>,
                    <><strong className="text-white">Traitement</strong> — Konza calcule automatiquement tous les bulletins.</>,
                    <>Une fenêtre récapitule la <strong className="text-white">masse salariale totale</strong>.</>,
                    <>Bulletins disponibles dans <strong className="text-white">Paie → Historique</strong>.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
                <InfoBlock type="tip" icon="💡">
                  <strong className="font-semibold block mb-[2px]">Simulateur</strong>
                  Avant de lancer la paie, utilisez <code className="font-mono text-[0.77em] text-emerald-200">Paie → Simulateur</code> pour tester un scénario sans générer de bulletins réels.
                </InfoBlock>
              </section>

              {/* ── 15 IMPAYÉS ────────────────────────────────────────────────── */}
              <section id="impayes" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="15" title="Suivi des impayés" />
                <PathCrumb>Paie → <span className="text-cyan-400">Impayés</span></PathCrumb>
                <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
                  Cette page détecte automatiquement les retards de salaire en comparant la date de paiement prévue (configurée dans Paramètres entreprise) avec l'état réel des bulletins. Aucune action manuelle n'est requise pour qu'une alerte apparaisse.
                </p>
                <GuideCard icon="⚠️" iconBg="bg-amber-400/10" title="Comment fonctionne la détection">
                  {[
                    <><strong className="text-white">J-3 avant la date prévue</strong> — Une alerte bleue apparaît pour vous rappeler de préparer les virements.</>,
                    <><strong className="text-white">Date dépassée, aucun bulletin</strong> — Alerte violette : la paie n'a pas été lancée. Le montant affiché est approximatif.</>,
                    <><strong className="text-white">Bulletin généré mais non payé</strong> — Alerte orange : bulletin en brouillon ou validé mais le paiement n'est pas confirmé.</>,
                    <><strong className="text-white">Marquer comme payé</strong> — Une fois le virement effectué, marquez le bulletin comme <code className="font-mono text-[0.77em] text-cyan-300">Payé</code> dans <em>Paie → Bulletins</em> pour clôturer l'alerte.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
                <InfoBlock type="warn" icon="⚠️">
                  <strong className="font-semibold block mb-[2px]">Art. 95 CT Congo</strong>
                  Les salaires doivent être payés à intervalles réguliers et à date fixe. 3 mois de retard = droit de saisir l'Inspection du Travail.
                </InfoBlock>
              </section>

              {/* ── 16 PRÊTS ──────────────────────────────────────────────────── */}
              <section id="loans" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="16" title="Prêts & avances sur salaire" />
                <PathCrumb>Avances & Prêts → <span className="text-cyan-400">Nouveau financement</span></PathCrumb>
                <GuideCard icon="🤝" iconBg="bg-amber-400/10" title="Enregistrer un prêt">
                  {[
                    <>Cliquez sur <strong className="text-white">Nouveau Financement</strong>.</>,
                    <>Sélectionnez l'<strong className="text-white">employé bénéficiaire</strong> et le type : avance ponctuelle ou prêt échelonné.</>,
                    <>Saisissez le <strong className="text-white">montant</strong> et, pour les prêts, le nombre de mensualités.</>,
                    <>Le remboursement est <strong className="text-white">déduit automatiquement</strong> du bulletin chaque mois.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
              </section>

              {/* ── 17 CONGÉS ─────────────────────────────────────────────────── */}
              <section id="conges" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="17" title="Gestion des congés" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GuideCard icon="🌴" iconBg="bg-cyan-400/10" title="Employé — faire une demande">
                    {[
                      <>Allez dans <strong className="text-white">Mes Demandes</strong>.</>,
                      <>Cliquez <strong className="text-white">Nouvelle demande</strong>, choisissez les dates.</>,
                      <>Sélectionnez le type (annuel, maladie…).</>,
                      <>Soumettez. Le manager est notifié.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                  <GuideCard icon="✅" iconBg="bg-emerald-400/10" title="Manager — valider">
                    {[
                      <>Allez dans <strong className="text-white">Validation Congés</strong>.</>,
                      <>Consultez les demandes en attente.</>,
                      <>Approuvez ou refusez avec une note.</>,
                      <>L'employé reçoit une notification.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                </div>
              </section>

              {/* ── 18 CNSS ───────────────────────────────────────────────────── */}
              <section id="cnss" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="18" title="Déclaration CNSS" />
                <PathCrumb>Rapports → <span className="text-cyan-400">Déclarations</span></PathCrumb>
                <GuideCard icon="🏛️" iconBg="bg-cyan-400/10" title="Déclaration mensuelle">
                  {[
                    <>Assurez-vous que tous les bulletins du mois sont générés et validés.</>,
                    <>Allez dans <strong className="text-white">Déclarations</strong> et sélectionnez le mois concerné.</>,
                    <>Konza calcule automatiquement les cotisations patronales et salariales.</>,
                    <>Exportez au format PDF ou Excel selon la CNSS.</>,
                  ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                </GuideCard>
              </section>

              {/* ── 19 RECRUTEMENT ────────────────────────────────────────────── */}
              <section id="recrutement" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="19" title="Recrutement" />
                <PathCrumb>Recrutement</PathCrumb>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <GuideCard icon="📋" iconBg="bg-cyan-400/10" title="Mode manuel">
                    {[
                      <>Créez une <strong className="text-white">offre d'emploi</strong> avec intitulé, description, critères.</>,
                      <>Gérez les candidatures dans le kanban.</>,
                      <>Faites progresser les candidats par étapes.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                  <GuideCard icon="🤖" iconBg="bg-emerald-400/10" title="Mode IA">
                    {[
                      <>Activez le <strong className="text-white">mode IA</strong> pour le scoring automatique des CVs.</>,
                      <>L'IA analyse les compétences et classe les candidats.</>,
                      <>Consultez les analytics pour optimiser vos offres.</>,
                    ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
                  </GuideCard>
                </div>
              </section>

              {/* ── 20 FORMATION ──────────────────────────────────────────────── */}
              <section id="formation" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="20" title="Formation" />
                <PathCrumb>Formation</PathCrumb>
                <p className="text-[0.88rem] text-slate-400 leading-[1.8]">
                  Gérez le plan de formation de vos équipes : créez des sessions, assignez des participants et suivez les compétences développées. Les formations terminées sont consignées dans le dossier de chaque employé.
                </p>
              </section>

              {/* ── 21 MATÉRIEL ───────────────────────────────────────────────── */}
              <section id="materiel" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="21" title="Gestion du matériel" />
                <PathCrumb>Matériel</PathCrumb>
                <p className="text-[0.88rem] text-slate-400 leading-[1.8]">
                  Enregistrez les équipements attribués à chaque employé (ordinateur, véhicule, téléphone…). Lors d'une rupture de contrat, la liste du matériel à restituer est générée automatiquement.
                </p>
              </section>

              {/* ── FAQ ───────────────────────────────────────────────────────── */}
              <section id="faq" className="mb-[4.5rem] scroll-mt-[2rem]">
                <SectionHead num="—" title="Questions fréquentes" />
                <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] overflow-hidden">
                  <FaqItem defaultOpen q="Pourquoi mon bulletin de paie a un montant incorrect ?"
                    a={<>Vérifiez d'abord les Paramètres de Paie (taux CNSS, barème ITS). Ensuite, ouvrez la fiche de l'employé et confirmez que son salaire de base est correct. Vérifiez enfin les primes et déductions ajoutées manuellement. Vous pouvez modifier un bulletin via <code className="font-mono text-[0.77em] text-cyan-300">Paie → [bulletin] → Modifier</code>.</>} />
                  <FaqItem q="Un employé ne peut pas pointer en GPS — que faire ?"
                    a={<>Vérifiez que la localisation GPS est activée dans <code className="font-mono text-[0.77em] text-cyan-300">Paramètres → Entreprise</code> et que le rayon autorisé est suffisant. Assurez-vous que l'employé autorise la géolocalisation dans son navigateur. En dernier recours, utilisez le Pointage Manuel.</>} />
                  <FaqItem q="Comment réinitialiser le mot de passe d'un utilisateur ?"
                    a={<>Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Paramètres → Gestion Utilisateurs</code>, trouvez l'utilisateur et cliquez sur les options <code className="font-mono text-[0.77em] text-cyan-300">⋯</code>. Sélectionnez "Envoyer un lien de réinitialisation". Le lien est valable 24h.</>} />
                  <FaqItem q="Les impayés apparaissent même si je n'ai pas généré de bulletin — est-ce normal ?"
                    a={<>Oui, c'est voulu. Le système détecte les retards basés sur la date de paiement prévue et non sur l'existence d'un bulletin. Si la date est dépassée et qu'aucun bulletin n'est généré, c'est considéré comme un retard. Le montant affiché est alors <strong>approximatif</strong>. Pour clôturer l'alerte : générez le bulletin, effectuez le virement, puis marquez le bulletin comme <code className="font-mono text-[0.77em] text-cyan-300">Payé</code>.</>} />
                  <FaqItem q="Peut-on gérer plusieurs entreprises depuis un seul compte ?"
                    a={<>Oui, via le Mode Cabinet. Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Cabinet → Créer mon cabinet</code>, puis ajoutez vos PME. Chaque PME dispose de sa propre configuration, employés et paie, accessibles depuis un tableau de bord central.</>} />
                  <FaqItem q="Comment exporter les données pour la comptabilité ?"
                    a={<>Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Rapports → Comptabilité</code>. Vous pouvez exporter le journal de paie, le récapitulatif des cotisations et le grand livre RH au format Excel ou PDF.</>} />
                  <FaqItem q="Les données sont-elles sauvegardées automatiquement ?"
                    a={<>Oui. Toutes les données sont sauvegardées en temps réel sur nos serveurs. Le mode hors-ligne stocke temporairement les pointages en local et les synchronise dès que la connexion revient.</>} />
                </div>
              </section>

              {/* Footer doc */}
              <div className="mt-16 pt-6 border-t border-white/[0.06] flex items-center justify-between text-[0.75rem] text-slate-500">
                <span>Konza RH · Centre d'aide v2.0</span>
                <span>Besoin d'aide ? Contactez le support via l'application.</span>
              </div>
            </>
          )}

          {/* ════════════════════════════════════════════════════════════════
              PAGE VIDÉOS
          ════════════════════════════════════════════════════════════════ */}
          {page === 'videos' && (
            <>
              {/* Hero vidéos */}
              <div className="mb-10">
                <p className="text-[0.7rem] font-mono text-cyan-400 uppercase tracking-[0.12em] mb-3">Tutoriels vidéo</p>
                <h1 className="text-[2rem] font-extrabold tracking-[-0.04em] mb-3"
                  style={{ background: 'linear-gradient(135deg,#fff 20%,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                 Apprenez Konza RH<br />en vidéo
                </h1>
                <p className="text-[0.9rem] text-slate-400 max-w-[480px] leading-[1.8]">
                  Courtes vidéos de démonstration pour chaque module. Cliquez sur une vidéo pour l'ouvrir sur YouTube.
                </p>
              </div>

              {/* Démarrage */}
              <section id="vid-demarrage" className="mb-[4.5rem] scroll-mt-[2rem]">
                <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
                  <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Démarrage</span><h2 className="text-[1.3rem] font-bold text-white">Premiers pas</h2></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_1" module="Démarrage" duration="2:30" title="Créer votre compte & première configuration" desc="De l'inscription à votre premier tableau de bord en moins de 3 minutes." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_2" module="Démarrage" duration="3:15" title="Configurer votre entreprise & départements" desc="Paramètres essentiels : logo, RCCM, GPS et structure organisationnelle." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_3" module="Démarrage" duration="1:45" title="Inviter des utilisateurs & assigner des rôles" desc="Créer des comptes RH Manager, Manager et Employé depuis les paramètres." />
                </div>
              </section>

              {/* Employés */}
              <section id="vid-employes" className="mb-[4.5rem] scroll-mt-[2rem]">
                <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
                  <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Employés</span><h2 className="text-[1.3rem] font-bold text-white">Gestion des employés</h2></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_4" module="Employés" duration="4:00" title="Ajouter un employé manuellement" desc="Remplir le formulaire complet : identité, contrat, salaire de base." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_5" module="Employés" duration="3:30" title="Import Excel — ajouter 50 employés en 2 minutes" desc="Télécharger le modèle, le remplir et importer avec rapport de validation." />
                </div>
              </section>

              {/* Présences */}
              <section id="vid-presences" className="mb-[4.5rem] scroll-mt-[2rem]">
                <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
                  <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Présences</span><h2 className="text-[1.3rem] font-bold text-white">Pointage & plannings</h2></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_6" module="Présences" duration="2:20" title="Pointage GPS — pointer son arrivée" desc="Démonstration complète du pointage depuis un téléphone mobile." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_7" module="Présences" duration="2:50" title="Créer et assigner des shifts de travail" desc="Planifier des horaires matin/soir/nuit et les assigner aux équipes." />
                </div>
              </section>

              {/* Paie */}
              <section id="vid-paie" className="mb-[4.5rem] scroll-mt-[2rem]">
                <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
                  <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Paie</span><h2 className="text-[1.3rem] font-bold text-white">Bulletins & paiements</h2></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_8" module="Paie" duration="5:10" title="Générer un bulletin de paie individuel" desc="De la création à la validation avec CNSS, ITS et net à payer calculés." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_9" module="Paie" duration="4:00" title="Paie en masse — tout un département" desc="Lancer la paie pour 30 employés simultanément en quelques clics." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_10" module="Paie" duration="3:20" title="Suivi des impayés — comprendre les alertes" desc="Comment lire le tableau de bord impayés et marquer un paiement comme effectué." />
                </div>
              </section>

              {/* Autres */}
              <section id="vid-autres" className="mb-[4.5rem] scroll-mt-[2rem]">
                <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
                  <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Autres</span><h2 className="text-[1.3rem] font-bold text-white">Modules complémentaires</h2></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_11" module="Congés" duration="2:45" title="Demande et validation de congés" desc="Processus complet de demande employé à validation manager." />
                  <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_12" module="CNSS" duration="3:00" title="Générer la déclaration CNSS mensuelle" desc="Export automatique des cotisations pour la CNSS Congo." />
                </div>
              </section>

              {/* CTA YouTube */}
              <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] p-8 text-center mb-16">
                <h3 className="text-[1.1rem] font-bold text-white mb-2">Voir toutes nos vidéos sur YouTube</h3>
                <p className="text-[0.85rem] text-slate-400 mb-5">Notre chaîne YouTube contient l'intégralité des tutoriels et est mise à jour à chaque nouvelle fonctionnalité.</p>
                <a
                  href="https://youtube.com/@KonzaRH"
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 px-[1.4rem] py-[0.65rem] bg-[#ff0000] text-white text-[0.85rem] font-bold rounded-[10px] hover:opacity-90 transition-opacity"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.5 9.5.5 9.5.5s7.6 0 9.5-.5c1-.3 1.7-1.1 2-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
                  </svg>
                  Voir la chaîne YouTube
                </a>
              </div>
            </>
          )}

        </main>
      </div>

      {/* Footer de la landing */}
      <Footer />
    </>
  );
}