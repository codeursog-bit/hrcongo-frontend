'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';
import { CHART_DATA } from '@/lib/admin/constants';

const PIE_DATA = [
  { name: 'Starter', value: 45, color: '#94A3B8' },
  { name: 'Pro', value: 78, color: '#38BDF8' },
  { name: 'Enterprise', value: 29, color: '#DC2626' },
];

const BAR_DATA = [
  { name: '1-10', count: 45 },
  { name: '11-25', count: 68 },
  { name: '26-50', count: 29 },
  { name: '51-100', count: 8 },
  { name: '100+', count: 2 },
];

export const GrowthChart: React.FC = () => {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={CHART_DATA}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
          <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', color: '#F3F4F6' }}
            itemStyle={{ color: '#F3F4F6' }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend />
          <Area type="monotone" dataKey="revenue" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" name="MRR (FCFA)" />
          <Area type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" name="Active Users" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export const DistributionCharts: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[300px]">
      <div className="h-full">
        <h4 className="text-xs text-gray-500 uppercase mb-2 text-center">Plan Distribution</h4>
        <ResponsiveContainer width="100%" height="90%">
          <PieChart>
            <Pie
              data={PIE_DATA}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey="value"
            >
              {PIE_DATA.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
            <Legend verticalAlign="bottom" height={36} iconType="circle" />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="h-full">
        <h4 className="text-xs text-gray-500 uppercase mb-2 text-center">Company Size (Employees)</h4>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={BAR_DATA}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
            <XAxis dataKey="name" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: '#1F2937'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
            <Bar dataKey="count" fill="#374151" radius={[4, 4, 0, 0]} activeBar={{ fill: '#DC2626' }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};