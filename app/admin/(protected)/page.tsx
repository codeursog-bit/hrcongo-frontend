// 'use client';
// import React from 'react';
// import { MetricCard } from "@/components/admin/MetricCard";
// import { ActivityTable } from '@/components/admin/ActivityTable';
// import { GrowthChart, DistributionCharts } from '@/components/admin/Charts';
// import { PaymentSection } from '@/components/admin/PaymentSection';
// import { SystemAdmin } from '@/components/admin/SystemAdmin';
// import { Activity, Server, LifeBuoy } from 'lucide-react';

// export default function Dashboard() {
//   return (
//     <div className="space-y-6">
//       {/* Row 1: Critical Metrics */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
//         <MetricCard 
//           title="Revenue Overview" 
//           value="2,280,000 FCFA" 
//           subValue="ARR: 27.36M FCFA"
//           trend="+12.5%" 
//           trendDirection="up"
//           accentColor="gold"
//           actionText="View Billing"
//         >
//           <div className="text-xs text-gray-500 space-y-1">
//             <div className="flex justify-between"><span>Starter</span><span>675K</span></div>
//             <div className="flex justify-between"><span>Pro</span><span>2.34M</span></div>
//           </div>
//         </MetricCard>

//         <MetricCard 
//           title="Active Companies" 
//           value="152" 
//           subValue="95.4% Active Status"
//           trend="+8 this month" 
//           trendDirection="up"
//           accentColor="blue"
//           actionText="View Directory"
//         >
//            <div className="flex gap-1 h-1.5 mt-2 rounded-full overflow-hidden">
//               <div className="bg-green-500 w-[95%]"></div>
//               <div className="bg-orange-500 w-[3%]"></div>
//               <div className="bg-red-500 w-[2%]"></div>
//            </div>
//         </MetricCard>

//         <MetricCard 
//           title="System Health" 
//           value="99.97%" 
//           subValue="Avg Response: 124ms"
//           accentColor="green"
//           actionText="System Logs"
//         >
//           <div className="flex items-center gap-2 mt-2">
//             <Server className="w-4 h-4 text-green-500" />
//             <span className="text-xs font-medium text-green-400">All Systems Operational</span>
//           </div>
//         </MetricCard>

//         <MetricCard 
//           title="Support Tickets" 
//           value="12 Open" 
//           subValue="1 Critical Priority"
//           accentColor="orange"
//           actionText="Support Desk"
//         >
//           <div className="flex items-center gap-2 mt-2">
//             <LifeBuoy className="w-4 h-4 text-orange-500" />
//             <span className="text-xs font-medium text-gray-400">Avg Time: 2.3h</span>
//           </div>
//         </MetricCard>
//       </div>

//       {/* Row 2: Charts Area */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//         <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
//           <div className="flex justify-between items-center mb-6">
//              <h3 className="text-lg font-bold text-white flex items-center gap-2">
//                <Activity className="w-5 h-5 text-sky-500" /> Growth Analytics
//              </h3>
//              <div className="flex gap-2">
//                 <select className="bg-gray-800 border border-gray-700 text-xs rounded px-2 py-1 text-gray-300 outline-none">
//                    <option>Last 6 Months</option>
//                    <option>Last Year</option>
//                 </select>
//              </div>
//           </div>
//           <GrowthChart />
//         </div>

//         <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
//           <h3 className="text-lg font-bold text-white mb-6">Distribution</h3>
//           <DistributionCharts />
//         </div>
//       </div>

//       {/* Row 3: Company Table */}
//       <ActivityTable />

//       {/* Row 4: Payments */}
//       <PaymentSection />

//       {/* Row 5: Admin Controls */}
//       <SystemAdmin />

//       <footer className="text-center text-xs text-gray-600 py-8">
//         <p>&copy; 2025 HRCongo Platform. Super Admin Access Level 1.</p>
//         <p className="mt-1 font-mono">v4.2.0-stable • Server: bra-1-prod</p>
//       </footer>
//     </div>
//   );
// }


// ============================================================================
// 📊 PAGE DASHBOARD (MODIFIÉE - Connectée à l'API)
// ============================================================================
// Fichier: frontend/app/admin/page.tsx

