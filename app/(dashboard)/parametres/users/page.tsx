
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, UserPlus, Search, Filter, MoreVertical, 
  Shield, Key, Eye, Ban, Trash2, CheckCircle2, 
  Mail, Smartphone, Laptop, AlertTriangle, Lock,
  FileText, Check, X, RefreshCw, LogOut, Globe,
  ShieldAlert, Settings, ChevronDown, ChevronUp,
  Activity, Clock, Loader2, Save, Edit, Network, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useAlert } from '@/components/providers/AlertProvider';

import { FancySelect } from '@/components/ui/FancySelect';

// --- Types ---

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  avatar?: string;
  lastLoginAt: string;
}

interface Department {
  id: string;
  name: string;
}

const ROLE_CONFIG: Record<string, { label: string, color: string, bg: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
  ADMIN: { label: 'Admin', color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  HR_MANAGER: { label: 'Manager RH', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  MANAGER: { label: 'Manager', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  EMPLOYEE: { label: 'Employé', color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' },
};

export default function UserManagementPage() {
  const router = useRouter();
  const alert = useAlert()
  
  // -- State --
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  
  // Invite Modal State
  const [inviteModal, setInviteModal] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'EMPLOYEE',
    password: '', // Mot de passe provisoire
    departmentId: '' // Optionnel, pour les managers
  });

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    role: '',
    isActive: true
  });

  // -- Fetch --
  const fetchUsers = async () => {
    try {
        const [usersData, deptsData] = await Promise.all([
            api.get<User[]>('/users'),
            api.get<Department[]>('/departments')
        ]);
        setUsers(usersData);
        setDepartments(deptsData);
    } catch (e) {
        console.error("Failed to fetch data", e);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // -- Invite Actions --
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
        // Nettoyage : si pas Manager, pas de departmentId
        const payload = { ...inviteForm };
        if (payload.role !== 'MANAGER') delete (payload as any).departmentId;

        await api.post('/users/invite', payload);
        setInviteModal(false);
        setInviteForm({ email: '', firstName: '', lastName: '', role: 'EMPLOYEE', password: '', departmentId: '' });
        alert.success('Utilisateur invité ', 'Utilisateur invité avec succès !');
        fetchUsers(); // Refresh list
   } catch (err: any) {
  alert.error(
    'Erreur d\'invitation',
    err.message || "Impossible d'envoyer l'invitation."
  );
}finally {
        setIsInviting(false);
    }
  };

  // -- Edit Actions --
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setEditForm({
        role: user.role,
        isActive: user.isActive
    });
    setEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingUser) return;
    setIsSaving(true);
    try {
        await api.patch(`/users/${editingUser.id}`, editForm);
        setEditModal(false);
        setEditingUser(null);
        alert.success('utilisateur', 'Utilisateur mis à jour !');
        fetchUsers();
    } catch (err: any) {
  alert.error(
    'Erreur de mise à jour',
    err.message || 'Impossible de mettre à jour l\'utilisateur.'
  );
}finally {
        setIsSaving(false);
    }
  };

  // -- Derived Data --
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'All' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={48} /></div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors">
             <ArrowLeft size={20} className="text-gray-500" />
           </button>
           <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Gestion des Utilisateurs</h1>
              <p className="text-gray-500 dark:text-gray-400">Contrôle d'accès, rôles et sécurité.</p>
           </div>
        </div>

        <button 
           onClick={() => setInviteModal(true)}
           className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all flex items-center gap-2"
        >
           <UserPlus size={20} /> Inviter Utilisateur
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold">Total Utilisateurs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold">Administrateurs</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{users.filter(u => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length}</p>
         </div>
         <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-xs text-gray-500 uppercase font-bold">Actifs</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
               {users.filter(u => u.isActive).length}
            </p>
         </div>
      </div>

      {/* FILTERS & LIST */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
         
         {/* Toolbar */}
         <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                     type="text" 
                     placeholder="Rechercher..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 outline-none"
                  />
               </div>
               <select 
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium"
               >
                  <option value="All">Tous les rôles</option>
                  {Object.keys(ROLE_CONFIG).map(r => <option key={r} value={r}>{ROLE_CONFIG[r].label}</option>)}
               </select>
            </div>
         </div>

         {/* User Grid */}
         <div className="p-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredUsers.map(user => {
               const config = ROLE_CONFIG[user.role] || ROLE_CONFIG.EMPLOYEE;
               return (
               <div key={user.id} className="group bg-white dark:bg-gray-800 rounded-2xl p-5 border border-gray-100 dark:border-gray-700 hover:shadow-xl hover:border-sky-200 dark:hover:border-sky-800 transition-all relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4 relative z-10">
                     <div className="flex items-center gap-4">
                        <div className="relative">
                           <img src={user.avatar || `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`} className={`w-14 h-14 rounded-full object-cover border-2 ${!user.isActive ? 'border-red-200 grayscale' : 'border-white dark:border-gray-600'}`} />
                           <span className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-gray-800 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-gray-300'}`}></span>
                        </div>
                        <div>
                           <h3 className={`font-bold text-lg ${!user.isActive ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{user.firstName} {user.lastName}</h3>
                           <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px]">{user.email}</p>
                        </div>
                     </div>
                     
                     <button 
                        onClick={() => openEditModal(user)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-sky-500 transition-colors"
                        title="Modifier le rôle/statut"
                     >
                        <Edit size={18} />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center justify-between">
                        <span className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${config.bg} ${config.color}`}>
                            {config.label}
                        </span>
                        {!user.isActive && <span className="text-xs font-bold text-red-500 flex items-center gap-1"><Ban size={12}/> Désactivé</span>}
                     </div>
                     
                     <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 dark:bg-gray-750/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                        <Clock size={14} /> Dernier accès: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Jamais'}
                     </div>
                  </div>
               </div>
            )})}
         </div>
      </div>

      {/* EDIT USER MODAL */}
      <AnimatePresence>
        {editModal && editingUser && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Modifier Utilisateur</h2>
                        <button onClick={() => setEditModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} /></button>
                    </div>

                    <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-gray-500">
                            {editingUser.firstName[0]}{editingUser.lastName[0]}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{editingUser.firstName} {editingUser.lastName}</h3>
                            <p className="text-xs text-gray-500">{editingUser.email}</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Rôle système</label>
                            <div className="grid grid-cols-1 gap-2">
                                {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                                    <label 
                                        key={key} 
                                        className={`
                                            flex items-center p-3 rounded-xl border cursor-pointer transition-all
                                            ${editForm.role === key 
                                                ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/20 ring-1 ring-sky-500' 
                                                : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'}
                                        `}
                                    >
                                        <input 
                                            type="radio" 
                                            name="role" 
                                            value={key} 
                                            checked={editForm.role === key} 
                                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                            className="hidden"
                                        />
                                        <div className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${editForm.role === key ? 'border-sky-500' : 'border-gray-400'}`}>
                                            {editForm.role === key && <div className="w-2 h-2 rounded-full bg-sky-500"></div>}
                                        </div>
                                        <span className={`text-sm font-bold ${editForm.role === key ? 'text-sky-700 dark:text-sky-400' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {config.label}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">Statut du compte</label>
                            <div className="flex items-center gap-4">
                                <button 
                                    type="button"
                                    onClick={() => setEditForm({...editForm, isActive: true})}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${editForm.isActive ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}
                                >
                                    Actif
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setEditForm({...editForm, isActive: false})}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${!editForm.isActive ? 'bg-red-500 text-white border-red-500' : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}
                                >
                                    Désactivé
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button onClick={() => setEditModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                            <button onClick={handleUpdate} disabled={isSaving} className="flex-1 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                                {isSaving ? <Loader2 className="animate-spin" size={20}/> : <><Save size={18}/> Enregistrer</>}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>

      {/* INVITE MODAL */}
      <AnimatePresence>
        {inviteModal && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            >
                <motion.div 
                    initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                    className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-gray-700"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Inviter un collaborateur</h2>
                        <button onClick={() => setInviteModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X size={20} /></button>
                    </div>

                    <form onSubmit={handleInvite} className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-bold mb-1">Prénom</label>
                                <input required value={inviteForm.firstName} onChange={e => setInviteForm({...inviteForm, firstName: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-1">Nom</label>
                                <input required value={inviteForm.lastName} onChange={e => setInviteForm({...inviteForm, lastName: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1">Email professionnel</label>
                            <input type="email" required value={inviteForm.email} onChange={e => setInviteForm({...inviteForm, email: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20" />
                        </div>

                        <div>
                            <FancySelect
                                label="Rôle"
                                value={inviteForm.role}
                                onChange={(v) => setInviteForm({...inviteForm, role: v})}
                                icon={User}
                                options={[
                                    { value: 'EMPLOYEE', label: 'Employé (Standard)' },
                                    { value: 'MANAGER', label: 'Manager (Accès équipe)' },
                                    { value: 'HR_MANAGER', label: 'RH (Gestion paie/congés)' },
                                    { value: 'ADMIN', label: 'Administrateur' }
                                ]}
                            />
                        </div>

                        {/* CHAMPS DÉPARTEMENT POUR MANAGER UNIQUEMENT */}
                        {inviteForm.role === 'MANAGER' && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                                <FancySelect 
                                    label="Assigner un Département"
                                    value={inviteForm.departmentId} 
                                    onChange={(v) => setInviteForm({...inviteForm, departmentId: v})} 
                                    icon={Network}
                                    options={departments.map(d => ({ value: d.id, label: d.name }))}
                                    placeholder="Choisir département..."
                                />
                                <p className="text-xs text-gray-500 mt-1">Le manager n'aura accès qu'aux employés de ce département.</p>
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-sm font-bold mb-1">Mot de passe provisoire</label>
                            <input type="text" required minLength={6} value={inviteForm.password} onChange={e => setInviteForm({...inviteForm, password: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono" placeholder="Ex: Welcome2025!" />
                            <p className="text-xs text-gray-500 mt-1">Communiquez ce mot de passe à l'utilisateur.</p>
                        </div>

                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={() => setInviteModal(false)} className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700">Annuler</button>
                            <button type="submit" disabled={isInviting} className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg flex justify-center items-center gap-2">
                                {isInviting ? <Loader2 className="animate-spin" size={20}/> : <><Mail size={18}/> Envoyer l'invitation</>}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
