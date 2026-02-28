'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Plus, Monitor, Car, HardHat, Smartphone, 
  CheckCircle2, AlertCircle, User, 
  Laptop, X, Loader2,
  Tag, Armchair, Zap, Shield, Cpu, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

// --- Types ---
type AssetStatus = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'RETIRED';

interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  category: string;           // ✅ string libre, pas enum
  status: AssetStatus;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
  condition?: string;
  purchasePrice?: number;     // ✅ backend renvoie purchasePrice
  purchaseValue?: number;     // compat ancienne version
  purchaseDate?: string;
}

interface EmployeeOption {
  id: string;
  firstName: string;
  lastName: string;
}

// ── Catégories prédéfinies (suggestions) ─────────────────────────────────────
const CATEGORY_SUGGESTIONS = [
  { value: 'COMPUTER', label: 'Informatique', icon: Laptop },
  { value: 'VEHICLE', label: 'Véhicule', icon: Car },
  { value: 'EPI', label: 'Sécurité (EPI)', icon: HardHat },
  { value: 'PHONE', label: 'Mobile / Téléphone', icon: Smartphone },
  { value: 'FURNITURE', label: 'Mobilier', icon: Armchair },
  { value: 'OFFICE_EQUIPMENT', label: 'Équipement bureau', icon: Monitor },
];

// Filtres sidebar (basés sur les catégories en DB)
const FILTER_CATEGORIES = [
  { id: 'All', label: 'Tout' },
  { id: 'COMPUTER', label: 'Tech & IT' },
  { id: 'VEHICLE', label: 'Flotte Auto' },
  { id: 'EPI', label: 'Sécurité (EPI)' },
  { id: 'PHONE', label: 'Mobiles' },
];

