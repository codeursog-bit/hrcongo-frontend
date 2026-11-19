'use client';
import { ModuleSelect } from '@/components/ui/ModuleSelect';


import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, Calendar, Users, ChevronDown, ChevronUp, Briefcase, Globe } from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { api } from '@/services/api';

/**
 * 🆕 Composant SÉPARÉ (Phase 4) — Liste des employés présents à un mois/année
 * donné, avec recherche par nom et pagination "Voir plus".
 *
 * IMPORTANT : la recherche interroge le backend (pas un filtre local sur les
 * 25 déjà affichés), donc un employé est toujours trouvé peu importe où il
 * se trouverait dans la liste complète — la recherche réduit d'abord
 * l'ensemble des résultats, puis on paginate ce qui a été trouvé.
 *
 * Affiché comme section dépliable en bas de la page Rapport Effectifs, pour
 * ne pas mélanger la liste brute avec les graphiques.
 */

const MONTHS = [
  { value: 1, label: 'Janvier' }, { value: 2, label: 'Février' }, { value: 3, label: 'Mars' },
  { value: 4, label: 'Avril' }, { value: 5, label: 'Mai' }, { value: 6, label: 'Juin' },
  { value: 7, label: 'Juillet' }, { value: 8, label: 'Août' }, { value: 9, label: 'Septembre' },
  { value: 10, label: 'Octobre' }, { value: 11, label: 'Novembre' }, { value: 12, label: 'Décembre' },
];

const PAGE_SIZE = 25;

interface MonthlyEmployee {
  id: string;
  name: string;
  employeeNumber: string;
  position: string;
  department: string | null;
  contractType: string;
  nationality: string | null;
  hireDate: string;
  gender: string;
}

interface Props {
  availableYears?: number[];
  // 🆕 hérite des filtres de la page (département/contrat/nationalité) pour rester cohérent
  department?: string;
  contractType?: string;
  nationality?: string;
  defaultOpen?: boolean;
}

export default function EffectifMonthlyList({
  availableYears,
  department = 'Tous',
  contractType = 'Tous',
  nationality = 'Tous',
  defaultOpen = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [employees, setEmployees] = useState<MonthlyEmployee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Debounce la recherche pour ne pas spammer l'API à chaque frappe
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Une recherche ou un changement de mois/année repart de la 1ère page
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [debouncedSearch, month, year, department, contractType, nationality]);

  const fetchList = useCallback(async () => {
    if (!open) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('year', String(year));
      params.set('month', String(month));
      params.set('limit', String(visibleCount));
      params.set('page', '1');
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (department !== 'Tous') params.set('department', department);
      if (contractType !== 'Tous') params.set('contractType', contractType);
      if (nationality !== 'Tous') params.set('nationality', nationality);

      const res = await api.get<{ data: MonthlyEmployee[]; total: number }>(
        `/reports/workforce/employees?${params}`
      );
      setEmployees(res?.data || []);
      setTotal(res?.total || 0);
    } catch (e) {
      console.error('Erreur chargement effectif mensuel', e);
      setEmployees([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [open, year, month, visibleCount, debouncedSearch, department, contractType, nationality]);

  useEffect(() => { fetchList(); }, [fetchList]);

  const years = availableYears?.length ? availableYears : [new Date().getFullYear()];
  const hasMore = employees.length < total;

  return (
    <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm overflow-hidden reports-card">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-5 py-4"
      >
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
          <Users strokeWidth={1.5} size={16} className="text-[var(--action)]" />
          Liste des employés par mois / année
          {total > 0 && <span className="text-xs font-normal text-[var(--text-secondary)]">— {total} trouvé{total > 1 ? 's' : ''}</span>}
        </div>
        {open ? <ChevronUp strokeWidth={1.5} size={18} className="text-[var(--text-secondary)]" /> : <ChevronDown strokeWidth={1.5} size={18} className="text-[var(--text-secondary)]" />}
      </button>

      {open && (
        <div className="px-5 pb-5 border-t border-[var(--border)] pt-4">
          {/* Barre de contrôle : mois, année, recherche */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Calendar strokeWidth={1.5} size={15} className="text-[var(--text-secondary)]" />
              <ModuleSelect
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                className="text-sm font-medium bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)]"
              >
                {MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </ModuleSelect>
              <ModuleSelect
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="text-sm font-medium bg-[var(--surface-2)] border border-[var(--border)] rounded-xl px-3 py-2 text-[var(--text)]"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </ModuleSelect>
            </div>

            <div className="relative flex-1 min-w-[220px]">
              <Search strokeWidth={1.5} size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un employé par nom..."
                className="w-full text-sm bg-[var(--surface-2)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-[var(--text)] placeholder:text-[var(--text-secondary)]"
              />
            </div>
          </div>

          {/* Liste */}
          {loading && employees.length === 0 ? (
            <KonzaLoader variant="section" />
          ) : employees.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)] text-center py-10">
              {debouncedSearch
                ? `Aucun employé nommé "${debouncedSearch}" présent à cette période.`
                : "Aucun employé présent à cette période."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto -mx-5 px-5">
                <div className="reports-table-region" role="region" aria-label="Données du rapport" tabIndex={0}><table data-report-table className="w-full text-sm reports-table">
                  <thead>
                    <tr className="text-left text-xs  text-[var(--text-secondary)] border-b border-[var(--border)]">
                      <th className="py-2 pr-3 font-semibold">Employé</th>
                      <th className="py-2 pr-3 font-semibold">Poste</th>
                      <th className="py-2 pr-3 font-semibold">Département</th>
                      <th className="py-2 pr-3 font-semibold">Contrat</th>
                      <th className="py-2 pr-3 font-semibold">Nationalité</th>
                      <th className="py-2 pr-3 font-semibold">Embauché(e) le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((e) => (
                      <tr key={e.id} className="border-b border-[var(--border)] last:border-0">
                        <td className="py-2.5 pr-3">
                          <p className="font-semibold text-[var(--text)]">{e.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{e.employeeNumber}</p>
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{e.position || '—'}</td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{e.department || '—'}</td>
                        <td className="py-2.5 pr-3">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--action)]">
                            {e.contractType || '—'}
                          </span>
                        </td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)]">{e.nationality || 'Non renseigné'}</td>
                        <td className="py-2.5 pr-3 text-[var(--text-secondary)]">
                          {e.hireDate ? new Date(e.hireDate).toLocaleDateString('fr-FR') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table></div>
              </div>

              {hasMore && (
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                    disabled={loading}
                    className="text-sm font-semibold text-[var(--action)] hover:text-[var(--action)] px-4 py-2 rounded-xl border border-[var(--border)] hover:bg-[var(--brand-soft)] flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? <Loader2 strokeWidth={1.5} size={14} className="animate-spin" /> : null}
                    Voir plus ({employees.length} / {total})
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}