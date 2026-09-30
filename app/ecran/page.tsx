'use client';

// ============================================================================
// 📁 app/ecran/page.tsx — Écran d'affichage du QR de pointage (tablette fixe)
// 1) 1re ouverture : CODE D'APPAIRAGE affiché (aucun QR). L'admin le saisit dans
//    Présences → Écrans QR pour approuver et choisir la portée.
// 2) Une fois approuvé : jeton d'appareil gardé sur la tablette, plus jamais de
//    login. QR renouvelé toutes les 30 s à partir d'un lot de tokens.
// 3) Hors horaires de travail : écran quasi noir, plus de requêtes, veille OK.
// 4) « Mon code secret » : l'employé tape son mot ou PIN (aucun micro).
// Dépendance : npm install qrcode.react
// ============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  KeyRound, QrCode, Loader2, WifiOff, ShieldOff, CheckCircle2, LogOut,
  AlertTriangle, MonitorSmartphone, Eye, EyeOff,
} from 'lucide-react';
import { displayApi, deviceToken, QrToken, ScreenInfo, PunchResult } from '@/services/display-screen-api';
import { speakPointageMessage } from '@/lib/pointeuse-tts';

type View = 'boot' | 'pairing' | 'ready' | 'revoked';
const REFILL_BELOW = 3;      // recharge un lot quand il reste < 3 tokens valides
const STEP_FALLBACK = 30;
const RESULT_MS = 6000;      // durée d'affichage d'un résultat
const SECRET_IDLE_MS = 40000; // retour auto au QR si personne ne tape

// Titre du refus selon la CAUSE (le backend renvoie un code d'erreur) — plus de
// « Pointage non validé » générique. Les cas congé / repos passent par la
// confirmation (requiresConfirmation) et gardent leur motif.
function failureTitle(code?: string): string {
  const titles: Record<string, string> = {
    SECRET_NOT_FOUND: 'Code secret non reconnu',
    LOCKED: 'Trop d’essais',
    ALREADY_DONE: 'Déjà pointé',
    NETWORK: 'Connexion impossible',
  };
  return titles[code || ''] || 'Pointage impossible';
}

