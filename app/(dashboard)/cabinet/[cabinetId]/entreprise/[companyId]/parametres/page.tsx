'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/parametres/page.tsx
// Le cabinet configure la PME : géoloc, primes, départements, infos de base

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Settings, Loader2, Save, CheckCircle2, AlertCircle,
  MapPin, Tag, Network, Building2,
} from 'lucide-react';
import { api } from '@/services/api';

type Tab = 'entreprise' | 'geoloc' | 'primes' | 'departements' | 'paie';

const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30 transition-colors";

export default function CabinetEntrepriseParametresPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [tab,    setTab]    = useState<Tab>('entreprise');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  // Entreprise
  const [company, setCompany] = useState<any>(null);
  // Géoloc
  const [geo, setGeo] = useState({ latitude: 0, longitude: 0, allowedRadius: 100 });
  // Primes
  const [primes,     setPrimes]    = useState<any[]>([]);
  const [showPrime,  setShowPrime] = useState(false);
  const [primeForm,  setPrimeForm] = useState({ name: '', value: 0, isTaxable: true, isCnss: true });
  // Départements
  const [depts,    setDepts]   = useState<any[]>([]);
  const [deptName, setDeptName] = useState('');
  // Paie
  const [payrollSettings, setPayrollSettings] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [comp, primesRes, deptsRes] = await Promise.all([
          api.get(`/companies/${companyId}`) as Promise<any>,
          api.get(`/bonus-templates?companyId=${companyId}`) as Promise<any>,
          api.get(`/departments?companyId=${companyId}`) as Promise<any>,
        ]);
        setCompany(comp);
        setGeo({ latitude: comp.latitude ?? 0, longitude: comp.longitude ?? 0, allowedRadius: comp.allowedRadius ?? 100 });
        setPrimes(Array.isArray(primesRes) ? primesRes : primesRes?.data ?? []);
        setDepts(Array.isArray(deptsRes) ? deptsRes : deptsRes?.data ?? []);

        const ps: any = await api.get(`/payroll-settings?companyId=${companyId}`);
        setPayrollSettings(ps);
      } catch {}
    };
    load();
  }, [companyId]);

  const flash = (ok: boolean) => {
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else    { setError('Erreur lors de la sauvegarde'); setTimeout(() => setError(''), 3000); }
  };

  const saveCompany = async () => {
    setSaving(true);
    try {
      await api.patch(`/companies/${companyId}`, {
        legalName: company.legalName, tradeName: company.tradeName,
        phone: company.phone, email: company.email,
        address: company.address, city: company.city,
      });
      flash(true);
    } catch { flash(false); } finally { setSaving(false); }
  };

  const saveGeo = async () => {
    setSaving(true);
    try {
      await api.patch(`/companies/${companyId}`, geo);
      flash(true);
    } catch { flash(false); } finally { setSaving(false); }
  };

  const savePayroll = async () => {
    setSaving(true);
    try {
      await api.patch(`/payroll-settings?companyId=${companyId}`, payrollSettings);
      flash(true);
    } catch { flash(false); } finally { setSaving(false); }
  };

  const addPrime = async () => {
    if (!primeForm.name) return;
    try {
      const res: any = await api.post(`/bonus-templates?companyId=${companyId}`, primeForm);
      setPrimes(p => [...p, res]);
      setShowPrime(false);
      setPrimeForm({ name: '', value: 0, isTaxable: true, isCnss: true });
    } catch { setError('Erreur création prime'); }
  };

  const deletePrime = async (id: string) => {
    try {
      await api.delete(`/bonus-templates/${id}`);
      setPrimes(p => p.filter(x => x.id !== id));
    } catch {}
  };

  const addDept = async () => {
    if (!deptName.trim()) return;
    try {
      const res: any = await api.post(`/departments?companyId=${companyId}`, { name: deptName.trim() });
      setDepts(d => [...d, res]);
      setDeptName('');
    } catch { setError('Erreur création département'); }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'entreprise',   label: 'Entreprise',      icon: Building2 },
    { key: 'geoloc',       label: 'Géolocalisation', icon: MapPin    },
    { key: 'primes',       label: 'Primes',          icon: Tag       },
    { key: 'departements', label: 'Départements',    icon: Network   },
    { key: 'paie',         label: 'Paramètres paie', icon: Settings  },
  ];

  if (!company) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="p-6 space-y-5">
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings size={20} className="text-cyan-400" /> Paramètres PME
        </h1>
        <p className="text-gray-500 text-sm mt-0.5">Configuration de l'entreprise cliente</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-white/3 border border-white/8 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              tab === t.key ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-white'
            }`}>
            <t.icon size={13} />{t.label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {saved && (
        <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit">
          <CheckCircle2 size={14} className="text-emerald-400" /><span className="text-emerald-400 text-sm">Sauvegardé</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl w-fit">
          <AlertCircle size={14} className="text-red-400" /><span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      {/* Entreprise */}
      {tab === 'entreprise' && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 max-w-2xl">
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Raison sociale *', key: 'legalName' },
              { label: 'Nom commercial',   key: 'tradeName'  },
              { label: 'Téléphone',        key: 'phone'      },
              { label: 'Email',            key: 'email'      },
              { label: 'Adresse',          key: 'address'    },
              { label: 'Ville',            key: 'city'       },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
                <input value={company[f.key] || ''} onChange={e => setCompany({ ...company, [f.key]: e.target.value })} className={inputClass} />
              </div>
            ))}
          </div>
          <button onClick={saveCompany} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
          </button>
        </div>
      )}

      {/* Géolocalisation */}
      {tab === 'geoloc' && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 max-w-2xl">
          <p className="text-gray-400 text-sm">Zone de pointage GPS pour les employés de la PME</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Latitude',        key: 'latitude',       type: 'number', step: '0.000001' },
              { label: 'Longitude',       key: 'longitude',      type: 'number', step: '0.000001' },
              { label: 'Rayon (mètres)', key: 'allowedRadius',  type: 'number' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
                <input type={f.type} step={f.step} value={(geo as any)[f.key]}
                  onChange={e => setGeo({ ...geo, [f.key]: parseFloat(e.target.value) || 0 })}
                  className={inputClass} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => {
              if (!navigator.geolocation) return;
              navigator.geolocation.getCurrentPosition(p => setGeo(g => ({ ...g, latitude: p.coords.latitude, longitude: p.coords.longitude })));
            }} className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
              <MapPin size={14} /> Ma position
            </button>
            <button onClick={saveGeo} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Primes */}
      {tab === 'primes' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">Templates de primes récurrentes</p>
            <button onClick={() => setShowPrime(!showPrime)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-colors">
              <Tag size={12} /> Ajouter
            </button>
          </div>
          {showPrime && (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Libellé *</label>
                  <input value={primeForm.name} onChange={e => setPrimeForm({ ...primeForm, name: e.target.value })} placeholder="Prime transport" className={inputClass} /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Montant (F)</label>
                  <input type="number" value={primeForm.value} onChange={e => setPrimeForm({ ...primeForm, value: parseFloat(e.target.value) || 0 })} className={inputClass} /></div>
              </div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                  <input type="checkbox" checked={primeForm.isTaxable} onChange={e => setPrimeForm({ ...primeForm, isTaxable: e.target.checked })} className="rounded" /> Imposable (ITS)
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-gray-400">
                  <input type="checkbox" checked={primeForm.isCnss} onChange={e => setPrimeForm({ ...primeForm, isCnss: e.target.checked })} className="rounded" /> CNSS
                </label>
              </div>
              <div className="flex gap-2">
                <button onClick={addPrime} className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded-xl text-sm font-semibold transition-colors">Ajouter</button>
                <button onClick={() => setShowPrime(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-sm transition-colors">Annuler</button>
              </div>
            </div>
          )}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {primes.length === 0
              ? <div className="py-8 text-center text-gray-500 text-sm">Aucun template de prime</div>
              : <div className="divide-y divide-white/5">
                  {primes.map(p => (
                    <div key={p.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white font-medium">{p.name}</p>
                        <p className="text-xs text-gray-500">
                          {p.value > 0 ? `${p.value.toLocaleString('fr-FR')} F` : 'Variable'} ·
                          {p.isTaxable ? ' Imposable' : ' Non imposable'} · {p.isCnss ? 'CNSS' : 'Hors CNSS'}
                        </p>
                      </div>
                      <button onClick={() => deletePrime(p.id)} className="text-xs text-gray-600 hover:text-red-400 transition-colors px-2 py-1">Supprimer</button>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* Départements */}
      {tab === 'departements' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex gap-2">
            <input value={deptName} onChange={e => setDeptName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDept()}
              placeholder="Nom du département" className={`flex-1 ${inputClass}`} />
            <button onClick={addDept} disabled={!deptName.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black rounded-xl text-sm font-semibold transition-colors">
              Ajouter
            </button>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {depts.length === 0
              ? <div className="py-8 text-center text-gray-500 text-sm">Aucun département</div>
              : <div className="divide-y divide-white/5">
                  {depts.map(d => (
                    <div key={d.id} className="px-5 py-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Network size={14} className="text-gray-500" />
                        <span className="text-sm text-white">{d.name}</span>
                      </div>
                      <span className="text-xs text-gray-600">{d._count?.employees ?? 0} employé(s)</span>
                    </div>
                  ))}
                </div>
            }
          </div>
        </div>
      )}

      {/* Paie */}
      {tab === 'paie' && payrollSettings && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 max-w-2xl">
          <p className="text-gray-400 text-sm">Paramètres de paie (taux CNSS, heures sup, etc.)</p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Taux CNSS salarial (%)',    key: 'cnssSalarialRate' },
              { label: 'Taux CNSS patronal (%)',    key: 'cnssEmployerRate' },
              { label: 'H.Sup ×10% — taux (%)',    key: 'overtimeRate10'   },
              { label: 'H.Sup ×25% — taux (%)',    key: 'overtimeRate25'   },
              { label: 'H.Sup ×50% — taux (%)',    key: 'overtimeRate50'   },
              { label: 'Jours ouvrés / mois',      key: 'workDaysPerMonth' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs text-gray-400 mb-1.5">{f.label}</label>
                <input type="number" value={payrollSettings[f.key] ?? ''} onChange={e => setPayrollSettings({ ...payrollSettings, [f.key]: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
            ))}
          </div>
          <button onClick={savePayroll} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black font-semibold rounded-xl text-sm transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
          </button>
        </div>
      )}
    </div>
  );
}