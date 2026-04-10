'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/mes-pme/page.tsx
// PAGE DÉDIÉE — Gestion et navigation vers les PME clientes
// Liste/grille avec recherche, filtre, preview, accès direct
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  Building2, Users, Plus, Search, LayoutGrid, List,
  ChevronRight, Loader2, AlertCircle, CheckCircle2,
  Clock, DollarSign, ArrowRight, Filter, FileText,
  ExternalLink, Settings, Fingerprint,
} from 'lucide-react';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

// ─── Types ────────────────────────────────────────────────────────────────────
interface LastPayroll { id:string; month:number; year:number; status:string; netSalary:number }
interface CompanyCard {
  linkId: string; companyId: string;
  legalName: string; tradeName: string | null; city: string;
  employeeCount: number;
  pmePortalEnabled: boolean; employeeAccessEnabled: boolean;
  lastPayroll: LastPayroll | null;
}

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const STATUS_CFG: Record<string, { label:string; color:string; bg:string; dot:string }> = {
  PAID:      { label:'Payée',    color:'text-emerald-400', bg:'bg-emerald-500/10 border-emerald-500/20', dot:'bg-emerald-400' },
  VALIDATED: { label:'Validée', color:'text-blue-400',    bg:'bg-blue-500/10 border-blue-500/20',       dot:'bg-blue-400'    },
  DRAFT:     { label:'En cours',color:'text-amber-400',   bg:'bg-amber-500/10 border-amber-500/20',     dot:'bg-amber-400'   },
};

// ─── Card PME — Vue grille ─────────────────────────────────────────────────────
function PmeGridCard({ company, cabinetId, onOpen }: {
  company: CompanyCard; cabinetId: string; onOpen: (id: string) => void;
}) {
  const router = useRouter();
  const lp     = company.lastPayroll;
  const sc     = lp ? (STATUS_CFG[lp.status] ?? STATUS_CFG['DRAFT']) : null;

  const now           = new Date();
  const paidThisMonth = lp?.month === now.getMonth() + 1 && lp?.year === now.getFullYear();

  return (
    <div className="bg-white/4 hover:bg-white/[0.07] border border-white/10 hover:border-white/20 rounded-2xl overflow-hidden transition-all group">

      {/* Header card */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 bg-gradient-to-br from-purple-500/25 to-cyan-500/25 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-purple-400">
                {(company.tradeName || company.legalName).slice(0,2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {company.tradeName || company.legalName}
              </p>
              <p className="text-gray-500 text-xs">{company.city}</p>
            </div>
          </div>
          {/* Statut paie badge */}
          {sc && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium shrink-0 ${sc.bg} ${sc.color}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
              {sc.label}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-white/3 border border-white/5 rounded-xl p-2.5">
            <p className="text-xs text-gray-600 mb-0.5">Employés</p>
            <p className="text-sm font-bold text-white">{company.employeeCount}</p>
          </div>
          <div className="bg-white/3 border border-white/5 rounded-xl p-2.5">
            <p className="text-xs text-gray-600 mb-0.5">Dernier net</p>
            <p className="text-sm font-bold text-emerald-400">
              {lp ? `${fmt(lp.netSalary)} F` : '—'}
            </p>
          </div>
        </div>

        {/* Mois dernier bulletin */}
        {lp && (
          <p className="text-[10px] text-gray-600 mb-3">
            Dernier bulletin : {MONTHS[lp.month - 1]} {lp.year}
            {paidThisMonth && <span className="ml-1 text-emerald-500">· ✓ Ce mois</span>}
          </p>
        )}

        {/* Badges portail */}
        <div className="flex gap-1.5 flex-wrap min-h-[18px]">
          {company.pmePortalEnabled && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              Portail PME
            </span>
          )}
          {company.employeeAccessEnabled && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 font-medium">
              Employés
            </span>
          )}
          {!company.pmePortalEnabled && !company.employeeAccessEnabled && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-500/10 border border-gray-500/15 text-gray-600">
              Portail inactif
            </span>
          )}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-white/8 grid grid-cols-3 divide-x divide-white/5">
        {/* Accès paie (action principale cabinet) */}
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/paie`)}
          className="flex flex-col items-center gap-1 py-3 hover:bg-purple-500/10 transition-colors group/btn"
          title="Saisir les variables paie"
        >
          <DollarSign size={14} className="text-gray-500 group-hover/btn:text-purple-400 transition-colors" />
          <span className="text-[9px] text-gray-600 group-hover/btn:text-purple-400 transition-colors">Paie</span>
        </button>

        {/* Employés */}
        <button
          onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/employes`)}
          className="flex flex-col items-center gap-1 py-3 hover:bg-cyan-500/10 transition-colors group/btn"
          title="Voir les employés"
        >
          <Users size={14} className="text-gray-500 group-hover/btn:text-cyan-400 transition-colors" />
          <span className="text-[9px] text-gray-600 group-hover/btn:text-cyan-400 transition-colors">Employés</span>
        </button>

        {/* Accès complet */}
        <button
          onClick={() => onOpen(company.companyId)}
          className="flex flex-col items-center gap-1 py-3 hover:bg-white/5 transition-colors group/btn"
          title="Ouvrir l'espace PME complet"
        >
          <ExternalLink size={14} className="text-gray-500 group-hover/btn:text-white transition-colors" />
          <span className="text-[9px] text-gray-600 group-hover/btn:text-white transition-colors">Ouvrir</span>
        </button>
      </div>
    </div>
  );
}

