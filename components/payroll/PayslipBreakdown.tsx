'use client';

// ============================================================================
// 📁 components/payroll/PayslipBreakdown.tsx
// Affichage UNIQUE du détail d'une paie : gains (salaire, heures sup, primes,
// indemnités non imposables), brut, CHAQUE retenue (CNSS, ITS/BNC, TOL, taxes
// configurées, prêts, avances), net, coût employeur.
// Utilisé par : aperçu paie individuelle, aperçu paie manuelle, simulateur
// privé, simulateur public → même rendu partout, zéro calcul côté composant.
// Entrée = forme de la réponse /payrolls/simulate, /manual-simulate,
// /simulate-free ou computeSimulation() (lib/payroll-engine.ts).
// ============================================================================

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const fmt = (n: number | null | undefined) => Number(n ?? 0).toLocaleString('fr-FR');
const fmtRate = (r?: number | null) =>
  r == null ? '' : `${(r * 100).toLocaleString('fr-FR', { maximumFractionDigits: 3 })} %`;

type Cat = 'TAXABLE_CNSS' | 'TAXABLE_NO_CNSS' | 'NON_TAXABLE';
const catOf = (b: any): Cat => {
  if (b.fiscalType === 'NON_TAXABLE' || b.isTaxable === false) return 'NON_TAXABLE';
  if (b.fiscalType === 'TAXABLE_NO_CNSS' || b.isCnss === false) return 'TAXABLE_NO_CNSS';
  return 'TAXABLE_CNSS';
};
const CAT_LABEL: Record<Cat, string> = {
  TAXABLE_CNSS: 'Prime imposable + CNSS',
  TAXABLE_NO_CNSS: 'Prime imposable, hors CNSS',
  NON_TAXABLE: 'Indemnité non imposable (ajoutée au net)',
};

const Row = ({
  label, value, sub, sign, bold, tone,
}: {
  label: React.ReactNode; value: number; sub?: React.ReactNode;
  sign?: '+' | '−'; bold?: boolean; tone?: 'neg' | 'pos' | 'muted';
}) => (
  <div className="flex items-start justify-between gap-3 py-1">
    <div className="min-w-0">
      <p className={`text-sm ${bold ? 'font-bold' : ''} text-slate-700 dark:text-slate-200`}>{label}</p>
      {sub && <p className="text-[11px] text-slate-400 dark:text-slate-400">{sub}</p>}
    </div>
    <p
      className={`text-sm tabular-nums whitespace-nowrap ${bold ? 'font-bold' : 'font-medium'} ${
        tone === 'neg' ? 'text-red-600 dark:text-red-400'
        : tone === 'pos' ? 'text-emerald-600 dark:text-emerald-400'
        : 'text-slate-800 dark:text-slate-100'}`}
    >
      {sign ? `${sign} ` : ''}{fmt(value)} F
    </p>
  </div>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="py-2">
    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 dark:text-slate-400 mb-1">{title}</p>
    {children}
  </div>
);

