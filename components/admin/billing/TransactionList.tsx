// ============================================================================
// Fichier: frontend/components/admin/billing/TransactionList.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { 
  Search, Filter, Download, Eye, RotateCcw, Reply, FileText, Check, AlertCircle, Clock 
} from 'lucide-react';

interface Transaction {
  id: string;
  date: string;
  companyName: string;
  companyLogo: string;
  invoiceId: string;
  amount: number;
  method: string;
  status: string;
  plan: string;
}

interface TransactionListProps {
  transactions?: Transaction[];
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions = [] }) => {
  const [filter, setFilter] = useState('All');
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="p-6 border-b border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
           <h3 className="text-lg font-bold text-white">All Transactions</h3>
           <p className="text-sm text-gray-500">Monitor all incoming revenue streams</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                type="text" 
                placeholder="Search invoice..." 
                className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded-lg pl-9 pr-4 py-2 focus:border-brand-red outline-none w-48"
                />
            </div>
            <select className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
                <option>Status: All</option>
                <option>Success</option>
                <option>Failed</option>
            </select>
            <select className="bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-3 py-2 outline-none">
                <option>Method: All</option>
                <option>Airtel Money</option>
                <option>MTN MoMo</option>
                <option>Bank</option>
            </select>
            <button className="p-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-400 hover:text-white">
                <Download className="w-4 h-4" />
            </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-800/50 text-gray-400 text-xs uppercase tracking-wider">
              <th className="p-4 font-semibold">Date</th>
              <th className="p-4 font-semibold">Company</th>
              <th className="p-4 font-semibold">Invoice</th>
              <th className="p-4 font-semibold">Amount</th>
              <th className="p-4 font-semibold">Method</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <tr 
                  key={tx.id} 
                  className={`hover:bg-gray-800/50 transition-colors ${
                      tx.status === 'Failed' ? 'bg-red-900/10' : 
                      tx.status === 'Pending' ? 'bg-orange-900/10' : ''
                  }`}
                >
                  <td className="p-4 text-sm text-gray-300 whitespace-nowrap">{tx.date}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400 border border-gray-700">
                        {tx.companyLogo}
                      </div>
                      <div>
                          <div className="font-medium text-white text-sm">{tx.companyName}</div>
                          <div className="text-[10px] text-gray-500 uppercase">{tx.plan}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 text-xs font-mono text-gray-400">{tx.invoiceId}</td>
                  <td className="p-4 text-sm font-bold text-white whitespace-nowrap">{tx.amount.toLocaleString()} FCFA</td>
                  <td className="p-4 text-sm text-gray-300 flex items-center gap-2">
                      {tx.method === 'Airtel Money' && <div className="w-2 h-2 bg-red-500 rounded-full"></div>}
                      {tx.method === 'MTN Mobile Money' && <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>}
                      {tx.method === 'Bank Transfer' && <div className="w-2 h-2 bg-blue-500 rounded-full"></div>}
                      {tx.method}
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                      tx.status === 'Success' ? 'bg-green-900/20 text-green-400 border-green-900/50' :
                      tx.status === 'Failed' ? 'bg-red-900/20 text-red-400 border-red-900/50' :
                      'bg-orange-900/20 text-orange-400 border-orange-900/50'
                    }`}>
                      {tx.status === 'Success' && <Check className="w-3 h-3" />}
                      {tx.status === 'Failed' && <AlertCircle className="w-3 h-3" />}
                      {tx.status === 'Pending' && <Clock className="w-3 h-3" />}
                      {tx.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="View Invoice">
                          <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Download PDF">
                          <FileText className="w-4 h-4" />
                      </button>
                      {tx.status === 'Failed' && (
                          <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400" title="Retry Payment">
                              <RotateCcw className="w-4 h-4" />
                          </button>
                      )}
                       {tx.status === 'Success' && (
                          <button className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-orange-400" title="Refund">
                              <Reply className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-500">
                  Aucune transaction trouvée
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
       <div className="p-3 border-t border-gray-800 bg-gray-800/20 text-center">
        <button className="text-xs text-brand-red hover:text-red-400 font-medium transition-colors">
          Load more transactions
        </button>
      </div>
    </div>
  );
};