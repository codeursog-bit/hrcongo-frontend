// ============================================================================
// 📁 src/components/payroll/PayrollTableRow.tsx
// ============================================================================

import { Eye, MoreHorizontal, Loader2, CheckCircle, DollarSign, Ban, RotateCcw, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

type PayrollStatus = 'Draft' | 'Validated' | 'Paid' | 'Cancelled';

interface PayrollEntry {
  id: string;
  name: string;
  matricule: string;
  avatar: string;
  position: string;
  department: string;
  daysWorked: number;
  totalDays: number;
  netSalary: number;
  status: PayrollStatus;
}

interface PayrollTableRowProps {
  entry: PayrollEntry;
  isSelected: boolean;
  isActionLoading: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onStatusChange: (newStatus: string) => void;
}

const StatusBadge = ({ status }: { status: PayrollStatus }) => {
  const config = {
    Draft: { color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300', icon: Pencil, label: 'Brouillon' },
    Validated: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: 'Validé' },
    Paid: { color: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', icon: CheckCircle, label: 'Payé' },
    Cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: Ban, label: 'Annulé' },
  };
  const { color, icon: Icon, label } = config[status] || config['Draft'];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <Icon size={12} />
      {label}
    </span>
  );
};

export function PayrollTableRow({ 
  entry, 
  isSelected, 
  isActionLoading, 
  onToggleSelect, 
  onView, 
  onStatusChange 
}: PayrollTableRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const formatCurrency = (val: number) => (val || 0).toLocaleString('fr-FR') + ' FCFA';

  return (
    <tr className={`group transition-colors hover:bg-sky-50/50 dark:hover:bg-sky-900/10 ${isSelected ? 'bg-sky-50 dark:bg-sky-900/20' : ''}`}>
      <td className="px-6 py-4">
        <input 
          type="checkbox" 
          checked={isSelected}
          onChange={onToggleSelect}
          className="rounded border-gray-300 text-sky-500 focus:ring-sky-500"
        />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={entry.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-gray-200 dark:border-gray-600" />
          <div>
            <p className="font-bold text-gray-900 dark:text-white">{entry.name}</p>
            <p className="text-xs text-gray-500 font-mono">{entry.matricule}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-gray-700 dark:text-gray-300 font-medium">{entry.position}</p>
        <p className="text-xs text-gray-500">{entry.department}</p>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-mono font-bold ${entry.daysWorked < entry.totalDays ? 'text-orange-500' : 'text-gray-600 dark:text-gray-400'}`}>
          {entry.daysWorked}/{entry.totalDays}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-bold text-gray-900 dark:text-white font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
          {formatCurrency(entry.netSalary)}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {isActionLoading ? <Loader2 className="animate-spin inline text-sky-500" size={16} /> : <StatusBadge status={entry.status} />}
      </td>
      <td className="px-6 py-4 text-right relative">
        <div className="flex justify-end gap-1">
          <button 
            onClick={onView} 
            className="p-2 text-gray-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors" 
            title="Voir les détails"
          >
            <Eye size={18}/>
          </button>
          <div className="relative">
            <button 
              onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <MoreHorizontal size={16}/>
            </button>
            
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-52 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  {entry.status === 'Draft' && (
                    <>
                      <button 
                        onClick={() => { onStatusChange('VALIDATED'); setIsMenuOpen(false); }} 
                        className="w-full text-left px-4 py-3 text-sm font-bold text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 transition-colors"
                      >
                        <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                          <CheckCircle size={16} />
                        </div>
                        <div>
                          <p className="font-bold">Valider</p>
                          <p className="text-xs text-gray-500">Marquer comme validé</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => { onStatusChange('CANCELLED'); setIsMenuOpen(false); }} 
                        className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                      >
                        <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                          <Ban size={16} />
                        </div>
                        <div>
                          <p className="font-bold">Annuler</p>
                          <p className="text-xs text-gray-500">Annuler ce bulletin</p>
                        </div>
                      </button>
                    </>
                  )}
                  
                  {entry.status === 'Validated' && (
                    <>
                      <button 
                        onClick={() => { onStatusChange('PAID'); setIsMenuOpen(false); }} 
                        className="w-full text-left px-4 py-3 text-sm font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 transition-colors"
                      >
                        <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                          <DollarSign size={16} />
                        </div>
                        <div>
                          <p className="font-bold">Payer</p>
                          <p className="text-xs text-gray-500">Marquer comme payé</p>
                        </div>
                      </button>
                      <button 
                        onClick={() => { onStatusChange('DRAFT'); setIsMenuOpen(false); }} 
                        className="w-full text-left px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 transition-colors"
                      >
                        <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <RotateCcw size={16} />
                        </div>
                        <div>
                          <p className="font-bold">Remettre Brouillon</p>
                          <p className="text-xs text-gray-500">Retour en brouillon</p>
                        </div>
                      </button>
                    </>
                  )}

                  {entry.status === 'Paid' && (
                    <button 
                      onClick={() => { onStatusChange('CANCELLED'); setIsMenuOpen(false); }} 
                      className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                        <Ban size={16} />
                      </div>
                      <div>
                        <p className="font-bold">Annuler Paiement</p>
                        <p className="text-xs text-gray-500">Annuler ce bulletin payé</p>
                      </div>
                    </button>
                  )}

                  {entry.status === 'Cancelled' && (
                    <button 
                      onClick={() => { onStatusChange('DRAFT'); setIsMenuOpen(false); }} 
                      className="w-full text-left px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors"
                    >
                      <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                        <RotateCcw size={16} />
                      </div>
                      <div>
                        <p className="font-bold">Restaurer</p>
                        <p className="text-xs text-gray-500">Remettre en brouillon</p>
                      </div>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </tr>
  );
}
