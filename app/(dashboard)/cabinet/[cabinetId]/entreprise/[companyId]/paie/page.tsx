'use client';

/**
 * Page saisie variables paie — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/paie
 * API INCHANGÉE — UX refactorisée avec le design system cabinet-ui
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import { C, Ico, Avatar } from '@/components/cabinet/cabinet-ui';

// ─── Types (inchangés) ────────────────────────────────────────────────────────

interface Employee {
  id: string; firstName: string; lastName: string;
  position: string; baseSalary: number; contractType: string;
}

interface Bonus {
  id: string; label: string; amount: number; isTaxable: boolean; isCnss: boolean;
}

interface EmployeeRow {
  employee: Employee;
  workedDays: number; absentDays: number;
  overtime10: number; overtime25: number; overtime50: number; overtime100: number;
  bonuses: Bonus[];
  advance: number; loanDeduction: number;
  preview: PayrollPreview | null;
  isCalculating: boolean; isExpanded: boolean; isDirty: boolean; isSaved: boolean;
}

interface PayrollPreview {
  grossSalary: number; adjustedBaseSalary: number; absenceDeduction: number;
  totalOvertimeAmount: number; overtimeAmount10: number; overtimeAmount25: number;
  overtimeAmount50: number; overtimeAmount100: number; totalBonuses: number;
  cnssSalarial: number; its: number; employeeCustomTaxTotal: number;
  totalDeductions: number; netSalary: number;
  cnssEmployerPension: number; cnssEmployerFamily: number; cnssEmployerAccident: number;
  cnssEmployer: number; tusDgiAmount: number; tusCnssAmount: number; tusTotal: number;
  employerCustomTaxTotal: number; totalEmployerCost: number;
  customTaxDetails: Array<{ name: string; code: string; employeeAmount: number; employerAmount: number }>;
}

interface CompanyInfo { id: string; legalName: string; tradeName: string | null; city: string }

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

// ─── NumCell — champ numérique compact ───────────────────────────────────────

function NumCell({ value, onChange, highlight = false, min = 0, max, step = 1 }: {
  value: number; onChange: (v: number) => void;
  highlight?: boolean; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number"
      min={min} max={max} step={step}
      value={value || ''}
      placeholder="0"
      onChange={e => onChange(Math.max(min, Number(e.target.value) || 0))}
      style={{
        width: '100%', textAlign: 'center', fontSize: 13,
        padding: '7px 4px', borderRadius: 8, outline: 'none',
        transition: 'border-color 150ms',
        background: highlight && value > 0 ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${highlight && value > 0 ? 'rgba(245,158,11,0.3)' : C.border}`,
        color: highlight && value > 0 ? C.amber : C.textPrimary,
      }}
      onFocus={e => (e.currentTarget.style.borderColor = C.cyan + '80')}
      onBlur={e => (e.currentTarget.style.borderColor = highlight && value > 0 ? 'rgba(245,158,11,0.3)' : C.border)}
    />
  );
}

// ─── Composant ligne employé ──────────────────────────────────────────────────

const GRID = '200px 76px 76px 66px 66px 66px 66px 86px 86px 108px 96px 88px';

function EmployeeRowComponent({ row, onChange, onCalculate, onSave, index }: {
  row: EmployeeRow;
  onChange: (field: keyof EmployeeRow, value: any) => void;
  onCalculate: () => void;
  onSave: () => void;
  index: number;
}) {
  const p   = row.preview;
  const emp = row.employee;

  const addBonus = () => {
    onChange('bonuses', [...row.bonuses, {
      id: crypto.randomUUID(), label: '', amount: 0, isTaxable: true, isCnss: true,
    }]);
  };
  const updateBonus = (id: string, field: keyof Bonus, value: any) =>
    onChange('bonuses', row.bonuses.map(b => b.id === id ? { ...b, [field]: value } : b));
  const removeBonus = (id: string) =>
    onChange('bonuses', row.bonuses.filter(b => b.id !== id));

  return (
    <div
      style={{
        borderBottom: `1px solid ${C.border}`,
        background: row.isDirty && !row.isSaved ? 'rgba(245,158,11,0.025)' : 'transparent',
        transition: 'background 200ms',
      }}
    >
      {/* ── Ligne principale ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          alignItems: 'center',
          gap: 6,
          padding: '10px 16px',
        }}
      >
        {/* Employé */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar name={`${emp.firstName} ${emp.lastName}`} size={30} index={index} />
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {emp.firstName} {emp.lastName}
            </p>
            <p style={{ fontSize: 10, color: C.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {emp.position}
            </p>
          </div>
        </div>

        <NumCell value={row.workedDays}   min={0} max={31} onChange={v => onChange('workedDays', v)} />
        <NumCell value={row.absentDays}   highlight={row.absentDays > 0}   onChange={v => onChange('absentDays', v)} />
        <NumCell value={row.overtime10}   highlight={row.overtime10 > 0}   onChange={v => onChange('overtime10', v)} />
        <NumCell value={row.overtime25}   highlight={row.overtime25 > 0}   onChange={v => onChange('overtime25', v)} />
        <NumCell value={row.overtime50}   highlight={row.overtime50 > 0}   onChange={v => onChange('overtime50', v)} />
        <NumCell value={row.overtime100}  highlight={row.overtime100 > 0}  onChange={v => onChange('overtime100', v)} />
        <NumCell value={row.advance}      step={1000} highlight={row.advance > 0}      onChange={v => onChange('advance', v)} />
        <NumCell value={row.loanDeduction}step={1000} highlight={row.loanDeduction > 0}onChange={v => onChange('loanDeduction', v)} />

        {/* Net estimé */}
        <div style={{ textAlign: 'right' }}>
          {row.isCalculating ? (
            <Ico.Loader size={14} color={C.textMuted} />
          ) : p ? (
            <span style={{ color: C.emerald, fontWeight: 700, fontSize: 13 }}>{fmt(p.netSalary)}</span>
          ) : (
            <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
          )}
        </div>

        {/* Coût employeur */}
        <div style={{ textAlign: 'right' }}>
          {p ? (
            <span style={{ color: C.violet, fontSize: 12 }}>{fmt(p.totalEmployerCost)}</span>
          ) : (
            <span style={{ color: C.textMuted, fontSize: 12 }}>—</span>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
          {row.isDirty && !row.isCalculating && (
            <button
              onClick={onCalculate}
              title="Recalculer"
              style={{
                padding: 6, borderRadius: 8, cursor: 'pointer',
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)',
                color: C.cyan, display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.1)')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6a4 4 0 107 2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M9 6V3.5L7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {p && !row.isSaved && (
            <button
              onClick={onSave}
              title="Sauvegarder"
              style={{
                padding: 6, borderRadius: 8, cursor: 'pointer',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
                color: C.emerald, display: 'flex', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.18)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(16,185,129,0.1)')}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 7l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          {row.isSaved && (
            <div title="Sauvegardé" style={{ display: 'flex', alignItems: 'center', padding: 4 }}>
              <Ico.Check size={14} color={C.emerald} />
            </div>
          )}
          <button
            onClick={() => onChange('isExpanded', !row.isExpanded)}
            style={{
              padding: 6, borderRadius: 8, cursor: 'pointer',
              background: 'none', border: 'none', color: C.textMuted,
              display: 'flex', alignItems: 'center', transition: 'color 150ms',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = C.textPrimary)}
            onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
          >
            <Ico.ChevronDown
              size={13}
              color="currentColor"
            />
          </button>
        </div>
      </div>

      {/* ── Détail déplié ── */}
      {row.isExpanded && (
        <div
          style={{
            padding: '12px 16px 16px',
            borderTop: `1px solid ${C.border}`,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
          }}
        >
          {/* Primes */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.textSecondary }}>Primes ce mois</p>
              <button
                onClick={addBonus}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4, fontSize: 11,
                  color: C.cyan, background: 'none', border: 'none', cursor: 'pointer',
                  padding: '3px 6px', borderRadius: 6,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                <Ico.Plus size={11} color="currentColor" /> Ajouter
              </button>
            </div>

            {row.bonuses.length === 0 ? (
              <p style={{ fontSize: 11, color: C.textMuted, fontStyle: 'italic' }}>Aucune prime ce mois</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {row.bonuses.map(bonus => (
                  <div key={bonus.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      value={bonus.label}
                      onChange={e => updateBonus(bonus.id, 'label', e.target.value)}
                      placeholder="Libellé prime"
                      style={{
                        flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 11,
                        background: C.inputBg, border: `1px solid ${C.border}`,
                        color: C.textPrimary, outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                    />
                    <input
                      type="number"
                      value={bonus.amount || ''}
                      onChange={e => updateBonus(bonus.id, 'amount', Number(e.target.value) || 0)}
                      placeholder="Montant"
                      style={{
                        width: 88, padding: '6px 6px', borderRadius: 8,
                        fontSize: 11, textAlign: 'right',
                        background: C.inputBg, border: `1px solid ${C.border}`,
                        color: C.textPrimary, outline: 'none',
                      }}
                      onFocus={e => (e.currentTarget.style.borderColor = C.borderFocus)}
                      onBlur={e => (e.currentTarget.style.borderColor = C.border)}
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: C.textMuted, cursor: 'pointer' }}>
                      <input type="checkbox" checked={bonus.isTaxable}
                        onChange={e => updateBonus(bonus.id, 'isTaxable', e.target.checked)}
                        style={{ accentColor: C.indigo }} />
                      ITS
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, color: C.textMuted, cursor: 'pointer' }}>
                      <input type="checkbox" checked={bonus.isCnss}
                        onChange={e => updateBonus(bonus.id, 'isCnss', e.target.checked)}
                        style={{ accentColor: C.indigo }} />
                      CNSS
                    </label>
                    <button
                      onClick={() => removeBonus(bonus.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMuted, padding: 3, borderRadius: 4 }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                    >
                      <Ico.Trash size={12} color="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détail calcul */}
          {p && (
            <div
              style={{
                borderRadius: 12, padding: 14,
                background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${C.border}`,
              }}
            >
              <p style={{ fontSize: 11, fontWeight: 600, color: C.textSecondary, marginBottom: 10 }}>
                Détail du calcul
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

                {/* Helper pour une ligne de détail */}
                {([
                  { label: 'Salaire de base ajusté', value: p.adjustedBaseSalary, color: C.textPrimary },
                  ...(p.absenceDeduction > 0 ? [{ label: '− Retenue absences', value: -p.absenceDeduction, color: C.amber }] : []),
                  ...(p.overtimeAmount10 > 0  ? [{ label: '+ H.sup ×1.10', value: p.overtimeAmount10,  color: C.textPrimary }] : []),
                  ...(p.overtimeAmount25 > 0  ? [{ label: '+ H.sup ×1.25', value: p.overtimeAmount25,  color: C.textPrimary }] : []),
                  ...(p.overtimeAmount50 > 0  ? [{ label: '+ H.sup ×1.50', value: p.overtimeAmount50,  color: C.textPrimary }] : []),
                  ...(p.overtimeAmount100 > 0 ? [{ label: '+ H.sup ×2.00', value: p.overtimeAmount100, color: C.textPrimary }] : []),
                  ...(p.totalBonuses > 0      ? [{ label: '+ Primes', value: p.totalBonuses, color: C.textPrimary }] : []),
                ] as { label: string; value: number; color: string }[]).map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: C.textSecondary }}>{label}</span>
                    <span style={{ color, fontWeight: 500 }}>
                      {value < 0 ? `−${fmt(-value)}` : fmt(value)}
                    </span>
                  </div>
                ))}

                {/* Brut */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 12,
                  fontWeight: 700, borderTop: `1px solid ${C.border}`,
                  paddingTop: 6, marginTop: 4,
                }}>
                  <span style={{ color: C.textSecondary }}>= Salaire brut</span>
                  <span style={{ color: C.textPrimary }}>{fmt(p.grossSalary)}</span>
                </div>

                {/* Déductions */}
                {[
                  { label: '− CNSS salarié (4%)', value: p.cnssSalarial, color: C.red },
                  { label: '− ITS',               value: p.its,          color: C.red },
                  ...(p.customTaxDetails.filter(t => t.employeeAmount > 0).map(t => ({
                    label: `− ${t.name} (${t.code})`, value: t.employeeAmount, color: C.red,
                  }))),
                  ...(row.advance > 0        ? [{ label: '− Avance',             value: row.advance,        color: C.amber }] : []),
                  ...(row.loanDeduction > 0  ? [{ label: '− Remboursement prêt', value: row.loanDeduction,  color: C.amber }] : []),
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color }}>{label}</span>
                    <span style={{ color }}>−{fmt(value)}</span>
                  </div>
                ))}

                {/* Net */}
                <div style={{
                  display: 'flex', justifyContent: 'space-between', fontSize: 13,
                  fontWeight: 700, borderTop: `1px solid ${C.border}`,
                  paddingTop: 6, marginTop: 4,
                }}>
                  <span style={{ color: C.emerald }}>= Net à payer</span>
                  <span style={{ color: C.emerald }}>{fmt(p.netSalary)}</span>
                </div>

                {/* Charges patronales */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 8, marginTop: 4 }}>
                  <p style={{ fontSize: 10, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                    Charges patronales
                  </p>
                  {[
                    { label: 'CNSS retraite (8%)',      value: p.cnssEmployerPension   },
                    { label: 'CNSS famille (10.03%)',    value: p.cnssEmployerFamily    },
                    { label: 'CNSS accidents (2.25%)',   value: p.cnssEmployerAccident  },
                    { label: 'TUS DGI (4.13%)',          value: p.tusDgiAmount          },
                    { label: 'TUS CNSS (3.38%)',         value: p.tusCnssAmount         },
                    ...p.customTaxDetails.filter(t => t.employerAmount > 0).map(t => ({
                      label: `${t.name} (${t.code})`, value: t.employerAmount,
                    })),
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                      <span style={{ color: C.textMuted }}>{label}</span>
                      <span style={{ color: C.violet }}>{fmt(value)}</span>
                    </div>
                  ))}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', fontSize: 12,
                    fontWeight: 700, borderTop: `1px solid ${C.border}`, paddingTop: 5, marginTop: 4,
                  }}>
                    <span style={{ color: C.textSecondary }}>Coût total employeur</span>
                    <span style={{ color: C.violet }}>{fmt(p.totalEmployerCost)}</span>
                  </div>
                </div>
              </div>
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
  const [selectedMonth,    setSelectedMonth]    = useState(now.getMonth());
  const [selectedYear,     setSelectedYear]     = useState(now.getFullYear());
  const [company,          setCompany]          = useState<CompanyInfo | null>(null);
  const [rows,             setRows]             = useState<EmployeeRow[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [launching,        setLaunching]        = useState(false);
  const [showMonthPicker,  setShowMonthPicker]  = useState(false);

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
        const employeeList: Employee[] = (emps.data ?? emps) as Employee[];

        const existingPayrolls: any[] = await api.get(
          `/payrolls?companyId=${companyId}&month=${selectedMonth + 1}&year=${selectedYear}&limit=200`,
        ).then((r: any) => r.data ?? r).catch(() => []);

        const payrollMap = new Map(existingPayrolls.map((p: any) => [p.employeeId, p]));

        setRows(employeeList.map(emp => {
          const existing = payrollMap.get(emp.id);
          return {
            employee: emp,
            workedDays:    existing?.workedDays    ?? 26,
            absentDays:    existing?.absentDays    ?? 0,
            overtime10:    existing?.overtime10    ?? 0,
            overtime25:    existing?.overtime25    ?? 0,
            overtime50:    existing?.overtime50    ?? 0,
            overtime100:   existing?.overtime100   ?? 0,
            bonuses:       (existing?.bonuses ?? []).map((b: any) => ({
              id: b.id ?? crypto.randomUUID(),
              label: b.bonusType ?? '', amount: b.amount ?? 0,
              isTaxable: b.isTaxable ?? true, isCnss: b.isCnss ?? true,
            })),
            advance:       existing?.advance       ?? 0,
            loanDeduction: existing?.loanDeduction ?? 0,
            preview:       existing?.calculation   ?? null,
            isCalculating: false, isExpanded: false,
            isDirty: !existing, isSaved: !!existing,
          };
        }));
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, [companyId, selectedMonth, selectedYear]);

  // ── Mise à jour d'une ligne ───────────────────────────────────────────────

  const updateRow = useCallback((empId: string, field: keyof EmployeeRow, value: any) => {
    setRows(prev => prev.map(r =>
      r.employee.id === empId
        ? { ...r, [field]: value, isDirty: field !== 'isExpanded' ? true : r.isDirty, isSaved: false }
        : r,
    ));
  }, []);

  // ── Calcul prévisuel ──────────────────────────────────────────────────────

  // rowsRef permet à calculateRow de lire l'état ACTUEL des rows sans stale closure
  // (problème : quand on calcule 200 employés en parallèle, chaque useCallback
  // capturait le même snapshot figé de rows → les données des autres employés
  // étaient perdues entre les appels batch)
  const rowsRef = useRef<EmployeeRow[]>(rows);
  useEffect(() => { rowsRef.current = rows; }, [rows]);

  const calculateRow = useCallback(async (empId: string) => {
    // Lire depuis la ref pour avoir les valeurs actuelles même en batch parallèle
    const row = rowsRef.current.find(r => r.employee.id === empId);
    if (!row) return;
    setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, isCalculating: true } : r));
    try {
      const preview: PayrollPreview = await api.post('/payrolls/simulate', {
        employeeId: empId, companyId,
        month: selectedMonth + 1, year: selectedYear,
        workedDays: row.workedDays,
        overtime10: row.overtime10, overtime25: row.overtime25,
        overtime50: row.overtime50, overtime100: row.overtime100,
        bonuses: row.bonuses.map(b => ({
          bonusType: b.label, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss,
        })),
        advanceAmount: row.advance, loanDeduction: row.loanDeduction,
      }) as PayrollPreview;
      setRows(prev => prev.map(r =>
        r.employee.id === empId ? { ...r, preview, isCalculating: false, isDirty: false } : r,
      ));
    } catch {
      setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, isCalculating: false } : r));
    }
  }, [companyId, selectedMonth, selectedYear]);

  // ── Sauvegarde ────────────────────────────────────────────────────────────

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
        bonuses: row.bonuses.map(b => ({
          bonusType: b.label, amount: b.amount, isTaxable: b.isTaxable, isCnss: b.isCnss,
        })),
      });
      setRows(prev => prev.map(r => r.employee.id === empId ? { ...r, isSaved: true } : r));
    } catch (e: any) { alert(`Erreur : ${e.message}`); }
  }, [rows, companyId, selectedMonth, selectedYear]);

  // ── Calculer tout — par batch de 10 en parallèle ──────────────────────────

  const [calcProgress, setCalcProgress] = useState<{ done: number; total: number } | null>(null);

  const calculateAll = async () => {
    // FIX : calculer TOUTES les lignes sans preview, pas seulement les isDirty.
    // Avant : rows sans modification manuelle avaient isDirty=false → fonction
    // retournait immédiatement sans rien calculer (le compteur tournait puis rien).
    const toCalc = rows.filter(r => !r.preview || r.isDirty);
    if (toCalc.length === 0) return;

    const BATCH = 5; // 5 en parallèle — plus stable sur Render gratuit (1 CPU)
    setCalcProgress({ done: 0, total: toCalc.length });

    for (let i = 0; i < toCalc.length; i += BATCH) {
      const batch = toCalc.slice(i, i + BATCH);
      await Promise.all(batch.map(row => calculateRow(row.employee.id)));
      setCalcProgress({ done: Math.min(i + BATCH, toCalc.length), total: toCalc.length });
    }

    setCalcProgress(null);
  };

  // ── Générer les bulletins ─────────────────────────────────────────────────

  const launchPayroll = async () => {
    const unready = rows.filter(r => !r.preview);
    if (unready.length > 0) {
      if (!confirm(`${unready.length} employé(s) sans calcul. Calculer automatiquement avant de lancer ?`)) return;
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

  // ── Totaux ────────────────────────────────────────────────────────────────

  const totals = rows.reduce((acc, r) => {
    if (!r.preview) return acc;
    return {
      brut:  acc.brut  + r.preview.grossSalary,
      net:   acc.net   + r.preview.netSalary,
      cnss:  acc.cnss  + r.preview.cnssEmployer,
      tus:   acc.tus   + r.preview.tusTotal,
      cout:  acc.cout  + r.preview.totalEmployerCost,
    };
  }, { brut: 0, net: 0, cnss: 0, tus: 0, cout: 0 });

  const readyCount = rows.filter(r => r.preview !== null).length;
  const savedCount = rows.filter(r => r.isSaved).length;
  const allReady   = readyCount === rows.length && rows.length > 0;

  // ─── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100%', background: C.pageBg }}>
        <Ico.Loader size={28} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%', background: C.pageBg }}>

      {/* ── Header de la page paie ── */}
      <div style={{
        padding: '14px 20px',
        borderBottom: `1px solid ${C.border}`,
        background: C.cardBg,
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}>

        {/* Ligne titre */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h1 style={{ fontSize: 16, fontWeight: 700, color: C.textPrimary }}>Saisie variables paie</h1>
            <span style={{ color: C.textMuted }}>·</span>

            {/* Sélecteur mois */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: 13,
                  color: C.cyan, background: 'none', border: 'none', cursor: 'pointer',
                  fontWeight: 600, padding: '3px 6px', borderRadius: 6,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(6,182,212,0.08)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'none')}
              >
                {MONTHS[selectedMonth]} {selectedYear}
                <Ico.ChevronDown size={11} color="currentColor" />
              </button>

              {showMonthPicker && (
                <div style={{
                  position: 'absolute', top: '110%', left: 0, zIndex: 100,
                  background: C.cardBg, border: `1px solid ${C.border}`,
                  borderRadius: 14, padding: 12,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  minWidth: 220,
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, marginBottom: 8 }}>
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => { setSelectedMonth(i); setShowMonthPicker(false); }}
                        style={{
                          padding: '6px 4px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                          fontWeight: i === selectedMonth ? 700 : 400,
                          background: i === selectedMonth ? C.indigo : 'transparent',
                          color: i === selectedMonth ? '#fff' : C.textSecondary,
                          border: 'none', transition: 'background 150ms',
                        }}
                        onMouseEnter={e => { if (i !== selectedMonth) (e.currentTarget.style.background = 'rgba(255,255,255,0.06)'); }}
                        onMouseLeave={e => { if (i !== selectedMonth) (e.currentTarget.style.background = 'transparent'); }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                      <button
                        key={y}
                        onClick={() => setSelectedYear(y)}
                        style={{
                          padding: '5px 10px', borderRadius: 8, fontSize: 11, cursor: 'pointer',
                          fontWeight: y === selectedYear ? 700 : 400,
                          background: y === selectedYear ? C.indigo : 'transparent',
                          color: y === selectedYear ? '#fff' : C.textSecondary,
                          border: 'none',
                        }}
                      >
                        {y}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span style={{ fontSize: 12, color: C.textMuted }}>
              {rows.length} employés · {readyCount} calculés · {savedCount} sauvegardés
            </span>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={calculateAll}
              disabled={!!calcProgress}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 10, fontSize: 13, cursor: calcProgress ? 'not-allowed' : 'pointer',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`,
                color: C.textSecondary, transition: 'all 150ms',
                opacity: calcProgress ? 0.7 : 1,
              }}
              onMouseEnter={e => {
                if (!calcProgress) {
                  (e.currentTarget.style.background = 'rgba(255,255,255,0.09)');
                  (e.currentTarget.style.color) = C.textPrimary;
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget.style.background = 'rgba(255,255,255,0.05)');
                (e.currentTarget.style.color) = C.textSecondary;
              }}
            >
              {calcProgress ? (
                <>
                  <Ico.Loader size={13} color={C.cyan} />
                  <span style={{ color: C.cyan }}>
                    {calcProgress.done}/{calcProgress.total}…
                  </span>
                </>
              ) : (
                <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M6.5 4v3l2 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  Calculer tout
                </>
              )}
            </button>

            <button
              onClick={launchPayroll}
              disabled={launching}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px',
                borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: launching ? 'not-allowed' : 'pointer',
                background: allReady ? C.emerald : C.indigo,
                color: '#fff', border: 'none',
                opacity: launching ? 0.6 : 1,
                transition: 'all 150ms',
              }}
              onMouseEnter={e => { if (!launching) (e.currentTarget.style.opacity = '0.88'); }}
              onMouseLeave={e => { if (!launching) (e.currentTarget.style.opacity = '1'); }}
            >
              {launching ? <Ico.Loader size={13} color="#fff" /> : <Ico.Payroll size={13} color="#fff" />}
              {launching ? 'Génération…' : 'Générer les bulletins'}
            </button>
          </div>
        </div>

        {/* Totaux live */}
        {readyCount > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 20, paddingTop: 10,
            borderTop: `1px solid ${C.border}`,
          }}>
            {[
              { label: 'Masse brute',    value: totals.brut, color: C.textPrimary },
              { label: 'Net total',      value: totals.net,  color: C.emerald     },
              { label: 'CNSS patronale', value: totals.cnss, color: C.violet      },
              { label: 'TUS',            value: totals.tus,  color: C.violet      },
              { label: 'Coût employeur', value: totals.cout, color: C.amber       },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p style={{ fontSize: 9, color: C.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
                  {label}
                </p>
                <p style={{ fontSize: 13, fontWeight: 700, color }}>
                  {fmt(value)}{' '}
                  <span style={{ fontSize: 10, fontWeight: 400, color: C.textMuted }}>F</span>
                </p>
              </div>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: allReady ? C.emerald : C.amber,
              }} />
              <span style={{ fontSize: 11, color: C.textMuted }}>
                {allReady ? 'Tous prêts' : `${rows.length - readyCount} en attente`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── En-têtes colonnes ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: GRID,
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderBottom: `1px solid ${C.border}`,
          background: 'rgba(255,255,255,0.02)',
          position: 'sticky',
          top: 0, // collera juste sous le header paie qui est sticky lui aussi
          zIndex: 10,
        }}
      >
        {[
          { label: 'Employé',    align: 'left'   },
          { label: 'Jours trav.',align: 'center' },
          { label: 'Absences',  align: 'center'  },
          { label: 'H.sup ×1.10', align: 'center' },
          { label: 'H.sup ×1.25', align: 'center' },
          { label: 'H.sup ×1.50', align: 'center' },
          { label: 'H.sup ×2.00', align: 'center' },
          { label: 'Avance (F)',  align: 'center' },
          { label: 'Prêt (F)',    align: 'center' },
          { label: 'Net estimé',  align: 'right'  },
          { label: 'Coût emp.',   align: 'right'  },
          { label: '',            align: 'right'  },
        ].map((h, i) => (
          <span key={i} style={{
            fontSize: 10, fontWeight: 600, letterSpacing: '0.05em',
            textTransform: 'uppercase', color: C.textMuted,
            textAlign: h.align as any,
            lineHeight: 1.3,
          }}>
            {h.label}
          </span>
        ))}
      </div>

      {/* ── Note réglementaire ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
        borderBottom: `1px solid ${C.border}`,
        background: 'rgba(99,102,241,0.04)',
      }}>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="5" stroke={C.indigoL} strokeWidth="1.2"/>
          <path d="M6 5v4M6 3.5v.5" stroke={C.indigoL} strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <p style={{ fontSize: 11, color: `${C.indigoL}cc` }}>
          Heures sup. — Décret N°78-360 : ×1.10 (5 premières h.), ×1.25 (suivantes), ×1.50 (nuit/repos/férié), ×2.00 (nuit dimanche/JF)
        </p>
      </div>

      {/* ── Lignes employés ── */}
      <div>
        {rows.map((row, i) => (
          <EmployeeRowComponent
            key={row.employee.id}
            row={row}
            index={i}
            onChange={(field, value) => updateRow(row.employee.id, field, value)}
            onCalculate={() => calculateRow(row.employee.id)}
            onSave={() => saveRow(row.employee.id)}
          />
        ))}
      </div>
    </div>
  );
}