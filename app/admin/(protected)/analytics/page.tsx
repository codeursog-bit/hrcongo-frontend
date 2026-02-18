// ============================================================================
// Fichier: frontend/app/admin/analytics/page.tsx
// ============================================================================

'use client';

import React, { useState, useEffect } from 'react';
import { 
    Calendar, Download, ArrowUpRight, ArrowDownRight, Users, 
    CreditCard, Server, Activity, AlertTriangle, MapPin, 
    Zap, Clock, MousePointer, AlertCircle, Loader2
} from 'lucide-react';
import { AnalyticsCard } from '@/components/admin/analytics/AnalyticsCard';
import { 
    AcquisitionChart, ChurnPieChart, DauChart, FeatureBarChart, 
    LatencyChart, IndustryPieChart 
} from '@/components/admin/analytics/AnalyticsCharts';
import { CohortAnalysis } from '@/components/admin/analytics/CohortAnalysis';
import { adminService } from '@/lib/services/adminService';

export default function AnalyticsPage() {
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('Last 30 Days');

    useEffect(() => {
        loadAnalytics();
    }, []);

    const loadAnalytics = async () => {
        try {
            setLoading(true);
            const data = await adminService.getAnalytics();
            setAnalytics(data);
        } catch (err) {
            console.error('Erreur chargement analytics:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
            </div>
        );
    }

    if (!analytics) return null;

    // Calculer les valeurs dynamiques
    const lastAcquisition = analytics.acquisitionData[analytics.acquisitionData.length - 1]?.value || 0;
    const totalUsers = 1847; // TODO: Ajouter au backend
    const totalEmployees = 6842; // TODO: Ajouter au backend

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        📊 Analytique Plateforme
                    </h1>
                    <p className="text-gray-400 text-sm mt-1">Analyse approfondie des performances et du comportement des utilisateurs</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <select 
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-gray-900 border border-gray-700 text-white pl-9 pr-8 py-2 rounded-lg text-sm appearance-none outline-none focus:border-brand-red cursor-pointer hover:bg-gray-800 transition-colors"
                        >
                            <option value="Today">Aujourd'hui</option>
                            <option value="Last 7 Days">7 Derniers Jours</option>
                            <option value="Last 30 Days">30 Derniers Jours</option>
                            <option value="This Quarter">Ce Trimestre</option>
                            <option value="This Year">Cette Année</option>
                        </select>
                    </div>
                    <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg border border-gray-700 transition-colors">
                        <Download className="w-4 h-4" /> Exporter
                    </button>
                </div>
            </div>

            {/* Executive Summary */}
            <div className="relative overflow-hidden bg-gradient-to-r from-gray-900 via-[#0B0F19] to-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-3xl pointer-events-none"></div>
                 <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 relative z-10 text-center lg:text-left">
                    <div className="flex flex-col justify-center items-center lg:items-start border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Entreprises Actives</span>
                        <div className="text-4xl font-extrabold text-white">152</div>
                        <div className="flex items-center gap-2 mt-2 bg-green-900/20 px-3 py-1 rounded-full border border-green-900/30">
                            <ArrowUpRight className="w-4 h-4 text-green-500" />
                            <span className="text-sm font-bold text-green-400">+8 (+5.6%)</span>
                        </div>
                    </div>
                    <div className="flex flex-col justify-center items-center lg:items-start space-y-4 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pl-8">
                         <div>
                            <span className="text-xs text-gray-500 uppercase">Revenu Total (MRR)</span>
                            <div className="text-xl font-bold text-brand-gold">2.28M FCFA</div>
                            <span className="text-xs text-green-500 font-medium">+45% sur un an</span>
                         </div>
                         <div>
                            <span className="text-xs text-gray-500 uppercase">Santé Plateforme</span>
                            <div className="text-xl font-bold text-white">94/100</div>
                            <span className="text-xs text-green-500 font-medium">Excellent (A)</span>
                         </div>
                    </div>
                    <div className="flex flex-col justify-center items-center lg:items-start space-y-4 border-b lg:border-b-0 lg:border-r border-gray-800 pb-6 lg:pb-0 lg:pl-8">
                         <div>
                            <span className="text-xs text-gray-500 uppercase">Utilisateurs Totaux</span>
                            <div className="text-xl font-bold text-white">{totalUsers.toLocaleString()}</div>
                            <span className="text-xs text-gray-400">79% Actifs (30j)</span>
                         </div>
                         <div>
                            <span className="text-xs text-gray-500 uppercase">Employés Gérés</span>
                            <div className="text-xl font-bold text-white">{totalEmployees.toLocaleString()}</div>
                            <span className="text-xs text-green-500 font-medium">+324 ce mois</span>
                         </div>
                    </div>
                     <div className="flex flex-col justify-center items-center lg:items-start lg:pl-8">
                        <div className="w-full bg-gray-800/50 rounded-xl p-4 border border-gray-700">
                             <span className="text-xs text-gray-400 uppercase font-bold mb-2 block">Actions Rapides</span>
                             <div className="space-y-2">
                                <button className="w-full text-left text-xs text-sky-400 hover:text-white hover:underline">Voir Rapport Churn →</button>
                                <button className="w-full text-left text-xs text-sky-400 hover:text-white hover:underline">Analyser Revenus →</button>
                                <button className="w-full text-left text-xs text-sky-400 hover:text-white hover:underline">Logs Système →</button>
                             </div>
                        </div>
                    </div>
                 </div>
            </div>

            {/* ROW 1: GROWTH METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <AnalyticsCard title="Acquisition Utilisateurs" subtitle="Nouveaux vs mois préc.">
                    <div className="mb-4">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-2xl font-bold text-white">{lastAcquisition}</span>
                            <span className="text-xs text-gray-400">Ce mois</span>
                        </div>
                        <div className="text-xs text-green-400 flex items-center">
                            <ArrowUpRight className="w-3 h-3 mr-1" /> Nouveau utilisateurs
                        </div>
                    </div>
                    <AcquisitionChart data={analytics.acquisitionData} />
                    <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <span className="text-gray-500 block">Direct</span>
                            <span className="text-white font-bold">45%</span>
                        </div>
                         <div>
                            <span className="text-gray-500 block">Parrainage</span>
                            <span className="text-white font-bold">30%</span>
                        </div>
                    </div>
                </AnalyticsCard>

                <AnalyticsCard title="Churn & Rétention" subtitle="Taux d'attrition mensuel">
                    <div className="flex justify-between items-center mb-2">
                        <div>
                            <div className="text-2xl font-bold text-white">{analytics.churnData.rate}%</div>
                            <div className="text-xs text-red-400">{analytics.churnData.count} entreprises perdues</div>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-white">78%</div>
                             <div className="text-xs text-gray-500">Rétention Annuelle</div>
                        </div>
                    </div>
                    <ChurnPieChart data={analytics.churnData.reasons} />
                    <div className="mt-2 text-center text-xs text-gray-500">
                        Raison Principale: <span className="text-white font-medium">Prix (40%)</span>
                    </div>
                </AnalyticsCard>

                <AnalyticsCard title="Économie Unitaire" subtitle="Efficacité des revenus">
                     <div className="space-y-4 mt-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">ARPU</span>
                            <span className="text-sm font-bold text-white">15,000 F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">LTV</span>
                            <span className="text-sm font-bold text-brand-gold">180,000 F</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">CAC</span>
                            <span className="text-sm font-bold text-red-400">45,000 F</span>
                        </div>
                        <div className="pt-2 border-t border-gray-800">
                             <div className="flex justify-between items-center mb-1">
                                <span className="text-xs text-gray-500">Ratio LTV/CAC</span>
                                <span className="text-xs font-bold text-green-400">4.0x (Sain)</span>
                             </div>
                             <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: '80%' }}></div>
                             </div>
                        </div>
                     </div>
                </AnalyticsCard>

                <AnalyticsCard title="Ratio de Liquidité" subtitle="Efficacité Croissance SaaS">
                    <div className="flex items-center justify-center py-4">
                         <div className="relative w-32 h-32 rounded-full border-8 border-gray-800 border-t-green-500 border-r-green-500 flex items-center justify-center">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">3.8</div>
                                <div className="text-xs text-green-500 font-bold">Excellent</div>
                            </div>
                         </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mt-2">
                        <div className="bg-green-900/20 p-2 rounded border border-green-900/30">
                            <span className="block text-green-500">Nouveau MRR</span>
                            <span className="font-bold text-white">+120k</span>
                        </div>
                        <div className="bg-red-900/20 p-2 rounded border border-red-900/30">
                            <span className="block text-red-500">Perdu (Churn)</span>
                            <span className="font-bold text-white">-45k</span>
                        </div>
                    </div>
                </AnalyticsCard>
            </div>

            {/* ROW 2: ENGAGEMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <AnalyticsCard title="Utilisateurs Actifs Quotidiens (DAU)" subtitle="Tendance 7 derniers jours" className="h-full">
                        <div className="flex items-end gap-2 mb-4">
                            <span className="text-3xl font-bold text-white">
                                {analytics.dau[analytics.dau.length - 1]?.value || 0}
                            </span>
                            <span className="text-sm text-green-400 mb-1">Aujourd'hui</span>
                        </div>
                        <DauChart data={analytics.dau} />
                        <div className="grid grid-cols-4 gap-4 mt-6">
                             <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <span className="text-xs text-gray-500 block uppercase">DAU/MAU</span>
                                <span className="text-lg font-bold text-white">33%</span>
                             </div>
                             <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <span className="text-xs text-gray-500 block uppercase">Session Moy.</span>
                                <span className="text-lg font-bold text-white">24m</span>
                             </div>
                             <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <span className="text-xs text-gray-500 block uppercase">Taux Rebond</span>
                                <span className="text-lg font-bold text-green-400">12%</span>
                             </div>
                             <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <span className="text-xs text-gray-500 block uppercase">Pages/Session</span>
                                <span className="text-lg font-bold text-white">7.4</span>
                             </div>
                        </div>
                    </AnalyticsCard>
                </div>
                
                <div className="lg:col-span-1">
                     <AnalyticsCard title="Utilisation Fonctionnalités" subtitle="Modules les plus adoptés" className="h-full">
                        <FeatureBarChart />
                        <div className="mt-4 p-3 bg-yellow-900/10 border border-yellow-900/30 rounded-lg flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5" />
                            <div>
                                <div className="text-xs font-bold text-yellow-200">Alerte Faible Adoption</div>
                                <div className="text-[10px] text-yellow-400/80">Seulement 29% utilisent les Documents. Pensez à ajouter des infobulles d'aide.</div>
                            </div>
                        </div>
                     </AnalyticsCard>
                </div>
            </div>

            {/* ROW 3: COHORT & PERFORMANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <AnalyticsCard title="Analyse de Cohorte" subtitle="Rétention par mois d'inscription">
                    <CohortAnalysis data={analytics.cohortData} />
                 </AnalyticsCard>

                 <AnalyticsCard title="Performance Système" subtitle="Temps Réponse API (24h)">
                     <div className="flex justify-between items-end mb-4">
                        <div>
                             <div className="text-2xl font-bold text-white">124ms</div>
                             <div className="text-xs text-gray-400">Latence Moy.</div>
                        </div>
                        <div className="text-right">
                             <div className="text-sm font-bold text-red-400">0.05%</div>
                             <div className="text-xs text-gray-500">Taux d'Erreur</div>
                        </div>
                     </div>
                     <LatencyChart />
                     <div className="space-y-3 mt-4">
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-gray-400 font-mono">POST /payroll/calculate</span>
                             <span className="text-red-400 font-bold">450ms (Lent)</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                             <div className="bg-red-500 h-full rounded-full" style={{ width: '80%' }}></div>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                             <span className="text-gray-400 font-mono">GET /reports/analytics</span>
                             <span className="text-orange-400 font-bold">380ms</span>
                        </div>
                        <div className="w-full bg-gray-800 h-1 rounded-full overflow-hidden">
                             <div className="bg-orange-500 h-full rounded-full" style={{ width: '65%' }}></div>
                        </div>
                     </div>
                 </AnalyticsCard>
            </div>

            {/* ROW 4: BI */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AnalyticsCard title="Distribution Géographique" subtitle="Entreprises par Ville">
                    <div className="space-y-4 mt-2">
                        {analytics.geoDistribution.slice(0, 5).map((geo: any, i: number) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-500">
                                    <MapPin className="w-4 h-4" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white font-medium">{geo.city}</span>
                                        <span className="text-gray-400">{geo.count}</span>
                                    </div>
                                    <div className="w-full bg-gray-800 h-1.5 rounded-full mt-1.5">
                                        <div className="bg-brand-red h-full rounded-full" style={{ width: `${(geo.count / 152) * 100}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </AnalyticsCard>
                
                <AnalyticsCard title="Répartition par Secteur" subtitle="Segmentation industrielle">
                     <IndustryPieChart />
                </AnalyticsCard>

                <AnalyticsCard title="Prédiction Churn IA" subtitle="Analyse de risque (30j)">
                    <div className="flex items-center gap-3 mb-6 bg-red-900/10 border border-red-900/30 p-3 rounded-lg">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                        <div>
                             <div className="text-2xl font-bold text-white">7</div>
                             <div className="text-xs text-red-400 font-bold">Entreprises à Haut Risque</div>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        <div className="text-xs text-gray-500 uppercase font-bold">Facteurs de Risque Détectés</div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                             Faible usage (Pas de connexion &gt; 14 jours)
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                             Paiement échoué 2+ fois
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-300">
                             <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                             Ticket support ouvert &gt; 7 jours
                        </div>
                    </div>

                    <button className="w-full mt-6 py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold rounded-lg border border-gray-700 transition-colors">
                        Contacter les Comptes à Risque
                    </button>
                </AnalyticsCard>
            </div>
        </div>
    );
}