'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Search, Plus, Monitor, Car, HardHat, Smartphone,
  CheckCircle2, AlertCircle, User,
  Laptop, X, Loader2, Tag, Armchair, Zap, RefreshCw,
  MoreVertical, Wrench, Archive, CheckCheck, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

// ── Types ─────────────────────────────────────────────────────────────────────
type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  category: string;
  status: AssetStatus;
  employee?: { id: string; firstName: string; lastName: string; photoUrl?: string };
  purchasePrice?: number;
  purchaseValue?: number;
  purchaseDate?: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

// ── Catégories ────────────────────────────────────────────────────────────────
const CATEGORY_SUGGESTIONS = [
  { value: 'COMPUTER',         label: 'Informatique',      icon: Laptop },
  { value: 'VEHICLE',          label: 'Véhicule',          icon: Car },
  { value: 'EPI',              label: 'Sécurité (EPI)',    icon: HardHat },
  { value: 'PHONE',            label: 'Mobile / Téléphone',icon: Smartphone },
  { value: 'FURNITURE',        label: 'Mobilier',          icon: Armchair },
  { value: 'OFFICE_EQUIPMENT', label: 'Équipement bureau', icon: Monitor },
];

const FILTER_CATEGORIES = [
  { id: 'All',              label: 'Tout' },
  { id: 'COMPUTER',         label: 'Tech & IT' },
  { id: 'VEHICLE',          label: 'Flotte Auto' },
  { id: 'EPI',              label: 'Sécurité' },
  { id: 'PHONE',            label: 'Mobiles' },
];

// ── Statuts disponibles pour changer via le menu ──────────────────────────────
const STATUS_ACTIONS: { status: AssetStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'AVAILABLE',   label: 'Marquer Disponible',   icon: CheckCheck, color: 'text-emerald-500' },
  { status: 'MAINTENANCE', label: 'Mettre en Maintenance', icon: Wrench,     color: 'text-amber-500' },
  { status: 'RETIRED',     label: 'Réformer (Retraité)',  icon: Archive,    color: 'text-red-500' },
];

