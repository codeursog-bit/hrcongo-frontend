// ============================================================================
// 🔧 PAGE MONITORING (MODIFIÉE - Connectée à l'API)
// ============================================================================
// Fichier: frontend/app/admin/monitoring/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Download, Terminal, Activity, Database, 
  AlertTriangle, Shield, Webhook, Clock, Loader2, Play, Pause 
} from 'lucide-react';
import { LogStream } from '@/components/admin/monitoring/LogStream';
import { 
  ApiRequestTable, DbQueryTable, ErrorsTable, 
  SecurityTable, WebhooksTable, CronJobsTable 
} from '@/components/admin/monitoring/MonitoringTables';
import { adminService } from '@/lib/services/adminService'; // ✅ AJOUT

export default function MonitoringPage() {
  // ✅ AJOUT : State
  const [monitoringData, setMonitoringData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'api' | 'db' | 'errors' | 'security' | 'webhooks' | 'cron'>('logs');
  const [timeRange, setTimeRange] = useState('1h');
  const [serviceFilter, setServiceFilter] = useState('All Services');
  const [isLiveMode, setIsLiveMode] = useState(true);

  // ✅ AJOUT : Charger les données
  useEffect(() => {
    loadMonitoringData();
  }, []);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      const data = await adminService.getMonitoringData();
      setMonitoringData(data);
    } catch (err) {
      console.error('Erreur chargement monitoring:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ AJOUT : Auto-refresh en mode live
  useEffect(() => {
    if (isLiveMode) {
      const interval = setInterval(loadMonitoringData, 5000); // Refresh toutes les 5s
      return () => clearInterval(interval);
    }
  }, [isLiveMode]);

  // ✅ AJOUT : Loading
  if (loading && !monitoringData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-brand-red animate-spin" />
      </div>
    );
  }

  if (!monitoringData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            🔧 Monitoring Système
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Surveillance en temps réel des performances et de la santé
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsLiveMode(!isLiveMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isLiveMode 
                ? 'bg-green-900/20 text-green-400 border border-green-900/50' 
                : 'bg-gray-800 text-gray-400 border border-gray-700'
            }`}
          >
            {isLiveMode ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isLiveMode ? 'Live' : 'Pausé'}
          </button>
          <button className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white text-sm px-4 py-2 rounded-lg border border-gray-700">
            <Download className="w-4 h-4" />
            Exporter Logs
          </button>
        </div>
      </div>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-sky-500" />
            <span className="text-xs text-gray-500 uppercase">Requêtes/min</span>
          </div>
          <div className="text-2xl font-bold text-white">347</div>
          <div className="text-xs text-green-400 mt-1">+12% vs hier</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <span className="text-xs text-gray-500 uppercase">Erreurs/1h</span>
          </div>
          <div className="text-2xl font-bold text-white">3</div>
          <div className="text-xs text-gray-400 mt-1">Normal</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="text-xs text-gray-500 uppercase">Latence Moy.</span>
          </div>
          <div className="text-2xl font-bold text-white">124ms</div>
          <div className="text-xs text-green-400 mt-1">Excellent</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-500 uppercase">Users Actifs</span>
          </div>
          <div className="text-2xl font-bold text-white">487</div>
          <div className="text-xs text-gray-400 mt-1">En ligne</div>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <Database className="w-4 h-4 text-green-500" />
            <span className="text-xs text-gray-500 uppercase">DB Health</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm font-bold text-green-400">Healthy</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">45% CPU</div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto">
          {[
            { id: 'logs', label: 'Logs Système', icon: Terminal },
            { id: 'api', label: 'API Requests', icon: Activity },
            { id: 'db', label: 'DB Queries', icon: Database },
            { id: 'errors', label: 'Errors', icon: AlertTriangle },
            { id: 'security', label: 'Sécurité', icon: Shield },
            { id: 'webhooks', label: 'Webhooks', icon: Webhook },
            { id: 'cron', label: 'Cron Jobs', icon: Clock },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white border-b-2 border-brand-red'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="flex items-center gap-3">
            <select 
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm outline-none"
            >
              <option>All Services</option>
              <option>Auth Service</option>
              <option>Payroll Service</option>
              <option>Email Service</option>
            </select>
            
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-gray-800 border border-gray-700 text-white px-3 py-2 rounded-lg text-sm outline-none"
            >
              <option value="15m">15 minutes</option>
              <option value="1h">1 heure</option>
              <option value="6h">6 heures</option>
              <option value="24h">24 heures</option>
            </select>
          </div>
          
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="Rechercher dans les logs..." 
              className="w-full bg-gray-800 border border-gray-700 text-white pl-10 pr-4 py-2 rounded-lg text-sm outline-none"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        {activeTab === 'logs' && <LogStream logs={monitoringData.logs} />}
        {activeTab === 'api' && <ApiRequestTable requests={monitoringData.apiRequests} />}
        {activeTab === 'db' && <DbQueryTable queries={monitoringData.dbQueries} />}
        {activeTab === 'errors' && <ErrorsTable errors={monitoringData.errors} />}
        {activeTab === 'security' && <SecurityTable events={monitoringData.security} />}
        {activeTab === 'webhooks' && <WebhooksTable webhooks={[]} />}
        {activeTab === 'cron' && <CronJobsTable jobs={[]} />}
      </div>
    </div>
  );
}
