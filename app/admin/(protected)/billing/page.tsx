// ============================================================================
// Fichier: frontend/app/admin/billing/page.tsx (MISE À JOUR)
// ============================================================================

'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, Download } from 'lucide-react';
import { RevenueCharts } from '@/components/admin/billing/RevenueCharts';
import { TransactionList } from '@/components/admin/billing/TransactionList';
import { adminService } from '@/lib/services/adminService';
import { Loader2 } from 'lucide-react';

export default function BillingPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('Janvier 2025');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getBillingStats();
      setStats(data);
    } catch (err) {
      console.error('Erreur chargement billing:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  if (!stats) return null;

  // Calculer les stats de paiement pour le pie chart
  const successCount = stats.recentTransactions.filter((t: any) => t.status === 'Success').length;
  const failedCount = stats.recentTransactions.filter((t: any) => t.status === 'Failed').length;

  return (
    <div className="space-y-8">
      {/* Header - TON CODE ORIGINAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white flex items-center gap-3">
             💰 Facturation & Abonnements
           </h1>
           <p className="text-gray-400 text-sm mt-1">Gérer tous les paiements et flux de revenus</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <select 
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="bg-gray-900 border border-gray-700 text-white pl-9 pr-8 py-2 rounded-lg text-sm outline-none cursor-pointer"
              >
                 <option>Janvier 2025</option>
                 <option>Décembre 2024</option>
                 <option>Novembre 2024</option>
              </select>
           </div>
           <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg border border-gray-700">
              <Download className="w-4 h-4" />
              Exporter
           </button>
        </div>
      </div>

      {/* Hero Card - TON CODE ORIGINAL */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-[#0B0F19] to-gray-900 border border-gray-800 rounded-2xl p-8">
         <div className="absolute -top-24 -right-24 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
         
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            <div className="lg:col-span-1 space-y-4">
               <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                  Revenu Total (MRR)
               </h2>
               <div className="flex items-baseline gap-4">
                  <span className="text-5xl font-extrabold text-white tracking-tight">
                    {(stats.totalRevenue / 1000000).toFixed(2)}M
                  </span>
                  <span className="text-xl font-medium text-gray-500">FCFA</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-green-400 bg-green-900/20 px-2 py-1 rounded text-sm font-bold">
                     +12.5%
                  </span>
                  <span className="text-gray-500 text-sm">vs mois dernier</span>
               </div>
            </div>
         </div>
      </div>

      {/* ✅ MODIFIÉ : Passer les vraies données */}
      <RevenueCharts 
        revenueHistory={[]} // TODO: Ajouter revenue history dans le backend
        paymentStats={{ success: successCount, failed: failedCount }}
      />

      {/* ✅ MODIFIÉ : Passer les transactions */}
      <TransactionList transactions={stats.recentTransactions} />
    </div>
  );
}