'use client';

// ============================================================================
// app/(dashboard)/cabinet/[cabinetId]/mes-pme/page.tsx
// REFONTE UX — Liste des PME, grille de cartes avec relief, SVG custom
// ============================================================================

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';
import {
  C, Ico, PageShell, TopBar, Card, SectionHeader,
  Badge, Avatar, Btn, LoadingScreen,
} from '@/components/cabinet/cabinet-ui';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PmeItem {
  companyId:        string;
  legalName:        string;
  tradeName:        string | null;
  city:             string | null;
  employeeCount:    number;
  lastPayroll:      any;
  pmePortalEnabled: boolean;
  createdAt:        string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

function statusBadge(lp: any): { label: string; variant: any } {
  if (!lp) return { label: 'Sans paie', variant: 'default' };
  if (lp.status === 'PAID')      return { label: 'Payé',     variant: 'success' };
  if (lp.status === 'VALIDATED') return { label: 'Validé',   variant: 'info'    };
  if (lp.status === 'DRAFT')     return { label: 'En cours', variant: 'warning' };
  return { label: 'Inconnu', variant: 'default' };
}

// ─── PME Card ─────────────────────────────────────────────────────────────────
function PmeCard({ company, idx, cabinetId, router }: {
  company: PmeItem; idx: number; cabinetId: string; router: any;
}) {
  const name = company.tradeName || company.legalName;
  const sb   = statusBadge(company.lastPayroll);
  const lp   = company.lastPayroll;

  return (
    <Card
      onClick={() => router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/dashboard`)}
      className="p-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <Avatar name={name.slice(0, 2)} size={38} index={idx} />
          <div>
            <p className="text-sm font-semibold leading-none" style={{ color: C.textPrimary }}>
              {name}
            </p>
            {company.city && (
              <p className="text-[11px] mt-1" style={{ color: C.textMuted }}>{company.city}</p>
            )}
          </div>
        </div>
        <Badge label={sb.label} variant={sb.variant} />
      </div>

      {/* Stats row */}
      <div
        className="grid grid-cols-2 gap-3 py-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 12px' }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Employés</p>
          <p className="text-base font-bold" style={{ color: C.textPrimary }}>
            {company.employeeCount}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: C.textMuted }}>Masse nette</p>
          <p className="text-base font-bold" style={{ color: C.textPrimary }}>
            {lp ? `${fmt(lp.netSalary ?? 0)} F` : '—'}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-1.5">
          {company.pmePortalEnabled ? (
            <>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.emerald }} />
              <p className="text-[11px]" style={{ color: C.emerald }}>Portail actif</p>
            </>
          ) : (
            <>
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: C.textMuted }} />
              <p className="text-[11px]" style={{ color: C.textMuted }}>Portail inactif</p>
            </>
          )}
        </div>
        {lp && (
          <p className="text-[11px]" style={{ color: C.textMuted }}>
            {MONTHS[(lp.month ?? 1) - 1]} {lp.year}
          </p>
        )}
        <Ico.ArrowRight size={13} color={C.textMuted} />
      </div>
    </Card>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MesPmePage() {
  const params       = useParams();
  const router       = useRouter();
  const searchParams = useSearchParams();
  const cabinetId    = params.cabinetId as string;

  const [companies, setCompanies] = useState<PmeItem[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState(searchParams.get('filter') ?? 'ALL');

  useEffect(() => {
    api.get(`/cabinet/${cabinetId}/dashboard`)
      .then((r: any) => setCompanies(r.companies ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [cabinetId]);

  const filtered = useMemo(() => {
    const now = new Date();
    return companies
      .filter(c => {
        const name = (c.tradeName || c.legalName).toLowerCase();
        if (search && !name.includes(search.toLowerCase())) return false;
        if (filter === 'PENDING') {
          const lp = c.lastPayroll;
          return !lp || !(lp.month === now.getMonth() + 1 && lp.year === now.getFullYear());
        }
        if (filter === 'PORTAL') return c.pmePortalEnabled;
        return true;
      });
  }, [companies, search, filter]);

  const FILTERS = [
    { id: 'ALL',     label: 'Toutes' },
    { id: 'PENDING', label: 'Sans paie' },
    { id: 'PORTAL',  label: 'Portail actif' },
  ];

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen" style={{ background: C.pageBg }}>
      <CabinetSidebar cabinetId={cabinetId} />

      <div className="ml-56">
        <TopBar
          title="Mes PME"
          subtitle={`${companies.length} entreprise${companies.length > 1 ? 's' : ''} cliente${companies.length > 1 ? 's' : ''}`}
          breadcrumb="Cabinet"
          action={
            <Btn
              variant="primary"
              icon={<Ico.Plus size={14} color="#fff" />}
              onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
            >
              Ajouter une PME
            </Btn>
          }
        />

        <div className="p-8 space-y-6">

          {/* ── Barre filtre + recherche ─────────────────────────────────── */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Filtres pill */}
            <div
              className="flex items-center gap-1 p-1 rounded-xl"
              style={{ background: C.cardBg, border: `1px solid ${C.border}` }}
            >
              {FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: filter === f.id ? C.indigo : 'transparent',
                    color:      filter === f.id ? '#fff'   : C.textSecondary,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Recherche */}
            <div className="flex-1 relative max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2">
                <Ico.Search size={14} color={C.textMuted} />
              </span>
              <input
                type="text"
                placeholder="Rechercher une PME…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm outline-none transition-all"
                style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  color: C.textPrimary,
                }}
                onFocus={e => (e.target.style.borderColor = C.indigo)}
                onBlur={e  => (e.target.style.borderColor = C.border)}
              />
            </div>

            <p className="text-xs ml-auto" style={{ color: C.textMuted }}>
              {filtered.length} résultat{filtered.length > 1 ? 's' : ''}
            </p>
          </div>

          {/* ── Grille PME ───────────────────────────────────────────────── */}
          {filtered.length === 0 ? (
            <Card className="py-16 text-center">
              <p className="text-sm" style={{ color: C.textMuted }}>Aucune PME trouvée</p>
              <Btn
                variant="primary"
                className="mx-auto mt-4"
                icon={<Ico.Plus size={14} color="#fff" />}
                onClick={() => router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
              >
                Ajouter une PME
              </Btn>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((company, idx) => (
                <PmeCard
                  key={company.companyId}
                  company={company}
                  idx={idx}
                  cabinetId={cabinetId}
                  router={router}
                />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}