// ── CategoryInput ─────────────────────────────────────────────────────────────
const CategoryInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = CATEGORY_SUGGESTIONS.filter(c =>
    value.length === 0 ||
    c.label.toLowerCase().includes(value.toLowerCase()) ||
    c.value.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1">Catégorie</label>
      <div className="relative">
        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] z-10" />
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          placeholder="Ex: Informatique, EPI…"
          className="w-full pl-9 pr-3 py-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-[var(--text-muted)] text-sm"
        />
      </div>

      <AnimatePresence>
        {show && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            // ✅ z-[200] pour passer AU-DESSUS des boutons du modal
            // ✅ bg solide dark ET light
            className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl z-[200] overflow-hidden"
          >
            {value && !CATEGORY_SUGGESTIONS.some(c => c.label.toLowerCase() === value.toLowerCase()) && (
              <button
                type="button"
                onClick={() => setShow(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left border-b border-[var(--border)]"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Plus size={14} />
                </div>
                <div>
                  <p className="text-sm text-[var(--text)] font-bold">"{value}"</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Catégorie personnalisée</p>
                </div>
              </button>
            )}
            {filtered.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => { onChange(cat.value); setShow(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <cat.icon size={14} />
                </div>
                <span className="text-sm text-[var(--text)]">{cat.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Menu actions (⋯) sur chaque card ─────────────────────────────────────────
const AssetActionsMenu = ({
  asset,
  onStatusChange,
  onAssign,
  onUnassign,
}: {
  asset: Asset;
  onStatusChange: (id: string, status: AssetStatus) => void;
  onAssign: () => void;
  onUnassign: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const availableActions = STATUS_ACTIONS.filter(a => a.status !== asset.status);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        className="p-1.5 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
      >
        <MoreVertical size={16} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            // ✅ Fond solide, z élevé, ombre forte
            className="absolute right-0 top-8 w-52 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl z-[100] overflow-hidden py-1"
          >
            {/* Assigner / désassigner */}
            {asset.status === 'AVAILABLE' && (
              <button
                onClick={() => { setOpen(false); onAssign(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <UserCheck size={15} className="text-emerald-500" />
                <span className="text-sm text-[var(--text)]">Assigner à un employé</span>
              </button>
            )}
            {asset.status === 'IN_USE' && asset.employee && (
              <button
                onClick={() => { setOpen(false); onUnassign(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <User size={15} className="text-red-500" />
                <span className="text-sm text-red-500">Retirer à {asset.employee.firstName}</span>
              </button>
            )}

            {/* Séparateur si actions statut */}
            {availableActions.length > 0 && (
              <div className="border-t border-[var(--border)] my-1" />
            )}

            {/* Changer statut */}
            {availableActions.map(action => (
              <button
                key={action.status}
                onClick={() => { setOpen(false); onStatusChange(asset.id, action.status); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--surface-2)] transition-colors text-left"
              >
                <action.icon size={15} className={action.color} />
                <span className="text-sm text-[var(--text)]">{action.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Page principale ───────────────────────────────────────────────────────────
export default function AssetsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState({
    name: '', serialNumber: '', category: '', condition: 'NEW',
    purchaseValue: '',
    purchaseDate: new Date().toISOString().split('T')[0],
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, employeesRaw] = await Promise.all([
          api.get<any>('/assets'),
          api.get<any>('/employees/simple'),
        ]);
        const assetList: Asset[] = Array.isArray(assetsData) ? assetsData : (assetsData?.data ?? []);
        setAssets(assetList);
        const empList: EmployeeOption[] = Array.isArray(employeesRaw) ? employeesRaw : (employeesRaw?.data ?? []);
        setEmployees(empList);
      } catch (e) {
        console.error('Erreur chargement:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCreateAsset = async () => {
    if (!newAsset.name || !newAsset.category) return;
    setIsCreating(true);
    try {
      const payload = {
        name: newAsset.name,
        serialNumber: newAsset.serialNumber || undefined,
        category: newAsset.category,
        condition: newAsset.condition,
        purchaseValue: newAsset.purchaseValue !== '' ? Number(newAsset.purchaseValue) : 0,
        purchaseDate: new Date(newAsset.purchaseDate).toISOString(),
      };
      const created = await api.post<Asset>('/assets', payload);
      setAssets(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewAsset({ name: '', serialNumber: '', category: '', condition: 'NEW', purchaseValue: '', purchaseDate: new Date().toISOString().split('T')[0] });
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la création.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignAsset || !selectedEmployeeId) return;
    setIsAssigning(true);
    try {
      const updated = await api.patch<Asset>(`/assets/${assignAsset.id}/assign`, { employeeId: selectedEmployeeId });
      setAssets(prev => prev.map(a => a.id === assignAsset.id ? updated : a));
      setAssignAsset(null);
      setSelectedEmployeeId('');
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'assignation.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (asset: Asset) => {
    if (!confirm(`Retirer ${asset.name} à ${asset.employee?.firstName} ?`)) return;
    try {
      const updated = await api.patch<Asset>(`/assets/${asset.id}/assign`, { employeeId: null });
      setAssets(prev => prev.map(a => a.id === asset.id ? updated : a));
    } catch { alert('Erreur technique.'); }
  };

  // ✅ Changer le statut directement via l'API
  const handleStatusChange = async (assetId: string, newStatus: AssetStatus) => {
    try {
      const updated = await api.patch<Asset>(`/assets/${assetId}/status`, { status: newStatus });
      setAssets(prev => prev.map(a => a.id === assetId ? updated : a));
    } catch (e: any) {
      alert(e?.message || 'Erreur lors du changement de statut.');
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        a.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORY_SUGGESTIONS.find(c => c.value === cat);
    return found ? <found.icon size={22} /> : <Monitor size={22} />;
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORY_SUGGESTIONS.find(c => c.value === cat);
    return found ? found.label : cat;
  };

  const getStatusStyle = (status: AssetStatus) => {
    switch (status) {
      case 'IN_USE':      return { bg: 'bg-emerald-500/10', text: 'text-emerald-500', border: 'border-emerald-500/30', icon: User,          label: 'Assigné' };
      case 'AVAILABLE':   return { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', icon: CheckCircle2,  label: 'Disponible' };
      case 'MAINTENANCE': return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/30', icon: RefreshCw,     label: 'Maintenance' };
      case 'RETIRED':     return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/30', icon: AlertCircle,   label: 'Retraité' };
      default:            return { bg: 'bg-[var(--surface-2)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', icon: AlertCircle,   label: status };
    }
  };

  const assetValue = (a: Asset) => a.purchasePrice ?? a.purchaseValue ?? 0;

  // ── Classes communes dark/light ────────────────────────────────────────────
  const inputCls = "w-full p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--text)] outline-none focus:border-emerald-500/70 focus:ring-1 focus:ring-emerald-500/50 transition-colors placeholder:text-[var(--text-muted)] text-sm";
  const labelCls = "block text-xs font-bold text-[var(--text-muted)] uppercase mb-2 ml-1";
  const modalBg  = "bg-[var(--surface)]";
  const modalBorder = "border border-[var(--border)]";

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8 relative">

      {/* Ambiance background — visible surtout en dark */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
      </div>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 backdrop-blur-md rounded-2xl border border-emerald-500/20 shadow-sm text-emerald-500">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[var(--text)] tracking-tight">
              Parc <span className="text-emerald-500">Matériel</span>
            </h1>
            <p className="text-[var(--text-muted)]">Gestion centralisée des actifs et dotations.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg hover:shadow-emerald-500/30 transition-colors flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Nouvelle Dotation
        </button>
      </div>

      {/* ── MÉTRIQUES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Actifs', val: assets.length,                                       col: 'text-[var(--text)]',       bg: 'bg-[var(--surface-2)]',         icon: Tag,          border: 'border-[var(--border)]' },
          { label: 'Assignés',     val: assets.filter(a => a.status === 'IN_USE').length,     col: 'text-emerald-500', bg: 'bg-emerald-500/10',   icon: User,         border: 'border-emerald-500/20' },
          { label: 'Disponibles',  val: assets.filter(a => a.status === 'AVAILABLE').length,  col: 'text-[var(--text-muted)]',       bg: 'bg-[var(--surface-2)]',         icon: CheckCircle2, border: 'border-[var(--border)]' },
          { label: 'Maintenance',  val: assets.filter(a => a.status === 'MAINTENANCE').length, col: 'text-amber-500',  bg: 'bg-amber-500/10',     icon: RefreshCw,    border: 'border-amber-500/20' },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-2xl border ${m.bg} ${m.border} shadow-sm`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">{m.label}</p>
                <p className={`text-3xl font-black mt-1 ${m.col}`}>{m.val}</p>
              </div>
              <m.icon className={`${m.col} opacity-70`} size={22} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="bg-[var(--surface)] backdrop-blur-xl rounded-[28px] border border-[var(--border)] overflow-hidden min-h-[500px] relative z-10 shadow-sm">

        {/* Toolbar */}
        <div className="p-5 border-b border-[var(--border)] flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {FILTER_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border transition-colors
                  ${activeCategory === cat.id
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/20'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] border-[var(--border)] hover:bg-[var(--border)]'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-emerald-500 transition-colors" size={16} />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-sm text-[var(--text)] focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 outline-none transition-colors placeholder:text-[var(--text-muted)]" />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-emerald-500" size={40} />
            <p className="mt-3 text-emerald-500 font-bold text-xs tracking-widest animate-pulse">CHARGEMENT</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-[var(--text-muted)]">
            <Search size={40} className="mb-3 opacity-30" />
            <p className="text-sm">Aucun équipement trouvé.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 p-5">
            <AnimatePresence>
              {filteredAssets.map((asset, i) => {
                const style = getStatusStyle(asset.status);
                return (
                  <motion.div key={asset.id}
                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                    className="group relative bg-[var(--surface)] hover:bg-[var(--surface-2)] border border-[var(--border)] hover:border-emerald-500/40 rounded-2xl p-5 transition-colors duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-visible"
                  >
                    {/* En-tête card */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] group-hover:scale-105 transition-transform">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-[var(--text)] text-base line-clamp-1 group-hover:text-emerald-500 transition-colors">{asset.name}</h3>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">{asset.serialNumber || 'S/N —'}</p>
                          <p className="text-[10px] text-emerald-500/70 mt-0.5">{getCategoryLabel(asset.category)}</p>
                        </div>
                      </div>

                      {/* Badge statut + menu ⋯ */}
                      <div className="flex items-center gap-1.5">
                        <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${style.bg} ${style.text} ${style.border}`}>
                          <style.icon size={11} /> {style.label}
                        </div>
                        {/* ✅ Menu actions statut */}
                        <AssetActionsMenu
                          asset={asset}
                          onStatusChange={handleStatusChange}
                          onAssign={() => setAssignAsset(asset)}
                          onUnassign={() => handleUnassign(asset)}
                        />
                      </div>
                    </div>

                    {/* Valeur */}
                    <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] mb-4">
                      <span className="text-xs text-[var(--text-muted)] uppercase font-bold">Valeur</span>
                      <span className="font-mono font-bold text-emerald-500 text-sm">
                        {assetValue(asset).toLocaleString() || '—'} <span className="text-[10px] text-[var(--text-muted)]">FCFA</span>
                      </span>
                    </div>

                    {/* Footer card */}
                    <div className="pt-3 border-t border-[var(--border)]">
                      {asset.status === 'IN_USE' && asset.employee ? (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={asset.employee.photoUrl || `https://ui-avatars.com/api/?name=${asset.employee.firstName}+${asset.employee.lastName}&background=10B981&color=fff`}
                            className="w-7 h-7 rounded-full border border-[var(--border)]" alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Détenteur</p>
                            <p className="text-sm font-bold text-[var(--text)] truncate">{asset.employee.firstName} {asset.employee.lastName}</p>
                          </div>
                        </div>
                      ) : asset.status === 'MAINTENANCE' ? (
                        <div className="flex items-center gap-2 text-amber-500">
                          <RefreshCw size={14} className="animate-spin" />
                          <span className="text-xs font-bold">En cours de maintenance</span>
                        </div>
                      ) : asset.status === 'RETIRED' ? (
                        <div className="flex items-center gap-2 text-[var(--text-muted)]">
                          <AlertCircle size={14} />
                          <span className="text-xs font-bold">Matériel retraité / réformé</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--text-muted)] italic flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--border)] inline-block" /> En stock
                          </span>
                          <button onClick={() => setAssignAsset(asset)}
                            className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-colors shadow-md shadow-emerald-500/20">
                            Assigner
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* ── MODAL CRÉER ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              className={`${modalBg} ${modalBorder} rounded-2xl p-7 max-w-lg w-full shadow-2xl relative overflow-visible`}>

              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold text-[var(--text)] flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500"><Plus size={18} /></div>
                  Nouveau Matériel
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-[var(--surface-2)] rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className={labelCls}>Nom du matériel</label>
                  <input value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                    className={inputCls} placeholder="Ex: MacBook Pro M3 Max" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Numéro Série</label>
                    <input value={newAsset.serialNumber} onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                      className={inputCls} placeholder="SN-12345" />
                  </div>
                  <div>
                    <label className={labelCls}>Date d'achat</label>
                    <input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                      className={inputCls} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* ✅ CategoryInput avec z-[200] pour passer au-dessus des boutons */}
                  <CategoryInput value={newAsset.category} onChange={v => setNewAsset({ ...newAsset, category: v })} />
                  <div>
                    <label className={labelCls}>Valeur (FCFA)</label>
                    <input type="number" value={newAsset.purchaseValue}
                      onChange={e => setNewAsset({ ...newAsset, purchaseValue: e.target.value })}
                      className={inputCls} placeholder="0" min={0} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-7">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-3.5 border border-[var(--border)] rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <button onClick={handleCreateAsset} disabled={isCreating || !newAsset.name || !newAsset.category}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20">
                  {isCreating && <Loader2 className="animate-spin" size={18} />} Créer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL ASSIGNER ── */}
      <AnimatePresence>
        {assignAsset && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-md p-4">
            <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
              className={`${modalBg} ${modalBorder} rounded-2xl p-7 max-w-lg w-full shadow-2xl`}>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-[var(--text)]">Attribuer Matériel</h3>
                  <p className="text-sm text-[var(--text-muted)]">{assignAsset.name}</p>
                </div>
                <button onClick={() => setAssignAsset(null)} className="p-2 hover:bg-[var(--surface-2)] rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="bg-[var(--surface-2)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-4">
                  <div className="w-11 h-11 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                    {getCategoryIcon(assignAsset.category)}
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-bold">Équipement</p>
                    <p className="font-bold text-[var(--text)]">{assignAsset.name}</p>
                    <p className="text-xs text-[var(--text-muted)] font-mono">{assignAsset.serialNumber || '—'}</p>
                  </div>
                </div>

                {employees.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm">
                    Aucun employé disponible.
                  </div>
                ) : (
                  <FancySelect
                    label="Bénéficiaire"
                    value={selectedEmployeeId}
                    onChange={v => setSelectedEmployeeId(v)}
                    icon={User}
                    options={employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }))}
                  />
                )}
              </div>

              <div className="flex gap-3 mt-7">
                <button onClick={() => setAssignAsset(null)}
                  className="flex-1 py-3.5 border border-[var(--border)] rounded-xl font-bold text-[var(--text-muted)] hover:bg-[var(--surface-2)] transition-colors">
                  Annuler
                </button>
                <button onClick={handleAssignSubmit} disabled={isAssigning || !selectedEmployeeId}
                  className="flex-1 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                  {isAssigning && <Loader2 className="animate-spin" size={18} />} Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}