'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Loader2, Building2, ClipboardList, LayoutDashboard, UsersRound,
  UmbrellaOff, BookOpen, DollarSign, AlertTriangle, Clock, UserX, LogOut,
  Wallet, TrendingUp, Users, UserCircle, BarChart3,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import RapportsSubNav from '@/components/RapportsSubNav';

const COLORS = ['#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#6366F1'];

interface DeptRow {
  id: string;
  name: string;
  color?: string;
  headcount: number;
  totalEmployerCost: number;
  avgSalary: number;
  totalOvertime: number;
  lateCount: number;
  absenceCount: number;
  absenceDays: number;
  absencesByType: { MALADIE: number; CONVENTIONNELLE: number; EXCEPTIONNELLE: number };
  departureCount: number;
  lateRatePer10: number;
  absenceRatePer10: number;
}

interface TraceabilityData {
  period: { start: string; end: string; label: string };
  companyAverages: { lateRatePer10: number; absenceRatePer10: number };
  departments: DeptRow[];
  alerts: { department: string; reason: string }[];
}

const fcfa = (v: number) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(2)} M FCFA` : `${Math.round(v).toLocaleString('fr-FR')} FCFA`;

export default function DepartmentTraceabilityPage() {
  const router = useRouter();
  const { bp } = useBasePath();
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/reports/department-traceability');
        setData(res as TraceabilityData);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-sky-500" size={48} />
      </div>
    );
  }

  const departments = data?.departments || [];
  const mostLate     = [...departments].sort((a, b) => b.lateRatePer10 - a.lateRatePer10)[0];
  const mostAbsences = [...departments].sort((a, b) => b.absenceRatePer10 - a.absenceRatePer10)[0];
  const costliest     = [...departments].sort((a, b) => b.avgSalary - a.avgSalary)[0];

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">

      {/* HEADER */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(bp('/rapports'))}
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Vue Département
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Coût, absences, retards et turnover par département — {data?.period?.label || '3 derniers mois'}
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION RAPPORTS */}
      <RapportsSubNav active="/rapports/departements" />

      {/* ALERTES */}
      {(data?.alerts?.length || 0) > 0 && (
        <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-5">
          <h3 className="text-sm font-black uppercase tracking-wide text-amber-700 dark:text-amber-400 mb-3 flex items-center gap-2">
            <AlertTriangle size={16} /> Départements à surveiller
          </h3>
          <div className="space-y-2">
            {data!.alerts.map((a, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <span className="font-bold text-gray-900 dark:text-white">{a.department}</span>
                <span className="text-gray-500 dark:text-gray-400">— {a.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI RAPIDES */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={16} className="text-rose-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Le plus de retards</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mostLate?.name ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{mostLate?.lateCount ?? 0} retard(s) sur la période</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserX size={16} className="text-amber-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Le plus d'absences</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{mostAbsences?.name ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{mostAbsences?.absenceCount ?? 0} absence(s) · {mostAbsences?.absenceDays ?? 0} j.</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-emerald-500" />
            <span className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Salaire moyen le plus élevé</span>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{costliest?.name ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">{costliest ? fcfa(costliest.avgSalary) : '—'} / employé</p>
        </div>
      </div>

      {/* GRAPHIQUES COMPARATIFS */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Taux de retard par département</h4>
          <p className="text-xs text-gray-400 mb-5">Pour 10 employés — moyenne entreprise : {data?.companyAverages?.lateRatePer10 ?? 0}</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={departments} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="lateRatePer10" name="Retards / 10 employés" radius={[0, 8, 8, 0]}>
                  {departments.map((d, idx) => <Cell key={idx} fill={d.color || COLORS[idx % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">Taux d'absence par département</h4>
          <p className="text-xs text-gray-400 mb-5">Pour 10 employés — moyenne entreprise : {data?.companyAverages?.absenceRatePer10 ?? 0}</p>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={departments} margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={110} axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', color: '#fff', borderRadius: '12px', border: 'none' }} />
                <Bar dataKey="absenceRatePer10" name="Absences / 10 employés" radius={[0, 8, 8, 0]}>
                  {departments.map((d, idx) => <Cell key={idx} fill={d.color || COLORS[idx % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* FICHES PAR DÉPARTEMENT */}
      <div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Fiches par Département</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">Vue complète — coût, absences, retards, turnover</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {departments.map((dept, idx) => (
            <div key={dept.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: dept.color || COLORS[idx % COLORS.length] }} />
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">{dept.name}</h4>
                </div>
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Users size={12} /> {dept.headcount}</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Coût employeur</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{fcfa(dept.totalEmployerCost)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Salaire moyen</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{fcfa(dept.avgSalary)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">H. Sup.</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{dept.totalOvertime}h</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase text-gray-400">Départs (3 mois)</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1"><LogOut size={11} className="text-gray-400" />{dept.departureCount}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-700 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <Clock size={12} /> Retards
                    {dept.lateRatePer10 >= (data?.companyAverages?.lateRatePer10 || 0) * 1.5 && dept.headcount > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full font-black">au-dessus</span>
                    )}
                  </p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{dept.lateCount}</p>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1 flex items-center gap-1">
                    <UserX size={12} /> Absences
                    {dept.absenceRatePer10 >= (data?.companyAverages?.absenceRatePer10 || 0) * 1.5 && dept.headcount > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full font-black">au-dessus</span>
                    )}
                  </p>
                  <p className="text-lg font-black text-gray-900 dark:text-white">{dept.absenceCount} <span className="text-xs font-normal text-gray-400">({dept.absenceDays} j.)</span></p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-900/50 rounded-full text-gray-500 dark:text-gray-400">
                  Maladie : {dept.absencesByType?.MALADIE ?? 0}
                </span>
                <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-900/50 rounded-full text-gray-500 dark:text-gray-400">
                  Conventionnelle : {dept.absencesByType?.CONVENTIONNELLE ?? 0}
                </span>
                <span className="text-[10px] px-2 py-1 bg-gray-100 dark:bg-gray-900/50 rounded-full text-gray-500 dark:text-gray-400">
                  Permission (exceptionnelle) : {dept.absencesByType?.EXCEPTIONNELLE ?? 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}