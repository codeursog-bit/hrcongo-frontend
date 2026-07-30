import React from 'react';
import { MoreHorizontal } from 'lucide-react';

interface AnalyticsCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({ title, subtitle, children, action, className = '' }) => {
  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-all duration-300 flex flex-col ${className}`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-200">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-2">
            {action}
            <button className="text-gray-600 hover:text-gray-300"><MoreHorizontal className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
};
