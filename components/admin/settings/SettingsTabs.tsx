// ============================================================================
// Fichier: frontend/components/admin/settings/SettingsTabs.tsx
// ============================================================================

'use client';

import React, { useState } from 'react';
import { 
  Shield, CreditCard, Mail, Server, FileText, Check, AlertTriangle, 
  Trash2, Plus, Edit2, RotateCw, Globe, Lock, Save, Download 
} from 'lucide-react';

// --- Shared Components ---
const SectionTitle = ({ title, children }: { title: string, children?: React.ReactNode }) => (
  <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-2">
    <h3 className="text-lg font-bold text-white">{title}</h3>
    {children}
  </div>
);

const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange?: () => void }) => (
  <button 
    onClick={onChange}
    className={`w-11 h-6 rounded-full relative transition-colors duration-200 ${enabled ? 'bg-brand-red' : 'bg-gray-700'}`}
  >
    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${enabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
  </button>
);

const SettingRow = ({ label, desc, children }: { label: string, desc?: string, children?: React.ReactNode }) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-gray-800/50 gap-4">
    <div>
      <label className="text-sm font-medium text-gray-200">{label}</label>
      {desc && <p className="text-xs text-gray-500 mt-1">{desc}</p>}
    </div>
    <div className="min-w-[200px] flex justify-end">{children}</div>
  </div>
);

// --- TAB: General ---
const GeneralSettings = ({ settings, onUpdate }: any) => {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <SectionTitle title="Platform Information" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">Platform Name</label>
              <input 
                type="text" 
                value={settings?.platformName || 'HRCongo'} 
                onChange={(e) => onUpdate({ ...settings, platformName: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded p-2 text-white mt-1" 
              />
           </div>
           <div>
              <label className="text-xs text-gray-500 uppercase font-semibold">Environment</label>
              <div className="mt-1 flex items-center gap-2">
                 <span className="px-2 py-1 bg-green-900/30 text-green-400 border border-green-900/50 rounded text-xs font-bold uppercase">Production</span>
                 <span className="text-xs text-gray-500">v1.2.5</span>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <SectionTitle title="Company Defaults" />
        <SettingRow label="Work Days per Month" desc="Standard working days for payroll calculation">
           <input 
             type="number" 
             value={settings?.workDaysPerMonth || 26}
             onChange={(e) => onUpdate({ ...settings, workDaysPerMonth: Number(e.target.value) })}
             className="bg-gray-800 border border-gray-700 rounded p-2 text-white w-24 text-right" 
           />
        </SettingRow>
        <SettingRow label="Work Hours per Day" desc="Legal working hours">
           <input 
             type="number" 
             value={settings?.workHoursPerDay || 8}
             onChange={(e) => onUpdate({ ...settings, workHoursPerDay: Number(e.target.value) })}
             className="bg-gray-800 border border-gray-700 rounded p-2 text-white w-24 text-right" 
           />
        </SettingRow>
      </div>
    </div>
  );
};

// --- TAB: Payroll ---
const PayrollSettings = ({ settings, onUpdate }: any) => {
  return (
    <div className="space-y-8">
      <div className="bg-orange-900/10 border border-orange-900/30 p-4 rounded-xl flex items-start gap-3">
         <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
         <div>
            <h4 className="text-sm font-bold text-orange-200">Legal Compliance Warning</h4>
            <p className="text-xs text-orange-400/80 mt-1">These settings define the legal parameters for all Congo-based payrolls.</p>
         </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
         <SectionTitle title="CNSS Configuration" />
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
               <label className="text-xs text-gray-500 uppercase">Employee Rate</label>
               <div className="flex items-center mt-2">
                  <input 
                    type="number" 
                    value={settings?.cnssSalarialRate || 4} 
                    onChange={(e) => onUpdate({ ...settings, cnssSalarialRate: Number(e.target.value) })}
                    className="bg-transparent text-xl font-bold text-white w-16 outline-none" 
                  />
                  <span className="text-gray-400">%</span>
               </div>
            </div>
            <div className="p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
               <label className="text-xs text-gray-500 uppercase">Employer Rate</label>
               <div className="flex items-center mt-2">
                  <input 
                    type="number" 
                    value={settings?.cnssEmployerRate || 16}
                    onChange={(e) => onUpdate({ ...settings, cnssEmployerRate: Number(e.target.value) })}
                    className="bg-transparent text-xl font-bold text-white w-16 outline-none" 
                  />
                  <span className="text-gray-400">%</span>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

// --- TAB: Security ---
const SecuritySettings = () => {
  return (
    <div className="space-y-8">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
         <SectionTitle title="Authentication Policy" />
         <SettingRow label="Require Email Verification" desc="New users must verify email before login">
            <Toggle enabled={true} />
         </SettingRow>
         <SettingRow label="Password Complexity" desc="Require uppercase, numbers, and symbols">
            <Toggle enabled={true} />
         </SettingRow>
      </div>
    </div>
  );
};

// --- TAB: Integrations ---
const IntegrationSettings = () => {
   return (
      <div className="space-y-8">
         <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle title="Payment Gateways" />
            <div className="space-y-4">
               <div className="flex items-center justify-between p-4 border border-green-900/30 bg-green-900/10 rounded-lg">
                  <div className="flex items-center gap-4">
                     <div className="w-10 h-10 bg-white rounded flex items-center justify-center font-bold text-black text-xs">FLW</div>
                     <div>
                        <div className="font-bold text-white">Flutterwave</div>
                        <div className="text-xs text-green-400 flex items-center gap-1">● Connected</div>
                     </div>
                  </div>
                  <button className="px-3 py-1.5 border border-gray-700 rounded text-xs hover:bg-gray-800 transition-colors">Configure</button>
               </div>
            </div>
         </div>
      </div>
   )
};

// --- TAB: Maintenance ---
const MaintenanceSettings = () => {
   return (
      <div className="space-y-8">
         <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <SectionTitle title="System Health" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
               <div className="p-4 bg-gray-800 rounded-lg text-center">
                  <div className="text-xs text-gray-500 uppercase">Uptime</div>
                  <div className="text-2xl font-bold text-green-400 mt-1">99.97%</div>
               </div>
            </div>
         </div>
      </div>
   )
};

// --- TAB: Audit Log ---
const AuditLogSettings = () => {
   return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
         <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-800/20">
            <h3 className="font-bold text-white">System Audit Log</h3>
         </div>
         <div className="p-8 text-center text-gray-500">
            Aucun log disponible pour le moment
         </div>
      </div>
   )
};

// --- MAIN COMPONENT ---
interface SettingsTabsProps {
  settings: any;
  onUpdate: (settings: any) => void;
}

export const SettingsTabs: React.FC<SettingsTabsProps> = ({ settings, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'payroll', label: 'Payroll', icon: FileText },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'integrations', label: 'Integrations', icon: CreditCard },
    { id: 'maintenance', label: 'Maintenance', icon: Server },
    { id: 'audit', label: 'Audit Log', icon: Lock },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
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

      {/* Tab Content */}
      <div>
        {activeTab === 'general' && <GeneralSettings settings={settings} onUpdate={onUpdate} />}
        {activeTab === 'payroll' && <PayrollSettings settings={settings} onUpdate={onUpdate} />}
        {activeTab === 'security' && <SecuritySettings />}
        {activeTab === 'integrations' && <IntegrationSettings />}
        {activeTab === 'maintenance' && <MaintenanceSettings />}
        {activeTab === 'audit' && <AuditLogSettings />}
      </div>
    </div>
  );
};