// ─── Row PME — Vue liste ───────────────────────────────────────────────────────
function PmeListRow({ company, cabinetId, onOpen }: {
  company: CompanyCard; cabinetId: string; onOpen: (id: string) => void;
}) {
  const router = useRouter();
  const lp     = company.lastPayroll;
  const sc     = lp ? (STATUS_CFG[lp.status] ?? STATUS_CFG['DRAFT']) : null;

  return (
    <div className="px-5 py-4 flex items-center gap-4 hover:bg-white/3 transition-colors group">
      {/* Avatar */}
      <div className="w-9 h-9 bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-purple-500/15 rounded-xl flex items-center justify-center shrink-0">
        <span className="text-[11px] font-bold text-purple-400">
          {(company.tradeName || company.legalName).slice(0,2).toUpperCase()}
        </span>
      </div>

      {/* Nom + ville */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">
          {company.tradeName || company.legalName}
        </p>
        <p className="text-xs text-gray-500">{company.city}</p>
      </div>

      {/* Employés */}
      <div className="w-20 text-center">
        <p className="text-sm font-semibold text-white">{company.employeeCount}</p>
        <p className="text-[10px] text-gray-600">employé{company.employeeCount > 1 ? 's' : ''}</p>
      </div>

      {/* Dernier bulletin */}
      <div className="w-28 text-center">
        {lp ? (
          <>
            <p className="text-xs text-white font-medium">{MONTHS[lp.month - 1]} {lp.year}</p>
            <p className="text-[10px] text-emerald-400">{fmt(lp.netSalary)} F net</p>
          </>
        ) : (
          <p className="text-xs text-gray-600">Aucune paie</p>
        )}
      </div>

      {/* Statut */}
      <div className="w-24">
        {sc ? (
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${sc.bg} ${sc.color}`}>
            {sc.label}
          </span>
        ) : (
          <span className="text-[10px] text-gray-600">—</span>
        )}
      </div>

      {/* Portail */}
      <div className="w-20 text-center">
        {company.pmePortalEnabled
          ? <span className="text-[9px] text-emerald-400">✓ Actif</span>
          : <span className="text-[9px] text-gray-600">Inactif</span>
        }
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/paie`)}
          className="p-1.5 hover:bg-purple-500/15 rounded-lg text-gray-500 hover:text-purple-400 transition-colors"
          title="Saisir paie">
          <DollarSign size={13} />
        </button>
        <button onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/employes`)}
          className="p-1.5 hover:bg-cyan-500/15 rounded-lg text-gray-500 hover:text-cyan-400 transition-colors"
          title="Employés">
          <Users size={13} />
        </button>
        <button onClick={() => onOpen(company.companyId)}
          className="p-1.5 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"
          title="Ouvrir">
          <ExternalLink size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────
export default function MesPmePage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const cabinetId    = params.cabinetId as string;

  const [companies, setCompanies] = useState<CompanyCard[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [user,      setUser]      = useState<any>(null);
  const [view,      setView]      = useState<'grid' | 'list'>('grid');
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState<'ALL'|'PENDING'|'OK'|'NO_PORTAL'>(
    (searchParams?.get('filter') as any) ?? 'ALL'
  );

  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) { try { setUser(JSON.parse(stored)); } catch {} }

    api.get(`/cabinet/${cabinetId}/dashboard`)
      .then((r: any) => setCompanies(r?.companies ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const openCompany = (companyId: string) => {
    sessionStorage.setItem('cabinetContext',  cabinetId);
    sessionStorage.setItem('activeCompanyId', companyId);
    router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/dashboard`);
  };

  const now = new Date();

  const filtered = useMemo(() => {
    let list = companies;

    // Filtre recherche
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        `${c.legalName} ${c.tradeName ?? ''} ${c.city}`.toLowerCase().includes(q)
      );
    }

    // Filtre statut
    if (filter === 'PENDING') {
      list = list.filter(c =>
        !c.lastPayroll ||
        !(c.lastPayroll.month === now.getMonth() + 1 && c.lastPayroll.year === now.getFullYear()) ||
        c.lastPayroll.status === 'DRAFT'
      );
    } else if (filter === 'OK') {
      list = list.filter(c =>
        c.lastPayroll?.month === now.getMonth() + 1 &&
        c.lastPayroll?.year  === now.getFullYear() &&
        (c.lastPayroll.status === 'PAID' || c.lastPayroll.status === 'VALIDATED')
      );
    } else if (filter === 'NO_PORTAL') {
      list = list.filter(c => !c.pmePortalEnabled);
    }

    return list;
  }, [companies, search, filter]);

  // Compteurs pour les filtres
  const counts = useMemo(() => ({
    ALL:       companies.length,
    PENDING:   companies.filter(c =>
      !c.lastPayroll ||
      !(c.lastPayroll.month === now.getMonth() + 1 && c.lastPayroll.year === now.getFullYear()) ||
      c.lastPayroll.status === 'DRAFT'
    ).length,
    OK:        companies.filter(c =>
      c.lastPayroll?.month === now.getMonth() + 1 &&
      c.lastPayroll?.year  === now.getFullYear() &&
      (c.lastPayroll.status === 'PAID' || c.lastPayroll.status === 'VALIDATED')
    ).length,
    NO_PORTAL: companies.filter(c => !c.pmePortalEnabled).length,
  }), [companies]);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email} />

      <main className="ml-56 p-8">

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-gray-600 uppercase tracking-widest mb-1">Cabinet</p>
            <h1 className="text-2xl font-bold text-white">Mes PME clientes</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {companies.length} entreprise{companies.length > 1 ? 's' : ''} sous gestion
            </p>
          </div>
          <button onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-500 hover:bg-purple-400 text-white rounded-xl text-sm font-semibold transition-colors">
            <Plus size={15} /> Ajouter une PME
          </button>
        </div>

        {/* ── Barre outils ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 mb-6">
          {/* Recherche */}
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher une PME..."
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-white/20 transition-colors" />
          </div>

          {/* Filtres */}
          <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1">
            {([
              ['ALL',       'Toutes',        counts.ALL      ],
              ['PENDING',   'À traiter',     counts.PENDING  ],
              ['OK',        'À jour',        counts.OK       ],
              ['NO_PORTAL', 'Sans portail',  counts.NO_PORTAL],
            ] as [typeof filter, string, number][]).map(([k, l, count]) => (
              <button key={k} onClick={() => setFilter(k)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-colors ${filter === k ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-white'}`}>
                {l}
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${
                  filter === k ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-600'
                }`}>{count}</span>
              </button>
            ))}
          </div>

          {/* Toggle vue */}
          <div className="flex gap-1 bg-white/3 border border-white/8 rounded-xl p-1 ml-auto">
            <button onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              <LayoutGrid size={14} />
            </button>
            <button onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}>
              <List size={14} />
            </button>
          </div>
        </div>

        {/* ── Contenu ──────────────────────────────────────────────────────── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 size={28} className="animate-spin text-purple-400" />
          </div>

        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <Building2 size={36} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">
              {search || filter !== 'ALL' ? 'Aucune PME ne correspond aux filtres' : 'Aucune PME cliente pour l\'instant'}
            </p>
            {!search && filter === 'ALL' && (
              <button onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
                className="mt-4 px-5 py-2.5 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-400 rounded-xl text-sm font-semibold transition-colors">
                Ajouter votre première PME
              </button>
            )}
          </div>

        ) : view === 'grid' ? (
          // ── Vue grille ────────────────────────────────────────────────────
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map(company => (
              <PmeGridCard
                key={company.companyId}
                company={company}
                cabinetId={cabinetId}
                onOpen={openCompany}
              />
            ))}
          </div>

        ) : (
          // ── Vue liste ─────────────────────────────────────────────────────
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {/* En-tête colonnes */}
            <div className="px-5 py-3 border-b border-white/8 grid grid-cols-[1fr_80px_140px_100px_80px_auto] gap-4 items-center">
              {['Entreprise','Effectif','Dernier bulletin','Statut','Portail',''].map((h, i) => (
                <p key={i} className="text-[10px] text-gray-600 uppercase tracking-wider font-medium">{h}</p>
              ))}
            </div>
            <div className="divide-y divide-white/5">
              {filtered.map(company => (
                <PmeListRow
                  key={company.companyId}
                  company={company}
                  cabinetId={cabinetId}
                  onOpen={openCompany}
                />
              ))}
            </div>
          </div>
        )}

        {/* Compteur résultats */}
        {filtered.length > 0 && (
          <p className="text-center text-xs text-gray-700 mt-6">
            {filtered.length} PME affichée{filtered.length > 1 ? 's' : ''}
            {search && ` · Résultat de recherche pour "${search}"`}
          </p>
        )}
      </main>
    </div>
  );
}