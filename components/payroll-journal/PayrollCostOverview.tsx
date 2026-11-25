'use client';
import type { PayrollCostReport } from '@/types/payroll-journal';

const money = (value: number | null) =>
  value === null
    ? '—'
    : `${new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(value)} FCFA`;
export function PayrollCostOverview({ journal }: { journal: PayrollCostReport }) {
  const summary = journal.costSummary;
  if (!summary) return null;
  const definition = (key: string) =>
    summary.definitions.find((item) => item.key === key)?.formula ?? '';
  const metrics = [
    {
      label: 'Effectif avec bulletin',
      value: String(summary.headcount),
      help: 'Salariés avec un bulletin Congo non annulé, brouillons compris.',
    },
    {
      label: 'Effectif payé',
      value: String(summary.paidHeadcount),
      help: 'Salariés dont le bulletin de cette période porte le statut Payé.',
    },
    { label: 'Masse salariale brute', value: money(summary.gross), help: definition('gross') },
    {
      label: 'Retenues salariales',
      value: money(summary.deductions),
      help: definition('deductions'),
    },
    { label: 'Net à payer', value: money(summary.net), help: definition('net') },
    {
      label: 'Charges patronales',
      value: money(summary.employerCharges),
      help: definition('employerCharges'),
    },
    {
      label: 'Masse salariale chargée',
      value: money(summary.chargedGross),
      help: definition('chargedGross'),
    },
    ...(summary.outsideGross !== 0
      ? [
          {
            label: 'Primes et indemnités hors brut',
            value: money(summary.outsideGross),
            help: definition('outsideGross'),
          },
        ]
      : []),
    {
      label: 'Coût employeur total',
      value: money(summary.employerCost),
      help: definition('employerCost'),
    },
    {
      label: 'Taux de charges patronales',
      value:
        summary.employerChargesRatio === null
          ? '—'
          : `${summary.employerChargesRatio.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`,
      help: 'Charges patronales ÷ masse salariale brute. Sans valeur lorsque le brut est nul.',
    },
    {
      label: 'Brut moyen',
      value: money(summary.averageGross),
      help: 'Masse salariale brute ÷ effectif avec bulletin Congo.',
    },
    {
      label: 'Coût employeur moyen',
      value: money(summary.averageEmployerCost),
      help: 'Coût employeur Congo ÷ effectif avec bulletin Congo.',
    },
  ];
  const hasDelta =
    summary.reconciliation.netDelta !== 0 || summary.reconciliation.employerCostDelta !== 0;
  return (
    <section className="space-y-5" aria-labelledby="payroll-cost-title">
      <header>
        <h2 id="payroll-cost-title" className="text-xl font-semibold text-[var(--text)]">
          Ce que coûte la paie — Congo
        </h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{summary.scopeDescription}</p>
        {summary.draftCount > 0 && (
          <p className="mt-2 text-sm text-[var(--warning-text)]">
            {summary.draftCount} bulletin(s) en brouillon inclus : ces montants ne constituent pas
            tous une paie validée.
          </p>
        )}
      </header>
      <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
          >
            <dt className="text-xs text-[var(--text-secondary)]">
              <abbr title={metric.help} className="cursor-help no-underline">
                {metric.label}
              </abbr>
            </dt>
            <dd className="mt-3 text-xl font-semibold tabular-nums text-[var(--text)]">
              {metric.value}
            </dd>
          </div>
        ))}
      </dl>
      {journal.options.hasExpat && (
        <div className="rounded-xl bg-[var(--surface-2)] p-4 text-sm">
          <strong>Paie étrangère — périmètre séparé</strong>
          <p className="mt-2 text-[var(--text-secondary)]">
            Brut saisi à l’étranger : {money(journal.summary.foreignGross)} · Net saisi :{' '}
            {money(journal.summary.foreignNet)}. Ces montants ne sont pas inclus dans les
            indicateurs Congo ci-dessus.
          </p>
        </div>
      )}
      <div className="text-sm text-[var(--text-secondary)]">
        <strong className={hasDelta ? 'text-[var(--warning-text)]' : 'text-[var(--text)]'}>
          {hasDelta ? 'Écarts dans les totaux à examiner' : 'Équilibre des totaux'}
        </strong>
        {hasDelta && (
          <p>
            Écart net : {money(summary.reconciliation.netDelta)} · Écart coût employeur :{' '}
            {money(summary.reconciliation.employerCostDelta)}.
          </p>
        )}
        <p className="mt-1 text-xs">{summary.reconciliation.description}</p>
      </div>
      <details className="rounded-xl bg-[var(--surface-2)] p-5">
        <summary className="cursor-pointer text-sm font-semibold">Comment lire ce rapport</summary>
        <dl className="mt-4 grid gap-4 md:grid-cols-2">
          {summary.definitions.map((item) => (
            <div key={item.key}>
              <dt className="text-sm font-semibold">{item.label}</dt>
              <dd className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                {item.formula}
              </dd>
            </div>
          ))}
        </dl>
      </details>
    </section>
  );
}
