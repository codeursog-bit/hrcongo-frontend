'use client';

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

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Clock, MapPin, LogOut, ArrowLeft, Loader2, CheckCircle2,
  AlertTriangle, History, Ban, Fingerprint, Wifi,
  HelpCircle, Zap, Timer,
  CheckCircle, XCircle, Info, Sparkles,
} from 'lucide-react';
import { attendanceApi } from '@/services/attendance-api';
import GeofenceRadiusPreview, { computeMetersOffset } from '@/components/GeofenceRadiusPreview';
import { api } from '@/services/api';
import { getDistanceFromLatLonInMeters } from '@/utils/geo';
import { useNotification } from '@/components/providers/NotificationProvider';
import { useAttendanceOffline } from '@/hooks/useAttendanceOffline';
import { useBasePath } from '@/hooks/useBasePath';
import PresenceSubNav from '@/components/PresenceSubNav';
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
      <div className={`backdrop-blur-xl border rounded-2xl p-4 shadow-2xl ${
        isEarly ? 'bg-emerald-900/95 border-emerald-500/40' : 'bg-amber-900/95 border-amber-500/40'
      }`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl flex-shrink-0 ${isEarly ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
            <Sparkles size={16} className={isEarly ? 'text-emerald-400' : 'text-amber-400'} />
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm ${isEarly ? 'text-emerald-200' : 'text-amber-200'}`}>{title}</p>
            <p className={`text-xs mt-1 leading-relaxed ${isEarly ? 'text-emerald-300/80' : 'text-amber-300/80'}`}>{message}</p>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 mt-0.5 ${isEarly ? 'text-emerald-500 hover:text-emerald-300' : 'text-amber-500 hover:text-amber-300'}`}>
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
      <div className="bg-amber-500/10 border border-amber-500/40 rounded-3xl p-6 space-y-5">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl flex-shrink-0">
            <HelpCircle size={20} className="text-amber-400" />
          </div>
          <div>
            <p className="font-bold text-amber-300 text-base">Toujours au bureau ?</p>
            <p className="text-amber-400/80 text-xs mt-0.5">
              Votre journée dépasse l'heure officielle.
              {attendance.pendingOvertimeHours ? ` Dépassement calculé : ${Number(attendance.pendingOvertimeHours).toFixed(1)}h.` : ''}
            </p>
          </div>
        </div>
        {attendance.checkIn && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface-2)] rounded-2xl">
            <Timer size={14} className="text-amber-500 animate-pulse" />
            <span className="text-xs text-[var(--text-muted)]">Temps total depuis l'entrée :</span>
            <span className="font-mono font-bold text-amber-300 text-sm ml-auto">{elapsed}</span>
          </div>
        )}
        <p className="text-xs text-[var(--text-muted)] text-center">Que souhaitez-vous faire ?</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onResolveForgotten} disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] rounded-2xl transition-colors active:scale-95 disabled:opacity-50">
            {resolving ? <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /> : <span className="text-2xl">😅</span>}
            <span className="text-xs font-bold text-[var(--text)] text-center leading-tight">J'avais oublié de pointer la sortie</span>
            <span className="text-[10px] text-[var(--text-muted)] text-center">→ Journée clôturée à l'heure officielle</span>
          </button>
          <button onClick={onDeclareOvertime} disabled={resolving}
            className="flex flex-col items-center gap-2 p-4 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-2xl transition-all active:scale-95 disabled:opacity-50">
            {resolving ? <Loader2 size={24} className="animate-spin text-amber-300" /> : <span className="text-2xl">💼</span>}
            <span className="text-xs font-bold text-amber-200 text-center leading-tight">Ce sont des heures supplémentaires</span>
            <span className="text-[10px] text-amber-500/70 text-center">→ Demande envoyée au responsable</span>
          </button>
        </div>
      </div>
    );
  }

  if (attendance.overtimeStatus === 'PENDING_APPROVAL') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500/20 rounded-xl flex-shrink-0">
            <Clock size={20} className="text-amber-400 animate-pulse" />
          </div>
          <div>
            <p className="font-bold text-amber-300">En attente de validation</p>
            <p className="text-amber-400/80 text-xs mt-0.5">
              Votre demande de <strong className="text-amber-300">{Number(attendance.pendingOvertimeHours || 0).toFixed(1)}h supplémentaires</strong> a été envoyée à votre responsable.
            </p>
          </div>
        </div>
        <div className="px-4 py-3 bg-[var(--surface-2)] rounded-2xl text-xs text-[var(--text-muted)] flex items-center gap-2">
          <Info size={13} className="text-amber-400 flex-shrink-0" />
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
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-5 flex items-center gap-3">
        <CheckCircle size={22} className="text-emerald-400 flex-shrink-0" />
        <div>
          <p className="font-bold text-emerald-300 text-sm">Heures supplémentaires validées ✅</p>
          <p className="text-xs text-emerald-400/70 mt-0.5">
            Vos {Number(attendance.pendingOvertimeHours || 0).toFixed(1)}h seront comptabilisées sur votre bulletin.
          </p>
        </div>
      </div>
    );
  }

  if (attendance.overtimeStatus === 'REJECTED') {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-3xl p-5 flex items-center gap-3">
        <XCircle size={22} className="text-red-400 flex-shrink-0" />
        <div>
          <p className="font-bold text-red-300 text-sm">Heures supplémentaires non validées</p>
          <p className="text-xs text-red-400/70 mt-0.5">Votre journée a été clôturée à l'heure officielle.</p>
        </div>
      </div>
    );
  }

  return null;
}

