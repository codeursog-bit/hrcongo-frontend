// ============================================================================
// 🎖️ TRIAL BADGE - BADGE ESSAI GRATUIT AVEC COUNTDOWN
// ============================================================================
// Fichier: components/subscriptions/TrialBadge.tsx

'use client';

import { useSubscription } from '@/hooks/useSubscription';
import { Gift, AlertTriangle, Crown, Sparkles } from 'lucide-react';
import Link from 'next/link';

export function TrialBadge() {
  const { subscription, isLoading, isOnTrial, daysLeft, isExpiringSoon } = useSubscription();

  if (isLoading || !subscription) return null;

  // 🎁 Mode essai gratuit PRO
  if (isOnTrial) {
    return (
      <Link href="/settings/subscription">
        <div className="group relative">
          {/* Badge principal avec effet glass */}
          <div className={`
            flex items-center gap-2 px-4 py-2 rounded-full 
            glass-card cursor-pointer
            ${isExpiringSoon 
              ? 'border-orange-500/40 bg-gradient-to-r from-orange-500/10 to-red-500/10' 
              : 'border-purple-500/40 bg-gradient-to-r from-purple-500/10 to-pink-500/10'
            }
            hover:scale-105 hover:shadow-lg transition-all duration-300
          `}>
            {isExpiringSoon ? (
              <AlertTriangle className="w-4 h-4 text-orange-400 animate-pulse" />
            ) : (
              <Gift className="w-4 h-4 text-purple-400 animate-pulse" /> 
            )}
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold glow-text">
                {isExpiringSoon ? (
                  <span className="text-orange-400">
                    ⚠️ J-{daysLeft}
                  </span>
                ) : (
                  <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                    🎁 Essai PRO
                  </span>
                )}
              </span>
              
              {!isExpiringSoon && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {daysLeft}j restants
                </span>
              )}
            </div>

            <Sparkles className="w-3 h-3 text-purple-400 opacity-60" />
          </div>

          {/* Tooltip au hover avec effet glass */}
          <div className="
            absolute top-full left-1/2 -translate-x-1/2 mt-3 
            glass-panel p-4 rounded-xl shadow-2xl
            opacity-0 group-hover:opacity-100 
            pointer-events-none group-hover:pointer-events-auto
            transition-all duration-300 z-50
            w-72
            border border-white/20 dark:border-white/10
          ">
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Crown className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-sm mb-1">
                  {isExpiringSoon ? 'Attention !' : 'Essai Gratuit PRO'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  {isExpiringSoon ? (
                    <>
                      Votre essai se termine dans <strong className="text-orange-400">{daysLeft} jours</strong>.
                      Upgradez pour ne rien perdre !
                    </>
                  ) : (
                    <>
                      Profitez de <strong>toutes les features PRO</strong> gratuitement pendant {daysLeft} jours !
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Barre de progression */}
            <div className="mb-3">
              <div className="h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isExpiringSoon 
                      ? 'bg-gradient-to-r from-orange-400 to-red-500' 
                      : 'bg-gradient-to-r from-purple-400 to-pink-500'
                  }`}
                  style={{ width: `${((30 - daysLeft) / 30) * 100}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
                {30 - daysLeft} / 30 jours utilisés
              </p>
            </div>

            <div className="text-center">
              <span className="text-xs font-semibold text-sky-500 hover:text-sky-400 transition-colors">
                Cliquez pour upgrader maintenant →
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // 💎 Plans payants (FREE, BASIC, PRO, ENTERPRISE)
  const planConfig = {
    FREE: {
      icon: null,
      label: 'Gratuit',
      gradient: '',
      bg: 'bg-slate-500/10 border-slate-500/30',
      text: 'text-slate-600 dark:text-slate-400',
    },
    BASIC: {
      icon: <Sparkles className="w-4 h-4" />,
      label: 'Basique',
      gradient: '',
      bg: 'bg-blue-500/10 border-blue-500/30',
      text: 'text-blue-600 dark:text-blue-400',
    },
    PRO: {
      icon: <Crown className="w-4 h-4" />,
      label: 'Pro',
      gradient: 'from-purple-400 to-pink-400',
      bg: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30',
      text: 'bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent',
    },
    ENTERPRISE: {
      icon: <Crown className="w-4 h-4 text-pink-400" />,
      label: 'Enterprise',
      gradient: 'from-purple-500 to-pink-500',
      bg: 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/40',
      text: 'bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent',
    },
  };

  const config = planConfig[subscription.plan];

  return (
    <Link href="/settings/subscription">
      <div className={`
        flex items-center gap-2 px-4 py-2 rounded-full 
        glass-card cursor-pointer
        ${config.bg}
        hover:scale-105 transition-all duration-300
      `}>
        {config.icon && (
          <div className={config.gradient && `bg-gradient-to-r ${config.gradient} bg-clip-text`}>
            {config.icon}
          </div>
        )}
        <span className={`text-sm font-bold ${config.text}`}>
          {config.label}
        </span>
      </div>
    </Link>
  );
}