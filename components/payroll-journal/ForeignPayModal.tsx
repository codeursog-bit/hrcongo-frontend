'use client';

// ============================================================================
// 📁 components/payroll-journal/ForeignPayModal.tsx
// ✅ Saisie MANUELLE de la paie à l'étranger d'un expatrié (V1, FCFA).
//    - Un expatrié peut avoir plusieurs pays (France, USA...) le même mois :
//      chaque pays est une ligne.
//    - Enregistrer à nouveau le même pays ÉCRASE la ligne (pas de doublon).
//    - La paie Congo n'est jamais modifiée ici : elle vient du bulletin.
//    Les lignes existantes viennent du journal déjà chargé (props) : après
//    chaque enregistrement/suppression, la page recharge le journal.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import { X, Globe2, Trash2, Loader2, Save, AlertTriangle, Pencil } from 'lucide-react';
import { api } from '@/services/api';
import SearchSelect from '@/components/ui/SearchSelect';
import type { JournalRow, PayrollJournal, UpsertForeignPayPayload } from '@/types/payroll-journal';
import { fmtMoney, MONTHS_FR } from '@/lib/payroll-journal-columns';

const COUNTRIES: { code: string; name: string }[] = [
  { code: 'FR', name: 'France' }, { code: 'BE', name: 'Belgique' }, { code: 'CH', name: 'Suisse' },
  { code: 'DE', name: 'Allemagne' }, { code: 'IT', name: 'Italie' }, { code: 'ES', name: 'Espagne' },
  { code: 'PT', name: 'Portugal' }, { code: 'GB', name: 'Royaume-Uni' }, { code: 'US', name: 'États-Unis' },
  { code: 'CA', name: 'Canada' }, { code: 'CN', name: 'Chine' }, { code: 'IN', name: 'Inde' },
  { code: 'LB', name: 'Liban' }, { code: 'TR', name: 'Turquie' }, { code: 'AE', name: 'Émirats arabes unis' },
  { code: 'MA', name: 'Maroc' }, { code: 'SN', name: 'Sénégal' }, { code: 'CI', name: "Côte d'Ivoire" },
  { code: 'CM', name: 'Cameroun' }, { code: 'GA', name: 'Gabon' }, { code: 'ZA', name: 'Afrique du Sud' },
];
const OTHER = 'AUTRE';

