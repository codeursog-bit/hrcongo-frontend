'use client';

// ============================================================================
// 📁 components/loans/LoansExportDialog.tsx
// Fenêtre « Télécharger l'Excel » du dashboard Prêts · Avances :
// période (mois / plage / année) + (portefeuille) toutes les entreprises ou une seule.
// ============================================================================

import React, { useEffect, useState } from 'react';
import { Download, Loader2, X, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';
import { WorkforcePeriodPicker } from '@/components/workforce/WorkforcePeriodPicker';
import { WfPeriodState, WfScopeMode, monthsCount, periodLabel } from '@/lib/workforce';
import { loansEndpoint, loansFileName } from '@/lib/loans-dashboard';

interface Props {
  open: boolean;
  onClose: () => void;
  scope: WfScopeMode;
  initialPeriod: WfPeriodState;
  companyId?: string;
  companies?: { id: string; name: string }[];
  initialCompanies?: string;
  companyLabel: string;
}

export function LoansExportDialog({ open, onClose, scope, initialPeriod, companyId, companies = [], initialCompanies = 'ALL', companyLabel }: Props) {
  const [period, setPeriod] = useState<WfPeriodState>(initialPeriod);
  const [which, setWhich] = useState<'ALL' | 'ONE'>(initialCompanies === 'ALL' ? 'ALL' : 'ONE');
  const [oneId, setOneId] = useState<string>(initialCompanies !== 'ALL' ? initialCompanies : companies[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPeriod(initialPeriod);
      setError(null);
      setWhich(initialCompanies === 'ALL' ? 'ALL' : 'ONE');
      if (initialCompanies !== 'ALL') setOneId(initialCompanies);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    if (!oneId && companies.length) setOneId(companies[0].id);
  }, [companies, oneId]);

  if (!open) return null;

  const n = monthsCount(period);
  const invalid = n === 0 || n > 24;
  const selected = which === 'ALL' ? 'ALL' : oneId;
  const fileLabel = scope === 'PORTFOLIO' ? (which === 'ALL' ? 'Konza RH' : companies.find((c) => c.id === oneId)?.name ?? 'Entreprise') : companyLabel;

  const download = async () => {
    setBusy(true);
    setError(null);
    try {
      const blob = await api.getBlob(loansEndpoint(scope, 'export', period, { companies: selected, companyId }));
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = loansFileName(period, fileLabel);
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 4000);
      window.dispatchEvent(new CustomEvent('toast:success', { detail: { message: 'Fichier Excel téléchargé' } }));
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Impossible de générer le fichier.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-xl rounded-2xl bg-[var(--surface)] border border-[var(--border)] shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="flex items-start justify-between gap-4 p-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center">
              <FileSpreadsheet className="text-emerald-500" size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">Télécharger le tableau de bord prêts & avances</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">Choisissez la période : synthèse, évolution mensuelle, prêts, avances, remboursements et encours.</p>
            </div>
          </div>
          <button onClick={() => !busy && onClose()} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 pb-2 space-y-5">
          {scope === 'PORTFOLIO' && (
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Entreprises</p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="inline-flex p-1 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  {([['ALL', `Toutes (${companies.length})`], ['ONE', 'Une seule']] as const).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setWhich(id)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${which === id ? 'bg-emerald-500 text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text)]'}`}>
                      {label}
                    </button>
                  ))}
                </div>
                {which === 'ONE' && (
                  <div className="w-64">
                    <FancySelect label="Entreprise" value={oneId} onChange={setOneId} options={companies.map((c) => ({ value: c.id, label: c.name }))} />
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Période</p>
            <WorkforcePeriodPicker value={period} onChange={setPeriod} />
          </div>

          <div className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)]">
            <strong>{periodLabel(period)}</strong>
            <span className="text-[var(--text-muted)]"> — {invalid ? (n === 0 ? 'période invalide (début après la fin ou mois futur).' : 'maximum 24 mois par fichier.') : '6 onglets : synthèse, évolution, prêts, avances, remboursements, encours (avec formules et graphiques).'}</span>
          </div>

          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 px-4 py-3 text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 pt-4">
          <button onClick={onClose} disabled={busy} className="px-5 py-2.5 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold hover:bg-[var(--surface-2)] disabled:opacity-50">Annuler</button>
          <button onClick={download} disabled={busy || invalid || (scope === 'PORTFOLIO' && which === 'ONE' && !oneId)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold flex items-center gap-2 disabled:opacity-60">
            {busy ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            {busy ? 'Génération…' : 'Télécharger'}
          </button>
        </div>
      </div>
    </div>
  );
}