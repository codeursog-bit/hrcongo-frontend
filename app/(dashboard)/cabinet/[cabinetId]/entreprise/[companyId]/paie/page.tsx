'use client';

/**
 * Page saisie variables paie — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/paie
 *
 * REFONTE UX uniquement — toute la logique métier est identique à l'original.
 * Améliorations :
 * - Scrollbar horizontale propre avec classe custom-scroll
 * - Header sticky avec totaux live mieux présentés
 * - Colonnes variables plus aérées et lisibles
 * - Détail calcul dans un panneau séparé, plus clair
 * - Remplacement Lucide → Ico.* du design system cabinet
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { C, Ico, Btn, Badge, LoadingScreen, InfoNote, StatRow } from '@/components/cabinet/cabinet-ui';

// ─── Types (identiques à l'original) ─────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  baseSalary: number;
  contractType: string;
}

interface Bonus {
  id: string;
  label: string;
  amount: number;
  isTaxable: boolean;
  isCnss: boolean;
}

interface EmployeeRow {
  employee: Employee;
  workedDays: number;
  absentDays: number;
  overtime10: number;
  overtime25: number;
  overtime50: number;
  overtime100: number;
  bonuses: Bonus[];
  advance: number;
  loanDeduction: number;
  preview: PayrollPreview | null;
  isCalculating: boolean;
  isExpanded: boolean;
  isDirty: boolean;
  isSaved: boolean;
}

interface PayrollPreview {
  grossSalary: number;
  adjustedBaseSalary: number;
  absenceDeduction: number;
  totalOvertimeAmount: number;
  overtimeAmount10: number;
  overtimeAmount25: number;
  overtimeAmount50: number;
  overtimeAmount100: number;
  totalBonuses: number;
  cnssSalarial: number;
  its: number;
  employeeCustomTaxTotal: number;
  totalDeductions: number;
  netSalary: number;
  cnssEmployerPension: number;
  cnssEmployerFamily: number;
  cnssEmployerAccident: number;
  cnssEmployer: number;
  tusDgiAmount: number;
  tusCnssAmount: number;
  tusTotal: number;
  employerCustomTaxTotal: number;
  totalEmployerCost: number;
  customTaxDetails: Array<{ name: string; code: string; employeeAmount: number; employerAmount: number }>;
}

interface CompanyInfo {
  id: string;
  legalName: string;
  tradeName: string | null;
  city: string;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const initials = (f: string, l: string) => `${f[0] ?? ''}${l[0] ?? ''}`.toUpperCase();

// ─── Couleurs avatar cohérentes avec cabinet-ui ───────────────────────────────
const AVATAR_GRADS = [
  ['#4f46e5','#818cf8'],
  ['#0891b2','#67e8f9'],
  ['#059669','#6ee7b7'],
  ['#d97706','#fcd34d'],
  ['#db2777','#f9a8d4'],
  ['#7c3aed','#c4b5fd'],
];

function EmpAvatar({ name, idx }: { name: string; idx: number }) {
  const [from, to] = AVATAR_GRADS[idx % AVATAR_GRADS.length];
  return (
    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-[11px] font-bold text-white"
         style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}>
      {name}
    </div>
  );
}

// ─── Cellule numérique ────────────────────────────────────────────────────────
function NumCell({ value, onChange, highlight = false, min = 0, max, step = 1 }: {
  value: number; onChange: (v: number) => void;
  highlight?: boolean; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number" min={min} max={max} step={step}
      value={value || ''} placeholder="0"
      onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
      className="w-full text-center text-xs py-2 px-1 rounded-lg outline-none transition-colors"
      style={{
        background: highlight && value > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
        border:     highlight && value > 0 ? '1px solid rgba(245,158,11,0.25)' : `1px solid ${C.border}`,
        color:      highlight && value > 0 ? C.amber : C.textPrimary,
      }}
      onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
      onBlur={e => (e.currentTarget.style.borderColor = highlight && value > 0 ? 'rgba(245,158,11,0.25)' : C.border)}
    />
  );
}

// ─── Ligne employé ────────────────────────────────────────────────────────────
function EmployeeRowComponent({ row, rowIdx, onChange, onCalculate, onSave }: {
  row: EmployeeRow;
  rowIdx: number;
  onChange: (field: keyof EmployeeRow, value: any) => void;
  onCalculate: () => void;
  onSave: () => void;
}) {
  const p   = row.preview;
  const emp = row.employee;

  const addBonus = () => {
    onChange('bonuses', [...row.bonuses, { id: crypto.randomUUID(), label: '', amount: 0, isTaxable: true, isCnss: true }]);
  };

  const updateBonus = (id: string, field: keyof Bonus, value: any) =>
    onChange('bonuses', row.bonuses.map(b => b.id === id ? { ...b, [field]: value } : b));

  const removeBonus = (id: string) =>
    onChange('bonuses', row.bonuses.filter(b => b.id !== id));

  return (
    <div
      className="transition-colors"
      style={{
        borderBottom: `1px solid ${C.border}`,
        background: row.isDirty && !row.isSaved ? 'rgba(245,158,11,0.02)' : 'transparent',
      }}
    >
      {/* ── Ligne principale ── */}
      <div
        className="grid items-center gap-2 px-4 py-2.5"
        style={{ gridTemplateColumns: '196px 72px 72px 66px 66px 66px 66px 88px 88px 108px 96px 88px', minWidth: 1060 }}
      >
        {/* Employé */}
        <div className="flex items-center gap-2 min-w-0">
          <EmpAvatar name={initials(emp.firstName, emp.lastName)} idx={rowIdx} />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: C.textPrimary }}>
              {emp.firstName} {emp.lastName}
            </p>
            <p className="text-[10px] truncate" style={{ color: C.textMuted }}>{emp.position}</p>
          </div>
        </div>

        {/* Jours travaillés */}
        <NumCell value={row.workedDays} min={0} max={31} onChange={v => onChange('workedDays', v)}/>

        {/* Absences */}
        <NumCell value={row.absentDays} highlight onChange={v => onChange('absentDays', v)}/>

        {/* H.sup ×1.10 */}
        <NumCell value={row.overtime10} highlight onChange={v => onChange('overtime10', v)}/>

        {/* H.sup ×1.25 */}
        <NumCell value={row.overtime25} highlight onChange={v => onChange('overtime25', v)}/>

        {/* H.sup ×1.50 */}
        <NumCell value={row.overtime50} highlight onChange={v => onChange('overtime50', v)}/>

        {/* H.sup ×2.00 */}
        <NumCell value={row.overtime100} highlight onChange={v => onChange('overtime100', v)}/>

        {/* Avance */}
        <NumCell value={row.advance} step={1000} highlight onChange={v => onChange('advance', v)}/>

        {/* Prêt */}
        <NumCell value={row.loanDeduction} step={1000} highlight onChange={v => onChange('loanDeduction', v)}/>

        {/* Net estimé */}
        <div className="text-right pr-1">
          {row.isCalculating ? (
            <Ico.Loader size={14} color={C.textMuted}/>
          ) : p ? (
            <span className="text-sm font-bold tabular-nums" style={{ color: C.emerald }}>{fmt(p.netSalary)}</span>
          ) : (
            <span className="text-xs" style={{ color: C.textMuted }}>—</span>
          )}
        </div>

        {/* Coût emp. */}
        <div className="text-right pr-1">
          {p ? (
            <span className="text-xs tabular-nums font-medium" style={{ color: C.violet }}>{fmt(p.totalEmployerCost)}</span>
          ) : (
            <span className="text-xs" style={{ color: C.textMuted }}>—</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 justify-end">
          {row.isDirty && !row.isCalculating && (
            <button onClick={onCalculate}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: C.cyan }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.08)')}
              title="Calculer">
              <Ico.Play size={10} color={C.cyan}/>
            </button>
          )}
          {p && !row.isSaved && (
            <button onClick={onSave}
              className="p-1.5 rounded-lg transition-colors"
              style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: C.emerald }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.08)')}
              title="Sauvegarder">
              <Ico.Save size={11} color={C.emerald}/>
            </button>
          )}
          {row.isSaved && <Ico.CheckSimple size={14} color={C.emerald}/>}
          <button
            onClick={() => onChange('isExpanded', !row.isExpanded)}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: C.textMuted }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            {row.isExpanded ? <Ico.ChevronUp size={13} color={C.textSecondary}/> : <Ico.ChevronDown size={13} color={C.textMuted}/>}
          </button>
        </div>
      </div>

      {/* ── Détail déplié ── */}
      {row.isExpanded && (
        <div className="mx-4 mb-4 grid grid-cols-2 gap-4 pt-3 pb-1"
             style={{ borderTop: `1px solid ${C.border}` }}>

          {/* Primes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold" style={{ color: C.textSecondary }}>Primes ce mois</p>
              <button onClick={addBonus}
                className="flex items-center gap-1 text-xs font-medium transition-opacity hover:opacity-75"
                style={{ color: C.cyan }}>
                <Ico.Plus size={11} color={C.cyan}/> Ajouter
              </button>
            </div>
            {row.bonuses.length === 0 ? (
              <p className="text-xs italic" style={{ color: C.textMuted }}>Aucune prime ce mois</p>
            ) : (
              <div className="space-y-2">
                {row.bonuses.map(bonus => (
                  <div key={bonus.id} className="flex items-center gap-2">
                    <input
                      value={bonus.label}
                      onChange={e => updateBonus(bonus.id, 'label', e.target.value)}
                      placeholder="Libellé prime"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-xs outline-none transition-all"
                      style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textPrimary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                    />
                    <input
                      type="number"
                      value={bonus.amount || ''}
                      onChange={e => updateBonus(bonus.id, 'amount', Number(e.target.value) || 0)}
                      placeholder="Montant"
                      className="w-24 px-2.5 py-1.5 rounded-lg text-xs text-right outline-none transition-all"
                      style={{ background: C.inputBg, border: `1px solid ${C.border}`, color: C.textPrimary }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                    />
                    <label className="flex items-center gap-1 text-xs cursor-pointer select-none" style={{ color: C.textMuted }}>
                      <input type="checkbox" checked={bonus.isTaxable}
                        onChange={e => updateBonus(bonus.id, 'isTaxable', e.target.checked)} className="rounded" />
                      ITS
                    </label>
                    <label className="flex items-center gap-1 text-xs cursor-pointer select-none" style={{ color: C.textMuted }}>
                      <input type="checkbox" checked={bonus.isCnss}
                        onChange={e => updateBonus(bonus.id, 'isCnss', e.target.checked)} className="rounded" />
                      CNSS
                    </label>
                    <button onClick={() => removeBonus(bonus.id)}
                      className="p-1 rounded-md transition-colors"
                      style={{ color: C.textMuted }}
                      onMouseEnter={e => { (e.currentTarget.style.color) = C.red; }}
                      onMouseLeave={e => { (e.currentTarget.style.color) = C.textMuted; }}>
                      <Ico.Trash size={12} color="currentColor"/>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détail calcul */}
          {p ? (
            <div className="rounded-xl p-4 space-y-1"
                 style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${C.border}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>
                Détail du calcul
              </p>

              {/* Salarié */}
              <StatRow label="Salaire de base ajusté" value={fmt(p.adjustedBaseSalary)}/>
              {p.absenceDeduction > 0 && <StatRow label="− Retenue absences" value={`−${fmt(p.absenceDeduction)}`} color={C.amber}/>}
              {p.totalOvertimeAmount > 0 && (
                <>
                  <StatRow label="+ H.sup ×1.10" value={`+${fmt(p.overtimeAmount10)}`}/>
                  <StatRow label="+ H.sup ×1.25" value={`+${fmt(p.overtimeAmount25)}`}/>
                  {p.overtimeAmount50  > 0 && <StatRow label="+ H.sup ×1.50" value={`+${fmt(p.overtimeAmount50)}`}/>}
                  {p.overtimeAmount100 > 0 && <StatRow label="+ H.sup ×2.00" value={`+${fmt(p.overtimeAmount100)}`}/>}
                </>
              )}
              {p.totalBonuses > 0 && <StatRow label="+ Primes" value={`+${fmt(p.totalBonuses)}`}/>}
              <div className="my-1" style={{ borderTop: `1px solid ${C.border}` }}/>
              <StatRow label="= Salaire brut" value={fmt(p.grossSalary)} color={C.textPrimary}/>
              <StatRow label="− CNSS salarié (4%)" value={`−${fmt(p.cnssSalarial)}`} color={C.red}/>
              <StatRow label="− ITS" value={`−${fmt(p.its)}`} color={C.red}/>
              {p.customTaxDetails.filter(t => t.employeeAmount > 0).map(t => (
                <StatRow key={t.code} label={`− ${t.name} (${t.code})`} value={`−${fmt(t.employeeAmount)}`} color={C.red}/>
              ))}
              {row.advance       > 0 && <StatRow label="− Avance"             value={`−${fmt(row.advance)}`}       color={C.amber}/>}
              {row.loanDeduction > 0 && <StatRow label="− Remboursement prêt" value={`−${fmt(row.loanDeduction)}`} color={C.amber}/>}
              <div className="my-1" style={{ borderTop: `1px solid ${C.border}` }}/>
              <div className="flex justify-between items-center text-xs pt-0.5">
                <span className="font-semibold" style={{ color: C.emerald }}>= Net à payer</span>
                <span className="font-bold text-sm tabular-nums" style={{ color: C.emerald }}>{fmt(p.netSalary)}</span>
              </div>

              {/* Charges patronales */}
              <div className="mt-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.textMuted }}>
                  Charges patronales
                </p>
                <StatRow label="CNSS retraite (8%)"       value={fmt(p.cnssEmployerPension)}  color={C.violet}/>
                <StatRow label="CNSS famille (10.03%)"    value={fmt(p.cnssEmployerFamily)}    color={C.violet}/>
                <StatRow label="CNSS accidents (2.25%)"   value={fmt(p.cnssEmployerAccident)}  color={C.violet}/>
                <StatRow label="TUS DGI (4.13%)"          value={fmt(p.tusDgiAmount)}          color={C.violet}/>
                <StatRow label="TUS CNSS (3.38%)"         value={fmt(p.tusCnssAmount)}         color={C.violet}/>
                {p.customTaxDetails.filter(t => t.employerAmount > 0).map(t => (
                  <StatRow key={t.code} label={`${t.name} (${t.code})`} value={fmt(t.employerAmount)} color={C.violet}/>
                ))}
                <div className="my-1" style={{ borderTop: `1px solid ${C.border}` }}/>
                <div className="flex justify-between items-center text-xs pt-0.5">
                  <span className="font-semibold" style={{ color: C.violet }}>Coût total employeur</span>
                  <span className="font-bold tabular-nums" style={{ color: C.violet }}>{fmt(p.totalEmployerCost)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl flex items-center justify-center text-xs"
                 style={{ background: 'rgba(255,255,255,0.02)', border: `1px dashed ${C.border}`, minHeight: 120, color: C.textMuted }}>
              Calculer pour voir le détail
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function SaisieVariablesPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const now = new Date();
  const [selectedMonth,     setSelectedMonth]     = useState(now.getMonth());
  const [selectedYear,      setSelectedYear]      = useState(now.getFullYear());
  const [company,           setCompany]           = useState<CompanyInfo | null>(null);
  const [rows,              setRows]              = useState<EmployeeRow[]>([]);
  const [loading,           setLoading]           = useState(true);
  const [launching,         setLaunching]         = useState(false);
  const [showMonthPicker,   setShowMonthPicker]   = useState(false);

  // ── Chargement ───────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [comp, emps]: any[] = await Promise.all([
          api.get(`/companies/${companyId}`),
          api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=200`),
        ]);
        setCompany(comp);
        const employeeList: Employee[] = emps.data ?? emps;

        const existingPayrolls: any[] = await api.get(
          `/payrolls?companyId=${companyId}&month=${selectedMonth + 1}&year=${selectedYear}&limit=200`,
        ).then((r: any) => r.data ?? r).catch(() => []);

        const payrollMap = new Map(existingPayrolls.map((p: any) => [p.employeeId, p]));
        setRows(employeeList.map(emp => {
          const existing = payrollMap.get(emp.id);
          return {
            employee:      emp,
            workedDays:    existing?.workedDays ?? 26,
            absentDays:    existing?.absentDays ?? 0,
            overtime10:    existing?.overtime10 ?? 0,
            overtime25:    existing?.overtime25 ?? 0,
            overtime50:    existing?.overtime50 ?? 0,
            overtime100:   existing?.overtime100 ?? 0,
            bonuses:       (existing?.bonuses ?? []).map((b: any) => ({ id: b.id ?? crypto.randomUUID(), label: b.bonusType ?? '', amount: b.amount ?? 0, isTaxable: b.isTaxable ?? true, isCnss: b.isCnss ?? true })),
            advance:       existing?.advance ?? 0,
            loanDeduction: existing?.loanDeduction ?? 0,
            preview:       existing?.calculation ?? null,
            isCalculating: false, isExpanded: false,
            isDirty: !existing, isSaved: !!existing,
          };
        }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [companyId, selectedMonth, selectedYear]);

  const updateRow = useCallback((empId: string, field: keyof EmployeeRow, value: any) => {
    setRows(prev => prev.map(r =>
      r.employee.id === empId
        ? { ...r, [field]: value, isDirty: field !== 'isExpanded' ? true : r.isDirty, isSaved: false }
        : r,
    ));
  }, []);

  const calculateRow = useCallback(async (empId: string) => {
    const row = rows.find(r => r.employee.id === empId);
    if (!row) return;
    setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, isCalculating: true } : r));
    try {
      const preview: PayrollPreview = await api.post('/payrolls/simulate', {
        employeeId: empId, companyId,
        month: selectedMonth + 1, year: selectedYear,
        workedDays: row.workedDays,
        overtime10: row.overtime10, overtime25: row.overtime25,
        overtime50: row.overtime50, overtime100: row.overtime100,
        bonuses: row.bonuses.map(b => ({ bonusType: b.label, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss })),
        advanceAmount: row.advance, loanDeduction: row.loanDeduction,
      }) as PayrollPreview;
      setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, preview, isCalculating: false, isDirty: false } : r));
    } catch {
      setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, isCalculating: false } : r));
    }
  }, [rows, companyId, selectedMonth, selectedYear]);

  const saveRow = useCallback(async (empId: string) => {
    const row = rows.find(r => r.employee.id === empId);
    if (!row || !row.preview) return;
    try {
      await api.post('/payrolls', {
        employeeId: empId, companyId,
        month: MONTHS[selectedMonth], year: selectedYear,
        workedDays: row.workedDays,
        overtime10: row.overtime10, overtime25: row.overtime25,
        overtime50: row.overtime50, overtime100: row.overtime100,
        bonuses: row.bonuses.map(b => ({ bonusType: b.label, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss })),
      });
      setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, isSaved: true } : r));
    } catch (e: any) { alert(`Erreur : ${e.message}`); }
  }, [rows, companyId, selectedMonth, selectedYear]);

  const calculateAll = async () => {
    for (const row of rows) {
      if (row.isDirty) await calculateRow(row.employee.id);
    }
  };

  const launchPayroll = async () => {
    const unready = rows.filter(r => !r.preview);
    if (unready.length > 0) {
      if (!confirm(`${unready.length} employé(s) sans calcul. Calculer automatiquement ?`)) return;
      await calculateAll();
    }
    setLaunching(true);
    try {
      for (const row of rows) {
        if (!row.isSaved && row.preview) await saveRow(row.employee.id);
      }
      router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/bulletins?month=${selectedMonth + 1}&year=${selectedYear}`);
    } catch (e: any) { alert(`Erreur : ${e.message}`); }
    finally { setLaunching(false); }
  };

  const totals = rows.reduce((acc, r) => {
    if (!r.preview) return acc;
    return {
      masseSalariale: acc.masseSalariale + r.preview.grossSalary,
      netTotal:       acc.netTotal       + r.preview.netSalary,
      cnssPatronale:  acc.cnssPatronale  + r.preview.cnssEmployer,
      tusTotal:       acc.tusTotal       + r.preview.tusTotal,
      coutTotal:      acc.coutTotal      + r.preview.totalEmployerCost,
    };
  }, { masseSalariale: 0, netTotal: 0, cnssPatronale: 0, tusTotal: 0, coutTotal: 0 });

  const savedCount = rows.filter(r => r.isSaved).length;
  const readyCount = rows.filter(r => r.preview !== null).length;
  const allReady   = readyCount === rows.length && rows.length > 0;

  if (loading) return <LoadingScreen/>;

  return (
    <div className="flex flex-col h-full" style={{ background: C.pageBg, color: C.textPrimary }}>

      {/* ── Header sticky ── */}
      <div className="shrink-0 px-5 py-4"
           style={{ borderBottom: `1px solid ${C.border}`, background: C.cardBg }}>
        <div className="flex items-center justify-between gap-4">
          {/* Titre + sélecteur mois */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold" style={{ color: C.textPrimary }}>
                {company?.tradeName || company?.legalName || '…'}
              </h1>
              <span style={{ color: C.textMuted }}>·</span>
              <div className="relative">
                <button
                  onClick={() => setShowMonthPicker(!showMonthPicker)}
                  className="flex items-center gap-1.5 text-sm font-semibold transition-colors rounded-lg px-2 py-1"
                  style={{ color: C.cyan, background: 'rgba(6,182,212,0.08)' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.08)')}
                >
                  {MONTHS[selectedMonth]} {selectedYear}
                  <Ico.ChevronDown size={12} color={C.cyan}/>
                </button>

                {showMonthPicker && (
                  <div className="absolute top-10 left-0 z-50 rounded-xl p-3 shadow-2xl"
                       style={{ background: '#1a2235', border: `1px solid ${C.borderHover}`, width: 260 }}>
                    <div className="grid grid-cols-3 gap-1 mb-3">
                      {MONTHS.map((m, i) => (
                        <button key={m} onClick={() => { setSelectedMonth(i); setShowMonthPicker(false); }}
                          className="px-2 py-1.5 rounded-lg text-xs transition-colors"
                          style={{
                            background: i === selectedMonth ? C.cyan : 'transparent',
                            color:      i === selectedMonth ? '#000' : C.textSecondary,
                            fontWeight: i === selectedMonth ? 700 : 400,
                          }}>
                          {m.slice(0, 4)}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-1 justify-center"
                         style={{ borderTop: `1px solid ${C.border}`, paddingTop: 10 }}>
                      {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                        <button key={y} onClick={() => setSelectedYear(y)}
                          className="px-3 py-1 rounded-lg text-xs transition-colors"
                          style={{
                            background: y === selectedYear ? C.cyan : 'transparent',
                            color:      y === selectedYear ? '#000' : C.textSecondary,
                            fontWeight: y === selectedYear ? 700 : 400,
                          }}>
                          {y}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>
              {rows.length} employés · {readyCount} calculés · {savedCount} sauvegardés
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Btn variant="ghost" size="sm" icon={<Ico.Play size={12} color={C.textSecondary}/>} onClick={calculateAll}>
              Calculer tout
            </Btn>
            <Btn
              variant={allReady ? 'success' : 'primary'}
              size="sm"
              icon={launching ? <Ico.Loader size={13} color="#fff"/> : <Ico.FileText size={13} color="#fff"/>}
              onClick={launchPayroll}
              disabled={launching}
            >
              {launching ? 'Génération...' : 'Générer les bulletins'}
            </Btn>
          </div>
        </div>

        {/* Totaux live */}
        {readyCount > 0 && (
          <div className="flex items-center gap-6 mt-4 pt-3 flex-wrap"
               style={{ borderTop: `1px solid ${C.border}` }}>
            {[
              { label: 'Masse brute',  value: fmt(totals.masseSalariale), color: C.textPrimary },
              { label: 'Net à payer',  value: fmt(totals.netTotal),       color: C.emerald     },
              { label: 'CNSS patron.', value: fmt(totals.cnssPatronale),  color: C.violet      },
              { label: 'TUS total',    value: fmt(totals.tusTotal),       color: C.violet      },
              { label: 'Coût emp.',    value: fmt(totals.coutTotal),      color: C.amber       },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: C.textMuted }}>{label}</p>
                <p className="text-sm font-bold tabular-nums" style={{ color }}>
                  {value} <span className="text-[10px] font-normal" style={{ color: C.textMuted }}>FCFA</span>
                </p>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: allReady ? C.emerald : C.amber }}/>
              <span className="text-xs" style={{ color: C.textMuted }}>
                {allReady ? 'Tous prêts' : `${rows.length - readyCount} en attente`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Tableau ── */}
      <div className="flex-1 overflow-hidden flex flex-col">

        {/* En-têtes de colonnes — sticky */}
        <div
          className="shrink-0 overflow-x-auto custom-scroll"
          style={{ borderBottom: `1px solid ${C.border}`, background: 'rgba(255,255,255,0.02)' }}
        >
          <div
            className="grid items-center gap-2 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider"
            style={{ gridTemplateColumns: '196px 72px 72px 66px 66px 66px 66px 88px 88px 108px 96px 88px', minWidth: 1060, color: C.textMuted }}
          >
            <span>Employé</span>
            <span className="text-center">Jours<br/>trav.</span>
            <span className="text-center">Absences</span>
            <span className="text-center">H.sup<br/>×1.10</span>
            <span className="text-center">H.sup<br/>×1.25</span>
            <span className="text-center">H.sup<br/>×1.50</span>
            <span className="text-center">H.sup<br/>×2.00</span>
            <span className="text-center">Avance<br/>FCFA</span>
            <span className="text-center">Prêt<br/>FCFA</span>
            <span className="text-right">Net estimé</span>
            <span className="text-right">Coût emp.</span>
            <span/>
          </div>
        </div>

        {/* Info heures sup */}
        <div className="shrink-0 flex items-center gap-2 px-5 py-2"
             style={{ background: 'rgba(99,102,241,0.04)', borderBottom: `1px solid rgba(99,102,241,0.1)` }}>
          <Ico.Info size={12} color={C.indigoL}/>
          <p className="text-[11px]" style={{ color: 'rgba(165,180,252,0.7)' }}>
            Heures sup conformes Décret N°78-360 : ×1.10 (5 premières h.) · ×1.25 (suivantes) · ×1.50 (nuit/férié) · ×2.00 (nuit dimanche/JF)
          </p>
        </div>

        {/* Lignes — zone scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-auto custom-scroll">
          <div style={{ minWidth: 1060 }}>
            {rows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                     style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}>
                  <Ico.Users size={20} color={C.textMuted}/>
                </div>
                <p className="text-sm" style={{ color: C.textSecondary }}>Aucun employé actif</p>
                <p className="text-xs mt-1" style={{ color: C.textMuted }}>Ajoutez des employés à cette PME pour saisir les variables</p>
              </div>
            ) : (
              rows.map((row, idx) => (
                <EmployeeRowComponent
                  key={row.employee.id}
                  row={row}
                  rowIdx={idx}
                  onChange={(field, value) => updateRow(row.employee.id, field, value)}
                  onCalculate={() => calculateRow(row.employee.id)}
                  onSave={() => saveRow(row.employee.id)}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}