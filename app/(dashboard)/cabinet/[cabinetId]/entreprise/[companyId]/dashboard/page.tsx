'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/dashboard/page.tsx
// Vue d'ensemble PME vue par le cabinet — même contenu que /dashboard mais pour la PME ciblée

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, Fingerprint, Calendar, FileText,
  DollarSign, TrendingUp, AlertCircle, ArrowRight,
  Building2, Loader2, CheckCircle2,
} from 'lucide-react';
import { api } from '@/services/api';

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

export default function CabinetPmeDashboardPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;
  const companyId = params.companyId as string;

  const now = new Date();
  const [stats,   setStats]   = useState<any>(null);
  const [leaves,  setLeaves]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [emps, pays, leavesRes] = await Promise.all([
          api.get(`/employees?companyId=${companyId}&status=ACTIVE&limit=1`) as Promise<any>,
          api.get(`/payrolls?companyId=${companyId}&month=${now.getMonth() + 1}&year=${now.getFullYear()}&limit=1`) as Promise<any>,
          api.get(`/leaves?companyId=${companyId}`) as Promise<any>,
        ]);

        const empCount  = emps?.total ?? (Array.isArray(emps) ? emps.length : 0);
        const payList   = Array.isArray(pays) ? pays : pays?.data ?? [];
        const leaveList = Array.isArray(leavesRes) ? leavesRes : [];
        const pending   = leaveList.filter((l: any) => l.status === 'PENDING');

        setStats({
          employees:    empCount,
          payrolls:     payList.length,
          pendingLeaves: pending.length,
          totalNet:     payList.reduce((s: number, p: any) => s + (p.netSalary ?? 0), 0),
          totalGross:   payList.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0),
        });
        setLeaves(leaveList.slice(0, 5));
      } catch {
        setStats({ employees: 0, payrolls: 0, pendingLeaves: 0, totalNet: 0, totalGross: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'En attente', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    APPROVED:  { label: 'Approuvé',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    REJECTED:  { label: 'Refusé',     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
    CANCELLED: { label: 'Annulé',     color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
  };

  const LEAVE_TYPES: Record<string, string> = {
    ANNUAL:'Annuel', SICK:'Maladie', MATERNITY:'Maternité', PATERNITY:'Paternité', UNPAID:'Sans solde',
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 size={24} className="animate-spin text-gray-600" />
    </div>
  );

  return (
    <div className="p-6 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Vue d'ensemble</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </p>
        </div>
        {/* Accès rapide paie */}
        <button onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl text-sm transition-colors">
          <DollarSign size={14} /> Saisir la paie
        </button>
      </div>

      {/* KPI */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Employés actifs',    value: stats.employees,              icon: Users,       color:'#6366f1', link:`/cabinet/${cabinetId}/entreprise/${companyId}/employes` },
            { label:'Congés en attente',  value: stats.pendingLeaves,          icon: Calendar,    color:'#f97316', link:`/cabinet/${cabinetId}/entreprise/${companyId}/conges` },
            { label:'Bulletins ce mois',  value: stats.payrolls,               icon: FileText,    color:'#22c55e', link:`/cabinet/${cabinetId}/entreprise/${companyId}/bulletins` },
            { label:'Masse nette du mois',value: `${fmt(stats.totalNet)} F`,   icon: DollarSign,  color:'#0ea5e9', link:`/cabinet/${cabinetId}/entreprise/${companyId}/rapports` },
          ].map(c => (
            <button key={c.label} onClick={() => router.push(c.link)}
              className="bg-white/3 hover:bg-white/5 border border-white/8 hover:border-white/15 rounded-2xl p-4 text-left transition-all group">
              <div className="flex items-start justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background:`${c.color}22`, border:`1px solid ${c.color}44` }}>
                  <c.icon size={15} style={{ color: c.color }} />
                </div>
                <ArrowRight size={13} className="text-gray-700 group-hover:text-gray-400 transition-colors" />
              </div>
              <p className="text-xl font-bold text-white">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </button>
          ))}
        </div>
      )}

      {/* Accès rapides cabinet */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label:'Saisir variables paie', icon: DollarSign, color:'#0ea5e9', link: `/cabinet/${cabinetId}/entreprise/${companyId}/paie` },
          { label:'Résumé présences',      icon: Fingerprint, color:'#22c55e', link: `/cabinet/${cabinetId}/entreprise/${companyId}/presences` },
          { label:'Générer bulletins',     icon: FileText,   color:'#8b5cf6', link: `/cabinet/${cabinetId}/entreprise/${companyId}/bulletins` },
        ].map(a => (
          <button key={a.label} onClick={() => router.push(a.link)}
            className="bg-white/3 hover:bg-white/5 border border-white/8 rounded-xl p-4 text-left transition-all flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background:`${a.color}22`, border:`1px solid ${a.color}44` }}>
              <a.icon size={16} style={{ color: a.color }} />
            </div>
            <span className="text-sm font-medium text-white">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Derniers congés */}
      {leaves.length > 0 && (
        <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
          <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
            <h3 className="font-semibold text-white text-sm">Dernières demandes de congé</h3>
            <button onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/conges`)}
              className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
              Tout voir <ArrowRight size={11} />
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {leaves.map((l: any) => {
              const sc = STATUS_CFG[l.status] ?? STATUS_CFG['PENDING'];
              return (
                <div key={l.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-white/3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center shrink-0">
                      <span className="text-[9px] font-bold text-gray-400">
                        {`${l.employee?.firstName?.[0]??''}${l.employee?.lastName?.[0]??''}`.toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{l.employee?.firstName} {l.employee?.lastName}</p>
                      <p className="text-xs text-gray-500">
                        {LEAVE_TYPES[l.type] ?? l.type} ·{' '}
                        {new Date(l.startDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                        {' → '}
                        {new Date(l.endDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ml-2 ${sc.bg} ${sc.color}`}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}