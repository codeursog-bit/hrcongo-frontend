'use client';

// app/pme/[companyId]/parametres/page.tsx
// Paramètres PME — sans onglets fiscal, taxes, paie avancée
// Onglets disponibles : Entreprise, Géoloc, Primes, Départements, Utilisateurs

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Settings, Loader2, Save, CheckCircle2, AlertCircle,
  Building2, MapPin, Tag, Network, Users, Info,
} from 'lucide-react';
import { api } from '@/services/api';

type Tab = 'entreprise' | 'geoloc' | 'primes' | 'departements' | 'users';

const inputClass = "w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 outline-none focus:border-white/30 transition-colors";

export default function PmeParametresPage() {
  const params    = useParams();
  const router    = useRouter();
  const companyId = params.companyId as string;

  const [tab,    setTab]    = useState<Tab>('entreprise');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const [company, setCompany] = useState<any>(null);
  const [geo,     setGeo]     = useState({ latitude: 0, longitude: 0, allowedRadius: 100 });
  const [primes,  setPrimes]  = useState<any[]>([]);
  const [depts,   setDepts]   = useState<any[]>([]);
  const [users,   setUsers]   = useState<any[]>([]);
  const [deptName, setDeptName] = useState('');
  const [primeForm, setPrimeForm] = useState({ name: '', value: 0, isTaxable: true, isCnss: true });
  const [showPrime, setShowPrime] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [comp, primesRes, deptsRes, usersRes] = await Promise.all([
          api.get('/companies/mine') as Promise<any>,
          api.get('/bonus-templates') as Promise<any>,
          api.get('/departments') as Promise<any>,
          api.get('/users') as Promise<any>,
        ]);
        setCompany(comp);
        setGeo({ latitude: comp.latitude ?? 0, longitude: comp.longitude ?? 0, allowedRadius: comp.allowedRadius ?? 100 });
        setPrimes(Array.isArray(primesRes) ? primesRes : primesRes?.data ?? []);
        setDepts(Array.isArray(deptsRes) ? deptsRes : deptsRes?.data ?? []);
        setUsers(Array.isArray(usersRes) ? usersRes : usersRes?.data ?? []);
      } catch {}
    };
    load();
  }, [companyId]);

  const flash = (ok: boolean) => {
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500); }
    else    { setError('Erreur sauvegarde'); setTimeout(() => setError(''), 3000); }
  };

  const saveCompany = async () => {
    setSaving(true);
    try {
      await api.patch('/companies', {
        legalName: company.legalName, tradeName: company.tradeName,
        phone: company.phone, email: company.email,
        address: company.address, city: company.city, logo: company.logo,
      });
      flash(true);
    } catch { flash(false); } finally { setSaving(false); }
  };

  const saveGeo = async () => {
    setSaving(true);
    try {
      await api.patch('/companies', geo);
      flash(true);
    } catch { flash(false); } finally { setSaving(false); }
  };

  const addPrime = async () => {
    if (!primeForm.name) return;
    try {
      const res: any = await api.post('/bonus-templates', primeForm);
      setPrimes(p => [...p, res]);
      setShowPrime(false);
      setPrimeForm({ name: '', value: 0, isTaxable: true, isCnss: true });
    } catch { setError('Erreur création prime'); }
  };

  const addDept = async () => {
    if (!deptName.trim()) return;
    try {
      const res: any = await api.post('/departments', { name: deptName.trim() });
      setDepts(d => [...d, res]);
      setDeptName('');
    } catch { setError('Erreur création département'); }
  };

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'entreprise',   label: 'Entreprise',  icon: Building2 },
    { key: 'geoloc',       label: 'Géoloc',      icon: MapPin    },
    { key: 'primes',       label: 'Primes',       icon: Tag       },
    { key: 'departements', label: 'Départements', icon: Network   },
    { key: 'users',        label: 'Utilisateurs', icon: Users     },
  ];

  if (!company) return <div className="flex justify-center py-20"><Loader2 size={24} className="animate-spin text-gray-600" /></div>;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-white">Paramètres</h1>
        <p className="text-gray-500 text-sm mt-0.5">Configuration de votre entreprise</p>
      </div>

      {/* Bandeau info fiscal */}
      <div className="flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl">
        <Info size={15} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-blue-400/80 text-sm">
          Les paramètres fiscaux (taux CNSS, ITS, barèmes) sont configurés par votre cabinet comptable.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-white/3 border border-white/8 rounded-xl p-1 w-fit">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${tab === t.key ? 'bg-white/10 text-white font-medium' : 'text-gray-500 hover:text-white'}`}>
            <t.icon size={13} /> {t.label}
          </button>
        ))}
      </div>

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
              ['Raison sociale', 'legalName'],['Nom commercial','tradeName'],
              ['Téléphone','phone'],['Email','email'],
              ['Adresse','address'],['Ville','city'],
            ].map(([label, key]) => (
              <div key={key}>
                <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
                <input value={company[key] || ''} onChange={e => setCompany({ ...company, [key]: e.target.value })} className={inputClass} />
              </div>
            ))}
          </div>
          <button onClick={saveCompany} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50 text-white rounded-xl text-sm transition-colors">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
          </button>
        </div>
      )}

      {/* Géoloc */}
      {tab === 'geoloc' && (
        <div className="bg-white/3 border border-white/8 rounded-2xl p-5 space-y-4 max-w-2xl">
          <p className="text-gray-400 text-sm">Zone de pointage GPS</p>
          <div className="grid grid-cols-2 gap-3">
            {[['Latitude','latitude','0.000001'],['Longitude','longitude','0.000001'],['Rayon (m)','allowedRadius','1']].map(([l,k,s]) => (
              <div key={k}>
                <label className="block text-xs text-gray-400 mb-1.5">{l}</label>
                <input type="number" step={s} value={(geo as any)[k]}
                  onChange={e => setGeo({ ...geo, [k]: parseFloat(e.target.value) || 0 })} className={inputClass} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => navigator.geolocation?.getCurrentPosition(p => setGeo(g => ({ ...g, latitude: p.coords.latitude, longitude: p.coords.longitude })))}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors">
              <MapPin size={13} /> Ma position
            </button>
            <button onClick={saveGeo} disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-white/10 hover:bg-white/15 border border-white/10 disabled:opacity-50 text-white rounded-xl text-sm transition-colors">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Primes */}
      {tab === 'primes' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between">
            <p className="text-gray-400 text-sm">Templates de primes récurrentes</p>
            <button onClick={() => setShowPrime(!showPrime)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-colors">
              + Ajouter
            </button>
          </div>
          {showPrime && (
            <div className="bg-white/3 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs text-gray-400 mb-1.5">Libellé *</label>
                  <input value={primeForm.name} onChange={e => setPrimeForm({ ...primeForm, name: e.target.value })} className={inputClass} /></div>
                <div><label className="block text-xs text-gray-400 mb-1.5">Montant (F)</label>
                  <input type="number" value={primeForm.value} onChange={e => setPrimeForm({ ...primeForm, value: parseFloat(e.target.value) || 0 })} className={inputClass} /></div>
              </div>
              <div className="flex gap-4 text-sm text-gray-400">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={primeForm.isTaxable} onChange={e => setPrimeForm({ ...primeForm, isTaxable: e.target.checked })} /> Imposable</label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={primeForm.isCnss} onChange={e => setPrimeForm({ ...primeForm, isCnss: e.target.checked })} /> CNSS</label>
              </div>
              <div className="flex gap-2">
                <button onClick={addPrime} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-sm font-medium">Ajouter</button>
                <button onClick={() => setShowPrime(false)} className="px-4 py-2 bg-white/5 text-gray-400 rounded-xl text-sm">Annuler</button>
              </div>
            </div>
          )}
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {primes.length === 0 ? <div className="py-8 text-center text-gray-500 text-sm">Aucun template</div>
              : <div className="divide-y divide-white/5">{primes.map(p => (
                  <div key={p.id} className="px-5 py-3.5 flex justify-between">
                    <div><p className="text-sm text-white font-medium">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.value ? `${p.value.toLocaleString('fr-FR')} F` : 'Variable'} · {p.isTaxable ? 'Imposable' : 'Non imposable'}</p></div>
                    <button onClick={async () => { await api.delete(`/bonus-templates/${p.id}`); setPrimes(x => x.filter(t => t.id !== p.id)); }} className="text-xs text-gray-600 hover:text-red-400 transition-colors">Supprimer</button>
                  </div>
                ))}</div>}
          </div>
        </div>
      )}

      {/* Départements */}
      {tab === 'departements' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex gap-2">
            <input value={deptName} onChange={e => setDeptName(e.target.value)} onKeyDown={e => e.key === 'Enter' && addDept()} placeholder="Nom du département" className={`flex-1 ${inputClass}`} />
            <button onClick={addDept} disabled={!deptName.trim()} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl text-sm font-medium">Ajouter</button>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {depts.length === 0 ? <div className="py-8 text-center text-gray-500 text-sm">Aucun département</div>
              : <div className="divide-y divide-white/5">{depts.map(d => (
                  <div key={d.id} className="px-5 py-3.5 flex justify-between">
                    <div className="flex items-center gap-2.5"><Network size={14} className="text-gray-500" /><span className="text-sm text-white">{d.name}</span></div>
                    <span className="text-xs text-gray-600">{d._count?.employees ?? 0} employé(s)</span>
                  </div>
                ))}</div>}
          </div>
        </div>
      )}

      {/* Utilisateurs */}
      {tab === 'users' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex justify-between items-center">
            <p className="text-gray-400 text-sm">{users.length} utilisateur{users.length > 1 ? 's' : ''} avec accès à l'application</p>
            <button onClick={() => router.push(`/pme/${companyId}/parametres/users`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl text-xs font-medium transition-colors">
              <Users size={12} /> Gérer les accès
            </button>
          </div>
          <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
            {users.length === 0 ? <div className="py-8 text-center text-gray-500 text-sm">Aucun utilisateur</div>
              : <div className="divide-y divide-white/5">{users.slice(0, 10).map((u: any) => (
                  <div key={u.id} className="px-5 py-3.5 flex justify-between">
                    <div><p className="text-sm text-white">{u.firstName} {u.lastName}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                    <span className="text-xs text-gray-400 capitalize">{u.role?.toLowerCase().replace('_',' ')}</span>
                  </div>
                ))}</div>}
          </div>
        </div>
      )}
    </div>
  );
}