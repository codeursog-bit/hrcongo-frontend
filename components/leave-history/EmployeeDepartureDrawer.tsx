'use client';

// ============================================================================
// 📁 components/leave-history/EmployeeDepartureDrawer.tsx
// ✅ Panneau latéral "fiche employé" de l'historique des départs :
//    identité, date d'embauche, ancienneté, derniers départs, prochains départs.
// ============================================================================

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, CalendarCheck, Briefcase, Clock, Plane, ExternalLink } from 'lucide-react';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { motion } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import {
  LEAVE_TYPE_LABELS, LEAVE_TYPE_COLORS, fmtDate, fmtDays, initials,
} from '@/lib/leave-history-utils';

interface Props {
  employeeId: string;
  onClose: () => void;
}

const CONTRACT_LABELS: Record<string, string> = {
  CDI: 'CDI', CDD: 'CDD', STAGE: 'Stage', INTERIM: 'Intérim', CONSULTANT: 'Consultant',
};

function InfoTile({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="bg-[var(--surface-2)] rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-muted)] mb-1">
        <Icon size={12} /> {label}
      </div>
      <div className="text-sm font-bold text-[var(--text)]">{value}</div>
    </div>
  );
}

export default function EmployeeDepartureDrawer({ employeeId, onClose }: Props) {
  const { bp } = useBasePath();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get<any>(`/leaves/departure-history/employee/${employeeId}`);
        if (alive) setData(res);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Impossible de charger la fiche.');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [employeeId]);

  const emp = data?.employee;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.aside
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="relative w-full max-w-md h-full bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 bg-[var(--surface)] border-b border-[var(--border)]">
          <h2 className="font-bold text-[var(--text)]">Fiche de l&apos;employé</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--surface-2)]" aria-label="Fermer">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <KonzaLoader variant="section" />
        ) : error || !emp ? (
          <p className="p-6 text-sm text-red-500">{error || 'Fiche introuvable.'}</p>
        ) : (
          <div className="p-5 space-y-6">
            {/* Identité */}
            <div className="flex items-center gap-4">
              {emp.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={emp.photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center text-xl font-bold">
                  {initials(emp.firstName, emp.lastName)}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-lg font-bold text-[var(--text)] truncate">{emp.firstName} {emp.lastName}</p>
                <p className="text-sm text-[var(--text-muted)] truncate">{emp.position}</p>
                <p className="text-xs text-[var(--text-muted)] truncate">
                  {emp.department?.name || 'Sans département'} · Matricule {emp.employeeNumber}
                </p>
              </div>
            </div>

            {/* Repères */}
            <div className="grid grid-cols-2 gap-3">
              <InfoTile icon={Briefcase} label="Date d'embauche" value={fmtDate(emp.hireDate)} />
              <InfoTile icon={Clock} label="Ancienneté" value={emp.seniority?.label || '—'} />
              <InfoTile icon={CalendarCheck} label="Dernier congé annuel" value={fmtDate(data.totals.lastAnnualDeparture)} />
              <InfoTile icon={Plane} label="Prochain départ" value={fmtDate(data.totals.nextDeparture)} />
              <InfoTile icon={Briefcase} label="Contrat" value={CONTRACT_LABELS[emp.contractType] || emp.contractType || '—'} />
              <InfoTile icon={Clock} label="Statut" value={emp.status === 'ACTIVE' ? 'En poste' : emp.status} />
            </div>

            {/* Totaux */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl border border-[var(--border)] p-3">
                <p className="text-xl font-bold text-[var(--text)]">{data.totals.departures}</p>
                <p className="text-[11px] text-[var(--text-muted)]">départs</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-3">
                <p className="text-xl font-bold text-[var(--text)]">{fmtDays(data.totals.totalDaysTaken)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">jours posés</p>
              </div>
              <div className="rounded-xl border border-[var(--border)] p-3">
                <p className="text-xl font-bold text-[var(--text)]">{fmtDays(data.totals.totalForfeited)}</p>
                <p className="text-[11px] text-[var(--text-muted)]">non pris (retour anticipé)</p>
              </div>
            </div>

            {/* Prochains départs */}
            {data.upcoming.length > 0 && (
              <section>
                <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Départs planifiés</h3>
                <ul className="space-y-2">
                  {data.upcoming.map((u: any) => (
                    <li key={u.id} className="flex items-center justify-between rounded-xl bg-emerald-50 dark:bg-emerald-900/10 px-3 py-2 text-sm">
                      <span className="text-[var(--text)]">{fmtDate(u.startDate)} → {fmtDate(u.endDate)}</span>
                      <span className="text-xs font-semibold text-emerald-600">{fmtDays(u.daysCount)}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Historique */}
            <section>
              <h3 className="text-xs font-bold uppercase tracking-wide text-[var(--text-muted)] mb-2">Départs effectués</h3>
              {data.departures.length === 0 ? (
                <p className="text-sm text-[var(--text-muted)]">Aucun départ enregistré.</p>
              ) : (
                <ol className="relative border-l border-[var(--border)] ml-2 space-y-4">
                  {data.departures.map((d: any) => (
                    <li key={d.id} className="ml-4">
                      <span
                        className="absolute -left-[5px] w-2.5 h-2.5 rounded-full"
                        style={{ background: LEAVE_TYPE_COLORS[d.type] || '#94a3b8' }}
                      />
                      <p className="text-sm font-semibold text-[var(--text)]">
                        {LEAVE_TYPE_LABELS[d.type] || d.type} · {fmtDays(d.daysCount)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {fmtDate(d.startDate)} → {fmtDate(d.endDate)}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        Ancienneté au départ : {d.seniorityAtDeparture?.label}
                        {d.forfeitedDays > 0 && (
                          <span className="text-amber-600"> · retour anticipé le {fmtDate(d.actualReturnDate)} ({fmtDays(d.forfeitedDays)} non pris)</span>
                        )}
                        {d.isCarryover && ' · rattrapage de reliquat'}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </section>

            <Link
              href={bp(`/conges/gestion?employee=${employeeId}`)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-[var(--border)] text-sm font-semibold text-[var(--text-muted)] hover:bg-[var(--surface-2)]"
            >
              <ExternalLink size={14} /> Ouvrir dans Gestion des congés
            </Link>
          </div>
        )}
      </motion.aside>
    </div>
  );
}