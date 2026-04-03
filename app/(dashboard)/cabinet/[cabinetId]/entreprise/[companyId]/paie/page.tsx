'use client';

/**
 * Page saisie variables paie — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/paie
 *
 * Le gestionnaire du cabinet saisit ici toutes les variables du mois
 * pour chaque employé de la PME cliente. Konza calcule tout le reste.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronDown, ChevronUp, Plus, Trash2, Download,
  Play, Save, AlertCircle, CheckCircle2, Loader2,
  ArrowLeft, Info, FileText,
} from 'lucide-react';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  position: string;
  baseSalary: number;
  contractType: string;
}

interface Bonus {
  id: string;         // uuid temp pour le front
  label: string;
  amount: number;
  isTaxable: boolean;
  isCnss: boolean;
}

interface EmployeeRow {
  employee: Employee;
  // Variables saisies par le cabinet
  workedDays: number;
  absentDays: number;
  overtime10: number;   // +10% — 5 premières heures sup jour normal
  overtime25: number;   // +25% — heures suivantes jour normal
  overtime50: number;   // +50% — nuit, repos, jour férié
  overtime100: number;  // +100% — nuit dimanche / jour férié
  bonuses: Bonus[];
  advance: number;      // avance sur salaire ce mois
  loanDeduction: number; // remboursement prêt ce mois
  // Résultat calculé en temps réel
  preview: PayrollPreview | null;
  isCalculating: boolean;
  isExpanded: boolean;
  isDirty: boolean;     // modifié depuis dernier calcul
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
  // Charges patronales
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

// ─── Formatage ────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const initials = (f: string, l: string) =>
  `${f[0] ?? ''}${l[0] ?? ''}`.toUpperCase();

const avatarColor = (name: string) => {
  const colors = [
    'bg-purple-500/20 text-purple-400',
    'bg-cyan-500/20 text-cyan-400',
    'bg-emerald-500/20 text-emerald-400',
    'bg-amber-500/20 text-amber-400',
    'bg-pink-500/20 text-pink-400',
  ];
  return colors[name.charCodeAt(0) % colors.length];
};

// ─── Composant champ numérique ────────────────────────────────────────────────

function NumCell({
  value, onChange, highlight = false, min = 0, max, step = 1,
}: {
  value: number; onChange: (v: number) => void;
  highlight?: boolean; min?: number; max?: number; step?: number;
}) {
  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value || ''}
      placeholder="0"
      onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))}
      className={`w-full text-center text-sm py-2 px-1 rounded-lg outline-none transition-colors
        ${highlight && value > 0
          ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
          : 'bg-white/5 border border-white/10 text-white hover:border-white/20 focus:border-cyan-500/50'
        }`}
    />
  );
}

// ─── Composant ligne employé ──────────────────────────────────────────────────

function EmployeeRowComponent({
  row, onChange, onCalculate, onSave,
}: {
  row: EmployeeRow;
  onChange: (field: keyof EmployeeRow, value: any) => void;
  onCalculate: () => void;
  onSave: () => void;
}) {
  const p = row.preview;
  const { employee: emp } = row;

  const addBonus = () => {
    const newBonus: Bonus = {
      id: crypto.randomUUID(),
      label: '',
      amount: 0,
      isTaxable: true,
      isCnss: true,
    };
    onChange('bonuses', [...row.bonuses, newBonus]);
  };

  const updateBonus = (id: string, field: keyof Bonus, value: any) => {
    onChange('bonuses', row.bonuses.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const removeBonus = (id: string) => {
    onChange('bonuses', row.bonuses.filter(b => b.id !== id));
  };

  return (
    <div className={`border-b border-white/5 transition-colors ${row.isDirty ? 'bg-amber-500/3' : ''}`}>

      {/* Ligne principale */}
      <div className="grid items-center gap-2 px-4 py-3"
        style={{ gridTemplateColumns: '200px 80px 80px 70px 70px 70px 70px 90px 90px 110px 100px 90px' }}>

        {/* Employé */}
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${avatarColor(emp.firstName)}`}>
            {initials(emp.firstName, emp.lastName)}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{emp.firstName} {emp.lastName}</p>
            <p className="text-gray-500 text-[10px] truncate">{emp.position}</p>
          </div>
        </div>

        {/* Jours travaillés */}
        <NumCell value={row.workedDays} min={0} max={31}
          onChange={v => onChange('workedDays', v)} />

        {/* Jours absents */}
        <NumCell value={row.absentDays} highlight={row.absentDays > 0}
          onChange={v => onChange('absentDays', v)} />

        {/* Heures sup ×1.10 */}
        <NumCell value={row.overtime10} highlight={row.overtime10 > 0}
          onChange={v => onChange('overtime10', v)} />

        {/* Heures sup ×1.25 */}
        <NumCell value={row.overtime25} highlight={row.overtime25 > 0}
          onChange={v => onChange('overtime25', v)} />

        {/* Heures sup ×1.50 */}
        <NumCell value={row.overtime50} highlight={row.overtime50 > 0}
          onChange={v => onChange('overtime50', v)} />

        {/* Heures sup ×2.00 */}
        <NumCell value={row.overtime100} highlight={row.overtime100 > 0}
          onChange={v => onChange('overtime100', v)} />

        {/* Avance */}
        <NumCell value={row.advance} step={1000} highlight={row.advance > 0}
          onChange={v => onChange('advance', v)} />

        {/* Prêt */}
        <NumCell value={row.loanDeduction} step={1000} highlight={row.loanDeduction > 0}
          onChange={v => onChange('loanDeduction', v)} />

        {/* Net estimé */}
        <div className="text-right">
          {row.isCalculating ? (
            <Loader2 size={14} className="animate-spin text-gray-500 ml-auto" />
          ) : p ? (
            <span className="text-emerald-400 font-semibold text-sm">{fmt(p.netSalary)}</span>
          ) : row.isDirty ? (
            <span className="text-gray-600 text-xs">—</span>
          ) : (
            <span className="text-gray-600 text-xs">—</span>
          )}
        </div>

        {/* Coût employeur */}
        <div className="text-right">
          {p ? (
            <span className="text-purple-400 text-xs">{fmt(p.totalEmployerCost)}</span>
          ) : (
            <span className="text-gray-600 text-xs">—</span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 justify-end">
          {row.isDirty && (
            <button onClick={onCalculate}
              className="p-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-cyan-400 transition-colors"
              title="Recalculer">
              <Play size={11} />
            </button>
          )}
          {p && !row.isSaved && (
            <button onClick={onSave}
              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-emerald-400 transition-colors"
              title="Sauvegarder">
              <Save size={11} />
            </button>
          )}
          {row.isSaved && (
            <CheckCircle2 size={14} className="text-emerald-400" />
          )}
          <button
            onClick={() => onChange('isExpanded', !row.isExpanded)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
            {row.isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Détail déplié */}
      {row.isExpanded && (
        <div className="px-4 pb-4 grid grid-cols-2 gap-4 border-t border-white/5 pt-3">

          {/* Primes */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-400">Primes ce mois</p>
              <button onClick={addBonus}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors">
                <Plus size={12} /> Ajouter
              </button>
            </div>
            {row.bonuses.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Aucune prime ce mois</p>
            ) : (
              <div className="space-y-2">
                {row.bonuses.map(bonus => (
                  <div key={bonus.id} className="flex items-center gap-2">
                    <input
                      value={bonus.label}
                      onChange={e => updateBonus(bonus.id, 'label', e.target.value)}
                      placeholder="Libellé prime"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-cyan-500/50"
                    />
                    <input
                      type="number"
                      value={bonus.amount || ''}
                      onChange={e => updateBonus(bonus.id, 'amount', Number(e.target.value) || 0)}
                      placeholder="Montant"
                      className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white text-right outline-none focus:border-cyan-500/50"
                    />
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={bonus.isTaxable}
                        onChange={e => updateBonus(bonus.id, 'isTaxable', e.target.checked)}
                        className="rounded" />
                      ITS
                    </label>
                    <label className="flex items-center gap-1 text-xs text-gray-500 cursor-pointer">
                      <input type="checkbox" checked={bonus.isCnss}
                        onChange={e => updateBonus(bonus.id, 'isCnss', e.target.checked)}
                        className="rounded" />
                      CNSS
                    </label>
                    <button onClick={() => removeBonus(bonus.id)}
                      className="text-gray-600 hover:text-red-400 transition-colors">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Détail calcul */}
          {p && (
            <div className="bg-white/3 border border-white/5 rounded-xl p-3 space-y-1">
              <p className="text-xs font-medium text-gray-400 mb-2">Détail du calcul</p>

              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Salaire de base ajusté</span>
                  <span className="text-white">{fmt(p.adjustedBaseSalary)}</span>
                </div>
                {p.absenceDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-500">− Retenue absences</span>
                    <span className="text-amber-400">−{fmt(p.absenceDeduction)}</span>
                  </div>
                )}
                {p.totalOvertimeAmount > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-500">+ Heures sup (×1.10)</span>
                      <span className="text-white">+{fmt(p.overtimeAmount10)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">+ Heures sup (×1.25)</span>
                      <span className="text-white">+{fmt(p.overtimeAmount25)}</span>
                    </div>
                    {p.overtimeAmount50 > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">+ Heures sup (×1.50)</span>
                        <span className="text-white">+{fmt(p.overtimeAmount50)}</span>
                      </div>
                    )}
                    {p.overtimeAmount100 > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">+ Heures sup (×2.00)</span>
                        <span className="text-white">+{fmt(p.overtimeAmount100)}</span>
                      </div>
                    )}
                  </>
                )}
                {p.totalBonuses > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">+ Primes</span>
                    <span className="text-white">+{fmt(p.totalBonuses)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/5 pt-1 font-medium">
                  <span className="text-gray-400">= Salaire brut</span>
                  <span className="text-white">{fmt(p.grossSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">− CNSS salarié (4%)</span>
                  <span className="text-red-400">−{fmt(p.cnssSalarial)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-400">− ITS</span>
                  <span className="text-red-400">−{fmt(p.its)}</span>
                </div>
                {p.employeeCustomTaxTotal > 0 && (
                  <>
                    {p.customTaxDetails.filter(t => t.employeeAmount > 0).map(t => (
                      <div key={t.code} className="flex justify-between">
                        <span className="text-red-400">− {t.name} ({t.code})</span>
                        <span className="text-red-400">−{fmt(t.employeeAmount)}</span>
                      </div>
                    ))}
                  </>
                )}
                {row.advance > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-400">− Avance</span>
                    <span className="text-amber-400">−{fmt(row.advance)}</span>
                  </div>
                )}
                {row.loanDeduction > 0 && (
                  <div className="flex justify-between">
                    <span className="text-amber-400">− Remboursement prêt</span>
                    <span className="text-amber-400">−{fmt(row.loanDeduction)}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-white/5 pt-1 font-semibold">
                  <span className="text-emerald-400">= Net à payer</span>
                  <span className="text-emerald-400">{fmt(p.netSalary)}</span>
                </div>

                {/* Charges patronales */}
                <div className="border-t border-white/5 pt-2 mt-2">
                  <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1">Charges patronales</p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CNSS retraite (8%)</span>
                    <span className="text-purple-400">{fmt(p.cnssEmployerPension)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CNSS famille (10.03%)</span>
                    <span className="text-purple-400">{fmt(p.cnssEmployerFamily)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CNSS accidents (2.25%)</span>
                    <span className="text-purple-400">{fmt(p.cnssEmployerAccident)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TUS DGI (4.13%)</span>
                    <span className="text-purple-400">{fmt(p.tusDgiAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TUS CNSS (3.38%)</span>
                    <span className="text-purple-400">{fmt(p.tusCnssAmount)}</span>
                  </div>
                  {p.customTaxDetails.filter(t => t.employerAmount > 0).map(t => (
                    <div key={t.code} className="flex justify-between">
                      <span className="text-gray-500">{t.name} ({t.code})</span>
                      <span className="text-purple-400">{fmt(t.employerAmount)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-medium border-t border-white/5 pt-1">
                    <span className="text-gray-400">Coût total employeur</span>
                    <span className="text-purple-300">{fmt(p.totalEmployerCost)}</span>
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
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
  const [company, setCompany]             = useState<CompanyInfo | null>(null);
  const [rows, setRows]                   = useState<EmployeeRow[]>([]);
  const [loading, setLoading]             = useState(true);
  const [launching, setLaunching]         = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // ── Chargement des employés ───────────────────────────────────────────────

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

        // Vérifier si des bulletins existent déjà pour ce mois
        const existingPayrolls: any[] = await api.get(
          `/payrolls?companyId=${companyId}&month=${selectedMonth + 1}&year=${selectedYear}&limit=200`,
        ).then((r: any) => r.data ?? r).catch(() => []);

        const payrollMap = new Map(existingPayrolls.map((p: any) => [p.employeeId, p]));

        setRows(
          employeeList.map((emp) => {
            const existing = payrollMap.get(emp.id);
            return {
              employee:      emp,
              workedDays:    existing?.workedDays ?? 26,
              absentDays:    existing?.absentDays ?? 0,
              overtime10:    existing?.overtime10 ?? 0,
              overtime25:    existing?.overtime25 ?? 0,
              overtime50:    existing?.overtime50 ?? 0,
              overtime100:   existing?.overtime100 ?? 0,
              bonuses:       (existing?.bonuses ?? []).map((b: any) => ({
                id: b.id ?? crypto.randomUUID(),
                label: b.bonusType ?? '',
                amount: b.amount ?? 0,
                isTaxable: b.isTaxable ?? true,
                isCnss: b.isCnss ?? true,
              })),
              advance:       existing?.advance ?? 0,
              loanDeduction: existing?.loanDeduction ?? 0,
              preview:       existing?.calculation ?? null,
              isCalculating: false,
              isExpanded:    false,
              isDirty:       !existing,
              isSaved:       !!existing,
            };
          }),
        );
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
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

  // ── Calcul prévisuel pour un employé ─────────────────────────────────────

  const calculateRow = useCallback(async (empId: string) => {
    const row = rows.find(r => r.employee.id === empId);
    if (!row) return;

    setRows(prev => prev.map(r =>
      r.employee.id === empId ? { ...r, isCalculating: true } : r,
    ));

    try {
      const preview: PayrollPreview = await api.post('/payrolls/simulate', {
        employeeId:    empId,
        companyId,
        month:         selectedMonth + 1,
        year:          selectedYear,
        workedDays:    row.workedDays,
        overtime10:    row.overtime10,
        overtime25:    row.overtime25,
        overtime50:    row.overtime50,
        overtime100:   row.overtime100,
        bonuses:       row.bonuses.map(b => ({
          bonusType:  b.label,
          amount:     b.amount,
          isTaxable:  b.isTaxable,
          isCnss:     b.isCnss,
        })),
        advanceAmount:    row.advance,
        loanDeduction:    row.loanDeduction,
      }) as PayrollPreview;

      setRows(prev => prev.map(r =>
        r.employee.id === empId
          ? { ...r, preview, isCalculating: false, isDirty: false }
          : r,
      ));
    } catch {
      setRows(prev => prev.map(r =>
        r.employee.id === empId ? { ...r, isCalculating: false } : r,
      ));
    }
  }, [rows, companyId, selectedMonth, selectedYear]);

  // ── Calcul auto au changement de variable (debounce 800ms) ───────────────

  // ── Sauvegarder un bulletin ───────────────────────────────────────────────

  const saveRow = useCallback(async (empId: string) => {
    const row = rows.find(r => r.employee.id === empId);
    if (!row || !row.preview) return;

    try {
      await api.post('/payrolls', {
        employeeId:    empId,
        companyId,
        month:         MONTHS[selectedMonth],
        year:          selectedYear,
        workedDays:    row.workedDays,
        overtime10:    row.overtime10,
        overtime25:    row.overtime25,
        overtime50:    row.overtime50,
        overtime100:   row.overtime100,
        bonuses:       row.bonuses.map(b => ({
          bonusType: b.label,
          amount:    b.amount,
          isTaxable: b.isTaxable,
          isCnss:    b.isCnss,
        })),
      });

      setRows(prev => prev.map(r =>
        r.employee.id === empId ? { ...r, isSaved: true } : r,
      ));
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    }
  }, [rows, companyId, selectedMonth, selectedYear]);

  // ── Calculer tous les employés ────────────────────────────────────────────

  const calculateAll = async () => {
    for (const row of rows) {
      if (row.isDirty) await calculateRow(row.employee.id);
    }
  };

  // ── Lancer la paie complète ───────────────────────────────────────────────

  const launchPayroll = async () => {
    const unready = rows.filter(r => !r.preview);
    if (unready.length > 0) {
      if (!confirm(`${unready.length} employé(s) sans calcul. Calculer automatiquement avant de lancer ?`)) return;
      await calculateAll();
    }

    setLaunching(true);
    try {
      // Sauvegarder tous les non sauvegardés
      for (const row of rows) {
        if (!row.isSaved && row.preview) await saveRow(row.employee.id);
      }
      router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/bulletins?month=${selectedMonth + 1}&year=${selectedYear}`);
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setLaunching(false);
    }
  };

  // ── Totaux ────────────────────────────────────────────────────────────────

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

  const savedCount  = rows.filter(r => r.isSaved).length;
  const readyCount  = rows.filter(r => r.preview !== null).length;
  const allReady    = readyCount === rows.length && rows.length > 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* ── Header ── */}
      <div className="border-b border-white/10 bg-black/20 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => router.push(`/cabinet/${cabinetId}/dashboard`)}
                className="text-gray-500 hover:text-white transition-colors">
                <ArrowLeft size={16} />
              </button>
              <h1 className="text-lg font-bold text-white">
                {company?.tradeName || company?.legalName}
              </h1>
              <span className="text-gray-500 text-sm">·</span>
              <button
                onClick={() => setShowMonthPicker(!showMonthPicker)}
                className="flex items-center gap-1 text-cyan-400 text-sm font-medium hover:text-cyan-300 transition-colors">
                {MONTHS[selectedMonth]} {selectedYear}
                <ChevronDown size={14} />
              </button>
              {showMonthPicker && (
                <div className="absolute top-16 z-50 bg-gray-900 border border-white/10 rounded-xl p-3 shadow-xl">
                  <div className="grid grid-cols-3 gap-1 mb-2">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => { setSelectedMonth(i); setShowMonthPicker(false); }}
                        className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                          i === selectedMonth ? 'bg-cyan-500 text-black font-bold' : 'hover:bg-white/10 text-gray-300'
                        }`}>{m}</button>
                    ))}
                  </div>
                  <div className="flex gap-1 justify-center">
                    {[selectedYear - 1, selectedYear, selectedYear + 1].map(y => (
                      <button key={y} onClick={() => setSelectedYear(y)}
                        className={`px-3 py-1 rounded-lg text-xs transition-colors ${
                          y === selectedYear ? 'bg-cyan-500 text-black font-bold' : 'hover:bg-white/10 text-gray-300'
                        }`}>{y}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-gray-500 text-xs">
              {rows.length} employés · {readyCount} calculés · {savedCount} sauvegardés
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={calculateAll}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
              <Play size={14} /> Calculer tout
            </button>
            <button
              onClick={launchPayroll}
              disabled={launching}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                allReady
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
                  : 'bg-purple-500 hover:bg-purple-400 text-white'
              } disabled:opacity-50`}>
              {launching
                ? <Loader2 size={14} className="animate-spin" />
                : <FileText size={14} />}
              {launching ? 'Génération...' : 'Générer les bulletins'}
            </button>
          </div>
        </div>

        {/* Totaux live */}
        {readyCount > 0 && (
          <div className="flex gap-6 mt-4 pt-3 border-t border-white/5">
            {[
              { label: 'Masse salariale brute', value: fmt(totals.masseSalariale), color: 'text-white' },
              { label: 'Total net à payer',     value: fmt(totals.netTotal),       color: 'text-emerald-400' },
              { label: 'CNSS patronale',         value: fmt(totals.cnssPatronale),  color: 'text-purple-400' },
              { label: 'TUS total',              value: fmt(totals.tusTotal),       color: 'text-purple-400' },
              { label: 'Coût total employeur',   value: fmt(totals.coutTotal),      color: 'text-amber-400' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-gray-500 text-[10px] uppercase tracking-wider">{label}</p>
                <p className={`font-bold text-sm ${color}`}>{value} <span className="text-[10px] font-normal text-gray-600">FCFA</span></p>
              </div>
            ))}
            <div className="ml-auto flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${allReady ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span className="text-xs text-gray-500">
                {allReady ? 'Tous les employés sont prêts' : `${rows.length - readyCount} en attente de calcul`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Tableau ── */}
      <div className="overflow-x-auto">
        {/* En-têtes */}
        <div className="grid items-center gap-2 px-4 py-2 border-b border-white/10 bg-black/10 text-xs text-gray-500 uppercase tracking-wider"
          style={{ gridTemplateColumns: '200px 80px 80px 70px 70px 70px 70px 90px 90px 110px 100px 90px' }}>
          <span>Employé</span>
          <span className="text-center">Jours<br/>trav.</span>
          <span className="text-center">Absences</span>
          <span className="text-center">H.sup<br/>×1.10</span>
          <span className="text-center">H.sup<br/>×1.25</span>
          <span className="text-center">H.sup<br/>×1.50</span>
          <span className="text-center">H.sup<br/>×2.00</span>
          <span className="text-center">Avance<br/>(FCFA)</span>
          <span className="text-center">Prêt<br/>(FCFA)</span>
          <span className="text-right">Net estimé</span>
          <span className="text-right">Coût emp.</span>
          <span></span>
        </div>

        {/* Info heures sup */}
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/5 border-b border-blue-500/10">
          <Info size={12} className="text-blue-400 shrink-0" />
          <p className="text-xs text-blue-400/70">
            Heures sup conformes Décret N°78-360 : ×1.10 (5 premières h.), ×1.25 (suivantes), ×1.50 (nuit/férié), ×2.00 (nuit dimanche/JF)
          </p>
        </div>

        {/* Lignes */}
        {rows.map(row => (
          <EmployeeRowComponent
            key={row.employee.id}
            row={row}
            onChange={(field, value) => updateRow(row.employee.id, field, value)}
            onCalculate={() => calculateRow(row.employee.id)}
            onSave={() => saveRow(row.employee.id)}
          />
        ))}
      </div>
    </div>
  );
}