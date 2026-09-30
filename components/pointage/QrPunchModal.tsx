'use client';

// ============================================================================
// 📁 components/pointage/QrPunchModal.tsx
// Scan du QR de l'écran, UNIQUEMENT depuis l'interface employé connectée
// (« Ma pointeuse »). Le scan appelle POST /pointage-qr/scan avec le JWT de
// l'employé : aucune route publique. Le scan bascule tout seul :
// pas encore d'entrée aujourd'hui → ENTRÉE, sinon → SORTIE.
// Le GPS n'est PAS utilisé : l'écran est fixe, le scan est la preuve.
// ============================================================================
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { CheckCircle2, LogOut, AlertTriangle, Loader2, X, ScanLine, ShieldX } from 'lucide-react';
import { employeeQrApi, PunchResult } from '@/services/display-screen-api';

const REGION_ID = 'employee-qr-region';
const PREFIX = 'KONZA1.';

type Phase = 'scanning' | 'sending' | 'done' | 'confirm' | 'error';

interface Props {
  onClose: () => void;
  /** Appelé après un pointage réussi (entrée OU sortie) pour rafraîchir la page parente. */
  onDone: (result: PunchResult) => void;
}

export default function QrPunchModal({ onClose, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('scanning');
  const [result, setResult] = useState<PunchResult | null>(null);
  const [error, setError] = useState<{ message: string; code?: string }>({ message: '' });
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const tokenRef = useRef('');

  const stopScanner = useCallback(async () => {
    const s = scannerRef.current;
    scannerRef.current = null;
    if (!s) return;
    try { await s.stop(); } catch { /* déjà arrêté */ }
    try { s.clear(); } catch { /* noop */ }
  }, []);

  const send = useCallback(async (token: string, confirm?: boolean) => {
    setPhase('sending');
    try {
      const res = await employeeQrApi.scan({ token, confirm: confirm || undefined });
      if (res.requiresConfirmation) { setResult(res); setPhase('confirm'); return; }
      if (!res.success) { setError({ message: res.message || 'Pointage impossible.', code: res.code }); setPhase('error'); return; }
      setResult(res); setPhase('done'); onDone(res);
    } catch (e: any) {
      // Le backend renvoie le message prêt à afficher, ex. « Vous ne faites pas partie de cette entreprise »
      setError({ message: e?.message || 'Pointage impossible.', code: e?.code });
      setPhase('error');
    }
  }, [onDone]);

  const handleDecoded = useCallback(async (text: string) => {
    if (handledRef.current || !text.startsWith(PREFIX)) return;   // QR étranger : ignoré
    handledRef.current = true;
    tokenRef.current = text.slice(PREFIX.length);
    await stopScanner();
    send(tokenRef.current);
  }, [send, stopScanner]);

  const startScanner = useCallback(async () => {
    handledRef.current = false;
    setError({ message: '' }); setResult(null); setPhase('scanning');
    try {
      const scanner = new Html5Qrcode(REGION_ID, { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: (w, h) => { const s = Math.floor(Math.min(w, h) * 0.75); return { width: s, height: s }; } },
        handleDecoded, () => { /* frames sans QR */ },
      );
    } catch {
      setError({ message: 'Caméra inaccessible. Autorisez la caméra dans votre navigateur puis réessayez.', code: 'CAMERA' });
      setPhase('error');
    }
  }, [handleDecoded]);

  useEffect(() => { startScanner(); return () => { stopScanner(); }; }, [startScanner, stopScanner]);

  const isIn = result?.direction !== 'OUT';
  const notMine = error.code === 'NOT_IN_COMPANY';
  const canRetry = error.code !== 'ALREADY_DONE';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Scanner le QR de pointage">
      <div className="w-full sm:max-w-md bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[100dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 font-bold"><ScanLine size={18} /> Scanner le QR de l&apos;écran</div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div id={REGION_ID} className={phase === 'scanning' ? 'w-full aspect-square rounded-2xl overflow-hidden bg-black' : 'hidden'} />
          {phase === 'scanning' && (
            <p className="mt-4 text-sm text-center text-[var(--text-muted)]">
              Cadrez le QR affiché sur la tablette. Il change toutes les 30 secondes : scannez-le sur place.
            </p>
          )}

          {phase === 'sending' && (
            <div className="py-16 flex flex-col items-center gap-3 text-[var(--text-muted)]">
              <Loader2 className="animate-spin" size={32} /> Vérification du pointage…
            </div>
          )}

          {phase === 'confirm' && result && (
            <div className="py-8 flex flex-col items-center text-center gap-3">
              <div className="w-16 h-16 rounded-full grid place-items-center bg-amber-500/15 text-amber-500"><AlertTriangle size={34} /></div>
              <h3 className="text-lg font-extrabold">{result.reason || 'Confirmation requise'}</h3>
              <p className="text-sm text-[var(--text-muted)]">{result.message}</p>
              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="px-5 py-3 rounded-xl border border-[var(--border)]">Annuler</button>
                <button onClick={() => send(tokenRef.current, true)} className="px-5 py-3 rounded-xl bg-[var(--brand)] text-white font-semibold">Je confirme</button>
              </div>
            </div>
          )}

          {phase === 'done' && result && (
            <div className="py-10 flex flex-col items-center text-center gap-3">
              <div className={`w-20 h-20 rounded-full grid place-items-center ${isIn ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
                {isIn ? <CheckCircle2 size={44} /> : <LogOut size={40} />}
              </div>
              <h3 className="text-xl font-extrabold">
                {isIn ? 'Entrée enregistrée' : 'Sortie enregistrée'}{result.firstName ? `, ${result.firstName}` : ''} !
              </h3>
              {result.message && <p className="text-sm text-[var(--text-muted)]">{result.message}</p>}
              <button onClick={onClose} className="mt-2 px-6 py-3 rounded-xl bg-[var(--brand)] text-white font-semibold">Terminer</button>
            </div>
          )}

          {phase === 'error' && (
            <div className="py-10 flex flex-col items-center text-center gap-3">
              <div className={`w-16 h-16 rounded-full grid place-items-center ${notMine ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'}`}>
                {notMine ? <ShieldX size={34} /> : <AlertTriangle size={34} />}
              </div>
              <p className="font-semibold">{error.message}</p>
              <div className="flex gap-3 mt-2">
                <button onClick={onClose} className="px-5 py-3 rounded-xl border border-[var(--border)]">Fermer</button>
                {canRetry && !notMine && (
                  <button onClick={startScanner} className="px-5 py-3 rounded-xl bg-[var(--brand)] text-white font-semibold">Rescanner</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}