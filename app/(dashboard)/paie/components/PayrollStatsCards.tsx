// ============================================================================
// 📁 src/components/payroll/PayrollStatsCards.tsx
// ============================================================================

import { Wallet, Shield, Banknote, CheckCircle } from 'lucide-react';
import { Card } from '@/components/design-system/primitives';

interface StatsCardsProps {
  totalGross: number;
  totalCharges: number;
  totalNet: number;
  paidCount: number;
  totalActive: number;
}

export function PayrollStatsCards({ totalGross, totalCharges, totalNet, paidCount, totalActive }: StatsCardsProps) {
  const formatCurrency = (val: number) => (val || 0).toLocaleString('fr-FR') + ' FCFA';

  const stats = [
    { label: 'Masse Salariale Brute', value: formatCurrency(totalGross), icon: Wallet },
    { label: 'Retenues salariales', value: formatCurrency(totalCharges), icon: Shield },
    { label: 'Salaires Nets', value: formatCurrency(totalNet), icon: Banknote },
    { label: 'Employés Payés', value: `${paidCount}/${totalActive}`, icon: CheckCircle },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map(({ label, value, icon: Icon }) => (
        <Card key={label} className="flex items-start gap-4">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--action)]">
            <Icon size={20} strokeWidth={1.5} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--text-secondary)]">{label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight text-[var(--text)] tabular-nums">{value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
