'use client';

// ============================================================================
// 📁 app/docs/page.tsx  —  Centre d'aide Konza RH
// ============================================================================
// ✅ Sidebar sticky (position:fixed)
// ✅ Switcher Guide / Vidéos
// ✅ Entreprise ↔ Cabinet : bouton toggle, jamais les deux en même temps
// ✅ Captures d'écran avec lightbox (scroll horizontal par section)
// ✅ Vidéos lues DIRECTEMENT sur le site (player natif), pas redirect YouTube
// ✅ Vrais barèmes ITS 2026 + CNSS exacts depuis le backend
// ✅ Fond #020617 identique à la landing
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageView   = 'doc' | 'videos';
type CompanyMode = 'entreprise' | 'cabinet';
type AlertType  = 'tip' | 'warn' | 'note';

interface NavLink  { href: string; label: string; }
interface NavGroup { label: string; links: NavLink[]; }
interface Step     { text: React.ReactNode; }
interface GuideCardProps {
  icon: string;
  iconColor: 'cyan' | 'green' | 'amber';
  title: string;
  steps: Step[];
}
interface ScreenshotItem {
  src: string;
  alt: string;
  caption: string;
}
interface VideoItem {
  videoSrc: string;   // chemin local /videos/... ou URL externe
  thumb?: string;
  duration: string;
  module: string;
  title: string;
  desc: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DOC_NAV: NavGroup[] = [
  {
    label: 'Démarrage',
    links: [
      { href: '#inscription',       label: 'Inscription & connexion' },
      { href: '#roles',             label: 'Rôles & permissions'     },
    ],
  },
  {
    label: 'Configuration',
    links: [
      { href: '#entreprise-cabinet', label: 'Entreprise / Cabinet'  },
      { href: '#departements',       label: 'Départements'          },
      { href: '#utilisateurs',       label: 'Utilisateurs'          },
      { href: '#paie-config',        label: 'Barèmes & calculs paie' },
    ],
  },
  {
    label: 'Employés',
    links: [
      { href: '#employes', label: 'Créer un employé' },
      { href: '#import',   label: 'Import Excel'     },
      { href: '#contrats', label: 'Contrats'         },
    ],
  },
  {
    label: 'Présences',
    links: [
      { href: '#pointage',        label: 'Pointage GPS'    },
      { href: '#pointage-manuel', label: 'Pointage manuel' },
      { href: '#shifts',          label: 'Planning shifts' },
    ],
  },
  {
    label: 'Paie',
    links: [
      { href: '#paie',       label: 'Bulletin individuel' },
      { href: '#paie-masse', label: 'Paie en masse'       },
      { href: '#impayes',    label: 'Suivi impayés'       },
      { href: '#loans',      label: 'Prêts & avances'     },
    ],
  },
  {
    label: 'Autres modules',
    links: [
      { href: '#conges',      label: 'Congés'           },
      { href: '#cnss',        label: 'Déclaration CNSS' },
      { href: '#recrutement', label: 'Recrutement'      },
      { href: '#formation',   label: 'Formation'        },
      { href: '#materiel',    label: 'Matériel'         },
    ],
  },
  {
    label: 'FAQ',
    links: [{ href: '#faq', label: 'Questions fréquentes' }],
  },
];

const VIDEO_NAV: NavGroup[] = [
  {
    label: 'Par module',
    links: [
      { href: '#vid-demarrage', label: 'Démarrage'  },
      { href: '#vid-employes',  label: 'Employés'   },
      { href: '#vid-presences', label: 'Présences'  },
      { href: '#vid-paie',      label: 'Paie'       },
      { href: '#vid-autres',    label: 'Autres'     },
    ],
  },
];

// ─── Reusable components ──────────────────────────────────────────────────────

function SectionHead({
  num, title, badge,
}: {
  num: string;
  title: string;
  badge?: { text: string; type: 'req' | 'opt' | 'crit' };
}) {
  const badgeClass = {
    req:  'bg-amber-500/10 text-amber-400 border-amber-500/20',
    opt:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    crit: 'bg-red-500/10 text-red-400 border-red-500/20',
  }[badge?.type ?? 'req'];

  return (
    <div className="flex items-end gap-3 mb-6 pb-3 border-b border-white/[0.06]">
      <div>
        <span className="block font-mono text-[11px] text-slate-500 mb-0.5">{num}</span>
        <h2 className="text-[1.3rem] font-bold tracking-tight text-white">{title}</h2>
      </div>
      {badge && (
        <span className={`font-mono text-[10px] px-2 py-0.5 rounded border mb-0.5 font-semibold ${badgeClass}`}>
          {badge.text}
        </span>
      )}
    </div>
  );
}

function PathCrumb({ path }: { path: string }) {
  const parts = path.split('→').map(p => p.trim());
  return (
    <div className="inline-flex items-center gap-1 font-mono text-[11px] bg-white/[0.04] border border-white/10 rounded-md px-2.5 py-1 text-slate-400 mb-4">
      {parts.map((p, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-slate-600 mx-0.5">›</span>}
          <span className={i === parts.length - 1 ? 'text-cyan-400' : ''}>{p}</span>
        </span>
      ))}
    </div>
  );
}

function GuideCard({ icon, iconColor, title, steps }: GuideCardProps) {
  const colorClass = {
    cyan:  'bg-cyan-500/10',
    green: 'bg-emerald-500/10',
    amber: 'bg-amber-500/10',
  }[iconColor];

  return (
    <div className="bg-[#0b1121] border border-white/[0.06] rounded-2xl p-5 mb-3 hover:border-white/10 transition-colors">
      <div className="flex items-center gap-2 mb-4">
        <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm flex-shrink-0 ${colorClass}`}>
          {icon}
        </span>
        <span className="text-sm font-semibold text-white">{title}</span>
      </div>
      <ul className="space-y-0">
        {steps.map((s, i) => (
          <li key={i} className="flex gap-2.5 items-start text-[13px] text-slate-400 py-2 border-b border-white/[0.04] last:border-0">
            <span className="w-5 h-5 rounded-full bg-white/[0.04] border border-white/10 flex-shrink-0 flex items-center justify-center text-[10px] font-mono text-cyan-400 mt-0.5">
              {i + 1}
            </span>
            <span>{s.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function InfoBlock({ type, title, children }: { type: AlertType; title: string; children: React.ReactNode }) {
  const styles: Record<AlertType, string> = {
    tip:  'bg-emerald-500/[0.07] border-l-2 border-emerald-500 text-emerald-300',
    warn: 'bg-amber-500/[0.07]   border-l-2 border-amber-500  text-amber-300',
    note: 'bg-cyan-500/[0.06]    border-l-2 border-cyan-500   text-cyan-300',
  };
  const icons = { tip: '💡', warn: '⚠️', note: 'ℹ️' };
  return (
    <div className={`flex gap-2.5 items-start rounded-lg px-4 py-3 text-[13px] my-3 ${styles[type]}`}>
      <span className="flex-shrink-0 mt-0.5">{icons[type]}</span>
      <div>
        <strong className="block font-semibold mb-0.5">{title}</strong>
        <span className="opacity-80">{children}</span>
      </div>
    </div>
  );
}

function FaqItem({ q, children }: { q: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/[0.06] last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between gap-4 py-4 px-5 text-left text-[13.5px] font-medium text-white hover:bg-white/[0.02] transition-colors"
      >
        {q}
        <span className={`w-5 h-5 rounded-full border border-white/20 flex items-center justify-center text-slate-400 font-mono text-sm flex-shrink-0 transition-all duration-200 ${open ? 'rotate-45 bg-cyan-500/10 border-cyan-500/40 text-cyan-400' : ''}`}>
          +
        </span>
      </button>
      {open && (
        <div className="px-5 pb-4 text-[13px] text-slate-400 leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── Screenshots with lightbox ────────────────────────────────────────────────

function Screenshots({
  label,
  items,
  onOpen,
}: {
  label: string;
  items: ScreenshotItem[];
  onOpen: (src: string, alt: string) => void;
}) {
  return (
    <div className="mt-4 mb-2">
      <p className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2.5">
        📸 {label}
      </p>
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((item, i) => (
          <button
            key={i}
            onClick={() => onOpen(item.src, item.alt)}
            className="flex-shrink-0 w-52 rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] hover:border-cyan-500/30 hover:translate-y-[-2px] transition-all text-left"
          >
            <div className="w-full aspect-video bg-gradient-to-br from-white/[0.04] to-white/[0.02] flex items-center justify-center relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.src}
                alt={item.alt}
                className="w-full h-full object-cover"
                onError={e => {
                  const t = e.currentTarget;
                  t.style.display = 'none';
                  const ph = t.nextElementSibling as HTMLElement;
                  if (ph) ph.style.display = 'flex';
                }}
              />
              <div className="absolute inset-0 flex-col items-center justify-center gap-1 text-slate-500 text-xs font-mono hidden">
                <span className="text-2xl opacity-30">🖼</span>
                <span className="text-[10px]">{item.alt}</span>
              </div>
            </div>
            <div className="px-2.5 py-1.5 text-[11px] text-slate-400 font-medium border-t border-white/[0.04]">
              {item.caption}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Video player card ─────────────────────────────────────────────────────────

function VideoCard({ video }: { video: VideoItem }) {
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggle = () => {
    if (!videoRef.current) return;
    if (playing) {
      videoRef.current.pause();
      setPlaying(false);
    } else {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="bg-[#0b1121] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-cyan-500/20 hover:-translate-y-0.5 transition-all">
      {/* Player */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-white/[0.04] to-white/[0.02] cursor-pointer" onClick={toggle}>
        <video
          ref={videoRef}
          src={video.videoSrc}
          poster={video.thumb}
          className="w-full h-full object-cover"
          onEnded={() => setPlaying(false)}
          playsInline
        />
        {!playing && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#020617]/50">
            <div className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/30 flex items-center justify-center backdrop-blur-sm transition-all hover:bg-cyan-500 hover:border-cyan-500">
              <svg className="ml-0.5" width="18" height="18" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
        )}
        <span className="absolute top-2 left-2.5 text-[10px] font-mono font-semibold bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full">
          {video.module}
        </span>
        <span className="absolute bottom-2 right-2.5 text-[10px] font-mono font-semibold bg-[#020617]/80 text-white px-1.5 py-0.5 rounded">
          {video.duration}
        </span>
      </div>
      {/* Info */}
      <div className="p-4">
        <p className="text-[13.5px] font-semibold text-white mb-1 leading-snug">{video.title}</p>
        <p className="text-[12px] text-slate-400 leading-relaxed">{video.desc}</p>
      </div>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-[#020617]/95 backdrop-blur-sm z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/[0.08] border border-white/15 text-white flex items-center justify-center hover:bg-white/15 transition-colors text-sm"
      >
        ✕
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[85vh] rounded-xl border border-white/10 object-contain"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}

// ─── ITS Barème table ─────────────────────────────────────────────────────────

function ITSTable() {
  const rows = [
    { tranche: '0 – 615 000 FCFA',             taux: '1 200 FCFA fixe', note: 'Forfait' },
    { tranche: '615 001 – 1 500 000 FCFA',      taux: '10 %',            note: '' },
    { tranche: '1 500 001 – 3 500 000 FCFA',    taux: '15 %',            note: '' },
    { tranche: '3 500 001 – 5 000 000 FCFA',    taux: '20 %',            note: '' },
    { tranche: '> 5 000 000 FCFA',              taux: '30 %',            note: '' },
  ];
  return (
    <div className="overflow-x-auto rounded-xl border border-white/[0.06] mb-3">
      <table className="w-full text-[12.5px]">
        <thead>
          <tr className="bg-white/[0.04] border-b border-white/[0.06]">
            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Tranche annuelle (par part fiscale)</th>
            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold">Taux</th>
            <th className="text-left px-4 py-2.5 text-slate-400 font-semibold"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
              <td className="px-4 py-2.5 text-slate-300 font-mono">{r.tranche}</td>
              <td className="px-4 py-2.5 text-cyan-400 font-bold font-mono">{r.taux}</td>
              <td className="px-4 py-2.5 text-slate-500 text-[11px]">{r.note}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CNSSTable() {
  return (
    <div className="space-y-3">
      {/* Salarié */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.06]">
              <th colSpan={3} className="text-left px-4 py-2.5 text-emerald-400 font-semibold text-[11px] uppercase tracking-wider">
                CNSS Salarié
              </th>
            </tr>
            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Cotisation</th>
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Taux</th>
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Plafond</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.04]">
              <td className="px-4 py-2.5 text-slate-300">Pension vieillesse</td>
              <td className="px-4 py-2.5 text-cyan-400 font-bold font-mono">4 %</td>
              <td className="px-4 py-2.5 text-slate-400 font-mono">Plafonné à 1 200 000 FCFA</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Patronal */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.06]">
              <th colSpan={3} className="text-left px-4 py-2.5 text-amber-400 font-semibold text-[11px] uppercase tracking-wider">
                CNSS Patronal — Total ≈ 20,28 %
              </th>
            </tr>
            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Branche</th>
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Taux</th>
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Plafond d'assiette</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.04]">
              <td className="px-4 py-2.5 text-slate-300">Pension vieillesse</td>
              <td className="px-4 py-2.5 text-amber-400 font-bold font-mono">8 %</td>
              <td className="px-4 py-2.5 text-slate-400 font-mono">Plafonné à 1 200 000 FCFA</td>
            </tr>
            <tr className="border-b border-white/[0.04]">
              <td className="px-4 py-2.5 text-slate-300">Prestations familiales</td>
              <td className="px-4 py-2.5 text-amber-400 font-bold font-mono">10 %</td>
              <td className="px-4 py-2.5 text-slate-400 font-mono">Plafonné à 600 000 FCFA</td>
            </tr>
            <tr className="border-b border-white/[0.04]">
              <td className="px-4 py-2.5 text-slate-300">Accidents du travail</td>
              <td className="px-4 py-2.5 text-amber-400 font-bold font-mono">2,25 %</td>
              <td className="px-4 py-2.5 text-slate-400 font-mono">Plafonné à 600 000 FCFA</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* TUS */}
      <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
        <table className="w-full text-[12.5px]">
          <thead>
            <tr className="bg-white/[0.04] border-b border-white/[0.06]">
              <th colSpan={3} className="text-left px-4 py-2.5 text-sky-400 font-semibold text-[11px] uppercase tracking-wider">
                TUS — Taxe Unique sur les Salaires (7,5 % total)
              </th>
            </tr>
            <tr className="bg-white/[0.02] border-b border-white/[0.06]">
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Destinataire</th>
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Taux</th>
              <th className="text-left px-4 py-2 text-slate-500 font-medium">Base</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-white/[0.04]">
              <td className="px-4 py-2.5 text-slate-300">Part État / DGI</td>
              <td className="px-4 py-2.5 text-sky-400 font-bold font-mono">2,025 %</td>
              <td className="px-4 py-2.5 text-slate-400 font-mono">Salaire brut</td>
            </tr>
            <tr>
              <td className="px-4 py-2.5 text-slate-300">Part CNSS</td>
              <td className="px-4 py-2.5 text-sky-400 font-bold font-mono">5,475 %</td>
              <td className="px-4 py-2.5 text-slate-400 font-mono">Salaire brut</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function DocsPage() {
  const [page,        setPage]        = useState<PageView>('doc');
  const [companyMode, setCompanyMode] = useState<CompanyMode>('entreprise');
  const [activeId,    setActiveId]    = useState('inscription');
  const [lightbox,    setLightbox]    = useState<{ src: string; alt: string } | null>(null);

  // Sidebar scroll spy
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => { if (e.isIntersecting) setActiveId(e.target.id); });
      },
      { rootMargin: '-80px 0px -60% 0px' }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, [page]);

  const openLightbox = useCallback((src: string, alt: string) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  const currentNav = page === 'doc' ? DOC_NAV : VIDEO_NAV;

  // ── Sidebar ──────────────────────────────────────────────────────────────
  const sidebar = (
    <aside
      className="hidden lg:flex flex-col w-[268px] flex-shrink-0"
      style={{ position: 'fixed', top: 64, bottom: 0, overflowY: 'auto', background: '#0b1121', borderRight: '1px solid rgba(255,255,255,0.06)', zIndex: 100, paddingBottom: '3rem' }}
    >
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/[0.06]">
        <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest">Centre d'aide</p>
        <p className="text-[11px] font-mono text-slate-500 mt-0.5">v2.0 · Documentation officielle</p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1 mx-3 mt-3 mb-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
        {(['doc', 'videos'] as const).map(v => (
          <button
            key={v}
            onClick={() => setPage(v)}
            className={`flex-1 py-1.5 text-[11.5px] font-semibold rounded-lg transition-all ${
              page === v
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-[#020617] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {v === 'doc' ? '📖 Guide' : '▶ Vidéos'}
          </button>
        ))}
      </div>

      {/* Nav links */}
      {currentNav.map(group => (
        <div key={group.label}>
          <p className="px-5 pt-4 pb-1 text-[9.5px] font-bold uppercase tracking-[0.12em] text-slate-600 font-mono">
            {group.label}
          </p>
          {group.links.map(link => {
            const id = link.href.slice(1);
            const active = activeId === id;
            return (
              <a
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-5 py-[0.47rem] text-[12.5px] font-medium border-l-2 transition-all ${
                  active
                    ? 'border-cyan-500 text-cyan-400 bg-cyan-500/[0.05]'
                    : 'border-transparent text-slate-500 hover:text-slate-300 hover:bg-white/[0.03]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${active ? 'bg-cyan-500' : 'bg-slate-700'}`} />
                {link.label}
              </a>
            );
          })}
        </div>
      ))}
    </aside>
  );

  // ── Page tabs ─────────────────────────────────────────────────────────────
  const pageTabs = (
    <div className="flex gap-2 mb-8">
      {([['doc', '📖 Documentation'], ['videos', '▶ Tutoriels vidéo']] as const).map(([v, label]) => (
        <button
          key={v}
          onClick={() => setPage(v)}
          className={`px-4 py-2 text-[12.5px] font-semibold rounded-lg border transition-all ${
            page === v
              ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
              : 'bg-transparent border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  DOC CONTENT
  // ─────────────────────────────────────────────────────────────────────────
  const docContent = (
    <div className={page === 'doc' ? 'block' : 'hidden'}>
      {/* Hero */}
      <div className="mb-12 pb-10 border-b border-white/[0.06]">
        <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.12em] mb-3">Documentation officielle · v2.0</p>
        <h1 className="text-4xl font-extrabold tracking-tight leading-[1.1] mb-3 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Centre d'aide<br />Konza RH
        </h1>
        <p className="text-[15px] text-slate-400 max-w-lg leading-relaxed">
          De l'inscription à votre première paie, tout ce qu'il faut pour prendre en main la plateforme — sans contacter le support.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400">✦ Guide complet A–Z</span>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400">✓ Mis à jour 2026</span>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-slate-400">🇨🇬 Conforme droit congolais</span>
        </div>
      </div>

      {/* ── 01 Inscription ── */}
      <section id="inscription" className="mb-16 scroll-mt-20">
        <SectionHead num="01" title="Inscription & première connexion" badge={{ text: 'Point de départ', type: 'req' }} />
        <p className="text-[13.5px] text-slate-400 mb-5 leading-relaxed">
          Tout commence ici. Suivez ces étapes dans l'ordre — chaque étape débloque la suivante.
          Ne sautez pas la configuration entreprise : les bulletins de paie en dépendent.
        </p>

        {/* Flow */}
        <div className="relative pl-10 space-y-0">
          <div className="absolute left-[19px] top-10 bottom-10 w-px bg-gradient-to-b from-cyan-500 via-cyan-500/30 to-transparent" />
          {[
            { title: 'Créer votre compte', body: <>Rendez-vous sur <strong className="text-white">hrcongo.app/auth/register</strong>. Email professionnel + mot de passe fort. Un lien de confirmation est envoyé automatiquement.</> },
            { title: 'Confirmer votre email', body: <>Cliquez sur le lien reçu (valable <strong className="text-white">24h</strong>). Vérifiez vos spams si vous ne recevez rien. Sans confirmation, l'accès est limité.</> },
            { title: 'Configurer votre entreprise ou cabinet', body: <>Un assistant apparaît à la première connexion. Il vous guide pour créer votre entreprise ou votre cabinet. <strong className="text-white">Ne le fermez pas</strong> — il n'apparaît qu'une seule fois.</>, link: { href: '#entreprise-cabinet', label: '→ Guide Entreprise / Cabinet' } },
            { title: 'Créer vos départements', body: <>Avant d'ajouter des employés, créez au moins un département. Chaque employé y sera rattaché lors de sa création.</>, link: { href: '#departements', label: '→ Guide Départements' } },
            { title: 'Ajouter vos employés & générer la paie', body: <>Ajoutez vos employés (manuellement ou via Excel), puis rendez-vous dans <strong className="text-white">Paie</strong> pour générer votre premier bulletin.</>, link: { href: '#paie', label: '→ Guide Paie' } },
          ].map((step, i) => (
            <div key={i} className="flex gap-4 py-3 relative">
              <div className="w-9 h-9 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center font-mono text-[11px] text-cyan-400 flex-shrink-0 z-10 mt-0.5">
                {String(i + 1).padStart(2, '0')}
              </div>
              <div className="pt-1">
                <h3 className="text-sm font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-[13px] text-slate-400 leading-relaxed">{step.body}</p>
                {step.link && (
                  <a href={step.link.href} className="text-[12px] font-semibold text-cyan-500 hover:underline mt-1 inline-block">
                    {step.link.label}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <InfoBlock type="tip" title="Conseil">
          Pour un premier test, créez un seul département + un employé fictif, puis générez son bulletin.
          Cela vous permet de valider la configuration avant l'import de masse.
        </InfoBlock>

        <Screenshots
          label="Captures d'écran — Inscription"
          items={[
            { src: '/docs/screenshots/register-01.png', alt: 'Page inscription', caption: "Page d'inscription" },
            { src: '/docs/screenshots/register-02.png', alt: 'Email confirmation', caption: 'Email de confirmation' },
            { src: '/docs/screenshots/register-03.png', alt: 'Assistant démarrage', caption: 'Assistant de démarrage' },
          ]}
          onOpen={openLightbox}
        />
      </section>

      {/* ── 02 Rôles ── */}
      <section id="roles" className="mb-16 scroll-mt-20">
        <SectionHead num="02" title="Rôles & permissions" />
        <p className="text-[13.5px] text-slate-400 mb-4 leading-relaxed">
          Konza RH dispose de 4 niveaux d'accès. L'accès aux modules dépend du rôle assigné lors de la création du compte.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          {[
            { name: 'ADMIN', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20', perms: ['Accès total à tous les modules', 'Configuration entreprise & système', 'Gestion de la paie & validation', 'Gestion des utilisateurs & rôles'] },
            { name: 'RH MANAGER', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', perms: ['Gestion complète des employés', 'Création & validation bulletins', 'Gestion présences & congés', 'Prêts & avances sur salaire'] },
            { name: 'MANAGER', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', perms: ['Voir les profils de son équipe', 'Valider les congés de son équipe', 'Pointage et présences équipe', 'Ses propres présences'] },
            { name: 'EMPLOYÉ', color: 'text-slate-400 bg-white/[0.05] border-white/10', perms: ['Consulter sa fiche de paie', 'Pointer via GPS', 'Soumettre des demandes de congé', 'Voir son planning & matériel'] },
          ].map(role => (
            <div key={role.name} className="bg-[#0b1121] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
              <span className={`inline-block text-[11px] font-mono font-bold px-2 py-0.5 rounded border mb-3 ${role.color}`}>{role.name}</span>
              <ul className="space-y-0.5">
                {role.perms.map(p => (
                  <li key={p} className="text-[12.5px] text-slate-400 before:content-['›_'] before:text-cyan-500/60">{p}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <InfoBlock type="note" title="Inviter un utilisateur">
          Allez dans <code className="bg-white/[0.06] border border-white/10 rounded px-1.5 py-0.5 text-cyan-300 text-[11px]">Paramètres → Gestion Utilisateurs → Inviter un utilisateur</code>.
          Saisissez l'email, choisissez le rôle, validez. L'utilisateur reçoit un lien d'activation valable 24h.
        </InfoBlock>
      </section>

      {/* ── 03 Entreprise / Cabinet ── */}
      <section id="entreprise-cabinet" className="mb-16 scroll-mt-20">
        <SectionHead num="03" title="Entreprise & Cabinet" badge={{ text: 'Priorité 1', type: 'req' }} />
        <p className="text-[13.5px] text-slate-400 mb-4 leading-relaxed">
          Selon votre situation, choisissez le mode adapté. Cliquez sur l'un des deux pour afficher le guide correspondant.
        </p>

        {/* Toggle cards */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {(['entreprise', 'cabinet'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setCompanyMode(mode)}
              className={`text-left p-4 rounded-xl border transition-all ${
                companyMode === mode
                  ? 'border-cyan-500 bg-cyan-500/[0.04]'
                  : 'border-white/[0.06] bg-[#0b1121] hover:border-white/10'
              }`}
            >
              <div className="text-xl mb-2">{mode === 'entreprise' ? '🏢' : '🏛️'}</div>
              <h4 className="text-sm font-semibold text-white mb-1">
                {mode === 'entreprise' ? 'Mode Entreprise' : 'Mode Cabinet'}
              </h4>
              <p className="text-[12px] text-slate-500">
                {mode === 'entreprise'
                  ? 'Je gère une seule société (PME, TPE, start-up)'
                  : 'Je gère plusieurs sociétés (cabinet RH, comptable, DRH externalisée)'}
              </p>
            </button>
          ))}
        </div>

        {/* Entreprise content */}
        {companyMode === 'entreprise' && (
          <div>
            <PathCrumb path="Paramètres → Entreprise" />
            <GuideCard
              icon="🏢" iconColor="cyan" title="Configurer votre entreprise"
              steps={[
                { text: <>Renseignez la <strong className="text-white">raison sociale</strong> telle qu'elle apparaît sur vos documents officiels.</> },
                { text: <>Entrez le <strong className="text-white">RCCM / NIF</strong> de votre société (utilisé sur les déclarations CNSS).</> },
                { text: <>Saisissez l'<strong className="text-white">adresse complète</strong>, le téléphone et l'email RH.</> },
                { text: <>Téléversez votre <strong className="text-white">logo</strong> (PNG fond transparent recommandé) — il apparaîtra sur tous les bulletins.</> },
                { text: <>Configurez le <strong className="text-white">rayon GPS autorisé</strong> en mètres pour le pointage des employés.</> },
                { text: <>Définissez le <strong className="text-white">jour de paiement des salaires</strong> (ex : le 5 du mois suivant). Ce paramètre pilote le module de suivi des impayés.</> },
                { text: <><strong className="text-white">Enregistrez</strong>. Ces paramètres prennent effet immédiatement.</> },
              ]}
            />
            <InfoBlock type="warn" title="Attention GPS">
              Si vous ne configurez pas la localisation GPS, le module de pointage GPS sera désactivé pour tous vos employés.
            </InfoBlock>
            <Screenshots
              label="Captures d'écran — Configuration entreprise"
              items={[
                { src: '/docs/screenshots/entreprise-01.png', alt: 'Paramètres entreprise', caption: 'Paramètres généraux' },
                { src: '/docs/screenshots/entreprise-02.png', alt: 'Configuration GPS', caption: 'Configuration GPS' },
                { src: '/docs/screenshots/entreprise-03.png', alt: 'Upload logo', caption: 'Upload du logo' },
              ]}
              onOpen={openLightbox}
            />
          </div>
        )}

        {/* Cabinet content */}
        {companyMode === 'cabinet' && (
          <div>
            <PathCrumb path="Cabinet → Créer / Gérer mes PME" />
            <div className="grid sm:grid-cols-2 gap-3 mb-3">
              <GuideCard icon="🏛️" iconColor="cyan" title="Créer un cabinet" steps={[
                { text: <>Allez dans <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Cabinet → Créer mon cabinet</code>.</> },
                { text: <>Donnez un <strong className="text-white">nom à votre structure</strong> (ex : "Cabinet Dupont RH").</> },
                { text: <>Votre compte devient le compte principal avec <strong className="text-white">accès total</strong> à toutes les PME.</> },
                { text: <>Votre tableau de bord affiche désormais toutes les PME rattachées.</> },
              ]} />
              <GuideCard icon="🏢" iconColor="green" title="Ajouter une PME" steps={[
                { text: <>Dans le dashboard cabinet, cliquez <strong className="text-white">Ajouter une PME</strong>.</> },
                { text: <>Renseignez les infos légales : raison sociale, RCCM, adresse.</> },
                { text: <>Chaque PME a sa propre config, ses employés et sa paie.</> },
                { text: <>Basculez entre PME via le <strong className="text-white">sélecteur d'entreprise</strong> en haut à gauche.</> },
              ]} />
            </div>
            <InfoBlock type="note" title="Isolation totale">
              Chaque PME est isolée : ses employés, sa paie, ses documents et sa configuration sont totalement indépendants.
              Un seul abonnement Cabinet couvre toutes les PME rattachées.
            </InfoBlock>
            <Screenshots
              label="Captures d'écran — Mode Cabinet"
              items={[
                { src: '/docs/screenshots/cabinet-01.png', alt: 'Dashboard cabinet', caption: 'Dashboard cabinet' },
                { src: '/docs/screenshots/cabinet-02.png', alt: 'Sélecteur PME', caption: "Sélecteur d'entreprise" },
                { src: '/docs/screenshots/cabinet-03.png', alt: 'Ajouter PME', caption: 'Ajouter une PME' },
              ]}
              onOpen={openLightbox}
            />
          </div>
        )}
      </section>

      {/* ── 04 Départements ── */}
      <section id="departements" className="mb-16 scroll-mt-20">
        <SectionHead num="04" title="Créer des départements" badge={{ text: 'Priorité 2', type: 'req' }} />
        <PathCrumb path="Paramètres → Départements" />
        <GuideCard icon="📂" iconColor="cyan" title="Ajouter un département" steps={[
          { text: <>Cliquez sur <strong className="text-white">Nouveau département</strong>.</> },
          { text: <>Saisissez le <strong className="text-white">nom du service</strong> (ex : Direction, RH, Comptabilité, Terrain).</> },
          { text: <>Assignez un <strong className="text-white">Manager responsable</strong> si l'utilisateur existe déjà.</> },
          { text: <>Sauvegardez. Le département est disponible immédiatement lors de la création d'un employé.</> },
        ]} />
        <InfoBlock type="tip" title="Bonne pratique">
          Créez tous vos départements avant d'importer vos employés via Excel — sinon le rattachement échouera.
        </InfoBlock>
      </section>

      {/* ── 05 Utilisateurs ── */}
      <section id="utilisateurs" className="mb-16 scroll-mt-20">
        <SectionHead num="05" title="Gestion des utilisateurs" />
        <PathCrumb path="Paramètres → Gestion Utilisateurs" />
        <GuideCard icon="👥" iconColor="green" title="Inviter un utilisateur" steps={[
          { text: <>Cliquez sur <strong className="text-white">Inviter un utilisateur</strong>.</> },
          { text: <>Saisissez l'adresse email et choisissez le <strong className="text-white">rôle</strong> approprié.</> },
          { text: <>Validez. L'utilisateur reçoit un email d'invitation avec un lien d'activation valable <strong className="text-white">24h</strong>.</> },
          { text: <>Pour réinitialiser un mot de passe : options <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">⋯</code> → "Envoyer un lien de réinitialisation".</> },
        ]} />
      </section>

      {/* ── 06 Barèmes & calculs paie ── */}
      <section id="paie-config" className="mb-16 scroll-mt-20">
        <SectionHead num="06" title="Barèmes & calculs de paie" badge={{ text: 'Automatique', type: 'opt' }} />
        <InfoBlock type="note" title="Tout est déjà configuré — aucune action requise">
          Les calculs de paie (CNSS, ITS, TUS) sont <strong>entièrement automatisés</strong> et pré-configurés dans l'application
          selon la législation congolaise en vigueur (Ordonnance n°2025-44 du 31 décembre 2025).
          Vous n'avez rien à modifier — les barèmes ci-dessous sont uniquement fournis à titre informatif.
        </InfoBlock>

        <p className="text-[13px] font-semibold text-slate-300 mb-2 mt-5">Barème ITS 2026 <span className="text-[11px] text-slate-500 font-normal">(Impôt sur les Traitements et Salaires — appliqué sur le quotient annuel par part fiscale)</span></p>
        <ITSTable />
        <InfoBlock type="note" title="Abattement & parts fiscales">
          Un abattement forfaitaire de <strong>20 %</strong> est appliqué sur le revenu net avant calcul ITS.
          Les parts fiscales sont maintenues en 2026 : de 1 part (célibataire) à 6,5 parts (marié + enfants).
        </InfoBlock>

        <p className="text-[13px] font-semibold text-slate-300 mb-2 mt-6">CNSS & TUS <span className="text-[11px] text-slate-500 font-normal">(Décret n°2009-392 — inchangé en 2026)</span></p>
        <CNSSTable />
      </section>

      {/* ── 07 Employés ── */}
      <section id="employes" className="mb-16 scroll-mt-20">
        <SectionHead num="07" title="Créer un employé" />
        <PathCrumb path="Employés → Nouveau → Formulaire" />
        <GuideCard icon="👤" iconColor="cyan" title="Formulaire en 4 étapes" steps={[
          { text: <><strong className="text-white">Identité</strong> — Nom, prénom, date de naissance, photo, nationalité.</> },
          { text: <><strong className="text-white">Situation familiale</strong> — Statut matrimonial, nombre d'enfants (impacte les calculs ITS).</> },
          { text: <><strong className="text-white">Poste & contrat</strong> — Département, poste, type de contrat (CDI/CDD/Stage), date d'embauche, salaire de base.</> },
          { text: <><strong className="text-white">Validation</strong> — Vérifiez le récapitulatif avant de confirmer.</> },
        ]} />
        <Screenshots
          label="Captures d'écran — Fiche employé"
          items={[
            { src: '/docs/screenshots/employe-01.png', alt: 'Formulaire employé', caption: 'Formulaire création' },
            { src: '/docs/screenshots/employe-02.png', alt: 'Fiche employé', caption: 'Fiche complète' },
            { src: '/docs/screenshots/employe-03.png', alt: 'Liste employés', caption: 'Liste des employés' },
          ]}
          onOpen={openLightbox}
        />
      </section>

      {/* ── 08 Import ── */}
      <section id="import" className="mb-16 scroll-mt-20">
        <SectionHead num="08" title="Import en masse via Excel" badge={{ text: 'Recommandé', type: 'opt' }} />
        <PathCrumb path="Employés → Importer" />
        <GuideCard icon="📊" iconColor="green" title="Procédure d'import" steps={[
          { text: <>Téléchargez le <strong className="text-white">modèle Excel</strong> fourni sur la page d'import.</> },
          { text: <>Remplissez les colonnes obligatoires : <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">prénom</code>, <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">nom</code>, <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">département</code>, <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">salaire_base</code>.</> },
          { text: <>Vérifiez que les <strong className="text-white">noms de départements</strong> correspondent exactement à ceux créés dans Paramètres.</> },
          { text: <>Glissez le fichier dans la zone d'import ou cliquez pour le sélectionner.</> },
          { text: <>L'interface affiche un <strong className="text-white">rapport de validation</strong> avec les lignes en erreur avant confirmation.</> },
        ]} />
        <InfoBlock type="warn" title="Format requis">
          Seul le format <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">.xlsx</code> est accepté.
          Les lignes avec un département inexistant seront rejetées.
        </InfoBlock>
      </section>

      {/* ── 09 Contrats ── */}
      <section id="contrats" className="mb-16 scroll-mt-20">
        <SectionHead num="09" title="Gestion des contrats" />
        <PathCrumb path="Employé → Fiche → Contrat" />
        <div className="grid sm:grid-cols-2 gap-3">
          <GuideCard icon="📄" iconColor="cyan" title="Créer un contrat" steps={[
            { text: <>Ouvrez la fiche de l'employé concerné.</> },
            { text: <>Onglet Contrat → cliquez <strong className="text-white">Nouveau contrat</strong>.</> },
            { text: <>Choisissez le type (CDI, CDD…), la date de début, la durée si CDD.</> },
            { text: <>Téléversez le document signé en PDF.</> },
          ]} />
          <GuideCard icon="✂️" iconColor="amber" title="Rupture de contrat" steps={[
            { text: <>Cliquez <strong className="text-white">Rompre le contrat</strong> depuis la fiche employé.</> },
            { text: <>Sélectionnez le motif (démission, licenciement, fin CDD…).</> },
            { text: <>Indiquez la date de fin effective.</> },
            { text: <>Le statut passe automatiquement à <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Suspendu</code>.</> },
          ]} />
        </div>
        <InfoBlock type="tip" title="Alertes CDD">
          Konza affiche une alerte automatique lorsqu'un contrat CDD arrive à échéance dans les <strong>30 jours</strong>.
        </InfoBlock>
      </section>

      {/* ── 10 Pointage GPS ── */}
      <section id="pointage" className="mb-16 scroll-mt-20">
        <SectionHead num="10" title="Pointage GPS" />
        <PathCrumb path="Présences → Ma Pointeuse GPS" />
        <GuideCard icon="📍" iconColor="green" title="Comment pointer (employé / manager)" steps={[
          { text: <>Ouvrez Konza RH sur votre téléphone ou navigateur depuis les locaux.</> },
          { text: <>Autorisez la <strong className="text-white">géolocalisation</strong> du navigateur quand la demande apparaît.</> },
          { text: <>L'application vérifie votre distance par rapport au périmètre autorisé.</> },
          { text: <>Si validé, cliquez <strong className="text-white">Pointer l'arrivée</strong>. En fin de journée : <strong className="text-white">Pointer le départ</strong>.</> },
          { text: <>La présence est enregistrée en temps réel dans la vue journalière.</> },
        ]} />
        <div className="grid sm:grid-cols-2 gap-3">
          <InfoBlock type="warn" title="Hors zone">Si l'employé est hors périmètre, l'app bloque le pointage. L'admin peut corriger via le Pointage manuel.</InfoBlock>
          <InfoBlock type="note" title="Mode hors-ligne">Le pointage est mis en file d'attente et synchronisé dès que la connexion revient.</InfoBlock>
        </div>
      </section>

      {/* ── 11 Pointage manuel ── */}
      <section id="pointage-manuel" className="mb-16 scroll-mt-20">
        <SectionHead num="11" title="Pointage manuel" />
        <PathCrumb path="Présences → Pointage Manuel" />
        <GuideCard icon="✏️" iconColor="amber" title="Saisir ou corriger une présence" steps={[
          { text: <>Sélectionnez l'<strong className="text-white">employé</strong> concerné dans la liste.</> },
          { text: <>Choisissez la <strong className="text-white">date</strong> à corriger ou à compléter.</> },
          { text: <>Saisissez l'heure d'<strong className="text-white">arrivée</strong> et l'heure de <strong className="text-white">départ</strong>.</> },
          { text: <>Ajoutez une <strong className="text-white">note de justification</strong> (obligatoire pour les corrections).</> },
          { text: <>Enregistrez. La correction apparaît avec la mention <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Manuel</code>.</> },
        ]} />
      </section>

      {/* ── 12 Shifts ── */}
      <section id="shifts" className="mb-16 scroll-mt-20">
        <SectionHead num="12" title="Planning de shifts" />
        <PathCrumb path="Présences → Shifts" />
        <div className="grid sm:grid-cols-2 gap-3">
          <GuideCard icon="📅" iconColor="cyan" title="Créer un shift" steps={[
            { text: <>Cliquez sur <strong className="text-white">Nouveau shift</strong>.</> },
            { text: <>Nommez-le (ex : <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Matin 7h–15h</code>) et définissez les horaires.</> },
            { text: <>Activez <strong className="text-white">Shift de nuit</strong> si applicable (déclenche la prime nuit).</> },
            { text: <>Choisissez une couleur et sauvegardez.</> },
          ]} />
          <GuideCard icon="👤" iconColor="green" title="Assigner un shift" steps={[
            { text: <>Cliquez <strong className="text-white">Assigner</strong> en haut de la page.</> },
            { text: <>Sélectionnez le shift, puis l'employé dans la liste.</> },
            { text: <>Choisissez <strong className="text-white">Date précise</strong> ou <strong className="text-white">Récurrent</strong> (par jour de semaine).</> },
            { text: <>Confirmez — l'employé apparaît dans l'onglet <em>Employés & Plannings</em>.</> },
          ]} />
        </div>
      </section>

      {/* ── 13 Paie individuelle ── */}
      <section id="paie" className="mb-16 scroll-mt-20">
        <SectionHead num="13" title="Bulletin de paie individuel" />
        <PathCrumb path="Paie → Nouveau bulletin" />
        <p className="text-[13.5px] text-slate-400 mb-4 leading-relaxed">
          Les calculs (CNSS, ITS, TUS) sont entièrement automatisés. Vous n'avez rien à configurer.
        </p>
        <GuideCard icon="💸" iconColor="green" title="Générer un bulletin" steps={[
          { text: <>Cliquez sur <strong className="text-white">Nouveau bulletin</strong> dans le menu Paie.</> },
          { text: <>Sélectionnez l'<strong className="text-white">employé</strong> et le <strong className="text-white">mois de paie</strong>.</> },
          { text: <>Le système pré-remplit le salaire de base depuis la fiche employé.</> },
          { text: <>Ajoutez les <strong className="text-white">heures supplémentaires</strong>, <strong className="text-white">primes</strong> ou <strong className="text-white">déductions</strong> si applicable.</> },
          { text: <>Vérifiez l'<strong className="text-white">aperçu</strong> avec CNSS, ITS et net à payer calculés automatiquement.</> },
          { text: <>Validez. Une fois le virement effectué, marquez le bulletin comme <strong className="text-white">Payé</strong>.</> },
        ]} />
        <Screenshots
          label="Captures d'écran — Paie"
          items={[
            { src: '/docs/screenshots/paie-01.png', alt: 'Nouveau bulletin', caption: 'Création bulletin' },
            { src: '/docs/screenshots/paie-02.png', alt: 'Aperçu bulletin', caption: 'Aperçu & calculs' },
            { src: '/docs/screenshots/paie-03.png', alt: 'Bulletin validé', caption: 'Bulletin validé' },
          ]}
          onOpen={openLightbox}
        />
      </section>

      {/* ── 14 Paie en masse ── */}
      <section id="paie-masse" className="mb-16 scroll-mt-20">
        <SectionHead num="14" title="Paie en masse" badge={{ text: 'Gain de temps', type: 'opt' }} />
        <PathCrumb path="Paie → Paie en masse" />
        <GuideCard icon="⚡" iconColor="cyan" title="Lancer une paie groupée" steps={[
          { text: <><strong className="text-white">Période</strong> — Choisissez le mois et l'année de paie.</> },
          { text: <><strong className="text-white">Sélection</strong> — Filtrez par département ou sélectionnez tous les employés.</> },
          { text: <><strong className="text-white">Traitement</strong> — Konza calcule automatiquement tous les bulletins.</> },
          { text: <>Une fenêtre récapitule la <strong className="text-white">masse salariale totale</strong>.</> },
          { text: <>Tous les bulletins sont disponibles dans <strong className="text-white">Paie → Historique</strong>.</> },
        ]} />
        <InfoBlock type="tip" title="Simulateur de paie">
          Avant de lancer, utilisez <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Paie → Simulateur</code> pour tester un scénario sans générer de bulletins réels.
        </InfoBlock>
      </section>

      {/* ── 15 Impayés ── */}
      <section id="impayes" className="mb-16 scroll-mt-20">
        <SectionHead num="15" title="Suivi des impayés" />
        <PathCrumb path="Paie → Impayés" />
        <p className="text-[13.5px] text-slate-400 mb-4 leading-relaxed">
          Cette page détecte automatiquement les retards en comparant la date de paiement prévue avec l'état réel des bulletins.
          Aucune action manuelle n'est requise pour qu'une alerte apparaisse.
        </p>
        <GuideCard icon="⚠️" iconColor="amber" title="Comment fonctionne la détection" steps={[
          { text: <><strong className="text-white">J-3 avant la date prévue</strong> — Alerte bleue : préparez les virements.</> },
          { text: <><strong className="text-white">Date dépassée, aucun bulletin</strong> — Alerte violette : paie non lancée. Montant affiché = approximatif (basé sur le salaire de base).</> },
          { text: <><strong className="text-white">Bulletin généré mais non payé</strong> — Alerte orange : bulletin en brouillon ou validé mais paiement non confirmé.</> },
          { text: <><strong className="text-white">Marquer comme payé</strong> — Une fois le virement effectué, marquez le bulletin comme <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Payé</code> dans <em>Paie → Bulletins</em>.</> },
        ]} />
        <InfoBlock type="warn" title="Art. 95 CT Congo">
          Les salaires doivent être payés à date fixe. 3 mois de retard = droit de saisir l'Inspection du Travail.
        </InfoBlock>
      </section>

      {/* ── 16 Prêts ── */}
      <section id="loans" className="mb-16 scroll-mt-20">
        <SectionHead num="16" title="Prêts & avances sur salaire" />
        <PathCrumb path="Avances & Prêts → Nouveau financement" />
        <GuideCard icon="🤝" iconColor="amber" title="Enregistrer un prêt" steps={[
          { text: <>Cliquez sur <strong className="text-white">Nouveau Financement</strong>.</> },
          { text: <>Sélectionnez l'<strong className="text-white">employé bénéficiaire</strong> et le type : avance ponctuelle ou prêt échelonné.</> },
          { text: <>Saisissez le <strong className="text-white">montant</strong> et, pour les prêts, le nombre de mensualités.</> },
          { text: <>Le remboursement est <strong className="text-white">déduit automatiquement</strong> du bulletin chaque mois.</> },
        ]} />
      </section>

      {/* ── 17 Congés ── */}
      <section id="conges" className="mb-16 scroll-mt-20">
        <SectionHead num="17" title="Gestion des congés" />
        <div className="grid sm:grid-cols-2 gap-3">
          <GuideCard icon="🌴" iconColor="cyan" title="Employé — faire une demande" steps={[
            { text: <>Allez dans <strong className="text-white">Mes Demandes</strong>.</> },
            { text: <>Cliquez <strong className="text-white">Nouvelle demande</strong>, choisissez les dates.</> },
            { text: <>Sélectionnez le type (annuel, maladie…).</> },
            { text: <>Soumettez. Le manager est notifié.</> },
          ]} />
          <GuideCard icon="✅" iconColor="green" title="Manager — valider" steps={[
            { text: <>Allez dans <strong className="text-white">Validation Congés</strong>.</> },
            { text: <>Consultez les demandes en attente.</> },
            { text: <>Approuvez ou refusez avec une note.</> },
            { text: <>L'employé reçoit une notification.</> },
          ]} />
        </div>
      </section>

      {/* ── 18 CNSS ── */}
      <section id="cnss" className="mb-16 scroll-mt-20">
        <SectionHead num="18" title="Déclaration CNSS" />
        <PathCrumb path="Rapports → Déclarations" />
        <GuideCard icon="🏛️" iconColor="cyan" title="Déclaration mensuelle" steps={[
          { text: <>Assurez-vous que tous les bulletins du mois sont générés et validés.</> },
          { text: <>Allez dans <strong className="text-white">Déclarations</strong> et sélectionnez le mois concerné.</> },
          { text: <>Konza calcule automatiquement les cotisations patronales et salariales.</> },
          { text: <>Exportez au format PDF ou Excel selon la CNSS.</> },
        ]} />
      </section>

      {/* ── 19 Recrutement ── */}
      <section id="recrutement" className="mb-16 scroll-mt-20">
        <SectionHead num="19" title="Recrutement" />
        <PathCrumb path="Recrutement" />
        <div className="grid sm:grid-cols-2 gap-3">
          <GuideCard icon="📋" iconColor="cyan" title="Mode manuel" steps={[
            { text: <>Créez une <strong className="text-white">offre d'emploi</strong> avec intitulé, description, critères.</> },
            { text: <>Gérez les candidatures reçues dans le kanban.</> },
            { text: <>Faites progresser les candidats par étapes jusqu'à l'embauche.</> },
          ]} />
          <GuideCard icon="🤖" iconColor="green" title="Mode IA" steps={[
            { text: <>Activez le <strong className="text-white">mode IA</strong> pour le scoring automatique des CVs.</> },
            { text: <>L'IA analyse les compétences et classe les candidats.</> },
            { text: <>Consultez les analytics pour optimiser vos offres.</> },
          ]} />
        </div>
      </section>

      {/* ── 20 Formation ── */}
      <section id="formation" className="mb-16 scroll-mt-20">
        <SectionHead num="20" title="Formation" />
        <PathCrumb path="Formation" />
        <p className="text-[13.5px] text-slate-400 leading-relaxed">
          Gérez le plan de formation de vos équipes : créez des sessions, assignez des participants et suivez les compétences développées.
          Les formations terminées sont consignées dans le dossier de chaque employé.
        </p>
      </section>

      {/* ── 21 Matériel ── */}
      <section id="materiel" className="mb-16 scroll-mt-20">
        <SectionHead num="21" title="Gestion du matériel" />
        <PathCrumb path="Matériel" />
        <p className="text-[13.5px] text-slate-400 leading-relaxed">
          Enregistrez les équipements attribués à chaque employé (ordinateur, véhicule, téléphone…).
          Lors d'une rupture de contrat, la liste du matériel à restituer est générée automatiquement.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="mb-16 scroll-mt-20">
        <SectionHead num="—" title="Questions fréquentes" />
        <div className="bg-[#0b1121] border border-white/[0.06] rounded-2xl overflow-hidden">
          <FaqItem q="Pourquoi mon bulletin de paie a un montant incorrect ?">
            Ouvrez la fiche de l'employé concerné et vérifiez que son <strong>salaire de base</strong> est correct.
            Vérifiez ensuite les primes et déductions ajoutées manuellement sur ce bulletin.
            Vous pouvez modifier un bulletin via{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Paie → [bulletin] → Modifier</code>.
          </FaqItem>
          <FaqItem q="Un employé ne peut pas pointer en GPS — que faire ?">
            Vérifiez que la localisation GPS est activée dans{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Paramètres → Entreprise</code>{' '}
            et que le rayon autorisé est suffisant. Assurez-vous que l'employé autorise la géolocalisation dans son navigateur.
            En dernier recours, utilisez le <strong>Pointage Manuel</strong>.
          </FaqItem>
          <FaqItem q="Comment réinitialiser le mot de passe d'un utilisateur ?">
            Allez dans{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Paramètres → Gestion Utilisateurs</code>,
            trouvez l'utilisateur et cliquez sur les options{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">⋯</code>.
            Sélectionnez "Envoyer un lien de réinitialisation". Le lien est valable 24h.
          </FaqItem>
          <FaqItem q="Des impayés apparaissent alors que je n'ai pas généré de bulletin — est-ce normal ?">
            Oui, c'est voulu. Le système détecte les retards basés sur la <strong>date de paiement prévue</strong>{' '}
            (configurée dans Paramètres entreprise), pas sur l'existence d'un bulletin.
            Si la date est dépassée et qu'aucun bulletin n'est généré, c'est considéré comme un retard.
            Le montant affiché est alors <strong>approximatif</strong> (basé sur le salaire de base).
            Pour clôturer : générez le bulletin, effectuez le virement, puis marquez comme{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Payé</code>.
          </FaqItem>
          <FaqItem q="Peut-on gérer plusieurs entreprises depuis un seul compte ?">
            Oui, via le <strong>Mode Cabinet</strong>. Allez dans{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Cabinet → Créer mon cabinet</code>,
            puis ajoutez vos PME. Chaque PME dispose de sa propre configuration, employés et paie, accessibles depuis un tableau de bord central.
          </FaqItem>
          <FaqItem q="Comment exporter les données pour la comptabilité ?">
            Allez dans{' '}
            <code className="bg-white/[0.06] border border-white/10 rounded px-1 text-cyan-300 text-[11px]">Rapports → Comptabilité</code>.
            Vous pouvez exporter le journal de paie, le récapitulatif des cotisations et le grand livre RH au format Excel ou PDF.
          </FaqItem>
          <FaqItem q="Les données sont-elles sauvegardées automatiquement ?">
            Oui. Toutes les données sont sauvegardées en temps réel sur nos serveurs.
            Le mode hors-ligne stocke temporairement les pointages en local et les synchronise dès que la connexion revient.
          </FaqItem>
        </div>
      </section>

      {/* Footer doc */}
      <div className="pt-6 border-t border-white/[0.06] flex items-center justify-between text-[11.5px] text-slate-600">
        <span>Konza RH · Centre d'aide v2.0</span>
        <span>Besoin d'aide ? Contactez le support via l'application.</span>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  VIDEOS CONTENT
  // ─────────────────────────────────────────────────────────────────────────

  const videoSections: { id: string; label: string; sectionTitle: string; videos: VideoItem[] }[] = [
    {
      id: 'vid-demarrage', label: 'Démarrage', sectionTitle: 'Premiers pas',
      videos: [
        { videoSrc: '/videos/demarrage-01-inscription.mp4', thumb: '/videos/thumbs/demarrage-01.jpg', duration: '2:30', module: 'Démarrage', title: 'Créer votre compte & première configuration', desc: "De l'inscription à votre premier tableau de bord en moins de 3 minutes." },
        { videoSrc: '/videos/demarrage-02-entreprise.mp4',  thumb: '/videos/thumbs/demarrage-02.jpg', duration: '3:15', module: 'Démarrage', title: 'Configurer votre entreprise & départements', desc: "Paramètres essentiels : logo, RCCM, GPS et structure organisationnelle." },
        { videoSrc: '/videos/demarrage-03-utilisateurs.mp4',thumb: '/videos/thumbs/demarrage-03.jpg', duration: '1:45', module: 'Démarrage', title: 'Inviter des utilisateurs & assigner des rôles', desc: "Créer des comptes RH Manager, Manager et Employé depuis les paramètres." },
      ],
    },
    {
      id: 'vid-employes', label: 'Employés', sectionTitle: 'Gestion des employés',
      videos: [
        { videoSrc: '/videos/employes-01-creation.mp4', thumb: '/videos/thumbs/employes-01.jpg', duration: '4:00', module: 'Employés', title: 'Ajouter un employé manuellement', desc: "Remplir le formulaire complet : identité, contrat, salaire de base." },
        { videoSrc: '/videos/employes-02-import.mp4',   thumb: '/videos/thumbs/employes-02.jpg', duration: '3:30', module: 'Employés', title: 'Import Excel — ajouter 50 employés en 2 minutes', desc: "Télécharger le modèle, le remplir et importer avec rapport de validation." },
      ],
    },
    {
      id: 'vid-presences', label: 'Présences', sectionTitle: 'Pointage & plannings',
      videos: [
        { videoSrc: '/videos/presences-01-gps.mp4',   thumb: '/videos/thumbs/presences-01.jpg', duration: '2:20', module: 'Présences', title: 'Pointage GPS — pointer son arrivée', desc: "Démonstration complète du pointage depuis un téléphone mobile." },
        { videoSrc: '/videos/presences-02-shifts.mp4', thumb: '/videos/thumbs/presences-02.jpg', duration: '2:50', module: 'Présences', title: 'Créer et assigner des shifts de travail', desc: "Planifier des horaires matin/soir/nuit et les assigner aux équipes." },
      ],
    },
    {
      id: 'vid-paie', label: 'Paie', sectionTitle: 'Bulletins & paiements',
      videos: [
        { videoSrc: '/videos/paie-01-bulletin.mp4', thumb: '/videos/thumbs/paie-01.jpg', duration: '5:10', module: 'Paie', title: 'Générer un bulletin de paie individuel', desc: "De la création à la validation avec CNSS, ITS et net à payer calculés." },
        { videoSrc: '/videos/paie-02-masse.mp4',    thumb: '/videos/thumbs/paie-02.jpg', duration: '4:00', module: 'Paie', title: 'Paie en masse — tout un département', desc: "Lancer la paie pour 30 employés simultanément en quelques clics." },
        { videoSrc: '/videos/paie-03-impayes.mp4',  thumb: '/videos/thumbs/paie-03.jpg', duration: '3:20', module: 'Paie', title: 'Suivi des impayés — comprendre les alertes', desc: "Comment lire le tableau de bord impayés et marquer un paiement comme effectué." },
      ],
    },
    {
      id: 'vid-autres', label: 'Autres', sectionTitle: 'Modules complémentaires',
      videos: [
        { videoSrc: '/videos/conges-01.mp4', thumb: '/videos/thumbs/conges-01.jpg', duration: '2:45', module: 'Congés', title: 'Demande et validation de congés', desc: "Processus complet de demande employé à validation manager." },
        { videoSrc: '/videos/cnss-01.mp4',   thumb: '/videos/thumbs/cnss-01.jpg',   duration: '3:00', module: 'CNSS', title: 'Générer la déclaration CNSS mensuelle', desc: "Export automatique des cotisations pour la CNSS Congo." },
      ],
    },
  ];

  const videosContent = (
    <div className={page === 'videos' ? 'block' : 'hidden'}>
      {/* Hero */}
      <div className="mb-10 pb-8 border-b border-white/[0.06]">
        <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-[0.12em] mb-3">Tutoriels vidéo</p>
        <h1 className="text-[1.9rem] font-extrabold tracking-tight leading-tight mb-2 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Apprenez Konza RH<br />en vidéo
        </h1>
        <p className="text-[13.5px] text-slate-400 max-w-md leading-relaxed">
          Courtes vidéos de démonstration pour chaque module. Les vidéos se lisent directement sur cette page.
        </p>
      </div>

      {videoSections.map(sec => (
        <section key={sec.id} id={sec.id} className="mb-14 scroll-mt-20">
          <div className="flex items-end gap-3 mb-5 pb-3 border-b border-white/[0.06]">
            <div>
              <span className="block font-mono text-[10px] text-slate-500 mb-0.5">{sec.label}</span>
              <h2 className="text-[1.2rem] font-bold tracking-tight text-white">{sec.sectionTitle}</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sec.videos.map((v, i) => <VideoCard key={i} video={v} />)}
          </div>
        </section>
      ))}
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ background: '#020617', color: '#e2e8f0' }}>
      <Navbar />

      <div style={{ display: 'flex', paddingTop: 64 }}>
        {sidebar}

        <main
          style={{ marginLeft: 268, flex: 1, maxWidth: 860, padding: '3rem 3.5rem 8rem', minWidth: 0 }}
          className="lg:ml-[268px] mx-auto"
        >
          {pageTabs}
          {docContent}
          {videosContent}
        </main>
      </div>

      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}

      <Footer />
    </div>
  );
}




// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import Link from 'next/link';
// import { Navbar } from '@/components/landing/Navbar';
// import { Footer } from '@/components/landing/Footer';

// // ─── Types ────────────────────────────────────────────────────────────────────
// type PageMode   = 'doc' | 'videos';
// type TypeMode   = 'entreprise' | 'cabinet';

// // ─── Sous-composants internes ────────────────────────────────────────────────

// function SidebarLink({ href, label, active, onClick }: {
//   href: string; label: string; active: boolean; onClick: () => void;
// }) {
//   return (
//     <a
//       href={href}
//       onClick={e => { e.preventDefault(); onClick(); }}
//       className={`flex items-center gap-2 px-5 py-[0.5rem] text-[0.82rem] font-medium border-l-2 transition-all duration-150
//         ${active
//           ? 'text-cyan-400 border-l-cyan-400 bg-cyan-400/5 font-semibold'
//           : 'text-slate-400 border-l-transparent hover:text-white hover:bg-white/[0.03]'
//         }`}
//     >
//       <span className={`w-[5px] h-[5px] rounded-full flex-shrink-0 transition-opacity ${active ? 'opacity-100 bg-cyan-400' : 'opacity-40 bg-current'}`} />
//       {label}
//     </a>
//   );
// }

// function StepItem({ n, children }: { n: number; children: React.ReactNode }) {
//   return (
//     <li className="flex gap-[10px] items-start text-[0.83rem] text-slate-400 py-[0.55rem] border-b border-white/[0.04] last:border-b-0">
//       <span className="w-5 h-5 rounded-full bg-[#111827] border border-white/10 text-[0.62rem] font-mono text-cyan-400 flex items-center justify-center flex-shrink-0 mt-[1px]">
//         {n}
//       </span>
//       <div>{children}</div>
//     </li>
//   );
// }

// function GuideCard({ icon, iconBg, title, children }: {
//   icon: string; iconBg: string; title: string; children: React.ReactNode;
// }) {
//   return (
//     <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] p-[1.4rem] mb-4 hover:border-white/[0.11] transition-colors">
//       <div className="flex items-center gap-2 text-[0.9rem] font-semibold text-white mb-4">
//         <span className={`w-7 h-7 rounded-[7px] flex items-center justify-center text-[13px] flex-shrink-0 ${iconBg}`}>{icon}</span>
//         {title}
//       </div>
//       <ul className="list-none flex flex-col">{children}</ul>
//     </div>
//   );
// }

// function InfoBlock({ type, icon, children }: { type: 'tip' | 'warn' | 'note'; icon: string; children: React.ReactNode }) {
//   const styles = {
//     tip:  'bg-emerald-500/[0.07] text-emerald-200 border-l-2 border-emerald-500',
//     warn: 'bg-amber-500/[0.07]   text-amber-200   border-l-2 border-amber-500',
//     note: 'bg-cyan-500/[0.06]    text-cyan-200    border-l-2 border-cyan-400',
//   }[type];
//   return (
//     <div className={`flex gap-[10px] items-start rounded-[10px] px-4 py-[0.9rem] text-[0.82rem] my-4 ${styles}`}>
//       <span className="text-[15px] flex-shrink-0 mt-[1px]">{icon}</span>
//       <div>{children}</div>
//     </div>
//   );
// }

// function FlowStep({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
//   return (
//     <div className="relative pl-5 py-4">
//       <div className="absolute left-[-2.5rem] top-4 w-[38px] h-[38px] rounded-full bg-[#111827] border border-white/[0.11] font-mono text-[0.7rem] text-cyan-400 flex items-center justify-center z-10">
//         {n}
//       </div>
//       <h3 className="text-[0.95rem] font-semibold text-white mb-1">{title}</h3>
//       <div className="text-[0.82rem] text-slate-400 leading-[1.65]">{children}</div>
//     </div>
//   );
// }

// function SectionHead({ num, title, badge }: { num: string; title: string; badge?: { label: string; type: 'req' | 'opt' | 'crit' } }) {
//   const badgeStyle = badge ? {
//     req:  'bg-amber-500/10 text-amber-400',
//     opt:  'bg-emerald-500/10 text-emerald-400',
//     crit: 'bg-red-500/10 text-red-400',
//   }[badge.type] : '';
//   return (
//     <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
//       <div>
//         <span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">{num}</span>
//         <h2 className="text-[1.3rem] font-bold tracking-[-0.025em] text-white">{title}</h2>
//       </div>
//       {badge && (
//         <span className={`text-[0.62rem] font-mono px-[7px] py-[2px] rounded-[4px] font-semibold mb-[2px] ${badgeStyle}`}>
//           {badge.label}
//         </span>
//       )}
//     </div>
//   );
// }

// function PathCrumb({ children }: { children: React.ReactNode }) {
//   return (
//     <div className="inline-flex items-center gap-1 font-mono text-[0.72rem] bg-[#111827] border border-white/[0.11] rounded-[6px] px-[10px] py-1 text-slate-400 mb-5">
//       {children}
//     </div>
//   );
// }

// function RoleCard({ badge, badgeClass, perms }: { badge: string; badgeClass: string; perms: string[] }) {
//   return (
//     <div className="bg-[#0b1121] border border-white/[0.06] rounded-[12px] p-[1rem_1.15rem] hover:border-white/[0.11] transition-colors">
//       <span className={`text-[0.72rem] font-mono font-semibold px-2 py-[3px] rounded-[5px] mb-3 inline-block ${badgeClass}`}>{badge}</span>
//       <ul className="list-none text-[0.78rem] text-slate-400 leading-[1.9]">
//         {perms.map((p, i) => (
//           <li key={i} className="before:content-['›_'] before:text-cyan-400/60">{p}</li>
//         ))}
//       </ul>
//     </div>
//   );
// }

// function FaqItem({ q, a, defaultOpen = false }: { q: string; a: React.ReactNode; defaultOpen?: boolean }) {
//   const [open, setOpen] = useState(defaultOpen);
//   return (
//     <div className="border-b border-white/[0.06] last:border-b-0">
//       <button
//         onClick={() => setOpen(v => !v)}
//         className="w-full flex items-center justify-between gap-4 px-5 py-4 text-[0.87rem] font-medium text-slate-200 text-left hover:bg-white/[0.02] transition-colors"
//       >
//         {q}
//         <span className={`w-[22px] h-[22px] rounded-full border border-white/[0.11] flex items-center justify-center text-slate-400 font-mono text-[0.9rem] flex-shrink-0 transition-all duration-200
//           ${open ? 'rotate-45 bg-cyan-400/10 border-cyan-400 text-cyan-400' : ''}`}>
//           +
//         </span>
//       </button>
//       <div className={`overflow-hidden transition-all duration-300 text-[0.83rem] text-slate-400 leading-[1.8] px-5
//         ${open ? 'max-h-[600px] pb-[1.1rem]' : 'max-h-0'}`}>
//         {a}
//       </div>
//     </div>
//   );
// }

// function VideoCard({ href, module: mod, duration, title, desc }: {
//   href: string; module: string; duration: string; title: string; desc: string;
// }) {
//   return (
//     <a href={href} target="_blank" rel="noopener" className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] overflow-hidden block hover:-translate-y-[3px] hover:border-cyan-400/25 transition-all duration-200">
//       <div className="w-full aspect-video bg-gradient-to-br from-[#111827] to-[#1a2235] flex flex-col items-center justify-center gap-2 relative">
//         <span className="absolute top-2 left-[10px] text-[0.65rem] font-mono font-semibold bg-cyan-400/15 text-cyan-400 border border-cyan-400/20 px-[7px] py-[2px] rounded-full">
//           {mod}
//         </span>
//         <div className="w-12 h-12 rounded-full bg-cyan-400/12 border-2 border-cyan-400/30 flex items-center justify-center hover:bg-cyan-400 transition-colors group-hover:border-cyan-400">
//           <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21" /></svg>
//         </div>
//         <span className="absolute bottom-2 right-[10px] text-[0.7rem] font-mono font-semibold bg-[#020617]/85 text-white px-[6px] py-[2px] rounded">{duration}</span>
//       </div>
//       <div className="px-4 pt-[0.9rem] pb-4">
//         <p className="text-[0.87rem] font-semibold text-white mb-[0.35rem] leading-[1.4]">{title}</p>
//         <p className="text-[0.78rem] text-slate-400 leading-[1.55]">{desc}</p>
//       </div>
//     </a>
//   );
// }

// // ─── Sections IDs pour le scroll tracking ────────────────────────────────────
// const DOC_SECTIONS = [
//   'inscription','roles','entreprise-cabinet','departements','utilisateurs',
//   'paie-config','employes','import','contrats','pointage','pointage-manuel',
//   'shifts','paie','paie-masse','impayes','loans','conges','cnss',
//   'recrutement','formation','materiel','faq',
// ];

// const VIDEO_SECTIONS = ['vid-demarrage','vid-employes','vid-presences','vid-paie','vid-autres'];

// // ─── Page principale ──────────────────────────────────────────────────────────
// export default function DocsPage() {
//   const [page,        setPage]        = useState<PageMode>('doc');
//   const [typeMode,    setTypeMode]    = useState<TypeMode>('entreprise');
//   const [activeSection, setActive]   = useState('inscription');
//   const mainRef = useRef<HTMLDivElement>(null);

//   // Scroll tracking
//   useEffect(() => {
//     const sections = page === 'doc' ? DOC_SECTIONS : VIDEO_SECTIONS;
//     const handler = () => {
//       let current = sections[0];
//       sections.forEach(id => {
//         const el = document.getElementById(id);
//         if (el && window.scrollY >= el.offsetTop - 110) current = id;
//       });
//       setActive(current);
//     };
//     window.addEventListener('scroll', handler, { passive: true });
//     handler();
//     return () => window.removeEventListener('scroll', handler);
//   }, [page]);

//   const scrollTo = (id: string) => {
//     const el = document.getElementById(id);
//     if (el) { window.scrollTo({ top: el.offsetTop - 90, behavior: 'smooth' }); setActive(id); }
//   };

//   // ── Sidebar doc links
//   const docLinks: Array<{ group: string; items: Array<{ href: string; label: string }> }> = [
//     { group: 'Démarrage', items: [
//       { href: 'inscription',       label: 'Inscription & connexion' },
//       { href: 'roles',             label: 'Rôles & permissions' },
//     ]},
//     { group: 'Configuration', items: [
//       { href: 'entreprise-cabinet',label: 'Entreprise / Cabinet' },
//       { href: 'departements',      label: 'Départements' },
//       { href: 'utilisateurs',      label: 'Utilisateurs' },
//       { href: 'paie-config',       label: 'Paramètres paie' },
//     ]},
//     { group: 'Employés', items: [
//       { href: 'employes',          label: 'Créer un employé' },
//       { href: 'import',            label: 'Import Excel' },
//       { href: 'contrats',          label: 'Contrats' },
//     ]},
//     { group: 'Présences', items: [
//       { href: 'pointage',          label: 'Pointage GPS' },
//       { href: 'pointage-manuel',   label: 'Pointage manuel' },
//       { href: 'shifts',            label: 'Planning shifts' },
//     ]},
//     { group: 'Paie', items: [
//       { href: 'paie',              label: 'Bulletin individuel' },
//       { href: 'paie-masse',        label: 'Paie en masse' },
//       { href: 'impayes',           label: 'Suivi impayés' },
//       { href: 'loans',             label: 'Prêts & avances' },
//     ]},
//     { group: 'Autres modules', items: [
//       { href: 'conges',            label: 'Congés' },
//       { href: 'cnss',              label: 'Déclaration CNSS' },
//       { href: 'recrutement',       label: 'Recrutement' },
//       { href: 'formation',         label: 'Formation' },
//       { href: 'materiel',          label: 'Matériel' },
//     ]},
//     { group: 'FAQ', items: [
//       { href: 'faq',               label: 'Questions fréquentes' },
//     ]},
//   ];

//   const videoLinks = [
//     { href: 'vid-demarrage', label: 'Démarrage' },
//     { href: 'vid-employes',  label: 'Employés' },
//     { href: 'vid-presences', label: 'Présences' },
//     { href: 'vid-paie',      label: 'Paie' },
//     { href: 'vid-autres',    label: 'Autres modules' },
//   ];

//   return (
//     <>
//       {/* Topbar de la landing */}
//       <Navbar />

//       <div className="flex min-h-screen pt-16 bg-[#020617]">

//         {/* ══ SIDEBAR ════════════════════════════════════════════════════════ */}
//         <aside className="hidden lg:flex w-[268px] flex-shrink-0 flex-col fixed top-16 left-0 bottom-0 overflow-y-auto bg-[#0b1121] border-r border-white/[0.06] z-40 pb-12">

//           {/* Brand info */}
//           <div className="px-5 py-5 border-b border-white/[0.06]">
//             <p className="text-[0.65rem] font-mono text-cyan-400 uppercase tracking-widest mb-[2px]">Centre d'aide</p>
//             <p className="text-[0.72rem] font-mono text-slate-500">v2.0 · Documentation officielle</p>
//           </div>

//           {/* Mode switcher */}
//           <div className="flex mx-4 my-3 bg-[#111827] border border-white/[0.06] rounded-[10px] p-[3px] gap-[2px]">
//             {(['doc','videos'] as PageMode[]).map(m => (
//               <button
//                 key={m}
//                 onClick={() => { setPage(m); setActive(m === 'doc' ? 'inscription' : 'vid-demarrage'); window.scrollTo({ top: 0 }); }}
//                 className={`flex-1 py-[0.45rem] text-[0.73rem] font-semibold rounded-[7px] transition-all duration-200 font-sans
//                   ${page === m
//                     ? 'bg-gradient-to-r from-cyan-400 to-blue-500 text-[#020617] font-bold'
//                     : 'text-slate-400 hover:text-white'
//                   }`}
//               >
//                 {m === 'doc' ? '📖 Guide' : '▶ Vidéos'}
//               </button>
//             ))}
//           </div>

//           {/* Nav doc */}
//           {page === 'doc' && (
//             <nav>
//               {docLinks.map(group => (
//                 <div key={group.group}>
//                   <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-500 px-5 pt-4 pb-[6px] font-mono">
//                     {group.group}
//                   </p>
//                   {group.items.map(item => (
//                     <SidebarLink
//                       key={item.href}
//                       href={`#${item.href}`}
//                       label={item.label}
//                       active={activeSection === item.href}
//                       onClick={() => scrollTo(item.href)}
//                     />
//                   ))}
//                 </div>
//               ))}
//             </nav>
//           )}

//           {/* Nav vidéos */}
//           {page === 'videos' && (
//             <nav>
//               <p className="text-[0.62rem] font-bold uppercase tracking-widest text-slate-500 px-5 pt-4 pb-[6px] font-mono">
//                 Par module
//               </p>
//               {videoLinks.map(item => (
//                 <SidebarLink
//                   key={item.href}
//                   href={`#${item.href}`}
//                   label={item.label}
//                   active={activeSection === item.href}
//                   onClick={() => scrollTo(item.href)}
//                 />
//               ))}
//             </nav>
//           )}
//         </aside>

//         {/* ══ CONTENU PRINCIPAL ══════════════════════════════════════════════ */}
//         <main ref={mainRef} className="lg:ml-[268px] flex-1 min-w-0 max-w-[860px] px-6 sm:px-10 lg:px-16 py-12 pb-32">

//           {/* Tabs mobiles + desktop */}
//           <div className="flex items-center gap-2 mb-10">
//             {(['doc','videos'] as PageMode[]).map(m => (
//               <button
//                 key={m}
//                 onClick={() => { setPage(m); setActive(m === 'doc' ? 'inscription' : 'vid-demarrage'); window.scrollTo({ top: 0 }); }}
//                 className={`px-[1.1rem] py-[0.45rem] text-[0.82rem] font-semibold rounded-[8px] border transition-all duration-200 font-sans
//                   ${page === m
//                     ? 'bg-gradient-to-r from-cyan-400/12 to-blue-500/12 border-cyan-400/30 text-cyan-400'
//                     : 'border-white/[0.06] text-slate-400 hover:border-white/[0.11] hover:text-white'
//                   }`}
//               >
//                 {m === 'doc' ? '📖 Documentation' : '▶ Tutoriels vidéo'}
//               </button>
//             ))}
//           </div>

//           {/* ════════════════════════════════════════════════════════════════
//               PAGE DOC
//           ════════════════════════════════════════════════════════════════ */}
//           {page === 'doc' && (
//             <>
//               {/* HERO */}
//               <div className="mb-16 pb-12 border-b border-white/[0.06]">
//                 <p className="text-[0.7rem] font-mono text-cyan-400 uppercase tracking-[0.12em] mb-3">
//                   Documentation officielle · v2.0
//                 </p>
//                 <h1 className="text-[2.6rem] font-extrabold tracking-[-0.04em] leading-[1.1] mb-4"
//                   style={{ background: 'linear-gradient(135deg,#fff 20%,#94a3b8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
//                   Centre d'aide<br />Konza RH
//                 </h1>
//                 <p className="text-[0.95rem] text-slate-400 max-w-[520px] leading-[1.8]">
//                   De l'inscription à votre première paie, tout ce qu'il vous faut pour prendre en main la plateforme — sans contacter le support.
//                 </p>
//                 <div className="flex gap-2 flex-wrap mt-6">
//                   <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-3 py-[0.3rem] rounded-full border border-cyan-400/20 text-cyan-400 bg-cyan-400/[0.06]">✦ Guide complet A–Z</span>
//                   <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-3 py-[0.3rem] rounded-full border border-emerald-400/20 text-emerald-400 bg-emerald-400/[0.06]">✓ Mis à jour 2025</span>
//                   <span className="inline-flex items-center gap-1 text-[0.72rem] font-semibold px-3 py-[0.3rem] rounded-full border border-white/[0.11] text-slate-400 bg-[#0b1121]">🇨🇬 Conforme droit congolais</span>
//                 </div>
//               </div>

//               {/* ── 01 INSCRIPTION ────────────────────────────────────────────── */}
//               <section id="inscription" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="01" title="Inscription & première connexion" badge={{ label: 'Point de départ', type: 'req' }} />
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
//                   Tout commence ici. Suivez ces étapes dans l'ordre — chaque étape débloque la suivante. Ne sautez pas la configuration entreprise : les bulletins de paie en dépendent.
//                 </p>

//                 {/* Flow */}
//                 <div className="relative pl-10 my-6">
//                   <div className="absolute left-[19px] top-6 bottom-6 w-px bg-gradient-to-b from-cyan-400 to-cyan-400/10" />
//                   {[
//                     { n:'01', t:'Créer votre compte', c: <><strong className="text-white">hrcongo.app/auth/register</strong>. Saisissez votre email professionnel, choisissez un mot de passe fort. Un email de confirmation est envoyé automatiquement.</> },
//                     { n:'02', t:'Confirmer votre email', c: <>Cliquez sur le lien reçu par email (valable 24h). Sans cette étape, votre accès est limité. Vérifiez vos spams si vous ne recevez rien.</> },
//                     { n:'03', t:'Configurer votre entreprise ou cabinet', c: <>Après connexion, un assistant vous guide pour créer votre entreprise (PME) ou votre cabinet. C'est la seule fois que cet assistant apparaît — ne le fermez pas.</> },
//                     { n:'04', t:'Créer vos départements', c: <>Avant d'ajouter des employés, créez au moins un département. Les employés y seront rattachés lors de leur création.</> },
//                     { n:'05', t:'Ajouter vos employés & générer la paie', c: <>Une fois les départements créés, ajoutez vos employés (manuellement ou via Excel), puis rendez-vous dans <strong className="text-white">Paie</strong> pour générer votre premier bulletin.</> },
//                   ].map(s => (
//                     <FlowStep key={s.n} n={s.n} title={s.t}>{s.c}</FlowStep>
//                   ))}
//                 </div>

//                 <InfoBlock type="tip" icon="💡">
//                   <strong className="font-semibold block mb-[2px]">Conseil</strong>
//                   Pour un premier test, créez un seul département + un employé fictif, puis générez son bulletin. Cela vous permet de valider la configuration avant l'import de masse.
//                 </InfoBlock>
//               </section>

//               {/* ── 02 RÔLES ──────────────────────────────────────────────────── */}
//               <section id="roles" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="02" title="Rôles & permissions" />
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
//                   Konza RH dispose de 4 niveaux d'accès. L'accès aux modules dépend du rôle assigné lors de la création du compte.
//                 </p>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4">
//                   <RoleCard badge="ADMIN"      badgeClass="bg-cyan-400/10 text-cyan-400"   perms={['Accès total à tous les modules','Configuration entreprise & système','Gestion de la paie & validation','Gestion des utilisateurs & rôles']} />
//                   <RoleCard badge="RH MANAGER" badgeClass="bg-emerald-400/10 text-emerald-400" perms={['Gestion complète des employés','Création & validation bulletins','Gestion présences & congés','Prêts & avances sur salaire']} />
//                   <RoleCard badge="MANAGER"    badgeClass="bg-amber-400/10 text-amber-400"  perms={['Voir les profils de son équipe','Valider les congés de son équipe','Pointage et présences équipe','Ses propres présences']} />
//                   <RoleCard badge="EMPLOYÉ"    badgeClass="bg-white/[0.06] text-slate-400"  perms={['Consulter sa fiche de paie','Pointer via GPS','Soumettre des demandes de congé','Voir son planning & matériel']} />
//                 </div>
//                 <InfoBlock type="note" icon="ℹ️">
//                   <strong className="font-semibold block mb-[2px]">Inviter un utilisateur</strong>
//                   Allez dans <code className="font-mono text-[0.77em] bg-[#111827] border border-white/[0.11] rounded px-[5px] py-[1px] text-cyan-300">Paramètres → Gestion Utilisateurs → Inviter un utilisateur</code>. Saisissez l'email, choisissez le rôle, validez. L'utilisateur reçoit un lien d'activation valable 24h.
//                 </InfoBlock>
//               </section>

//               {/* ── 03 ENTREPRISE / CABINET ───────────────────────────────────── */}
//               <section id="entreprise-cabinet" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="03" title="Entreprise & Cabinet" badge={{ label: 'Priorité 1', type: 'req' }} />
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
//                   Selon votre situation, choisissez le mode qui correspond. Les deux modes sont distincts — un bouton vous permet de basculer entre les configurations.
//                 </p>

//                 {/* Type selector */}
//                 <div className="flex gap-4 my-4 mb-6">
//                   {(['entreprise','cabinet'] as TypeMode[]).map(t => (
//                     <div
//                       key={t}
//                       onClick={() => setTypeMode(t)}
//                       className={`flex-1 border rounded-[12px] p-[1.1rem] cursor-pointer transition-all duration-200 bg-[#0b1121]
//                         ${typeMode === t ? 'border-cyan-400 bg-cyan-400/[0.04]' : 'border-white/[0.06] hover:border-white/[0.11]'}`}
//                     >
//                       <div className="text-[1.5rem] mb-2">{t === 'entreprise' ? '🏢' : '🏛️'}</div>
//                       <h4 className="text-[0.88rem] font-semibold text-white mb-[0.25rem]">
//                         {t === 'entreprise' ? 'Mode Entreprise' : 'Mode Cabinet'}
//                       </h4>
//                       <p className="text-[0.75rem] text-slate-500 leading-[1.55]">
//                         {t === 'entreprise'
//                           ? 'Je gère une seule société (PME, TPE, start-up)'
//                           : 'Je gère plusieurs sociétés (cabinet RH, comptable, DRH externalisée)'}
//                       </p>
//                     </div>
//                   ))}
//                 </div>

//                 {typeMode === 'entreprise' && (
//                   <>
//                     <PathCrumb>Paramètres → <span className="text-cyan-400">Entreprise</span></PathCrumb>
//                     <GuideCard icon="🏢" iconBg="bg-cyan-400/10" title="Configurer votre entreprise">
//                       {[
//                         <>Renseignez la <strong className="text-white">raison sociale</strong> telle qu'elle apparaît sur vos documents officiels.</>,
//                         <>Entrez le <strong className="text-white">RCCM / NIF</strong> de votre société (utilisé sur les déclarations CNSS).</>,
//                         <>Saisissez l'<strong className="text-white">adresse complète</strong>, le téléphone et l'email RH.</>,
//                         <>Téléversez votre <strong className="text-white">logo</strong> (PNG fond transparent recommandé) — il apparaîtra sur tous les bulletins.</>,
//                         <>Configurez le <strong className="text-white">rayon GPS autorisé</strong> en mètres pour le pointage des employés.</>,
//                         <>Définissez le <strong className="text-white">jour de paiement des salaires</strong> (ex : le 5 du mois suivant).</>,
//                         <>Cliquez sur <strong className="text-white">Enregistrer</strong>. Ces paramètres prennent effet immédiatement.</>,
//                       ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                     </GuideCard>
//                     <InfoBlock type="warn" icon="⚠️">
//                       <strong className="font-semibold block mb-[2px]">Attention GPS</strong>
//                       Si vous ne configurez pas la localisation GPS, le module de pointage GPS sera désactivé pour tous vos employés.
//                     </InfoBlock>
//                   </>
//                 )}

//                 {typeMode === 'cabinet' && (
//                   <>
//                     <PathCrumb>Cabinet → <span className="text-cyan-400">Créer / Gérer mes PME</span></PathCrumb>
//                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                       <GuideCard icon="🏛️" iconBg="bg-cyan-400/10" title="Créer un cabinet">
//                         {[
//                           <>Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Cabinet → Créer mon cabinet</code>.</>,
//                           <>Donnez un <strong className="text-white">nom à votre structure</strong> (ex : "Cabinet Dupont RH").</>,
//                           <>Votre compte devient le compte principal avec accès total à toutes les PME.</>,
//                           <>Votre tableau de bord affiche maintenant toutes les PME rattachées.</>,
//                         ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                       </GuideCard>
//                       <GuideCard icon="🏢" iconBg="bg-emerald-400/10" title="Ajouter une PME">
//                         {[
//                           <>Dans le dashboard cabinet, cliquez <strong className="text-white">Ajouter une PME</strong>.</>,
//                           <>Renseignez les infos légales : raison sociale, RCCM, adresse.</>,
//                           <>Chaque PME dispose de sa propre config, ses employés et sa paie.</>,
//                           <>Basculez entre PME via le <strong className="text-white">sélecteur d'entreprise</strong> en haut à gauche.</>,
//                         ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                       </GuideCard>
//                     </div>
//                     <InfoBlock type="note" icon="ℹ️">
//                       <strong className="font-semibold block mb-[2px]">Isolation totale</strong>
//                       Chaque PME est isolée : ses employés, sa paie, ses documents et sa configuration sont totalement indépendants. Un seul abonnement Cabinet couvre toutes les PME rattachées.
//                     </InfoBlock>
//                   </>
//                 )}
//               </section>

//               {/* ── 04 DÉPARTEMENTS ───────────────────────────────────────────── */}
//               <section id="departements" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="04" title="Créer des départements" badge={{ label: 'Priorité 2', type: 'req' }} />
//                 <PathCrumb>Paramètres → <span className="text-cyan-400">Départements</span></PathCrumb>
//                 <GuideCard icon="📂" iconBg="bg-cyan-400/10" title="Ajouter un département">
//                   {[
//                     <>Cliquez sur <strong className="text-white">Nouveau département</strong>.</>,
//                     <>Saisissez le <strong className="text-white">nom du service</strong> (ex : Direction, RH, Comptabilité, Terrain).</>,
//                     <>Assignez un <strong className="text-white">Manager responsable</strong> si l'utilisateur existe déjà.</>,
//                     <>Sauvegardez. Le département est disponible immédiatement lors de la création d'un employé.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//                 <InfoBlock type="tip" icon="💡">
//                   <strong className="font-semibold block mb-[2px]">Bonne pratique</strong>
//                   Créez tous vos départements avant d'importer vos employés via Excel — sinon le rattachement échouera.
//                 </InfoBlock>
//               </section>

//               {/* ── 05 UTILISATEURS ───────────────────────────────────────────── */}
//               <section id="utilisateurs" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="05" title="Gestion des utilisateurs" />
//                 <PathCrumb>Paramètres → <span className="text-cyan-400">Gestion Utilisateurs</span></PathCrumb>
//                 <GuideCard icon="👥" iconBg="bg-emerald-400/10" title="Inviter un utilisateur">
//                   {[
//                     <>Cliquez sur <strong className="text-white">Inviter un utilisateur</strong>.</>,
//                     <>Saisissez l'adresse email et choisissez le <strong className="text-white">rôle</strong> approprié.</>,
//                     <>Validez. L'utilisateur reçoit un email d'invitation avec un lien d'activation valable <strong className="text-white">24h</strong>.</>,
//                     <>Pour réinitialiser un mot de passe : options <code className="font-mono text-[0.77em] text-cyan-300">⋯</code> → <em>« Envoyer un lien de réinitialisation »</em>.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//               </section>

//               {/* ── 06 PARAMÈTRES PAIE ────────────────────────────────────────── */}
//               <section id="paie-config" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="06" title="Paramètres de paie" badge={{ label: 'Critique', type: 'crit' }} />
//                 <PathCrumb>Paramètres → <span className="text-cyan-400">Paramètres de Paie</span></PathCrumb>
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
//                   Les calculs (CNSS, ITS, TOL, CAMU) sont automatisés selon la législation congolaise. Ces paramètres pilotent chaque bulletin généré — vérifiez-les avant toute paie.
//                 </p>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <GuideCard icon="%" iconBg="bg-emerald-400/10" title="CNSS & ITS">
//                     {[
//                       <>Vérifiez le <strong className="text-white">taux CNSS salarial</strong> (4 % par défaut).</>,
//                       <>Vérifiez le <strong className="text-white">taux CNSS patronal</strong> (16,5 % par défaut).</>,
//                       <>Configurez le <strong className="text-white">barème ITS</strong> selon vos options fiscales.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                   <GuideCard icon="⚙️" iconBg="bg-amber-400/10" title="Heures supp & primes">
//                     {[
//                       <>Définissez le <strong className="text-white">taux majoré</strong> des heures supplémentaires.</>,
//                       <>Créez vos <strong className="text-white">types de primes</strong> dans le Catalogue des Primes.</>,
//                       <>Configurez <strong className="text-white">TOL, CAMU</strong> et autres cotisations.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                 </div>
//               </section>

//               {/* ── 07 EMPLOYÉS ───────────────────────────────────────────────── */}
//               <section id="employes" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="07" title="Créer un employé" />
//                 <PathCrumb>Employés → <span className="text-cyan-400">Nouveau → Formulaire</span></PathCrumb>
//                 <GuideCard icon="👤" iconBg="bg-cyan-400/10" title="Formulaire en 4 étapes">
//                   {[
//                     <><strong className="text-white">Identité</strong> — Nom, prénom, date de naissance, photo, nationalité.</>,
//                     <><strong className="text-white">Situation familiale</strong> — Statut matrimonial, nombre d'enfants (impacte les calculs ITS).</>,
//                     <><strong className="text-white">Poste & contrat</strong> — Département, poste, type de contrat (CDI/CDD/Stage), date d'embauche, salaire de base.</>,
//                     <><strong className="text-white">Validation</strong> — Vérifiez le récapitulatif avant de confirmer.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//               </section>

//               {/* ── 08 IMPORT ─────────────────────────────────────────────────── */}
//               <section id="import" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="08" title="Import en masse via Excel" badge={{ label: 'Recommandé', type: 'opt' }} />
//                 <PathCrumb>Employés → <span className="text-cyan-400">Importer</span></PathCrumb>
//                 <GuideCard icon="📊" iconBg="bg-emerald-400/10" title="Procédure d'import">
//                   {[
//                     <>Téléchargez le <strong className="text-white">modèle Excel</strong> fourni sur la page d'import.</>,
//                     <>Remplissez les colonnes obligatoires : <code className="font-mono text-[0.77em] text-cyan-300">prénom</code>, <code className="font-mono text-[0.77em] text-cyan-300">nom</code>, <code className="font-mono text-[0.77em] text-cyan-300">département</code>, <code className="font-mono text-[0.77em] text-cyan-300">salaire_base</code>.</>,
//                     <>Vérifiez que les <strong className="text-white">noms de départements</strong> correspondent exactement à ceux créés dans Paramètres.</>,
//                     <>Glissez le fichier dans la zone d'import ou cliquez pour le sélectionner.</>,
//                     <>L'interface affiche un <strong className="text-white">rapport de validation</strong> avec les lignes en erreur avant confirmation.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//                 <InfoBlock type="warn" icon="⚠️">
//                   <strong className="font-semibold block mb-[2px]">Format requis</strong>
//                   Seul le format <code className="font-mono text-[0.77em] text-amber-200">.xlsx</code> est accepté. Les lignes avec un département inexistant seront rejetées.
//                 </InfoBlock>
//               </section>

//               {/* ── 09 CONTRATS ───────────────────────────────────────────────── */}
//               <section id="contrats" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="09" title="Gestion des contrats" />
//                 <PathCrumb>Employé → <span className="text-cyan-400">Fiche → Contrat</span></PathCrumb>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <GuideCard icon="📄" iconBg="bg-cyan-400/10" title="Créer un contrat">
//                     {[
//                       <>Ouvrez la fiche de l'employé concerné.</>,
//                       <>Onglet Contrat → cliquez <strong className="text-white">Nouveau contrat</strong>.</>,
//                       <>Choisissez le type (CDI, CDD…), la date de début, la durée si CDD.</>,
//                       <>Téléversez le document signé en PDF.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                   <GuideCard icon="✂️" iconBg="bg-amber-400/10" title="Rupture de contrat">
//                     {[
//                       <>Depuis la fiche employé, cliquez <strong className="text-white">Rompre le contrat</strong>.</>,
//                       <>Sélectionnez le motif (démission, licenciement, fin CDD…).</>,
//                       <>Indiquez la date de fin effective.</>,
//                       <>Le statut passe automatiquement à <code className="font-mono text-[0.77em] text-cyan-300">Suspendu</code>.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                 </div>
//                 <InfoBlock type="tip" icon="💡">
//                   <strong className="font-semibold block mb-[2px]">Alertes CDD</strong>
//                   Konza affiche une alerte automatique lorsqu'un contrat CDD arrive à échéance dans les 30 jours.
//                 </InfoBlock>
//               </section>

//               {/* ── 10 POINTAGE GPS ───────────────────────────────────────────── */}
//               <section id="pointage" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="10" title="Pointage GPS" />
//                 <PathCrumb>Présences → <span className="text-cyan-400">Ma Pointeuse GPS</span></PathCrumb>
//                 <GuideCard icon="📍" iconBg="bg-emerald-400/10" title="Comment pointer (employé / manager)">
//                   {[
//                     <>Ouvrez Konza RH sur votre téléphone ou navigateur depuis les locaux.</>,
//                     <>Autorisez la <strong className="text-white">géolocalisation</strong> du navigateur quand la demande apparaît.</>,
//                     <>L'application vérifie votre distance par rapport au périmètre autorisé.</>,
//                     <>Si validé, cliquez <strong className="text-white">Pointer l'arrivée</strong>. En fin de journée : <strong className="text-white">Pointer le départ</strong>.</>,
//                     <>La présence est enregistrée en temps réel dans la vue journalière.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <InfoBlock type="warn" icon="⚠️"><strong className="font-semibold block mb-[2px]">Hors zone</strong>Si l'employé est hors périmètre, l'app bloque le pointage. L'admin peut corriger via le Pointage manuel.</InfoBlock>
//                   <InfoBlock type="note" icon="📱"><strong className="font-semibold block mb-[2px]">Mode hors-ligne</strong>Le pointage est mis en file d'attente et synchronisé dès que la connexion revient.</InfoBlock>
//                 </div>
//               </section>

//               {/* ── 11 POINTAGE MANUEL ────────────────────────────────────────── */}
//               <section id="pointage-manuel" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="11" title="Pointage manuel" />
//                 <PathCrumb>Présences → <span className="text-cyan-400">Pointage Manuel</span></PathCrumb>
//                 <GuideCard icon="✏️" iconBg="bg-amber-400/10" title="Saisir ou corriger une présence">
//                   {[
//                     <>Sélectionnez l'<strong className="text-white">employé</strong> concerné dans la liste.</>,
//                     <>Choisissez la <strong className="text-white">date</strong> à corriger ou à compléter.</>,
//                     <>Saisissez l'heure d'<strong className="text-white">arrivée</strong> et l'heure de <strong className="text-white">départ</strong>.</>,
//                     <>Ajoutez une <strong className="text-white">note de justification</strong> (obligatoire pour les corrections).</>,
//                     <>Enregistrez. La correction apparaît avec la mention <code className="font-mono text-[0.77em] text-cyan-300">Manuel</code>.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//               </section>

//               {/* ── 12 SHIFTS ─────────────────────────────────────────────────── */}
//               <section id="shifts" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="12" title="Planning de shifts" />
//                 <PathCrumb>Présences → <span className="text-cyan-400">Shifts</span></PathCrumb>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <GuideCard icon="📅" iconBg="bg-cyan-400/10" title="Créer un shift">
//                     {[
//                       <>Cliquez sur <strong className="text-white">Nouveau shift</strong>.</>,
//                       <>Nommez-le (ex : <code className="font-mono text-[0.77em] text-cyan-300">Matin 7h–15h</code>) et définissez les horaires.</>,
//                       <>Activez <strong className="text-white">Shift de nuit</strong> si applicable (déclenche la prime nuit).</>,
//                       <>Choisissez une couleur et sauvegardez.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                   <GuideCard icon="👤" iconBg="bg-emerald-400/10" title="Assigner un shift">
//                     {[
//                       <>Cliquez <strong className="text-white">Assigner</strong> en haut de la page.</>,
//                       <>Sélectionnez le shift, puis l'employé.</>,
//                       <>Choisissez <strong className="text-white">Date précise</strong> ou <strong className="text-white">Récurrent</strong> (par jour de semaine).</>,
//                       <>Confirmez — l'employé apparaît dans <em>Employés &amp; Plannings</em>.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                 </div>
//               </section>

//               {/* ── 13 PAIE INDIVIDUELLE ──────────────────────────────────────── */}
//               <section id="paie" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="13" title="Bulletin de paie individuel" />
//                 <PathCrumb>Paie → <span className="text-cyan-400">Nouveau bulletin</span></PathCrumb>
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
//                   Les calculs (CNSS, ITS, TOL, CAMU) sont entièrement automatisés selon la législation congolaise. Vous n'avez rien à configurer manuellement.
//                 </p>
//                 <GuideCard icon="💸" iconBg="bg-emerald-400/10" title="Générer un bulletin">
//                   {[
//                     <>Cliquez sur <strong className="text-white">Nouveau bulletin</strong> dans le menu Paie.</>,
//                     <>Sélectionnez l'<strong className="text-white">employé</strong> et le <strong className="text-white">mois de paie</strong>.</>,
//                     <>Le système pré-remplit le salaire de base depuis la fiche employé.</>,
//                     <>Ajoutez les <strong className="text-white">heures supplémentaires</strong>, <strong className="text-white">primes</strong> ou <strong className="text-white">déductions</strong> si applicable.</>,
//                     <>Vérifiez l'<strong className="text-white">aperçu</strong> avec CNSS, ITS et net à payer calculés automatiquement.</>,
//                     <>Validez. Une fois le virement effectué, marquez le bulletin comme <strong className="text-white">Payé</strong>.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//               </section>

//               {/* ── 14 PAIE EN MASSE ──────────────────────────────────────────── */}
//               <section id="paie-masse" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="14" title="Paie en masse" badge={{ label: 'Gain de temps', type: 'opt' }} />
//                 <PathCrumb>Paie → <span className="text-cyan-400">Paie en masse</span></PathCrumb>
//                 <GuideCard icon="⚡" iconBg="bg-cyan-400/10" title="Lancer une paie groupée">
//                   {[
//                     <><strong className="text-white">Période</strong> — Choisissez le mois et l'année de paie.</>,
//                     <><strong className="text-white">Sélection</strong> — Filtrez par département ou sélectionnez tous les employés.</>,
//                     <><strong className="text-white">Traitement</strong> — Konza calcule automatiquement tous les bulletins.</>,
//                     <>Une fenêtre récapitule la <strong className="text-white">masse salariale totale</strong>.</>,
//                     <>Bulletins disponibles dans <strong className="text-white">Paie → Historique</strong>.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//                 <InfoBlock type="tip" icon="💡">
//                   <strong className="font-semibold block mb-[2px]">Simulateur</strong>
//                   Avant de lancer la paie, utilisez <code className="font-mono text-[0.77em] text-emerald-200">Paie → Simulateur</code> pour tester un scénario sans générer de bulletins réels.
//                 </InfoBlock>
//               </section>

//               {/* ── 15 IMPAYÉS ────────────────────────────────────────────────── */}
//               <section id="impayes" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="15" title="Suivi des impayés" />
//                 <PathCrumb>Paie → <span className="text-cyan-400">Impayés</span></PathCrumb>
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8] mb-5">
//                   Cette page détecte automatiquement les retards de salaire en comparant la date de paiement prévue (configurée dans Paramètres entreprise) avec l'état réel des bulletins. Aucune action manuelle n'est requise pour qu'une alerte apparaisse.
//                 </p>
//                 <GuideCard icon="⚠️" iconBg="bg-amber-400/10" title="Comment fonctionne la détection">
//                   {[
//                     <><strong className="text-white">J-3 avant la date prévue</strong> — Une alerte bleue apparaît pour vous rappeler de préparer les virements.</>,
//                     <><strong className="text-white">Date dépassée, aucun bulletin</strong> — Alerte violette : la paie n'a pas été lancée. Le montant affiché est approximatif.</>,
//                     <><strong className="text-white">Bulletin généré mais non payé</strong> — Alerte orange : bulletin en brouillon ou validé mais le paiement n'est pas confirmé.</>,
//                     <><strong className="text-white">Marquer comme payé</strong> — Une fois le virement effectué, marquez le bulletin comme <code className="font-mono text-[0.77em] text-cyan-300">Payé</code> dans <em>Paie → Bulletins</em> pour clôturer l'alerte.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//                 <InfoBlock type="warn" icon="⚠️">
//                   <strong className="font-semibold block mb-[2px]">Art. 95 CT Congo</strong>
//                   Les salaires doivent être payés à intervalles réguliers et à date fixe. 3 mois de retard = droit de saisir l'Inspection du Travail.
//                 </InfoBlock>
//               </section>

//               {/* ── 16 PRÊTS ──────────────────────────────────────────────────── */}
//               <section id="loans" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="16" title="Prêts & avances sur salaire" />
//                 <PathCrumb>Avances & Prêts → <span className="text-cyan-400">Nouveau financement</span></PathCrumb>
//                 <GuideCard icon="🤝" iconBg="bg-amber-400/10" title="Enregistrer un prêt">
//                   {[
//                     <>Cliquez sur <strong className="text-white">Nouveau Financement</strong>.</>,
//                     <>Sélectionnez l'<strong className="text-white">employé bénéficiaire</strong> et le type : avance ponctuelle ou prêt échelonné.</>,
//                     <>Saisissez le <strong className="text-white">montant</strong> et, pour les prêts, le nombre de mensualités.</>,
//                     <>Le remboursement est <strong className="text-white">déduit automatiquement</strong> du bulletin chaque mois.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//               </section>

//               {/* ── 17 CONGÉS ─────────────────────────────────────────────────── */}
//               <section id="conges" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="17" title="Gestion des congés" />
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <GuideCard icon="🌴" iconBg="bg-cyan-400/10" title="Employé — faire une demande">
//                     {[
//                       <>Allez dans <strong className="text-white">Mes Demandes</strong>.</>,
//                       <>Cliquez <strong className="text-white">Nouvelle demande</strong>, choisissez les dates.</>,
//                       <>Sélectionnez le type (annuel, maladie…).</>,
//                       <>Soumettez. Le manager est notifié.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                   <GuideCard icon="✅" iconBg="bg-emerald-400/10" title="Manager — valider">
//                     {[
//                       <>Allez dans <strong className="text-white">Validation Congés</strong>.</>,
//                       <>Consultez les demandes en attente.</>,
//                       <>Approuvez ou refusez avec une note.</>,
//                       <>L'employé reçoit une notification.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                 </div>
//               </section>

//               {/* ── 18 CNSS ───────────────────────────────────────────────────── */}
//               <section id="cnss" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="18" title="Déclaration CNSS" />
//                 <PathCrumb>Rapports → <span className="text-cyan-400">Déclarations</span></PathCrumb>
//                 <GuideCard icon="🏛️" iconBg="bg-cyan-400/10" title="Déclaration mensuelle">
//                   {[
//                     <>Assurez-vous que tous les bulletins du mois sont générés et validés.</>,
//                     <>Allez dans <strong className="text-white">Déclarations</strong> et sélectionnez le mois concerné.</>,
//                     <>Konza calcule automatiquement les cotisations patronales et salariales.</>,
//                     <>Exportez au format PDF ou Excel selon la CNSS.</>,
//                   ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                 </GuideCard>
//               </section>

//               {/* ── 19 RECRUTEMENT ────────────────────────────────────────────── */}
//               <section id="recrutement" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="19" title="Recrutement" />
//                 <PathCrumb>Recrutement</PathCrumb>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   <GuideCard icon="📋" iconBg="bg-cyan-400/10" title="Mode manuel">
//                     {[
//                       <>Créez une <strong className="text-white">offre d'emploi</strong> avec intitulé, description, critères.</>,
//                       <>Gérez les candidatures dans le kanban.</>,
//                       <>Faites progresser les candidats par étapes.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                   <GuideCard icon="🤖" iconBg="bg-emerald-400/10" title="Mode IA">
//                     {[
//                       <>Activez le <strong className="text-white">mode IA</strong> pour le scoring automatique des CVs.</>,
//                       <>L'IA analyse les compétences et classe les candidats.</>,
//                       <>Consultez les analytics pour optimiser vos offres.</>,
//                     ].map((c, i) => <StepItem key={i} n={i + 1}>{c}</StepItem>)}
//                   </GuideCard>
//                 </div>
//               </section>

//               {/* ── 20 FORMATION ──────────────────────────────────────────────── */}
//               <section id="formation" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="20" title="Formation" />
//                 <PathCrumb>Formation</PathCrumb>
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8]">
//                   Gérez le plan de formation de vos équipes : créez des sessions, assignez des participants et suivez les compétences développées. Les formations terminées sont consignées dans le dossier de chaque employé.
//                 </p>
//               </section>

//               {/* ── 21 MATÉRIEL ───────────────────────────────────────────────── */}
//               <section id="materiel" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="21" title="Gestion du matériel" />
//                 <PathCrumb>Matériel</PathCrumb>
//                 <p className="text-[0.88rem] text-slate-400 leading-[1.8]">
//                   Enregistrez les équipements attribués à chaque employé (ordinateur, véhicule, téléphone…). Lors d'une rupture de contrat, la liste du matériel à restituer est générée automatiquement.
//                 </p>
//               </section>

//               {/* ── FAQ ───────────────────────────────────────────────────────── */}
//               <section id="faq" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <SectionHead num="—" title="Questions fréquentes" />
//                 <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] overflow-hidden">
//                   <FaqItem defaultOpen q="Pourquoi mon bulletin de paie a un montant incorrect ?"
//                     a={<>Vérifiez d'abord les Paramètres de Paie (taux CNSS, barème ITS). Ensuite, ouvrez la fiche de l'employé et confirmez que son salaire de base est correct. Vérifiez enfin les primes et déductions ajoutées manuellement. Vous pouvez modifier un bulletin via <code className="font-mono text-[0.77em] text-cyan-300">Paie → [bulletin] → Modifier</code>.</>} />
//                   <FaqItem q="Un employé ne peut pas pointer en GPS — que faire ?"
//                     a={<>Vérifiez que la localisation GPS est activée dans <code className="font-mono text-[0.77em] text-cyan-300">Paramètres → Entreprise</code> et que le rayon autorisé est suffisant. Assurez-vous que l'employé autorise la géolocalisation dans son navigateur. En dernier recours, utilisez le Pointage Manuel.</>} />
//                   <FaqItem q="Comment réinitialiser le mot de passe d'un utilisateur ?"
//                     a={<>Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Paramètres → Gestion Utilisateurs</code>, trouvez l'utilisateur et cliquez sur les options <code className="font-mono text-[0.77em] text-cyan-300">⋯</code>. Sélectionnez "Envoyer un lien de réinitialisation". Le lien est valable 24h.</>} />
//                   <FaqItem q="Les impayés apparaissent même si je n'ai pas généré de bulletin — est-ce normal ?"
//                     a={<>Oui, c'est voulu. Le système détecte les retards basés sur la date de paiement prévue et non sur l'existence d'un bulletin. Si la date est dépassée et qu'aucun bulletin n'est généré, c'est considéré comme un retard. Le montant affiché est alors <strong>approximatif</strong>. Pour clôturer l'alerte : générez le bulletin, effectuez le virement, puis marquez le bulletin comme <code className="font-mono text-[0.77em] text-cyan-300">Payé</code>.</>} />
//                   <FaqItem q="Peut-on gérer plusieurs entreprises depuis un seul compte ?"
//                     a={<>Oui, via le Mode Cabinet. Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Cabinet → Créer mon cabinet</code>, puis ajoutez vos PME. Chaque PME dispose de sa propre configuration, employés et paie, accessibles depuis un tableau de bord central.</>} />
//                   <FaqItem q="Comment exporter les données pour la comptabilité ?"
//                     a={<>Allez dans <code className="font-mono text-[0.77em] text-cyan-300">Rapports → Comptabilité</code>. Vous pouvez exporter le journal de paie, le récapitulatif des cotisations et le grand livre RH au format Excel ou PDF.</>} />
//                   <FaqItem q="Les données sont-elles sauvegardées automatiquement ?"
//                     a={<>Oui. Toutes les données sont sauvegardées en temps réel sur nos serveurs. Le mode hors-ligne stocke temporairement les pointages en local et les synchronise dès que la connexion revient.</>} />
//                 </div>
//               </section>

//               {/* Footer doc */}
//               <div className="mt-16 pt-6 border-t border-white/[0.06] flex items-center justify-between text-[0.75rem] text-slate-500">
//                 <span>Konza RH · Centre d'aide v2.0</span>
//                 <span>Besoin d'aide ? Contactez le support via l'application.</span>
//               </div>
//             </>
//           )}

//           {/* ════════════════════════════════════════════════════════════════
//               PAGE VIDÉOS
//           ════════════════════════════════════════════════════════════════ */}
//           {page === 'videos' && (
//             <>
//               {/* Hero vidéos */}
//               <div className="mb-10">
//                 <p className="text-[0.7rem] font-mono text-cyan-400 uppercase tracking-[0.12em] mb-3">Tutoriels vidéo</p>
//                 <h1 className="text-[2rem] font-extrabold tracking-[-0.04em] mb-3"
//                   style={{ background: 'linear-gradient(135deg,#fff 20%,#94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
//                  Apprenez Konza RH<br />en vidéo
//                 </h1>
//                 <p className="text-[0.9rem] text-slate-400 max-w-[480px] leading-[1.8]">
//                   Courtes vidéos de démonstration pour chaque module. Cliquez sur une vidéo pour l'ouvrir sur YouTube.
//                 </p>
//               </div>

//               {/* Démarrage */}
//               <section id="vid-demarrage" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
//                   <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Démarrage</span><h2 className="text-[1.3rem] font-bold text-white">Premiers pas</h2></div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_1" module="Démarrage" duration="2:30" title="Créer votre compte & première configuration" desc="De l'inscription à votre premier tableau de bord en moins de 3 minutes." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_2" module="Démarrage" duration="3:15" title="Configurer votre entreprise & départements" desc="Paramètres essentiels : logo, RCCM, GPS et structure organisationnelle." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_3" module="Démarrage" duration="1:45" title="Inviter des utilisateurs & assigner des rôles" desc="Créer des comptes RH Manager, Manager et Employé depuis les paramètres." />
//                 </div>
//               </section>

//               {/* Employés */}
//               <section id="vid-employes" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
//                   <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Employés</span><h2 className="text-[1.3rem] font-bold text-white">Gestion des employés</h2></div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_4" module="Employés" duration="4:00" title="Ajouter un employé manuellement" desc="Remplir le formulaire complet : identité, contrat, salaire de base." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_5" module="Employés" duration="3:30" title="Import Excel — ajouter 50 employés en 2 minutes" desc="Télécharger le modèle, le remplir et importer avec rapport de validation." />
//                 </div>
//               </section>

//               {/* Présences */}
//               <section id="vid-presences" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
//                   <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Présences</span><h2 className="text-[1.3rem] font-bold text-white">Pointage & plannings</h2></div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_6" module="Présences" duration="2:20" title="Pointage GPS — pointer son arrivée" desc="Démonstration complète du pointage depuis un téléphone mobile." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_7" module="Présences" duration="2:50" title="Créer et assigner des shifts de travail" desc="Planifier des horaires matin/soir/nuit et les assigner aux équipes." />
//                 </div>
//               </section>

//               {/* Paie */}
//               <section id="vid-paie" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
//                   <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Paie</span><h2 className="text-[1.3rem] font-bold text-white">Bulletins & paiements</h2></div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_8" module="Paie" duration="5:10" title="Générer un bulletin de paie individuel" desc="De la création à la validation avec CNSS, ITS et net à payer calculés." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_9" module="Paie" duration="4:00" title="Paie en masse — tout un département" desc="Lancer la paie pour 30 employés simultanément en quelques clics." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_10" module="Paie" duration="3:20" title="Suivi des impayés — comprendre les alertes" desc="Comment lire le tableau de bord impayés et marquer un paiement comme effectué." />
//                 </div>
//               </section>

//               {/* Autres */}
//               <section id="vid-autres" className="mb-[4.5rem] scroll-mt-[2rem]">
//                 <div className="flex items-end gap-4 mb-6 pb-3 border-b border-white/[0.06]">
//                   <div><span className="block font-mono text-[0.65rem] text-slate-500 mb-[3px]">Autres</span><h2 className="text-[1.3rem] font-bold text-white">Modules complémentaires</h2></div>
//                 </div>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_11" module="Congés" duration="2:45" title="Demande et validation de congés" desc="Processus complet de demande employé à validation manager." />
//                   <VideoCard href="https://youtube.com/watch?v=VOTRE_ID_12" module="CNSS" duration="3:00" title="Générer la déclaration CNSS mensuelle" desc="Export automatique des cotisations pour la CNSS Congo." />
//                 </div>
//               </section>

//               {/* CTA YouTube */}
//               <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] p-8 text-center mb-16">
//                 <h3 className="text-[1.1rem] font-bold text-white mb-2">Voir toutes nos vidéos sur YouTube</h3>
//                 <p className="text-[0.85rem] text-slate-400 mb-5">Notre chaîne YouTube contient l'intégralité des tutoriels et est mise à jour à chaque nouvelle fonctionnalité.</p>
//                 <a
//                   href="https://youtube.com/@KonzaRH"
//                   target="_blank"
//                   rel="noopener"
//                   className="inline-flex items-center gap-2 px-[1.4rem] py-[0.65rem] bg-[#ff0000] text-white text-[0.85rem] font-bold rounded-[10px] hover:opacity-90 transition-opacity"
//                 >
//                   <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
//                     <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.5 9.5.5 9.5.5s7.6 0 9.5-.5c1-.3 1.7-1.1 2-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
//                   </svg>
//                   Voir la chaîne YouTube
//                 </a>
//               </div>
//             </>
//           )}

//         </main>
//       </div>

//       {/* Footer de la landing */}
//       <Footer />
//     </>
//   );
// }











