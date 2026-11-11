// 📁 EMPLACEMENT (projet frontend) : app/(dashboard)/presences/synchronisation/page.tsx
'use client';

// ============================================================================
// ✅ Écran ADMIN/HR_MANAGER : connecter la pointeuse PROPRE à l'entreprise
//    (ZKTeco réseau, fichier d'export Excel/CSV, API) et récupérer ses
//    pointages dans Konza d'un clic sur « Synchroniser ».
// ✅ Consomme le module backend device-sync.
// ============================================================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  RefreshCw, Plus, Loader2, Check, X, Copy, Trash2, ShieldAlert, Wifi, WifiOff,
  Cable, FileSpreadsheet, Globe, Wrench, AlertTriangle, Clock, CheckCircle2,
  XCircle, Users, History, ChevronDown, KeyRound, Link2, Power, Moon, Sparkles,
} from 'lucide-react';
import { api } from '@/services/api';
import { useNotification } from '@/components/providers/NotificationProvider';
import PresenceSubNav from '@/components/PresenceSubNav';
import { useBasePath } from '@/hooks/useBasePath';
import { KonzaLoader } from '@/components/ui/KonzaLoader';

// ── Types ────────────────────────────────────────────────────────────────
type JobStatus = 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';
type ConnectorKind = 'ZKTECO_NETWORK' | 'FILE_IMPORT' | 'HTTP_API' | 'CUSTOM';

interface JobStats {
  phase?: 'RECEIVING' | 'PROCESSING' | 'DONE';
  received?: number; inserted?: number; duplicates?: number; rejected?: number;
  daysWritten?: number; incomplete?: number; conflicts?: number;
  unmappedPeople?: number; ignored?: number; pending?: number;
}

interface Job {
  id: string;
  connectorId: string;
  status: JobStatus;
  trigger: 'MANUAL' | 'SCHEDULED';
  rangeFrom: string | null;
  rangeTo: string | null;
  requestedAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  stats: JobStats | null;
  error: string | null;
  alreadyRunning?: boolean;
}

interface Connector {
  id: string;
  name: string;
  kind: ConnectorKind;
  isActive: boolean;
  autoSyncEnabled: boolean;
  online: boolean;
  lastSeenAt: string | null;
  lastAgentVersion: string | null;
  lastSyncAt: string | null;
  lastPunchAt: string | null;
  agentKeyHint: string;
  issues: { incomplete: number; conflict: number; unmapped: number };
  lastJob: Job | null;
}

interface EmployeeLite { id: string; firstName: string; lastName: string; employeeNumber: string }
interface MappingItem {
  deviceUserId: string; deviceUserName: string | null;
  employeeId: string | null; employee: EmployeeLite | null;
  suggestionEmployeeId: string | null;
}
interface IncompleteItem {
  connectorId: string; employeeId: string; employeeName: string; employeeNumber: string;
  date: string; punchTimes: string[];
}
interface ConflictItem extends IncompleteItem {
  note: string | null;
  existing: { status: string; checkIn: string | null; checkOut: string | null; checkInMethod: string | null } | null;
}
interface UnmappedItem { connectorId: string; deviceUserId: string; name: string | null; punches: number }
interface Issues { incomplete: IncompleteItem[]; conflicts: ConflictItem[]; unmapped: UnmappedItem[] }

// ── Constantes d'affichage ────────────────────────────────────────────────
const TZ = 'Africa/Brazzaville';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const KIND_META: Record<ConnectorKind, { label: string; hint: string; icon: React.ElementType }> = {
  ZKTECO_NETWORK: { label: 'Pointeuse réseau (ZKTeco)', hint: 'Empreinte, carte ou visage — branchée au réseau de l’entreprise', icon: Cable },
  FILE_IMPORT: { label: 'Fichier d’export Excel / CSV', hint: 'La pointeuse ou son logiciel exporte un fichier dans un dossier', icon: FileSpreadsheet },
  HTTP_API: { label: 'API / logiciel de la pointeuse', hint: 'La pointeuse ou son logiciel expose une API web', icon: Globe },
  CUSTOM: { label: 'Autre modèle', hint: 'Nous écrivons l’adaptateur pour votre modèle', icon: Wrench },
};

const PERIODS = [
  { id: 'SINCE_LAST', label: 'Depuis la dernière synchronisation' },
  { id: 'TODAY', label: 'Aujourd’hui' },
  { id: 'WEEK', label: 'Cette semaine' },
  { id: 'MONTH', label: 'Ce mois-ci' },
  { id: 'LAST_MONTH', label: 'Le mois dernier' },
  { id: 'CUSTOM', label: 'Période personnalisée…' },
] as const;
type PeriodId = (typeof PERIODS)[number]['id'];

// ── Helpers ───────────────────────────────────────────────────────────────
const congoToday = () => new Date().toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD
const addDaysStr = (d: string, n: number) => {
  const x = new Date(`${d}T12:00:00Z`); x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};

function periodToRange(p: PeriodId, custom: { from: string; to: string }): { rangeFrom?: string; rangeTo?: string } {
  const today = congoToday();
  switch (p) {
    case 'TODAY': return { rangeFrom: today, rangeTo: today };
    case 'WEEK': {
      const dow = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0=dim
      return { rangeFrom: addDaysStr(today, -((dow + 6) % 7)), rangeTo: today };
    }
    case 'MONTH': return { rangeFrom: `${today.slice(0, 8)}01`, rangeTo: today };
    case 'LAST_MONTH': {
      const first = `${today.slice(0, 8)}01`;
      const lastPrev = addDaysStr(first, -1);
      return { rangeFrom: `${lastPrev.slice(0, 8)}01`, rangeTo: lastPrev };
    }
    case 'CUSTOM': return { rangeFrom: custom.from, rangeTo: custom.to };
    default: return {};
  }
}

