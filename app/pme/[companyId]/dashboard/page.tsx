'use client';

// app/pme/[companyId]/dashboard/page.tsx
// Dashboard PME — vue identique à entreprise Konza

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Users, Fingerprint, Calendar, FileText, DollarSign,
  TrendingUp, AlertCircle, ArrowRight, Loader2,
  Clock, CheckCircle2, Package, BookOpen, Star,
} from 'lucide-react';
import { api } from '@/services/api';

const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);
const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const LEAVE_TYPES: Record<string, string> = {
  ANNUAL:'Annuel', SICK:'Maladie', MATERNITY:'Maternité',
  PATERNITY:'Paternité', UNPAID:'Sans solde', COMPENSATORY:'Compensatoire',
};

export default function PmeDashboardPage() {
  const params    = useParams();
  const router    = useRouter();
  const companyId = params.companyId as string;

  const now  = new Date();
  const [stats,     setStats]     = useState<any>(null);
  const [leaves,    setLeaves]    = useState<any[]>([]);
  const [payrolls,  setPayrolls]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [userRole,  setUserRole]  = useState('');
  const [userName,  setUserName]  = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const u = JSON.parse(stored);
      setUserRole(u.role || '');
      setUserName(u.firstName || '');
    }

    const load = async () => {
      setLoading(true);
      try {
        const [emps, pays, leavesRes] = await Promise.all([
          // PME user → APIs filtrent automatiquement par user.companyId
          api.get('/employees?status=ACTIVE&limit=1') as Promise<any>,
          api.get(`/payrolls?month=${now.getMonth()+1}&year=${now.getFullYear()}&limit=200`) as Promise<any>,
          api.get('/leaves') as Promise<any>,
        ]);

        const empTotal  = emps?.total  ?? (Array.isArray(emps) ? emps.length : 0);
        const payList   = Array.isArray(pays) ? pays : pays?.data ?? [];
        const leaveList = Array.isArray(leavesRes) ? leavesRes : leavesRes?.data ?? [];
        const pending   = leaveList.filter((l: any) => l.status === 'PENDING');

        setStats({
          employees:     empTotal,
          pendingLeaves: pending.length,
          bulletins:     payList.length,
          totalNet:      payList.reduce((s: number, p: any) => s + (p.netSalary   ?? 0), 0),
          totalGross:    payList.reduce((s: number, p: any) => s + (p.grossSalary ?? 0), 0),
        });
        setLeaves(leaveList.slice(0, 5));
        setPayrolls(payList.slice(0, 3));
      } catch {
        setStats({ employees: 0, pendingLeaves: 0, bulletins: 0, totalNet: 0, totalGross: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
    PENDING:   { label: 'En attente', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20' },
    APPROVED:  { label: 'Approuvé',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    REJECTED:  { label: 'Refusé',     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20' },
    CANCELLED: { label: 'Annulé',     color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20' },
  };

  const PAY_STATUS: Record<string, string> = {
    DRAFT: 'text-amber-400', VALIDATED: 'text-blue-400', PAID: 'text-emerald-400',
  };
  const PAY_LABEL: Record<string, string> = {
    DRAFT: 'En cours', VALIDATED: 'Validé', PAID: 'Payé',
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 size={28} className="animate-spin text-gray-600" />
    </div>
  );

  const isAdmin = ['ADMIN','HR_MANAGER','MANAGER','SUPER_ADMIN'].includes(userRole);

  return (
    <div className="space-y-6">

      {/* Salutation */}
      <div>
        <h1 className="text-2xl font-bold text-white">
          Bonjour{userName ? `, ${userName}` : ''} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {now.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* KPI cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:'Employés actifs',   value: stats.employees,             icon: Users,       color:'#6366f1', link:`/pme/${companyId}/employes`,  show: isAdmin },
            { label:'Congés en attente', value: stats.pendingLeaves,         icon: Calendar,    color:'#f97316', link:`/pme/${companyId}/conges`,     show: isAdmin },
            { label:'Bulletins du mois', value: stats.bulletins,             icon: FileText,    color:'#22c55e', link:`/pme/${companyId}/bulletins`,  show: true    },
            { label:'Masse nette',       value: `${fmt(stats.totalNet)} F`,  icon: DollarSign,  color:'#0ea5e9', link:`/pme/${companyId}/paie`,       show: isAdmin },
          ].filter(c => c.show).map(c => (
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

      {/* Accès rapides selon rôle */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {[
          { label:'Mes employés',     icon: Users,       color:'#6366f1', link:`/pme/${companyId}/employes`,   show: isAdmin },
          { label:'Présences',        icon: Fingerprint, color:'#0ea5e9', link:`/pme/${companyId}/presences`,  show: isAdmin },
          { label:'Congés',           icon: Calendar,    color:'#f97316', link:`/pme/${companyId}/conges`,     show: true    },
          { label:'Mes bulletins',    icon: FileText,    color:'#22c55e', link:`/pme/${companyId}/bulletins`,  show: true    },
          { label:'Formation',        icon: BookOpen,    color:'#8b5cf6', link:`/pme/${companyId}/formation`,  show: true    },
          { label:'Rapports',         icon: TrendingUp,  color:'#06b6d4', link:`/pme/${companyId}/rapports`,   show: isAdmin },
        ].filter(a => a.show).map(a => (
          <button key={a.label} onClick={() => router.push(a.link)}
            className="bg-white/3 hover:bg-white/5 border border-white/8 rounded-xl p-4 flex items-center gap-3 transition-all text-left">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                 style={{ background:`${a.color}22`, border:`1px solid ${a.color}44` }}>
              <a.icon size={16} style={{ color: a.color }} />
            </div>
            <span className="text-sm font-medium text-white">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Dernières demandes de congé */}
        {leaves.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Demandes de congé</h3>
              <button onClick={() => router.push(`/pme/${companyId}/conges`)}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                Tout voir <ArrowRight size={11} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {leaves.map((l: any) => {
                const sc = STATUS_CFG[l.status] ?? STATUS_CFG['PENDING'];
                return (
                  <div key={l.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-gray-400">
                          {`${l.employee?.firstName?.[0]??''}${l.employee?.lastName?.[0]??''}`.toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white truncate">
                          {l.employee ? `${l.employee.firstName} ${l.employee.lastName}` : 'Moi'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {LEAVE_TYPES[l.type]??l.type} ·{' '}
                          {new Date(l.startDate).toLocaleDateString('fr-FR',{day:'numeric',month:'short'})}
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

        {/* Derniers bulletins */}
        {payrolls.length > 0 && (
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Derniers bulletins</h3>
              <button onClick={() => router.push(`/pme/${companyId}/bulletins`)}
                className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1">
                Tout voir <ArrowRight size={11} />
              </button>
            </div>
            <div className="divide-y divide-white/5">
              {payrolls.map((p: any) => (
                <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-white/3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center shrink-0">
                      <FileText size={12} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white">
                        {p.employee?.firstName} {p.employee?.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {MONTHS[(p.month??1)-1]} {p.year} · Net: {fmt(p.netSalary??0)} F
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs ${PAY_STATUS[p.status]??'text-gray-400'}`}>
                    {PAY_LABEL[p.status]??p.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}