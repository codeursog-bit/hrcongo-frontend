// ============================================================================
// 📁 src/components/payroll/PayrollTableRow.tsx
// Ajout : option "Supprimer définitivement" dans le menu contextuel
// ============================================================================
import { Eye, MoreHorizontal, Loader2, CheckCircle, DollarSign, Ban, RotateCcw, Pencil, Trash2, type LucideIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { AnchoredMenu } from '@/components/ui/AnchoredMenu';
import { Badge, type Tone } from '@/components/design-system/primitives';

type PayrollStatus = 'Draft' | 'Validated' | 'ToPay' | 'Paid' | 'Cancelled';

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
  const config: Record<PayrollStatus, { tone: Tone; icon: LucideIcon; label: string }> = {
    Draft:     { tone: 'neutral', icon: Pencil,      label: 'Brouillon' },
    Validated: { tone: 'success', icon: CheckCircle, label: 'Validé' },
    ToPay:     { tone: 'warning', icon: DollarSign,  label: 'À payer' },
    Paid:      { tone: 'success', icon: CheckCircle, label: 'Payé' },
    Cancelled: { tone: 'danger',  icon: Ban,         label: 'Annulé' },
  };
  const { tone, icon: Icon, label } = config[status] || config.Draft;
  return (
    <Badge tone={status === 'Cancelled' ? 'neutral' : tone}><Icon size={12} aria-hidden="true" /> {label}</Badge>
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
    className={`w-full text-left px-4 py-3 text-sm font-semibold flex items-center gap-3 transition-colors ${colorClass} ${divider ? 'border-b border-[var(--border)]' : ''}`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}>
      <Icon size={15} />
    </div>
    <div>
      <p className="font-semibold">{label}</p>
      {sub && <p className="text-xs text-[var(--text-muted)] font-normal">{sub}</p>}
    </div>
  </button>
);

export function PayrollTableRow({
  entry, isSelected, isActionLoading,
  onToggleSelect, onView, onStatusChange, onEdit, onDelete,
}: PayrollTableRowProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const uiMenuAnchor = useRef<HTMLButtonElement>(null);
  const close = () => setIsMenuOpen(false);
  const fmt = (val: number) => (val || 0).toLocaleString('fr-FR') + ' FCFA';

  return (
    <tr className={`group transition-colors hover:bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  ${isSelected ? 'bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] ' : ''}`}>
      <td className="px-6 py-4">
        <input type="checkbox" checked={isSelected} onChange={onToggleSelect}
          aria-label={`Sélectionner le bulletin de ${entry.name}`}
          className="rounded border-[var(--border)] text-[var(--success-text)] focus:ring-[var(--focus)]" />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={entry.avatar} alt="" className="w-9 h-9 rounded-full object-cover border border-[var(--border)]" />
          <div>
            <p className="font-semibold text-[var(--text)]">{entry.name}</p>
            <p className="text-xs text-[var(--text-muted)] font-mono">{entry.matricule}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <p className="text-[var(--text)] font-medium">{entry.position}</p>
        <p className="text-xs text-[var(--text-muted)]">{entry.department}</p>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`font-mono font-semibold ${entry.daysWorked < entry.totalDays ? 'text-[var(--warning-text)]' : 'text-[var(--text-muted)]'}`}>
          {entry.daysWorked}/{entry.totalDays}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="font-semibold text-[var(--text)] font-mono bg-[var(--surface-2)] px-2 py-1 rounded">
          {fmt(entry.netSalary)}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        {isActionLoading
          ? <Loader2 className="animate-spin inline text-[var(--success-text)]" size={16} />
          : <StatusBadge status={entry.status} />}
      </td>
      <td className="px-6 py-4 text-right relative">
        <div className="flex justify-end gap-1">
          <button type="button" onClick={onView} aria-label={`Voir le bulletin de ${entry.name}`}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--action)] hover:bg-[var(--brand-soft)]  rounded-lg transition-colors"
            title="Voir le bulletin">
            <Eye size={18} />
          </button>
          <div className="relative">
            <button
              type="button"
              ref={uiMenuAnchor}
              onClick={e => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
              aria-label={`Actions du bulletin de ${entry.name}`}
              aria-expanded={isMenuOpen}
              className={`p-2 rounded-lg transition-colors ${isMenuOpen ? 'bg-[var(--surface-2)] text-[var(--text)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-muted)] hover:bg-[var(--surface-2)]'}`}>
              <MoreHorizontal size={16} />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <AnchoredMenu anchorRef={uiMenuAnchor} onClose={close} label={`Actions du bulletin de ${entry.name}`}>
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
                        colorClass="text-[var(--success-text)] hover:bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] "
                        iconBg="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))] " divider />
                      <MenuItem icon={Ban} label="Annuler" sub="Annuler ce bulletin"
                        onClick={() => { onStatusChange('CANCELLED'); close(); }}
                        colorClass="text-[var(--warning-text)] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] "
                        iconBg="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] " divider />
                    </>
                  )}

                  {/* ── VALIDATED ── */}
                  {entry.status === 'Validated' && (
                    <>
                      <MenuItem icon={DollarSign} label="À payer" sub="Verrouiller et transmettre à Compta"
                        onClick={() => { onStatusChange('TO_PAY'); close(); }}
                        colorClass="text-[var(--action)] hover:bg-[var(--brand-soft)] "
                        iconBg="bg-[var(--brand-soft)] " divider />
                      <MenuItem icon={RotateCcw} label="Remettre en brouillon"
                        onClick={() => { onStatusChange('DRAFT'); close(); }}
                        iconBg="bg-[var(--surface-2)]" divider />
                    </>
                  )}

                  {/* ── À PAYER ── */}
                  {entry.status === 'ToPay' && (
                    <MenuItem icon={Ban} label="Annuler la demande" sub="Annuler avant paiement"
                      onClick={() => { onStatusChange('CANCELLED'); close(); }}
                      colorClass="text-[var(--warning-text)] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] "
                      iconBg="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] " divider />
                  )}

                  {/* ── PAID ── */}
                  {entry.status === 'Paid' && (
                    <MenuItem icon={Ban} label="Annuler paiement" sub="Annuler ce bulletin payé"
                      onClick={() => { onStatusChange('CANCELLED'); close(); }}
                      colorClass="text-[var(--warning-text)] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] "
                      iconBg="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] " divider />
                  )}

                  {/* ── CANCELLED ── */}
                  {entry.status === 'Cancelled' && (
                    <MenuItem icon={RotateCcw} label="Restaurer" sub="Remettre en brouillon"
                      onClick={() => { onStatusChange('DRAFT'); close(); }}
                      iconBg="bg-[var(--surface-2)]" divider />
                  )}

                  {/* ── SUPPRIMER — toujours disponible ── */}
                  {onDelete && entry.status !== 'ToPay' && entry.status !== 'Paid' && (
                    <MenuItem
                      icon={Trash2}
                      label="Supprimer"
                      sub="Suppression définitive"
                      onClick={() => { onDelete(); close(); }}
                      colorClass="text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] "
                      iconBg="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] "
                    />
                  )}
                </AnchoredMenu>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
    </tr>
  );
}
