// ============================================================================
// Fichier: frontend/components/admin/billing/RevenueCharts.tsx
// ============================================================================

'use client';

import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

interface RevenueChartsProps {
  revenueHistory?: Array<{
    month: string;
    value: number;
  }>;
  paymentStats?: {
    success: number;
    failed: number;
  };
}

export const RevenueCharts: React.FC<RevenueChartsProps> = ({ 
  revenueHistory = [],
  paymentStats = { success: 0, failed: 0 }
}) => {
  const PAYMENT_METHOD_DATA = [
    { name: 'Success', value: paymentStats.success, color: '#22c55e' },
    { name: 'Failed', value: paymentStats.failed, color: '#ef4444' },
  ];

  const total = paymentStats.success + paymentStats.failed;
  const successRate = total > 0 ? ((paymentStats.success / total) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Trends */}
      <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-white">Revenue Trends</h3>
            <p className="text-xs text-gray-500">Last 12 months MRR evolution</p>
          </div>
          <div className="flex gap-2">
             <button className="px-3 py-1 bg-gray-800 text-xs text-white rounded border border-gray-700">Total</button>
             <button className="px-3 py-1 text-xs text-gray-500 hover:text-white rounded border border-transparent hover:bg-gray-800">By Plan</button>
          </div>
        </div>
        
        <div className="h-[250px] w-full">
          {revenueHistory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="month" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
                  itemStyle={{ color: '#F3F4F6' }}
                  labelStyle={{ color: '#9CA3AF' }}
                  formatter={(value: number) => [`${value.toLocaleString()} FCFA`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10B981" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 0 }} 
                  activeDot={{ r: 6, strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              Aucune donnée de revenu disponible
            </div>
          )}
        </div>
        
        <div className="flex gap-4 mt-4 text-xs text-gray-400">
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500"></span> Pic du mois</span>
           <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Croissance</span>
        </div>
      </div>

      {/* Payment Success Rate */}
      <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-sm flex flex-col">
        <h3 className="text-lg font-bold text-white mb-1">Payment Success</h3>
        <p className="text-xs text-gray-500 mb-4">Transaction health monitor</p>
        
        <div className="flex-1 flex items-center justify-center relative">
           <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
              <span className="text-3xl font-bold text-white">{successRate}%</span>
              <span className="text-xs text-gray-500">Success Rate</span>
           </div>
           <div className="h-[200px] w-full">
            {total > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                  <Pie
                      data={PAYMENT_METHOD_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={-270}
                  >
                      {PAYMENT_METHOD_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                  </Pie>
                  </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Pas de données
              </div>
            )}
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-800">
           <div>
              <div className="text-xs text-gray-500">Successful</div>
              <div className="text-lg font-bold text-green-500">{paymentStats.success}</div>
           </div>
           <div>
              <div className="text-xs text-gray-500">Failed</div>
              <div className="text-lg font-bold text-red-500">{paymentStats.failed}</div>
           </div>
           <div>
              <div className="text-xs text-gray-500">Retrying</div>
              <div className="text-lg font-bold text-blue-500">0</div>
           </div>
           <div>
              <div className="text-xs text-gray-500">Retry Rate</div>
              <div className="text-lg font-bold text-gray-300">0%</div>
           </div>
        </div>
      </div>
    </div>
  );
};