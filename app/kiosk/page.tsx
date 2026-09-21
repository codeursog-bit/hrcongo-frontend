'use client';

// ============================================================================
// 📁 app/kiosk/page.tsx — Écran de pointage tablette (badge NFC + QR code)
// ============================================================================
// ✅ Route autonome, plein écran, hors layout dashboard (pas de sidebar/nav).
// ✅ Garde les couleurs de la pointeuse existante : emerald = entrée,
//    red = sortie, amber = confirmation requise (congé/férié), sur un fond
//    sombre #0B0C0F identique à --surface en dark theme.
// ✅ Auth : PAS de JWT employé. La tablette s'authentifie avec sa propre clé
//    API (voir module backend checkin-devices), saisie une fois à
//    l'installation et conservée en localStorage sur CETTE tablette.
// ✅ Mode enrôlement : pour associer les badges NFC déjà possédés par
//    l'entreprise, directement depuis la tablette, sans repasser par un
//    ordinateur — idéal pour un jour d'installation avec toute l'équipe.
//
// Dépendance à installer : npm install html5-qrcode
// ============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  CheckCircle2, LogOut, AlertTriangle, ShieldQuestion, Settings,
  WifiOff, Loader2, ScanFace, Search, X, UserPlus,
} from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
const STORAGE_KEY = 'kioskApiKey';

// Certains hébergeurs gratuits (Render...) mettent le serveur en veille après
// une période d'inactivité : le tout premier appel peut prendre 30-50s le
// temps qu'il se réveille. On laisse large, et on retente une fois avant
// d'abandonner, pour ne pas afficher une fausse erreur à ce moment-là.
async function fetchKiosk(url: string, options: RequestInit, allowRetry = true): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeout);
    return res;
  } catch (err) {
    clearTimeout(timeout);
    if (allowRetry) {
      await new Promise((r) => setTimeout(r, 3000));
      return fetchKiosk(url, options, false);
    }
    throw err;
  }
}
const QR_REGION_ID = 'kiosk-qr-video';

// La caméra lit les QR codes qu'on génère nous-mêmes, ET les codes-barres
// classiques déjà imprimés sur des badges existants (type carte d'accès,
// carte professionnelle) — pas besoin de NFC pour ce genre de badge.
const SCAN_CONFIG = {
  fps: 5,
  qrbox: { width: 260, height: 260 },
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
  ],
};

// ── Messages qui font vivre l'écran — un tirage aléatoire à chaque scan,
//    pour que la tablette ne sonne jamais robotique sur la durée. ─────────
const WELCOME_MESSAGES = [
  'Une belle journée commence, {name} !',
  'On compte sur toi aujourd\u2019hui, {name} !',
  'Prêt à tout donner, {name} ?',
  'Ton énergie fait la différence, {name}.',
  'Bienvenue {name}, l\u2019équipe est plus forte avec toi.',
  'C\u2019est parti pour une journée productive, {name} !',
];

const GOODBYE_MESSAGES = [
  'Bon travail aujourd\u2019hui, {name} !',
  'Merci pour ton énergie, {name}. Repose-toi bien.',
  'Journée bouclée avec brio, {name} !',
  'Bravo pour ton engagement, {name}. À demain !',
  '{name}, ta journée compte. Rentre bien.',
  'Objectif du jour atteint, {name} !',
];

function pickMessage(list: string[], name: string) {
  const template = list[Math.floor(Math.random() * list.length)];
  return template.replace('{name}', name || 'à toi');
}

// ── Types ────────────────────────────────────────────────────────────────
type Feedback =
  | { kind: 'idle' }
  | { kind: 'check-in'; name: string; line: string }
  | { kind: 'check-out'; name: string; line: string }
  | { kind: 'confirm'; identifier: string; message: string; isOnLeave?: boolean; isRestDay?: boolean }
  | { kind: 'unknown' }
  | { kind: 'error'; message: string };

type KioskEmployee = { id: string; firstName: string; lastName: string; employeeNumber: string };

type Schedule = {
  officialStartHour: number;
  officialEndHour: number;
  lateToleranceMinutes: number;
  workDays: number[];
  midDayStartHour: number | null;
  midDayEndHour: number | null;
};

