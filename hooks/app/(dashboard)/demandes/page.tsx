'use client';

// ============================================================================
// 📁 app/(dashboard)/demandes/page.tsx
// ✅ Hub central des demandes — absences, permissions, congés ET prêts/avances
//    réunis. C'est la page vers laquelle pointe l'entrée "Demandes" du menu,
//    et vers laquelle renvoient les toasts de synthèse.
//
// 🔧 Ajouté : les demandes de prêt/avance (module Avances & Prêts) ne
//    remontaient pas ici — seules absences/permissions/congés étaient
//    suivies. Elles créaient pourtant déjà une notification RH
//    (LOAN_REQUEST/ADVANCE_REQUEST) — même comportement ajouté ici.
// ============================================================================

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Loader2, FileText, Ticket, Calendar, ArrowRight, Clock,
  Stethoscope, Briefcase, HelpCircle, Umbrella, HandCoins,
} from 'lucide-react';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';

const TYPE_META: Record<'absence' | 'permission' | 'leave' | 'loan', { label: string; icon: any; color: string; href: string }> = {
  absence:    { label: 'Absence',    icon: FileText,  color: 'orange', href: '/presences/absences' },
  permission: { label: 'Permission', icon: Ticket,    color: 'violet', href: '/presences/permissions' },
  leave:      { label: 'Congé',      icon: Umbrella,  color: 'sky',    href: '/conges' },
  loan:       { label: 'Prêt/Avance', icon: HandCoins, color: 'emerald', href: '/loans' },
};

const LOAN_PENDING_STATUSES = ['PENDING', 'PENDING_DG'];

export default function DemandesHubPage() {
  const { bp } = useBasePath();
  const [isLoading, setIsLoading] = useState(true);
  const [absences, setAbsences] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [a, p, l, ln, ad]: any = await Promise.all([
          api.get('/absence-requests').catch(() => []),
          api.get('/permission-tickets').catch(() => []),
          api.get('/leaves').catch(() => []),
          api.get('/loans').catch(() => []),
          api.get('/loans/advances').catch(() => []),
        ]);
        setAbsences(a || []);
        setPermissions(p || []);
        setLeaves(l || []);
        setLoans(ln || []);
        setAdvances(ad || []);
      } catch (e) {
        console.error('Erreur chargement des demandes', e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const pendingAbsences = absences.filter(a => a.status === 'PENDING').length;
  const pendingPermissions = permissions.filter(p => p.status === 'PENDING').length;
  const pendingLeaves = leaves.filter((l: any) => l.status === 'PENDING').length;
  // ✅ Prêts (PENDING ou PENDING_DG, double validation) + Avances (PENDING)
  const pendingLoans = loans.filter((l: any) => LOAN_PENDING_STATUSES.includes(l.status)).length
    + advances.filter((a: any) => a.status === 'PENDING').length;
  const totalPending = pendingAbsences + pendingPermissions + pendingLeaves + pendingLoans;

  const combinedPending = useMemo(() => {
    const items = [
      ...absences.filter(a => a.status === 'PENDING').map(a => ({ kind: 'absence' as const, id: a.id, employee: a.employee, date: a.createdAt, label: 'Demande d\u2019absence', sub: a.type })),
      ...permissions.filter(p => p.status === 'PENDING').map(p => ({ kind: 'permission' as const, id: p.id, employee: p.employee, date: p.createdAt, label: 'Ticket de permission', sub: p.type })),
      ...leaves.filter((l: any) => l.status === 'PENDING').map((l: any) => ({ kind: 'leave' as const, id: l.id, employee: l.employee, date: l.createdAt, label: 'Demande de congé', sub: l.type })),
      ...loans.filter((l: any) => LOAN_PENDING_STATUSES.includes(l.status)).map((l: any) => ({ kind: 'loan' as const, id: l.id, employee: l.employee, date: l.createdAt, label: 'Demande de prêt', sub: 'LOAN' })),
      ...advances.filter((a: any) => a.status === 'PENDING').map((a: any) => ({ kind: 'loan' as const, id: a.id, employee: a.employee, date: a.createdAt, label: 'Demande d\u2019avance', sub: 'ADVANCE' })),
    ];
    return items.sort((x, y) => new Date(y.date).getTime() - new Date(x.date).getTime());
  }, [absences, permissions, leaves, loans, advances]);

  const SUB_ICON: Record<string, any> = { MALADIE: Stethoscope, URGENCE: Stethoscope, MISSION: Briefcase, CONVENTIONNELLE: FileText, EXCEPTIONNELLE: HelpCircle, LOAN: HandCoins, ADVANCE: HandCoins };

  if (isLoading) return <div className="flex justify-center py-24"><Loader2 className="animate-spin text-sky-500" size={40} /></div>;

  return (
    <div className="max-w-[1400px] mx-auto pb-24 space-y-6">
      <div>
        <p className="text-xs font-bold tracking-[0.2em] text-gray-400 uppercase mb-1">Ressources Humaines</p>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Demandes</h1>
        <p className="text-gray-400 text-sm mt-1">
          {totalPending > 0
            ? <span className="text-red-500 font-semibold">{totalPending} demande{totalPending > 1 ? 's' : ''} à traiter</span>
            : 'Tout est à jour'}
        </p>
      </div>

      {/* Cartes par type */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {([
          { kind: 'absence' as const, count: pendingAbsences, total: absences.length },
          { kind: 'permission' as const, count: pendingPermissions, total: permissions.length },
          { kind: 'leave' as const, count: pendingLeaves, total: leaves.length },
          { kind: 'loan' as const, count: pendingLoans, total: loans.length + advances.length },
        ]).map(({ kind, count, total }) => {
          const meta = TYPE_META[kind];
          const Icon = meta.icon;
          return (
            <Link key={kind} href={bp(meta.href)} className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-lg hover:border-sky-200 dark:hover:border-sky-800 transition-all">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-11 h-11 rounded-xl bg-${meta.color}-100 dark:bg-${meta.color}-900/30 text-${meta.color}-600 dark:text-${meta.color}-400 flex items-center justify-center`}>
                  <Icon size={20} />
                </div>
                {count > 0 && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-400 mb-3">{meta.label}{count > 1 ? 's' : ''} à traiter · {total} au total</p>
              <span className="text-xs font-bold text-sky-500 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                Gérer <ArrowRight size={12} />
              </span>
            </Link>
          );
        })}
      </div>

      {/* Liste combinée des demandes en attente */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock size={16} className="text-gray-400" /> Toutes les demandes en attente
          </h2>
        </div>
        {combinedPending.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-gray-400">Aucune demande en attente — tout est traité 🎉</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {combinedPending.map(item => {
              const meta = TYPE_META[item.kind];
              const Icon = meta.icon;
              const SubIcon = SUB_ICON[item.sub] || Icon;
              return (
                <Link key={`${item.kind}-${item.id}`} href={bp(meta.href)} className="flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors">
                  <div className={`w-9 h-9 rounded-lg bg-${meta.color}-50 dark:bg-${meta.color}-900/20 text-${meta.color}-500 flex items-center justify-center shrink-0`}>
                    <SubIcon size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.employee?.firstName} {item.employee?.lastName}</p>
                    <p className="text-xs text-gray-400">{meta.label} · {new Date(item.date).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <ArrowRight size={14} className="text-gray-300 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}