
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit, FileText, Trash2, Clock, Wallet, Calendar, 
  CheckCircle, Mail, Phone, MapPin, Building2, User, Download, 
  UploadCloud, File, AlertCircle, ChevronDown, Printer, Eye, EyeOff,
  MoreVertical, Briefcase, GraduationCap, BadgeCheck, X,
  Laptop, Car, Monitor, Plus, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';

type TabType = 'info' | 'docs' | 'paie' | 'conges' | 'materiel';

interface EmployeeDetail {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  employeeNumber: string;
  hireDate: string;
  contractType: string;
  position: string;
  baseSalary: number;
  department: { name: string };
  nationalIdNumber: string;
  cnssNumber: string;
  photoUrl: string;
}

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showSalary, setShowSalary] = useState(false);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Tab Data
  const [tabData, setTabData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
        try {
            const data = await api.get<EmployeeDetail>(`/employees/${params.id}`);
            setEmployee(data);
        } catch (e) {
            console.error("Error fetching employee", e);
        } finally {
            setIsLoading(false);
        }
    };
    fetchEmployee();
  }, [params.id]);

  // Fetch Data on Tab Change
  useEffect(() => {
    if (!employee || activeTab === 'info') return;
    const fetchTabData = async () => {
        setTabLoading(true);
        try {
            let data;
            if (activeTab === 'docs') data = await api.get(`/documents/employee/${employee.id}`);
            if (activeTab === 'paie') data = await api.get(`/payrolls?employeeId=${employee.id}`);
            if (activeTab === 'conges') data = await api.get(`/leaves?employeeId=${employee.id}`);
            if (activeTab === 'materiel') data = await api.get(`/assets/employee/${employee.id}`);
            setTabData(data);
        } catch (e) {
            console.error(e);
        } finally {
            setTabLoading(false);
        }
    };
    fetchTabData();
  }, [activeTab, employee]);

  if (isLoading || !employee) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-sky-500" size={32}/></div>;

  const renderTabContent = () => {
    if (activeTab === 'info') {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <User size={20} className="text-sky-500" /> Informations Personnelles
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                    <div><p className="text-xs text-gray-500 mb-1">Nom complet</p><p className="font-medium">{employee.firstName} {employee.lastName}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Date Naissance</p><p className="font-medium">{new Date(employee.dateOfBirth).toLocaleDateString()}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Lieu</p><p className="font-medium">{employee.placeOfBirth}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Genre</p><p className="font-medium">{employee.gender}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Téléphone</p><p className="font-medium">{employee.phone}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Email</p><p className="font-medium">{employee.email}</p></div>
                    <div className="col-span-2"><p className="text-xs text-gray-500 mb-1">Adresse</p><p className="font-medium">{employee.address}</p></div>
                    </div>
                </section>
                </div>
                <div className="space-y-8">
                <section>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Briefcase size={20} className="text-purple-500" /> Emploi
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4">
                    <div><p className="text-xs text-gray-500 mb-1">Date d'embauche</p><p className="font-medium">{new Date(employee.hireDate).toLocaleDateString()}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Contrat</p><p className="font-medium">{employee.contractType}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Poste</p><p className="font-medium">{employee.position}</p></div>
                    <div><p className="text-xs text-gray-500 mb-1">Département</p><p className="font-medium">{employee.department?.name}</p></div>
                    
                    <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-gray-400 uppercase font-bold mb-1">Salaire de base</p>
                        <div className="flex items-center justify-between">
                        <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                            {showSalary ? `${employee.baseSalary.toLocaleString('fr-FR')} FCFA` : '• • • • • • •'}
                        </p>
                        <button onClick={() => setShowSalary(!showSalary)} className="text-gray-400 hover:text-sky-500 transition-colors">
                            {showSalary ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                        </div>
                    </div>
                    </div>
                </section>
                </div>
            </div>
        );
    }

    if (tabLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-sky-500" /></div>;
    if (!tabData || tabData.length === 0) return <div className="py-20 text-center text-gray-400">Aucune donnée trouvée.</div>;

    if (activeTab === 'docs') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabData.map((doc: any) => (
                    <div key={doc.id} className="p-4 border rounded-xl flex items-center gap-3 bg-white dark:bg-gray-800 hover:shadow-md transition-all">
                        <div className="p-3 bg-sky-50 text-sky-600 rounded-lg"><FileText size={20}/></div>
                        <div className="flex-1 overflow-hidden">
                            <p className="font-bold truncate">{doc.name}</p>
                            <p className="text-xs text-gray-500">{doc.type}</p>
                        </div>
                        <button className="text-gray-400 hover:text-sky-500"><Download size={18}/></button>
                    </div>
                ))}
            </div>
        );
    }

    if (activeTab === 'paie') {
        return (
            <div className="space-y-3">
                {tabData.map((p: any) => (
                    <div key={p.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xs">
                                {p.month}/{p.year.toString().substr(2)}
                            </div>
                            <div>
                                <p className="font-bold">Bulletin de Paie</p>
                                <p className="text-xs text-gray-500">Net: {p.netSalary.toLocaleString()} FCFA</p>
                            </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full font-bold ${p.status === 'PAID' ? 'bg-sky-100 text-sky-700' : 'bg-orange-100 text-orange-700'}`}>{p.status}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (activeTab === 'conges') {
        return (
            <div className="space-y-3">
                {tabData.map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border rounded-xl">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${l.type === 'SICK' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <Calendar size={18}/>
                            </div>
                            <div>
                                <p className="font-bold">{l.type}</p>
                                <p className="text-xs text-gray-500">{new Date(l.startDate).toLocaleDateString()} - {new Date(l.endDate).toLocaleDateString()} ({l.daysCount}j)</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded">{l.status}</span>
                    </div>
                ))}
            </div>
        );
    }

    if (activeTab === 'materiel') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tabData.map((a: any) => (
                    <div key={a.id} className="p-4 border rounded-xl bg-white dark:bg-gray-800 flex items-center gap-4">
                        <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"><Laptop size={20}/></div>
                        <div>
                            <p className="font-bold">{a.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{a.serialNumber}</p>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6">
      <div className="space-y-6">
        <Link href="/employes" className="inline-flex items-center text-sm text-gray-500 hover:text-sky-500 transition-colors">
          <ArrowLeft size={16} className="mr-2" /> Retour à la liste
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-50 to-transparent dark:from-sky-900/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
            <div className="relative">
               <img 
                 src={employee.photoUrl || `https://ui-avatars.com/api/?name=${employee.firstName}+${employee.lastName}&background=random`} 
                 alt={employee.firstName} 
                 className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white dark:border-gray-700"
               />
            </div>

            <div className="flex-1 space-y-2">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                 <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {employee.firstName} {employee.lastName}
                    </h1>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                      {employee.position}
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span className="text-sky-600 dark:text-sky-400">{employee.department?.name}</span>
                    </p>
                 </div>
                 <div className="flex items-center gap-3">
                    <button onClick={() => router.push(`/employes/${params.id}/edit`)} className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors" title="Modifier">
                       <Edit size={20} />
                    </button>
                 </div>
               </div>
               <div className="flex flex-wrap gap-3 mt-4">
                  <div className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-mono text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {employee.employeeNumber}
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-750 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    <Briefcase size={14} /> {employee.contractType}
                  </div>
               </div>
            </div>
         </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-700">
          {[
            { id: 'info', label: 'Infos' },
            { id: 'docs', label: 'Documents' },
            { id: 'paie', label: 'Historique Paie' },
            { id: 'conges', label: 'Congés' },
            { id: 'materiel', label: 'Matériel' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative capitalize ${activeTab === tab.id ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/10' : 'text-gray-500'}`}
            >
              {tab.label}
              {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />}
            </button>
          ))}
        </div>
        <div className="p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
    </div>
  );
}
