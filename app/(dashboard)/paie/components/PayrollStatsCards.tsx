// ============================================================================
// 📁 src/components/payroll/PayrollStatsCards.tsx
// ============================================================================

import { Wallet, Shield, Banknote, CheckCircle } from 'lucide-react';

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
    { label: 'Masse Salariale Brute', value: formatCurrency(totalGross), icon: Wallet, from: 'from-sky-500', to: 'to-blue-600' },
    { label: 'Charges Salariales', value: formatCurrency(totalCharges), icon: Shield, from: 'from-orange-400', to: 'to-red-500' },
    { label: 'Salaires Nets', value: formatCurrency(totalNet), icon: Banknote, from: 'from-emerald-400', to: 'to-teal-600' },
    { label: 'Employés Payés', value: `${paidCount}/${totalActive}`, icon: CheckCircle, from: 'from-purple-500', to: 'to-indigo-600' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
          <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.from} ${stat.to} opacity-10 rounded-bl-full -mr-6 -mt-6 transition-transform group-hover:scale-150`}></div>
          <div className="relative z-10">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.from} ${stat.to} flex items-center justify-center text-white shadow-lg mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">{stat.label}</p>
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{stat.value}</h3>
          </div>
        </div>
      ))}
    </div>
  );
}