const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('fr-FR', { timeZone: TZ, day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('fr-FR', { timeZone: TZ, hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDay = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });

function ago(iso: string | null): string {
  if (!iso) return 'jamais';
  const s = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return 'à l’instant';
  if (s < 3600) return `il y a ${Math.round(s / 60)} min`;
  if (s < 86400) return `il y a ${Math.round(s / 3600)} h`;
  return `il y a ${Math.round(s / 86400)} j`;
}

const isActive = (j: Job | null | undefined) => !!j && (j.status === 'PENDING' || j.status === 'RUNNING');

const card = 'bg-[var(--surface)] border border-[var(--border)] rounded-2xl';
const btnPrimary = 'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';
const btnGhost = 'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] disabled:opacity-50 transition-colors';
const inputCls = 'px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-emerald-500/50';

// ── Pastille d'état de l'agent ────────────────────────────────────────────
function AgentPill({ c }: { c: Connector }) {
  if (!c.isActive) {
    return <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)]"><Power size={12} /> Désactivé</span>;
  }
  return c.online ? (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600">
      <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>
      Agent en ligne
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600" title={`Dernier contact : ${ago(c.lastSeenAt)}`}>
      <WifiOff size={12} /> Agent hors ligne · {ago(c.lastSeenAt)}
    </span>
  );
}

// ── Progression en direct d'une synchronisation ───────────────────────────
function JobProgress({ job, agentOnline, onCancel }: { job: Job; agentOnline: boolean; onCancel: () => void }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((n) => n + 1), 1000); return () => clearInterval(t); }, []);

  const phase = job.stats?.phase;
  const step = job.status === 'PENDING' ? 1 : phase === 'PROCESSING' ? 3 : 2;
  const waited = Math.round((Date.now() - new Date(job.requestedAt).getTime()) / 1000);

  const steps = [
    { n: 1, label: 'Demande envoyée' },
    { n: 2, label: 'Lecture de la pointeuse' },
    { n: 3, label: 'Calcul des présences' },
  ];

  return (
    <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4" role="status" aria-live="polite">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 size={16} className="animate-spin text-emerald-500" />
        <p className="text-sm font-bold text-[var(--text)]">
          {step === 1 && 'En attente de l’agent…'}
          {step === 2 && 'L’agent lit la pointeuse…'}
          {step === 3 && 'Konza calcule les présences…'}
        </p>
        <span className="ml-auto text-xs text-[var(--text-muted)] tabular-nums">{waited} s</span>
      </div>

      <ol className="flex items-center gap-2 mb-2">
        {steps.map((s, i) => (
          <React.Fragment key={s.n}>
            <li className="flex items-center gap-2 min-w-0">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${s.n < step ? 'bg-emerald-500 text-white' : s.n === step ? 'bg-emerald-500/20 text-emerald-600 ring-2 ring-emerald-500/40' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
                {s.n < step ? <Check size={12} /> : s.n}
              </span>
              <span className={`text-xs truncate ${s.n <= step ? 'text-[var(--text)] font-semibold' : 'text-[var(--text-muted)]'}`}>{s.label}</span>
            </li>
            {i < steps.length - 1 && <span className={`h-px flex-1 ${s.n < step ? 'bg-emerald-500' : 'bg-[var(--border)]'}`} />}
          </React.Fragment>
        ))}
      </ol>

      {step === 2 && (job.stats?.received ?? 0) > 0 && (
        <p className="text-xs text-[var(--text-muted)] mt-2">{job.stats?.received} pointage(s) reçus…</p>
      )}
      {step === 1 && !agentOnline && (
        <p className="text-xs text-amber-600 mt-2 flex items-start gap-1.5">
          <AlertTriangle size={13} className="mt-0.5 shrink-0" />
          L’agent est hors ligne (PC éteint ou sans internet ?). La demande sera prise dès qu’il se reconnecte, pendant 30 minutes.
        </p>
      )}
      {step === 1 && agentOnline && waited > 45 && (
        <p className="text-xs text-[var(--text-muted)] mt-2">L’agent vérifie toutes les 20 secondes, encore un instant…</p>
      )}
      <button onClick={onCancel} className="mt-3 text-xs font-semibold text-[var(--text-muted)] hover:text-red-500 transition-colors">Annuler la synchronisation</button>
    </div>
  );
}

// ── Résultat de la dernière synchronisation ───────────────────────────────
function JobResult({ job, issues, onOpenTab, onRetry }: {
  job: Job; issues: Connector['issues'];
  onOpenTab: (t: 'issues' | 'mappings') => void; onRetry: () => void;
}) {
  if (job.status === 'FAILED') {
    return (
      <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 p-4">
        <div className="flex items-start gap-2">
          <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--text)]">La synchronisation a échoué</p>
            <p className="text-xs text-[var(--text-muted)] mt-1 break-words">{job.error || 'Erreur inconnue.'}</p>
            <p className="text-xs text-[var(--text-muted)] mt-1">Aucun pointage n’est perdu : ils restent dans la mémoire de la pointeuse.</p>
          </div>
        </div>
        <button onClick={onRetry} className={`${btnGhost} mt-3`}><RefreshCw size={13} /> Réessayer</button>
      </div>
    );
  }
  if (job.status !== 'SUCCESS') return null;

  const s = job.stats || {};
  const tiles: { label: string; value: number; tone: string; tab?: 'issues' | 'mappings' }[] = [
    { label: 'Présences mises à jour', value: s.daysWritten ?? 0, tone: 'text-emerald-600' },
    { label: 'À compléter', value: issues.incomplete, tone: issues.incomplete ? 'text-amber-600' : 'text-[var(--text-muted)]', tab: 'issues' },
    { label: 'Conflits', value: issues.conflict, tone: issues.conflict ? 'text-amber-600' : 'text-[var(--text-muted)]', tab: 'issues' },
    { label: 'Non associés', value: issues.unmapped ? (s.unmappedPeople ?? 0) || 1 : 0, tone: issues.unmapped ? 'text-amber-600' : 'text-[var(--text-muted)]', tab: 'mappings' },
  ];
  return (
    <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
      <p className="text-sm font-bold text-[var(--text)] flex items-center gap-2">
        <CheckCircle2 size={16} className="text-emerald-500" /> Synchronisation terminée
        <span className="text-xs font-normal text-[var(--text-muted)]">· {s.inserted ?? 0} nouveau(x) pointage(s) · {fmtDateTime(job.finishedAt)}</span>
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
        {tiles.map((t) => {
          const body = (<><p className={`text-xl font-extrabold tabular-nums ${t.tone}`}>{t.value}</p><p className="text-[11px] text-[var(--text-muted)] leading-tight mt-0.5">{t.label}</p></>);
          return t.tab && t.value > 0 ? (
            <button key={t.label} onClick={() => onOpenTab(t.tab!)} className="text-left rounded-lg bg-[var(--surface)] border border-amber-500/30 p-3 hover:border-amber-500 transition-colors">{body}</button>
          ) : (
            <div key={t.label} className="rounded-lg bg-[var(--surface)] border border-[var(--border)] p-3">{body}</div>
          );
        })}
      </div>
      {(s.duplicates ?? 0) > 0 && <p className="text-[11px] text-[var(--text-muted)] mt-2">{s.duplicates} pointage(s) déjà connus ignorés (aucun doublon créé).</p>}
      {(s.rejected ?? 0) > 0 && <p className="text-[11px] text-amber-600 mt-1">{s.rejected} pointage(s) refusés : date impossible (horloge de la pointeuse déréglée ?).</p>}
      {(s.pending ?? 0) > 0 && <p className="text-[11px] text-[var(--text-muted)] mt-1">{s.pending} employé(s) n’ont qu’un passage aujourd’hui : la sortie sera prise en compte à la prochaine synchronisation.</p>}
    </div>
  );
}

