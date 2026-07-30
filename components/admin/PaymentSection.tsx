// ============================================================================
// 💳 COMPOSANT PaymentSection MODIFIÉ (Reçoit données via props)
// ============================================================================
// Fichier: frontend/components/admin/PaymentSection.tsx

import React from 'react';
import { AlertCircle, CreditCard, Phone, Mail } from 'lucide-react';

interface PaymentSectionProps {
  failedPayments?: any[];
  totalMRR?: number;
}

export const PaymentSection: React.FC<PaymentSectionProps> = ({ 
  failedPayments = [], 
  totalMRR = 0 
}) => {
  const successRate = 98.6; // À calculer dynamiquement si besoin

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overview Card */}
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700 rounded-xl p-6 lg:col-span-1">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-gold" />
          Payment Overview
        </h3>
        
        <div className="space-y-6">
          <div>
            <p className="text-sm text-gray-400">Total Revenue (This Month)</p>
            <p className="text-3xl font-bold text-white mt-1">
              {(totalMRR / 1000).toFixed(0)}k <span className="text-lg font-normal text-gray-500">FCFA</span>
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Success Rate</span>
              <span className="text-green-400 font-bold">{successRate}%</span>
            </div>
            <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
              <div className="bg-green-500 h-full rounded-full" style={{ width: `${successRate}%` }}></div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-700">
             <div className="flex justify-between items-center mb-2">
               <span className="text-sm text-gray-300">Upcoming Renewals (7 days)</span>
               <span className="text-xs font-mono bg-gray-700 px-2 py-1 rounded text-white">23</span>
             </div>
             <p className="text-xs text-gray-500">Estimated: {(totalMRR * 0.3).toLocaleString()} FCFA</p>
          </div>
        </div>
      </div>

      {/* Failed Payments Table */}
      <div className="bg-gray-900 border border-red-900/40 rounded-xl overflow-hidden lg:col-span-2">
        <div className="p-4 bg-red-900/10 border-b border-red-900/20 flex justify-between items-center">
           <h3 className="text-sm font-bold text-red-100 flex items-center gap-2">
             <AlertCircle className="w-4 h-4 text-red-500" />
             Failed Payments - Attention Required
           </h3>
           <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
             {failedPayments.length} Critical
           </span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
                <th className="p-4 font-medium">Company</th>
                <th className="p-4 font-medium">Amount</th>
                <th className="p-4 font-medium">Error</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {failedPayments.map(payment => (
                <tr key={payment.id} className="hover:bg-gray-800/30">
                  <td className="p-4">
                    <span className="font-bold text-white block">{payment.companyName}</span>
                    <span className="text-xs text-red-400">{payment.attempts} failed attempts</span>
                  </td>
                  <td className="p-4 text-gray-300 font-mono">{payment.amount?.toLocaleString()} FCFA</td>
                  <td className="p-4">
                    <span className="inline-block px-2 py-1 bg-red-900/20 border border-red-900/50 rounded text-xs text-red-300">
                      {payment.error}
                    </span>
                  </td>
                  <td className="p-4">
                     <div className="flex items-center gap-2">
                        <button className="p-1.5 bg-gray-800 rounded hover:text-white text-gray-400 transition-colors"><Mail className="w-3 h-3"/></button>
                        <button className="p-1.5 bg-gray-800 rounded hover:text-white text-gray-400 transition-colors"><Phone className="w-3 h-3"/></button>
                        <span className="text-xs text-gray-500 truncate max-w-[100px]">{payment.contact}</span>
                     </div>
                  </td>
                  <td className="p-4 text-right">
                    <button className="text-xs font-medium text-red-400 hover:text-red-300 hover:underline">Suspend Service</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};