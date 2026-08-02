'use client';

// ============================================================================
// 📁 app/(dashboard)/conges/programme/page.tsx
// ✅ "Planning des congés" — programme des départs façon Excel (inspiré du
//    modèle Orca : colonnes nom/département/type/dates/jours/statut),
//    filtrable par mois/type/sous-type. Distinct de "Gestion" (qui a les KPI
//    et la fiche employé) — celle-ci est la liste de référence à consulter/
//    imprimer, réutilise le même endpoint pour garantir des chiffres cohérents.
// ============================================================================

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Filter, Umbrella, Zap, Stethoscope, Sparkles, Lock, Unlock, Download, FileDown } from 'lucide-react';
import { api } from '@/services/api';
import CongeSubNav from '@/components/CongeSubNav';

interface LeaveEvent {
  id: string;
  employeeId: string;
  kind: 'LEAVE' | 'ABSENCE';
  employee: { firstName: string; lastName: string; position?: string; department?: { name: string } };
  type: string;
  subType: string | null;
  startDate: string;
  endDate: string;
  daysCount: number;
  status: string;
  isPaid: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annuel', ANNUAL_ANTICIPATED: 'Annuel anticipé',
  CONVENTIONNELLE: 'Conventionnelle', EXCEPTIONNELLE: 'Exceptionnelle',
};
const SUBTYPE_LABELS: Record<string, string> = {
  MALADIE: 'Maladie', MATERNITE: 'Maternité', PATERNITE: 'Paternité',
  MARIAGE: 'Mariage', DECES: 'Décès', NAISSANCE: 'Naissance', AUTRE: 'Autre',
};
const TYPE_ICONS: Record<string, any> = {
  ANNUAL: Umbrella, ANNUAL_ANTICIPATED: Zap, CONVENTIONNELLE: Stethoscope, EXCEPTIONNELLE: Sparkles,
};
const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', APPROVED: 'Approuvé', REJECTED: 'Refusé', CANCELLED: 'Annulé',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400',
  APPROVED: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
  REJECTED: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400',
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('fr-FR');
}

