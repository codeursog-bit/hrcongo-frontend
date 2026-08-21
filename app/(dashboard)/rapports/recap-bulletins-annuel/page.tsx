'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Loader2, FileSpreadsheet, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

// ─── Types (miroir de das1-declaration.service.ts côté backend) ───────────

interface Das1IndemniteLine {
  label: string;
  amount: number;
}

interface Das1Bulletin {
  ordre: number;
  employeeId: string;
  employeeName: string;
  niu: string | null;
  position: string;
  address: string;
  city: string;
  phone: string | null;
  maritalStatusLabel: string;
  numberOfChildren: number;
  periodFrom: string;
  periodTo: string;
  montantEspeces: number;
  avantageNatureLogement: number;
  avantageNatureAutres: number;
  montantImposable80: number;
  irppRetenu: number;
  taxeDepartementale: number;
  tolRetenu: number;
  indemnitesNonImposables: Das1IndemniteLine[];
  totalIndemnitesNonImposables: number;
  moisPresence: number;
  moisConge: number;
  moisSansPaie: number;
}

interface Das1Declaration {
  year: number;
  companyName: string;
  companyActivity: string | null;
  companyAddress: string;
  companyCity: string;
  companyPhone: string;
  bulletins: Das1Bulletin[];
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR];

function fmt(val: number | undefined | null) {
  const n = Number(val ?? 0);
  if (!n) return '—';
  return n.toLocaleString('fr-FR');
}

export default function Das1Page() {
  const router = useRouter();
  const { bp } = useBasePath();

  const [year, setYear] = useState(CURRENT_YEAR - 1); // DAS 1 se déclare pour l'année N-1
  const [declaration, setDeclaration] = useState<Das1Declaration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await api.get<Das1Declaration>(`/reports/das1?year=${year}`);
        if (!cancelled) setDeclaration(data);
      } catch (e) {
        console.error(e);
        if (!cancelled) setDeclaration(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, [year]);

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await api.getBlob(`/reports/das1/export?year=${year}`);
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = `DAS1_${year}.xlsx`;
      a.click();
      URL.revokeObjectURL(href);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(false);
    }
  };

  const bulletins = declaration?.bulletins ?? [];

  return (
    <div className="max-w-[1400px] mx-auto pb-20 space-y-8">

      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(bp('/rapports'))}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
              Déclaration Annuelle des Salaires (DAS 1)
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Bulletin individuel par employé — modèle officiel DGI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-white"
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={handleExportExcel}
            disabled={!declaration || bulletins.length === 0 || exporting}
            className="px-4 py-2.5 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-600 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={18} className="animate-spin" /> : <FileSpreadsheet size={18} />}
            Exporter (modèle DAS 1)
          </button>
        </div>
      </div>

      <RapportsSubNav active="/rapports/das1" />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-sky-500" size={48} />
        </div>
      ) : !declaration || bulletins.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400">
          Aucun bulletin trouvé pour {year}.
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 dark:text-white">{declaration.companyName}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {declaration.companyActivity ? `${declaration.companyActivity} • ` : ''}
              {declaration.companyAddress}{declaration.companyCity ? `, ${declaration.companyCity}` : ''}
              {declaration.companyPhone ? ` • Tél. ${declaration.companyPhone}` : ''}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              {bulletins.length} bulletin{bulletins.length > 1 ? 's' : ''} individuel{bulletins.length > 1 ? 's' : ''} — Exercice {year}
            </p>
          </div>

          <div className="space-y-3">
            {bulletins.map((b) => {
              const isOpen = expanded === b.employeeId;
              return (
                <div key={b.employeeId} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setExpanded(isOpen ? null : b.employeeId)}
                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center text-xs font-bold">
                        {b.ordre}
                      </span>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white">{b.employeeName}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{b.position}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-400">Brut annuel</div>
                        <div className="font-bold text-gray-900 dark:text-white">{fmt(b.montantEspeces)}</div>
                      </div>
                      <div className="text-right hidden sm:block">
                        <div className="text-xs text-gray-400">IRPP retenu</div>
                        <div className="font-bold text-red-500">{fmt(b.irppRetenu)}</div>
                      </div>
                      {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-6 border-t border-gray-100 dark:border-gray-700 pt-4 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                      <div className="space-y-1.5">
                        <p className="text-xs uppercase text-gray-400 font-semibold">Personne rétribuée</p>
                        <p className="text-gray-700 dark:text-gray-300">NIU : {b.niu ?? '—'}</p>
                        <p className="text-gray-700 dark:text-gray-300">Adresse : {b.address}{b.city ? `, ${b.city}` : ''}</p>
                        <p className="text-gray-700 dark:text-gray-300">Tél : {b.phone ?? '—'}</p>
                        <p className="text-gray-700 dark:text-gray-300">Situation : {b.maritalStatusLabel} • {b.numberOfChildren} enfant{b.numberOfChildren > 1 ? 's' : ''} à charge</p>
                        <p className="text-gray-700 dark:text-gray-300">Période : du {b.periodFrom} au {b.periodTo}</p>
                        <p className="text-gray-700 dark:text-gray-300">
                          Présence : {b.moisPresence} mois payé{b.moisPresence > 1 ? 's' : ''}
                          {b.moisConge > 0 && ` • ${b.moisConge} mois en congé`}
                          {b.moisSansPaie > 0 && ` • ${b.moisSansPaie} mois sans bulletin (à vérifier)`}
                        </p>
                      </div>

                      <div className="space-y-1.5">
                        <p className="text-xs uppercase text-gray-400 font-semibold">I — Montant payé en espèces</p>
                        <div className="flex justify-between"><span className="text-gray-500">Total en espèces</span><span className="font-semibold text-gray-900 dark:text-white">{fmt(b.montantEspeces)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Imposable à l'IRPP (80%)</span><span className="font-semibold text-gray-900 dark:text-white">{fmt(b.montantImposable80)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">I.R.P.P. retenu</span><span className="font-semibold text-red-500">{fmt(b.irppRetenu)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">T. Départementale retenue</span><span className="font-semibold text-red-500">{fmt(b.taxeDepartementale)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">TOL retenu</span><span className="font-semibold text-red-500">{fmt(b.tolRetenu)}</span></div>

                        <p className="text-xs uppercase text-gray-400 font-semibold pt-2">II — Indemnités non imposables</p>
                        {b.indemnitesNonImposables.length === 0 ? (
                          <p className="text-gray-400 italic">Aucune</p>
                        ) : (
                          b.indemnitesNonImposables.map((l) => (
                            <div key={l.label} className="flex justify-between">
                              <span className="text-gray-500">{l.label}</span>
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400">{fmt(l.amount)}</span>
                            </div>
                          ))
                        )}
                        <div className="flex justify-between border-t border-gray-100 dark:border-gray-700 pt-1">
                          <span className="text-gray-500 font-medium">Total indemnités</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{fmt(b.totalIndemnitesNonImposables)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}