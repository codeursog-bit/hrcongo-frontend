'use client';

// ============================================================================
// 📁 app/docs/page.tsx  —  Centre d'aide Konza RH
// ============================================================================
// ✅ Sidebar sticky (position:fixed)
// ✅ Switcher Vidéos / Guide  (vidéos en premier)
// ✅ Entreprise ↔ Cabinet : bouton toggle, jamais les deux en même temps
// ✅ Captures d'écran avec lightbox (scroll horizontal par section)
// ✅ Vidéos lues DIRECTEMENT sur le site (YouTube iframe embed), pas redirect
// ✅ Miniatures cliquables + modale description + player intégré
// ✅ Vrais barèmes ITS 2026 + CNSS exacts
// ✅ Fond #020617 identique à la landing
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

// ─── Types ────────────────────────────────────────────────────────────────────

type PageView    = 'videos' | 'doc';
type CompanyMode = 'entreprise' | 'cabinet';
type AlertType   = 'tip' | 'warn' | 'note';

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

// VideoItem utilise un youtubeId pour l'embed iframe
interface VideoItem {
  youtubeId: string;   // ex: "dQw4w9WgXcQ"  — remplacez par vos vrais IDs
  thumb?: string;      // chemin local /videos/thumbs/... ou laisser vide pour auto-thumb YouTube
  duration: string;
  module: string;
  title: string;
  desc: string;
  // Pour une description longue visible dans la modale
  longDesc?: string;
}

// ─── Navigation constants ─────────────────────────────────────────────────────

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

// ─── Video Card — miniature + modale avec iframe YouTube ──────────────────────

