'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Building2, Users, Clock, ChevronRight, Plus,
  TrendingUp, AlertCircle, Loader2,
  LogOut, Settings, Briefcase, Crown,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LastPayroll {
  id:       string;
  month:    number;
  year:     number;
  // Le backend envoie DRAFT | VALIDATED | PAID (pas PENDING)
  status:   'DRAFT' | 'VALIDATED' | 'PAID';
  // Le backend envoie netSalary (pas totalNet)
  netSalary: number;
}

interface CompanyCard {
  linkId:               string;
  companyId:            string;
  legalName:            string;
  tradeName:            string | null;
  city:                 string;
  employeeCount:        number;
  pmePortalEnabled:     boolean;
  employeeAccessEnabled:boolean;
  lastPayroll:          LastPayroll | null;
}

interface DashboardData {
  totalCompanies:  number;
  pendingPayrolls: number;
  companies:       CompanyCard[];
}

interface Subscription {
  planLabel:        string;
  status:           string;
  isTrial:          boolean;
  trialEndsAt:      string | null;
  currentCompanies: number;
  maxCompanies:     number | null;
  remainingSlots:   number | null;
  usagePercent:     number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

// DRAFT = en cours de saisie, VALIDATED = validée, PAID = payée
const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  DRAFT:     { label: 'En cours',  color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/30' },
  VALIDATED: { label: 'Validée',   color: 'text-blue-400',    bg: 'bg-blue-500/10 border-blue-500/30' },
  PAID:      { label: 'Payée',     color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
};

// ─── Composants ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: any; color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}

function SubscriptionBanner({ sub, cabinetId }: { sub: Subscription; cabinetId: string }) {
  const router = useRouter();
  const daysLeft = sub.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt).getTime() - Date.now()) / 86400000))
    : null;

  if (!sub.isTrial) return null;

  return (
    <div className="bg-purple-500/10 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Crown size={18} className="text-purple-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-white">Essai gratuit — {sub.planLabel}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {daysLeft !== null ? `${daysLeft} jours restants` : ''}{' · '}
            {sub.currentCompanies}/{sub.maxCompanies ?? '∞'} PME utilisées
          </p>
        </div>
      </div>
      <button
        onClick={() => router.push(`/cabinet/${cabinetId}/abonnement`)}
        className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors whitespace-nowrap"
      >
        Voir les plans →
      </button>
    </div>
  );
}