// ─── Page principale ──────────────────────────────────────────────────────────
// ✅ Messages encourageants, tirés au sort par palier de distance —
// affichés dans le radar pendant que l'employé se rapproche de la zone.
// Purement cosmétique/motivant, aucun impact sur la décision d'autorisation
// (qui reste entièrement gérée par le backend).
// ✅ Au-delà de ce dépassement (en mètres, par rapport au rayon autorisé),
// le radar + les messages motivants n'ont plus de sens : ce n'est plus "un
// petit effort pour se rapprocher", c'est un vrai trajet — voire le signe
// que l'employé n'est simplement pas au bon endroit. 100m ≈ 1-2 minutes de
// marche, la limite raisonnable d'un "rapprochement".
const RADAR_MAX_OVERSHOOT_METERS = 100;

const MOTIVATION_FAR: Array<(d: number) => string> = [
  (d) => `Encore ${d}m à parcourir — vous y êtes presque 💪`,
  (d) => `Continuez, plus que ${d}m avant la zone !`,
  (d) => `Allez, encore un effort : ${d}m et c'est bon 🚶`,
  (d) => `${d}m restants — vous progressez bien !`,
];
const MOTIVATION_CLOSE: Array<(d: number) => string> = [
  (d) => `Presque arrivé ! Plus que ${d}m 🚀`,
  (d) => `Vous chauffez, ${d}m et vous y êtes !`,
  (d) => `Dernier effort : ${d}m à peine 👏`,
  (d) => `Ça y est presque — ${d}m seulement !`,
];

