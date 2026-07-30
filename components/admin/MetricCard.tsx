import React from 'react';
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string;
  subValue?: string;
  trend?: string;
  trendDirection?: 'up' | 'down';
  accentColor: 'gold' | 'blue' | 'green' | 'red' | 'orange';
  children?: React.ReactNode;
  actionText?: string;
}

export const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  subValue, 
  trend, 
  trendDirection = 'up', 
  accentColor,
  children,
  actionText
}) => {
  const getAccentColor = () => {
    switch (accentColor) {
      case 'gold': return 'border-brand-gold/50 text-brand-gold';
      case 'blue': return 'border-sky-500/50 text-sky-500';
      case 'green': return 'border-emerald-500/50 text-emerald-500';
      case 'red': return 'border-red-500/50 text-red-500';
      case 'orange': return 'border-orange-500/50 text-orange-500';
      default: return 'border-gray-700 text-white';
    }
  };

  const getBgGlow = () => {
    switch (accentColor) {
       case 'gold': return 'from-amber-900/10';
       case 'blue': return 'from-sky-900/10';
       case 'green': return 'from-emerald-900/10';
       case 'red': return 'from-red-900/10';
       case 'orange': return 'from-orange-900/10';
       default: return 'from-gray-800/10';
    }
  }

  return (
    <div className={`relative bg-gray-900 rounded-xl border border-gray-800 p-5 overflow-hidden group hover:border-gray-700 transition-all duration-300`}>
      {/* Top Accent Line */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${getAccentColor().split(' ')[0].replace('text', 'bg').replace('border', 'via') } to-transparent opacity-70`}></div>
      
      {/* Background Glow */}
      <div className={`absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br ${getBgGlow()} to-transparent rounded-full blur-2xl`}></div>

      <div className="flex justify-between items-start mb-4 relative z-10">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${getAccentColor().split(' ')[1]}`}>{title}</h3>
        <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-5 h-5" /></button>
      </div>

      <div className="relative z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-white">{value}</span>
          {trend && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded flex items-center ${trendDirection === 'up' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
              {trendDirection === 'up' ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {trend}
            </span>
          )}
        </div>
        {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
        
        {children && <div className="mt-4 pt-4 border-t border-gray-800">{children}</div>}

        {actionText && (
          <button className="mt-4 text-xs font-medium text-gray-400 hover:text-white flex items-center gap-1 transition-colors">
            {actionText} →
          </button>
        )}
      </div>
    </div>
  );
};
