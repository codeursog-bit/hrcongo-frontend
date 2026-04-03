'use client';

/**
 * Page déclarations — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/declarations
 *
 * Récapitulatif mensuel CNSS + TUS + ITS à déclarer.
 * Le cabinet prépare ces documents pour son client PME.
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Download, Loader2, ChevronDown, FileText } from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

interface DeclarationSummary {
  month: number;
  year: number;
  employeeCount: number;
  // CNSS salariale
  totalGrossSalary: number;
  totalCnssSalarial: number;
  // CNSS patronale
  cnssEmployerPension: number;
  cnssEmployerFamily: number;
  cnssEmployerAccident: number;
  totalCnssEmployer: number;
  // TUS
  tusDgiAmount: number;
  tusCnssAmount: number;
  tusTotal: number;
  // ITS
  totalIts: number;
  // Taxes custom
  customTaxDetails: Array<{ name: string; code: string; employeeTotal: number; employerTotal: number }>;
  // Totaux
  totalSalarialDeductions: number;
  totalEmployerCharges: number;
  grandTotal: number;
}

export default function DeclarationsPage() {
  const params      = useParams();
  const searchParams = useSearchParams();
  const router      = useRouter();
  const cabinetId   = params.cabinetId as string;
  const companyId   = params.companyId as string;

  const now = new Date();
  const [month, setMonth] = useState(Number(searchParams.get('month') ?? now.getMonth() + 1));
  const [year,  setYear]  = useState(Number(searchParams.get('year')  ?? now.getFullYear()));
  const [data,  setData]  = useState<DeclarationSummary | null>(null);
  const [loading, setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/payrolls/declarations-summary?companyId=${companyId}&month=${month}&year=${year}`)
      .then((r: any) => setData(r))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [companyId, month, year]);

  const exportPDF = async () => {
    setExporting(true);
    try {
      const blob: any = await api.post('/payrolls/export/declarations-pdf', { companyId, month, year });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `declarations-${MONTHS[month - 1]}-${year}.pdf`;
      a.click();
    } catch (e: any) {
      alert(`Erreur : ${e.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-purple-400" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-white p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <FileText size={20} className="text-purple-400" /> Déclarations
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => setShowPicker(!showPicker)}
              className="flex items-center gap-1 text-cyan-400 text-sm hover:text-cyan-300 transition-colors">
              {MONTHS[month - 1]} {year} <ChevronDown size={13} />
            </button>
            {showPicker && (
              <div className="absolute top-24 z-50 bg-gray-900 border border-white/10 rounded-xl p-3 shadow-xl">
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => { setMonth(i + 1); setShowPicker(false); }}
                      className={`px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        i + 1 === month ? 'bg-cyan-500 text-black font-bold' : 'hover:bg-white/10 text-gray-300'
                      }`}>{m}</button>
                  ))}
                </div>
              </div>
            )}
            {data && <span className="text-gray-500 text-sm">{data.employeeCount} employés</span>}
          </div>
        </div>
        <button onClick={exportPDF} disabled={exporting || !data}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-xl text-sm text-purple-400 transition-colors disabled:opacity-50">
          {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Exporter PDF
        </button>
      </div>

      {!data ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center text-gray-500 text-sm">
          Aucune paie générée pour ce mois
        </div>
      ) : (
        <div className="space-y-4">

          {/* CNSS */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">CNSS — Caisse Nationale de Sécurité Sociale</h2>
              <span className="text-xs text-gray-500">Décret n°2009-392</span>
            </div>
            <div className="p-5 space-y-0">
              {/* Salariale */}
              <div className="mb-4">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Part salariale</p>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Masse salariale brute</span>
                  <span className="text-white text-sm">{fmt(data.totalGrossSalary)} FCFA</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-400 text-sm">CNSS salarié (4% × min(brut, 1 200 000))</span>
                  <span className="text-red-400 font-semibold text-sm">{fmt(data.totalCnssSalarial)} FCFA</span>
                </div>
              </div>

              {/* Patronale */}
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Part patronale</p>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Retraite (8% × min(brut, 1 200 000))</span>
                  <span className="text-purple-400 text-sm">{fmt(data.cnssEmployerPension)} FCFA</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Prestations familiales (10.03% × min(brut, 600 000))</span>
                  <span className="text-purple-400 text-sm">{fmt(data.cnssEmployerFamily)} FCFA</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/5">
                  <span className="text-gray-400 text-sm">Accidents du travail (2.25% × min(brut, 600 000))</span>
                  <span className="text-purple-400 text-sm">{fmt(data.cnssEmployerAccident)} FCFA</span>
                </div>
                <div className="flex justify-between py-2 bg-purple-500/5 px-2 rounded-lg font-semibold">
                  <span className="text-gray-300 text-sm">Total CNSS patronale</span>
                  <span className="text-purple-300 text-sm">{fmt(data.totalCnssEmployer)} FCFA</span>
                </div>
              </div>
            </div>
          </div>

          {/* TUS */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between">
              <h2 className="font-semibold text-white text-sm">TUS — Taxe Unique sur les Salaires (Patronale)</h2>
              <span className="text-xs text-gray-500">Sur brut total, sans plafond</span>
            </div>
            <div className="p-5 space-y-0">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">TUS DGI (4.13% × brut)</span>
                <span className="text-purple-400 text-sm">{fmt(data.tusDgiAmount)} FCFA</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-gray-400 text-sm">TUS CNSS (3.38% × brut)</span>
                <span className="text-purple-400 text-sm">{fmt(data.tusCnssAmount)} FCFA</span>
              </div>
              <div className="flex justify-between py-2 bg-purple-500/5 px-2 rounded-lg font-semibold">
                <span className="text-gray-300 text-sm">Total TUS (7.51%)</span>
                <span className="text-purple-300 text-sm">{fmt(data.tusTotal)} FCFA</span>
              </div>
            </div>
          </div>

          {/* ITS */}
          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/10">
              <h2 className="font-semibold text-white text-sm">ITS — Impôt sur les Traitements et Salaires</h2>
            </div>
            <div className="p-5">
              <div className="flex justify-between py-2 bg-red-500/5 px-2 rounded-lg font-semibold">
                <span className="text-gray-300 text-sm">Total ITS retenu à la source</span>
                <span className="text-red-400 text-sm">{fmt(data.totalIts)} FCFA</span>
              </div>
            </div>
          </div>

          {/* Taxes custom si présentes */}
          {data.customTaxDetails.length > 0 && (
            <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <h2 className="font-semibold text-white text-sm">Taxes spécifiques (CAMU, TOL...)</h2>
              </div>
              <div className="p-5 space-y-2">
                {data.customTaxDetails.map(t => (
                  <div key={t.code} className="flex justify-between py-2 border-b border-white/5">
                    <span className="text-gray-400 text-sm">{t.name} ({t.code})</span>
                    <div className="text-right">
                      <span className="text-red-400 text-xs">Salarié : {fmt(t.employeeTotal)}</span>
                      <span className="text-gray-600 mx-2">·</span>
                      <span className="text-purple-400 text-xs">Patronal : {fmt(t.employerTotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Grand total */}
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Retenues salariales totales</p>
                <p className="text-red-400 font-bold text-lg mt-1">{fmt(data.totalSalarialDeductions)} <span className="text-xs font-normal text-gray-500">FCFA</span></p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Charges patronales totales</p>
                <p className="text-purple-400 font-bold text-lg mt-1">{fmt(data.totalEmployerCharges)} <span className="text-xs font-normal text-gray-500">FCFA</span></p>
              </div>
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Total à verser (État + CNSS)</p>
                <p className="text-amber-400 font-bold text-lg mt-1">{fmt(data.grandTotal)} <span className="text-xs font-normal text-gray-500">FCFA</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}