// ── Assistant « Connecter ma pointeuse » ──────────────────────────────────
function configSnippet(kind: ConnectorKind, key: string): string {
  const adapter =
    kind === 'ZKTECO_NETWORK' ? { ip: '192.168.1.201', port: 4370 }
    : kind === 'FILE_IMPORT' ? { path: 'C:\\Pointages\\export.csv', delimiter: ';', dateOrder: 'DMY', columns: { userId: 'ID', name: 'Nom', dateTime: 'Date/Heure' } }
    : kind === 'HTTP_API' ? { url: 'http://192.168.1.50/api/logs?from={since}&to={until}', headers: {}, listPath: 'data', fields: { userId: 'userId', dateTime: 'time' } }
    : {};
  return JSON.stringify({ apiUrl: API_URL, agentKey: key, timezoneOffset: '+01:00', adapter }, null, 2);
}

function CopyButton({ text, label = 'Copier' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignoré */ } }}
      className={btnGhost}
    >
      {done ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />} {done ? 'Copié' : label}
    </button>
  );
}

function ConnectWizard({ onClose, onCreated, connectors, initialKey }: {
  onClose: () => void;
  onCreated: () => void;
  connectors: Connector[];
  /** Si fourni : on saute directement à l'étape d'installation (clé régénérée). */
  initialKey?: { id: string; name: string; kind: ConnectorKind; agentKey: string };
}) {
  const { addNotification } = useNotification();
  const [kind, setKind] = useState<ConnectorKind>(initialKey?.kind ?? 'ZKTECO_NETWORK');
  const [name, setName] = useState(initialKey?.name ?? '');
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<{ id: string; name: string; kind: ConnectorKind; agentKey: string } | null>(initialKey ?? null);

  const live = created ? connectors.find((c) => c.id === created.id) : null;

  const create = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      const r = await api.post<{ id: string; name: string; kind: ConnectorKind; agentKey: string }>('/device-sync/connectors', { name: name.trim(), kind });
      setCreated(r);
      onCreated();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Création impossible.' });
    } finally { setCreating(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Connecter une pointeuse">
      <div className={`${card} w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 rounded-b-none sm:rounded-2xl`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">{created ? 'Installez l’agent' : 'Connecter ma pointeuse'}</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              {created ? 'Étape 2 sur 2 — un petit programme sur un PC de l’entreprise lit la pointeuse et envoie les pointages à Konza.' : 'Étape 1 sur 2 — quel type de pointeuse utilise l’entreprise ?'}
            </p>
          </div>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]"><X size={18} /></button>
        </div>

        {!created ? (
          <>
            <div className="grid gap-2">
              {(Object.keys(KIND_META) as ConnectorKind[]).map((k) => {
                const M = KIND_META[k]; const Icon = M.icon; const sel = kind === k;
                return (
                  <button key={k} type="button" onClick={() => setKind(k)} aria-pressed={sel}
                    className={`flex items-center gap-3 text-left p-3 rounded-xl border transition-colors ${sel ? 'border-emerald-500 bg-emerald-500/5' : 'border-[var(--border)] hover:bg-[var(--surface-2)]'}`}>
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${sel ? 'bg-emerald-500 text-white' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}><Icon size={18} /></span>
                    <span className="min-w-0"><span className="block text-sm font-bold text-[var(--text)]">{M.label}</span><span className="block text-xs text-[var(--text-muted)]">{M.hint}</span></span>
                    {sel && <Check size={16} className="ml-auto text-emerald-500 shrink-0" />}
                  </button>
                );
              })}
            </div>
            <label className="text-xs font-semibold text-[var(--text-muted)] mt-4 mb-1.5 block" htmlFor="connector-name">Nom de cette pointeuse</label>
            <input id="connector-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex : Pointeuse entrée principale" className={`${inputCls} w-full`} maxLength={100} />
            <p className="text-xs text-[var(--text-muted)] mt-3">Vous ne savez pas laquelle choisir ? Prenez « Autre modèle » : nous regarderons ensemble.</p>
            <div className="flex justify-end gap-2 mt-5">
              <button onClick={onClose} className={btnGhost}>Annuler</button>
              <button onClick={create} disabled={creating || !name.trim()} className={btnPrimary}>
                {creating && <Loader2 size={14} className="animate-spin" />} Continuer
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3 mb-4">
              <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5"><KeyRound size={13} /> Clé de l’agent — affichée une seule fois</p>
              <div className="flex items-center gap-2 mt-2">
                <code className="flex-1 min-w-0 truncate text-xs bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text)]">{created.agentKey}</code>
                <CopyButton text={created.agentKey} />
              </div>
            </div>

            <ol className="space-y-3 text-sm text-[var(--text)]">
              <li><span className="font-bold">1.</span> Sur un PC de l’entreprise <span className="text-[var(--text-muted)]">(toujours allumé, avec internet et connecté au même réseau que la pointeuse)</span>, installez <b>Node.js 18+</b> puis copiez le dossier <code className="text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">konza-sync-agent</code> fourni par Konza.</li>
              <li>
                <span className="font-bold">2.</span> Créez le fichier <code className="text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">config.json</code> avec ce contenu (adaptez l’adresse IP ou le chemin) :
                <div className="relative mt-2">
                  <pre className="text-[11px] leading-relaxed bg-[var(--surface-2)] border border-[var(--border)] rounded-lg p-3 overflow-x-auto text-[var(--text)]">{configSnippet(created.kind, created.agentKey)}</pre>
                  <div className="absolute top-2 right-2"><CopyButton text={configSnippet(created.kind, created.agentKey)} /></div>
                </div>
              </li>
              <li><span className="font-bold">3.</span> Lancez <code className="text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">npm install</code> puis <code className="text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded">npm start</code>. Cette fenêtre se met à jour toute seule.</li>
            </ol>

            <div className={`mt-4 rounded-xl p-3 flex items-center gap-2 text-sm font-semibold ${live?.online ? 'bg-emerald-500/10 text-emerald-700' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`} role="status" aria-live="polite">
              {live?.online ? <><CheckCircle2 size={16} /> Agent connecté — vous pouvez synchroniser.</> : <><Loader2 size={16} className="animate-spin" /> En attente de l’agent…</>}
            </div>
            <div className="flex justify-end mt-5">
              <button onClick={onClose} className={live?.online ? btnPrimary : btnGhost}>{live?.online ? 'Terminer' : 'Fermer, je le ferai plus tard'}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Carte d'un connecteur : le bouton Synchroniser ────────────────────────
function ConnectorCard({ c, job, selected, onSelect, onSync, onCancel, onAction, onOpenTab }: {
  c: Connector;
  job: Job | null;
  selected: boolean;
  onSelect: () => void;
  onSync: (period: PeriodId, custom: { from: string; to: string }) => Promise<void>;
  onCancel: () => void;
  onAction: (a: 'rename' | 'toggleAuto' | 'toggleActive' | 'rebind' | 'rotate' | 'delete') => void;
  onOpenTab: (t: 'issues' | 'mappings') => void;
}) {
  const M = KIND_META[c.kind]; const Icon = M.icon;
  const [period, setPeriod] = useState<PeriodId>('SINCE_LAST');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [starting, setStarting] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const running = isActive(job);

  useEffect(() => {
    if (!menu) return;
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [menu]);

  const customInvalid = period === 'CUSTOM' && (!custom.from || !custom.to || custom.from > custom.to);

  const go = async () => {
    setStarting(true);
    try { await onSync(period, custom); } finally { setStarting(false); }
  };

  const menuItem = 'w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left hover:bg-[var(--surface-2)] text-[var(--text)]';

  return (
    <div className={`${card} p-5 ${selected ? 'ring-1 ring-emerald-500/40' : ''}`} onClick={onSelect}>
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600"><Icon size={20} /></span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[var(--text)] truncate">{c.name}</h3>
          <p className="text-xs text-[var(--text-muted)]">{M.label}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2"><AgentPill c={c} />
            {c.autoSyncEnabled && c.isActive && <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)]"><Moon size={11} /> Synchro auto chaque nuit</span>}
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button onClick={(e) => { e.stopPropagation(); setMenu((v) => !v); }} aria-label="Réglages" aria-expanded={menu} className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"><ChevronDown size={16} /></button>
          {menu && (
            <div className="absolute right-0 top-full mt-1 w-60 z-20 rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <button className={menuItem} onClick={() => { setMenu(false); onAction('rename'); }}><Wrench size={13} /> Renommer</button>
              <button className={menuItem} onClick={() => { setMenu(false); onAction('toggleAuto'); }}><Moon size={13} /> {c.autoSyncEnabled ? 'Désactiver' : 'Activer'} la synchro de nuit</button>
              <button className={menuItem} onClick={() => { setMenu(false); onAction('toggleActive'); }}><Power size={13} /> {c.isActive ? 'Désactiver' : 'Réactiver'} ce connecteur</button>
              <button className={menuItem} onClick={() => { setMenu(false); onAction('rebind'); }}><Link2 size={13} /> Utiliser mon compte pour écrire les présences</button>
              <button className={menuItem} onClick={() => { setMenu(false); onAction('rotate'); }}><KeyRound size={13} /> Régénérer la clé de l’agent</button>
              <button className={`${menuItem} text-red-500`} onClick={() => { setMenu(false); onAction('delete'); }}><Trash2 size={13} /> Supprimer</button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4 text-xs">
        <div><p className="text-[var(--text-muted)]">Dernière synchronisation</p><p className="font-semibold text-[var(--text)] mt-0.5">{c.lastSyncAt ? `${fmtDateTime(c.lastSyncAt)} · ${ago(c.lastSyncAt)}` : 'Jamais'}</p></div>
        <div><p className="text-[var(--text-muted)]">Dernier pointage reçu</p><p className="font-semibold text-[var(--text)] mt-0.5">{c.lastPunchAt ? fmtDateTime(c.lastPunchAt) : '—'}</p></div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mt-4" onClick={(e) => e.stopPropagation()}>
        <select value={period} onChange={(e) => setPeriod(e.target.value as PeriodId)} disabled={running} aria-label="Période à synchroniser" className={`${inputCls} sm:flex-1`}>
          {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <button onClick={go} disabled={!c.isActive || running || starting || customInvalid} className={`${btnPrimary} sm:min-w-[170px]`}>
          {running || starting ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          {running ? 'En cours…' : 'Synchroniser'}
        </button>
      </div>
      {period === 'CUSTOM' && (
        <div className="flex flex-wrap items-center gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
          <input type="date" value={custom.from} max={custom.to || undefined} onChange={(e) => setCustom((s) => ({ ...s, from: e.target.value }))} className={inputCls} aria-label="Du" />
          <span className="text-xs text-[var(--text-muted)]">au</span>
          <input type="date" value={custom.to} min={custom.from || undefined} onChange={(e) => setCustom((s) => ({ ...s, to: e.target.value }))} className={inputCls} aria-label="Au" />
        </div>
      )}
      {!c.online && c.isActive && !running && (
        <p className="text-xs text-amber-600 mt-2 flex items-start gap-1.5"><AlertTriangle size={13} className="mt-0.5 shrink-0" />L’agent est hors ligne : vous pouvez lancer la demande, elle sera prise dès qu’il revient.</p>
      )}

      <div onClick={(e) => e.stopPropagation()}>
        {job && running && <JobProgress job={job} agentOnline={c.online} onCancel={onCancel} />}
        {job && !running && <JobResult job={job} issues={c.issues} onOpenTab={onOpenTab} onRetry={go} />}
      </div>
    </div>
  );
}

// ── Onglet « À corriger » ─────────────────────────────────────────────────
function IncompleteRow({ item, onDone }: { item: IncompleteItem; onDone: () => void }) {
  const { addNotification } = useNotification();
  const [knownIs, setKnownIs] = useState<'in' | 'out'>('in');
  const [time, setTime] = useState('');
  const [busy, setBusy] = useState(false);
  const known = fmtTime(item.punchTimes[0]);

  const submit = async (ignore = false) => {
    if (!ignore && !time) return;
    if (ignore && !window.confirm('Écarter ce pointage ? Aucune présence ne sera créée pour ce jour.')) return;
    setBusy(true);
    try {
      await api.post('/device-sync/issues/incomplete', {
        employeeId: item.employeeId, date: item.date,
        ...(ignore ? { ignore: true } : knownIs === 'in' ? { checkOutTime: time } : { checkInTime: time }),
      });
      addNotification({ type: 'SUCCESS', title: ignore ? 'Pointage écarté' : 'Présence enregistrée', message: `${item.employeeName} — ${fmtDay(item.date)}` });
      onDone();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Action impossible.' });
    } finally { setBusy(false); }
  };

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-bold text-[var(--text)]">{item.employeeName} <span className="text-xs font-normal text-[var(--text-muted)]">#{item.employeeNumber}</span></p>
        <span className="text-xs text-[var(--text-muted)] capitalize">{fmtDay(item.date)}</span>
        <span className="text-xs font-semibold text-amber-600 ml-auto">Un seul passage à {known}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mt-2">
        <select value={knownIs} onChange={(e) => setKnownIs(e.target.value as 'in' | 'out')} className={inputCls} aria-label="Nature du passage connu">
          <option value="in">Ce passage est l’entrée → saisir la sortie</option>
          <option value="out">Ce passage est la sortie → saisir l’entrée</option>
        </select>
        <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} aria-label={knownIs === 'in' ? 'Heure de sortie' : 'Heure d’entrée'} />
        <button onClick={() => submit(false)} disabled={busy || !time} className={btnPrimary}>{busy ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Valider</button>
        <button onClick={() => submit(true)} disabled={busy} className={btnGhost}>Écarter</button>
      </div>
    </li>
  );
}

function ConflictRow({ item, onDone }: { item: ConflictItem; onDone: () => void }) {
  const { addNotification } = useNotification();
  const [busy, setBusy] = useState(false);
  const last = item.punchTimes[item.punchTimes.length - 1];

  const act = async (action: 'APPLY' | 'KEEP') => {
    if (action === 'APPLY' && !window.confirm('Remplacer la présence existante par les heures de la pointeuse ?')) return;
    setBusy(true);
    try {
      await api.post('/device-sync/issues/conflict', { employeeId: item.employeeId, date: item.date, action });
      addNotification({ type: 'SUCCESS', title: action === 'APPLY' ? 'Heures de la pointeuse appliquées' : 'Présence existante conservée', message: `${item.employeeName} — ${fmtDay(item.date)}` });
      onDone();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Action impossible.' });
    } finally { setBusy(false); }
  };

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-bold text-[var(--text)]">{item.employeeName} <span className="text-xs font-normal text-[var(--text-muted)]">#{item.employeeNumber}</span></p>
        <span className="text-xs text-[var(--text-muted)] capitalize">{fmtDay(item.date)}</span>
      </div>
      <p className="text-xs text-amber-600 mt-1">{item.note || 'Une présence existe déjà pour ce jour.'}</p>
      <div className="grid sm:grid-cols-2 gap-2 mt-2 text-xs">
        <div className="rounded-lg bg-[var(--surface-2)] p-2"><p className="text-[var(--text-muted)]">Dans Konza</p>
          <p className="font-semibold text-[var(--text)] mt-0.5">{item.existing ? `${fmtTime(item.existing.checkIn)} → ${fmtTime(item.existing.checkOut)} · ${item.existing.status}` : '—'}</p></div>
        <div className="rounded-lg bg-[var(--surface-2)] p-2"><p className="text-[var(--text-muted)]">Sur la pointeuse</p>
          <p className="font-semibold text-[var(--text)] mt-0.5">{fmtTime(item.punchTimes[0])} → {fmtTime(last)}</p></div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button onClick={() => act('APPLY')} disabled={busy} className={btnPrimary}>Appliquer la pointeuse</button>
        <button onClick={() => act('KEEP')} disabled={busy} className={btnGhost}>Garder l’existant</button>
      </div>
    </li>
  );
}

function IssuesTab({ c, refreshKey, onChanged, goMappings }: { c: Connector; refreshKey: number; onChanged: () => void; goMappings: () => void }) {
  const [data, setData] = useState<Issues | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setData(await api.get<Issues>(`/device-sync/issues?connectorId=${c.id}`)); setErr(null); }
    catch (e: any) { setErr(e.message || 'Chargement impossible.'); }
    finally { setLoading(false); }
  }, [c.id]);
  useEffect(() => { setLoading(true); load(); }, [load, refreshKey]);

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (err) return <p className="text-sm text-red-500 py-6">{err}</p>;
  if (!data) return null;

  const empty = !data.incomplete.length && !data.conflicts.length && !data.unmapped.length;
  if (empty) {
    return (
      <div className="py-10 text-center">
        <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
        <p className="text-sm font-bold text-[var(--text)]">Tout est en ordre</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Aucun pointage à corriger.</p>
      </div>
    );
  }

  const done = () => { load(); onChanged(); };
  return (
    <div className="space-y-6">
      {data.unmapped.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3 flex flex-wrap items-center gap-3">
          <Users size={16} className="text-amber-600 shrink-0" />
          <p className="text-sm text-[var(--text)] flex-1 min-w-[200px]"><b>{data.unmapped.length}</b> numéro(s) de la pointeuse ne sont associés à aucun employé ({data.unmapped.reduce((n, u) => n + u.punches, 0)} pointages en attente).</p>
          <button onClick={goMappings} className={btnPrimary}>Associer</button>
        </div>
      )}
      {data.incomplete.length > 0 && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Pointages incomplets ({data.incomplete.length})</h4>
          <p className="text-xs text-[var(--text-muted)] mb-2">Un seul passage sur la journée : Konza n’invente rien, indiquez l’heure manquante.</p>
          <ul className="space-y-2">{data.incomplete.map((i) => <IncompleteRow key={`${i.employeeId}|${i.date}`} item={i} onDone={done} />)}</ul>
        </section>
      )}
      {data.conflicts.length > 0 && (
        <section>
          <h4 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Conflits ({data.conflicts.length})</h4>
          <p className="text-xs text-[var(--text-muted)] mb-2">Une présence existe déjà (saisie manuelle, congé…). Konza ne l’écrase jamais sans votre accord.</p>
          <ul className="space-y-2">{data.conflicts.map((i) => <ConflictRow key={`${i.employeeId}|${i.date}`} item={i} onDone={done} />)}</ul>
        </section>
      )}
    </div>
  );
}

// ── Onglet « Associations » (numéro pointeuse ↔ employé) ──────────────────
function MappingsTab({ c, refreshKey, onChanged }: { c: Connector; refreshKey: number; onChanged: () => void }) {
  const { addNotification } = useNotification();
  const [items, setItems] = useState<MappingItem[]>([]);
  const [employees, setEmployees] = useState<EmployeeLite[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [auto, setAuto] = useState(false);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    try {
      const r = await api.get<{ items: MappingItem[]; employees: EmployeeLite[] }>(`/device-sync/connectors/${c.id}/mappings`);
      setItems(r.items); setEmployees(r.employees); setEdits({});
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Chargement impossible.' });
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c.id]);
  useEffect(() => { setLoading(true); load(); }, [load, refreshKey]);

  const valueOf = (i: MappingItem) => (edits[i.deviceUserId] !== undefined ? edits[i.deviceUserId] : i.employeeId ?? '');
  const dirty = items.filter((i) => edits[i.deviceUserId] !== undefined && (edits[i.deviceUserId] || null) !== i.employeeId);
  const usedBy = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of items) { const v = valueOf(i); if (v) m.set(v, i.deviceUserId); }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, edits]);
  const mappedCount = items.filter((i) => valueOf(i)).length;
  const suggestable = items.filter((i) => !valueOf(i) && i.suggestionEmployeeId && !usedBy.has(i.suggestionEmployeeId)).length;

  const save = async () => {
    setSaving(true);
    try {
      await api.post(`/device-sync/connectors/${c.id}/mappings`, { mappings: dirty.map((i) => ({ deviceUserId: i.deviceUserId, employeeId: edits[i.deviceUserId] || null })) });
      addNotification({ type: 'SUCCESS', title: 'Associations enregistrées', message: 'Les pointages en attente sont recalculés.' });
      await load(); onChanged();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Enregistrement impossible.' });
    } finally { setSaving(false); }
  };

  const autoMap = async () => {
    setAuto(true);
    try {
      const r = await api.post<{ mapped: number }>(`/device-sync/connectors/${c.id}/mappings/auto`, {});
      addNotification({ type: 'SUCCESS', title: 'Association automatique', message: `${r.mapped} employé(s) associé(s) d’après leur matricule.` });
      await load(); onChanged();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Action impossible.' });
    } finally { setAuto(false); }
  };

  if (loading) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!items.length) {
    return (
      <div className="py-10 text-center">
        <Users size={30} className="mx-auto text-[var(--text-muted)] mb-2" />
        <p className="text-sm font-bold text-[var(--text)]">Aucun employé détecté pour l’instant</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Lancez une première synchronisation : les numéros enregistrés sur la pointeuse apparaîtront ici.</p>
      </div>
    );
  }

  const shown = items.filter((i) => `${i.deviceUserId} ${i.deviceUserName ?? ''} ${i.employee?.firstName ?? ''} ${i.employee?.lastName ?? ''}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <p className="text-sm text-[var(--text)]"><b>{mappedCount}</b> associé(s) sur {items.length}</p>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher" className={`${inputCls} ml-auto w-44`} />
        {suggestable > 0 && (
          <button onClick={autoMap} disabled={auto} className={btnGhost}>
            {auto ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />} Associer par matricule ({suggestable})
          </button>
        )}
        <button onClick={save} disabled={!dirty.length || saving} className={btnPrimary}>
          {saving && <Loader2 size={14} className="animate-spin" />} Enregistrer{dirty.length ? ` (${dirty.length})` : ''}
        </button>
      </div>
      <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        {shown.map((i) => {
          const v = valueOf(i);
          const sug = !v && i.suggestionEmployeeId ? employees.find((e) => e.id === i.suggestionEmployeeId) : undefined;
          return (
            <li key={i.deviceUserId} className="flex flex-wrap items-center gap-2 p-3">
              <div className="min-w-[140px]">
                <p className="text-sm font-bold text-[var(--text)]">N° {i.deviceUserId}</p>
                <p className="text-xs text-[var(--text-muted)]">{i.deviceUserName || 'Sans nom sur la pointeuse'}</p>
              </div>
              <select value={v} onChange={(e) => setEdits((s) => ({ ...s, [i.deviceUserId]: e.target.value }))} className={`${inputCls} flex-1 min-w-[200px]`} aria-label={`Employé associé au numéro ${i.deviceUserId}`}>
                <option value="">— Non associé —</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id} disabled={usedBy.has(e.id) && usedBy.get(e.id) !== i.deviceUserId}>
                    {e.lastName} {e.firstName} · #{e.employeeNumber}{usedBy.has(e.id) && usedBy.get(e.id) !== i.deviceUserId ? ' (déjà associé)' : ''}
                  </option>
                ))}
              </select>
              {sug && (
                <button onClick={() => setEdits((s) => ({ ...s, [i.deviceUserId]: sug.id }))} className="text-xs font-semibold text-emerald-600 hover:underline">
                  Suggéré : {sug.firstName} {sug.lastName}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ── Onglet « Historique » ─────────────────────────────────────────────────
function HistoryTab({ c, refreshKey }: { c: Connector; refreshKey: number }) {
  const [jobs, setJobs] = useState<Job[] | null>(null);
  useEffect(() => {
    let alive = true;
    api.get<Job[]>(`/device-sync/connectors/${c.id}/jobs`).then((r) => { if (alive) setJobs(r); }).catch(() => { if (alive) setJobs([]); });
    return () => { alive = false; };
  }, [c.id, refreshKey]);

  if (!jobs) return <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>;
  if (!jobs.length) return <p className="text-sm text-[var(--text-muted)] py-8 text-center">Aucune synchronisation pour l’instant.</p>;

  const badge: Record<JobStatus, string> = {
    SUCCESS: 'bg-emerald-500/10 text-emerald-600', FAILED: 'bg-red-500/10 text-red-500',
    CANCELLED: 'bg-[var(--surface-2)] text-[var(--text-muted)]', PENDING: 'bg-amber-500/10 text-amber-600', RUNNING: 'bg-sky-500/10 text-sky-600',
  };
  const label: Record<JobStatus, string> = { SUCCESS: 'Réussie', FAILED: 'Échec', CANCELLED: 'Annulée', PENDING: 'En attente', RUNNING: 'En cours' };

  return (
    <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] bg-[var(--surface)]">
      {jobs.map((j) => (
        <li key={j.id} className="p-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${badge[j.status]}`}>{label[j.status]}</span>
          <span className="text-sm text-[var(--text)]">{fmtDateTime(j.requestedAt)}</span>
          <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">{j.trigger === 'SCHEDULED' ? <><Moon size={11} /> Automatique</> : 'Manuelle'}</span>
          {j.rangeFrom && <span className="text-xs text-[var(--text-muted)]">· {j.rangeFrom} → {j.rangeTo}</span>}
          <span className="text-xs text-[var(--text-muted)] ml-auto">
            {j.status === 'SUCCESS' ? `${j.stats?.inserted ?? 0} nouveau(x) · ${j.stats?.daysWritten ?? 0} présence(s)` : j.error ? <span className="text-red-500" title={j.error}>{j.error.slice(0, 60)}{j.error.length > 60 ? '…' : ''}</span> : ''}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
