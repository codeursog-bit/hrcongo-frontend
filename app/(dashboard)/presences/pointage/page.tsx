'use client';
import { AttendancePageHeader } from '@/components/attendance/AttendancePageHeader';

// ============================================================================
// 📁 app/(dashboard)/presences/pointage/page.tsx — FINAL
// ============================================================================
// ✅ TOUTES les erreurs TypeScript corrigées :
//   - 'CHECK_OUT' → 'CHECK_IN' (CHECK_OUT n'existe pas dans le type front)
//   - result.data → (result as any) pour earlyArrival + slightLate
//   - Tous les addNotification utilisent 'ALERT' | 'CHECK_IN' | 'SUCCESS'
// ✅ Garde tout le code existant intact (GPS, offline, earlyArrival, etc.)
// 🆕 Toast slightLate ajouté (manquait — existait côté back, absent côté front)
// 🆕 Bloc OvertimeWorkflowCard intégré
// 🆕 PresenceSubNav intégré (navigation entre pages du module Présences)
// ============================================================================

import { AttendanceModuleFrame } from '@/components/attendance/AttendanceModuleFrame';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, MapPin, LogOut, ArrowLeft, Loader2, CheckCircle2,
  AlertTriangle, History, Ban, Fingerprint, Wifi,
  HelpCircle, Zap, Timer,
  CheckCircle, XCircle, Info, Sparkles, ScanLine, Coffee,
} from 'lucide-react';
import { attendanceApi } from '@/services/attendance-api';
import { api } from '@/services/api';
import { useNotification } from '@/components/providers/NotificationProvider';
import { useAttendanceOffline } from '@/hooks/useAttendanceOffline';
import { useBasePath } from '@/hooks/useBasePath';
import { captureAdaptivePosition } from '@/hooks/geoCapture'; // 🆕 trouve seul la bonne précision, le plus vite possible
import { markGpsPunchUser, getWarmReadings } from '@/hooks/geoWarmup'; // 🆕 préchauffage du GPS à l'ouverture de l'app
import PresenceSubNav from '@/components/PresenceSubNav';
import QrPunchModal from '@/components/pointage/QrPunchModal';
import { employeeQrApi, PunchResult, PunchMode } from '@/services/display-screen-api';
import { breakApi, BreakStatus } from '@/services/break-api';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
// ─── Types ────────────────────────────────────────────────────────────────────
type PageStatus = 'loading' | 'idle' | 'working' | 'completed' | 'error';
type OvertimeStatus =
  | 'NONE'
  | 'PENDING_EMPLOYEE'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'AUTO_CLOSED';

interface TodayAttendance {
  id: string;
  checkIn?: string;
  checkOut?: string;
  status: string;
  overtimeStatus?: OvertimeStatus;
  pendingOvertimeHours?: number;
  overtimeRequestedAt?: string;
}

// ─── Toast générique (earlyArrival + slightLate) ─────────────────────────────
type ToastVariant = 'early' | 'slight-late';