export default function EcranPage() {
  const [view, setView] = useState<View>('boot');
  const [info, setInfo] = useState<ScreenInfo | null>(null);
  const [code, setCode] = useState('');
  const [now, setNow] = useState(Date.now());
  const [tokens, setTokens] = useState<QrToken[]>([]);
  const [offline, setOffline] = useState(false);
  const [mode, setMode] = useState<'qr' | 'secret'>('qr');
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [sending, setSending] = useState(false);
  const [outcome, setOutcome] = useState<PunchResult | null>(null);
  const skew = useRef(0);             // serverTime - Date.now()
  const step = useRef(STEP_FALLBACK);
  const fetching = useRef(false);
  const pendingSecret = useRef('');   // gardé seulement le temps d'une éventuelle confirmation
  const pollStop = useRef<() => void>(() => {});

  // ── Horloge (1 s) ─────────────────────────────────────────────────────────
  useEffect(() => { const id = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(id); }, []);
  const serverNow = now + skew.current;

  // ── Horaires : veille hors plage (économie tablette + serveur) ────────────
  const hour = new Date(now).getHours();
  const wh = info?.workHours;
  const inHours = !wh || (wh.startHour <= wh.endHour
    ? hour >= wh.startHour - 1 && hour < wh.endHour + 1
    : hour >= wh.startHour - 1 || hour < wh.endHour + 1);

  // ── Démarrage : déjà appairé ? sinon appairage ────────────────────────────
  const boot = useCallback(async () => {
    if (!deviceToken.get()) { startPairing(); return; }
    try {
      const { status, data } = await displayApi.me();
      if (status === 200 && data) { setInfo(data); setView('ready'); setOffline(false); return; }
      if (status === 401 || status === 403) { deviceToken.clear(); setInfo(null); startPairing(); return; }
      throw new Error('net');
    } catch { setOffline(true); setTimeout(boot, 5000); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startPairing = useCallback(async () => {
    pollStop.current();
    setView('pairing'); setTokens([]);
    let res;
    try { res = await displayApi.startPairing(); } catch { res = { status: 0, data: null as any }; }
    if (res.status >= 400 || !res.status || !res.data) { setOffline(true); setTimeout(startPairing, 5000); return; }
    const { pairingCode, pollToken } = res.data;
    setOffline(false); setCode(pairingCode);
    let stopped = false;
    pollStop.current = () => { stopped = true; };
    const poll = async () => {
      if (stopped) return;
      try {
        const r = await displayApi.pollPairing(pollToken);
        if (r.data?.status === 'APPROVED' && r.data.deviceToken) { stopped = true; deviceToken.set(r.data.deviceToken); boot(); return; }
        if (r.data?.status === 'EXPIRED') { stopped = true; startPairing(); return; }
      } catch { /* réseau : on réessaie */ }
      setTimeout(poll, 3000);
    };
    setTimeout(poll, 3000);
  }, [boot]);

  useEffect(() => { boot(); return () => pollStop.current(); }, [boot]);

  // ── Lot de tokens : 1 requête toutes les quelques minutes ─────────────────
  const refill = useCallback(async () => {
    if (fetching.current) return;
    fetching.current = true;
    try {
      const { status, data } = await displayApi.qrBatch();
      if (status === 401 || status === 403) { deviceToken.clear(); setView('revoked'); return; } // écran révoqué
      if (status === 200 && data) {
        skew.current = data.serverTime - Date.now();
        step.current = data.stepSeconds || STEP_FALLBACK;
        setTokens(data.tokens); setOffline(false);
      } else { setOffline(true); }
    } catch { setOffline(true); } finally { fetching.current = false; }
  }, []);

  useEffect(() => {
    if (view !== 'ready' || !inHours) return;
    const valid = tokens.filter((t) => t.validUntil > serverNow).length;
    if (valid < REFILL_BELOW) refill();
  }, [view, inHours, tokens, serverNow, refill]);

  // Régénération du QR par l'admin (nouveau sel) : la tablette resynchronise son lot
  // au plus tard 60 s après, sans intervention.
  useEffect(() => {
    if (view !== 'ready' || !inHours) return;
    const id = setInterval(refill, 60_000);
    return () => clearInterval(id);
  }, [view, inHours, refill]);

  // Hors horaires : on revérifie juste l'état de l'écran toutes les 5 min
  useEffect(() => {
    if (view !== 'ready' || inHours) return;
    const id = setInterval(boot, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [view, inHours, boot]);

  // ── Wake Lock : seulement pendant les horaires ────────────────────────────
  useEffect(() => {
    const wl = (navigator as any).wakeLock;
    if (view !== 'ready' || !inHours || !wl) return;
    let lock: any = null; let cancelled = false;
    const acquire = async () => {
      try { if (!cancelled && document.visibilityState === 'visible') lock = await wl.request('screen'); } catch { /* refusé (batterie faible) */ }
    };
    acquire();
    const onVis = () => { if (document.visibilityState === 'visible') acquire(); };
    document.addEventListener('visibilitychange', onVis);
    return () => { cancelled = true; document.removeEventListener('visibilitychange', onVis); lock?.release?.().catch(() => {}); };
  }, [view, inHours]);

  // ── Token courant + compte à rebours ──────────────────────────────────────
  const current = tokens.find((t) => t.validFrom <= serverNow && serverNow < t.validUntil);
  const remaining = current ? Math.max(0, Math.ceil((current.validUntil - serverNow) / 1000)) : 0;
  const pct = current ? remaining / step.current : 0;

  // ── Code secret (mot ou PIN, saisi au clavier) ────────────────────────────
  const leaveSecret = useCallback(() => {
    setMode('qr'); setSecret(''); setShowSecret(false); pendingSecret.current = '';
  }, []);

  const showOutcome = useCallback((r: PunchResult) => {
    setOutcome(r);
    if (r.requiresConfirmation) return;                      // attend le choix de l'employé
    pendingSecret.current = '';
    if (r.success && r.firstName && (r.direction === 'IN' || r.direction === 'OUT')) { try { speakPointageMessage(r.firstName, r.direction); } catch { /* voix indisponible */ } }
    setTimeout(() => { setOutcome(null); leaveSecret(); }, RESULT_MS);
  }, [leaveSecret]);

  const submitSecret = useCallback(async (value: string, confirm?: boolean) => {
    if (sending || value.trim().length < 4) return;
    setSending(true);
    try {
      const { status, data } = await displayApi.secretPunch(value.trim(), confirm);
      if (status === 401 || status === 403) { deviceToken.clear(); setView('revoked'); return; }
      if (status === 200 && data) {
        pendingSecret.current = data.requiresConfirmation ? value.trim() : '';
        showOutcome(data);
      } else {
        showOutcome({ success: false, code: (data as any)?.error || (data as any)?.code, message: data?.message || 'Pointage impossible, réessayez.' });
      }
    } catch { showOutcome({ success: false, code: 'NETWORK', message: 'Vérifiez le réseau de la tablette puis réessayez.' }); }
    finally { setSending(false); setSecret(''); }
  }, [sending, showOutcome]);

  useEffect(() => {                                          // retour auto au QR si inactif
    if (mode !== 'secret' || outcome || sending) return;
    const id = setTimeout(leaveSecret, SECRET_IDLE_MS);
    return () => clearTimeout(id);
  }, [mode, outcome, sending, secret, leaveSecret]);

  // ── Rendu ─────────────────────────────────────────────────────────────────
  const shell = 'min-h-[100dvh] w-full bg-[#0B0C0F] text-white flex flex-col items-center justify-center p-6 select-none';

  if (view === 'boot') return <div className={shell}><Loader2 className="animate-spin text-white/50" size={40} /></div>;

  if (view === 'pairing') return (
    <div className={shell}>
      <MonitorSmartphone size={48} className="text-white/40 mb-6" />
      <p className="text-white/60 text-lg text-center">Pour activer cet écran, saisissez ce code dans<br /><b className="text-white">Présences → Écrans QR</b></p>
      <div className="mt-8 font-mono font-black tracking-[0.35em] text-[clamp(2.5rem,12vw,6rem)] pl-[0.35em] text-emerald-400">{code || '······'}</div>
      <p className="mt-6 text-sm text-white/40 flex items-center gap-2">
        {offline ? <><WifiOff size={16} /> Connexion au serveur…</> : <><Loader2 size={16} className="animate-spin" /> En attente d&apos;approbation (10 min)</>}
      </p>
    </div>
  );

  if (view === 'revoked') return (
    <div className={shell}>
      <ShieldOff size={56} className="text-red-400 mb-4" />
      <h1 className="text-2xl font-bold">Cet écran a été désactivé</h1>
      <p className="mt-2 text-white/50 text-center max-w-md">Un administrateur a retiré l&apos;accès de cette tablette.</p>
      <button onClick={() => { deviceToken.clear(); startPairing(); }} className="mt-6 px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15">Réappairer cet écran</button>
    </div>
  );

  // Hors horaires : quasi noir
  if (!inHours) return (
    <div className={shell}>
      <div className="text-white/25 text-5xl font-light tabular-nums">{new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
      <p className="mt-2 text-white/20 text-sm">{info?.label} · en veille</p>
    </div>
  );

  // Résultat plein écran (succès, refus, ou demande de confirmation)
  if (outcome) {
    if (outcome.requiresConfirmation) return (
      <div className={shell}>
        <AlertTriangle size={80} className="text-amber-400" />
        <h1 className="mt-6 text-center font-extrabold text-[clamp(1.5rem,5vw,2.75rem)] text-amber-400">{outcome.reason || 'Confirmation requise'}</h1>
        <p className="mt-3 text-white/70 text-center text-lg max-w-xl">{outcome.message}</p>
        <div className="mt-8 flex gap-4">
          <button onClick={() => { setOutcome(null); leaveSecret(); }} className="px-7 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-lg">Annuler</button>
          <button onClick={() => { const v = pendingSecret.current; setOutcome(null); submitSecret(v, true); }}
            className="px-7 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-lg font-semibold">Je confirme</button>
        </div>
      </div>
    );
    const ok = outcome.success; const isIn = outcome.direction !== 'OUT';
    const tone = !ok ? 'text-amber-400' : isIn ? 'text-emerald-400' : 'text-red-400';
    return (
      <div className={shell}>
        {!ok ? <AlertTriangle size={88} className={tone} /> : isIn ? <CheckCircle2 size={88} className={tone} /> : <LogOut size={80} className={tone} />}
        <h1 className={`mt-6 text-center font-extrabold text-[clamp(1.75rem,6vw,3.5rem)] ${tone}`}>
          {ok ? `${outcome.direction === 'BREAK_END' ? 'Bon retour' : isIn ? 'Bienvenue' : 'À bientôt'}${outcome.firstName ? `, ${outcome.firstName}` : ''} !` : failureTitle(outcome.code)}
        </h1>
        <p className="mt-3 text-white/70 text-center text-lg max-w-xl">{outcome.message || (ok ? (isIn ? 'Entrée enregistrée.' : 'Sortie enregistrée.') : '')}</p>
      </div>
    );
  }

  return (
    <div className={shell}>
      <header className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-4 text-white/60">
        <span className="font-semibold text-white/80 truncate">{info?.label}</span>
        <span className="tabular-nums text-lg">{new Date(now).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      </header>

      {mode === 'qr' ? (
        <>
          <h1 className="mb-5 text-center text-[clamp(1.1rem,3vw,1.75rem)] font-bold">Scannez depuis votre espace employé</h1>
          <div className="relative rounded-3xl bg-white p-4 shadow-2xl" style={{ width: 'min(72vw, 62vh)' }}>
            {current ? (
              <QRCodeSVG value={`KONZA1.${current.token}`} level="M" bgColor="#ffffff" fgColor="#0B0C0F" style={{ width: '100%', height: 'auto', display: 'block' }} />
            ) : (
              <div className="aspect-square grid place-items-center text-[#0B0C0F]/50"><Loader2 className="animate-spin" size={40} /></div>
            )}
          </div>
          <div className="mt-5 h-1.5 rounded-full bg-white/10 overflow-hidden" style={{ width: 'min(72vw, 62vh)' }} aria-hidden>
            <div className="h-full bg-emerald-400 transition-[width] duration-1000 ease-linear" style={{ width: `${pct * 100}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/40 flex items-center gap-2">
            {offline ? <><WifiOff size={14} /> Reconnexion…</> : `Renouvelé dans ${remaining}s`}
          </p>
          <button onClick={() => setMode('secret')} className="mt-6 inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/15 text-lg font-semibold">
            <KeyRound size={22} /> Mon code secret
          </button>
        </>
      ) : (
        <form className="w-full max-w-md flex flex-col items-center" autoComplete="off"
          onSubmit={(e) => { e.preventDefault(); submitSecret(secret); }}>
          <KeyRound size={48} className="text-white/40 mb-4" />
          <h1 className="text-center text-[clamp(1.25rem,3.5vw,2rem)] font-bold">Saisissez votre code secret</h1>
          <p className="mt-2 text-white/50 text-center">Mot secret ou PIN — il enregistre votre entrée, puis votre sortie.</p>
          <div className="relative mt-8 w-full">
            <input autoFocus value={secret} onChange={(e) => setSecret(e.target.value)} maxLength={32}
              type={showSecret ? 'text' : 'password'} name="konza-secret" autoComplete="off" autoCapitalize="off" autoCorrect="off" spellCheck={false}
              aria-label="Code secret" placeholder="••••••"
              className="w-full rounded-2xl bg-white/10 border border-white/15 focus:border-emerald-400 outline-none px-5 py-5 pr-14 text-2xl text-center tracking-widest" />
            <button type="button" onClick={() => setShowSecret((v) => !v)} aria-label={showSecret ? 'Masquer' : 'Afficher'}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">{showSecret ? <EyeOff size={22} /> : <Eye size={22} />}</button>
          </div>
          <button disabled={sending || secret.trim().length < 4}
            className="mt-5 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-lg font-semibold">
            {sending ? <Loader2 className="animate-spin" size={22} /> : <CheckCircle2 size={22} />} Valider
          </button>
          <button type="button" onClick={leaveSecret} className="mt-4 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15">
            <QrCode size={18} /> Retour au QR code
          </button>
        </form>
      )}
    </div>
  );
}