
'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Monitor, Car, HardHat, Smartphone, 
  MoreVertical, CheckCircle2, AlertCircle, Clock, User, 
  BatteryCharging, Key, Laptop, ArrowUpRight, X, Loader2,
  Tag, Calendar, Armchair, Zap, Shield, Cpu, RefreshCw, Link
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { FancySelect } from '@/components/ui/FancySelect';

// --- Types ---

type AssetStatus = 'AVAILABLE' | 'ASSIGNED' | 'MAINTENANCE' | 'BROKEN' | 'LOST';
type AssetCategory = 'IT' | 'VEHICLE' | 'EPI' | 'MOBILE' | 'FURNITURE';

interface Asset {
  id: string;
  name: string;
  serialNumber?: string;
  category: AssetCategory;
  status: AssetStatus;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    photoUrl?: string;
  };
  condition?: string;
  purchaseValue?: number;
  purchaseDate?: string;
}

interface EmployeeOption {
    id: string;
    firstName: string;
    lastName: string;
}

const CATEGORIES = [
  { id: 'All', label: 'Tout', icon: null },
  { id: 'IT', label: 'Tech & IT', icon: Cpu },
  { id: 'VEHICLE', label: 'Flotte Auto', icon: Car },
  { id: 'EPI', label: 'Sécurité (EPI)', icon: Shield },
  { id: 'MOBILE', label: 'Mobiles', icon: Smartphone },
];