function AttendanceToast({
  variant, title, message, onClose,
}: {
  variant: ToastVariant;
  title: string;
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 9000);
    return () => clearTimeout(t);
  }, [onClose]);

  const isEarly = variant === 'early';

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-sm">
      <div className={` border rounded-2xl p-4 shadow-2xl ${
        isEarly ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] border-[var(--border)]' : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border-[var(--border)]'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isEarly ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]' : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]'}`}>
            <Sparkles size={16} className={isEarly ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-semibold text-sm ${isEarly ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'}`}>{title}</p>
            <p className={`text-xs mt-1 leading-relaxed ${isEarly ? 'text-[var(--success-text)]' : 'text-[var(--warning-text)]'}`}>{message}</p>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 mt-0.5 ${isEarly ? 'text-[var(--success-text)] hover:text-[var(--success-text)]' : 'text-[var(--warning-text)] hover:text-[var(--warning-text)]'}`}>
            <XCircle size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte Overtime Workflow ──────────────────────────────────────────────────
function OvertimeWorkflowCard({
  attendance, onResolveForgotten, onDeclareOvertime, resolving,
}: {
  attendance: TodayAttendance;
  onResolveForgotten: () => void;
  onDeclareOvertime: () => void;
  resolving: boolean;
}) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!attendance.checkIn) return;
    const calc = () => {
      const diff = Date.now() - new Date(attendance.checkIn!).getTime();
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      setElapsed(`${h}h${String(m).padStart(2, '0')}`);
    };
    calc();
    const id = setInterval(calc, 60_000);
    return () => clearInterval(id);
  }, [attendance.checkIn]);

  if (attendance.overtimeStatus === 'PENDING_EMPLOYEE') {
    return (
      <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] rounded-3xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] rounded-xl flex-shrink-0">
            <HelpCircle size={20} className="text-[var(--warning-text)]" />
          </div>
          <div>
            <p className="font-semibold text-[var(--warning-text)] text-base">Toujours au bureau ?</p>
            <p className="text-[var(--warning-text)] text-xs mt-0.5">
              Votre journée dépasse l'heure officielle.
              {attendance.pendingOvertimeHours ? ` Dépassement calculé : ${Number(attendance.pendingOvertimeHours).toFixed(1)}h.` : ''}
            </p>
          </div>
        </div>
        {attendance.checkIn && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] rounded-2xl">
            <Timer size={14} className="text-[var(--warning-text)] " />
            <span className="text-xs text-[var(--text-muted)]">Temps total depuis l'entrée :</span>
            <span className="font-mono font-semibold text-[var(--warning-text)] text-sm ml-auto">{elapsed}</span>
          </div>
        )}
        <p className="text-xs text-[var(--text-muted)] text-center">Que souhaitez-vous faire ?</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onResolveForgotten} disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] rounded-2xl transition-colors active:scale-95 disabled:opacity-50">
            {resolving ? <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /> : <span className="text-2xl"></span>}
            <span className="text-xs font-semibold text-[var(--text)] text-center leading-tight">J'avais oublié de pointer la sortie</span>
            <span className="text-[10px] text-[var(--text-muted)] text-center">→ Journée clôturée à l'heure officielle</span>
          </button>
          <button onClick={onDeclareOvertime} disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] rounded-2xl transition-colors active:scale-95 disabled:opacity-50">
            {resolving ? <Loader2 size={24} className="animate-spin text-[var(--warning-text)]" /> : <span className="text-2xl"></span>}
            <span className="text-xs font-semibold text-[var(--warning-text)] text-center leading-tight">Ce sont des heures supplémentaires</span>
            <span className="text-[10px] text-[var(--warning-text)] text-center">→ Demande envoyée au responsable</span>
          </button>
        </div>
      </div>
    );
  }

  if (attendance.overtimeStatus === 'PENDING_APPROVAL') {
    return (
      <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] rounded-3xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] rounded-xl flex-shrink-0">
            <Clock size={20} className="text-[var(--warning-text)] " />
          </div>
          <div>
            <p className="font-semibold text-[var(--warning-text)]">En attente de validation</p>
            <p className="text-[var(--warning-text)] text-xs mt-0.5">
              Votre demande de <strong className="text-[var(--warning-text)]">{Number(attendance.pendingOvertimeHours || 0).toFixed(1)}h supplémentaires</strong> a été envoyée à votre responsable.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 bg-[var(--surface-2)] rounded-2xl text-xs text-[var(--text-muted)] flex items-center gap-2">
          <Info size={13} className="text-[var(--warning-text)] flex-shrink-0" />
          Votre responsable recevra une notification. Les heures ne seront comptées qu'après sa validation.
        </div>
        {attendance.overtimeRequestedAt && (
          <p className="text-center text-[10px] text-[var(--text-muted)]">
            Demande envoyée le {new Date(attendance.overtimeRequestedAt).toLocaleString('fr-FR', {
              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
            })}
          </p>
        )}
      </div>
    );
  }

  if (attendance.overtimeStatus === 'APPROVED') {
    return (
      <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] border border-[var(--border)] rounded-3xl p-5 flex items-center gap-3">
        <CheckCircle size={22} className="text-[var(--success-text)] flex-shrink-0" />
        <div>
          <p className="font-semibold text-[var(--success-text)] text-sm">Heures supplémentaires validées </p>
          <p className="text-xs text-[var(--success-text)] mt-0.5">
            Vos {Number(attendance.pendingOvertimeHours || 0).toFixed(1)}h seront comptabilisées sur votre bulletin.
          </p>
        </div>
      </div>
    );
  }

  if (attendance.overtimeStatus === 'REJECTED') {
    return (
      <div className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] rounded-3xl p-5 flex items-center gap-3">
        <XCircle size={22} className="text-[var(--danger-text)] flex-shrink-0" />
        <div>
          <p className="font-semibold text-[var(--danger-text)] text-sm">Heures supplémentaires non validées</p>
          <p className="text-xs text-[var(--danger-text)] mt-0.5">Votre journée a été clôturée à l'heure officielle.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Page principale ──────────────────────────────────────────────────────────
function AttendanceCheckInPageContent() {
  const { bp } = useBasePath();
  const router = useRouter();
  const { addNotification } = useNotification();
  const { checkIn: offlineCheckIn, isOffline } = useAttendanceOffline();

  const [currentTime, setCurrentTime]   = useState<Date | null>(null);
  const [status, setStatus]             = useState<PageStatus>('loading');
  const [employeeId, setEmployeeId]     = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [userRole, setUserRole]         = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [gpsProgress, setGpsProgress] = useState<{ acc: number | null } | null>(null); // 🆕 recherche du signal en cours
  const [showConfetti, setShowConfetti] = useState(false);
  const [history, setHistory]           = useState<any[]>([]);

  const [todayAttendance, setTodayAttendance]     = useState<TodayAttendance | null>(null);
  const [overtimeResolving, setOvertimeResolving] = useState(false);

  // ✅ Un seul state toast — gère earlyArrival ET slightLate
  const [activeToast, setActiveToast] = useState<{
    variant: ToastVariant;
    title: string;
    message: string;
  } | null>(null);

  const [geoState, setGeoState] = useState<{
    allowed: boolean; distance: number | null; accuracy: number | null;
    latitude: number | null; longitude: number | null;
    error: string | null; loading: boolean; isMockedSuspect: boolean;
  }>({
    allowed: false, distance: null, accuracy: null,
    latitude: null, longitude: null, error: null,
    loading: true, isMockedSuspect: false,
  });

  const [companySettings, setCompanySettings] = useState<any>(null);

  // 🆕 Mode de pointage : SCAN (QR de la tablette fixe) ou GPS.
  // SCAN par défaut si et seulement si un écran QR est configuré pour
  // l'entreprise ; sinon GPS (comportement historique, inchangé).
  const [qrEnabled, setQrEnabled]   = useState(false);
  const [mode, setMode]             = useState<PunchMode>('GPS');
  const [modeReady, setModeReady]   = useState(false);
  const [showQr, setShowQr]         = useState(false);
  const scanMode = mode === 'SCAN';

  // 🆕 Pause de la journée
  const [breakInfo, setBreakInfo] = useState<BreakStatus | null>(null);
  const [breakBusy, setBreakBusy] = useState(false);
  const fmtHm = (iso?: string | null) =>
    iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const loadBreak = useCallback(async () => {
    try { setBreakInfo(await breakApi.status()); } catch { /* pause indisponible : rien à afficher */ }
  }, []);
  const breakLateMin = breakInfo?.state === 'ON_BREAK' && breakInfo.pause
    ? Math.max(0, Math.round(((currentTime?.getTime() ?? Date.now()) - new Date(breakInfo.pause.expectedEndAt).getTime()) / 60000))
    : 0;
  // ✅ Animation du scan biométrique (purement visuel, ne simule aucune
  // vraie biométrie — juste un retour visuel satisfaisant au clic)
  const [scanAnim, setScanAnim] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  // ── Rôle utilisateur (pour PresenceSubNav) ──────────────────────────────────
  useEffect(() => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role || '');
    } catch {}
  }, []);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const me: any = await api.get('/employees/me');
        if (!me) { setStatus('error'); return; }
        setEmployeeId(me.id);
        setEmployeeName(me.firstName);

        const company: any = await api.get('/companies/mine');
        setCompanySettings(company);

        // 🆕 Config du pointage par scan (échec silencieux → GPS par défaut)
        try {
          const cfg = await employeeQrApi.config();
          setQrEnabled(!!cfg.enabled);
          setMode(cfg.enabled ? cfg.defaultMode : 'GPS');
        } catch { /* GPS par défaut */ }
        setModeReady(true);

        const todayData: any = await api.get('/attendance/my-today');
        const myAtt = todayData.find((a: any) => a.employeeId === me.id);
        if (myAtt) {
          setTodayAttendance(myAtt);
          setStatus(myAtt.checkOut ? 'completed' : 'working');
        } else {
          setStatus('idle');
        }

        const currentMonth = new Date().getMonth() + 1;
        const currentYear  = new Date().getFullYear();
        const monthlyData: any = await attendanceApi.getMonthly({ month: currentMonth, year: currentYear });
        if (monthlyData?.attendances) {
          const myHistory = monthlyData.attendances
            .filter((a: any) => a.employeeId === me.id)
            .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .slice(0, 5);
          setHistory(myHistory);
        }
      } catch (e) {
        console.error('Erreur init pointage', e);
        setStatus('error');
      }
    })();
  }, []);

  // 🆕 Rafraîchit l'état de la pause tant que l'employé est au travail
  useEffect(() => {
    if (status !== 'working') return;
    loadBreak();
    const id = setInterval(loadBreak, 60_000);
    return () => clearInterval(id);
  }, [status, loadBreak]);

  // ── Horloge ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── GPS Watch ─────────────────────────────────────────────────────────────
  const handlePositionSuccessRef = React.useRef<(pos: GeolocationPosition) => void>();
  // 🆕 Dernières lectures GPS (≈15 s) : au clic on retient la MEILLEURE (précision la plus fine),
  // pas la première venue — le 1er relevé d'un GPS est souvent le moins précis (surtout en intérieur).
  const recentReadingsRef = React.useRef<GeolocationPosition[]>([]);

  useEffect(() => {
    // 🆕 Le GPS n'est lu qu'en mode GPS : en mode scan, la tablette fixe est la preuve
    // de présence (le GPS « saute » parfois) → aucune permission ni relevé inutile.
    if (!companySettings || !modeReady || mode !== 'GPS') return;
    markGpsPunchUser(); // 🆕 aux prochaines ouvertures de l'app, le GPS sera préchauffé (voir GeoWarmup)

    const handlePositionSuccess = (pos: GeolocationPosition) => {
      recentReadingsRef.current = [
        ...recentReadingsRef.current.filter(p => Date.now() - p.timestamp <= 15_000),
        pos,
      ].slice(-12);
      // 🆕 Le badge et la valeur de repli montrent la MEILLEURE lecture récente (≤ 15 s), pas la dernière
      // venue : sinon une lecture réseau floue arrivée après une bonne faisait « remonter » l'imprécision.
      const bestRecent = recentReadingsRef.current.reduce((b, p) => (p.coords.accuracy < b.coords.accuracy ? p : b));
      const { latitude: uLat, longitude: uLng, accuracy } = bestRecent.coords;
      // La position sert uniquement à être envoyée au backend : la décision
      // (zone autorisée ou non) et le message viennent exclusivement du serveur.
      setGeoState({
        allowed: true, distance: null, accuracy: Math.round(accuracy),
        latitude: uLat, longitude: uLng, error: null, loading: false,
        isMockedSuspect: false,
      });
    };
    handlePositionSuccessRef.current = handlePositionSuccess;

    const handlePositionError = (err: GeolocationPositionError) => {
      const msg = err.code === 1
        ? 'Vous devez autoriser la géolocalisation pour pointer.'
        : 'Impossible de vous localiser.';
      setGeoState(p => ({ ...p, error: msg, loading: false, allowed: false }));
    };

    // ✅ Lecture immédiate dès que companySettings est prêt, sans attendre le
    // premier callback (parfois lent) de watchPosition — pour que la
    // position se trouve vite et ne frustre pas l'utilisateur.
    navigator.geolocation.getCurrentPosition(handlePositionSuccess, handlePositionError, {
      enableHighAccuracy: true, timeout: 15000, maximumAge: 5000,
    });

    const watchId = navigator.geolocation.watchPosition(
      handlePositionSuccess,
      handlePositionError,
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );

    // ✅ Filet de sécurité : certains navigateurs/OS ne redéclenchent pas
    // watchPosition si le mouvement est jugé "pas assez significatif",
    // laissant un vieux relevé affiché indéfiniment (le fameux "il faut
    // actualiser la page"). On force donc une lecture fraîche toutes les
    // 5 secondes, en totale discrétion : pas de spinner, pas de reload,
    // juste le badge qui se met à jour tout seul si besoin. Les erreurs de
    // ce sondage sont ignorées (silencieuses) pour ne jamais perturber
    // l'utilisateur avec un souci ponctuel/temporaire de signal.
    const pollId = setInterval(() => {
      navigator.geolocation.getCurrentPosition(
        handlePositionSuccess,
        () => { /* silencieux : watchPosition/erreur initiale restent la source d'erreur affichée */ },
        // ✅ maximumAge: 0 — on interdit explicitement au navigateur de
        // recycler une position déjà en cache : chaque sondage force une
        // vraie relecture du capteur GPS.
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
      );
    }, 4000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(pollId);
    };
  }, [companySettings, modeReady, mode]);

  // ✅ Capture la position au moment du clic sur "Pointer" ET trouve toute seule la bonne précision :
  //  - elle part des lectures déjà reçues (page + préchauffage GPS) → souvent prête instantanément ;
  //  - sinon elle écoute le GPS et s'arrête DÈS QUE c'est suffisant, avec un seuil qui s'assouplit :
  //    ≤ 25 m tout de suite · ≤ 60 m après 6 s · ≤ 100 m après 12 s · sinon la meilleure lecture à 20 s ;
  //  - latitude, longitude et précision viennent de la MÊME lecture. Le serveur reste seul juge de la zone.
  const captureFreshPosition = (): Promise<GeolocationPosition | null> =>
    captureAdaptivePosition({
      seed: [...recentReadingsRef.current, ...getWarmReadings(15_000)],
      onProgress: (acc) => setGpsProgress({ acc: acc != null ? Math.round(acc) : null }),
    }).finally(() => setGpsProgress(null));

  // ── Action check-in / check-out ───────────────────────────────────────────
  const handleAction = async () => {
    if (!employeeId) return;
    // ✅ Plus de blocage/forçage côté client : on envoie toujours la
    // position qu'on a (même mauvaise ou absente), et c'est le backend qui
    // décide d'accepter ou de rejeter avec un message clair.

    setIsProcessing(true);
    setScanAnim('scanning'); // 🔵 anneau qui pulse, façon lecteur d'empreinte

    // ✅ On capture la position pile à l'instant du clic — pas la dernière
    // valeur mémorisée (qui peut dater de quelques secondes) — et c'est
    // cette capture-là qu'on envoie directement au backend.
    const freshPos = await captureFreshPosition();
    const sendLat = freshPos ? freshPos.coords.latitude  : (geoState.latitude  || undefined);
    const sendLng = freshPos ? freshPos.coords.longitude : (geoState.longitude || undefined);
    // Précision annoncée par l'appareil : le serveur s'en sert pour la marge de tolérance GPS
    const sendAccuracy = freshPos ? Math.round(freshPos.coords.accuracy) : (geoState.accuracy ?? undefined);
    if (freshPos) handlePositionSuccessRef.current?.(freshPos); // le badge reste synchronisé avec ce qui est envoyé

    let scanOutcome: 'success' | 'error' = 'success';
    try {
      if (status === 'idle') {
        // ── CHECK-IN ────────────────────────────────────────────────────────
        const result = await offlineCheckIn({
          employeeId,
          latitude:  sendLat,
          longitude: sendLng,
          accuracy:  sendAccuracy,
        });

        if (result.success) {
          setStatus('working');

          // ✅ Cast any pour accéder aux champs optionnels du backend
          const data = (result as any);

          if (data.earlyArrival) {
            // Toast arrivée anticipée
            setActiveToast({
              variant: 'early',
              title:   data.earlyArrivalTitle   || ' Arrivée anticipée notée !',
              message: data.earlyArrivalMessage || '',
            });
          } else if (data.slightLate) {
            // ✅ Toast petit retard (était absent avant)
            setActiveToast({
              variant: 'slight-late',
              title:   data.slightLateTitle   || ' Un tout petit retard !',
              message: data.slightLateMessage || '',
            });
          } else if (result.offline) {
            addNotification({ type: 'ALERT', title: 'Mode Hors Ligne', message: result.message });
          } else {
            const siteName = data.checkInSiteName;
            addNotification({
              type: 'CHECK_IN',
              title: 'Pointage Réussi',
              message: siteName
                ? `Bonne journée ${employeeName} ! (${siteName})`
                : `Bonne journée ${employeeName} !`,
            });
          }

          // Rafraîchir todayAttendance
          try {
            const todayData: any = await api.get('/attendance/my-today');
            const myAtt = todayData.find((a: any) => a.employeeId === employeeId);
            if (myAtt) setTodayAttendance(myAtt);
          } catch (_) { /* silencieux */ }
        } else {
          // ✅ Rejet backend (hors zone, position requise, etc.) — ne pas
          // rester silencieux : c'est justement le cas qu'on doit gérer.
          scanOutcome = 'error';
          addNotification({
            type: 'ALERT',
            title: 'Pointage refusé',
            message: result.message || 'Impossible de pointer depuis cette position.',
          });
        }

      } else {
        // ── CHECK-OUT ────────────────────────────────────────────────────────
        await attendanceApi.checkOut({
          employeeId,
          latitude:  sendLat,
          longitude: sendLng,
          accuracy:  sendAccuracy,
        });
        setStatus('completed');
        setShowConfetti(true);
        // ✅ 'CHECK_IN' utilisé — 'CHECK_OUT' n'existe pas dans le type front
        addNotification({ type: 'CHECK_IN', title: 'Bonne soirée !', message: 'Votre journée est enregistrée. À demain !' });
      }
    } catch (e: any) {
      console.error(e);
      scanOutcome = 'error';
      addNotification({ type: 'ALERT', title: 'Erreur de pointage', message: e.message || 'Erreur technique.' });
    } finally {
      setIsProcessing(false);
      setScanAnim(scanOutcome); // 🟢 succès ou 🔴 échec, bref, puis retour au neutre
      setTimeout(() => setScanAnim('idle'), 1400);
    }
  };

  // ── 🆕 Fin d'un scan QR réussi (le scan bascule tout seul : entrée OU sortie) ──
  const handleQrDone = useCallback(async (r: PunchResult) => {
    if (!r.success) return;
    if (r.direction === 'OUT') { setStatus('completed'); setShowConfetti(true); }
    else { setStatus('working'); }
    loadBreak(); // 🆕 la reprise de pause se fait aussi par scan
    try {
      const todayData: any = await api.get('/attendance/my-today');
      const myAtt = todayData.find((a: any) => a.employeeId === employeeId);
      if (myAtt) setTodayAttendance(myAtt);
    } catch { /* silencieux */ }
  }, [employeeId, loadBreak]);

  // ── 🆕 Pause ──────────────────────────────────────────────────────────────
  const handleBreakStart = async () => {
    setBreakBusy(true);
    try {
      const st = await breakApi.start();
      setBreakInfo(st);
      addNotification({
        type: 'CHECK_IN',
        title: 'Bonne pause !',
        message: `Reprise prévue vers ${fmtHm(st.pause?.expectedEndAt)}. À la reprise, scannez ou pointez pour relancer votre journée.`,
      });
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Pause impossible', message: e?.message || 'Erreur' });
    } finally { setBreakBusy(false); }
  };

  const handleBreakEndGps = async () => {
    setBreakBusy(true);
    try {
      const pos = await captureFreshPosition();
      const lat = pos ? pos.coords.latitude  : (geoState.latitude  || undefined);
      const lng = pos ? pos.coords.longitude : (geoState.longitude || undefined);
      const acc = pos ? Math.round(pos.coords.accuracy) : (geoState.accuracy ?? undefined);
      const r = await breakApi.end(lat, lng, acc);
      addNotification({ type: 'CHECK_IN', title: 'Bon retour !', message: r?.message || 'Reprise enregistrée.' });
      await loadBreak();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Reprise impossible', message: e?.message || 'Erreur' });
    } finally { setBreakBusy(false); }
  };

  // Bouton principal : SCAN → ouvre le scanner ; GPS → flux historique (handleAction)
  const onMainAction = () => (scanMode ? setShowQr(true) : handleAction());

  // ── Overtime : OUBLI ──────────────────────────────────────────────────────
  const handleResolveForgotten = useCallback(async () => {
    if (!todayAttendance?.id) return;
    setOvertimeResolving(true);
    try {
      await api.post(`/attendance/resolve-forgotten/${todayAttendance.id}`, {});
      // ✅ 'CHECK_IN' car 'CHECK_OUT' non valide dans le type front
      addNotification({ type: 'CHECK_IN', title: 'Journée clôturée', message: "Votre journée a été fermée à l'heure officielle." });
      setTodayAttendance(prev => prev ? { ...prev, overtimeStatus: 'NONE' } : prev);
      setStatus('completed');
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Impossible de traiter la demande.' });
    } finally {
      setOvertimeResolving(false);
    }
  }, [todayAttendance, addNotification]);

  // ── Overtime : HEURES SUP ─────────────────────────────────────────────────
  const handleDeclareOvertime = useCallback(async () => {
    if (!todayAttendance?.id) return;
    setOvertimeResolving(true);
    try {
      await api.post(`/attendance/declare-overtime/${todayAttendance.id}`, {});
      addNotification({ type: 'CHECK_IN', title: 'Demande envoyée', message: 'Votre responsable va recevoir une notification pour valider vos heures sup.' });
      setTodayAttendance(prev => prev ? { ...prev, overtimeStatus: 'PENDING_APPROVAL' } : prev);
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Impossible de traiter la demande.' });
    } finally {
      setOvertimeResolving(false);
    }
  }, [todayAttendance, addNotification]);

  // ── Badge GPS ─────────────────────────────────────────────────────────────
  const getGpsBadge = () => {
    if (scanMode) {
      return isOffline
        ? { color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]', icon: <Wifi size={12} />, text: 'Hors ligne — scan indisponible' }
        : { color: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]', icon: <ScanLine size={12} />, text: 'Pointage par scan' };
    }
    // 🆕 pendant le pointage : l'app cherche seule le bon signal, l'employé n'a rien à surveiller
    if (isProcessing && gpsProgress) {
      return {
        color: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]',
        icon: <Loader2 className="animate-spin" size={12} />,
        text: gpsProgress.acc != null ? `Recherche du signal GPS… ±${gpsProgress.acc} m` : 'Recherche du signal GPS…',
      };
    }
    if (geoState.loading)         return { color: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',            icon: <Loader2 className="animate-spin" size={12} />, text: 'Recherche GPS...' };
    if (geoState.error)           return { color: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]',              icon: <Ban size={12} />,    text: 'GPS Inactif' };
    if (isOffline)                return { color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]',    icon: <Wifi size={12} />,   text: 'Mode Hors Ligne' };
    // 🆕 la précision annoncée par l'appareil est affichée : on voit tout de suite si le GPS est flou
    const accM = geoState.accuracy != null ? Math.round(geoState.accuracy) : null;
    if (accM != null && accM > 100) {
      return { color: 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]', icon: <MapPin size={12} />, text: `GPS imprécis ±${accM} m` };
    }
    return { color: 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border-[var(--border)]', icon: <MapPin size={12} />, text: accM != null ? `GPS actif ±${accM} m` : 'GPS actif' };
  };

  const badge = getGpsBadge();

  const hasOvertimeWorkflow = todayAttendance &&
    ['PENDING_EMPLOYEE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(
      todayAttendance.overtimeStatus || ''
    );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="attendance-punch-workspace">
<div className="attendance-workspace-nav"><PresenceSubNav userRole={userRole} /></div>
<AttendancePageHeader title="Ma pointeuse" description="Votre journée de travail, de l’arrivée au départ."><button onClick={() => router.back()} className="p-2 bg-[var(--surface)] border border-[var(--border)]  rounded-full hover:bg-[var(--surface-2)] transition-colors" aria-label="Retour">
          <ArrowLeft size={24} className="text-[var(--text)]" />
        </button></AttendancePageHeader>

      {/* Toast earlyArrival / slightLate */}
      {activeToast && (
        <AttendanceToast
          variant={activeToast.variant}
          title={activeToast.title}
          message={activeToast.message}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Horloge + badge GPS */}
      <div className="attendance-clock-card">


        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6 border  transition-colors duration-500 ${badge.color}`}>
          {badge.icon}{badge.text}
        </div>
        <p className="attendance-clock" aria-label="Heure actuelle">
          {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
</p>
        <p className="text-[var(--text-muted)] mt-2 text-lg capitalize">
          {currentTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {employeeName && <p className="text-[var(--success-text)] font-semibold mt-2">Bonjour, {employeeName}</p>}
      </div>

      {/* Contenu */}
      <div className="attendance-punch-controls space-y-5">

        {/* ── Carte pointage principale ──────────────────────────────────── */}
        <div className="bg-[var(--surface)]  rounded-2xl p-8 shadow-2xl border border-[var(--border)] text-center relative overflow-hidden">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] " />
            </div>
          )}

          {/* 🆕 Choix du mode : visible seulement si le pointage par scan est configuré */}
          {qrEnabled && (status === 'idle' || status === 'working') && (
            <div role="tablist" aria-label="Mode de pointage" className="mb-6 grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--surface-2)]">
              {([['SCAN', 'Scanner le QR', ScanLine], ['GPS', 'Position GPS', MapPin]] as const).map(([m, label, Icon]) => (
                <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    mode === m ? 'bg-[var(--brand)] text-[var(--on-brand)] shadow' : 'text-[var(--text-muted)] hover:text-[var(--text)]'
                  }`}>
                  <Icon size={16} /> {label}
                </button>
              ))}
            </div>
          )}

          {/* Alertes GPS */}
          {!scanMode && geoState.error && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] text-left">
              <div className="flex items-center gap-2 text-[var(--danger-text)] font-semibold mb-1"><AlertTriangle size={18} /> Erreur GPS</div>
              <p className="text-xs text-[var(--danger-text)]">{geoState.error}</p>
            </div>
          )}

          {/* 🆕 GPS flou : on dit pourquoi et quoi faire AVANT que l'employé tente de pointer */}
          {!scanMode && !geoState.error && !geoState.loading && geoState.accuracy != null && geoState.accuracy > 100 && status === 'idle' && (
            <div className="mb-6 p-3 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] text-left">
              <p className="text-xs text-[var(--warning-text)] ">
                {geoState.accuracy > 500
                  ? <>Votre téléphone partage une position approximative (±{Math.round(geoState.accuracy)} m). Activez la localisation « précise » pour ce navigateur, puis réessayez.</>
                  : <>Signal GPS faible (±{Math.round(geoState.accuracy)} m). Connectez-vous au wifi de l'entreprise, sortez à découvert ou approchez-vous d'une fenêtre : le pointage cherche tout seul le meilleur signal.</>}
              </p>
            </div>
          )}

          {isOffline && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] text-left">
              <div className="flex items-center gap-2 text-[var(--warning-text)] font-semibold mb-1"><Wifi size={18} /> Mode Hors Ligne</div>
              <p className="text-xs text-[var(--warning-text)]">
                {scanMode
                  ? 'Le scan nécessite une connexion. Passez en mode GPS pour pointer hors ligne.'
                  : 'Pointage enregistré localement, synchronisé dès le retour du réseau.'}
              </p>
            </div>
          )}

          {/* États */}
          {status === 'loading' && (
            <KonzaLoader variant="section" />
          )}

          {status === 'idle' && (
            <>
              {/* ✅ L'empreinte est maintenant cliquable et déclenche le
                  pointage elle-même (comme le bouton) — avec une animation
                  de "scan" purement visuelle : ça donne l'impression d'un
                  vrai lecteur biométrique, sans en être un. */}
              <button
                type="button"
                onClick={onMainAction}
                disabled={isProcessing || (scanMode && isOffline)}
                aria-label={scanMode ? "Scanner le QR pour pointer l'entrée" : "Pointer l'entrée"}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 transition-colors duration-300 focus:outline-none active:scale-90 disabled:cursor-not-allowed ${
                  scanAnim === 'success'
                    ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] scale-110 '
                    : scanAnim === 'error'
                    ? 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] '
                    : scanAnim === 'scanning'
                    ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)]'
                    : scanMode || isOffline || !geoState.error
                    ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] '
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                }`}
              >
                {/* Anneau de scan qui pulse vers l'extérieur */}
                {scanAnim === 'scanning' && (
                  <span className="absolute inset-0 rounded-full border-2 border-[var(--border)] " />
                )}
                {scanAnim === 'success' && (
                  <span className="absolute inset-0 rounded-full border-2 border-[var(--border)] " />
                )}

                {scanAnim === 'success' ? (
                  <CheckCircle2 size={44} strokeWidth={1.5} />
                ) : scanAnim === 'error' ? (
                  <XCircle size={44} strokeWidth={1.5} className="" />
                ) : (
                  scanMode
                    ? <ScanLine size={48} strokeWidth={1.5} />
                    : <Fingerprint size={48} strokeWidth={1.5} className={scanAnim === 'scanning' ? '' : ''} />
                )}
              </button>

              {/* ✅ Le bouton reste toujours actif : plus de blocage/forçage
                  côté client. On tente toujours le pointage, le backend est
                  seul juge (voir attendance-check.service.ts). */}
              <button
                onClick={onMainAction}
                disabled={isProcessing || (scanMode && isOffline)}
                className="w-full py-4 font-semibold rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-colors active:scale-95 bg-[var(--brand)] text-[var(--on-brand)] hover:bg-[var(--brand)] disabled:opacity-60"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : scanMode ? <ScanLine size={20} /> : <Clock size={20} />}
                {scanMode ? "Scanner pour pointer l'entrée" : isOffline ? 'Pointer (Hors Ligne)' : "Pointer l'Entrée"}
              </button>
            </>
          )}

          {status === 'working' && !hasOvertimeWorkflow && (
            <>
              <div className="w-20 h-20 bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--success-text)]  border border-[var(--border)]">
                <Clock size={32} />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-[var(--text)]">Au travail</h2>
              <p className="text-[var(--text-muted)] mb-8 text-sm">
                Débuté à{' '}
                {todayAttendance?.checkIn
                  ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : history[0]?.checkIn
                  ? new Date(history[0].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "l'instant"}
              </p>
              {breakInfo?.enabled && breakInfo.state && !['UNAVAILABLE', 'NOT_WORKING'].includes(breakInfo.state) && (
                <div className="mb-5 p-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-left">
                  {breakInfo.state === 'TOO_EARLY' && (
                    <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                      <Coffee size={14} /> Pause possible à partir de {breakInfo.startsAt}.
                    </p>
                  )}
                  {breakInfo.state === 'AVAILABLE' && (
                    <button type="button" onClick={handleBreakStart} disabled={breakBusy || isProcessing}
                      className="w-full py-3 rounded-xl bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border border-[var(--border)] text-[var(--warning-text)] font-semibold flex items-center justify-center gap-2 hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] active:scale-95 transition disabled:opacity-50">
                      {breakBusy ? <Loader2 className="animate-spin" size={18} /> : <Coffee size={18} />} Prendre ma pause
                    </button>
                  )}
                  {breakInfo.state === 'ON_BREAK' && breakInfo.pause && (
                    <>
                      <p className="text-sm font-semibold text-[var(--warning-text)] flex items-center gap-2">
                        <Coffee size={16} /> En pause depuis {fmtHm(breakInfo.pause.startedAt)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Reprise prévue à {fmtHm(breakInfo.pause.expectedEndAt)}.{' '}
                        {scanMode ? 'Scannez le QR pour reprendre.' : 'Pointez votre reprise en GPS.'}
                      </p>
                      {breakLateMin > (breakInfo.toleranceMinutes ?? 35) && (
                        <p className="text-xs font-semibold text-[var(--danger-text)] mt-2">
                           Vous avez {breakLateMin} min de retard sur la reprise prévue.
                        </p>
                      )}
                      {!scanMode && (
                        <button type="button" onClick={handleBreakEndGps} disabled={breakBusy || isProcessing}
                          className="mt-3 w-full py-3 rounded-xl bg-[var(--brand)] text-[var(--on-brand)] font-semibold flex items-center justify-center gap-2 hover:bg-[var(--brand)] active:scale-95 transition disabled:opacity-50">
                          {breakBusy ? <Loader2 className="animate-spin" size={18} /> : <Clock size={18} />} Reprendre le travail
                        </button>
                      )}
                    </>
                  )}
                  {breakInfo.state === 'DONE' && breakInfo.pause && (
                    <p className="text-xs text-[var(--text-muted)]">
                       Pause : {fmtHm(breakInfo.pause.startedAt)} → {fmtHm(breakInfo.pause.endedAt)}
                      {breakInfo.pause.minutes != null ? ` (${breakInfo.pause.minutes} min)` : ''}
                      {breakInfo.pause.resumedAuto && <span className="text-[var(--warning-text)] font-semibold"> · reprise non pointée</span>}
                      {!breakInfo.pause.resumedAuto && breakInfo.pause.lateMinutes > (breakInfo.toleranceMinutes ?? 35) && (
                        <span className="text-[var(--danger-text)] font-semibold"> · retard de {breakInfo.pause.lateMinutes} min</span>
                      )}
                    </p>
                  )}
                </div>
              )}
              <button onClick={onMainAction} disabled={isProcessing || (scanMode && isOffline)}
                className="w-full py-4 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] text-[var(--danger-text)] font-semibold rounded-2xl hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] flex justify-center items-center gap-3 transition-transform active:scale-95 disabled:opacity-60">
                {isProcessing ? <Loader2 className="animate-spin" /> : scanMode ? <ScanLine size={20} /> : <LogOut size={20} />}
                {scanMode ? (breakInfo?.state === 'ON_BREAK' ? 'Scanner pour reprendre le travail' : 'Scanner pour la sortie') : 'Fin de journée'}
              </button>
            </>
          )}

          {status === 'completed' && !hasOvertimeWorkflow && (
            <>
              <div className="w-20 h-20 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--warning-text)] border border-[var(--border)]">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-semibold mb-2 text-[var(--text)]">À demain !</h2>
              <p className="text-[var(--text-muted)] mb-8 text-sm">Votre journée est enregistrée.</p>
              <button onClick={() => router.push(bp('/presences'))}
                className="w-full py-3 bg-[var(--surface-2)] text-[var(--text)] font-semibold rounded-xl hover:bg-[var(--border)] transition-colors">
                Fermer
              </button>
            </>
          )}

          {status === 'error' && (
            <div className="py-8 text-center">
              <AlertTriangle size={32} className="text-[var(--danger-text)] mx-auto mb-3" />
              <p className="text-[var(--danger-text)] font-semibold">Impossible de charger votre profil</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-[var(--surface-2)] rounded-xl text-sm text-[var(--text)]">
                Réessayer
              </button>
            </div>
          )}

        </div>

        {/* ── 🆕 Overtime Workflow ───────────────────────────────────────── */}
        {hasOvertimeWorkflow && todayAttendance && (
          <OvertimeWorkflowCard
            attendance={todayAttendance}
            onResolveForgotten={handleResolveForgotten}
            onDeclareOvertime={handleDeclareOvertime}
            resolving={overtimeResolving}
          />
        )}

        {/* ── Historique semaine ─────────────────────────────────────────── */}
        <div className="bg-[var(--surface)]  rounded-2xl p-6 border border-[var(--border)] shadow-lg">
          <h3 className="text-xs font-semibold  text-[var(--text-muted)] mb-4 flex items-center gap-2 ">
            <History size={12} /> Cette semaine
          </h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((record, i) => {
                const date    = new Date(record.date);
                const isToday = new Date().toDateString() === date.toDateString();
                const hasOT   = record.overtime10 > 0 || record.overtime25 > 0 || record.overtime50 > 0;
                return (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isToday ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] border-[var(--border)]' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}>
                    <div>
                      <p className="font-semibold text-[var(--text)] text-sm capitalize">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex gap-3 text-xs text-[var(--text-muted)] mt-1">
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--brand)]" />
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-[var(--danger)]" />
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {record.status === 'LATE' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border border-[var(--border)] font-semibold">RETARD</span>
                      )}
                      {record.notes === 'SUSPICIOUS_LOCATION' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border border-[var(--border)] font-semibold">SUSPECT</span>
                      )}
                      {hasOT && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] text-[var(--success-text)] border border-[var(--border)] font-semibold flex items-center gap-1">
                          <Zap size={9} /> HS
                        </span>
                      )}
                      {record.overtimeStatus === 'PENDING_APPROVAL' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border border-[var(--border)] font-semibold">EN ATTENTE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-[var(--text-muted)] text-xs py-4">Historique vide.</p>
          )}
        </div>

      </div>

      {/* 🆕 Scanner QR + code secret (interface employé connectée uniquement) */}
      {showQr && <QrPunchModal onClose={() => setShowQr(false)} onDone={handleQrDone} />}
    </div>
  );
}

export default function AttendanceCheckInPage() {
  return <AttendanceModuleFrame kind="detail"><AttendanceCheckInPageContent /></AttendanceModuleFrame>;
}
