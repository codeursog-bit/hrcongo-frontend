// ============================================================================
// 🔔 PAGE NOTIFICATIONS PUSH — diagnostic complet, tous utilisateurs
// ============================================================================
// Fichier: frontend/app/admin/push-notifications/page.tsx
//
// Objectif : voir en un coup d'œil qui a activé le push, qui ne l'a jamais
// activé, et qui a activé côté profil mais n'a aucun appareil enregistré
// (abonnement cassé — c'est souvent la cause réelle de "je ne reçois pas
// mes push" : le toggle est ON en base mais le navigateur n'a jamais
// finalisé l'abonnement technique, ou l'a perdu depuis).

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Bell, BellRing, BellOff, AlertTriangle, RefreshCw, Loader2,
  Search, Smartphone, ShieldAlert, CheckCircle2, Inbox, XCircle, Eye, EyeOff,
  Send, History, Clock,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';
import { api } from '@/services/api';

type StatusFilter = 'all' | 'active' | 'enabled_no_device' | 'disabled';

const fmtRelative = (d: string | null) => {
  if (!d) return 'jamais';
  const min = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (min < 1) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h}h`;
  return `il y a ${Math.floor(h / 24)}j`;
};

const STATUS_META: Record<'active' | 'enabled_no_device' | 'disabled', { label: string; cls: string; icon: any }> = {
  active:             { label: 'Actif',              cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: BellRing },
  enabled_no_device:  { label: 'Activé sans appareil', cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20',     icon: AlertTriangle },
  disabled:           { label: 'Désactivé',          cls: 'text-gray-500 bg-gray-800 border-gray-700',               icon: BellOff },
};


// ─── 🆕 ÉTAT D'UN APPAREIL ─────────────────────────────────────────────────────────────────────────
const DEVICE_STATE: Record<string, { label: string; cls: string }> = {
  ACTIVE:   { label: 'Actif',      cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  DISABLED: { label: 'Désactivé',  cls: 'text-gray-400 bg-gray-800 border-gray-700' },
  EXPIRED:  { label: 'Expiré',     cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
};

const EVENT_META: Record<string, { label: string; cls: string }> = {
  ENABLED:     { label: 'Nouvel appareil activé',     cls: 'text-emerald-400' },
  REACTIVATED: { label: 'Appareil connu réactivé',    cls: 'text-sky-400' },
  DISABLED:    { label: 'Désactivé par l\'utilisateur', cls: 'text-gray-400' },
  EXPIRED:     { label: 'Abonnement expiré (404/410)', cls: 'text-amber-400' },
  MOVED:       { label: 'Appareil repris par un autre compte', cls: 'text-purple-400' },
};

function DeviceHistory({ userId }: { userId: string }) {
  const [events, setEvents] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setEvents(await api.get(`/admin/push/devices/${userId}/events`) as any[]); }
    catch { setEvents([]); }
    finally { setLoading(false); }
  };

  if (events === null) {
    return (
      <button onClick={load} disabled={loading}
        className="mt-3 text-xs text-gray-400 hover:text-white flex items-center gap-1.5 disabled:opacity-50">
        {loading ? <Loader2 size={12} className="animate-spin" /> : <History size={12} />} Voir l&apos;historique
      </button>
    );
  }
  if (events.length === 0) return <p className="mt-3 text-xs text-gray-700">Aucun événement enregistré.</p>;
  return (
    <div className="mt-3 space-y-1">
      <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">Historique</p>
      {events.map((e) => {
        const m = EVENT_META[e.type] ?? { label: e.type, cls: 'text-gray-400' };
        return (
          <p key={e.id} className="text-xs flex flex-wrap items-center gap-x-2">
            <span className="text-gray-600 w-[104px] shrink-0">{fmtDateTime(e.createdAt)}</span>
            <span className={m.cls}>{m.label}</span>
            <span className="text-gray-500">{e.label || 'Appareil'}{e.deviceRef ? ` · #${e.deviceRef}` : ''}</span>
          </p>
        );
      })}
    </div>
  );
}

