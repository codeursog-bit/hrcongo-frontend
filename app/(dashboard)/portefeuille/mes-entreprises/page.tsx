'use client';

// app/(dashboard)/mes-entreprises/page.tsx
// Portefeuille multi-entreprises — même style que le reste de l'admin
// (Tailwind + CSS vars, lucide-react, pas de thème cabinet).

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, LayoutGrid, List, X, Loader2, AlertCircle,
  Building2, MapPin, ArrowRight, CheckCircle2, Lock, Users,
} from 'lucide-react';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioCompany {
  id: string;
  name: string;
  logo?: string | null;
  isActive: boolean;
  city?: string | null;
  employeeCount?: number;
}

interface CreateCompanyForm {
  legalName: string; tradeName: string; rccmNumber: string; cnssNumber: string;
  address: string; city: string; phone: string; email: string; country: string;
}

const EMPTY_FORM: CreateCompanyForm = {
  legalName: '', tradeName: '', rccmNumber: '', cnssNumber: '',
  address: '', city: '', phone: '', email: '', country: 'CG',
};

const AVATAR_GRADIENTS = [
  'from-emerald-500 to-teal-400', 'from-sky-500 to-cyan-400',
  'from-violet-500 to-purple-400', 'from-amber-500 to-orange-400',
  'from-rose-500 to-pink-400', 'from-indigo-500 to-blue-400',
];

// ─── Avatar entreprise : logo si dispo (fond blanc, cadré proprement), sinon initiales ──

function CompanyAvatar({ company, idx, size = 'md' }: { company: PortfolioCompany; idx: number; size?: 'md' | 'sm' }) {
  const initials = company.name.slice(0, 2).toUpperCase();
  const gradient = AVATAR_GRADIENTS[idx % AVATAR_GRADIENTS.length];
  const dims = size === 'md' ? 'w-11 h-11 rounded-xl' : 'w-9 h-9 rounded-lg';

  if (company.logo) {
    return (
      <div className={`${dims} bg-white shrink-0 overflow-hidden flex items-center justify-center`} style={{ border: '1px solid var(--border)' }}>
        <img src={company.logo} alt={company.name} className="w-full h-full object-contain p-1.5" />
      </div>
    );
  }
  return (
    <div className={`${dims} bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold ${size === 'md' ? 'text-sm' : 'text-xs'} shrink-0`}>
      {initials}
    </div>
  );
}

// ─── Carte entreprise ─────────────────────────────────────────────────────────

function CompanyCard({ company, idx, onOpen, opening }: {
  company: PortfolioCompany; idx: number; onOpen: (c: PortfolioCompany) => void; opening: boolean;
}) {
  return (
    <div className="group relative rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <CompanyAvatar company={company} idx={idx} />
          <div className="min-w-0">
            <p className="font-bold text-sm truncate" style={{ color: 'var(--text)' }}>{company.name}</p>
            {company.city && (
              <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                <MapPin size={11} />{company.city}
              </p>
            )}
          </div>
        </div>
        {company.isActive ? (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 shrink-0">
            <CheckCircle2 size={11} /> Active
          </span>
        ) : (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 shrink-0">
            Inactive
          </span>
        )}
      </div>

      {typeof company.employeeCount === 'number' && (
        <div className="flex items-center gap-1.5 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
          <Users size={12} />
          {company.employeeCount} employé{company.employeeCount > 1 ? 's' : ''}
        </div>
      )}

      <button
        onClick={() => onOpen(company)}
        disabled={opening}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60 disabled:cursor-wait"
      >
        {opening ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
        {opening ? 'Ouverture…' : 'Ouvrir'}
      </button>
    </div>
  );
}

function CompanyRow({ company, idx, onOpen, opening }: {
  company: PortfolioCompany; idx: number; onOpen: (c: PortfolioCompany) => void; opening: boolean;
}) {
  return (
    <div className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-[var(--surface-2)]"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <CompanyAvatar company={company} idx={idx} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>{company.name}</p>
        <div className="flex items-center gap-2 flex-wrap">
          {company.city && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{company.city}</p>}
          {typeof company.employeeCount === 'number' && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <Users size={11} />{company.employeeCount}
            </span>
          )}
        </div>
      </div>
      {company.isActive ? (
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Active</span>
      ) : (
        <span className="text-[10px] font-bold text-red-600 dark:text-red-400">Inactive</span>
      )}
      <button
        onClick={() => onOpen(company)}
        disabled={opening}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
      >
        {opening ? <Loader2 size={13} className="animate-spin" /> : <ArrowRight size={13} />}
        Ouvrir
      </button>
    </div>
  );
}

// ─── Modal création ───────────────────────────────────────────────────────────

function CreateCompanyModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState<CreateCompanyForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof CreateCompanyForm, val: string) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async () => {
    if (!form.legalName || !form.rccmNumber || !form.address || !form.city) {
      setError('Veuillez remplir les champs obligatoires (*)');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.post('/portfolio/companies', form);
      onCreated();
    } catch (e: any) {
      setError(e.message || "Erreur lors de la création de l'entreprise");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !saving && onClose()}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="relative w-full max-w-lg rounded-2xl overflow-hidden z-10"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center">
              <Building2 size={18} className="text-emerald-500" />
            </div>
            <div>
              <h2 className="text-sm font-bold" style={{ color: 'var(--text)' }}>Ajouter une entreprise</h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Les champs marqués * sont obligatoires</p>
            </div>
          </div>
          {!saving && (
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-[var(--surface-2)]" style={{ color: 'var(--text-muted)' }}>
              <X size={18} />
            </button>
          )}
        </div>

        <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          <Field label="Raison sociale *" value={form.legalName} onChange={v => set('legalName', v)} placeholder="ACME SARL" />
          <Field label="Nom commercial" value={form.tradeName} onChange={v => set('tradeName', v)} placeholder="Acme" />
          <Field label="N° RCCM *" value={form.rccmNumber} onChange={v => set('rccmNumber', v)} placeholder="BZV-01-2024-B12-0001" />
          <Field label="N° CNSS" value={form.cnssNumber} onChange={v => set('cnssNumber', v)} placeholder="12345678" />
          <Field label="Adresse *" value={form.address} onChange={v => set('address', v)} placeholder="Avenue de l'Indépendance" />
          <Field label="Ville *" value={form.city} onChange={v => set('city', v)} placeholder="Pointe-Noire" />
          <Field label="Téléphone" value={form.phone} onChange={v => set('phone', v)} placeholder="+242 06 000 0000" />
          <Field label="Email entreprise" type="email" value={form.email} onChange={v => set('email', v)} placeholder="contact@acme.cg" />
        </div>

        {error && (
          <div className="mx-6 mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium">
            <AlertCircle size={14} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center gap-2 px-6 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60 disabled:cursor-wait"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
            {saving ? 'Création…' : 'Créer et ajouter'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-[var(--surface-2)]"
            style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}
          >
            Annuler
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-xl text-sm bg-[var(--surface-2)] border border-[var(--border)] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
        style={{ color: 'var(--text)' }}
      />
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function MesEntreprisesPage() {
  const router = useRouter();
  const [companies, setCompanies] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [openError, setOpenError] = useState('');

  const loadCompanies = () => {
    setLoading(true);
    api.get<PortfolioCompany[]>('/auth/my-companies')
      .then(list => setCompanies(list ?? []))
      .catch(() => setCompanies([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadCompanies(); }, []);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter(c => `${c.name} ${c.city ?? ''}`.toLowerCase().includes(q));
  }, [companies, search]);

  const handleOpen = async (company: PortfolioCompany) => {
    setOpeningId(company.id);
    setOpenError('');
    try {
      await api.post('/auth/switch-company', { companyId: company.id });
      router.push('/dashboard');
    } catch (e: any) {
      setOpenError(e.message || "Impossible d'ouvrir cette entreprise");
      setOpeningId(null);
    }
  };

  const handleCreated = () => {
    setShowCreate(false);
    loadCompanies();
  };

  if (loading) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-20">
      <AnimatePresence>
        {showCreate && (
          <CreateCompanyModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
        )}
      </AnimatePresence>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text)' }}>Mes entreprises</h1>
          <p className="mt-1 flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {companies.length} entreprise{companies.length > 1 ? 's' : ''} dans votre portefeuille
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-2"
        >
          <Plus size={20} /> Ajouter une entreprise
        </button>
      </div>

      {openError && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium">
          <AlertCircle size={16} className="shrink-0" />
          {openError}
        </div>
      )}

      {/* ── BARRE FILTRES ── */}
      {companies.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Rechercher une entreprise..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              style={{ color: 'var(--text)' }}
            />
          </div>
          <div className="flex bg-[var(--surface-2)] p-1 rounded-xl ml-auto">
            <button onClick={() => setView('grid')} className={`p-2.5 rounded-lg transition-all ${view === 'grid' ? 'bg-[var(--surface)] text-emerald-500 shadow-sm' : 'text-gray-500'}`}>
              <LayoutGrid size={18} />
            </button>
            <button onClick={() => setView('list')} className={`p-2.5 rounded-lg transition-all ${view === 'list' ? 'bg-[var(--surface)] text-emerald-500 shadow-sm' : 'text-gray-500'}`}>
              <List size={18} />
            </button>
          </div>
        </div>
      )}

      {/* ── CONTENU ── */}
      {companies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 bg-[var(--surface-2)]">
            <Building2 size={24} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>Aucune entreprise dans votre portefeuille</p>
          <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>Ajoutez votre première entreprise pour commencer</p>
          <button
            onClick={() => setShowCreate(true)}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors flex items-center gap-2"
          >
            <Plus size={18} /> Ajouter une entreprise
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center rounded-2xl" style={{ border: '2px dashed var(--border)' }}>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Aucune entreprise ne correspond à votre recherche</p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((c, idx) => (
            <CompanyCard key={c.id} company={c} idx={idx} onOpen={handleOpen} opening={openingId === c.id} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          {filtered.map((c, idx) => (
            <CompanyRow key={c.id} company={c} idx={idx} onOpen={handleOpen} opening={openingId === c.id} />
          ))}
        </div>
      )}
    </div>
  );
}