export default function AssetsPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]); // Pour la liste déroulante
  const [isLoading, setIsLoading] = useState(true);
  
  // Modals State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignAsset, setAssignAsset] = useState<Asset | null>(null); // L'asset qu'on veut assigner
  
  // Forms State
  const [newAsset, setNewAsset] = useState({
    name: '',
    serialNumber: '',
    category: 'IT' as AssetCategory,
    status: 'AVAILABLE' as AssetStatus,
    condition: 'NEW',
    purchaseValue: 0,
    purchaseDate: new Date().toISOString().split('T')[0]
  });
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(''); // Pour l'assignation

  const [isCreating, setIsCreating] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
        try {
            // On charge les assets ET les employés pour pouvoir assigner
            const [assetsData, employeesData] = await Promise.all([
                api.get<Asset[]>('/assets'),
                api.get<EmployeeOption[]>('/employees')
            ]);
            setAssets(assetsData);
            setEmployees(employeesData);
        } catch (e) {
            console.error("Error fetching data", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchData();
  }, []);

  // Create Asset Handler
  const handleCreateAsset = async () => {
    if (!newAsset.name) return;
    setIsCreating(true);
    try {
        const payload = {
            ...newAsset,
            purchaseValue: Number(newAsset.purchaseValue),
            purchaseDate: new Date(newAsset.purchaseDate).toISOString()
        };

        const created = await api.post<Asset>('/assets', payload);
        setAssets([created, ...assets]);
        setShowCreateModal(false);
        setNewAsset({
            name: '', serialNumber: '', category: 'IT', status: 'AVAILABLE', condition: 'NEW', purchaseValue: 0, purchaseDate: new Date().toISOString().split('T')[0]
        });
    } catch (e) {
        alert("Erreur lors de la création.");
    } finally {
        setIsCreating(false);
    }
  };

  // Assign Asset Handler
  const handleAssignSubmit = async () => {
      if (!assignAsset || !selectedEmployeeId) return;
      setIsAssigning(true);
      try {
          // Appel à l'API Patch assign
          const updatedAsset = await api.patch<Asset>(`/assets/${assignAsset.id}/assign`, {
              employeeId: selectedEmployeeId
          });

          // Mise à jour de la liste locale
          setAssets(prev => prev.map(a => a.id === assignAsset.id ? updatedAsset : a));
          
          // Reset
          setAssignAsset(null);
          setSelectedEmployeeId('');
      } catch (e) {
          alert("Erreur lors de l'assignation.");
      } finally {
          setIsAssigning(false);
      }
  };

  // Unassign Handler (Libérer le matériel)
  const handleUnassign = async (asset: Asset) => {
      if(!confirm(`Voulez-vous retirer ${asset.name} à ${asset.employee?.firstName} ?`)) return;
      
      try {
          const updatedAsset = await api.patch<Asset>(`/assets/${asset.id}/assign`, {
              employeeId: null // Null désassigne
          });
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

  const getStatusStyle = (status: AssetStatus) => {
    switch (status) {
      case 'ASSIGNED': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', icon: User, label: 'Assigné' };
      case 'AVAILABLE': return { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20', icon: CheckCircle2, label: 'Disponible' };
      case 'MAINTENANCE': return { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', icon: RefreshCw, label: 'Maintenance' };
      case 'LOST': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: AlertCircle, label: 'Perdu' };
      case 'BROKEN': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', icon: X, label: 'Cassé' };
      default: return { bg: 'bg-slate-800', text: 'text-slate-400', border: 'border-slate-700', icon: AlertCircle, label: status };
    }
  };

  const getCategoryIcon = (cat: AssetCategory) => {
    switch (cat) {
        case 'IT': return <Laptop size={24} />;
        case 'VEHICLE': return <Car size={24} />;
        case 'EPI': return <HardHat size={24} />;
        case 'MOBILE': return <Smartphone size={24} />;
        default: return <Monitor size={24} />;
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8 relative">
      
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
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
           <Plus size={20} className="group-hover:rotate-90 transition-transform"/> Nouvelle Dotation
        </button>
      </div>

      {/* METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
         {[
            { label: 'Total Actifs', val: assets.length, icon: Tag, col: 'text-white', bg: 'from-slate-800 to-slate-900' },
            { label: 'Assignés', val: assets.filter(a => a.status === 'ASSIGNED').length, icon: User, col: 'text-emerald-400', bg: 'from-emerald-900/40 to-slate-900' },
            { label: 'Disponibles', val: assets.filter(a => a.status === 'AVAILABLE').length, icon: CheckCircle2, col: 'text-cyan-400', bg: 'from-cyan-900/40 to-slate-900' },
            { label: 'Maintenance', val: assets.filter(a => a.status === 'MAINTENANCE').length, icon: RefreshCw, col: 'text-orange-400', bg: 'from-orange-900/40 to-slate-900' }
         ].map((m, i) => (
             <motion.div 
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`p-5 rounded-2xl border border-white/5 bg-gradient-to-br ${m.bg} backdrop-blur-md shadow-lg`}
             >
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
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-2 md:pb-0">
               {CATEGORIES.map(cat => (
                  <button
                     key={cat.id}
                     onClick={() => setActiveCategory(cat.id)}
                     className={`
                        px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap border
                        ${activeCategory === cat.id 
                           ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                           : 'bg-white/5 text-slate-400 border-transparent hover:bg-white/10 hover:text-white'}
                     `}
                  >
                     {cat.icon && <cat.icon size={16} />}
                     {cat.label}
                  </button>
               ))}
            </div>

            <div className="relative w-full md:w-72 group">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-400 transition-colors" size={18} />
               <input 
                  type="text" 
                  placeholder="Rechercher équipement..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-black/20 border border-white/10 rounded-xl text-sm text-white focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/50 outline-none transition-all placeholder:text-slate-600"
               />
            </div>
         </div>

         {/* Asset Grid */}
         {isLoading ? (
            <div className="flex flex-col items-center justify-center py-32">
               <div className="relative">
                  <div className="absolute inset-0 bg-cyan-500 blur-xl opacity-20 animate-pulse"></div>
                  <Loader2 className="animate-spin text-cyan-500 relative z-10" size={48}/>
               </div>
               <p className="mt-4 text-cyan-500 font-bold text-xs tracking-[0.2em] animate-pulse">CHARGEMENT DU PARC</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6">
                <AnimatePresence>
                {filteredAssets.map((asset, i) => {
                    const style = getStatusStyle(asset.status);
                    return (
                    <motion.div
                        key={asset.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="group relative bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-cyan-500/30 rounded-3xl p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl overflow-hidden"
                    >
                        {/* Glow Effect on Hover */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center text-slate-300 shadow-inner group-hover:scale-110 transition-transform duration-300">
                                    {getCategoryIcon(asset.category)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white text-lg line-clamp-1 group-hover:text-cyan-400 transition-colors">{asset.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono tracking-wide mt-0.5">{asset.serialNumber || 'S/N NON DÉFINI'}</p>
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
                                    {asset.purchaseValue?.toLocaleString() || 0} <span className="text-[10px] text-slate-500">FCFA</span>
                                </span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/5 relative z-10">
                            {asset.status === 'ASSIGNED' && asset.employee ? (
                                <div className="flex items-center gap-3">
                                    <img 
                                        src={asset.employee.photoUrl || `https://ui-avatars.com/api/?name=${asset.employee.firstName}+${asset.employee.lastName}&background=random&color=fff`} 
                                        className="w-8 h-8 rounded-full border border-white/10" 
                                        alt=""
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-slate-500 uppercase font-bold">Détenteur</p>
                                        <p className="text-sm font-bold text-white truncate">
                                            {asset.employee.firstName} {asset.employee.lastName}
                                        </p>
                                    </div>
                                    <button 
                                        onClick={() => handleUnassign(asset)}
                                        className="text-xs text-red-400 hover:text-red-300 transition-colors bg-red-500/10 px-2 py-1 rounded border border-red-500/20"
                                    >
                                        Retirer
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-slate-600 italic flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div> En stock</span>
                                    {asset.status === 'AVAILABLE' && (
                                        <button 
                                            onClick={() => setAssignAsset(asset)}
                                            className="text-xs font-bold text-black bg-cyan-500 hover:bg-cyan-400 px-4 py-2 rounded-lg transition-all shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)]"
                                        >
                                            Assigner
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )})}
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

      {/* CREATE ASSET MODAL */}
      <AnimatePresence>
        {showCreateModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden"
                >
                    {/* Glows */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/20 rounded-full blur-[60px] pointer-events-none"></div>
                    
                    <div className="flex justify-between items-center mb-8 relative z-10">
                        <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400"><Plus size={20}/></div>
                            Nouveau Matériel
                        </h3>
                        <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                    </div>
                    
                    <div className="space-y-5 relative z-10">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nom du matériel</label>
                            <input value={newAsset.name} onChange={e => setNewAsset({...newAsset, name: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700" placeholder="Ex: MacBook Pro M3 Max" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Numéro Série</label>
                                <input value={newAsset.serialNumber} onChange={e => setNewAsset({...newAsset, serialNumber: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-700" placeholder="SN-12345" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Date d'achat</label>
                                <input type="date" value={newAsset.purchaseDate} onChange={e => setNewAsset({...newAsset, purchaseDate: e.target.value})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <FancySelect 
                                    label="Catégorie"
                                    value={newAsset.category}
                                    onChange={(v) => setNewAsset({...newAsset, category: v as AssetCategory})}
                                    icon={Tag}
                                    options={[
                                        { value: 'IT', label: 'IT', icon: Laptop },
                                        { value: 'VEHICLE', label: 'Véhicule', icon: Car },
                                        { value: 'EPI', label: 'EPI', icon: HardHat },
                                        { value: 'MOBILE', label: 'Mobile', icon: Smartphone },
                                        { value: 'FURNITURE', label: 'Mobilier', icon: Armchair }
                                    ]}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Valeur (FCFA)</label>
                                <input type="number" value={newAsset.purchaseValue} onChange={e => setNewAsset({...newAsset, purchaseValue: parseFloat(e.target.value)})} className="w-full p-4 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all font-mono font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10 relative z-10">
                        <button onClick={() => setShowCreateModal(false)} className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Annuler</button>
                        <button onClick={handleCreateAsset} disabled={isCreating || !newAsset.name} className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex justify-center gap-2 transition-all hover:scale-[1.02]">
                            {isCreating && <Loader2 className="animate-spin" size={20} />} Créer
                        </button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* ASSIGN ASSET MODAL - NEW FEATURE */}
      <AnimatePresence>
        {assignAsset && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xl p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-[#0f172a] rounded-[32px] p-8 max-w-lg w-full shadow-2xl border border-white/10 relative overflow-hidden"
                >
                    <div className="flex justify-between items-center mb-6 relative z-10">
                        <div>
                            <h3 className="text-2xl font-bold text-white">Attribuer Matériel</h3>
                            <p className="text-sm text-slate-400">{assignAsset.name}</p>
                        </div>
                        <button onClick={() => setAssignAsset(null)} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"><X size={20}/></button>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="bg-slate-800/50 p-4 rounded-xl border border-white/5 flex items-center gap-4">
                            <div className="w-12 h-12 bg-cyan-500/10 rounded-lg flex items-center justify-center text-cyan-400">
                                {getCategoryIcon(assignAsset.category)}
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 uppercase font-bold">Équipement</p>
                                <p className="font-bold text-white">{assignAsset.name}</p>
                                <p className="text-xs text-slate-400 font-mono">{assignAsset.serialNumber}</p>
                            </div>
                        </div>

                        <div>
                            <FancySelect 
                                label="Bénéficiaire"
                                value={selectedEmployeeId}
                                onChange={(v) => setSelectedEmployeeId(v)}
                                icon={User}
                                options={employees.map(emp => ({ value: emp.id, label: `${emp.firstName} ${emp.lastName}` }))}
                                placeholder="Choisir un employé..."
                            />
                        </div>
                    </div>

                    <div className="flex gap-3 mt-10 relative z-10">
                        <button onClick={() => setAssignAsset(null)} className="flex-1 py-4 border border-white/10 rounded-xl font-bold text-slate-400 hover:bg-white/5 hover:text-white transition-colors">Annuler</button>
                        <button onClick={handleAssignSubmit} disabled={isAssigning || !selectedEmployeeId} className="flex-1 py-4 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded-xl shadow-lg flex justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50">
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
