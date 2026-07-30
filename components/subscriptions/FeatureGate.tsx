// ============================================================================
// 🚧 FEATURE GATE - CACHER LES FEATURES SELON LE PLAN
// ============================================================================
// Fichier: components/subscriptions/FeatureGate.tsx

'use client';

import { useSubscription, PlanLimits } from '@/hooks/useSubscription';
import { Lock, Crown, Zap } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface FeatureGateProps {
  feature: keyof PlanLimits;
  children: ReactNode;
  fallback?: ReactNode;
  showUpgradePrompt?: boolean;
}

export function FeatureGate({ 
  feature, 
  children, 
  fallback, 
  showUpgradePrompt = true 
}: FeatureGateProps) {
  const { hasFeature, isLoading, plan } = useSubscription();

  if (isLoading) {
    return (
      <div className="animate-pulse glass-card p-4 rounded-lg">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-1/2"></div>
      </div>
    );
  }

  // ✅ Feature disponible
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // ❌ Feature non disponible
  if (fallback) {
    return <>{fallback}</>;
  }

  // 🔒 Afficher le prompt d'upgrade par défaut
  if (showUpgradePrompt) {
    return <UpgradePrompt feature={feature} currentPlan={plan} />;
  }

  return null;
}


// ============================================================================
// 🔓 UPGRADE PROMPT - INVITATION À UPGRADER
// ============================================================================

interface UpgradePromptProps {
  feature: keyof PlanLimits;
  currentPlan: string;
}

function UpgradePrompt({ feature, currentPlan }: UpgradePromptProps) {
  // Mapping feature → plan requis
  const featureRequirements: Record<string, { plan: string; planLabel: string; icon: ReactNode }> = {
    hasEmployeeImportExcel: { 
      plan: 'BASIC', 
      planLabel: 'Basique', 
      icon: <Zap className="w-5 h-5 text-blue-400" /> 
    },
    hasAttendanceGPS: { 
      plan: 'BASIC', 
      planLabel: 'Basique', 
      icon: <Zap className="w-5 h-5 text-blue-400" /> 
    },
    hasLeaveManagement: { 
      plan: 'BASIC', 
      planLabel: 'Basique', 
      icon: <Zap className="w-5 h-5 text-blue-400" /> 
    },
    hasPayrollBulk: { 
      plan: 'BASIC', 
      planLabel: 'Basique', 
      icon: <Zap className="w-5 h-5 text-blue-400" /> 
    },
    hasRecruitmentAI: { 
      plan: 'PRO', 
      planLabel: 'Pro', 
      icon: <Crown className="w-5 h-5 text-purple-400" /> 
    },
    hasPayrollAccountingExport: { 
      plan: 'PRO', 
      planLabel: 'Pro', 
      icon: <Crown className="w-5 h-5 text-purple-400" /> 
    },
    hasReportsAnalytics: { 
      plan: 'PRO', 
      planLabel: 'Pro', 
      icon: <Crown className="w-5 h-5 text-purple-400" /> 
    },
    hasAPIAccess: { 
      plan: 'ENTERPRISE', 
      planLabel: 'Enterprise', 
      icon: <Crown className="w-5 h-5 text-pink-400" /> 
    },
  };

  const requirement = featureRequirements[feature] || { 
    plan: 'PRO', 
    planLabel: 'Pro', 
    icon: <Crown className="w-5 h-5" /> 
  };

  // Noms friendly des features
  const featureNames: Record<string, string> = {
    hasEmployeeImportExcel: 'Import Excel des employés',
    hasAttendanceGPS: 'Pointage GPS',
    hasLeaveManagement: 'Gestion des congés',
    hasPayrollBulk: 'Paie en masse',
    hasPayrollAccountingExport: 'Export comptable',
    hasRecruitmentAI: 'Recrutement avec IA',
    hasReportsAnalytics: 'Rapports analytiques',
    hasAPIAccess: 'Accès API',
    hasDocumentManagement: 'Gestion documentaire',
    hasAssetManagement: 'Gestion des actifs',
    hasPerformanceReviews: 'Évaluations de performance',
    hasTraining: 'Formation',
    hasEmailAutomation: 'Automatisation emails',
    hasMultiCompany: 'Multi-entreprises',
    hasWhiteLabel: 'Marque blanche',
  };

  const featureName = featureNames[feature] || 'Cette fonctionnalité';

  return (
    <div className="glass-panel p-6 rounded-xl border border-white/20 dark:border-white/10">
      <div className="flex items-start gap-4">
        {/* Icône de verrouillage avec animation */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full animate-pulse"></div>
          <div className="relative p-3 bg-white/50 dark:bg-slate-800/50 rounded-full">
            <Lock className="w-6 h-6 text-slate-600 dark:text-slate-400" />
          </div>
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
            🔒 Fonctionnalité Premium
          </h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            <strong>{featureName}</strong> nécessite le plan <strong className="glow-text">{requirement.planLabel}</strong>
          </p>

          {/* Badge du plan requis */}
          <div className="flex items-center gap-2 mb-4">
            {requirement.icon}
            <span className="text-sm font-semibold">
              Plan {requirement.planLabel} requis
            </span>
          </div>

          {/* Bouton d'upgrade */}
          <Link href="/pricing">
            <button className="
              w-full sm:w-auto
              px-6 py-3 
              bg-gradient-to-r from-purple-500 to-pink-500 
              hover:from-purple-600 hover:to-pink-600
              text-white font-bold rounded-lg
              shadow-lg hover:shadow-xl
              transition-all duration-300
              hover:scale-105
            ">
              🚀 Upgrader maintenant
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}


// ============================================================================
// 🚦 FEATURE GATE POUR LIMITE (maxEmployees, maxUsers, etc.)
// ============================================================================

interface LimitGateProps {
  limitType: 'employees' | 'users' | 'departments' | 'jobOffers';
  children: ReactNode;
  fallback?: ReactNode;
}

export function LimitGate({ limitType, children, fallback }: LimitGateProps) {
  const { isWithinLimit, getUsagePercentage, isLoading } = useSubscription();

  if (isLoading) {
    return <div className="animate-pulse glass-card p-4 rounded-lg h-20"></div>;
  }

  // ✅ Dans la limite
  if (isWithinLimit(limitType)) {
    return <>{children}</>;
  }

  // ❌ Limite atteinte
  if (fallback) {
    return <>{fallback}</>;
  }

  const limitLabels = {
    employees: 'employés',
    users: 'utilisateurs',
    departments: 'départements',
    jobOffers: 'offres d\'emploi',
  };

  return (
    <div className="glass-panel p-6 rounded-xl border border-orange-500/30">
      <div className="flex items-start gap-4">
        <div className="p-3 bg-orange-500/10 rounded-full">
          <Lock className="w-6 h-6 text-orange-500" />
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-lg mb-2">
            ⚠️ Limite atteinte
          </h3>
          
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Vous avez atteint votre limite de <strong>{limitLabels[limitType]}</strong>.
            Upgradez votre plan pour en ajouter plus.
          </p>

          {/* Barre de progression */}
          <div className="mb-4">
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                style={{ width: `${getUsagePercentage(limitType)}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {getUsagePercentage(limitType)}% utilisé
            </p>
          </div>

          <Link href="/pricing">
            <button className="
              px-6 py-3 
              bg-gradient-to-r from-orange-500 to-red-500 
              hover:from-orange-600 hover:to-red-600
              text-white font-bold rounded-lg
              shadow-lg hover:shadow-xl
              transition-all duration-300
            ">
              Upgrader maintenant
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}