export default function AttendanceCheckInPage() {
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
  // ✅ Animation du scan biométrique (purement visuel, ne simule aucune
  // vraie biométrie — juste un retour visuel satisfaisant au clic)
  const [scanAnim, setScanAnim] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  // ✅ Depuis quand on est "mal" positionné (hors zone / signal faible) —
  // sert à décider quand afficher le petit bouton d'actualisation manuelle
  const [badSince, setBadSince] = useState<number | null>(null);
  // ✅ Panneau "Ma position" — une aide optionnelle : fermé par défaut,
  // visible uniquement quand l'employé clique dessus, et il le referme
  // lui-même. Se replie aussi tout seul dès qu'on entre dans la zone
  // (feedback positif immédiat) ou si on s'éloigne trop (le radar n'aide
  // plus dans ce cas).
  const [showRadar, setShowRadar] = useState(false);
  useEffect(() => {
    if (geoState.allowed && showRadar) setShowRadar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoState.allowed]);

  // ✅ Position dédiée au radar — même pattern que "Tester en marchant" côté
  // paramètres : un watchPosition qui ne tourne QUE pendant que le panneau
  // est ouvert, indépendant du geoState partagé avec le badge principal.
  // C'est ça qui corrige "ma position ne bouge pas dans le radar".
  const [radarOffset, setRadarOffset] = useState<{ east: number; north: number } | null>(null);
  useEffect(() => {
    if (!showRadar) { setRadarOffset(null); return; }
    if (!navigator.geolocation) return;
    if (!companySettings?.latitude || !companySettings?.longitude) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setRadarOffset(
          computeMetersOffset(
            companySettings.latitude, companySettings.longitude,
            pos.coords.latitude, pos.coords.longitude,
          ),
        );
      },
      () => { /* silencieux : le texte-guide reste affiché avec la dernière position connue */ },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 1000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRadar, companySettings?.latitude, companySettings?.longitude]);

  // ✅ Boussole (cap du téléphone) — même principe : active uniquement
  // pendant que le radar est ouvert. Sur iOS 13+, la permission doit être
  // demandée suite à un geste utilisateur direct (voir handleOpenRadar
  // ci-dessous) ; sans elle ou sur un appareil sans capteur, deviceHeading
  // reste null et le composant retombe simplement sur le texte directionnel.
  const [deviceHeading, setDeviceHeading] = useState<number | null>(null);
  useEffect(() => {
    if (!showRadar) { setDeviceHeading(null); return; }
    if (typeof window === 'undefined' || !('DeviceOrientationEvent' in window)) return;

    const handleOrientation = (e: any) => {
      let heading: number | null = null;
      if (typeof e.webkitCompassHeading === 'number') {
        heading = e.webkitCompassHeading; // iOS Safari : cap déjà correct (0 = Nord)
      } else if (e.absolute && typeof e.alpha === 'number') {
        heading = (360 - e.alpha) % 360; // Android/Chrome via l'événement "absolute"
      }
      if (heading != null && Number.isFinite(heading)) setDeviceHeading(heading);
    };

    const useAbsolute = 'ondeviceorientationabsolute' in window;
    const eventName = useAbsolute ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(eventName, handleOrientation as any);

    return () => window.removeEventListener(eventName, handleOrientation as any);
  }, [showRadar]);

  // ✅ Ouverture du radar : sur iOS 13+, la permission d'accès aux capteurs
  // d'orientation DOIT être demandée depuis un geste utilisateur direct
  // (un clic) — impossible de la déclencher depuis un useEffect. D'où ce
  // handler dédié plutôt qu'un simple setShowRadar(true) inline.
  const handleOpenRadar = useCallback(async () => {
    try {
      const DOE: any = (window as any).DeviceOrientationEvent;
      if (DOE && typeof DOE.requestPermission === 'function') {
        await DOE.requestPermission(); // ignoré si refusé — deviceHeading restera simplement null
      }
    } catch { /* pas de boussole dispo, le texte directionnel suffit */ }
    setShowRadar(true);
  }, []);
  useEffect(() => {
    const allowedRadius = companySettings?.allowedRadius || 100;
    const overshoot = Math.max(0, (geoState.distance ?? 0) - allowedRadius);
    if (showRadar && overshoot > RADAR_MAX_OVERSHOOT_METERS) setShowRadar(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoState.distance, showRadar]);

  // ✅ Message encourageant, mis à jour par palier de ~8m plutôt qu'à
  // chaque relevé GPS (sinon ça clignoterait avec le bruit naturel du GPS).
  const [motivMsg, setMotivMsg] = useState<string | null>(null);
  const motivBucketRef = useRef<number | null>(null);
  useEffect(() => {
    if (!showRadar || geoState.allowed || status !== 'idle') {
      motivBucketRef.current = null;
      return;
    }
    const allowedRadius = companySettings?.allowedRadius || 100;
    const overshoot = Math.max(0, (geoState.distance ?? 0) - allowedRadius);
    const bucket = Math.floor(overshoot / 8);
    if (bucket !== motivBucketRef.current) {
      motivBucketRef.current = bucket;
      const pool = overshoot <= 15 ? MOTIVATION_CLOSE : MOTIVATION_FAR;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      setMotivMsg(pick(Math.round(overshoot)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showRadar, geoState.distance, geoState.allowed, status]);

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

        const todayData: any = await attendanceApi.getToday();
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

  // ── Horloge ───────────────────────────────────────────────────────────────
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── GPS Watch ─────────────────────────────────────────────────────────────
  const handlePositionSuccessRef = React.useRef<(pos: GeolocationPosition) => void>();

  useEffect(() => {
    if (!companySettings) return;

    const handlePositionSuccess = (pos: GeolocationPosition) => {
      const { latitude: uLat, longitude: uLng, accuracy } = pos.coords;
      const cLat   = companySettings.latitude;
      const cLng   = companySettings.longitude;
      const radius = companySettings.allowedRadius || 100;
      let isAllowed = false;
      let dist = 0;
      if (!cLat || !cLng) {
        isAllowed = true;
      } else {
        dist      = getDistanceFromLatLonInMeters(uLat, uLng, cLat, cLng);
        isAllowed = dist <= radius;
      }
      setGeoState({
        allowed: isAllowed, distance: Math.round(dist), accuracy: Math.round(accuracy),
        latitude: uLat, longitude: uLng, error: null, loading: false,
        isMockedSuspect: accuracy > 100,
      });
      // Suivi du temps passé "hors zone" pour le bouton d'actualisation manuelle
      setBadSince(prev => {
        const isBad = !isAllowed && accuracy <= 100;
        if (isBad) return prev ?? Date.now();
        return null;
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
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 },
      );
    }, 4000);

    return () => {
      navigator.geolocation.clearWatch(watchId);
      clearInterval(pollId);
    };
  }, [companySettings]);

  // ✅ Actualisation manuelle (bouton) : relit la position tout de suite,
  // sans attendre le prochain sondage automatique.
  const handleManualRefresh = useCallback(() => {
    if (!handlePositionSuccessRef.current) return;
    setGeoState(p => ({ ...p, loading: true }));
    navigator.geolocation.getCurrentPosition(
      (pos) => handlePositionSuccessRef.current?.(pos),
      () => setGeoState(p => ({ ...p, loading: false })),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  }, []);

  // ✅ Capture une position 100% fraîche, exactement à l'instant du clic sur
  // "Pointer" — plutôt que de réutiliser la dernière valeur en mémoire
  // (potentiellement vieille de quelques secondes à cause du sondage
  // périodique). C'est CETTE position, capturée à l'instant T du clic, qui
  // est envoyée au backend juste après.
  const captureFreshPosition = (): Promise<GeolocationPosition | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) { resolve(null); return; }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null), // échec de capture → on retombera sur le dernier relevé connu
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 },
      );
    });
  };

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
    if (freshPos) handlePositionSuccessRef.current?.(freshPos); // le badge reste synchronisé avec ce qui est envoyé

    let scanOutcome: 'success' | 'error' = 'success';
    try {
      if (status === 'idle') {
        // ── CHECK-IN ────────────────────────────────────────────────────────
        const result = await offlineCheckIn({
          employeeId,
          latitude:  sendLat,
          longitude: sendLng,
        });

        if (result.success) {
          setStatus('working');

          // ✅ Cast any pour accéder aux champs optionnels du backend
          const data = (result as any);

          if (data.earlyArrival) {
            // Toast arrivée anticipée
            setActiveToast({
              variant: 'early',
              title:   data.earlyArrivalTitle   || '☀️ Arrivée anticipée notée !',
              message: data.earlyArrivalMessage || '',
            });
          } else if (data.slightLate) {
            // ✅ Toast petit retard (était absent avant)
            setActiveToast({
              variant: 'slight-late',
              title:   data.slightLateTitle   || '😅 Un tout petit retard !',
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
            const todayData: any = await attendanceApi.getToday();
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
          // ✅ Si le refus est lié à la position ET que la distance reste
          // raisonnable, on enchaîne directement sur le radar. Au-delà du
          // seuil "trop loin", ouvrir le radar n'aiderait pas.
          const errCode = (result as any)?.code;
          const errDistance = (result as any)?.data?.distance;
          const allowedRadius = companySettings?.allowedRadius || 100;
          const withinRadarRange =
            errDistance == null || (errDistance - allowedRadius) <= RADAR_MAX_OVERSHOOT_METERS;
          if ((errCode === 'OUT_OF_GEOFENCE' || errCode === 'LOCATION_REQUIRED') && withinRadarRange) {
            setShowRadar(true);
          }
        }

      } else {
        // ── CHECK-OUT ────────────────────────────────────────────────────────
        await attendanceApi.checkOut({
          employeeId,
          latitude:  sendLat,
          longitude: sendLng,
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
    if (geoState.loading)         return { color: 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)]',            icon: <Loader2 className="animate-spin" size={12} />, text: 'Recherche GPS...' };
    if (geoState.error)           return { color: 'bg-red-500/15 text-red-500 border-red-500/30',              icon: <Ban size={12} />,    text: 'GPS Inactif' };
    if (isOffline)                return { color: 'bg-amber-500/15 text-amber-500 border-amber-500/30',    icon: <Wifi size={12} />,   text: 'Mode Hors Ligne' };
    if (geoState.allowed)         return { color: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30', icon: <MapPin size={12} />, text: `Zone OK (${geoState.distance}m)` };
    if (geoState.isMockedSuspect) return { color: 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30',    icon: <Wifi size={12} />,   text: `Signal Faible (${geoState.accuracy}m)` };
    return                               { color: 'bg-red-500/15 text-red-500 border-red-500/30',              icon: <Ban size={12} />,    text: `Hors Zone (${geoState.distance}m)` };
  };

  const badge = getGpsBadge();

  const hasOvertimeWorkflow = todayAttendance &&
    ['PENDING_EMPLOYEE', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'].includes(
      todayAttendance.overtimeStatus || ''
    );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-20 relative overflow-hidden flex flex-col items-center bg-[var(--bg)] text-[var(--text)]">

      {/* Toast earlyArrival / slightLate */}
      {activeToast && (
        <AttendanceToast
          variant={activeToast.variant}
          title={activeToast.title}
          message={activeToast.message}
          onClose={() => setActiveToast(null)}
        />
      )}

      {/* Fond animé */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-emerald-500/20 rounded-full animate-[ping_3s_linear_infinite]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-emerald-500/30 rounded-full" />
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/50 to-[var(--bg)]" />
      </div>

      {/* Bouton retour */}
      <div className="absolute top-4 left-4 z-20">
        <button onClick={() => router.back()} className="p-2 bg-[var(--surface)] border border-[var(--border)] backdrop-blur-md rounded-full hover:bg-[var(--surface-2)] transition-colors">
          <ArrowLeft size={24} className="text-[var(--text)]" />
        </button>
      </div>

      {/* Horloge + badge GPS */}
      <div className="w-full pt-12 pb-4 text-center relative z-10">
        <div className="max-w-md mx-auto px-4 mb-6 text-left">
          <PresenceSubNav userRole={userRole} />
        </div>

        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold mb-6 border backdrop-blur-md transition-colors duration-500 ${badge.color}`}>
          {badge.icon}{badge.text}
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tight font-mono tabular-nums text-[var(--text)]">
          {currentTime ? currentTime.toLocaleTimeString('fr-FR') : '--:--:--'}
        </h1>
        <p className="text-[var(--text-muted)] mt-2 text-lg capitalize">
          {currentTime?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        {employeeName && <p className="text-emerald-500 font-bold mt-2">Bonjour, {employeeName}</p>}
      </div>

      {/* Contenu */}
      <div className="w-full max-w-md px-4 relative z-10 space-y-4">

        {/* ── Carte pointage principale ──────────────────────────────────── */}
        <div className="bg-[var(--surface)] backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-[var(--border)] text-center relative overflow-hidden">
          {showConfetti && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="w-full h-full bg-emerald-500/10 animate-pulse" />
            </div>
          )}

          {/* Alertes GPS */}
          {geoState.error && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <div className="flex items-center gap-2 text-red-500 font-bold mb-1"><AlertTriangle size={18} /> Erreur GPS</div>
              <p className="text-xs text-red-500">{geoState.error}</p>
            </div>
          )}

          {/* ℹ️ Purement informatif : le bouton reste actif, c'est le
              backend qui accepte ou rejette réellement le pointage. */}
          {!geoState.loading && !geoState.error && !geoState.allowed && !geoState.isMockedSuspect && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left">
              <div className="flex items-center gap-2 text-red-500 font-bold mb-1"><Ban size={18} /> Hors zone (probable)</div>
              <p className="text-xs text-red-500/90">
                Vous semblez à <strong>{geoState.distance}m</strong> du bureau. Zone autorisée : {companySettings?.allowedRadius || 100}m. Vous pouvez essayer de pointer, le serveur vérifiera votre position.
              </p>
            </div>
          )}

          {!geoState.loading && !geoState.error && !geoState.allowed && geoState.isMockedSuspect && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-left">
              <div className="flex items-center gap-2 text-yellow-500 font-bold mb-1"><Wifi size={18} /> Signal Faible</div>
              <p className="text-xs text-yellow-500/90">
                Position imprécise ({geoState.accuracy}m). Le serveur tranchera au moment du pointage.
              </p>
            </div>
          )}

          {isOffline && status === 'idle' && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left">
              <div className="flex items-center gap-2 text-amber-500 font-bold mb-1"><Wifi size={18} /> Mode Hors Ligne</div>
              <p className="text-xs text-amber-500/90">Pointage enregistré localement, synchronisé dès le retour du réseau.</p>
            </div>
          )}

          {/* États */}
          {status === 'loading' && (
            <div className="py-10"><Loader2 className="animate-spin mx-auto text-emerald-500" size={32} /></div>
          )}

          {status === 'idle' && (
            <>
              {/* ✅ L'empreinte est maintenant cliquable et déclenche le
                  pointage elle-même (comme le bouton) — avec une animation
                  de "scan" purement visuelle : ça donne l'impression d'un
                  vrai lecteur biométrique, sans en être un. */}
              <button
                type="button"
                onClick={handleAction}
                disabled={isProcessing || geoState.loading}
                aria-label="Pointer l'entrée"
                className={`relative w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 transition-all duration-300 focus:outline-none active:scale-90 disabled:cursor-not-allowed ${
                  scanAnim === 'success'
                    ? 'bg-emerald-500/30 text-emerald-300 scale-110 shadow-[0_0_40px_rgba(16,185,129,0.5)]'
                    : scanAnim === 'error'
                    ? 'bg-red-500/30 text-red-300 shadow-[0_0_30px_rgba(239,68,68,0.4)]'
                    : scanAnim === 'scanning'
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : geoState.allowed || isOffline
                    ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]'
                    : geoState.isMockedSuspect ? 'bg-yellow-500/20 text-yellow-400'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
                }`}
              >
                {/* Anneau de scan qui pulse vers l'extérieur */}
                {scanAnim === 'scanning' && (
                  <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping" />
                )}
                {scanAnim === 'success' && (
                  <span className="absolute inset-0 rounded-full border-2 border-emerald-400 animate-ping" />
                )}

                {scanAnim === 'success' ? (
                  <CheckCircle2 size={44} strokeWidth={1.5} />
                ) : scanAnim === 'error' ? (
                  <XCircle size={44} strokeWidth={1.5} className="animate-pulse" />
                ) : (
                  <Fingerprint size={48} strokeWidth={1.5} className={scanAnim === 'scanning' ? 'animate-pulse' : ''} />
                )}
              </button>

              {/* ✅ "Où suis-je ?" : radar inline, seulement dans une plage
                  "raisonnable" de dépassement (≤ RADAR_MAX_OVERSHOOT_METERS).
                  Au-delà, un simple message informatif sans radar ni ton
                  motivant — ça n'aurait pas de sens de dire "encore un
                  effort !" à quelqu'un à 800m du bureau. */}
              {(() => {
                const allowedRadius = companySettings?.allowedRadius || 100;
                const overshoot = Math.max(0, (geoState.distance ?? 0) - allowedRadius);
                const isTooFar = overshoot > RADAR_MAX_OVERSHOOT_METERS;
                const showRadarButton =
                  status === 'idle' && !geoState.allowed && !geoState.error && !isTooFar;

                // Trop loin : message sobre, pas de radar/ton motivant
                if (status === 'idle' && !geoState.allowed && !geoState.error && isTooFar) {
                  return (
                    <div className="mb-6 -mt-2 text-center">
                      <p className="text-xs text-[var(--text-muted)]">
                        Vous semblez loin de la zone autorisée (~{Math.round(geoState.distance ?? 0)}m).
                        Si vous pensez être au bon endroit, contactez votre RH — sinon, le pointage manuel reste disponible.
                      </p>
                    </div>
                  );
                }

                if (!showRadarButton && !showRadar) return null;

                return (
                  <div className="mb-6 -mt-2">
                    {!showRadar ? (
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleOpenRadar}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                        >
                          <MapPin size={14} /> Ma position par rapport à la zone
                        </button>
                      </div>
                    ) : (
                      <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border)]">
                        <GeofenceRadiusPreview
                          radius={allowedRadius}
                          showReliabilityMessage={false}
                          userOffset={radarOffset}
                          deviceHeading={deviceHeading}
                        />
                        {/* ✅ Message encourageant — purement motivant, sans
                            aucun rôle dans la décision d'autorisation */}
                        {motivMsg && (
                          <p className="mt-3 text-center text-sm font-medium text-emerald-500 animate-pulse">
                            {motivMsg}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowRadar(false)}
                          className="mt-2 w-full text-center text-[11px] text-[var(--text-muted)] hover:text-[var(--text)]"
                        >
                          Fermer
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* ✅ Bouton d'actualisation manuelle : discret, n'apparaît QUE
                  si on est mal positionné depuis un moment (pas au premier
                  instant — laisser le sondage automatique faire son travail
                  d'abord, ~12s), pour ne pas encombrer l'écran inutilement. */}
              {badSince && currentTime && (currentTime.getTime() - badSince > 12000) && status === 'idle' && (
                <div className="mb-6 -mt-4 text-center">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    {geoState.allowed ? '' : `Vous semblez hors zone ou un peu loin (${geoState.distance}m).`}
                  </p>
                  <button
                    type="button"
                    onClick={handleManualRefresh}
                    disabled={geoState.loading}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--surface-2)] text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors disabled:opacity-50"
                  >
                    {geoState.loading ? <Loader2 size={14} className="animate-spin" /> : <MapPin size={14} />}
                    Actualiser ma position
                  </button>
                </div>
              )}

              {/* ✅ Le bouton reste toujours actif : plus de blocage/forçage
                  côté client. On tente toujours le pointage, le backend est
                  seul juge (voir attendance-check.service.ts). */}
              <button
                onClick={handleAction}
                disabled={isProcessing || geoState.loading}
                className="w-full py-4 font-bold rounded-2xl shadow-lg flex justify-center items-center gap-3 transition-all active:scale-95 bg-emerald-500 text-white hover:bg-emerald-600"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Clock size={20} />}
                {isOffline ? 'Pointer (Hors Ligne)' : "Pointer l'Entrée"}
              </button>
            </>
          )}

          {status === 'working' && !hasOvertimeWorkflow && (
            <>
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400 animate-pulse border border-emerald-500/30">
                <Clock size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">Au travail</h2>
              <p className="text-[var(--text-muted)] mb-8 text-sm">
                Débuté à{' '}
                {todayAttendance?.checkIn
                  ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : history[0]?.checkIn
                  ? new Date(history[0].checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : "l'instant"}
              </p>
              <button onClick={handleAction} disabled={isProcessing}
                className="w-full py-4 bg-red-500/10 border border-red-500/50 text-red-400 font-bold rounded-2xl hover:bg-red-500/20 flex justify-center items-center gap-3 transition-transform active:scale-95">
                {isProcessing ? <Loader2 className="animate-spin" /> : <LogOut size={20} />}
                Fin de journée
              </button>
            </>
          )}

          {status === 'completed' && !hasOvertimeWorkflow && (
            <>
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-amber-400 border border-amber-500/30">
                <CheckCircle2 size={32} />
              </div>
              <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">À demain !</h2>
              <p className="text-[var(--text-muted)] mb-8 text-sm">Votre journée est enregistrée.</p>
              <button onClick={() => router.push(bp('/presences'))}
                className="w-full py-3 bg-[var(--surface-2)] text-[var(--text)] font-bold rounded-xl hover:bg-[var(--border)] transition-colors">
                Fermer
              </button>
            </>
          )}

          {status === 'error' && (
            <div className="py-8 text-center">
              <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
              <p className="text-red-500 font-bold">Impossible de charger votre profil</p>
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
        <div className="bg-[var(--surface)] backdrop-blur-md rounded-2xl p-6 border border-[var(--border)] shadow-lg">
          <h3 className="text-xs font-bold uppercase text-[var(--text-muted)] mb-4 flex items-center gap-2 tracking-widest">
            <History size={12} /> Cette semaine
          </h3>
          {history.length > 0 ? (
            <div className="space-y-3">
              {history.map((record, i) => {
                const date    = new Date(record.date);
                const isToday = new Date().toDateString() === date.toDateString();
                const hasOT   = record.overtime10 > 0 || record.overtime25 > 0 || record.overtime50 > 0;
                return (
                  <div key={i} className={`flex justify-between items-center p-3 rounded-xl border ${isToday ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-[var(--surface-2)] border-[var(--border)]'}`}>
                    <div>
                      <p className="font-bold text-[var(--text)] text-sm capitalize">
                        {date.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })}
                      </p>
                      <div className="flex gap-3 text-xs text-[var(--text-muted)] mt-1">
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                        <span className="flex items-center gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      {record.status === 'LATE' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">RETARD</span>
                      )}
                      {record.notes === 'SUSPICIOUS_LOCATION' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 font-bold">SUSPECT</span>
                      )}
                      {hasOT && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1">
                          <Zap size={9} /> HS
                        </span>
                      )}
                      {record.overtimeStatus === 'PENDING_APPROVAL' && (
                        <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 font-bold">EN ATTENTE</span>
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
    </div>
  );
}