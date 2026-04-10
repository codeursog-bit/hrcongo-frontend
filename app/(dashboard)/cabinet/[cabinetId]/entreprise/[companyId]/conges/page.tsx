'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/conges/page.tsx

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Calendar, Loader2, CheckCircle2, XCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/services/api';

const TYPES: Record<string, string> = {
  ANNUAL: 'Annuel', SICK: 'Maladie', MATERNITY: 'Maternité',
  PATERNITY: 'Paternité', UNPAID: 'Sans solde', COMPENSATORY: 'Compensatoire',
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  PENDING:   { label: 'En attente', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20',   icon: Clock        },
  APPROVED:  { label: 'Approuvé',   color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  REJECTED:  { label: 'Refusé',     color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20',       icon: XCircle      },
  CANCELLED: { label: 'Annulé',     color: 'text-gray-400',    bg: 'bg-gray-500/10 border-gray-500/20',     icon: AlertCircle  },
};

export default function CabinetCongesPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [leaves,    setLeaves]    = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('ALL');
  const [updating,  setUpdating]  = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data: any = await api.get(`/leaves?companyId=${companyId}`);
        setLeaves(Array.isArray(data) ? data : []);
      } catch {
        setLeaves([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId]);

  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    setUpdating(id);
    try {
      await api.patch(`/leaves/${id}/status?companyId=${companyId}`, { status });
      setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    } catch {} finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'ALL' ? leaves : leaves.filter(l => l.status === filter);

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar size={20} className="text-cyan-400" /> Congés
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Demandes de congés de la PME</p>
        </div>
        <div className="flex gap-1 bg-white/3 border border-white/8 rounded-lg p-1">
          {['ALL','PENDING','APPROVED','REJECTED'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-xs transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              {f === 'ALL' ? 'Tous' : STATUS_CONFIG[f]?.label ?? f}
            </button>
          ))}
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-3">
        {['PENDING','APPROVED','REJECTED','CANCELLED'].map(s => {
          const count = leaves.filter(l => l.status === s).length;
          const sc    = STATUS_CONFIG[s];
          return (
            <div key={s} className={`border rounded-xl p-3 ${sc.bg}`}>
              <p className={`text-xl font-bold ${sc.color}`}>{count}</p>
              <p className="text-xs text-gray-500 mt-0.5">{sc.label}</p>
            </div>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Calendar size={32} className="mx-auto mb-3 text-gray-700" />
          <p>Aucune demande de congé</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(leave => {
            const sc = STATUS_CONFIG[leave.status] ?? STATUS_CONFIG['PENDING'];
            const Icon = sc.icon;
            return (
              <div key={leave.id} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-white/5 border border-white/8 rounded-xl flex items-center justify-center shrink-0">
                  <span className="text-xs font-bold text-gray-400">
                    {`${leave.employee?.firstName?.[0] ?? ''}${leave.employee?.lastName?.[0] ?? ''}`.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">
                    {leave.employee?.firstName} {leave.employee?.lastName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {TYPES[leave.type] ?? leave.type} ·{' '}
                    {new Date(leave.startDate).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                    {' → '}
                    {new Date(leave.endDate).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                    {' · '}{leave.daysCount} jour{leave.daysCount > 1 ? 's' : ''}
                  </p>
                  {leave.reason && <p className="text-xs text-gray-600 mt-0.5 truncate">{leave.reason}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border ${sc.bg} ${sc.color}`}>
                    <Icon size={11} /> {sc.label}
                  </span>
                  {leave.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => updateStatus(leave.id, 'APPROVED')}
                        disabled={updating === leave.id}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition-colors"
                      >
                        {updating === leave.id ? '...' : 'Approuver'}
                      </button>
                      <button
                        onClick={() => updateStatus(leave.id, 'REJECTED')}
                        disabled={updating === leave.id}
                        className="px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-xs font-medium transition-colors"
                      >
                        Refuser
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}