export const PayslipBreakdown = ({
  result, showEmployer = true, defaultOpenEmployer = false,
}: {
  result: any;
  showEmployer?: boolean;
  defaultOpenEmployer?: boolean;
}) => {
  const [openEmployer, setOpenEmployer] = useState(defaultOpenEmployer);
  if (!result) return null;

  const bonuses: any[] = Array.isArray(result.bonuses) ? result.bonuses : [];
  const taxable = bonuses.filter((b) => catOf(b) !== 'NON_TAXABLE');
  const nonTaxable = bonuses.filter((b) => catOf(b) === 'NON_TAXABLE');
  const nonTaxableTotal = nonTaxable.reduce((s, b) => s + Number(b.amount || 0), 0);
  const customTaxes: any[] = Array.isArray(result.customTaxes) ? result.customTaxes : [];
  const loans: any[] = Array.isArray(result.loans) ? result.loans : [];
  const advances: any[] = Array.isArray(result.advances) ? result.advances : [];
  const ot = result.overtime;
  const irpp = result.irppDetails ?? {};
  const isBnc = !!result.isBncWorker;
  const itsLabel = isBnc
    ? (result.bncLabel || 'BNC retenu à la source')
    : irpp.fiscalMode === 'FORFAIT' ? 'ITS (forfait)'
    : irpp.fiscalMode === 'IRPP_LEGACY' ? 'IRPP' : 'ITS';
  const itsSub = isBnc ? undefined
    : irpp.fiscalParts ? `${irpp.fiscalParts} part(s) fiscale(s) · taux effectif ${irpp.effectiveRate ?? 0} %` : undefined;
  const employee = result.employee ?? {};
  const advTotal = Number(result.totalAdvanceDeduction ?? 0);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 divide-y divide-slate-100 dark:divide-slate-800">
      {/* ── GAINS ─────────────────────────────────────────── */}
      <Section title="Gains">
        <Row
          label="Salaire de base"
          value={Number(employee.baseSalary ?? result.adjustedBaseSalary)}
          sub={result.workDays && result.daysToPay < result.workDays
            ? `${result.daysToPay} jour(s) payé(s) sur ${result.workDays}` : undefined}
        />
        {result.absenceDeduction > 0 && (
          <Row label="Retenue pour absences" value={result.absenceDeduction} sign="−" tone="neg" />
        )}
        {ot?.total > 0 && (
          <>
            {ot.amount10 > 0 && <Row label={`Heures sup. +10 % (${ot.hours10} h)`} value={ot.amount10} sign="+" />}
            {ot.amount25 > 0 && <Row label={`Heures sup. +25 % (${ot.hours25} h)`} value={ot.amount25} sign="+" />}
            {ot.amount50 > 0 && <Row label={`Heures sup. +50 % (${ot.hours50} h)`} value={ot.amount50} sign="+" />}
            {ot.amount100 > 0 && <Row label={`Heures sup. +100 % (${ot.hours100} h)`} value={ot.amount100} sign="+" />}
          </>
        )}
        {taxable.map((b) => (
          <Row key={b.id ?? b.bonusType} label={b.bonusType} value={b.amount} sign="+" sub={CAT_LABEL[catOf(b)]} />
        ))}
      </Section>

      <div className="py-2">
        <Row label="Brut imposable" value={result.grossSalary} bold />
      </div>

      {/* ── RETENUES ──────────────────────────────────────── */}
      <Section title="Retenues">
        {employee.isSubjectToCnss === false ? (
          <Row label="CNSS salariale" value={0} sub="Non assujetti" tone="muted" />
        ) : (
          result.cnssSalarial > 0 && (
            <Row label="CNSS salariale" value={result.cnssSalarial} sign="−" tone="neg"
              sub={`4 % du brut CNSS (plafond ${fmt(1_200_000)} F)`} />
          )
        )}
        {(result.its > 0 || employee.isSubjectToIrpp === false) && (
          <Row
            label={itsLabel}
            value={result.its}
            sign={result.its > 0 ? '−' : undefined}
            tone={result.its > 0 ? 'neg' : 'muted'}
            sub={employee.isSubjectToIrpp === false
              ? `Exonéré${employee.taxExemptionReason ? ` — ${employee.taxExemptionReason}` : ''}` : itsSub}
          />
        )}
        {customTaxes.map((t) => (
          <Row
            key={t.id ?? t.code}
            label={`${t.name}${t.code ? ` (${t.code})` : ''}`}
            value={t.employeeAmount}
            sign={t.employeeAmount > 0 ? '−' : undefined}
            tone="neg"
            sub={t.baseType === 'FIXED' || t.employeeRate == null
              ? 'Montant fixe'
              : `${fmtRate(t.employeeRate)} × ${fmt(t.base)} F`}
          />
        ))}
        {loans.map((l, i) => (
          <Row key={l.id ?? i} label={l.label || 'Remboursement de prêt'}
            value={l.monthlyRepayment ?? l.amount ?? 0} sign="−" tone="neg" />
        ))}
        {advances.map((a, i) => (
          <Row key={a.id ?? i} label={a.label || 'Avance sur salaire'} value={a.amount} sign="−" tone="neg" />
        ))}
        {Number(result.manualDeductionTotal ?? 0) > 0 && (
          <Row label="Autres retenues" value={result.manualDeductionTotal} sign="−" tone="neg" />
        )}
        <div className="mt-1 border-t border-dashed border-slate-200 dark:border-slate-700 pt-1">
          <Row label="Total retenues" value={result.totalDeductions} bold tone="neg" />
        </div>
      </Section>

      {/* ── INDEMNITÉS NON IMPOSABLES ─────────────────────── */}
      {nonTaxable.length > 0 && (
        <Section title="Indemnités non imposables (ajoutées au net)">
          {nonTaxable.map((b) => (
            <Row key={b.id ?? b.bonusType} label={b.bonusType} value={b.amount} sign="+" tone="pos"
              sub="Ni ITS, ni CNSS" />
          ))}
          <Row label="Total indemnités" value={nonTaxableTotal} bold tone="pos" />
        </Section>
      )}

      {/* ── NET ───────────────────────────────────────────── */}
      <div className="py-3">
        <div className="flex items-center justify-between rounded-lg bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2">
          <div>
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Net à payer</p>
            <p className="text-[11px] text-emerald-700/70 dark:text-emerald-300/70">
              Brut − retenues{nonTaxableTotal > 0 ? ' + indemnités non imposables' : ''}
            </p>
          </div>
          <p className="text-xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
            {fmt(result.netSalary)} F
          </p>
        </div>
      </div>

      {/* ── COÛT EMPLOYEUR ────────────────────────────────── */}
      {showEmployer && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setOpenEmployer((v) => !v)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              Coût total employeur : {fmt(result.totalEmployerCost)} F
            </span>
            <ChevronDown size={16} className={`transition-transform ${openEmployer ? 'rotate-180' : ''}`} />
          </button>
          {openEmployer && (
            <div className="mt-2">
              {result.cnssEmployerPension > 0 && <Row label="CNSS patronale — Pension (8 %)" value={result.cnssEmployerPension} />}
              {result.cnssEmployerFamily > 0 && <Row label="CNSS patronale — Prestations familiales (10,03 %)" value={result.cnssEmployerFamily} />}
              {result.cnssEmployerAccident > 0 && <Row label="CNSS patronale — Accidents du travail (2,25 %)" value={result.cnssEmployerAccident} />}
              {result.tusDgiAmount > 0 && <Row label="TUS — État (2,025 %)" value={result.tusDgiAmount} />}
              {result.tusCnssAmount > 0 && <Row label="TUS — CNSS (5,475 %)" value={result.tusCnssAmount} />}
              {customTaxes.filter((t) => t.employerAmount > 0).map((t) => (
                <Row key={`er-${t.id ?? t.code}`} label={`${t.name} (part patronale)`} value={t.employerAmount} />
              ))}
              <Row label="Coût total employeur" value={result.totalEmployerCost} bold />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PayslipBreakdown;