// ── Composant saisie catégorie libre avec suggestions ─────────────────────────
const CategoryInput = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const filtered = CATEGORY_SUGGESTIONS.filter(c =>
    value.length === 0 || c.label.toLowerCase().includes(value.toLowerCase()) || c.value.toLowerCase().includes(value.toLowerCase())
  );

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Catégorie</label>
      <div className="relative">
        <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 z-10" />
        <input
          type="text"
          value={value}
          onChange={e => { onChange(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder="Ex: Informatique, EPI, Véhicule..."
          className="w-full pl-9 pr-3 p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700 text-sm"
        />
      </div>

      <AnimatePresence>
        {showSuggestions && filtered.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            {/* Option personnalisée si la valeur ne correspond à aucune suggestion */}
            {value && !CATEGORY_SUGGESTIONS.some(c => c.label.toLowerCase() === value.toLowerCase()) && (
              <button
                type="button"
                onClick={() => { setShowSuggestions(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left border-b border-white/5"
              >
                <div className="w-7 h-7 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400">
                  <Plus size={14} />
                </div>
                <div>
                  <p className="text-sm text-white font-bold">"{value}"</p>
                  <p className="text-[10px] text-slate-500">Catégorie personnalisée</p>
                </div>
              </button>
            )}
            {/* Suggestions prédéfinies */}
            {filtered.map(cat => (
              <button
                key={cat.value}
                type="button"
                onClick={() => { onChange(cat.value); setShowSuggestions(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                  <cat.icon size={14} />
                </div>
                <span className="text-sm text-white">{cat.label}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function AssetsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null);

  const [newAsset, setNewAsset] = useState({
    name: '',
    serialNumber: '',
    category: '',
    condition: 'NEW',
    purchaseValue: '',           // ✅ string pour éviter le bug NaN→0
    purchaseDate: new Date().toISOString().split('T')[0]
  });

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsData, employeesRaw] = await Promise.all([
          api.get<any>('/assets'),
          api.get<any>('/employees/simple'),  // ✅ retourne un tableau direct
        ]);

        // ✅ Normaliser assets (peut être tableau ou objet paginé)
        const assetList: Asset[] = Array.isArray(assetsData)
          ? assetsData
          : Array.isArray(assetsData?.data) ? assetsData.data : [];
        setAssets(assetList);

        // ✅ Normaliser employees
        const empList: EmployeeOption[] = Array.isArray(employeesRaw)
          ? employeesRaw
          : Array.isArray(employeesRaw?.data) ? employeesRaw.data : [];
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
        name:         newAsset.name,
        serialNumber: newAsset.serialNumber || undefined,
        category:     newAsset.category,       // ✅ string libre
        condition:    newAsset.condition,
        purchaseValue: newAsset.purchaseValue !== '' ? Number(newAsset.purchaseValue) : 0,
        purchaseDate: new Date(newAsset.purchaseDate).toISOString(),
      };

      const created = await api.post<Asset>('/assets', payload);
      setAssets(prev => [created, ...prev]);
      setShowCreateModal(false);
      setNewAsset({ name: '', serialNumber: '', category: '', condition: 'NEW', purchaseValue: '', purchaseDate: new Date().toISOString().split('T')[0] });
    } catch (e: any) {
      alert(e?.message || "Erreur lors de la création.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!assignAsset || !selectedEmployeeId) return;
    setIsAssigning(true);
    try {
      const updatedAsset = await api.patch<Asset>(`/assets/${assignAsset.id}/assign`, {
        employeeId: selectedEmployeeId
      });
      setAssets(prev => prev.map(a => a.id === assignAsset.id ? updatedAsset : a));
      setAssignAsset(null);
      setSelectedEmployeeId('');
    } catch (e: any) {
      alert(e?.message || "Erreur lors de l'assignation.");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async (asset: Asset) => {
    if (!confirm(`Voulez-vous retirer ${asset.name} à ${asset.employee?.firstName} ?`)) return;
    try {
      const updatedAsset = await api.patch<Asset>(`/assets/${asset.id}/assign`, { employeeId: null });
      setAssets(prev => prev.map(a => a.id === asset.id ? updatedAsset : a));
    } catch (e) {
      alert("Erreur technique.");
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesCat = activeCategory === 'All' || asset.category === activeCategory;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          asset.serialNumber?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const getCategoryIcon = (cat: string) => {
    const found = CATEGORY_SUGGESTIONS.find(c => c.value === cat);
    if (found) return <found.icon size={24} />;
    return <Monitor size={24} />;
  };

  const getCategoryLabel = (cat: string) => {
    const found = CATEGORY_SUGGESTIONS.find(c => c.value === cat);
    return found ? found.label : cat;
  };

  const getStatusStyle = (status: AssetStatus) => {
    switch (status) {
      case 'IN_USE':      return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: User,         label: 'Assigné' };
      case 'AVAILABLE':   return { bg: 'bg-cyan-500/10',    text: 'text-cyan-400',    border: 'border-cyan-500/20',    icon: CheckCircle2,  label: 'Disponible' };
      case 'MAINTENANCE': return { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/20',  icon: RefreshCw,     label: 'Maintenance' };
      case 'RETIRED':     return { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     icon: AlertCircle,   label: 'Retraité' };
      default:            return { bg: 'bg-slate-800',      text: 'text-slate-400',   border: 'border-slate-700',      icon: AlertCircle,   label: status };
    }
  };

  const assetValue = (a: Asset) => a.purchasePrice ?? a.purchaseValue ?? 0;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8 relative">

      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse" />
        <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]" />
      </div>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-[0_0_15px_rgba(6,182,212,0.15)] text-cyan-400">
            <Zap size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Parc <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">Matériel</span>
            </h1>
            <p className="text-slate-400">Gestion centralisée des actifs et dotations.</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="group px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2"
        >
          <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Nouvelle Dotation
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {[
          { label: 'Total Actifs',  val: assets.length,                                     col: 'text-white',    bg: 'from-slate-800 to-slate-900',        icon: Tag },
          { label: 'Assignés',      val: assets.filter(a => a.status === 'IN_USE').length,   col: 'text-emerald-400', bg: 'from-emerald-900/40 to-slate-900', icon: User },
          { label: 'Disponibles',   val: assets.filter(a => a.status === 'AVAILABLE').length, col: 'text-cyan-400',  bg: 'from-cyan-900/40 to-slate-900',    icon: CheckCircle2 },
          { label: 'Maintenance',   val: assets.filter(a => a.status === 'MAINTENANCE').length, col: 'text-orange-400', bg: 'from-orange-900/40 to-slate-900', icon: RefreshCw },
        ].map((m, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${m.bg} backdrop-blur-md shadow-lg`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.label}</p>
                <p className={`text-3xl font-black mt-1 ${m.col}`}>{m.val}</p>
              </div>
              <m.icon className={`${m.col} opacity-80`} size={24} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="bg-slate-900/40 backdrop-blur-xl rounded-[32px] border border-white/10 overflow-hidden min-h-[600px] relative z-10 shadow-2xl">

        {/* Toolbar */}
        <div className="p-6 border-b border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {FILTER_CATEGORIES.map(cat => (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border
                  ${activeCategory === cat.id
                    ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                    : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'}`}>
                {cat.label}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-72 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
            <input type="text" placeholder="Rechercher équipement..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600" />
          </div>
        </div>

        {/* Asset Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32">
            <Loader2 className="animate-spin text-cyan-500" size={48} />
            <p className="mt-4 text-cyan-500 font-bold text-xs tracking-[0.2em] animate-pulse">CHARGEMENT DU PARC</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
            <AnimatePresence>
              {filteredAssets.map((asset, i) => {
                const style = getStatusStyle(asset.status);
                return (
                  <motion.div key={asset.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden">
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
                          {getCategoryIcon(asset.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-cyan-400 transition-colors">{asset.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            <span className="font-mono tracking-wide">{asset.serialNumber || 'S/N NON DÉFINI'}</span>
                            {' · '}
                            <span className="text-cyan-600/70">{getCategoryLabel(asset.category)}</span>
                          </p>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                        <style.icon size={12} /> {style.label}
                      </div>
                    </div>

                    <div className="space-y-3 mb-6 relative z-10">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-black/20 border border-white/5">
                        <span className="text-xs text-slate-500 uppercase font-bold">Valeur</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {assetValue(asset).toLocaleString() || '—'} <span className="text-[10px] text-slate-500">FCFA</span>
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 relative z-10">
                      {asset.status === 'IN_USE' && asset.employee ? (
                        <div className="flex items-center gap-3">
                          <img
                            src={asset.employee.photoUrl || `https://ui-avatars.com/api/?name=${asset.employee.firstName}+${asset.employee.lastName}&background=random&color=fff`}
                            className="w-8 h-8 rounded-full border border-white/10" alt=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Détenteur</p>
                            <p className="text-sm font-bold text-white truncate">{asset.employee.firstName} {asset.employee.lastName}</p>
                          </div>
                          <button onClick={() => handleUnassign(asset)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                            Retirer
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-600 italic flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-600 inline-block" /> En stock
                          </span>
                          {asset.status === 'AVAILABLE' && (
                            <button onClick={() => setAssignAsset(asset)}
                              className="text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                              Assigner
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {!isLoading && filteredAssets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-slate-600">
            <Search size={48} className="mb-4 opacity-20" />
            <p>Aucun équipement trouvé.</p>
          </div>
        )}
      </div>

      {/* ── MODAL CRÉER ── */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none" />

              <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Plus size={20} /></div>
                  Nouveau Matériel
                </h3>
                <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-5 relative z-10">
                {/* Nom */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nom du matériel</label>
                  <input value={newAsset.name} onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                    className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                    placeholder="Ex: MacBook Pro M3 Max" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Numéro série */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Numéro Série</label>
                    <input value={newAsset.serialNumber} onChange={e => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700"
                      placeholder="SN-12345" />
                  </div>
                  {/* Date achat */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Date d'achat</label>
                    <input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({ ...newAsset, purchaseDate: e.target.value })}
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* ✅ Catégorie libre avec suggestions */}
                  <CategoryInput value={newAsset.category} onChange={v => setNewAsset({ ...newAsset, category: v })} />

                  {/* ✅ Valeur en string pour éviter NaN→0 */}
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Valeur (FCFA)</label>
                    <input
                      type="number"
                      value={newAsset.purchaseValue}
                      onChange={e => setNewAsset({ ...newAsset, purchaseValue: e.target.value })}
                      onBlur={e => {
                        // Si vide au blur, laisser vide (pas 0)
                        if (e.target.value === '') setNewAsset(p => ({ ...p, purchaseValue: '' }));
                      }}
                      className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono font-bold placeholder:text-slate-700"
                      placeholder="0"
                      min={0}
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-10 relative z-10">
                <button onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  Annuler
                </button>
                <button onClick={handleCreateAsset} disabled={isCreating || !newAsset.name || !newAsset.category}
                  className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed">
                  {isCreating && <Loader2 className="animate-spin" size={20} />} Créer
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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white">Attribuer Matériel</h3>
                  <p className="text-sm text-slate-400">{assignAsset.name}</p>
                </div>
                <button onClick={() => setAssignAsset(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20} /></button>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                  <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
                    {getCategoryIcon(assignAsset.category)}
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">Équipement</p>
                    <p className="font-bold text-white">{assignAsset.name}</p>
                    <p className="text-xs text-slate-400 font-mono">{assignAsset.serialNumber || '—'}</p>
                  </div>
                </div>

                {employees.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-900/20 border border-amber-500/30 text-amber-400 text-sm">
                    Aucun employé disponible. Vérifiez que des employés existent dans votre entreprise.
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

              <div className="flex gap-3 mt-10 relative z-10">
                <button onClick={() => setAssignAsset(null)}
                  className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  Annuler
                </button>
                <button onClick={handleAssignSubmit} disabled={isAssigning || !selectedEmployeeId}
                  className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-lg flex justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50">
                  {isAssigning && <Loader2 className="animate-spin" size={20} />} Confirmer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}