function CompanyCardItem({ company, cabinetId, onOpen }: {
  company: CompanyCard; cabinetId: string; onOpen: (id: string) => void;
}) {
  const lp     = company.lastPayroll;
  const status = lp ? (statusConfig[lp.status] ?? statusConfig['DRAFT']) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 hover:bg-white/[0.08] border border-white/10 hover:border-white/20 rounded-2xl p-5 cursor-pointer transition-all group"
      onClick={() => onOpen(company.companyId)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/20 rounded-xl flex items-center justify-center shrink-0">
            <span className="text-cyan-400 font-bold text-sm">
              {company.legalName.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">
              {company.tradeName || company.legalName}
            </p>
            <p className="text-gray-500 text-xs truncate">{company.city}</p>
          </div>
        </div>
        <ChevronRight size={16} className="text-gray-600 group-hover:text-gray-400 transition-colors shrink-0 mt-1" />
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs">
          <Users size={13} />
          <span>{company.employeeCount} employé{company.employeeCount > 1 ? 's' : ''}</span>
        </div>
        {lp && status ? (
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${status.bg} ${status.color}`}>
            <span>{MONTHS[lp.month - 1]} {lp.year}</span>
            <span>·</span>
            <span>{status.label}</span>
          </div>
        ) : (
          <span className="text-xs text-gray-600 italic">Aucune paie</span>
        )}
      </div>

      <div className="mt-3 flex gap-2">
        {company.pmePortalEnabled && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            Portail PME actif
          </span>
        )}
        {company.employeeAccessEnabled && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            Accès employés actif
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CabinetDashboardPage() {
  const params    = useParams();
  const router    = useRouter();
  const cabinetId = params.cabinetId as string;

  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [sub, setSub]             = useState<Subscription | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [user, setUser]           = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }

    const load = async () => {
      try {
        const [dash, subscription] = await Promise.all([
          api.get(`/cabinet/${cabinetId}/dashboard`),
          api.get(`/cabinet/${cabinetId}/subscription`),
        ]);
        setDashboard(dash as DashboardData);
        setSub(subscription as Subscription);
      } catch (e: any) {
        setError(e.message || 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [cabinetId]);

  const openCompany = (companyId: string) => {
    sessionStorage.setItem('cabinetContext', cabinetId);
    router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/paie`);
  };

  const logout = () => {
    localStorage.clear();
    router.push('/auth/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 size={28} className="text-purple-400 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={32} className="text-red-400 mx-auto mb-3" />
          <p className="text-red-400 text-sm">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">

      {/* Sidebar fixe */}
      <aside className="fixed left-0 top-0 h-full w-56 bg-black/30 border-r border-white/10 flex flex-col z-20">
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm text-white truncate">Cabinet</span>
          </div>
          {user && <p className="text-xs text-gray-500 mt-2 truncate">{user.email}</p>}
        </div>

        <nav className="flex-1 p-3 space-y-1">
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-purple-500/20 text-purple-400 text-sm font-semibold">
            <Building2 size={16} /> Mes PME clientes
          </button>
          <button
            onClick={() => router.push(`/cabinet/${cabinetId}/cloture`)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <Clock size={16} /> Clôture & Import
          </button>
          <button
            onClick={() => router.push(`/cabinet/${cabinetId}/abonnement`)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <Crown size={16} /> Abonnement
          </button>
          <button
            onClick={() => router.push(`/cabinet/${cabinetId}/parametres`)}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-white/5 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <Settings size={16} /> Paramètres
          </button>
        </nav>

        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-gray-500 hover:text-red-400 text-sm transition-colors"
          >
            <LogOut size={16} /> Déconnexion
          </button>
        </div>
      </aside>

      {/* Contenu principal */}
      <main className="ml-56 p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">Tableau de bord</h1>
            <p className="text-gray-500 text-sm mt-1">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Ajouter une PME
          </button>
        </div>

        {sub && <div className="mb-6"><SubscriptionBanner sub={sub} cabinetId={cabinetId} /></div>}

        {dashboard && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <StatCard
              label="PME clientes"
              value={dashboard.totalCompanies}
              icon={Building2}
              color="bg-purple-500/20 text-purple-400"
            />
            <StatCard
              label="Paies en attente"
              value={dashboard.pendingPayrolls}
              icon={Clock}
              color={dashboard.pendingPayrolls > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'}
            />
            <StatCard
              label="Bulletins restants"
              value={sub?.remainingSlots ?? '∞'}
              icon={TrendingUp}
              color="bg-blue-500/20 text-blue-400"
            />
          </div>
        )}

        {dashboard && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white">Vos PME clientes</h2>
              {dashboard.pendingPayrolls > 0 && (
                <div className="flex items-center gap-1.5 text-amber-400 text-xs">
                  <AlertCircle size={14} />
                  {dashboard.pendingPayrolls} paie{dashboard.pendingPayrolls > 1 ? 's' : ''} à traiter
                </div>
              )}
            </div>

            {dashboard.companies.length === 0 ? (
              <div className="border border-dashed border-white/10 rounded-2xl p-12 text-center">
                <Building2 size={32} className="text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Aucune PME cliente pour l'instant</p>
                <button
                  onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
                  className="mt-4 px-5 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-semibold transition-colors"
                >
                  Ajouter votre première PME
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {dashboard.companies.map((company) => (
                  <CompanyCardItem
                    key={company.companyId}
                    company={company}
                    cabinetId={cabinetId}
                    onOpen={openCompany}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}