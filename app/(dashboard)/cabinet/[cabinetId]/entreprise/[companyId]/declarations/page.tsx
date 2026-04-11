'use client';

/**
 * Page déclarations — vue cabinet
 * Route : /cabinet/[cabinetId]/entreprise/[companyId]/declarations
 * API INCHANGÉE — UX améliorée
 */

import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Btn, KpiCard,
  PageHeader, SectionHeader, LoadingScreen,
} from '@/components/cabinet/cabinet-ui';

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

interface DeclarationSummary {
  month: number; year: number; employeeCount: number;
  totalGrossSalary: number; totalCnssSalarial: number;
  cnssEmployerPension: number; cnssEmployerFamily: number;
  cnssEmployerAccident: number; totalCnssEmployer: number;
  tusDgiAmount: number; tusCnssAmount: number; tusTotal: number;
  totalIts: number;
  customTaxDetails: Array<{ name: string; code: string; employeeTotal: number; employerTotal: number }>;
  totalSalarialDeductions: number; totalEmployerCharges: number; grandTotal: number;
}

function DeclarationRow({ label, value, color, sub }: { label: string; value: number; color?: string; sub?: string }) {
  return (
    <div
      className="flex items-center justify-between py-2.5 px-0"
      style={{ borderBottom: `1px solid ${C.border}` }}
    >
      <div>
        <span className="text-sm" style={{ color: C.textSecondary }}>{label}</span>
        {sub && <p className="text-xs mt-0.5" style={{ color: C.textMuted }}>{sub}</p>}
      </div>
      <span className="text-sm font-semibold" style={{ color: color ?? C.textPrimary }}>
        {fmt(value)} <span className="text-xs font-normal" style={{ color: C.textMuted }}>FCFA</span>
      </span>
    </div>
  );
}

function SubTotal({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-xl mt-2"
      style={{ background: `${color}0c`, border: `1px solid ${color}20` }}
    >
      <span className="text-sm font-semibold" style={{ color: C.textPrimary }}>{label}</span>
      <span className="text-sm font-bold" style={{ color }}>
        {fmt(value)} <span className="text-xs font-normal" style={{ color: C.textMuted }}>FCFA</span>
      </span>
    </div>
  );
}

