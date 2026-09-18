'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, RefreshCw, Info, Building2,
} from 'lucide-react';
import { api } from '@/services/api';
import RapportsSubNav from '@/components/RapportsSubNav';
import PeriodSelector, { PeriodValue } from '@/components/PeriodSelector';

// ─── TYPES (miroir de FiscalBreakdown côté backend) ─────────────────────────
interface FiscalMonthlyAmount {
  month: number;
  its: number;
  bnc10: number;
  bnc20: number;
}
interface FiscalEmployeeRow {
  employeeId: string;
  employeeName: string;
  matricule: string | null;
  departmentId: string | null;
  departmentName: string;
  contractType: string;
  category: 'ITS' | 'BNC_10' | 'BNC_20' | 'EXONERE' | 'AGENCE';
  monthly: FiscalMonthlyAmount[];
  annualIts: number;
  annualBnc10: number;
  annualBnc20: number;
}
interface FiscalDepartmentRow {
  departmentId: string | null;
  departmentName: string;
  monthly: FiscalMonthlyAmount[];
  annualIts: number;
  annualBnc10: number;
  annualBnc20: number;
}
interface FiscalBreakdown {
  year: number;
  employees: FiscalEmployeeRow[];
  byDepartment: FiscalDepartmentRow[];
  totals: {
    monthly: FiscalMonthlyAmount[];
    annualIts: number;
    annualBnc10: number;
    annualBnc20: number;
  };
}

type ViewMode = 'ITS' | 'BNC_10' | 'BNC_20';

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

const fmt = (n: number) => new Intl.NumberFormat('fr-FR').format(Math.round(n || 0));

const CATEGORY_LABEL: Record<string, string> = {
  ITS: 'ITS (barème progressif)',
  BNC_10: 'BNC 10% — prestataire résident',
  BNC_20: 'BNC 20% — prestataire non-résident',
  EXONERE: 'Exonéré (stage)',
  AGENCE: 'Géré par l\u2019agence (intérim)',
};

function amountFor(row: { monthly: FiscalMonthlyAmount[] }, view: ViewMode, month: number) {
  const slot = row.monthly[month - 1];
  if (!slot) return 0;
  if (view === 'ITS') return slot.its;
  if (view === 'BNC_10') return slot.bnc10;
  return slot.bnc20;
}
function annualFor(row: { annualIts: number; annualBnc10: number; annualBnc20: number }, view: ViewMode) {
  if (view === 'ITS') return row.annualIts;
  if (view === 'BNC_10') return row.annualBnc10;
  return row.annualBnc20;
}

