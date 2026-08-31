// ============================================================================
// Fichier: frontend/components/admin/analytics/AnalyticsCharts.tsx
// ============================================================================

'use client';

import React from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend 
} from 'recharts';

// --- Growth Charts ---
interface AcquisitionChartProps {
  data?: Array<{ day: string; value: number }>;
}

export const AcquisitionChart: React.FC<AcquisitionChartProps> = ({ data = [] }) => (
    <div className="h-[200px] w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                  <defs>
                      <linearGradient id="colorAcq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} itemStyle={{ color: '#F3F4F6' }} />
                  <Area type="monotone" dataKey="value" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorAcq)" />
              </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Aucune donnée d'acquisition
          </div>
        )}
    </div>
);

interface ChurnPieChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
}

export const ChurnPieChart: React.FC<ChurnPieChartProps> = ({ data = [] }) => (
    <div className="h-[150px] w-full relative">
        {data.length > 0 && data.some(d => d.value > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                      {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                      ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
              </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Pas de données de churn
          </div>
        )}
    </div>
);

// --- Engagement Charts ---
interface DauChartProps {
  data?: Array<{ day: string; value: number }>;
}

export const DauChart: React.FC<DauChartProps> = ({ data = [] }) => (
    <div className="h-[180px] w-full">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                  <XAxis dataKey="day" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} itemStyle={{ color: '#F3F4F6' }} />
                  <Line type="monotone" dataKey="value" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3, fill: '#38BDF8' }} />
              </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Aucune donnée DAU
          </div>
        )}
    </div>
);

interface FeatureBarChartProps {
  data?: Array<{ name: string; value: number }>;
}

export const FeatureBarChart: React.FC<FeatureBarChartProps> = ({ data = [] }) => {
  // Mock data si vide (car pas de système de tracking de features pour l'instant)
  const displayData = data.length > 0 ? data : [
    { name: 'Payroll', value: 95 },
    { name: 'Employees', value: 89 },
    { name: 'Reports', value: 72 },
    { name: 'Leaves', value: 68 },
    { name: 'Documents', value: 29 },
  ];

  return (
    <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={displayData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" horizontal={false} />
                <XAxis type="number" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="#9CA3AF" fontSize={10} tickLine={false} axisLine={false} width={70} />
                <Tooltip cursor={{fill: '#1F2937'}} contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                <Bar dataKey="value" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
            </BarChart>
        </ResponsiveContainer>
    </div>
  );
};

// --- Performance Charts ---
interface LatencyChartProps {
  data?: Array<{ time: string; value: number }>;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({ data = [] }) => {
  // Mock data si vide
  const displayData = data.length > 0 ? data : [
    { time: '00:00', value: 120 },
    { time: '04:00', value: 95 },
    { time: '08:00', value: 180 },
    { time: '12:00', value: 150 },
    { time: '16:00', value: 200 },
    { time: '20:00', value: 110 },
  ];

  return (
    <div className="h-[150px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={displayData}>
                 <defs>
                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2937" vertical={false} />
                <XAxis dataKey="time" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} itemStyle={{ color: '#F3F4F6' }} />
                <Area type="monotone" dataKey="value" stroke="#F59E0B" strokeWidth={2} fill="url(#colorLatency)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
  );
};

// --- Industry Pie Chart ---
interface IndustryPieChartProps {
  data?: Array<{ name: string; value: number; color: string }>;
}

export const IndustryPieChart: React.FC<IndustryPieChartProps> = ({ data = [] }) => {
  // Mock data si vide (car pas de champ "industry" dans Company)
  const displayData = data.length > 0 ? data : [
    { name: 'Tech', value: 35, color: '#3B82F6' },
    { name: 'Services', value: 25, color: '#10B981' },
    { name: 'Commerce', value: 20, color: '#F59E0B' },
    { name: 'Industrie', value: 15, color: '#EF4444' },
    { name: 'Autre', value: 5, color: '#6B7280' },
  ];

  return (
    <div className="h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={displayData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value">
                    {displayData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={1} stroke="#111827" />
                    ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#111827', borderColor: '#374151' }} />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
            </PieChart>
        </ResponsiveContainer>
    </div>
  );
};