export default function DeclarationsPage() {
  const params       = useParams();
  const searchParams = useSearchParams();
  const cabinetId    = params.cabinetId as string;
  const companyId    = params.companyId as string;

  const now = new Date();
  const [month,     setMonth]     = useState(Number(searchParams.get('month') ?? now.getMonth() + 1));
  const [year,      setYear]      = useState(Number(searchParams.get('year')  ?? now.getFullYear()));
  const [data,      setData]      = useState<DeclarationSummary | null>(null);
  const [loading,   setLoading]   = useState(true);
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

  if (loading) return <LoadingScreen />;

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      {/* Header */}
      <PageHeader
        title="Déclarations"
        sub={data ? `${data.employeeCount} employés — ${MONTHS[month - 1]} ${year}` : `${MONTHS[month - 1]} ${year}`}
        icon={<Ico.Wallet size={18} color={C.violet} />}
        action={
          <div className="flex items-center gap-2">
            {/* Month picker */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ background: C.cardBg, border: `1px solid ${C.border}`, color: C.cyan }}
              >
                {MONTHS[month - 1]} {year}
                <Ico.ChevronDown size={11} color="currentColor" />
              </button>
              {showPicker && (
                <div
                  className="absolute right-0 top-10 z-50 rounded-xl p-3 shadow-2xl w-64"
                  style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
                >
                  <div className="grid grid-cols-3 gap-1">
                    {MONTHS.map((m, i) => (
                      <button
                        key={m}
                        onClick={() => { setMonth(i + 1); setShowPicker(false); }}
                        className="px-2 py-2 rounded-lg text-xs font-medium transition-colors"
                        style={i + 1 === month
                          ? { background: C.indigo, color: '#fff' }
                          : { color: C.textSecondary }
                        }
                        onMouseEnter={e => { if (i + 1 !== month) (e.currentTarget.style.background = 'rgba(255,255,255,0.05)'); }}
                        onMouseLeave={e => { if (i + 1 !== month) (e.currentTarget.style.background = 'transparent'); }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Btn
              variant="ghost"
              icon={exporting ? <Ico.Loader size={13} /> : <Ico.Download size={13} color={C.textSecondary} />}
              onClick={exportPDF}
              disabled={exporting || !data}
            >
              Exporter PDF
            </Btn>
          </div>
        }
      />

      {!data ? (
        <Card className="p-12">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}` }}
            >
              <Ico.Payroll size={24} color={C.textMuted} />
            </div>
            <p className="text-sm font-medium" style={{ color: C.textSecondary }}>
              Aucune paie générée pour ce mois
            </p>
            <p className="text-xs mt-1" style={{ color: C.textMuted }}>
              Générez les bulletins de paie pour accéder aux déclarations
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Grand totals KPIs */}
          <div className="grid grid-cols-3 gap-4">
            <KpiCard
              label="Retenues salariales"
              value={`${fmt(data.totalSalarialDeductions)} F`}
              icon={<Ico.Users size={16} color={C.red} />}
              accentColor={C.red}
            />
            <KpiCard
              label="Charges patronales"
              value={`${fmt(data.totalEmployerCharges)} F`}
              icon={<Ico.Wallet size={16} color={C.violet} />}
              accentColor={C.violet}
            />
            <KpiCard
              label="Total à verser"
              value={`${fmt(data.grandTotal)} F`}
              icon={<Ico.Dollar size={16} color={C.amber} />}
              accentColor={C.amber}
            />
          </div>

          <div className="space-y-4">

            {/* CNSS */}
            <Card>
              <SectionHeader
                title="CNSS — Caisse Nationale de Sécurité Sociale"
                sub="Décret n°2009-392"
              />
              <div className="p-5 space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>
                    Part salariale
                  </p>
                  <DeclarationRow label="Masse salariale brute" value={data.totalGrossSalary} />
                  <DeclarationRow
                    label="CNSS salarié"
                    sub="4% × min(brut, 1 200 000)"
                    value={data.totalCnssSalarial}
                    color={C.red}
                  />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider mb-3" style={{ color: C.textMuted }}>
                    Part patronale
                  </p>
                  <DeclarationRow label="Retraite" sub="8% × min(brut, 1 200 000)"            value={data.cnssEmployerPension}  color={C.violet} />
                  <DeclarationRow label="Prestations familiales" sub="10.03% × min(brut, 600 000)" value={data.cnssEmployerFamily}   color={C.violet} />
                  <DeclarationRow label="Accidents du travail" sub="2.25% × min(brut, 600 000)"   value={data.cnssEmployerAccident} color={C.violet} />
                  <SubTotal label="Total CNSS patronale" value={data.totalCnssEmployer} color={C.violet} />
                </div>
              </div>
            </Card>

            {/* TUS */}
            <Card>
              <SectionHeader
                title="TUS — Taxe Unique sur les Salaires (Patronale)"
                sub="Sur brut total, sans plafond"
              />
              <div className="p-5">
                <DeclarationRow label="TUS DGI"  sub="4.13% × brut" value={data.tusDgiAmount}  color={C.violet} />
                <DeclarationRow label="TUS CNSS" sub="3.38% × brut" value={data.tusCnssAmount} color={C.violet} />
                <SubTotal label="Total TUS (7.51%)" value={data.tusTotal} color={C.violet} />
              </div>
            </Card>

            {/* ITS */}
            <Card>
              <SectionHeader title="ITS — Impôt sur les Traitements et Salaires" />
              <div className="p-5">
                <SubTotal label="Total ITS retenu à la source" value={data.totalIts} color={C.red} />
              </div>
            </Card>

            {/* Custom taxes */}
            {data.customTaxDetails.length > 0 && (
              <Card>
                <SectionHeader title="Taxes spécifiques (CAMU, TOL...)" />
                <div className="p-5 space-y-2">
                  {data.customTaxDetails.map(t => (
                    <div
                      key={t.code}
                      className="flex items-center justify-between py-2.5"
                      style={{ borderBottom: `1px solid ${C.border}` }}
                    >
                      <span className="text-sm" style={{ color: C.textSecondary }}>
                        {t.name} ({t.code})
                      </span>
                      <div className="flex items-center gap-4 text-xs">
                        <span style={{ color: C.red }}>
                          Salarié : {fmt(t.employeeTotal)} F
                        </span>
                        <span style={{ color: C.violet }}>
                          Patronal : {fmt(t.employerTotal)} F
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Grand total recap */}
            <div
              className="p-5 rounded-2xl"
              style={{ background: `${C.amber}08`, border: `1px solid ${C.amber}20` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.textMuted }}>
                Récapitulatif des versements
              </p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                    Retenues salariales
                  </p>
                  <p className="text-xl font-bold" style={{ color: C.red }}>
                    {fmt(data.totalSalarialDeductions)}
                    <span className="text-xs font-normal ml-1" style={{ color: C.textMuted }}>FCFA</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                    Charges patronales
                  </p>
                  <p className="text-xl font-bold" style={{ color: C.violet }}>
                    {fmt(data.totalEmployerCharges)}
                    <span className="text-xs font-normal ml-1" style={{ color: C.textMuted }}>FCFA</span>
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>
                    Total à verser (État + CNSS)
                  </p>
                  <p className="text-xl font-bold" style={{ color: C.amber }}>
                    {fmt(data.grandTotal)}
                    <span className="text-xs font-normal ml-1" style={{ color: C.textMuted }}>FCFA</span>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}