// Marge avant l'heure officielle pour que la tablette soit déjà prête
// quand les premiers employés arrivent (plutôt que de se réveiller pile
// à l'heure).
const PRE_WINDOW_MINUTES = 20;
// Marge, plus courte, autour de la pause déjeuner — pas besoin d'anticiper
// autant qu'une arrivée du matin.
const MIDDAY_MARGIN_MINUTES = 10;
// Une fois réveillée manuellement (tap sur l'écran de veille), la tablette
// reste active ce temps-là avant de se rendormir si aucun autre pointage.
const MANUAL_WAKE_MINUTES = 10;

// Est-ce que "maintenant" tombe dans une des fenêtres actives (arrivée,
// pause déjeuner si réglée, ou départ, tolérance de retard incluse) ?
function isWithinScheduledWindow(now: Date, schedule: Schedule): boolean {
  const day = now.getDay(); // 0 = dimanche ... 6 = samedi
  const isWorkDay = schedule.workDays.includes(day) || schedule.workDays.includes(day === 0 ? 7 : day);
  if (!isWorkDay) return false;

  const minutesNow = now.getHours() * 60 + now.getMinutes();
  const startWindowFrom = schedule.officialStartHour * 60 - PRE_WINDOW_MINUTES;
  const startWindowTo = schedule.officialStartHour * 60 + schedule.lateToleranceMinutes;
  const endWindowFrom = schedule.officialEndHour * 60 - PRE_WINDOW_MINUTES;
  const endWindowTo = schedule.officialEndHour * 60 + schedule.lateToleranceMinutes;

  const inMorningOrEvening =
    (minutesNow >= startWindowFrom && minutesNow <= startWindowTo) ||
    (minutesNow >= endWindowFrom && minutesNow <= endWindowTo);

  if (inMorningOrEvening) return true;

  // Pause déjeuner : seulement si explicitement réglée sur cette tablette.
  if (schedule.midDayStartHour != null && schedule.midDayEndHour != null) {
    const midFrom = schedule.midDayStartHour * 60 - MIDDAY_MARGIN_MINUTES;
    const midTo = schedule.midDayEndHour * 60 + MIDDAY_MARGIN_MINUTES;
    if (minutesNow >= midFrom && minutesNow <= midTo) return true;
  }

  return false;
}

// ── Icône NFC maison (légère, pas de dépendance d'icône externe) ──────────
function NfcWaves({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} fill="none">
      <circle cx="30" cy="70" r="6" className="fill-current" />
      {[18, 30, 42].map((r, i) => (
        <path
          key={r}
          d={`M ${30 - r} 70 A ${r} ${r} 0 0 1 ${30 + r * 0.2} ${70 - r * 0.98}`}
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          className="kiosk-nfc-arc"
          style={{ animationDelay: `${i * 0.35}s` }}
        />
      ))}
    </svg>
  );
}

