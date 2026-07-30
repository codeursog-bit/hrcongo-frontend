// ============================================================================
// 🏢 PAGE COMPANY DETAILS (MODIFIÉE - Connectée à l'API)
// ============================================================================
// Fichier: frontend/app/admin/companies/[id]/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar, 
  Users, CreditCard, Activity, Ban, Trash2, UserPlus, Loader2 
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService'; // ✅ AJOUT

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  // ✅ AJOUT : State
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ AJOUT : Charger les détails
  useEffect(() => {
    if (companyId) {
      loadCompanyDetails();
    }
  }, [companyId]);

  const loadCompanyDetails = async () => {
    try {
      setLoading(true);
      const data = await adminService.getCompanyDetails(companyId);
      setCompany(data);
    } catch (err) {
      console.error('Erreur chargement détails:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ AJOUT : Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-8">
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-6 text-red-400">
          Entreprise introuvable
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 flex items-center justify-center text-2xl font-bold text-white">
              {company.logo || company.legalName.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{company.legalName}</h1>
              <p className="text-gray-400 text-sm">{company.rccmNumber}</p>
            </div>
            <span className={`ml-auto px-3 py-1.5 rounded-full text-xs font-bold ${
              company.isActive 
                ? 'bg-green-900/20 text-green-400 border border-green-900/50' 
                : 'bg-red-900/20 text-red-400 border border-red-900/50'
            }`}>
              {company.isActive ? 'Active' : 'Suspendue'}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button className="flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <UserPlus className="w-4 h-4" />
          Se Connecter Comme
        </button>
        <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm border border-gray-700">
          <Ban className="w-4 h-4" />
          Suspendre
        </button>
        <button className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-900/50">
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar */}
        <div className="space-y-6">
          {/* Subscription Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-brand-gold" />
              Abonnement
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-xs text-gray-500 uppercase">Plan Actuel</div>
                <div className="text-lg font-bold text-sky-400">
                  {company.subscription?.plan || 'FREE'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">MRR</div>
                <div className="text-lg font-bold text-brand-gold">
                  {company.subscription?.pricePerMonth?.toLocaleString() || 0} FCFA
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Prochain Paiement</div>
                <div className="text-sm text-white">
                  {company.subscription?.currentPeriodEnd 
                    ? new Date(company.subscription.currentPeriodEnd).toLocaleDateString('fr-FR')
                    : 'N/A'
                  }
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase">Méthode</div>
                <div className="text-sm text-white">Carte de crédit</div>
              </div>
            </div>
          </div>

          {/* Contact Admin */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Admin Principal</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{company.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{company.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="text-gray-300">{company.city}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-sky-500" />
                <span className="text-xs text-gray-500 uppercase">Utilisateurs</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {company.users?.length || 0}
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-gray-500 uppercase">Employés</span>
              </div>
              <div className="text-2xl font-bold text-white">
                {company.employees?.length || 0}
              </div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-gray-500 uppercase">Stockage</span>
              </div>
              <div className="text-lg font-bold text-white">2.4GB</div>
              <div className="text-xs text-gray-500">/ 10GB</div>
            </div>
            
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 uppercase">Tickets</span>
              </div>
              <div className="text-2xl font-bold text-white">2</div>
              <div className="text-xs text-gray-500">Ouverts</div>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Activité Récente</h3>
            <div className="space-y-4">
              <div className="flex gap-4 pb-4 border-b border-gray-800">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm text-white">Paiement reçu</div>
                  <div className="text-xs text-gray-500">Il y a 2 jours</div>
                </div>
                <div className="text-sm font-mono text-brand-gold">
                  {company.subscription?.pricePerMonth?.toLocaleString()} FCFA
                </div>
              </div>
              
              <div className="flex gap-4 pb-4 border-b border-gray-800">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm text-white">Nouvel utilisateur ajouté</div>
                  <div className="text-xs text-gray-500">Il y a 5 jours</div>
                </div>
              </div>
              
              <div className="flex gap-4">
                <div className="w-2 h-2 rounded-full bg-purple-500 mt-2"></div>
                <div className="flex-1">
                  <div className="text-sm text-white">Compte créé</div>
                  <div className="text-xs text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