// ─── 🆕 ONGLET « ENVOI » : rappel de pointage immédiat, sans passer par le cron ────────────────────
function BroadcastTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [companyId, setCompanyId] = useState('');
  const [onlyNotPunched, setOnlyNotPunched] = useState(true);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [preview, setPreview] = useState<number | null>(null);
  const [job, setJob] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const running = job?.status === 'RUNNING';

  const loadHistory = async () => {
    try { setHistory(await api.get('/admin/push/broadcasts') as any[]); } catch { /* non bloquant */ }
  };

  useEffect(() => {
    loadHistory();
    adminService.getCompanies().then((r: any) => {
      const list = Array.isArray(r) ? r : (r?.companies ?? r?.data ?? []);
      setCompanies(list);
    }).catch(() => {});
  }, []);

  // Aperçu : combien de personnes recevraient l'envoi avec ces réglages
  useEffect(() => {
    let cancelled = false;
    setPreview(null);
    const t = setTimeout(async () => {
      try {
        const qs = new URLSearchParams({ onlyNotPunched: String(onlyNotPunched) });
        if (companyId) qs.set('companyId', companyId);
        const r: any = await api.get(`/admin/push/broadcast/preview?${qs.toString()}`);
        if (!cancelled) setPreview(r?.total ?? 0);
      } catch { if (!cancelled) setPreview(null); }
    }, 300);
    return () => { cancelled = true; clearTimeout(t); };
  }, [companyId, onlyNotPunched]);

  // Suivi de la progression (toutes les 2 s tant que l'envoi tourne)
  useEffect(() => {
    if (!running) return;
    const t = setInterval(async () => {
      try {
        const j: any = await api.get(`/admin/push/broadcast/${job.id}`);
        if (j) setJob(j);
        if (j && j.status !== 'RUNNING') loadHistory();
      } catch { /* on réessaie au prochain tour */ }
    }, 2000);
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, [running, job?.id]);

  const send = async () => {
    const who = companyId
      ? (companies.find((c) => c.id === companyId)?.tradeName || companies.find((c) => c.id === companyId)?.legalName || 'cette entreprise')
      : 'TOUTES les entreprises';
    const n = preview != null ? `${preview} personne(s)` : 'les destinataires';
    if (!window.confirm(`Envoyer le rappel maintenant à ${n} (${who}) ?`)) return;
    setStarting(true); setError(null);
    try {
      const j: any = await api.post('/admin/push/broadcast', {
        companyId: companyId || undefined, onlyNotPunched,
        title: title.trim() || undefined, body: body.trim() || undefined,
      });
      setJob(j);
      loadHistory();
    } catch (e: any) {
      setError(e?.message || "Impossible de lancer l'envoi.");
    } finally { setStarting(false); }
  };

  const sel = 'w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-gray-600';
  const pct = job && job.total > 0 ? Math.min(100, Math.round((job.processed / job.total) * 100)) : 0;

  return (
    <div className="space-y-5">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2"><Send size={16} className="text-red-500" /> Rappel de pointage immédiat</h2>
          <p className="text-xs text-gray-500 mt-1">
            Part à l&apos;instant du clic, par le serveur : aucune dépendance au cron ni à un navigateur ouvert.
            Un seul envoi à la fois ; l&apos;envoi se fait par petits lots pour ménager le serveur.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-400 space-y-1">
            <span>Entreprise</span>
            <select className={sel} value={companyId} onChange={(e) => setCompanyId(e.target.value)} disabled={running}>
              <option value="">Toutes les entreprises</option>
              {companies.map((c: any) => (
                <option key={c.id} value={c.id}>{c.tradeName || c.legalName}</option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2.5 text-sm text-gray-300 sm:mt-6 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 accent-red-600" checked={onlyNotPunched}
              onChange={(e) => setOnlyNotPunched(e.target.checked)} disabled={running} />
            Seulement ceux qui n&apos;ont pas encore pointé aujourd&apos;hui
          </label>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-xs text-gray-400 space-y-1">
            <span>Titre (facultatif)</span>
            <input className={sel} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)}
              placeholder="⏰ Rappel de pointage" disabled={running} />
          </label>
          <label className="text-xs text-gray-400 space-y-1">
            <span>Message (facultatif)</span>
            <input className={sel} value={body} maxLength={300} onChange={(e) => setBody(e.target.value)}
              placeholder="N'oubliez pas de pointer votre présence." disabled={running} />
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-gray-400">
            Destinataires : <span className="font-bold text-white">{preview == null ? '…' : preview}</span>
            <span className="text-gray-600"> (appareil actif requis)</span>
          </p>
          <button onClick={send} disabled={starting || running || preview === 0}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold disabled:opacity-40 flex items-center gap-2">
            {starting || running ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {running ? 'Envoi en cours…' : 'Envoyer maintenant'}
          </button>
        </div>

        {error && <p className="text-xs rounded-xl border px-3 py-2 text-red-300 bg-red-500/10 border-red-500/20">{error}</p>}
      </div>

      {job && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">
              {job.status === 'RUNNING' ? 'Envoi en cours' : job.status === 'DONE' ? 'Envoi terminé' : 'Envoi interrompu'}
            </p>
            <span className="text-xs text-gray-500">{job.processed} / {job.total}</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className={`h-full transition-all ${job.status === 'FAILED' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${job.status === 'DONE' ? 100 : pct}%` }} />
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div><p className="text-xl font-black text-emerald-400">{job.sent}</p><p className="text-[11px] text-gray-500">Envoyés</p></div>
            <div><p className="text-xl font-black text-red-400">{job.failed}</p><p className="text-[11px] text-gray-500">Échecs</p></div>
            <div><p className="text-xl font-black text-amber-400">{job.noDevice}</p><p className="text-[11px] text-gray-500">Sans appareil</p></div>
          </div>
          {job.error && <p className="text-xs text-red-400">{job.error}</p>}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <p className="px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide border-b border-gray-800 flex items-center gap-1.5">
          <Clock size={12} /> Derniers envois
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-8">Aucun envoi pour le moment</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {history.map((h) => (
              <div key={h.id} className="px-5 py-3 flex items-center justify-between gap-4 text-xs">
                <div className="min-w-0">
                  <p className="text-gray-300 truncate">{h.title}</p>
                  <p className="text-gray-600">
                    {fmtDateTime(h.createdAt)} · {h.companyId ? 'Une entreprise' : 'Toutes les entreprises'}{h.onlyNotPunched ? ' · non pointés' : ''}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className={h.status === 'DONE' ? 'text-emerald-400' : h.status === 'RUNNING' ? 'text-sky-400' : 'text-red-400'}>
                    {h.status === 'DONE' ? 'Terminé' : h.status === 'RUNNING' ? 'En cours' : 'Interrompu'}
                  </p>
                  <p className="text-gray-600">{h.sent} envoyé(s) · {h.failed} échec(s) · {h.noDevice} sans appareil</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 🆕 ONGLET « RÉCEPTIONS » : qui a reçu chaque notification, dans l'app et hors app ───────────
const PUSH_META: Record<string, { label: string; cls: string }> = {
  SENT:      { label: 'Envoyée (non confirmée)',  cls: 'text-teal-300 bg-teal-500/10 border-teal-500/20' },
  PARTIAL:   { label: 'Envoyée (1 appareil+)',    cls: 'text-teal-300 bg-teal-500/10 border-teal-500/20' },
  CONFIRMED: { label: 'Affichée sur l\'appareil', cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  PENDING:   { label: 'Envoi en cours',           cls: 'text-gray-400 bg-gray-800 border-gray-700' },
  NO_DEVICE: { label: 'Aucun appareil',      cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  DISABLED:  { label: 'Push désactivé',      cls: 'text-gray-400 bg-gray-800 border-gray-700' },
  EXPIRED:   { label: 'Appareil expiré',     cls: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  FAILED:    { label: "Échec d'envoi",       cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  NO_VAPID:  { label: 'Clés VAPID absentes', cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
};

const fmtDateTime = (d: string) =>
  new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Brazzaville' });

function ReceiptsTab() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState(24);
  const [type, setType] = useState('all');
  const [push, setPush] = useState('all');
  const [read, setRead] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  // 🆕 Envoie une notification de test à MOI (super admin) puis rafraîchit : on voit si elle est
  // « Affichée sur l'appareil » (accusé de réception) au bout de quelques secondes.
  const sendTest = async () => {
    setTesting(true);
    setTestMsg(null);
    try {
      const r: any = await api.post('/admin/push/test', {});
      setTestMsg(r?.apiPublicUrlConfigured
        ? { ok: true, text: 'Test envoyé. Vous devriez recevoir la notification ; actualisation automatique dans quelques secondes.' }
        : { ok: false, text: "Test envoyé, mais API_PUBLIC_URL n'est pas définie sur le serveur : aucun accusé de réception ne sera possible." });
      setHours(6); setType('all'); setPush('all'); setRead('all'); setSearch(''); setPage(1);
      setTimeout(load, 4000);
      setTimeout(load, 12000);
    } catch (e: any) {
      setTestMsg({ ok: false, text: e?.message || "Échec de l'envoi du test." });
    } finally { setTesting(false); }
  };

  const load = async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ hours: String(hours), type, push, read, search, page: String(page), limit: '50' });
      setData(await api.get(`/admin/push/receipts?${qs.toString()}`));
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [hours, type, push, read, page]);
  useEffect(() => { const t = setTimeout(() => { setPage(1); load(); }, 400); return () => clearTimeout(t); /* eslint-disable-next-line */ }, [search]);

  const st = data?.stats;
  const sel = 'bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-sm text-gray-200 focus:outline-none';

  return (
    <div className="space-y-5">
      {st && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
          {[
            ['Notifications', st.total, 'text-white'],
            ["Lues dans l'app", st.inAppRead, 'text-sky-400'],
            ['Affichées sur l\'appareil', st.pushConfirmed ?? 0, 'text-emerald-400'],
            ['Envoyées hors app', st.pushDelivered, 'text-teal-300'],
            ['Non envoyées hors app', st.pushNotDelivered, 'text-amber-400'],
            ['Sans envoi push', st.pushNotAttempted, 'text-gray-400'],
          ].map(([label, n, cls]: any) => (
            <div key={label} className="p-3.5 rounded-xl border bg-gray-900 border-gray-800">
              <p className={`text-2xl font-black ${cls}`}>{n}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <select className={sel} value={hours} onChange={(e) => { setHours(+e.target.value); setPage(1); }}>
          <option value={6}>6 dernières heures</option><option value={24}>24 dernières heures</option>
          <option value={72}>3 jours</option><option value={168}>7 jours</option><option value={720}>30 jours</option>
        </select>
        <select className={sel} value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
          <option value="all">Tous les types</option>
          {(data?.types ?? []).map((t: string) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className={sel} value={push} onChange={(e) => { setPush(e.target.value); setPage(1); }}>
          <option value="all">Push : tous</option><option value="sent">Envoyés hors app</option>
          <option value="not_sent">Non envoyés hors app</option><option value="none">Sans envoi push</option>
        </select>
        <select className={sel} value={read} onChange={(e) => { setRead(e.target.value); setPage(1); }}>
          <option value="all">App : toutes</option><option value="read">Lues</option><option value="unread">Non lues</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom, email, entreprise…"
            className="w-full pl-10 pr-4 py-2 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none" />
        </div>
        <button onClick={load} disabled={loading} className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
        <button onClick={sendTest} disabled={testing}
          className="px-3 py-2 bg-red-600/90 hover:bg-red-600 text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center gap-2">
          {testing ? <Loader2 size={14} className="animate-spin" /> : <BellRing size={14} />} Envoyer un test
        </button>
      </div>

      {testMsg && (
        <p className={`text-xs rounded-xl border px-3 py-2 ${testMsg.ok ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20' : 'text-amber-300 bg-amber-500/10 border-amber-500/20'}`}>
          {testMsg.text}
        </p>
      )}

      <p className="text-[11px] text-gray-600 flex items-start gap-1.5">
        <Inbox size={12} className="shrink-0 mt-0.5" />
        <span>
          « Affichée sur l&apos;appareil » = confirmé par l&apos;appareil lui-même (le service worker a affiché la notification, appli fermée ou non).
          « Envoyée (non confirmée) » = acceptée par le service push, sans confirmation : appareil éteint ou hors ligne, ancien service worker
          pas encore mis à jour, ou variable API_PUBLIC_URL absente. Seuls les envois faits après la mise à jour sont tracés.
          {st?.capped && ' Résultat limité aux 3000 notifications les plus récentes.'}
        </span>
      </p>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-600" /></div>
        ) : !data || data.items.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-16">Aucune notification pour ces filtres</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {data.items.map((r: any) => {
              const pKey = r.push ? (r.push.ackAt ? 'CONFIRMED' : r.push.status) : null;
              const pm = pKey ? (PUSH_META[pKey] ?? { label: pKey, cls: 'text-gray-400 bg-gray-800 border-gray-700' }) : null;
              return (
                <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-white truncate">{r.name}</p>
                    <p className="text-xs text-gray-600 truncate">{r.title} · {r.companyName ?? 'Plateforme'} · {fmtDateTime(r.createdAt)}</p>
                    {r.push?.error && <p className="text-[11px] text-red-400/80 truncate">{r.push.error}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${r.inApp.read ? 'text-sky-400 bg-sky-500/10 border-sky-500/20' : 'text-gray-400 bg-gray-800 border-gray-700'}`}
                      title={r.inApp.readAt ? `Lue le ${fmtDateTime(r.inApp.readAt)}` : "Reçue dans l'app, pas encore lue"}>
                      {r.inApp.read ? <Eye size={11} /> : <EyeOff size={11} />} {r.inApp.read ? 'Lue' : "Dans l'app"}
                    </span>
                    {pm ? (
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${pm.cls}`}
                        title={`${r.push.devicesOk}/${r.push.devicesTotal} appareil(s) accepté(s)` + (r.push.ackAt ? ` · affichée le ${fmtDateTime(r.push.ackAt)} (${r.push.ackedDevices} appareil(s))` : '')}>{pm.label}</span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full border text-gray-600 bg-gray-900 border-gray-800 flex items-center gap-1">
                        <XCircle size={11} /> Pas d&apos;envoi push
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data && data.total > data.limit && (
        <div className="flex items-center justify-between text-sm text-gray-400">
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40">Précédent</button>
          <span>Page {data.page} / {Math.ceil(data.total / data.limit)}</span>
          <button disabled={page >= Math.ceil(data.total / data.limit)} onClick={() => setPage((p) => p + 1)} className="px-3 py-1.5 bg-gray-800 rounded-lg disabled:opacity-40">Suivant</button>
        </div>
      )}
    </div>
  );
}

export default function PushNotificationsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tab, setTab] = useState<'subs' | 'receipts' | 'broadcast'>('subs'); // 🆕

  const load = async () => {
    setLoading(true);
    try {
      const d = await adminService.getPushDiagnostics();
      setData(d);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = data.users as any[];
    if (filter !== 'all') list = list.filter((u) => u.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        (u.companyName ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [data, filter, search]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Bell className="text-red-500" size={24} /> Notifications Push
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Qui a activé, qui n'a jamais activé, et qui a un abonnement cassé
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-sm transition-colors disabled:opacity-50">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualiser
        </button>
      </div>

      {/* 🆕 Onglets */}
      <div className="flex gap-1 p-1 bg-gray-900 border border-gray-800 rounded-xl w-fit">
        {([['subs', 'Appareils'], ['receipts', 'Réceptions'], ['broadcast', 'Envoi']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === k ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'receipts' && <ReceiptsTab />}
      {tab === 'broadcast' && <BroadcastTab />}

      {/* Alerte VAPID — cause n°1 d'un push qui ne part jamais, pour PERSONNE */}
      {tab === 'subs' && data && !data.vapidConfigured && (
        <div className="bg-red-950/40 border border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <ShieldAlert className="text-red-500 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-sm font-bold text-red-300">Clés VAPID manquantes sur le serveur</p>
            <p className="text-xs text-red-400/80 mt-1">
              Aucune notification push ne peut être envoyée sur toute la plateforme, quel que soit
              le statut d'activation des utilisateurs ci-dessous. Vérifie <code className="bg-red-900/40 px-1 rounded">VAPID_PUBLIC_KEY</code> et{' '}
              <code className="bg-red-900/40 px-1 rounded">VAPID_PRIVATE_KEY</code> dans les variables d'environnement du backend.
            </p>
          </div>
        </div>
      )}

      {/* Compteurs / filtres */}
      {tab === 'subs' && data && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {([
            ['all', 'Tous', data.totalUsers, 'text-white'],
            ['active', 'Actifs', data.activeCount, 'text-emerald-400'],
            ['enabled_no_device', 'Sans appareil', data.brokenCount, 'text-amber-400'],
            ['disabled', 'Désactivés', data.disabledCount, 'text-gray-400'],
          ] as [StatusFilter, string, number, string][]).map(([key, label, count, cls]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`text-left p-3.5 rounded-xl border transition-colors ${filter === key ? 'bg-gray-800 border-gray-600' : 'bg-gray-900 border-gray-800 hover:border-gray-700'}`}>
              <p className={`text-2xl font-black ${cls}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Recherche */}
      {tab === 'subs' && (<>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Chercher un nom, un email, une entreprise…"
          className="w-full pl-10 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:border-gray-600"
        />
      </div>

      {/* Liste */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 size={22} className="animate-spin text-gray-600" /></div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-gray-600 text-center py-16">Aucun utilisateur pour ce filtre</p>
        ) : (
          <div className="divide-y divide-gray-800">
            {filtered.map((u) => {
              const meta = STATUS_META[u.status as 'active' | 'enabled_no_device' | 'disabled'];
              const Icon = meta.icon;
              const isExpanded = expandedId === u.id;
              return (
                <div key={u.id}>
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : u.id)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-gray-800/40 transition-colors text-left"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{u.name}</p>
                      <p className="text-xs text-gray-600 truncate">{u.email} · {u.companyName ?? 'Plateforme'} · {u.role}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-xs text-gray-600 hidden sm:block">Vu {fmtRelative(u.lastActiveAt)}</span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Smartphone size={12} /> {u.deviceCount}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${meta.cls}`}>
                        <Icon size={11} /> {meta.label}
                      </span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 bg-gray-950/40">
                      {u.status === 'enabled_no_device' && (
                        <p className="text-xs text-amber-400/90 mb-3 flex items-start gap-1.5">
                          <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                          Push activé côté profil mais aucun appareil enregistré — l'utilisateur doit
                          rouvrir l'app et réactiver le push depuis son navigateur/téléphone.
                        </p>
                      )}
                      {u.status === 'disabled' && (
                        <p className="text-xs text-gray-500 mb-3 flex items-start gap-1.5">
                          <BellOff size={12} className="shrink-0 mt-0.5" />
                          N'a jamais activé les notifications push.
                        </p>
                      )}
                      {u.devices.length > 0 ? (
                        <div className="space-y-1.5">
                          {u.devices.map((d: any) => {
                            const st = DEVICE_STATE[d.state] ?? DEVICE_STATE.ACTIVE;
                            return (
                              <div key={d.id} className="text-xs bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 space-y-1">
                                <div className="flex items-center justify-between gap-3">
                                  <span className="text-gray-300 flex items-center gap-2 min-w-0">
                                    <Smartphone size={12} className={d.state === 'ACTIVE' ? 'text-emerald-500' : 'text-gray-600'} />
                                    <span className="truncate">{d.label || 'Appareil sans nom'}</span>
                                    {d.deviceRef
                                      ? <span className="text-gray-600 shrink-0">#{d.deviceRef}</span>
                                      : <span className="text-gray-700 shrink-0" title="Ancien enregistrement, avant l'identifiant d'appareil">ancien</span>}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${st.cls}`}>{st.label}</span>
                                </div>
                                <p className="text-gray-600">
                                  activé {fmtRelative(d.enabledAt)}
                                  {d.disabledAt ? ` · ${d.state === 'EXPIRED' ? 'expiré' : 'désactivé'} ${fmtRelative(d.disabledAt)}` : ''}
                                  {' · '}dernier envoi réussi {fmtRelative(d.lastSuccessAt)}
                                </p>
                                {d.lastError && d.lastFailureAt && (
                                  <p className="text-red-400/80">échec {fmtRelative(d.lastFailureAt)} : {d.lastError}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-700">Aucun appareil enregistré.</p>
                      )}
                      <DeviceHistory userId={u.id} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}