export default function ProgrammeCongesPage() {
  const [userRole, setUserRole] = useState('');
  const [company, setCompany] = useState<any>(null);
  const [events, setEvents] = useState<LeaveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [typeFilter, setTypeFilter] = useState('');
  const [subTypeFilter, setSubTypeFilter] = useState('');

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUserRole(JSON.parse(raw)?.role || '');
    } catch {}
    (async () => {
      try {
        const me: any = await api.get('/auth/me');
        setCompany(me?.company ?? null);
      } catch (e) {
        console.error('Erreur chargement entreprise', e);
      }
    })();
  }, []);

  const load = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      if (typeFilter) params.set('type', typeFilter);
      if (subTypeFilter) params.set('subType', subTypeFilter);
      const data = await api.get<{ events: LeaveEvent[] }>(`/leaves/management-overview?${params.toString()}`);
      setEvents(data.events.filter(e => e.status === 'APPROVED')); // Programme = départs confirmés uniquement
    } catch (e) {
      console.error('Erreur chargement programme des congés', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [month, year, typeFilter, subTypeFilter]);

  const subTypeOptions = useMemo(() => {
    if (typeFilter === 'CONVENTIONNELLE') return ['MALADIE', 'MATERNITE', 'PATERNITE', 'AUTRE'];
    if (typeFilter === 'EXCEPTIONNELLE') return ['MARIAGE', 'DECES', 'NAISSANCE', 'AUTRE'];
    return [];
  }, [typeFilter]);

  const totalDays = events.reduce((s, e) => s + e.daysCount, 0);

  const handleExportCsv = () => {
    const header = ['Nom', 'Département', 'Type', 'Sous-motif', 'Date de départ', 'Date de retour', 'Jours', 'Payé'];
    const rows = events.map(e => [
      `${e.employee.lastName} ${e.employee.firstName}`,
      e.employee.department?.name || '',
      TYPE_LABELS[e.type] || e.type,
      e.subType ? (SUBTYPE_LABELS[e.subType] || e.subType) : '',
      fmtDate(e.startDate),
      fmtDate(e.endDate),
      String(e.daysCount),
      e.kind === 'LEAVE' ? 'Oui' : (e.isPaid ? 'Oui' : 'Non'),
    ]);
    const csv = [header, ...rows].map(r => r.map(c => `"${c}"`).join(';')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `programme-conges-${year}-${String(month).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      <CongeSubNav userRole={userRole} />

      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Planning des congés</h1>
          <p className="text-sm text-gray-400">Programme des départs confirmés — {totalDays} jour(s) au total sur la période</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCsv}
            disabled={!events.length}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-sm font-bold disabled:opacity-40"
          >
            <Download size={15} /> Exporter (CSV)
          </button>
          {company?.documentTemplate === 'ORCA' && (
            <button
              onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/leaves/planning/document.xlsx?month=${month}&year=${year}`, '_blank')}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 text-sky-700 dark:text-sky-300 rounded-xl text-sm font-bold hover:bg-sky-100 dark:hover:bg-sky-900/40"
              title="Télécharger le fichier Excel original rempli"
            >
              <FileDown size={15} /> Programme (.xlsx)
            </button>
          )}
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 mb-4 flex flex-wrap items-center gap-2">
        <Filter size={16} className="text-gray-400" />
        <select value={month} onChange={e => setMonth(Number(e.target.value))} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
            <option key={m} value={m}>{new Date(2000, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long' })}</option>
          ))}
        </select>
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setSubTypeFilter(''); }} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
          <option value="">Tous les types</option>
          <option value="ANNUAL">Annuel</option>
          <option value="ANNUAL_ANTICIPATED">Annuel anticipé</option>
          <option value="CONVENTIONNELLE">Conventionnelle</option>
          <option value="EXCEPTIONNELLE">Exceptionnelle</option>
        </select>
        {subTypeOptions.length > 0 && (
          <select value={subTypeFilter} onChange={e => setSubTypeFilter(e.target.value)} className="text-sm border border-gray-200 dark:border-gray-700 dark:bg-gray-900 rounded-lg px-2 py-1.5">
            <option value="">Tous les sous-motifs</option>
            {subTypeOptions.map(s => <option key={s} value={s}>{SUBTYPE_LABELS[s]}</option>)}
          </select>
        )}
      </div>

      {/* Programme — colonnes façon Excel */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-sky-500" size={28} /></div>
        ) : !events.length ? (
          <div className="text-center py-16 text-gray-400 text-sm">Aucun départ confirmé sur cette période avec ces filtres.</div>
        ) : (
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                <th className="px-4 py-3">Nom</th>
                <th className="px-4 py-3">Département</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date de départ</th>
                <th className="px-4 py-3">Date de retour</th>
                <th className="px-4 py-3">Jours</th>
                <th className="px-4 py-3">Payé</th>
              </tr>
            </thead>
            <tbody>
              {events.map(ev => {
                const Icon = TYPE_ICONS[ev.type] || Umbrella;
                const isPaid = ev.kind === 'LEAVE' ? true : ev.isPaid;
                return (
                  <tr key={`${ev.kind}-${ev.id}`} className="border-b border-gray-50 dark:border-gray-700/50">
                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{ev.employee.lastName} {ev.employee.firstName}</td>
                    <td className="px-4 py-3 text-gray-500">{ev.employee.department?.name || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Icon size={14} className="text-gray-400" />
                        {TYPE_LABELS[ev.type] || ev.type}{ev.subType ? ` · ${SUBTYPE_LABELS[ev.subType] || ev.subType}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(ev.startDate)}</td>
                    <td className="px-4 py-3 text-gray-500">{fmtDate(ev.endDate)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">{ev.daysCount}j</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${isPaid ? 'text-emerald-500' : 'text-gray-400'}`}>
                        {isPaid ? <Unlock size={12} /> : <Lock size={12} />} {isPaid ? 'Oui' : 'Non'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}