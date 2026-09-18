// ============================================================================
// 📁 src/components/payroll/PayrollTableRow.tsx
// Ajout : option "Supprimer définitivement" dans le menu contextuel
// ============================================================================
import { Eye, MoreHorizontal, Loader2, CheckCircle, DollarSign, Ban, RotateCcw, Pencil, Trash2 } from 'lucide-react';
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
  onEdit?: () => void;
  onDelete?: () => void;  // ← nouveau
}

const StatusBadge = ({ status }: { status: PayrollStatus }) => {
  const config = {
    Draft:     { color: 'bg-[var(--surface-2)] text-[var(--text-muted)]',                              icon: Pencil,      label: 'Brouillon' },
    Validated: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', icon: CheckCircle, label: 'Validé' },
    Paid:      { color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',        icon: CheckCircle, label: 'Payé' },
    Cancelled: { color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',              icon: Ban,         label: 'Annulé' },
  };
  const { color, icon: Icon, label } = config[status] || config['Draft'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${color}`}>
      <Icon size={12} /> {label}
    </span>
  );
};

// ── Menu item helper ──────────────────────────────────────────────────────────
const MenuItem = ({
  icon: Icon, label, sub, onClick, colorClass = 'text-[var(--text-muted)] hover:bg-[var(--surface-2)]',
  iconBg = 'bg-[var(--surface-2)]', divider = false,
}: {
  icon: any; label: string; sub?: string; onClick: () => void;
  colorClass?: string; iconBg?: string; divider?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full text-left px-4 py-3 text-sm font-bold flex items-center gap-3 transition-colors ${colorClass} ${divider ? 'border-b border-[var(--border)]' : ''}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
      <Icon size={15} />
    </div>
    <div>
      <p className="font-bold">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] font-normal">{sub}</p>}
    </div>
  </button>
);

export function PayrollTableRow({
  entry, isSelected, isActionLoading,
  onToggleSelect, onView, onStatusChange, onEdit, onDelete,
}: PayrollTableRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const close = () => setIsMenuOpen(false);
  const fmt = (val: number) => (val || 0).toLocaleString('fr-FR') + ' FCFA';

  return (
    <tr className={`group transition-colors hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}>
      <td className="px-6 py-4">
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
          className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={entry.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-[var(--border)]" />
          <div>
            <p className="font-bold text-[var(--text)]">{entry.name}</p>
            <p className="text-xs text-[var(--text-muted)] font-mono">{entry.matricule}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-[var(--text)] font-medium">{entry.position}</p>
        <p className="text-xs text-[var(--text-muted)]">{entry.department}</p>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-mono font-bold ${entry.daysWorked < entry.totalDays ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
          {entry.daysWorked}/{entry.totalDays}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-bold text-[var(--text)] font-mono bg-[var(--surface-2)] px-2 py-1 rounded">
          {fmt(entry.netSalary)}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {isActionLoading
          ? <Loader2 className="animate-spin inline text-emerald-500" size={16} />
          : <StatusBadge status={entry.status} />}
      </td>
      <td className="px-6 py-4 text-right relative">
        <div className="flex justify-end gap-1">
          <button onClick={onView}
            className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
            title="Voir le bulletin">
            <Eye size={18} />
          </button>
          <div className="relative">
            <button
              onClick={e => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-gray-400 hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
              <MoreHorizontal size={16} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] rounded-xl shadow-2xl border-2 border-[var(--border)] z-50 overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  {/* ── DRAFT ── */}
                  {entry.status === 'Draft' && (
                    <>
                      {onEdit && (
                        <MenuItem icon={Pencil} label="Modifier" sub="Jours, heures sup"
                          onClick={() => { onEdit(); close(); }}
                          colorClass="text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
                          iconBg="bg-[var(--surface-2)]" divider />
                      )}
                      <MenuItem icon={CheckCircle} label="Valider" sub="Marquer comme validé"
                        onClick={() => { onStatusChange('VALIDATED'); close(); }}
                        colorClass="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        iconBg="bg-emerald-100 dark:bg-emerald-900/30" divider />
                      <MenuItem icon={Ban} label="Annuler" sub="Annuler ce bulletin"
                        onClick={() => { onStatusChange('CANCELLED'); close(); }}
                        colorClass="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                        iconBg="bg-amber-100 dark:bg-amber-900/30" divider />
                    </>
                  )}

                  {/* ── VALIDATED ── */}
                  {entry.status === 'Validated' && (
                    <>
                      <MenuItem icon={DollarSign} label="Payer" sub="Marquer comme payé"
                        onClick={() => { onStatusChange('PAID'); close(); }}
                        colorClass="text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                        iconBg="bg-emerald-100 dark:bg-emerald-900/30" divider />
                      <MenuItem icon={RotateCcw} label="Remettre en brouillon"
                        onClick={() => { onStatusChange('DRAFT'); close(); }}
                        iconBg="bg-[var(--surface-2)]" divider />
                    </>
                  )}

                  {/* ── PAID ── */}
                  {entry.status === 'Paid' && (
                    <MenuItem icon={Ban} label="Annuler paiement" sub="Annuler ce bulletin payé"
                      onClick={() => { onStatusChange('CANCELLED'); close(); }}
                      colorClass="text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                      iconBg="bg-amber-100 dark:bg-amber-900/30" divider />
                  )}

                  {/* ── CANCELLED ── */}
                  {entry.status === 'Cancelled' && (
                    <MenuItem icon={RotateCcw} label="Restaurer" sub="Remettre en brouillon"
                      onClick={() => { onStatusChange('DRAFT'); close(); }}
                      iconBg="bg-[var(--surface-2)]" divider />
                  )}

                  {/* ── SUPPRIMER — toujours disponible ── */}
                  {onDelete && (
                    <MenuItem
                      icon={Trash2}
                      label="Supprimer"
                      sub="Suppression définitive"
                      onClick={() => { onDelete(); close(); }}
                      colorClass="text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      iconBg="bg-red-100 dark:bg-red-900/30"
                    />
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