const parseAmount = (s: string): number => {
  const n = Number(s.replace(/[^\d.,]/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};
const fmtInput = (s: string): string => {
  const digits = s.replace(/[^\d]/g, '');
  return digits ? Number(digits).toLocaleString('fr-FR') : '';
};

interface Props {
  open: boolean;
  onClose: () => void;
  journal: PayrollJournal;
  initialEmployeeId?: string | null;
  /** Appelé après chaque enregistrement / suppression pour recharger le journal */
  onChanged: () => void | Promise<void>;
}

export default function ForeignPayModal({ open, onClose, journal, initialEmployeeId, onChanged }: Props) {
  const [employeeId, setEmployeeId] = useState('');
  const [country, setCountry] = useState('FR');
  const [otherCode, setOtherCode] = useState('');
  const [otherName, setOtherName] = useState('');
  const [payerName, setPayerName] = useState('');
  const [gross, setGross] = useState('');
  const [net, setNet] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEmployeeId(initialEmployeeId ?? '');
      resetForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialEmployeeId]);

  function resetForm() {
    setCountry('FR'); setOtherCode(''); setOtherName('');
    setPayerName(''); setGross(''); setNet(''); setNote(''); setError(null);
  }

  const row: JournalRow | undefined = useMemo(
    () => journal.rows.find((r) => r.employeeId === employeeId),
    [journal.rows, employeeId],
  );

  if (!open) return null;

  const periodLabel = `${MONTHS_FR[journal.month - 1]} ${journal.year}`;

  function editLine(f: JournalRow['foreign'][number]) {
    const known = COUNTRIES.some((c) => c.code === f.countryCode);
    setCountry(known ? f.countryCode : OTHER);
    setOtherCode(known ? '' : f.countryCode);
    setOtherName(known ? '' : f.countryName);
    setPayerName(f.payerName ?? '');
    setGross(fmtInput(String(f.grossAmount)));
    setNet(fmtInput(String(f.netAmount)));
    setNote(f.note ?? '');
    setError(null);
  }

  async function save() {
    setError(null);
    if (!employeeId) return setError('Choisissez un employé.');

    const code = (country === OTHER ? otherCode : country).trim().toUpperCase();
    const name = country === OTHER ? otherName.trim() : COUNTRIES.find((c) => c.code === country)?.name ?? '';
    if (code.length !== 2) return setError('Code pays invalide (2 lettres, ex. FR).');
    if (!name) return setError('Indiquez le nom du pays.');
    if (code === 'CG') return setError('La paie du Congo est calculée par la paie normale : saisissez ici uniquement ce qui est payé à l\'étranger.');

    const g = parseAmount(gross);
    const n = parseAmount(net);
    if (g <= 0) return setError('Le brut doit être supérieur à 0.');
    if (n < 0) return setError('Le net est invalide.');

    const payload: UpsertForeignPayPayload = {
      employeeId, month: journal.month, year: journal.year,
      countryCode: code, countryName: name,
      payerName: payerName.trim() || undefined,
      grossAmount: g, netAmount: n,
      note: note.trim() || undefined,
    };

    setBusy(true);
    try {
      await api.post('/payroll-journal/foreign-pays', payload);
      resetForm();
      await onChanged();
    } catch (e: any) {
      setError(e?.message || "Échec de l'enregistrement.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Supprimer cette ligne de paie étrangère ?')) return;
    setBusy(true);
    setError(null);
    try {
      await api.delete(`/payroll-journal/foreign-pays/${id}`);
      await onChanged();
    } catch (e: any) {
      setError(e?.message || 'Échec de la suppression.');
    } finally {
      setBusy(false);
    }
  }

  const input =
    'w-full px-3 py-2 text-sm rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--brand)]/50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 print:hidden" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[92vh] overflow-y-auto bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/30">
              <Globe2 className="w-5 h-5 text-violet-600 dark:text-violet-300" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text)]">Paie à l'étranger — expatrié</h2>
              <p className="text-xs text-[var(--text-muted)]">{periodLabel} · montants en FCFA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--surface-2)]">
            <X className="w-4 h-4 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Employé */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Employé</label>
            <SearchSelect
              value={employeeId}
              onChange={(v) => { setEmployeeId(v); resetForm(); }}
              placeholder="Rechercher un employé…"
              options={journal.rows.map((r) => ({
                value: r.employeeId,
                label: `${r.employeeName}${r.isExpat ? ' (expatrié)' : ''}`,
              }))}
            />
          </div>

          {/* Lignes déjà saisies */}
          {row && row.foreign.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">Déjà saisi pour {periodLabel}</p>
              <div className="rounded-xl border border-[var(--border)] divide-y divide-[var(--border)]">
                {row.foreign.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {f.countryName} ({f.countryCode})
                        {f.payerName && <span className="font-normal text-[var(--text-muted)]"> · payé par {f.payerName}</span>}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        Brut {fmtMoney(f.grossAmount)} F · Net {fmtMoney(f.netAmount)} F
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => editLine(f)} title="Modifier" className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => remove(f.id)} disabled={busy} title="Supprimer" className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-red-500">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Formulaire */}
          {employeeId && (
            <div className="space-y-4 rounded-xl bg-[var(--surface-2)] p-4">
              <p className="text-xs font-semibold text-[var(--text)]">
                {row && row.foreign.length > 0 ? 'Ajouter / modifier un pays' : 'Paie à l\'étranger'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Pays</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className={input}>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name} ({c.code})</option>)}
                    <option value={OTHER}>Autre pays…</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Entité qui paie (optionnel)</label>
                  <input value={payerName} onChange={(e) => setPayerName(e.target.value)} maxLength={255} placeholder="Ex : société mère" className={input} />
                </div>
              </div>

              {country === OTHER && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Code (2 lettres)</label>
                    <input value={otherCode} onChange={(e) => setOtherCode(e.target.value.slice(0, 2))} placeholder="JP" className={`${input} uppercase`} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Nom du pays</label>
                    <input value={otherName} onChange={(e) => setOtherName(e.target.value)} maxLength={100} placeholder="Japon" className={input} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Brut payé à l'étranger (F)</label>
                  <input inputMode="numeric" value={gross} onChange={(e) => setGross(fmtInput(e.target.value))} placeholder="0" className={`${input} text-right tabular-nums`} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Net à payer à l'étranger (F)</label>
                  <input inputMode="numeric" value={net} onChange={(e) => setNet(fmtInput(e.target.value))} placeholder="0" className={`${input} text-right tabular-nums`} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Note (optionnel)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Précision pour la comptabilité" className={input} />
              </div>

              <p className="text-[11px] text-[var(--text-muted)]">
                Si ce pays existe déjà pour ce mois, la ligne est remplacée. Le brut et le net du Congo viennent du bulletin et ne sont pas modifiés.
              </p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Pied */}
        <div className="flex items-center justify-end gap-2 p-5 border-t border-[var(--border)]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold rounded-xl border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)]">
            Fermer
          </button>
          <button
            onClick={save}
            disabled={busy || !employeeId}
            className="px-4 py-2 text-sm font-semibold rounded-xl bg-[var(--brand)] text-white shadow-md shadow-[var(--brand)]/30 disabled:opacity-50 flex items-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}