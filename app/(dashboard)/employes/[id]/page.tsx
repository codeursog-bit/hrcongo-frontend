
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Edit, FileText, Trash2, Clock, Wallet, Calendar, 
  CheckCircle, Mail, Phone, MapPin, Building2, User, Download, 
  AlertCircle, Printer, Eye, EyeOff,
  Briefcase, BadgeCheck, X,
  Laptop, Plus, Loader2, Shield, Award,
  BookOpen, Hash, CreditCard, ChevronRight,
  Gift, TrendingUp, Star
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
  city: string;
  placeOfBirth: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  numberOfChildren: number;
  employeeNumber: string;
  hireDate: string;
  contractType: string;
  position: string;
  baseSalary: number;
  department: { name: string };
  nationalIdNumber: string;
  cnssNumber: string;
  photoUrl: string;
  isSubjectToIrpp: boolean;
  isSubjectToCnss: boolean;
  taxExemptionReason: string;
  professionalCategory: string;
  echelon: string;
  paymentMethod: string;
}

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [showSalary, setShowSalary] = useState(false);
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [companyConvention, setCompanyConvention] = useState<string | null>(null);

  // Tab Data
  const [tabData, setTabData] = useState<any>(null);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        const data = await api.get<EmployeeDetail>(`/employees/${params.id}`);
        setEmployee(data);
        // Charger convention de l'entreprise
        try {
          const company: any = await api.get('/companies/mine');
          if (company?.collectiveAgreement) setCompanyConvention(company.collectiveAgreement);
        } catch {}
      } catch (e) {
        console.error('Error fetching employee', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEmployee();
  }, [params.id]);

  useEffect(() => {
    if (!employee || activeTab === 'info') return;
    const fetchTabData = async () => {
      setTabLoading(true);
      setTabData(null);
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

  const getAnciennete = () => {
    if (!employee?.hireDate) return '';
    const hire = new Date(employee.hireDate);
    const now = new Date();
    const months = Math.floor((now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
    const years = Math.floor(months / 12);
    const rem = months % 12;
    if (years === 0) return `${rem} mois`;
    return `${years} an${years > 1 ? 's' : ''}${rem > 0 ? ` ${rem} mois` : ''}`;
  };

  if (isLoading || !employee) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-sky-500" size={32} />
    </div>
  );

  const renderTabContent = () => {
    if (activeTab === 'info') {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche */}
          <div className="lg:col-span-2 space-y-8">

            {/* Informations personnelles */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <User size={20} className="text-sky-500" /> Informations Personnelles
              </h3>
              <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Nom complet</p>
                  <p className="font-medium text-gray-900 dark:text-white">{employee.firstName} {employee.lastName}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date de naissance</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(employee.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Lieu de naissance</p>
                  <p className="font-medium text-gray-900 dark:text-white">{employee.placeOfBirth}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Genre</p>
                  <p className="font-medium text-gray-900 dark:text-white">{employee.gender === 'MALE' ? 'Homme' : 'Femme'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Phone size={11} /> Téléphone</p>
                  <p className="font-medium font-mono text-gray-900 dark:text-white">{employee.phone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Mail size={11} /> Email</p>
                  <p className="font-medium text-gray-900 dark:text-white truncate">{employee.email}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><MapPin size={11} /> Adresse</p>
                  <p className="font-medium text-gray-900 dark:text-white">{employee.address}{employee.city ? `, ${employee.city}` : ''}</p>
                </div>
                {(employee.maritalStatus || employee.numberOfChildren >= 0) && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Situation familiale</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {employee.maritalStatus === 'SINGLE' ? 'Célibataire' : employee.maritalStatus === 'MARRIED' ? 'Marié(e)' : employee.maritalStatus === 'DIVORCED' ? 'Divorcé(e)' : 'Veuf/Veuve'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Enfants à charge</p>
                      <p className="font-medium text-gray-900 dark:text-white">{employee.numberOfChildren || 0}</p>
                    </div>
                  </>
                )}
              </div>
            </section>

            {/* Documents administratifs */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen size={20} className="text-indigo-500" /> Documents Administratifs
              </h3>
              <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Hash size={11} /> N° CNI / Passeport</p>
                  <p className="font-semibold font-mono text-gray-900 dark:text-white">{employee.nationalIdNumber || <span className="text-gray-400 italic text-sm font-sans font-normal">Non renseigné</span>}</p>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1"><Shield size={11} /> N° CNSS</p>
                  <p className="font-semibold font-mono text-gray-900 dark:text-white">{employee.cnssNumber || <span className="text-gray-400 italic text-sm font-sans font-normal">Non renseigné</span>}</p>
                </div>
              </div>
            </section>

            {/* Convention collective + catégorie */}
            {(companyConvention || employee.professionalCategory) && (
              <section>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Award size={20} className="text-purple-500" /> Classification Conventionnelle
                </h3>
                <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-3">
                  {companyConvention && (
                    <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-700">
                      <div>
                        <p className="text-xs text-purple-500 mb-0.5">Convention Collective</p>
                        <p className="font-bold text-purple-900 dark:text-purple-100">{companyConvention}</p>
                      </div>
                      <BookOpen size={20} className="text-purple-400" />
                    </div>
                  )}
                  {employee.professionalCategory && (
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="text-xs text-gray-500 mb-0.5">Catégorie Professionnelle</p>
                        <p className="font-bold font-mono text-gray-900 dark:text-white">{employee.professionalCategory}</p>
                      </div>
                      {employee.echelon && (
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-0.5">Échelon</p>
                          <p className="font-bold text-sky-600 dark:text-sky-400">{employee.echelon}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Régime fiscal */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Shield size={20} className="text-emerald-500" /> Régime Fiscal
              </h3>
              <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${employee.isSubjectToIrpp ? 'border-sky-400 bg-sky-50 dark:bg-sky-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${employee.isSubjectToIrpp ? 'bg-sky-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">IRPP / ITS</p>
                      <p className="text-xs text-gray-500">{employee.isSubjectToIrpp ? 'Soumis' : 'Exempté'}</p>
                    </div>
                  </div>
                  <div className={`p-4 rounded-xl border-2 flex items-center gap-3 ${employee.isSubjectToCnss ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${employee.isSubjectToCnss ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                      <CheckCircle size={16} className="text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-900 dark:text-white">CNSS (4%)</p>
                      <p className="text-xs text-gray-500">{employee.isSubjectToCnss ? 'Soumis' : 'Exempté'}</p>
                    </div>
                  </div>
                </div>
                {employee.taxExemptionReason && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700 rounded-lg">
                    <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                      <AlertCircle size={12} className="mt-0.5 shrink-0" />
                      <span><strong>Raison d'exemption :</strong> {employee.taxExemptionReason}</span>
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>

          {/* Colonne droite */}
          <div className="space-y-6">
            {/* Emploi */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Briefcase size={20} className="text-purple-500" /> Emploi
              </h3>
              <div className="bg-gray-50 dark:bg-gray-750/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Date d'embauche</p>
                  <p className="font-medium text-gray-900 dark:text-white">{new Date(employee.hireDate).toLocaleDateString('fr-FR')}</p>
                  <p className="text-xs text-sky-600 dark:text-sky-400 mt-0.5">Ancienneté : {getAnciennete()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Type de contrat</p>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 text-sm font-bold">
                    <Briefcase size={12} /> {employee.contractType}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Poste occupé</p>
                  <p className="font-medium text-gray-900 dark:text-white">{employee.position}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Département</p>
                  <p className="font-medium text-gray-900 dark:text-white">{employee.department?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Mode de paiement</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {employee.paymentMethod === 'CASH' ? 'Espèces' : employee.paymentMethod === 'BANK_TRANSFER' ? 'Virement bancaire' : 'Mobile Money'}
                  </p>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-400 uppercase font-bold mb-1">Salaire de base</p>
                  <div className="flex items-center justify-between">
                    <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                      {showSalary ? `${employee.baseSalary.toLocaleString('fr-FR')} FCFA` : '• • • • • • •'}
                    </p>
                    <button onClick={() => setShowSalary(!showSalary)} className="text-gray-400 hover:text-sky-500 transition-colors p-1">
                      {showSalary ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Actions rapides */}
            <section>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Star size={20} className="text-amber-500" /> Actions Rapides
              </h3>
              <div className="space-y-2">
                <Link href={`/employes/${params.id}/primes`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-purple-300 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Gift size={16} className="text-purple-500" />
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Gérer les primes</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-purple-500 transition-colors" />
                </Link>
                <Link href={`/employes/${params.id}/edit`}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-sky-300 dark:hover:border-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-sky-100 dark:bg-sky-900/30 rounded-lg flex items-center justify-center">
                      <Edit size={16} className="text-sky-500" />
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Modifier le dossier</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-sky-500 transition-colors" />
                </Link>
                <button onClick={() => setActiveTab('paie')}
                  className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-750/50 border border-gray-100 dark:border-gray-700 rounded-xl hover:border-emerald-300 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                      <TrendingUp size={16} className="text-emerald-500" />
                    </div>
                    <span className="font-bold text-sm text-gray-900 dark:text-white">Historique de paie</span>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                </button>
              </div>
            </section>
          </div>
        </div>
      );
    }

    if (tabLoading) return <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-sky-500" size={32} /></div>;
    if (!tabData || tabData.length === 0) return (
      <div className="py-20 text-center">
        <AlertCircle size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-gray-400 font-medium">Aucune donnée disponible</p>
      </div>
    );

    if (activeTab === 'docs') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tabData.map((doc: any) => (
            <div key={doc.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl flex items-center gap-3 bg-white dark:bg-gray-800 hover:shadow-md transition-all">
              <div className="p-3 bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 rounded-lg"><FileText size={20} /></div>
              <div className="flex-1 overflow-hidden">
                <p className="font-bold truncate text-gray-900 dark:text-white">{doc.name}</p>
                <p className="text-xs text-gray-500">{doc.type}</p>
              </div>
              <button className="text-gray-400 hover:text-sky-500 transition-colors"><Download size={18} /></button>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'paie') {
      return (
        <div className="space-y-3">
          {tabData.map((p: any) => (
            <Link href={`/paie/bulletins/${p.id}`} key={p.id}>
              <div className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-sky-200 dark:hover:border-sky-800 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-sky-500 to-emerald-500 text-white rounded-xl flex flex-col items-center justify-center font-bold text-xs shadow-lg shadow-sky-500/20">
                    <span className="leading-none">{String(p.month).padStart(2, '0')}</span>
                    <span className="leading-none opacity-75 text-[10px]">{p.year?.toString().slice(2)}</span>
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">Bulletin de Paie</p>
                    <p className="text-xs text-gray-500">Net versé : <strong className="text-emerald-600 dark:text-emerald-400">{p.netSalary?.toLocaleString('fr-FR')} FCFA</strong></p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${p.status === 'PAID' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {p.status === 'PAID' ? 'Payé' : 'En attente'}
                  </span>
                  <ChevronRight size={16} className="text-gray-400 group-hover:text-sky-500 transition-colors" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      );
    }

    if (activeTab === 'conges') {
      return (
        <div className="space-y-3">
          {tabData.map((l: any) => (
            <div key={l.id} className="flex justify-between items-center p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${l.type === 'SICK' ? 'bg-red-100 dark:bg-red-900/20 text-red-500' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-500'}`}>
                  <Calendar size={18} />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">
                    {l.type === 'SICK' ? 'Congé maladie' : l.type === 'ANNUAL' ? 'Congé annuel' : l.type}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(l.startDate).toLocaleDateString('fr-FR')} → {new Date(l.endDate).toLocaleDateString('fr-FR')} · <strong>{l.daysCount}j</strong>
                  </p>
                </div>
              </div>
              <span className={`text-xs px-3 py-1 rounded-full font-bold ${l.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : l.status === 'PENDING' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                {l.status === 'APPROVED' ? 'Approuvé' : l.status === 'PENDING' ? 'En attente' : 'Refusé'}
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (activeTab === 'materiel') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tabData.map((a: any) => (
            <div key={a.id} className="p-4 border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 flex items-center gap-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg"><Laptop size={20} className="text-gray-500 dark:text-gray-400" /></div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{a.name}</p>
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
      <Link href="/employes" className="inline-flex items-center text-sm text-gray-500 hover:text-sky-500 transition-colors">
        <ArrowLeft size={16} className="mr-2" /> Retour à la liste
      </Link>

      {/* CARTE HEADER */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-sky-50 to-transparent dark:from-sky-900/10 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />

        <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
          <div className="relative shrink-0">
            <img
              src={employee.photoUrl || `https://ui-avatars.com/api/?name=${employee.firstName}+${employee.lastName}&background=0EA5E9&color=fff&size=128`}
              alt={employee.firstName}
              className="w-32 h-32 rounded-2xl object-cover shadow-lg border-4 border-white dark:border-gray-700"
            />
            <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800 flex items-center justify-center">
              <CheckCircle size={14} className="text-white" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {employee.firstName} {employee.lastName}
                </h1>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 flex-wrap mt-1">
                  <span>{employee.position}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
                  <span className="text-sky-600 dark:text-sky-400">{employee.department?.name}</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-sm font-mono text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                    {employee.employeeNumber}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-750 text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                    <Briefcase size={14} /> {employee.contractType}
                  </span>
                  {companyConvention && (
                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-sm font-bold text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                      <BookOpen size={13} /> {companyConvention}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href={`/employes/${params.id}/primes`}
                  className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 transition-colors border border-purple-200 dark:border-purple-800"
                  title="Gérer les primes">
                  <Gift size={20} />
                </Link>
                <button onClick={() => router.push(`/employes/${params.id}/edit`)}
                  className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400 hover:bg-sky-100 transition-colors border border-sky-200 dark:border-sky-700"
                  title="Modifier">
                  <Edit size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex overflow-x-auto no-scrollbar border-b border-gray-100 dark:border-gray-700">
          {[
            { id: 'info', label: 'Informations' },
            { id: 'docs', label: 'Documents' },
            { id: 'paie', label: 'Historique Paie' },
            { id: 'conges', label: 'Congés' },
            { id: 'materiel', label: 'Matériel' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-all relative ${
                activeTab === tab.id
                  ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/10'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500" />
              )}
            </button>
          ))}
        </div>
        <div className="p-6 md:p-8 min-h-[400px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