export default function ItsBncPage() {
  const currentYear = new Date().getFullYear();
  // ✅ "ANNEE" = vue mensuelle détaillée sur une année (comportement
  // d'origine). "PLAGE" = comparaison sur plusieurs années (ex. 2020→2023),
  // demandée pour pouvoir répondre à "combien Nathan a payé d'ITS chaque
  // année sur 3 ans" sans ouvrir un rapport par année.
  const [period, setPeriod] = useState<PeriodValue>({ mode: 'ANNEE', month: 1, year: currentYear });
  const [view, setView] = useState<ViewMode>('ITS');
  const [data, setData] = useState<FiscalBreakdown | null>(null);
  const [rangeData, setRangeData] = useState<Record<number, FiscalBreakdown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isRange = period.mode === 'PLAGE';
  const rangeYears = isRange
    ? Array.from({ length: (period.yearTo ?? period.year) - period.year + 1 }, (_, i) => period.year + i)
    : [];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (isRange) {
        const results = await Promise.all(
          rangeYears.map((y) => api.get<FiscalBreakdown>(`/reports/fiscal-breakdown?year=${y}`)),
        );
        const map: Record<number, FiscalBreakdown> = {};
        rangeYears.forEach((y, i) => { map[y] = results[i]; });
        setRangeData(map);
        setData(null);
      } else {
        const res = await api.get<FiscalBreakdown>(`/reports/fiscal-breakdown?year=${period.year}`);
        setData(res);
        setRangeData(null);
      }
    } catch (e: any) {
      setError(e?.message ?? 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period.mode, period.year, period.yearTo]);

  useEffect(() => { load(); }, [load]);

  // Seuls les salariés qui ont au moins une ligne pertinente pour la vue
  // active sont affichés — on ne montre jamais un BNC 20% dans la vue ITS,
  // et inversement, pour ne jamais laisser croire à un mélange.
  const relevantCategory: Record<ViewMode, FiscalEmployeeRow['category']> = {
    ITS: 'ITS',
    BNC_10: 'BNC_10',
    BNC_20: 'BNC_20',
  };
  const employeesForView = (data?.employees ?? []).filter(
    (e) => e.category === relevantCategory[view],
  );

  // Regroupement par département, uniquement parmi les salariés pertinents
  const byDept = new Map<string, FiscalEmployeeRow[]>();
  for (const e of employeesForView) {
    const key = e.departmentId ?? '__none__';
    const list = byDept.get(key) ?? [];
    list.push(e);
    byDept.set(key, list);
  }

  const totalAnnual = data ? annualFor(data.totals as any, view) : 0;

  // ✅ Vue "Plusieurs années" — mêmes règles (jamais mélanger ITS/BNC), mais
  // une colonne par année plutôt que par mois. Répond directement à "combien
  // X a payé d'ITS chaque année entre 2020 et 2023".
  type RangeRow = {
    employeeId: string;
    employeeName: string;
    matricule: string | null;
    departmentName: string;
    perYear: Record<number, number>;
    total: number;
  };
  const rangeRows: RangeRow[] = [];
  if (isRange && rangeData) {
    const map = new Map<string, RangeRow>();
    for (const y of rangeYears) {
      const brk = rangeData[y];
      if (!brk) continue;
      for (const e of brk.employees) {
        if (e.category !== relevantCategory[view]) continue;
        let row = map.get(e.employeeId);
        if (!row) {
          row = {
            employeeId: e.employeeId,
            employeeName: e.employeeName,
            matricule: e.matricule,
            departmentName: e.departmentName,
            perYear: {},
            total: 0,
          };
          map.set(e.employeeId, row);
        }
        const amount = annualFor(e, view);
        row.perYear[y] = amount;
        row.total += amount;
      }
    }
    rangeRows.push(...Array.from(map.values()).sort((a, b) => a.employeeName.localeCompare(b.employeeName)));
  }
  const rangeTotalsPerYear: Record<number, number> = {};
  rangeYears.forEach((y) => {
    rangeTotalsPerYear[y] = rangeRows.reduce((s, r) => s + (r.perYear[y] ?? 0), 0);
  });
  const rangeGrandTotal = rangeRows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <RapportsSubNav active="/rapports/its-bnc" />

      <div className="flex items-center justify-between mt-6 mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Répartition ITS / BNC</h1>
          <p className="text-sm text-gray-500 mt-1">
            Par salarié, par mois et par département — les trois impôts ne sont jamais additionnés entre eux.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodSelector value={period} onChange={setPeriod} modes={['ANNEE', 'PLAGE']} />
          <button
            onClick={load}
            className="flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4" /> Actualiser
          </button>
        </div>
      </div>

      {/* Bandeau de contrôle — comparer avant tout export */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          Comparez ce total annuel avec la somme des déclarations mensuelles déjà reversées à la DGI
          avant de déposer le DAS ou d\u2019exporter le Bulletin Annuel. Un écart n\u2019est pas forcément une
          erreur, mais il doit être expliqué.
        </p>
      </div>

      {/* Sélecteur de vue — jamais deux impôts dans le même tableau */}
      <div className="flex gap-2 mb-4">
        {(['ITS', 'BNC_10', 'BNC_20'] as ViewMode[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 text-sm rounded-lg border ${
              view === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {CATEGORY_LABEL[v]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Chargement...
        </div>
      ) : error ? (
        <div className="text-red-600 text-sm py-8">{error}</div>
      ) : isRange ? (
        rangeRows.length === 0 ? (
          <div className="text-gray-400 text-sm py-12 text-center border rounded-xl">
            Aucun salarié dans la catégorie « {CATEGORY_LABEL[view]} » sur {period.year}–{period.yearTo}.
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-3">
              Total {CATEGORY_LABEL[view]} sur {period.year}–{period.yearTo} :{' '}
              <span className="font-semibold text-gray-900">{fmt(rangeGrandTotal)} FCFA</span>
            </div>
            <div className="overflow-x-auto border rounded-xl">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600 sticky left-0 bg-gray-50">Salarié</th>
                    {rangeYears.map((y) => (
                      <th key={y} className="text-right px-3 py-2 font-medium text-gray-500 whitespace-nowrap">{y}</th>
                    ))}
                    <th className="text-right px-3 py-2 font-semibold text-gray-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rangeRows.map((r) => (
                    <tr key={r.employeeId} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2 sticky left-0 bg-white">
                        <div className="font-medium text-gray-900">{r.employeeName}</div>
                        {r.matricule && <div className="text-xs text-gray-400">{r.matricule}</div>}
                        <div className="text-xs text-gray-400">{r.departmentName}</div>
                      </td>
                      {rangeYears.map((y) => {
                        const amount = r.perYear[y] ?? 0;
                        return (
                          <td key={y} className="text-right px-3 py-2 text-gray-700">
                            {amount > 0 ? fmt(amount) : <span className="text-gray-300">—</span>}
                          </td>
                        );
                      })}
                      <td className="text-right px-3 py-2 font-semibold text-gray-900">{fmt(r.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-900 text-white">
                    <td className="px-3 py-2 font-semibold sticky left-0 bg-gray-900">TOTAL {CATEGORY_LABEL[view]}</td>
                    {rangeYears.map((y) => (
                      <td key={y} className="text-right px-3 py-2 font-medium">{fmt(rangeTotalsPerYear[y])}</td>
                    ))}
                    <td className="text-right px-3 py-2 font-bold">{fmt(rangeGrandTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )
      ) : employeesForView.length === 0 ? (
        <div className="text-gray-400 text-sm py-12 text-center border rounded-xl">
          Aucun salarié dans la catégorie « {CATEGORY_LABEL[view]} » pour {period.year}.
        </div>
      ) : (
        <>
          <div className="text-sm text-gray-600 mb-3">
            Total annuel {CATEGORY_LABEL[view]} : <span className="font-semibold text-gray-900">{fmt(totalAnnual)} FCFA</span>
          </div>

          <div className="overflow-x-auto border rounded-xl">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-600 sticky left-0 bg-gray-50">Salarié</th>
                  {MOIS.map((m) => (
                    <th key={m} className="text-right px-2 py-2 font-medium text-gray-500 whitespace-nowrap">{m}</th>
                  ))}
                  <th className="text-right px-3 py-2 font-semibold text-gray-700">Total {period.year}</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(byDept.entries()).map(([deptKey, rows]) => {
                  const deptName = rows[0]?.departmentName ?? 'Sans département';
                  const deptTotal = rows.reduce((s, r) => s + annualFor(r, view), 0);
                  return (
                    <React.Fragment key={deptKey}>
                      <tr className="bg-gray-100">
                        <td colSpan={14} className="px-3 py-1.5 text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5" /> {deptName}
                          <span className="ml-2 text-gray-400 font-normal">
                            ({fmt(deptTotal)} FCFA sur l\u2019année)
                          </span>
                        </td>
                      </tr>
                      {rows.map((r) => (
                        <tr key={r.employeeId} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-3 py-2 sticky left-0 bg-white">
                            <div className="font-medium text-gray-900">{r.employeeName}</div>
                            {r.matricule && <div className="text-xs text-gray-400">{r.matricule}</div>}
                          </td>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                            const amount = amountFor(r, view, m);
                            return (
                              <td key={m} className="text-right px-2 py-2 text-gray-700">
                                {amount > 0 ? fmt(amount) : <span className="text-gray-300">—</span>}
                              </td>
                            );
                          })}
                          <td className="text-right px-3 py-2 font-semibold text-gray-900">
                            {fmt(annualFor(r, view))}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-gray-900 text-white">
                  <td className="px-3 py-2 font-semibold sticky left-0 bg-gray-900">TOTAL {CATEGORY_LABEL[view]}</td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <td key={m} className="text-right px-2 py-2 font-medium">
                      {fmt(amountFor({ monthly: data!.totals.monthly } as any, view, m))}
                    </td>
                  ))}
                  <td className="text-right px-3 py-2 font-bold">{fmt(totalAnnual)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  );
}