function VideoCard({
  video,
  onOpen,
}: {
  video: VideoItem;
  onOpen: (video: VideoItem) => void;
}) {
  // Miniature : priorité à l'image locale, fallback auto YouTube hqdefault
  const thumbSrc = video.thumb
    ? video.thumb
    : `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`;

  const moduleBadgeColor: Record<string, string> = {
    'Démarrage': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    'Employés':  'bg-violet-500/15 text-violet-400 border-violet-500/20',
    'Présences': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'Paie':      'bg-amber-500/15 text-amber-400 border-amber-500/20',
    'Congés':    'bg-sky-500/15 text-sky-400 border-sky-500/20',
    'CNSS':      'bg-rose-500/15 text-rose-400 border-rose-500/20',
  };
  const badgeCls = moduleBadgeColor[video.module] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20';

  return (
    <div
      className="group bg-[#0b1121] border border-white/[0.06] rounded-2xl overflow-hidden hover:border-cyan-500/30 hover:-translate-y-0.5 transition-all cursor-pointer"
      onClick={() => onOpen(video)}
    >
      {/* Thumbnail */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-white/[0.04] to-white/[0.02] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbSrc}
          alt={video.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={e => {
            const t = e.currentTarget;
            t.style.display = 'none';
            const ph = t.nextElementSibling as HTMLElement;
            if (ph) ph.style.display = 'flex';
          }}
        />
        {/* Placeholder si image absente */}
        <div className="absolute inset-0 flex-col items-center justify-center gap-2 text-slate-600 font-mono hidden">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" opacity="0.3">
            <path d="M21 3H3C1.9 3 1 3.9 1 5v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 13l-5-4 5-4v8z"/>
          </svg>
          <span className="text-[10px]">{video.title}</span>
        </div>

        {/* Overlay sombre + bouton play */}
        <div className="absolute inset-0 bg-[#020617]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="w-14 h-14 rounded-full bg-white/10 border-2 border-white/50 flex items-center justify-center backdrop-blur-sm group-hover:bg-cyan-500 group-hover:border-cyan-500 transition-colors duration-200 shadow-lg">
            <svg className="ml-1" width="22" height="22" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>

        {/* Always-visible play icon (subtile) */}
        <div className="absolute inset-0 flex items-center justify-center group-hover:opacity-0 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-[#020617]/60 border border-white/20 flex items-center justify-center backdrop-blur-sm">
            <svg className="ml-0.5" width="16" height="16" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
        </div>

        {/* Module badge */}
        <span className={`absolute top-2 left-2.5 text-[10px] font-mono font-semibold border px-2 py-0.5 rounded-full ${badgeCls}`}>
          {video.module}
        </span>
        {/* Duration badge */}
        <span className="absolute bottom-2 right-2.5 text-[10px] font-mono font-semibold bg-[#020617]/80 text-white px-1.5 py-0.5 rounded">
          {video.duration}
        </span>
      </div>

      {/* Info */}
      <div className="p-4">
        <p className="text-[13.5px] font-semibold text-white mb-1.5 leading-snug group-hover:text-cyan-300 transition-colors">
          {video.title}
        </p>
        <p className="text-[12px] text-slate-400 leading-relaxed line-clamp-2">
          {video.desc}
        </p>
        <div className="mt-3 flex items-center gap-1.5 text-[11px] text-cyan-500 font-semibold">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Voir la vidéo
        </div>
      </div>
    </div>
  );
}

// ─── Video Modal — iframe YouTube intégré ────────────────────────────────────

function VideoModal({
  video,
  onClose,
}: {
  video: VideoItem;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const moduleBadgeColor: Record<string, string> = {
    'Démarrage': 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
    'Employés':  'bg-violet-500/15 text-violet-400 border-violet-500/20',
    'Présences': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    'Paie':      'bg-amber-500/15 text-amber-400 border-amber-500/20',
    'Congés':    'bg-sky-500/15 text-sky-400 border-sky-500/20',
    'CNSS':      'bg-rose-500/15 text-rose-400 border-rose-500/20',
  };
  const badgeCls = moduleBadgeColor[video.module] ?? 'bg-slate-500/15 text-slate-400 border-slate-500/20';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(2,6,23,0.92)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[860px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl"
        style={{ background: '#0b1121' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/[0.08] border border-white/15 text-white flex items-center justify-center hover:bg-white/15 transition-colors text-sm"
        >
          ✕
        </button>

        {/* YouTube iframe player */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' /* 16:9 */ }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&color=white`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>

        {/* Description */}
        <div className="p-5 border-t border-white/[0.06]">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`text-[10px] font-mono font-semibold border px-2 py-0.5 rounded-full ${badgeCls}`}>
                  {video.module}
                </span>
                <span className="text-[10px] font-mono text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">
                  {video.duration}
                </span>
              </div>
              <h3 className="text-[1rem] font-bold text-white mb-2 leading-snug">
                {video.title}
              </h3>
              <p className="text-[13px] text-slate-400 leading-relaxed">
                {video.longDesc ?? video.desc}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Lightbox (screenshots) ───────────────────────────────────────────────────

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
  // Vidéos en premier par défaut
  const [page,        setPage]        = useState<PageView>('videos');
  const [companyMode, setCompanyMode] = useState<CompanyMode>('entreprise');
  const [activeId,    setActiveId]    = useState('vid-demarrage');
  const [lightbox,    setLightbox]    = useState<{ src: string; alt: string } | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);

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

  const openLightbox  = useCallback((src: string, alt: string) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);
  const openVideo     = useCallback((video: VideoItem) => setActiveVideo(video), []);
  const closeVideo    = useCallback(() => setActiveVideo(null), []);

  const currentNav = page === 'videos' ? VIDEO_NAV : DOC_NAV;

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

      {/* Mode switcher — Vidéos en premier */}
      <div className="flex gap-1 mx-3 mt-3 mb-1 bg-white/[0.04] border border-white/[0.06] rounded-xl p-1">
        {(['videos', 'doc'] as const).map(v => (
          <button
            key={v}
            onClick={() => setPage(v)}
            className={`flex-1 py-1.5 text-[11.5px] font-semibold rounded-lg transition-all ${
              page === v
                ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-[#020617] shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {v === 'videos' ? '▶ Vidéos' : '📖 Guide'}
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
      {([['videos', '▶ Tutoriels vidéo'], ['doc', '📖 Documentation']] as const).map(([v, label]) => (
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
  //  VIDEOS CONTENT
  // ─────────────────────────────────────────────────────────────────────────

  // ⚠️  REMPLACEMENT : remplacez les youtubeId par vos vrais IDs YouTube.
  //     Les thumb peuvent être remplacées par vos images dans /public/videos/thumbs/
  //     Si thumb est absent ou vide, la miniature YouTube hqdefault sera utilisée automatiquement.
  const videoSections: { id: string; label: string; sectionTitle: string; videos: VideoItem[] }[] = [
    {
      id: 'vid-demarrage', label: 'Démarrage', sectionTitle: 'Premiers pas',
      videos: [
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/demarrage-01.jpg', // 🔁 Ou laissez vide pour la miniature YouTube auto
          duration: '2:30', module: 'Démarrage',
          title: 'Créer votre compte & première configuration',
          desc: "De l'inscription à votre premier tableau de bord en moins de 3 minutes.",
          longDesc: "Suivez chaque étape depuis la page d'inscription jusqu'à votre premier tableau de bord opérationnel. Nous couvrons la création du compte, la confirmation de l'email, et l'assistant de démarrage qui vous guide pour créer votre première entreprise ou cabinet.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/demarrage-02.jpg',
          duration: '3:15', module: 'Démarrage',
          title: 'Configurer votre entreprise & départements',
          desc: "Paramètres essentiels : logo, RCCM, GPS et structure organisationnelle.",
          longDesc: "Apprenez à configurer les paramètres clés de votre entreprise : raison sociale, RCCM/NIF, logo, adresse et le rayon GPS autorisé pour le pointage. Nous créons ensuite les premiers départements qui permettront d'organiser vos employés.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/demarrage-03.jpg',
          duration: '1:45', module: 'Démarrage',
          title: 'Inviter des utilisateurs & assigner des rôles',
          desc: "Créer des comptes RH Manager, Manager et Employé depuis les paramètres.",
          longDesc: "Découvrez comment inviter vos collaborateurs sur Konza RH via un email d'activation. Nous couvrons l'assignation des rôles (Admin, RH Manager, Manager, Employé) et les droits correspondants à chaque niveau d'accès.",
        },
      ],
    },
    {
      id: 'vid-employes', label: 'Employés', sectionTitle: 'Gestion des employés',
      videos: [
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/employes-01.jpg',
          duration: '4:00', module: 'Employés',
          title: 'Ajouter un employé manuellement',
          desc: "Remplir le formulaire complet : identité, contrat, salaire de base.",
          longDesc: "Tutoriel complet pour créer une fiche employé : identité (nom, prénom, date de naissance, photo), situation familiale (impact sur les calculs ITS), poste et contrat (CDI/CDD/Stage), département, et salaire de base. Chaque champ est expliqué avec son impact sur la paie.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/employes-02.jpg',
          duration: '3:30', module: 'Employés',
          title: 'Import Excel — ajouter 50 employés en 2 minutes',
          desc: "Télécharger le modèle, le remplir et importer avec rapport de validation.",
          longDesc: "Apprenez à importer des employés en masse via le modèle Excel fourni par Konza RH. Nous montrons comment télécharger le modèle, remplir les colonnes obligatoires (prénom, nom, département, salaire_base), et analyser le rapport de validation pour corriger les erreurs avant l'import définitif.",
        },
      ],
    },
    {
      id: 'vid-presences', label: 'Présences', sectionTitle: 'Pointage & plannings',
      videos: [
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/presences-01.jpg',
          duration: '2:20', module: 'Présences',
          title: 'Pointage GPS — pointer son arrivée',
          desc: "Démonstration complète du pointage depuis un téléphone mobile.",
          longDesc: "Démonstration en temps réel du pointage GPS depuis un smartphone. Nous autorisons la géolocalisation, vérifions que l'employé est bien dans le périmètre autorisé, et enregistrons l'arrivée et le départ. Le mode hors-ligne est également présenté.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/presences-02.jpg',
          duration: '2:50', module: 'Présences',
          title: 'Créer et assigner des shifts de travail',
          desc: "Planifier des horaires matin/soir/nuit et les assigner aux équipes.",
          longDesc: "Apprenez à créer des shifts (Matin 7h–15h, Soir 15h–23h, Nuit 23h–7h…), activer la prime de nuit si applicable, puis assigner ces shifts à des employés de manière ponctuelle ou récurrente par jour de la semaine.",
        },
      ],
    },
    {
      id: 'vid-paie', label: 'Paie', sectionTitle: 'Bulletins & paiements',
      videos: [
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/paie-01.jpg',
          duration: '5:10', module: 'Paie',
          title: 'Générer un bulletin de paie individuel',
          desc: "De la création à la validation avec CNSS, ITS et net à payer calculés.",
          longDesc: "Tutoriel pas-à-pas pour générer un bulletin de paie : sélection de l'employé et du mois, ajout des heures supplémentaires, primes et déductions, puis validation du bulletin. Tous les calculs (CNSS salarié/patronal, ITS 2026, TUS, net à payer) sont effectués automatiquement.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/paie-02.jpg',
          duration: '4:00', module: 'Paie',
          title: 'Paie en masse — tout un département',
          desc: "Lancer la paie pour 30 employés simultanément en quelques clics.",
          longDesc: "Économisez du temps en générant les bulletins de tout un département ou de tous vos employés simultanément. La vidéo montre comment sélectionner la période, filtrer par département, lancer le traitement en masse et vérifier le récapitulatif de la masse salariale avant validation.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/paie-03.jpg',
          duration: '3:20', module: 'Paie',
          title: 'Suivi des impayés — comprendre les alertes',
          desc: "Comment lire le tableau de bord impayés et marquer un paiement comme effectué.",
          longDesc: "Le module impayés détecte automatiquement les retards de paiement. Cette vidéo explique les 3 niveaux d'alertes (J-3, bulletin non généré, bulletin non payé), comment interpréter les montants approximatifs, et la procédure pour clôturer une alerte après avoir effectué le virement.",
        },
      ],
    },
    {
      id: 'vid-autres', label: 'Autres', sectionTitle: 'Modules complémentaires',
      videos: [
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/conges-01.jpg',
          duration: '2:45', module: 'Congés',
          title: 'Demande et validation de congés',
          desc: "Processus complet de demande employé à validation manager.",
          longDesc: "Suivez le cycle complet d'une demande de congé : l'employé soumet sa demande (dates, type : annuel/maladie/autre), le manager reçoit une notification, peut approuver ou refuser avec une note, et l'employé est notifié du résultat.",
        },
        {
          youtubeId: 'dQw4w9WgXcQ', // 🔁 Remplacez par votre vrai ID
          thumb: '/videos/thumbs/cnss-01.jpg',
          duration: '3:00', module: 'CNSS',
          title: 'Générer la déclaration CNSS mensuelle',
          desc: "Export automatique des cotisations pour la CNSS Congo.",
          longDesc: "Apprenez à générer et exporter la déclaration mensuelle CNSS depuis Konza RH : vérification que tous les bulletins sont validés, sélection du mois, calcul automatique des cotisations salariales et patronales, puis export au format PDF ou Excel conforme à la CNSS Congo.",
        },
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
          Courtes vidéos de démonstration pour chaque module. Cliquez sur une vidéo pour la lire directement ici, sans quitter la page.
        </p>
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-cyan-500/20 bg-cyan-500/[0.07] text-cyan-400">
            ▶ Lecture sur la page
          </span>
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.07] text-emerald-400">
            ✓ {videoSections.reduce((acc, s) => acc + s.videos.length, 0)} tutoriels disponibles
          </span>
        </div>
      </div>

      {videoSections.map(sec => (
        <section key={sec.id} id={sec.id} className="mb-14 scroll-mt-20">
          <div className="flex items-end gap-3 mb-5 pb-3 border-b border-white/[0.06]">
            <div>
              <span className="block font-mono text-[10px] text-slate-500 mb-0.5">{sec.label}</span>
              <h2 className="text-[1.2rem] font-bold tracking-tight text-white">{sec.sectionTitle}</h2>
            </div>
            <span className="ml-auto text-[11px] font-mono text-slate-600 pb-0.5">
              {sec.videos.length} vidéo{sec.videos.length > 1 ? 's' : ''}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sec.videos.map((v, i) => (
              <VideoCard key={i} video={v} onOpen={openVideo} />
            ))}
          </div>
        </section>
      ))}

      {/* CTA footer */}
      <div className="bg-[#0b1121] border border-white/[0.06] rounded-[14px] p-8 text-center mb-16">
        <h3 className="text-[1.1rem] font-bold text-white mb-2">Voir toutes nos vidéos sur YouTube</h3>
        <p className="text-[0.85rem] text-slate-400 mb-5">
          Notre chaîne YouTube contient l'intégralité des tutoriels et est mise à jour à chaque nouvelle fonctionnalité.
        </p>
        <a
          href="https://youtube.com/@KonzaRH"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-[1.4rem] py-[0.65rem] bg-[#ff0000] text-white text-[0.85rem] font-bold rounded-[10px] hover:opacity-90 transition-opacity"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.5 6.2c-.3-1-1-1.8-2-2.1C19.6 3.6 12 3.6 12 3.6s-7.6 0-9.5.5c-1 .3-1.7 1.1-2 2.1C0 8.1 0 12 0 12s0 3.9.5 5.8c.3 1 1 1.8 2 2.1 1.9.5 9.5.5 9.5.5s7.6 0 9.5-.5c1-.3 1.7-1.1 2-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8zM9.7 15.5V8.5l6.3 3.5-6.3 3.5z"/>
          </svg>
          Voir la chaîne YouTube
        </a>
      </div>
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
          {videosContent}
          {docContent}
        </main>
      </div>

      {/* Lightbox screenshots */}
      {lightbox && <Lightbox src={lightbox.src} alt={lightbox.alt} onClose={closeLightbox} />}

      {/* Video modal — YouTube iframe */}
      {activeVideo && <VideoModal video={activeVideo} onClose={closeVideo} />}

      <Footer />
    </div>
  );
}