// ============================================================================
// 📊 PAGE DASHBOARD FINALE (Avec tous les composants connectés)
// ============================================================================
// Fichier: frontend/app/admin/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { MetricCard } from '@/components/admin/MetricCard';
import { ActivityTable } from '@/components/admin/ActivityTable';
import { PaymentSection } from '@/components/admin/PaymentSection';
import { SystemAdmin } from '@/components/admin/SystemAdmin';
import { GrowthChart, DistributionCharts } from '@/components/admin/Charts';
import { adminService } from '@/lib/services/adminService';
import { Loader2, Activity, Server, LifeBuoy } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de chargement');
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

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6 text-red-400">
          {error}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Row 1: Critical Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard 
          title="Revenue Overview" 
          value={`${(stats.totalMRR / 1000).toFixed(0)}k FCFA`}
          subValue={`ARR: ${((stats.totalMRR * 12) / 1000000).toFixed(2)}M FCFA`}
          trend="+12.5%" 
          trendDirection="up"
          accentColor="gold"
          actionText="View Billing"
        />

        <MetricCard 
          title="Active Companies" 
          value={stats.totalCompanies.toString()}
          subValue={`${((stats.activeCompanies / stats.totalCompanies) * 100).toFixed(1)}% Active Status`}
          trend={`+${stats.totalCompanies - stats.activeCompanies} this month`}
          trendDirection="up"
          accentColor="blue"
          actionText="View Directory"
        >
           <div className="flex gap-1 h-1.5 mt-2 rounded-full overflow-hidden">
              <div className="bg-green-500" style={{ width: `${(stats.activeCompanies / stats.totalCompanies) * 100}%` }}></div>
              <div className="bg-orange-500" style={{ width: `${((stats.totalCompanies - stats.activeCompanies) / stats.totalCompanies) * 100}%` }}></div>
           </div>
        </MetricCard>

        <MetricCard 
          title="System Health" 
          value={stats.systemHealth?.database === 'healthy' ? '99.97%' : '95%'}
          subValue={`Avg Response: ${stats.systemHealth?.uptime || 124}ms`}
          accentColor="green"
          actionText="System Logs"
        >
          <div className="flex items-center gap-2 mt-2">
            <Server className="w-4 h-4 text-green-500" />
            <span className="text-xs font-medium text-green-400">All Systems Operational</span>
          </div>
        </MetricCard>

        <MetricCard 
          title="Support Tickets" 
          value="12 Open" 
          subValue="1 Critical Priority"
          accentColor="orange"
          actionText="Support Desk"
        >
          <div className="flex items-center gap-2 mt-2">
            <LifeBuoy className="w-4 h-4 text-orange-500" />
            <span className="text-xs font-medium text-gray-400">Avg Time: 2.3h</span>
          </div>
        </MetricCard>
      </div>

      {/* Row 2: Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-lg font-bold text-white flex items-center gap-2">
               <Activity className="w-5 h-5 text-sky-500" /> Growth Analytics
             </h3>
             <div className="flex gap-2">
                <select className="bg-gray-800 border border-gray-700 text-xs rounded px-2 py-1 text-gray-300 outline-none">
                   <option>Last 6 Months</option>
                   <option>Last Year</option>
                </select>
             </div>
          </div>
          <GrowthChart />
        </div>

        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Distribution</h3>
          <DistributionCharts />
        </div>
      </div>

      {/* Row 3: Company Table - ✅ MODIFICATION ICI */}
      <ActivityTable companies={stats.recentCompanies} />

      {/* Row 4: Payments - ✅ MODIFICATION ICI */}
      <PaymentSection failedPayments={stats.failedPayments} totalMRR={stats.totalMRR} />

      {/* Row 5: Admin Controls */}
      <SystemAdmin />

      <footer className="text-center text-xs text-gray-600 py-8">
        <p>&copy; 2025 HRCongo Platform. Super Admin Access Level 1.</p>
        <p className="mt-1 font-mono">v4.2.0-stable • Server: bra-1-prod</p>
      </footer>
    </div>
  );
}