export default function KioskPage() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [keyDraft, setKeyDraft] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const [now, setNow] = useState(new Date());
  const [feedback, setFeedback] = useState<Feedback>({ kind: 'idle' });
  const [busy, setBusy] = useState(false);

  // ── Mode enrôlement ────────────────────────────────────────────────────
  const [enrollMode, setEnrollMode] = useState(false);
  const [enrollEmployees, setEnrollEmployees] = useState<KioskEmployee[]>([]);
  const [enrollSearch, setEnrollSearch] = useState('');
  const [pendingEnroll, setPendingEnroll] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [enrollToast, setEnrollToast] = useState<string | null>(null);

  // ── Rythme jour/nuit calé sur les horaires de l'entreprise ─────────────
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [manualWakeUntil, setManualWakeUntil] = useState<number | null>(null);

  // ── Refs "toujours à jour" : la caméra/le NFC capturent leur callback une
  //    seule fois au montage, donc tout ce qu'ils doivent lire en temps réel
  //    (clé API, occupé ou non, mode courant) passe par une ref, jamais
  //    directement par le state — sinon on lirait des valeurs figées.
  const apiKeyRef = useRef<string | null>(null);
  const busyRef = useRef(false);
  const feedbackKindRef = useRef<Feedback['kind']>('idle');
  const enrollModeRef = useRef(false);
  const pendingEnrollRef = useRef<string | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef<{ id: string; ts: number } | null>(null);
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { apiKeyRef.current = apiKey; }, [apiKey]);
  useEffect(() => { busyRef.current = busy; }, [busy]);
  useEffect(() => { feedbackKindRef.current = feedback.kind; }, [feedback]);
  useEffect(() => { enrollModeRef.current = enrollMode; }, [enrollMode]);
  useEffect(() => { pendingEnrollRef.current = pendingEnroll; }, [pendingEnroll]);

  // ── Horloge ───────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Récupération de la clé API stockée sur cette tablette ──────────────
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setApiKey(stored);
  }, []);

  // ── Récupération des horaires officiels de l'entreprise ────────────────
  useEffect(() => {
    if (!apiKey) return;
    fetchKiosk(`${API_URL}/checkin-devices/schedule`, { headers: { 'x-kiosk-api-key': apiKey } })
      .then((r) => r.json())
      .then(setSchedule)
      .catch(() => setSchedule(null)); // pas de planning connu → reste active en continu, par sécurité
  }, [apiKey]);

  // ── Calcul de l'état actif/repos, recalculé à chaque tic de l'horloge ──
  const isManuallyAwake = !!manualWakeUntil && Date.now() < manualWakeUntil;
  const isActive = !schedule || isManuallyAwake || isWithinScheduledWindow(now, schedule);

  // ── Envoi du scan au backend (pointage normal) ─────────────────────────
  const submitScan = useCallback(async (identifier: string, extra?: Record<string, boolean | undefined>) => {
    const key = apiKeyRef.current;
    if (!key) return;
    setBusy(true);
    try {
      const res = await fetchKiosk(`${API_URL}/checkin-devices/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-kiosk-api-key': key },
        body: JSON.stringify({ identifier, ...extra }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data?.error === 'CREDENTIAL_NOT_FOUND') {
          setFeedback({ kind: 'unknown' });
        } else {
          setFeedback({ kind: 'error', message: data?.message || 'Pointage impossible.' });
        }
        return;
      }

      if (data?.requiresConfirmation) {
        setFeedback({
          kind: 'confirm',
          identifier,
          message: data.message,
          isOnLeave: data.isOnLeave,
          isRestDay: data.isRestDay,
        });
        return;
      }

      const name = data?.employee ? `${data.employee.firstName} ${data.employee.lastName}` : '';
      const firstName = data?.employee?.firstName || '';

      setFeedback(
        data?.action === 'CHECK_OUT'
          ? { kind: 'check-out', name, line: pickMessage(GOODBYE_MESSAGES, firstName) }
          : { kind: 'check-in', name, line: pickMessage(WELCOME_MESSAGES, firstName) },
      );
    } catch (err: any) {
      // Message précis affiché à l'écran — utile pour diagnostiquer sans
      // avoir besoin d'ouvrir la console du navigateur sur la tablette.
      const detail =
        err?.name === 'AbortError'
          ? 'le serveur met trop de temps à répondre'
          : err?.message || 'réseau';
      setFeedback({ kind: 'error', message: `Connexion au serveur impossible (${detail}).` });
    } finally {
      setBusy(false);
    }
  }, []);

  // ── Scan reçu pendant le mode enrôlement : on cherche juste à savoir si
  //    ce badge est déjà pris, sinon on ouvre le sélecteur d'employé. ─────
  const handleEnrollScan = useCallback(async (identifier: string) => {
    const key = apiKeyRef.current;
    if (!key || pendingEnrollRef.current) return;

    try {
      const res = await fetchKiosk(`${API_URL}/checkin-devices/lookup?identifier=${encodeURIComponent(identifier)}`, {
        headers: { 'x-kiosk-api-key': key },
      });
      const data = await res.json();
      if (data?.found) {
        setEnrollToast(`Déjà associé à ${data.employeeName}`);
        setTimeout(() => setEnrollToast(null), 2200);
        return;
      }
    } catch {
      setEnrollToast('Connexion impossible.');
      setTimeout(() => setEnrollToast(null), 2200);
      return;
    }

    setPendingEnroll(identifier);
  }, []);

  // ── Point d'entrée commun QR + NFC, avec anti-doublon ─────────────────
  const handleIdentifier = useCallback((identifier: string) => {
    if (enrollModeRef.current) {
      handleEnrollScan(identifier);
      return;
    }
    if (busyRef.current || feedbackKindRef.current !== 'idle') return;

    const last = cooldownRef.current;
    const nowTs = Date.now();
    if (last && last.id === identifier && nowTs - last.ts < 8000) return;
    cooldownRef.current = { id: identifier, ts: nowTs };

    submitScan(identifier);
  }, [handleEnrollScan, submitScan]);

  // ── Scanner QR (caméra) — ne tourne QUE pendant les fenêtres actives, pour
  //    économiser batterie/CPU le reste du temps. La fonction capturée est
  //    STABLE (refs internes), donc aucun souci de fraîcheur des données. ──
  useEffect(() => {
    if (!apiKey || !isActive) return;
    let cancelled = false;
    const scanner = new Html5Qrcode(QR_REGION_ID, { verbose: false });
    qrScannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        SCAN_CONFIG,
        (decodedText) => handleIdentifier(decodedText.trim()),
        () => {},
      )
      .catch(() => {
        if (!cancelled) setFeedback({ kind: 'error', message: 'Caméra indisponible sur cette tablette.' });
      });

    return () => {
      cancelled = true;
      scanner.stop().catch(() => {}).finally(() => scanner.clear());
      qrScannerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey, isActive]);

  // ── Lecteur NFC (Android + Chrome uniquement) ─────────────────────────
  useEffect(() => {
    if (!apiKey || !('NDEFReader' in window)) return;
    let active = true;

    (async () => {
      try {
        // @ts-ignore — API expérimentale, absente des types DOM standards
        const reader = new (window as any).NDEFReader();
        await reader.scan();
        reader.onreading = (event: any) => {
          if (active) handleIdentifier(event.serialNumber);
        };
      } catch {
        // Permission refusée ou NFC désactivé : la tablette reste
        // utilisable en QR code seul, sans bloquer l'écran.
      }
    })();

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ── Auto-retour à l'écran d'accueil après un scan ──────────────────────
  useEffect(() => {
    if (feedback.kind === 'idle' || feedback.kind === 'confirm') return;
    const t = setTimeout(() => setFeedback({ kind: 'idle' }), 4500);
    return () => clearTimeout(t);
  }, [feedback]);

  // ── Écran toujours allumé — SEULEMENT pendant les fenêtres actives.
  // En dehors, on laisse volontairement la tablette pouvoir s'assombrir/se
  // verrouiller comme un appareil normal : c'est là qu'est la vraie économie
  // d'énergie. Un tap sur l'écran de veille réactive tout instantanément.
  useEffect(() => {
    let lock: any = null;
    const acquire = async () => {
      try { lock = await (navigator as any).wakeLock?.request('screen'); } catch {}
    };
    const release = () => { lock?.release?.().catch(() => {}); lock = null; };

    if (isActive) {
      acquire();
      const onVisible = () => { if (document.visibilityState === 'visible') acquire(); };
      document.addEventListener('visibilitychange', onVisible);
      return () => { document.removeEventListener('visibilitychange', onVisible); release(); };
    }
    return undefined;
  }, [isActive]);

  // ── Surveillance du scanner caméra ──────────────────────────────────
  // Sur certains modèles Android, le flux caméra se coupe tout seul après
  // de très longues heures d'utilisation continue (limitation matérielle,
  // pas un bug de l'appli). On vérifie régulièrement qu'il tourne toujours
  // et on le relance discrètement si besoin, sans jamais couper l'écran.
  useEffect(() => {
    if (!isActive) return;
    const check = setInterval(() => {
      const scanner = qrScannerRef.current;
      if (scanner && scanner.getState && scanner.getState() !== Html5QrcodeScannerState.SCANNING) {
        scanner
          .start(
            { facingMode: 'environment' },
            SCAN_CONFIG,
            (decodedText) => handleIdentifier(decodedText.trim()),
            () => {},
          )
          .catch(() => {});
      }
    }, 60_000);
    return () => clearInterval(check);
  }, [handleIdentifier, isActive]);

  // ── Rafraîchissement silencieux toutes les 12h ────────────────────────
  // Une page web ouverte pendant des jours accumule un peu de mémoire au
  // fil du temps (fuite classique des flux vidéo/canvas). Un rechargement
  // complet périodique repart sur des bases saines — déclenché uniquement
  // pendant un moment d'inactivité, jamais en plein pointage.
  useEffect(() => {
    const t = setInterval(() => {
      if (feedbackKindRef.current === 'idle' && !enrollModeRef.current) {
        window.location.reload();
      }
    }, 12 * 60 * 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // ── Lecteur RFID USB "clavier virtuel" (keyboard-wedge) ─────────────────
  // Certains badges (cartes de proximité 125kHz) n'ont ni QR ni code-barres
  // lisible et ne sont PAS compatibles avec le NFC d'un téléphone — c'est
  // une autre techno radio. La solution classique : un petit lecteur USB
  // pas cher qui « tape » le numéro du badge comme un clavier, suivi
  // d'Entrée. On capte ça uniquement sur l'écran principal de pointage
  // (jamais pendant la config ou l'enrôlement, où on tape du texte normal).
  useEffect(() => {
    if (!apiKey || enrollMode || showSettings) return;

    let buffer = '';
    let lastKeyTs = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      // On ignore si le focus est sur un vrai champ de saisie (au cas où).
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

      const now = Date.now();
      // Un lecteur USB tape en quelques millisecondes ; si trop de temps
      // s'est écoulé depuis la dernière touche, on repart d'un tampon vide
      // (évite qu'une frappe humaine isolée ne déclenche quelque chose).
      if (now - lastKeyTs > 300) buffer = '';
      lastKeyTs = now;

      if (e.key === 'Enter') {
        if (buffer.length >= 4) handleIdentifier(buffer);
        buffer = '';
        return;
      }
      if (e.key.length === 1) buffer += e.key;
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [apiKey, enrollMode, showSettings, handleIdentifier]);

  // ── Accès discret aux réglages : 5 taps sur l'horloge ──────────────────
  const handleClockTap = () => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    tapTimerRef.current = setTimeout(() => (tapCountRef.current = 0), 1500);
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0;
      setShowSettings(true);
    }
  };

  const saveKey = () => {
    if (!keyDraft.trim()) return;
    window.localStorage.setItem(STORAGE_KEY, keyDraft.trim());
    setApiKey(keyDraft.trim());
    setShowSettings(false);
    setKeyDraft('');
  };

  // ── Bascule vers le mode enrôlement : on charge d'abord la liste employés
  const startEnrollMode = async () => {
    if (!apiKey) return;
    try {
      const res = await fetchKiosk(`${API_URL}/checkin-devices/employees`, { headers: { 'x-kiosk-api-key': apiKey } });
      setEnrollEmployees(await res.json());
    } catch {
      setEnrollEmployees([]);
    }
    setEnrollMode(true);
    setShowSettings(false);
  };

  const assignEnroll = async (employeeId: string) => {
    if (!pendingEnroll || !apiKey) return;
    setEnrolling(true);
    try {
      const res = await fetchKiosk(`${API_URL}/checkin-devices/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-kiosk-api-key': apiKey },
        body: JSON.stringify({ identifier: pendingEnroll, employeeId, type: 'NFC_BADGE' }),
      });
      setEnrollToast(res.ok ? 'Badge associé ✓' : 'Association impossible.');
    } catch {
      setEnrollToast('Association impossible.');
    } finally {
      setEnrolling(false);
      setPendingEnroll(null);
      setTimeout(() => setEnrollToast(null), 2000);
    }
  };

  // ============================================================
  // 🔧 ÉCRAN DE PROVISIONNEMENT — pas encore de clé sur ce device
  // ============================================================
  if (!apiKey || showSettings) {
    return (
      <div className="fixed inset-0 bg-[#0B0C0F] flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white/[0.03] border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-5">
            <Settings size={24} className="text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-1">Configuration de la tablette</h1>
          <p className="text-sm text-white/50 mb-6">
            Colle ici la clé API générée pour ce device dans l'espace admin (Présences → Tablettes de pointage).
          </p>
          <input
            type="password"
            value={keyDraft}
            onChange={(e) => setKeyDraft(e.target.value)}
            placeholder="Clé API de la tablette"
            className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white text-sm mb-4 outline-none focus:border-emerald-500/50"
          />
          <div className="flex gap-3 mb-3">
            {apiKey && (
              <button onClick={() => setShowSettings(false)} className="flex-1 py-3 rounded-xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors">
                Annuler
              </button>
            )}
            <button onClick={saveKey} className="flex-1 py-3 rounded-xl bg-emerald-500 text-white font-bold hover:bg-emerald-400 transition-colors active:scale-95">
              Enregistrer
            </button>
          </div>

          {apiKey && (
            <button
              onClick={startEnrollMode}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 font-bold hover:bg-sky-500/25 transition-colors"
            >
              <UserPlus size={16} /> Activer le mode enrôlement de badges
            </button>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // 🪪 MODE ENRÔLEMENT — présenter les badges existants un par un
  // ============================================================
  if (enrollMode) {
    const filtered = enrollEmployees.filter((e) =>
      `${e.firstName} ${e.lastName} ${e.employeeNumber}`.toLowerCase().includes(enrollSearch.toLowerCase()),
    );

    return (
      <div className="fixed inset-0 bg-[#0B0C0F] text-white flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
            <ScanFace size={18} /> Mode enrôlement de badges
          </div>
          <button
            onClick={() => { setEnrollMode(false); setPendingEnroll(null); }}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-bold hover:bg-white/20"
          >
            Terminer
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-6">
          {!pendingEnroll ? (
            <>
              <div className="w-40 h-40 rounded-full border-2 border-sky-500/40 flex items-center justify-center mb-6 kiosk-nfc-pulse">
                <NfcWaves className="w-16 h-16 text-sky-400" />
              </div>
              <p className="text-white/60 text-center max-w-sm">
                Présentez le badge du prochain employé à enrôler.
              </p>
            </>
          ) : (
            <div className="w-full max-w-md">
              <p className="text-sm text-white/50 mb-3 text-center">Attribuer ce badge à :</p>
              <div className="relative mb-3">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  autoFocus
                  value={enrollSearch}
                  onChange={(e) => setEnrollSearch(e.target.value)}
                  placeholder="Chercher un employé..."
                  className="w-full pl-9 pr-3 py-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm outline-none focus:border-sky-500/50"
                />
              </div>
              <div className="max-h-72 overflow-y-auto space-y-1.5">
                {filtered.map((emp) => (
                  <button
                    key={emp.id}
                    disabled={enrolling}
                    onClick={() => assignEnroll(emp.id)}
                    className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-50 transition-colors text-left"
                  >
                    <span className="text-sm font-semibold">{emp.firstName} {emp.lastName}</span>
                    <span className="text-xs text-white/40">{emp.employeeNumber}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setPendingEnroll(null)}
                className="w-full mt-3 py-2.5 rounded-xl bg-white/5 text-white/60 text-sm font-semibold hover:bg-white/10"
              >
                Annuler ce badge
              </button>
            </div>
          )}
        </div>

        {enrollToast && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold kiosk-fade-in">
            {enrollToast}
          </div>
        )}

        {/* Le lecteur QR/NFC continue de tourner en fond, invisible ici */}
        <div id={QR_REGION_ID} className="hidden" />

        <style jsx global>{`
          .kiosk-nfc-pulse { animation: kiosk-breathe 2.4s ease-in-out infinite; }
          @keyframes kiosk-breathe { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.08); opacity: 1; } }
          .kiosk-nfc-arc { animation: kiosk-nfc-fade 1.8s ease-in-out infinite; opacity: 0.25; }
          @keyframes kiosk-nfc-fade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
          .kiosk-fade-in { animation: kiosk-fade-in 0.3s ease-out both; }
          @keyframes kiosk-fade-in { from { opacity: 0; } to { opacity: 1; } }
        `}</style>
      </div>
    );
  }

  // ============================================================
  // 😴 VEILLE PROGRAMMÉE — hors des heures d'arrivée/départ officielles
  // ============================================================
  if (!isActive) {
    return (
      <div
        onClick={() => setManualWakeUntil(Date.now() + MANUAL_WAKE_MINUTES * 60 * 1000)}
        className="fixed inset-0 bg-black flex flex-col items-center justify-center text-white/30 cursor-pointer"
      >
        <div className="font-mono text-4xl font-bold tabular-nums">
          {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <p className="text-xs mt-4 tracking-wide">Touchez l'écran pour pointer</p>
      </div>
    );
  }

  // ── Couleur d'accent selon l'état, en gardant la palette d'origine ──────
  const accent =
    feedback.kind === 'check-in' ? 'emerald'
    : feedback.kind === 'check-out' ? 'red'
    : feedback.kind === 'confirm' ? 'amber'
    : feedback.kind === 'unknown' ? 'sky'
    : feedback.kind === 'error' ? 'red'
    : 'emerald';

  const accentClasses: Record<string, { text: string; ring: string; glow: string; bg: string; border: string }> = {
    emerald: { text: 'text-emerald-400', ring: 'ring-emerald-500/40', glow: 'kiosk-glow-emerald', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30' },
    red: { text: 'text-red-400', ring: 'ring-red-500/40', glow: 'kiosk-glow-red', bg: 'bg-red-500/15', border: 'border-red-500/30' },
    amber: { text: 'text-amber-400', ring: 'ring-amber-500/40', glow: 'kiosk-glow-amber', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
    sky: { text: 'text-sky-400', ring: 'ring-sky-500/40', glow: 'kiosk-glow-sky', bg: 'bg-sky-500/15', border: 'border-sky-500/30' },
  };
  const a = accentClasses[accent];

  // ============================================================
  // 📲 ÉCRAN PRINCIPAL — pointage
  // ============================================================
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0B0C0F] text-white select-none">
      <div className="absolute inset-0 pointer-events-none">
        <div className="kiosk-blob kiosk-blob-1 bg-emerald-500/10" />
        <div className="kiosk-blob kiosk-blob-2 bg-sky-500/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,#0B0C0F_75%)]" />
      </div>

      <div className="relative h-full flex flex-col items-center justify-center px-6">
        <button onClick={handleClockTap} className="text-center mb-10 outline-none">
          <div className="font-mono text-6xl md:text-7xl font-bold tabular-nums kiosk-clock-glow">
            {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-white/40 text-sm mt-2 capitalize tracking-wide">
            {now.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </button>

        <div className="relative w-72 h-72 md:w-80 md:h-80 flex items-center justify-center mb-8">
          <div className={`absolute inset-0 rounded-full kiosk-ring-spin ${a.ring} ring-2`} />
          <div className={`absolute inset-3 rounded-full ${a.glow}`} />

          <div className="absolute inset-6 rounded-full overflow-hidden bg-black border border-white/10">
            <div id={QR_REGION_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />
            {feedback.kind === 'idle' && (
              <div className="absolute left-0 right-0 h-px bg-emerald-400/70 shadow-[0_0_12px_2px_rgba(16,185,129,0.6)] kiosk-scanline" />
            )}
          </div>

          {feedback.kind === 'idle' && !busy && (
            <div className="absolute -bottom-2 right-2 w-14 h-14 rounded-full bg-[#0B0C0F] border border-white/10 flex items-center justify-center text-emerald-400/80 kiosk-nfc-pulse">
              <NfcWaves className="w-7 h-7" />
            </div>
          )}

          {busy && (
            <div className="absolute inset-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <Loader2 size={36} className="animate-spin text-white/70" />
            </div>
          )}
        </div>

        {feedback.kind === 'idle' && (
          <p className="text-white/40 text-sm tracking-wide kiosk-fade-loop">
            Approchez votre badge ou présentez votre QR code
          </p>
        )}
      </div>

      {/* ══════════════ OVERLAYS DE RÉSULTAT ══════════════ */}

      {(feedback.kind === 'check-in' || feedback.kind === 'check-out') && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0C0F]/97 kiosk-fade-in">
          <div className={`w-28 h-28 rounded-full ${a.bg} border ${a.border} flex items-center justify-center mb-6 kiosk-pop-in`}>
            {feedback.kind === 'check-in' ? <CheckCircle2 size={52} className={a.text} /> : <LogOut size={48} className={a.text} />}
          </div>
          <h2 className="text-3xl font-bold mb-3 text-center max-w-lg kiosk-pop-in" style={{ animationDelay: '0.08s' }}>
            {feedback.line}
          </h2>
          <p className={`text-xs uppercase tracking-widest ${a.text} font-bold kiosk-pop-in`} style={{ animationDelay: '0.14s' }}>
            {feedback.kind === 'check-in' ? 'Entrée enregistrée' : 'Sortie enregistrée'}
            {' · '}
            {now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <div className="absolute bottom-0 left-0 h-1 bg-white/10 w-full">
            <div className={`h-full ${feedback.kind === 'check-in' ? 'bg-emerald-500' : 'bg-red-500'} kiosk-progress-shrink`} />
          </div>
        </div>
      )}

      {feedback.kind === 'confirm' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0C0F]/97 kiosk-fade-in px-8">
          <div className="w-24 h-24 rounded-full bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-6 kiosk-pop-in">
            <ShieldQuestion size={44} className="text-amber-400" />
          </div>
          <h2 className="text-2xl font-bold mb-3 text-center">Confirmation nécessaire</h2>
          <p className="text-white/60 text-sm text-center max-w-sm mb-8">{feedback.message}</p>
          <div className="flex gap-4 w-full max-w-sm">
            <button onClick={() => setFeedback({ kind: 'idle' })} className="flex-1 py-4 rounded-2xl bg-white/5 text-white/70 font-semibold hover:bg-white/10 transition-colors active:scale-95">
              Annuler
            </button>
            <button
              onClick={() => submitScan(feedback.identifier, { confirmWorkDuringLeave: feedback.isOnLeave, confirmRestDay: feedback.isRestDay })}
              className="flex-1 py-4 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-colors active:scale-95"
            >
              Je travaille aujourd'hui
            </button>
          </div>
        </div>
      )}

      {feedback.kind === 'unknown' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0C0F]/97 kiosk-fade-in">
          <div className="w-24 h-24 rounded-full bg-sky-500/15 border border-sky-500/30 flex items-center justify-center mb-6 kiosk-pop-in">
            <ShieldQuestion size={44} className="text-sky-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Badge non reconnu</h2>
          <p className="text-white/50 text-sm">Adressez-vous à votre administrateur RH.</p>
        </div>
      )}

      {feedback.kind === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B0C0F]/97 kiosk-fade-in">
          <div className="w-24 h-24 rounded-full bg-red-500/15 border border-red-500/30 flex items-center justify-center mb-6 kiosk-pop-in">
            <WifiOff size={44} className="text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Pointage impossible</h2>
          <p className="text-white/50 text-sm text-center max-w-sm px-6">{feedback.message}</p>
          <div className="absolute top-6 right-6"><AlertTriangle size={18} className="text-red-400/70" /></div>
        </div>
      )}

      <style jsx global>{`
        .kiosk-clock-glow { text-shadow: 0 0 30px rgba(16, 185, 129, 0.35); }
        .kiosk-ring-spin {
          background: conic-gradient(from 0deg, transparent 0%, currentColor 12%, transparent 24%);
          animation: kiosk-spin 5s linear infinite;
          -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
          mask: radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px));
        }
        @keyframes kiosk-spin { to { transform: rotate(360deg); } }
        .kiosk-glow-emerald { box-shadow: 0 0 60px 10px rgba(16, 185, 129, 0.18) inset; }
        .kiosk-glow-red { box-shadow: 0 0 60px 10px rgba(239, 68, 68, 0.18) inset; }
        .kiosk-glow-amber { box-shadow: 0 0 60px 10px rgba(245, 158, 11, 0.18) inset; }
        .kiosk-glow-sky { box-shadow: 0 0 60px 10px rgba(14, 165, 233, 0.18) inset; }
        .kiosk-scanline { top: 10%; animation: kiosk-scan 2.6s ease-in-out infinite; }
        @keyframes kiosk-scan { 0%, 100% { top: 8%; opacity: 0.9; } 50% { top: 88%; opacity: 0.4; } }
        .kiosk-nfc-pulse { animation: kiosk-breathe 2.4s ease-in-out infinite; }
        @keyframes kiosk-breathe { 0%, 100% { transform: scale(1); opacity: 0.85; } 50% { transform: scale(1.08); opacity: 1; } }
        .kiosk-nfc-arc { animation: kiosk-nfc-fade 1.8s ease-in-out infinite; opacity: 0.25; }
        @keyframes kiosk-nfc-fade { 0%, 100% { opacity: 0.2; } 50% { opacity: 1; } }
        .kiosk-blob { position: absolute; width: 40vw; height: 40vw; border-radius: 9999px; filter: blur(90px); animation: kiosk-float 16s ease-in-out infinite; }
        .kiosk-blob-1 { top: -10%; left: -10%; }
        .kiosk-blob-2 { bottom: -15%; right: -10%; animation-delay: -8s; }
        @keyframes kiosk-float { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(4%, 6%) scale(1.15); } }
        .kiosk-fade-loop { animation: kiosk-fade-loop 3.2s ease-in-out infinite; }
        @keyframes kiosk-fade-loop { 0%, 100% { opacity: 0.35; } 50% { opacity: 0.85; } }
        .kiosk-fade-in { animation: kiosk-fade-in 0.35s ease-out both; }
        @keyframes kiosk-fade-in { from { opacity: 0; } to { opacity: 1; } }
        .kiosk-pop-in { animation: kiosk-pop-in 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both; }
        @keyframes kiosk-pop-in { 0% { opacity: 0; transform: scale(0.6); } 100% { opacity: 1; transform: scale(1); } }
        .kiosk-progress-shrink { animation: kiosk-progress 4.5s linear forwards; }
        @keyframes kiosk-progress { from { width: 100%; } to { width: 0%; } }
      `}</style>
    </div>
  );
}