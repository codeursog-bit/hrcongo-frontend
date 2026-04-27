'use client';

import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend,
} from 'recharts';

// ── Types alignés sur la réponse de adminService.getAnalytics() ──────────────

interface GrowthEntry {
  name?: string;   // ex. "Jan", "Fév" …
  month?: string;  // selon le backend
  revenue: number;
  users: number;
}

interface PlanEntry {
  name: string;   // "Starter" | "Pro" | "Enterprise"
  value: number;
  color?: string;
}

interface SizeEntry {
  name: string;   // "1-10" | "11-25" …
  count: number;
}

interface GrowthChartProps {
  /** analytics.growthData depuis adminService.getAnalytics() */
  data?: GrowthEntry[];
}

interface DistributionChartsProps {
  /** analytics.planDistribution */
  planData?: PlanEntry[];
  /** analytics.companySizeDistribution */
  sizeData?: SizeEntry[];
}

// ── Couleurs par défaut si l'API ne les fournit pas ──────────────────────────

const DEFAULT_PLAN_COLORS: Record<string, string> = {
  Starter:    '#94A3B8',
  Pro:        '#38BDF8',
  Enterprise: '#DC2626',
};

// ── GrowthChart ──────────────────────────────────────────────────────────────

export const GrowthChart: React.FC<GrowthChartProps> = ({ data = [] }) => {
  if (data.length === 0) {
    return (
      <div className="h-[300px] w-full flex items-center justify-center text-gray-500 text-sm">
        Aucune donnée de croissance
      </div>
    );
  }

  const normalized = data.map(d => ({ ...d, name: d.name ?? d.month ?? '' }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={normalized}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}   />
            </linearGradient>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}   />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false}
                 tickFormatter={(v) => `${v / 1000}k`} />
          <Tooltip
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend />
          <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2}
                fillOpacity={1} fill="url(#colorRevenue)" name="MRR (FCFA)" />
          <Area type="monotone" dataKey="users"   stroke="#10B981" strokeWidth={2}
                fillOpacity={1} fill="url(#colorUsers)"   name="Utilisateurs actifs" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

// ── DistributionCharts ───────────────────────────────────────────────────────

export const DistributionCharts: React.FC<DistributionChartsProps> = ({
  planData = [],
  sizeData = [],
}) => {
  const coloredPlan = planData.map(p => ({
    ...p,
    color: p.color ?? DEFAULT_PLAN_COLORS[p.name] ?? '#6B7280',
  }));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]">
      <div className="h-full">
        <h4 className="text-xs text-gray-500 uppercase mb-2 text-center">Plan Distribution</h4>
        {coloredPlan.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={coloredPlan} cx="50%" cy="50%"
                   innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {coloredPlan.map((entry, index) => (
                  <Cell key={`cell-plan-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
              <Legend verticalAlign="bottom" height={36} iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[90%] text-gray-500 text-sm">
            Aucune donnée de plan
          </div>
        )}
      </div>

      <div className="h-full">
        <h4 className="text-xs text-gray-500 uppercase mb-2 text-center">Company Size (Employees)</h4>
        {sizeData.length > 0 ? (
          <ResponsiveContainer width="100%" height="90%">
            <BarChart data={sizeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#1F2937' }}
                       contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
              <Bar dataKey="count" fill="#374151" radius={[4, 4, 0, 0]}
                   activeBar={{ fill: '#DC2626' }} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[90%] text-gray-500 text-sm">
            Aucune donnée de taille
          </div>
        )}
      </div>
    </div>
  );
};