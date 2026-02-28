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
  { status: 'AVAILABLE',   label: 'Marquer Disponible',   icon: CheckCheck, color: 'text-cyan-500 dark:text-cyan-400' },
  { status: 'MAINTENANCE', label: 'Mettre en Maintenance', icon: Wrench,     color: 'text-orange-500 dark:text-orange-400' },
  { status: 'RETIRED',     label: 'Réformer (Retraité)',  icon: Archive,    color: 'text-red-500 dark:text-red-400' },
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
      <label className="block text-xs font-bold text-slate-500 dark:text-slate-500 uppercase mb-2 ml-1">Catégorie</label>
      <div className="relative">
        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 z-10" />
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setShow(true); }}
          onFocus={() => setShow(true)}
          placeholder="Ex: Informatique, EPI…"
          className="w-full pl-9 pr-3 py-3.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 text-sm"
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
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-xl shadow-2xl z-[200] overflow-hidden"
          >
            {value && !CATEGORY_SUGGESTIONS.some(c => c.label.toLowerCase() === value.toLowerCase()) && (
              <button
                type="button"
                onClick={() => setShow(false)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left border-b border-slate-100 dark:border-white/5"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-purple-500 dark:text-purple-400">
                  <Plus size={14} />
                </div>
                <div>
                  <p className="text-sm text-slate-900 dark:text-white font-bold">"{value}"</p>
                  <p className="text-[10px] text-slate-500">Catégorie personnalisée</p>
                </div>
              </button>
            )}
            {filtered.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => { onChange(cat.value); setShow(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <cat.icon size={14} />
                </div>
                <span className="text-sm text-slate-800 dark:text-white">{cat.label}</span>
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
        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
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
            className="absolute right-0 top-8 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl z-[100] overflow-hidden py-1"
          >
            {/* Assigner / désassigner */}
            {asset.status === 'AVAILABLE' && (
              <button
                onClick={() => { setOpen(false); onAssign(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <UserCheck size={15} className="text-cyan-500 dark:text-cyan-400" />
                <span className="text-sm text-slate-800 dark:text-white">Assigner à un employé</span>
              </button>
            )}
            {asset.status === 'IN_USE' && asset.employee && (
              <button
                onClick={() => { setOpen(false); onUnassign(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <User size={15} className="text-red-500 dark:text-red-400" />
                <span className="text-sm text-red-600 dark:text-red-400">Retirer à {asset.employee.firstName}</span>
              </button>
            )}

            {/* Séparateur si actions statut */}
            {availableActions.length > 0 && (
              <div className="border-t border-slate-100 dark:border-white/5 my-1" />
            )}

            {/* Changer statut */}
            {availableActions.map(action => (
              <button
                key={action.status}
                onClick={() => { setOpen(false); onStatusChange(asset.id, action.status); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
              >
                <action.icon size={15} className={action.color} />
                <span className="text-sm text-slate-800 dark:text-white">{action.label}</span>
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
      case 'IN_USE':      return { bg: 'bg-emerald-100 dark:bg-emerald-500/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-300 dark:border-emerald-500/20', icon: User,          label: 'Assigné' };
      case 'AVAILABLE':   return { bg: 'bg-cyan-100 dark:bg-cyan-500/10',       text: 'text-cyan-700 dark:text-cyan-400',       border: 'border-cyan-300 dark:border-cyan-500/20',       icon: CheckCircle2,  label: 'Disponible' };
      case 'MAINTENANCE': return { bg: 'bg-orange-100 dark:bg-orange-500/10',   text: 'text-orange-700 dark:text-orange-400',   border: 'border-orange-300 dark:border-orange-500/20',   icon: RefreshCw,     label: 'Maintenance' };
      case 'RETIRED':     return { bg: 'bg-red-100 dark:bg-red-500/10',         text: 'text-red-700 dark:text-red-400',         border: 'border-red-300 dark:border-red-500/20',         icon: AlertCircle,   label: 'Retraité' };
      default:            return { bg: 'bg-slate-100 dark:bg-slate-800',        text: 'text-slate-600 dark:text-slate-400',     border: 'border-slate-200 dark:border-slate-700',       icon: AlertCircle,   label: status };
    }
  };

  const assetValue = (a: Asset) => a.purchasePrice ?? a.purchaseValue ?? 0;

  // ── Classes communes dark/light ────────────────────────────────────────────
  const inputCls = "w-full p-3.5 bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-xl text-slate-900 dark:text-white outline-none focus:border-cyan-500/70 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-700 text-sm";
  const labelCls = "block text-xs font-bold text-slate-500 uppercase mb-2 ml-1";
  const modalBg  = "bg-white dark:bg-[#0f172a]";
  const modalBorder = "border border-slate-200 dark:border-white/10";

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8 relative">

      {/* Ambiance background — visible surtout en dark */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-cyan-500/5 dark:bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-cyan-50 dark:bg-white/5 backdrop-blur-md rounded-2xl border border-cyan-200 dark:border-white/10 shadow-sm text-cyan-600 dark:text-cyan-400">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Parc <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-purple-500">Matériel</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Gestion centralisée des actifs et dotations.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black font-bold shadow-lg hover:shadow-cyan-500/30 transition-all flex items-center gap-2 group"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Nouvelle Dotation
        </button>
      </div>

      {/* ── MÉTRIQUES ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Actifs', val: assets.length,                                       col: 'text-slate-900 dark:text-white',       bg: 'bg-slate-100 dark:bg-slate-800/80',         icon: Tag,          border: 'border-slate-200 dark:border-slate-700/50' },
          { label: 'Assignés',     val: assets.filter(a => a.status === 'IN_USE').length,     col: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30',   icon: User,         border: 'border-emerald-200 dark:border-emerald-800/50' },
          { label: 'Disponibles',  val: assets.filter(a => a.status === 'AVAILABLE').length,  col: 'text-cyan-700 dark:text-cyan-400',       bg: 'bg-cyan-50 dark:bg-cyan-900/30',         icon: CheckCircle2, border: 'border-cyan-200 dark:border-cyan-800/50' },
          { label: 'Maintenance',  val: assets.filter(a => a.status === 'MAINTENANCE').length, col: 'text-orange-700 dark:text-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/30',     icon: RefreshCw,    border: 'border-orange-200 dark:border-orange-800/50' },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`p-5 rounded-2xl border ${m.bg} ${m.border} shadow-sm`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.label}</p>
                <p className={`text-3xl font-black mt-1 ${m.col}`}>{m.val}</p>
              </div>
              <m.icon className={`${m.col} opacity-70`} size={22} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── CONTENU PRINCIPAL ── */}
      <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-xl rounded-[28px] border border-slate-200 dark:border-white/10 overflow-hidden min-h-[500px] relative z-10 shadow-sm dark:shadow-2xl">

        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 dark:border-white/5 flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {FILTER_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap border transition-all
                  ${activeCategory === cat.id
                    ? 'bg-cyan-500 text-white border-cyan-500 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-transparent hover:bg-slate-200 dark:hover:bg-white/10'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors" size={16} />
            <input type="text" placeholder="Rechercher..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600" />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-cyan-500" size={40} />
            <p className="mt-3 text-cyan-600 dark:text-cyan-500 font-bold text-xs tracking-widest animate-pulse">CHARGEMENT</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
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
                    className="group relative bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05] border border-slate-200 dark:border-white/5 hover:border-cyan-400/40 dark:hover:border-cyan-500/30 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg overflow-visible"
                  >
                    {/* En-tête card */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-gradient-to-br dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-600 dark:text-slate-300 group-hover:scale-105 transition-transform">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 dark:text-white text-base line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{asset.name}</h3>
                          <p className="text-xs text-slate-400 mt-0.5 font-mono">{asset.serialNumber || 'S/N —'}</p>
                          <p className="text-[10px] text-cyan-600/70 dark:text-cyan-500/60 mt-0.5">{getCategoryLabel(asset.category)}</p>
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
                    <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-black/20 border border-slate-100 dark:border-white/5 mb-4">
                      <span className="text-xs text-slate-500 uppercase font-bold">Valeur</span>
                      <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 text-sm">
                        {assetValue(asset).toLocaleString() || '—'} <span className="text-[10px] text-slate-400">FCFA</span>
                      </span>
                    </div>

                    {/* Footer card */}
                    <div className="pt-3 border-t border-slate-100 dark:border-white/5">
                      {asset.status === 'IN_USE' && asset.employee ? (
                        <div className="flex items-center gap-2.5">
                          <img
                            src={asset.employee.photoUrl || `https://ui-avatars.com/api/?name=${asset.employee.firstName}+${asset.employee.lastName}&background=0ea5e9&color=fff`}
                            className="w-7 h-7 rounded-full border border-slate-200 dark:border-white/10" alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Détenteur</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{asset.employee.firstName} {asset.employee.lastName}</p>
                          </div>
                        </div>
                      ) : asset.status === 'MAINTENANCE' ? (
                        <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
                          <RefreshCw size={14} className="animate-spin" />
                          <span className="text-xs font-bold">En cours de maintenance</span>
                        </div>
                      ) : asset.status === 'RETIRED' ? (
                        <div className="flex items-center gap-2 text-slate-500">
                          <AlertCircle size={14} />
                          <span className="text-xs font-bold">Matériel retraité / réformé</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-400 italic flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 inline-block" /> En stock
                          </span>
                          <button onClick={() => setAssignAsset(asset)}
                            className="text-xs font-bold text-white bg-cyan-500 hover:bg-cyan-400 px-3 py-1.5 rounded-lg transition-all shadow-md shadow-cyan-500/20">
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
              className={`${modalBg} ${modalBorder} rounded-3xl p-7 max-w-lg w-full shadow-2xl relative overflow-visible`}>

              <div className="flex justify-between items-center mb-7">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"><Plus size={18} /></div>
                  Nouveau Matériel
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
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
                  className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleCreateAsset} disabled={isCreating || !newAsset.name || !newAsset.category}
                  className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black font-bold rounded-xl flex justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/20">
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
              className={`${modalBg} ${modalBorder} rounded-3xl p-7 max-w-lg w-full shadow-2xl`}>

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">Attribuer Matériel</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{assignAsset.name}</p>
                </div>
                <button onClick={() => setAssignAsset(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-white/5 flex items-center gap-4">
                  <div className="w-11 h-11 bg-cyan-50 dark:bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                    {getCategoryIcon(assignAsset.category)}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Équipement</p>
                    <p className="font-bold text-slate-900 dark:text-white">{assignAsset.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{assignAsset.serialNumber || '—'}</p>
                  </div>
                </div>

                {employees.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-400 text-sm">
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
                  className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Annuler
                </button>
                <button onClick={handleAssignSubmit} disabled={isAssigning || !selectedEmployeeId}
                  className="flex-1 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-white dark:text-black font-bold rounded-xl flex justify-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-cyan-500/20">
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


// 'use client';

// import React, { useState, useEffect, useRef } from 'react';
// import { 
//   Search, Plus, Monitor, Car, HardHat, Smartphone, 
//   CheckCircle2, AlertCircle, User, 
//   Laptop, X, Loader2,
//   Tag, Armchair, Zap, Shield, Cpu, RefreshCw
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';
// import { FancySelect } from '@/components/ui/FancySelect';

// // --- Types ---
// type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

// interface Asset {
//   id: string;
//   name: string;
//   serialNumber?: string;
//   category: string;           // ✅ string libre, pas enum
//   status: AssetStatus;
//   employee?: {
//     id: string;
//     firstName: string;
//     lastName: string;
//     photoUrl?: string;
//   };
//   condition?: string;
//   purchasePrice?: number;     // ✅ backend renvoie purchasePrice
//   purchaseValue?: number;     // compat ancienne version
//   purchaseDate?: string;
// }

// interface EmployeeOption {
//   id: string;
//   firstName: string;
//   lastName: string;
// }

// // ── Catégories prédéfinies (suggestions) ─────────────────────────────────────
// const CATEGORY_SUGGESTIONS = [
//   { value: 'COMPUTER', label: 'Informatique', icon: Laptop },
//   { value: 'VEHICLE', label: 'Véhicule', icon: Car },
//   { value: 'EPI', label: 'Sécurité (EPI)', icon: HardHat },
//   { value: 'PHONE', label: 'Mobile / Téléphone', icon: Smartphone },
//   { value: 'FURNITURE', label: 'Mobilier', icon: Armchair },
//   { value: 'OFFICE_EQUIPMENT', label: 'Équipement bureau', icon: Monitor },
// ];

// // Filtres sidebar (basés sur les catégories en DB)
// const FILTER_CATEGORIES = [
//   { id: 'All', label: 'Tout' },
//   { id: 'COMPUTER', label: 'Tech & IT' },
//   { id: 'VEHICLE', label: 'Flotte Auto' },
//   { id: 'EPI', label: 'Sécurité (EPI)' },
//   { id: 'PHONE', label: 'Mobiles' },
// ];

// // ── Composant saisie catégorie libre avec suggestions ─────────────────────────
// const CategoryInput = ({
//   value,
//   onChange,
// }: {
//   value: string;
//   onChange: (v: string) => void;
// }) => {
//   const [showSuggestions, setShowSuggestions] = useState(false);
//   const ref = useRef<HTMLDivElement>(null);

//   const filtered = CATEGORY_SUGGESTIONS.filter(c =>
//     value.length === 0 || c.label.toLowerCase().includes(value.toLowerCase()) || c.value.toLowerCase().includes(value.toLowerCase())
//   );

//   useEffect(() => {
//     const handleClick = (e: MouseEvent) => {
//       if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false);
//     };
//     document.addEventListener('mousedown', handleClick);
//     return () => document.removeEventListener('mousedown', handleClick);
//   }, []);

//   return (
//     <div ref={ref} className="relative">
//       <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Catégorie</label>
//       <div className="relative">
//         <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
//         <input
//           type="text"
//           value={value}
//           onChange={e => { onChange(e.target.value); setShowSuggestions(true); }}
//           onFocus={() => setShowSuggestions(true)}
//           placeholder="Ex: Informatique, EPI, Véhicule..."
//           className="w-full pl-9 pr-3 p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 text-sm"
//         />
//       </div>

//       <AnimatePresence>
//         {showSuggestions && filtered.length > 0 && (
//           <motion.div
//             initial={{ opacity: 0, y: -8 }}
//             animate={{ opacity: 1, y: 0 }}
//             exit={{ opacity: 0, y: -8 }}
//             className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
//           >
//             {/* Option personnalisée si la valeur ne correspond à aucune suggestion */}
//             {value && !CATEGORY_SUGGESTIONS.some(c => c.label.toLowerCase() === value.toLowerCase()) && (
//               <button
//                 type="button"
//                 onClick={() => { setShowSuggestions(false); }}
//                 className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5"
//               >
//                 <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
//                   <Plus size={14} />
//                 </div>
//                 <div>
//                   <p className="text-sm text-white font-bold">"{value}"</p>
//                   <p className="text-[10px] text-slate-500">Catégorie personnalisée</p>
//                 </div>
//               </button>
//             )}
//             {/* Suggestions prédéfinies */}
//             {filtered.map(cat => (
//               <button
//                 key={cat.value}
//                 type="button"
//                 onClick={() => { onChange(cat.value); setShowSuggestions(false); }}
//                 className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
//               >
//                 <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
//                   <cat.icon size={14} />
//                 </div>
//                 <span className="text-sm text-white">{cat.label}</span>
//               </button>
//             ))}
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// };

// export default function AssetsPage() {
//   const [activeCategory, setActiveCategory] = useState('All');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [assets, setAssets] = useState<Asset[]>([]);
//   const [employees, setEmployees] = useState<EmployeeOption[]>([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const [showCreateModal, setShowCreateModal] = useState(false);
//   const [assignAsset, setAssignAsset] = useState<Asset | null>(null);

//   const [newAsset, setNewAsset] = useState({
//     name: '',
//     serialNumber: '',
//     category: '',
//     condition: 'NEW',
//     purchaseValue: '',           // ✅ string pour éviter le bug NaN→0
//     purchaseDate: new Date().toISOString().split('T')[0]
//   });

//   const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
//   const [isCreating, setIsCreating] = useState(false);
//   const [isAssigning, setIsAssigning] = useState(false);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const [assetsData, employeesRaw] = await Promise.all([
//           api.get<any>('/assets'),
//           api.get<any>('/employees/simple'),  // ✅ retourne un tableau direct
//         ]);

//         // ✅ Normaliser assets (peut être tableau ou objet paginé)
//         const assetList: Asset[] = Array.isArray(assetsData)
//           ? assetsData
//           : Array.isArray(assetsData?.data) ? assetsData.data : [];
//         setAssets(assetList);

//         // ✅ Normaliser employees
//         const empList: EmployeeOption[] = Array.isArray(employeesRaw)
//           ? employeesRaw
//           : Array.isArray(employeesRaw?.data) ? employeesRaw.data : [];
//         setEmployees(empList);
//       } catch (e) {
//         console.error('Erreur chargement:', e);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleCreateAsset = async () => {
//     if (!newAsset.name || !newAsset.category) return;
//     setIsCreating(true);
//     try {
//       const payload = {
//         name:         newAsset.name,
//         serialNumber: newAsset.serialNumber || undefined,
//         category:     newAsset.category,       // ✅ string libre
//         condition:    newAsset.condition,
//         purchaseValue: newAsset.purchaseValue !== '' ? Number(newAsset.purchaseValue) : 0,
//         purchaseDate: new Date(newAsset.purchaseDate).toISOString(),
//       };

//       const created = await api.post<Asset>('/assets', payload);
//       setAssets(prev => [created, ...prev]);
//       setShowCreateModal(false);
//       setNewAsset({ name: '', serialNumber: '', category: '', condition: 'NEW', purchaseValue: '', purchaseDate: new Date().toISOString().split('T')[0] });
//     } catch (e: any) {
//       alert(e?.message || "Erreur lors de la création.");
//     } finally {
//       setIsCreating(false);
//     }
//   };

//   const handleAssignSubmit = async () => {
//     if (!assignAsset || !selectedEmployeeId) return;
//     setIsAssigning(true);
//     try {
//       const updatedAsset = await api.patch<Asset>(`/assets/${assignAsset.id}/assign`, {
//         employeeId: selectedEmployeeId
//       });
//       setAssets(prev => prev.map(a => a.id === assignAsset.id ? updatedAsset : a));
//       setAssignAsset(null);
//       setSelectedEmployeeId('');
//     } catch (e: any) {
//       alert(e?.message || "Erreur lors de l'assignation.");
//     } finally {
//       setIsAssigning(false);
//     }
//   };

//   const handleUnassign = async (asset: Asset) => {
//     if (!confirm(`Voulez-vous retirer ${asset.name} à ${asset.employee?.firstName} ?`)) return;
//     try {
//       const updatedAsset = await api.patch<Asset>(`/assets/${asset.id}/assign`, { employeeId: null });
//       setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
//     } catch (e) {
//       alert("Erreur technique.");
//     }
//   };

//   const filteredAssets = assets.filter(asset => {
//     const matchesCat = activeCategory === 'All' || asset.category === activeCategory;
//     const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//                           asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
//     return matchesCat && matchesSearch;
//   });

//   const getCategoryIcon = (cat: string) => {
//     const found = CATEGORY_SUGGESTIONS.find(c => c.value === cat);
//     if (found) return <found.icon size={24} />;
//     return <Monitor size={24} />;
//   };

//   const getCategoryLabel = (cat: string) => {
//     const found = CATEGORY_SUGGESTIONS.find(c => c.value === cat);
//     return found ? found.label : cat;
//   };

//   const getStatusStyle = (status: AssetStatus) => {
//     switch (status) {
//       case 'IN_USE':      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: User,         label: 'Assigné' };
//       case 'AVAILABLE':   return { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    icon: CheckCircle2,  label: 'Disponible' };
//       case 'MAINTENANCE': return { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20',  icon: RefreshCw,     label: 'Maintenance' };
//       case 'RETIRED':     return { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     icon: AlertCircle,   label: 'Retraité' };
//       default:            return { bg: 'bg-slate-800',      text: 'text-slate-400',   border: 'border-slate-700',      icon: AlertCircle,   label: status };
//     }
//   };

//   const assetValue = (a: Asset) => a.purchasePrice ?? a.purchaseValue ?? 0;

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 space-y-8 relative">

//       {/* Background Ambience */}
//       <div className="fixed inset-0 z-0 pointer-events-none">
//         <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" />
//         <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
//       </div>

//       {/* HEADER */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
//         <div className="flex items-center gap-4">
//           <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-400">
//             <Zap size={28} />
//           </div>
//           <div>
//             <h1 className="text-3xl font-black text-white tracking-tight">
//               Parc <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Matériel</span>
//             </h1>
//             <p className="text-slate-400">Gestion centralisée des actifs et dotations.</p>
//           </div>
//         </div>
//         <button
//           onClick={() => setShowCreateModal(true)}
//           className="group px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2"
//         >
//           <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Nouvelle Dotation
//         </button>
//       </div>

//       {/* METRICS */}
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
//         {[
//           { label: 'Total Actifs',  val: assets.length,                                     col: 'text-white',    bg: 'from-slate-800 to-slate-900',        icon: Tag },
//           { label: 'Assignés',      val: assets.filter(a => a.status === 'IN_USE').length,   col: 'text-emerald-400', bg: 'from-emerald-900/40 to-slate-900', icon: User },
//           { label: 'Disponibles',   val: assets.filter(a => a.status === 'AVAILABLE').length, col: 'text-cyan-400',  bg: 'from-cyan-900/40 to-slate-900',    icon: CheckCircle2 },
//           { label: 'Maintenance',   val: assets.filter(a => a.status === 'MAINTENANCE').length, col: 'text-orange-400', bg: 'from-orange-900/40 to-slate-900', icon: RefreshCw },
//         ].map((m, i) => (
//           <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
//             className={`p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${m.bg} backdrop-blur-md shadow-lg`}>
//             <div className="flex justify-between items-start">
//               <div>
//                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
//                 <p className={`text-3xl font-black mt-1 ${m.col}`}>{m.val}</p>
//               </div>
//               <m.icon className={`${m.col} opacity-80`} size={24} />
//             </div>
//           </motion.div>
//         ))}
//       </div>

//       {/* MAIN CONTENT */}
//       <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden min-h-[600px] relative z-10 shadow-2xl">

//         {/* Toolbar */}
//         <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
//           <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
//             {FILTER_CATEGORIES.map(cat => (
//               <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
//                 className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border
//                   ${activeCategory === cat.id
//                     ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
//                     : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'}`}>
//                 {cat.label}
//               </button>
//             ))}
//           </div>
//           <div className="relative w-full md:w-72 group">
//             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
//             <input type="text" placeholder="Rechercher équipement..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
//               className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600" />
//           </div>
//         </div>

//         {/* Asset Grid */}
//         {isLoading ? (
//           <div className="flex flex-col items-center justify-center py-32">
//             <Loader2 className="animate-spin text-cyan-500" size={48} />
//             <p className="mt-4 text-cyan-500 font-bold text-xs tracking-[0.2em] animate-pulse">CHARGEMENT DU PARC</p>
//           </div>
//         ) : (
//           <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
//             <AnimatePresence>
//               {filteredAssets.map((asset, i) => {
//                 const style = getStatusStyle(asset.status);
//                 return (
//                   <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
//                     className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
//                     <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

//                     <div className="flex justify-between items-start mb-6 relative z-10">
//                       <div className="flex items-center gap-4">
//                         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
//                           {getCategoryIcon(asset.category)}
//                         </div>
//                         <div>
//                           <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-cyan-400 transition-colors">{asset.name}</h3>
//                           <p className="text-xs text-slate-500 mt-0.5">
//                             <span className="font-mono tracking-wide">{asset.serialNumber || 'S/N NON DÉFINI'}</span>
//                             {' · '}
//                             <span className="text-cyan-600/70">{getCategoryLabel(asset.category)}</span>
//                           </p>
//                         </div>
//                       </div>
//                       <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm ${style.bg} ${style.text} ${style.border}`}>
//                         <style.icon size={12} /> {style.label}
//                       </div>
//                     </div>

//                     <div className="space-y-3 mb-6 relative z-10">
//                       <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/5">
//                         <span className="text-xs text-slate-500 uppercase font-bold">Valeur</span>
//                         <span className="font-mono font-bold text-cyan-400">
//                           {assetValue(asset).toLocaleString() || '—'} <span className="text-[10px] text-slate-500">FCFA</span>
//                         </span>
//                       </div>
//                     </div>

//                     <div className="pt-4 border-t border-white/5 relative z-10">
//                       {asset.status === 'IN_USE' && asset.employee ? (
//                         <div className="flex items-center gap-3">
//                           <img
//                             src={asset.employee.photoUrl || `https://ui-avatars.com/api/?name=${asset.employee.firstName}+${asset.employee.lastName}&background=random&color=fff`}
//                             className="w-8 h-8 rounded-full border border-white/10" alt=""
//                           />
//                           <div className="flex-1 min-w-0">
//                             <p className="text-[10px] text-slate-500 uppercase font-bold">Détenteur</p>
//                             <p className="text-sm font-bold text-white truncate">{asset.employee.firstName} {asset.employee.lastName}</p>
//                           </div>
//                           <button onClick={() => handleUnassign(asset)}
//                             className="text-xs text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
//                             Retirer
//                           </button>
//                         </div>
//                       ) : (
//                         <div className="flex items-center justify-between">
//                           <span className="text-xs text-slate-600 italic flex items-center gap-2">
//                             <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" /> En stock
//                           </span>
//                           {asset.status === 'AVAILABLE' && (
//                             <button onClick={() => setAssignAsset(asset)}
//                               className="text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
//                               Assigner
//                             </button>
//                           )}
//                         </div>
//                       )}
//                     </div>
//                   </motion.div>
//                 );
//               })}
//             </AnimatePresence>
//           </div>
//         )}

//         {!isLoading && filteredAssets.length === 0 && (
//           <div className="flex flex-col items-center justify-center py-32 text-slate-600">
//             <Search size={48} className="mb-4 opacity-20" />
//             <p>Aucun équipement trouvé.</p>
//           </div>
//         )}
//       </div>

//       {/* ── MODAL CRÉER ── */}
//       <AnimatePresence>
//         {showCreateModal && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
//             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
//               className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden">
//               <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none" />

//               <div className="flex justify-between items-center mb-8 relative z-10">
//                 <h3 className="text-2xl font-bold text-white flex items-center gap-3">
//                   <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Plus size={20} /></div>
//                   Nouveau Matériel
//                 </h3>
//                 <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
//               </div>

//               <div className="space-y-5 relative z-10">
//                 {/* Nom */}
//                 <div>
//                   <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nom du matériel</label>
//                   <input value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
//                     className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
//                     placeholder="Ex: MacBook Pro M3 Max" />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   {/* Numéro série */}
//                   <div>
//                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Numéro Série</label>
//                     <input value={newAsset.serialNumber} onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
//                       className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
//                       placeholder="SN-12345" />
//                   </div>
//                   {/* Date achat */}
//                   <div>
//                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Date d'achat</label>
//                     <input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
//                       className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-2 gap-4">
//                   {/* ✅ Catégorie libre avec suggestions */}
//                   <CategoryInput value={newAsset.category} onChange={v => setNewAsset({ ...newAsset, category: v })} />

//                   {/* ✅ Valeur en string pour éviter NaN→0 */}
//                   <div>
//                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Valeur (FCFA)</label>
//                     <input
//                       type="number"
//                       value={newAsset.purchaseValue}
//                       onChange={e => setNewAsset({ ...newAsset, purchaseValue: e.target.value })}
//                       onBlur={e => {
//                         // Si vide au blur, laisser vide (pas 0)
//                         if (e.target.value === '') setNewAsset(p => ({ ...p, purchaseValue: '' }));
//                       }}
//                       className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono font-bold placeholder:text-slate-700"
//                       placeholder="0"
//                       min={0}
//                     />
//                   </div>
//                 </div>
//               </div>

//               <div className="flex gap-3 mt-10 relative z-10">
//                 <button onClick={() => setShowCreateModal(false)}
//                   className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
//                   Annuler
//                 </button>
//                 <button onClick={handleCreateAsset} disabled={isCreating || !newAsset.name || !newAsset.category}
//                   className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
//                   {isCreating && <Loader2 className="animate-spin" size={20} />} Créer
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>

//       {/* ── MODAL ASSIGNER ── */}
//       <AnimatePresence>
//         {assignAsset && (
//           <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//             className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
//             <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
//               className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden">
//               <div className="flex justify-between items-center mb-6 relative z-10">
//                 <div>
//                   <h3 className="text-2xl font-bold text-white">Attribuer Matériel</h3>
//                   <p className="text-sm text-slate-400">{assignAsset.name}</p>
//                 </div>
//                 <button onClick={() => setAssignAsset(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
//               </div>

//               <div className="space-y-6 relative z-10">
//                 <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
//                   <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
//                     {getCategoryIcon(assignAsset.category)}
//                   </div>
//                   <div>
//                     <p className="text-xs text-slate-500 uppercase font-bold">Équipement</p>
//                     <p className="font-bold text-white">{assignAsset.name}</p>
//                     <p className="text-xs text-slate-400 font-mono">{assignAsset.serialNumber || '—'}</p>
//                   </div>
//                 </div>

//                 {employees.length === 0 ? (
//                   <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30 text-amber-400 text-sm">
//                     Aucun employé disponible. Vérifiez que des employés existent dans votre entreprise.
//                   </div>
//                 ) : (
//                   <FancySelect
//                     label="Bénéficiaire"
//                     value={selectedEmployeeId}
//                     onChange={v => setSelectedEmployeeId(v)}
//                     icon={User}
//                     options={employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }))}
//                   />
//                 )}
//               </div>

//               <div className="flex gap-3 mt-10 relative z-10">
//                 <button onClick={() => setAssignAsset(null)}
//                   className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
//                   Annuler
//                 </button>
//                 <button onClick={handleAssignSubmit} disabled={isAssigning || !selectedEmployeeId}
//                   className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-lg flex justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50">
//                   {isAssigning && <Loader2 className="animate-spin" size={20} />} Confirmer
//                 </button>
//               </div>
//             </motion.div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }