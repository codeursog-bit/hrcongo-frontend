'use client';

// 🆕 Correction de la reprise de pause par l'admin / RH — justification obligatoire
import React, { useState } from 'react';
import { X, Loader2, Coffee } from 'lucide-react';
import { breakApi, BreakInfo } from '@/services/break-api';

interface Props {
  attendanceId: string;
  pause: BreakInfo;
  employeeName?: string;
  onClose: () => void;
  onSaved: () => void;
}

const TZ_MS = 3_600_000; // Brazzaville = UTC+1

function toHHMM(iso: string | null): string {
  const d = new Date((iso ? new Date(iso).getTime() : Date.now()) + TZ_MS);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

export default function BreakCorrectionModal({ attendanceId, pause, employeeName, onClose, onSaved }: Props) {
  const [time, setTime] = useState(toHHMM(pause.endedAt));
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (reason.trim().length < 3) { setError('La justification est obligatoire.'); return; }
    // Même jour (heure de Brazzaville) que le début de la pause
    const day = new Date(new Date(pause.startedAt).getTime() + TZ_MS);
    const [h, m] = time.split(':').map(Number);
    const iso = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), h, m) - TZ_MS).toISOString();
    setSaving(true);
    try {
      await breakApi.correct(attendanceId, iso, reason.trim());
      onSaved();
    } catch (e: any) {
      setError(e?.message || 'Correction impossible.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={(e) => { e.stopPropagation(); }} role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl shadow-xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 font-bold"><Coffee size={18} /> Corriger la reprise de pause</div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {employeeName && <p className="text-sm text-[var(--text-muted)]">{employeeName}</p>}
          <p className="text-xs text-[var(--text-muted)]">
            Pause commencée à {toHHMM(pause.startedAt)}, reprise prévue à {toHHMM(pause.expectedEndAt)}.
            {pause.resumedAuto && <span className="text-amber-600 font-semibold"> La reprise n&apos;a pas été pointée.</span>}
          </p>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Heure de reprise réelle</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl font-bold" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-1.5">Justification (obligatoire)</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="Ex. : l'employé a confirmé être revenu à 13h05, le scan était en panne"
              className="w-full p-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm" />
          </div>
          {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2.5 rounded-xl border border-[var(--border)]">Annuler</button>
            <button onClick={submit} disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {saving && <Loader2 size={16} className="animate-spin" />} Enregistrer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}