type TabId = 'issues' | 'mappings' | 'history';

export default function SynchronisationPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const { addNotification } = useNotification();

  const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('issues');
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [refreshKey, setRefreshKey] = useState(0);
  const [wizard, setWizard] = useState<null | { initialKey?: { id: string; name: string; kind: ConnectorKind; agentKey: string } }>(null);

  const jobsRef = useRef(jobs);
  jobsRef.current = jobs;

  const loadConnectors = useCallback(async () => {
    try {
      const list = await api.get<Connector[]>('/device-sync/connectors');
      setConnectors(list);
      setJobs((prev) => {
        const next = { ...prev };
        for (const c of list) if (c.lastJob) next[c.id] = c.lastJob;
        return next;
      });
      setSelectedId((s) => (s && list.some((c) => c.id === s) ? s : list[0]?.id ?? null));
    } catch { /* l'écran garde ses données ; le prochain cycle réessaie */ }
  }, []);

  // ── Chargement initial ──
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push(bp('/login')); return; }
        const user = JSON.parse(stored);
        setCurrentUser(user);
        if (!['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(user.role)) { setIsAuthorized(false); return; }
        setIsAuthorized(true);
        await loadConnectors();
      } catch { setIsAuthorized(false); }
      finally { setIsLoading(false); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const finished = useCallback((j: Job) => {
    loadConnectors();
    setRefreshKey((k) => k + 1);
    if (j.status === 'SUCCESS') {
      const s = j.stats || {};
      addNotification({ type: 'SUCCESS', title: 'Synchronisation terminée', message: `${s.inserted ?? 0} nouveau(x) pointage(s), ${s.daysWritten ?? 0} présence(s) mise(s) à jour.` });
    } else if (j.status === 'FAILED') {
      addNotification({ type: 'ALERT', title: 'Synchronisation échouée', message: j.error || 'Erreur inconnue.' });
    }
  }, [addNotification, loadConnectors]);

  // ── Suivi en direct des synchronisations actives (toutes les 2 s) ──
  useEffect(() => {
    if (!isAuthorized) return;
    const t = setInterval(async () => {
      const active = Object.values(jobsRef.current).filter(isActive);
      for (const j of active) {
        try {
          const nj = await api.get<Job>(`/device-sync/jobs/${j.id}`);
          setJobs((p) => ({ ...p, [nj.connectorId]: nj }));
          if (!isActive(nj)) finished(nj);
        } catch { /* réseau : on réessaie au prochain tick */ }
      }
    }, 2000);
    return () => clearInterval(t);
  }, [isAuthorized, finished]);

  // ── Rafraîchit l'état des agents (3 s pendant l'assistant, sinon 15 s) ──
  useEffect(() => {
    if (!isAuthorized) return;
    const t = setInterval(loadConnectors, wizard ? 3000 : 15000);
    return () => clearInterval(t);
  }, [isAuthorized, wizard, loadConnectors]);

  const selected = connectors.find((c) => c.id === selectedId) ?? null;

  const handleSync = async (c: Connector, period: PeriodId, custom: { from: string; to: string }) => {
    try {
      const job = await api.post<Job>(`/device-sync/connectors/${c.id}/sync`, periodToRange(period, custom));
      setJobs((p) => ({ ...p, [c.id]: job }));
      if (job.alreadyRunning) addNotification({ type: 'INFO', title: 'Déjà en cours', message: 'Une synchronisation est déjà en cours pour cette pointeuse.' });
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Impossible de lancer la synchronisation.' });
    }
  };

  const handleCancel = async (j: Job) => {
    try {
      const nj = await api.post<Job>(`/device-sync/jobs/${j.id}/cancel`, {});
      setJobs((p) => ({ ...p, [nj.connectorId]: nj }));
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Annulation impossible.' });
    }
  };

  const handleAction = async (c: Connector, a: 'rename' | 'toggleAuto' | 'toggleActive' | 'rebind' | 'rotate' | 'delete') => {
    try {
      if (a === 'rename') {
        const name = window.prompt('Nouveau nom de la pointeuse :', c.name)?.trim();
        if (!name || name === c.name) return;
        await api.patch(`/device-sync/connectors/${c.id}`, { name });
      } else if (a === 'toggleAuto') {
        await api.patch(`/device-sync/connectors/${c.id}`, { autoSyncEnabled: !c.autoSyncEnabled });
      } else if (a === 'toggleActive') {
        await api.patch(`/device-sync/connectors/${c.id}`, { isActive: !c.isActive });
      } else if (a === 'rebind') {
        await api.post(`/device-sync/connectors/${c.id}/rebind`, {});
        addNotification({ type: 'SUCCESS', title: 'Compte mis à jour', message: 'Les présences seront écrites au nom de votre compte.' });
      } else if (a === 'rotate') {
        if (!window.confirm('Régénérer la clé ? L’agent actuel cessera de fonctionner tant que vous n’aurez pas mis à jour son config.json.')) return;
        const r = await api.post<{ id: string; agentKey: string }>(`/device-sync/connectors/${c.id}/rotate-key`, {});
        setWizard({ initialKey: { id: c.id, name: c.name, kind: c.kind, agentKey: r.agentKey } });
      } else if (a === 'delete') {
        if (!window.confirm(`Supprimer « ${c.name} » ? Les pointages bruts reçus seront effacés ; les présences déjà créées restent.`)) return;
        await api.delete(`/device-sync/connectors/${c.id}`);
        addNotification({ type: 'SUCCESS', title: 'Connecteur supprimé', message: 'La pointeuse a été retirée.' });
      }
      await loadConnectors();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Action impossible.' });
    }
  };

  const onChanged = () => { loadConnectors(); setRefreshKey((k) => k + 1); };

  if (isLoading) return <KonzaLoader variant="page" />;

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert size={40} className="text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-[var(--text)]">Accès réservé</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">Seuls les administrateurs et responsables RH peuvent synchroniser les pointeuses.</p>
      </div>
    );
  }

  const issueCount = selected ? selected.issues.incomplete + selected.issues.conflict + selected.issues.unmapped : 0;
  const tabs: { id: TabId; label: string; icon: React.ElementType; badge?: number }[] = [
    { id: 'issues', label: 'À corriger', icon: AlertTriangle, badge: issueCount },
    { id: 'mappings', label: 'Associations', icon: Users },
    { id: 'history', label: 'Historique', icon: History },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PresenceSubNav userRole={currentUser?.role || ''} />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)] flex items-center gap-2"><RefreshCw size={20} className="text-emerald-500" /> Synchronisation des pointeuses</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Récupérez en un clic les pointages de la pointeuse de votre entreprise.</p>
        </div>
        {connectors.length > 0 && <button onClick={() => setWizard({})} className={btnPrimary}><Plus size={16} /> Connecter une pointeuse</button>}
      </div>

      {connectors.length === 0 ? (
        <div className={`${card} p-8 text-center`}>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 mb-4"><Cable size={28} /></span>
          <h2 className="text-lg font-bold text-[var(--text)]">Votre entreprise a déjà une pointeuse ?</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 max-w-xl mx-auto">Gardez-la. Konza lit ses pointages et calcule les présences, les retards et les heures supplémentaires à votre place.</p>
          <ol className="grid sm:grid-cols-3 gap-3 mt-6 text-left max-w-3xl mx-auto">
            {[['1', 'Connectez', 'Choisissez le type de pointeuse (2 minutes).'], ['2', 'Installez l’agent', 'Un petit programme sur un PC de l’entreprise lit la pointeuse.'], ['3', 'Synchronisez', 'Un clic, et les présences arrivent dans Konza.']].map(([n, t, d]) => (
              <li key={n} className="rounded-xl bg-[var(--surface-2)] p-4"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white text-xs font-bold mb-2">{n}</span><p className="text-sm font-bold text-[var(--text)]">{t}</p><p className="text-xs text-[var(--text-muted)] mt-0.5">{d}</p></li>
            ))}
          </ol>
          <button onClick={() => setWizard({})} className={`${btnPrimary} mt-6`}><Plus size={16} /> Connecter ma pointeuse</button>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {connectors.map((c) => (
              <ConnectorCard
                key={c.id} c={c} job={jobs[c.id] ?? null} selected={c.id === selectedId}
                onSelect={() => setSelectedId(c.id)}
                onSync={(p, custom) => handleSync(c, p, custom)}
                onCancel={() => jobs[c.id] && handleCancel(jobs[c.id])}
                onAction={(a) => handleAction(c, a)}
                onOpenTab={(t) => { setSelectedId(c.id); setTab(t); }}
              />
            ))}
          </div>

          {selected && (
            <div className={`${card} p-5 mt-6`}>
              <div role="tablist" className="flex gap-1 mb-4 border-b border-[var(--border)] overflow-x-auto">
                {tabs.map((t) => {
                  const Icon = t.icon; const on = tab === t.id;
                  return (
                    <button key={t.id} role="tab" aria-selected={on} onClick={() => setTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px transition-colors ${on ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                      <Icon size={14} /> {t.label}
                      {!!t.badge && <span className="ml-1 text-[11px] font-bold bg-amber-500 text-white rounded-full px-1.5 min-w-[18px] text-center">{t.badge}</span>}
                    </button>
                  );
                })}
                <span className="ml-auto self-center text-xs text-[var(--text-muted)] pr-1 truncate">{selected.name}</span>
              </div>
              {tab === 'issues' && <IssuesTab c={selected} refreshKey={refreshKey} onChanged={onChanged} goMappings={() => setTab('mappings')} />}
              {tab === 'mappings' && <MappingsTab c={selected} refreshKey={refreshKey} onChanged={onChanged} />}
              {tab === 'history' && <HistoryTab c={selected} refreshKey={refreshKey} />}
            </div>
          )}
        </>
      )}

      {wizard && (
        <ConnectWizard
          connectors={connectors}
          initialKey={wizard.initialKey}
          onCreated={() => { loadConnectors(); }}
          onClose={() => { setWizard(null); loadConnectors(); }}
        />
      )}
    </div>
  );
}