
import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight, Eye, EyeOff } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: LucideIcon;
  gradientFrom: string;
  gradientTo: string;
  isPrivate?: boolean; // Nouvelle prop
  showValue?: boolean; // Nouvelle prop
  onToggleVisibility?: () => void; // Nouvelle prop
}

export const StatCard: React.FC<StatCardProps> = ({ 
  label, 
  value, 
  trend, 
  isPositive,
  icon: Icon, 
  gradientFrom,
  gradientTo,
  isPrivate = false,
  showValue = true,
  onToggleVisibility
}) => {
  return (
    <div className="relative group perspective-1000 h-full">
      
      {/* Background Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-sky-400 to-indigo-500 rounded-[24px] blur opacity-0 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500"></div>
      
      <div className={`
        relative h-full rounded-[22px] p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between
        bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-slate-200/70
        dark:bg-[#0B1121] dark:border-white/5 dark:shadow-none
      `}>
        
        {/* Decorative inner gradient mesh */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradientFrom} ${gradientTo} opacity-10 dark:opacity-5 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none`}></div>

        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex-1">
             <p className="text-slate-500 dark:text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-1">{label}</p>
             <div className="flex items-center gap-2">
                 <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight drop-shadow-sm dark:drop-shadow-lg font-sans">
                    {isPrivate && !showValue ? '**** FCFA' : value}
                 </h3>
                 {isPrivate && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); onToggleVisibility && onToggleVisibility(); }}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-sky-500 transition-colors"
                     >
                        {showValue ? <EyeOff size={16} /> : <Eye size={16} />}
                     </button>
                 )}
             </div>
          </div>

          <div className={`
            w-12 h-12 rounded-2xl bg-gradient-to-br ${gradientFrom} ${gradientTo} 
            flex items-center justify-center text-white shadow-lg
            group-hover:scale-110 transition-transform duration-300
          `}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-2">
           <div className={`
             flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border backdrop-blur-sm
             ${isPositive 
               ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
               : 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-100 dark:border-red-500/20'}
           `}>
            {isPositive ? <ArrowUpRight size={14} className="mr-1" /> : <ArrowDownRight size={14} className="mr-1" />}
            {trend}
           </div>
           <span className="text-slate-400 dark:text-slate-500 text-xs font-medium">vs dernier</span>
        </div>
      </div>
    </div>
  );
};
