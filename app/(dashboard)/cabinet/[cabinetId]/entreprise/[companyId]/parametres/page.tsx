'use client';

// app/(dashboard)/cabinet/[cabinetId]/entreprise/[companyId]/parametres/page.tsx
// API INCHANGÉE — UX améliorée

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/services/api';
import {
  C, Ico, Card, Badge, Btn,
  PageHeader, SectionHeader, TabBar, InputField,
  LoadingInline, Banner,
} from '@/components/cabinet/cabinet-ui';

type Tab = 'entreprise' | 'geoloc' | 'primes' | 'departements' | 'paie';

export default function CabinetEntrepriseParametresPage() {
  const params    = useParams();
  const companyId = params.companyId as string;

  const [tab,    setTab]    = useState<Tab>('entreprise');
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const [company,          setCompany]          = useState<any>(null);
  const [geo,              setGeo]              = useState({ latitude: 0, longitude: 0, allowedRadius: 100 });
  const [primes,           setPrimes]           = useState<any[]>([]);
  const [showPrimeForm,    setShowPrimeForm]    = useState(false);
  const [primeForm,        setPrimeForm]        = useState({ name: '', value: 0, isTaxable: true, isCnss: true });
  const [depts,            setDepts]            = useState<any[]>([]);
  const [deptName,         setDeptName]         = useState('');
  const [payrollSettings,  setPayrollSettings]  = useState<any>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/companies/${companyId}`) as Promise<any>,
      api.get(`/bonus-templates?companyId=${companyId}`) as Promise<any>,
      api.get(`/departments?companyId=${companyId}`) as Promise<any>,
    ]).then(([comp, primesRes, deptsRes]) => {
      setCompany(comp);
      setGeo({ latitude: comp.latitude ?? 0, longitude: comp.longitude ?? 0, allowedRadius: comp.allowedRadius ?? 100 });
      setPrimes(Array.isArray(primesRes) ? primesRes : primesRes?.data ?? []);
      setDepts(Array.isArray(deptsRes) ? deptsRes : deptsRes?.data ?? []);
    }).catch(() => null);

    api.get(`/payroll-settings?companyId=${companyId}`)
      .then((ps: any) => setPayrollSettings(ps))
      .catch(() => null);
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
      setShowPrimeForm(false);
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

  const TABS: { key: Tab; label: string }[] = [
    { key: 'entreprise',   label: 'Entreprise'       },
    { key: 'geoloc',       label: 'Géolocalisation'  },
    { key: 'primes',       label: 'Primes'           },
    { key: 'departements', label: 'Départements'     },
    { key: 'paie',         label: 'Paramètres paie'  },
  ];

  if (!company) return <LoadingInline />;

  return (
    <div className="p-6 space-y-5" style={{ minHeight: '100vh', background: C.pageBg }}>

      <PageHeader
        title="Paramètres PME"
        sub="Configuration de l'entreprise cliente"
        icon={<Ico.Settings size={18} color={C.cyan} />}
      />

      <TabBar tabs={TABS} active={tab} onChange={setTab} />

      {/* Feedback */}
      {saved && (
        <Banner
          icon={<Ico.Check size={16} color={C.emerald} />}
          title="Modifications sauvegardées"
          color={C.emerald}
        />
      )}
      {error && (
        <Banner
          icon={<Ico.Alert size={16} color={C.red} />}
          title={error}
          color={C.red}
        />
      )}

      {/* ── Entreprise ── */}
      {tab === 'entreprise' && (
        <Card className="p-5 max-w-2xl">
          <SectionHeader title="Informations générales" sub="Raison sociale, coordonnées de la PME" />
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Raison sociale *', key: 'legalName' },
                { label: 'Nom commercial',   key: 'tradeName'  },
                { label: 'Téléphone',        key: 'phone'      },
                { label: 'Email',            key: 'email'      },
                { label: 'Adresse',          key: 'address'    },
                { label: 'Ville',            key: 'city'       },
              ].map(f => (
                <InputField
                  key={f.key}
                  label={f.label}
                  value={company[f.key] || ''}
                  onChange={e => setCompany({ ...company, [f.key]: e.target.value })}
                />
              ))}
            </div>
            <Btn
              variant="primary"
              icon={saving ? <Ico.Loader size={13} color="#fff" /> : <Ico.Check size={13} color="#fff" />}
              onClick={saveCompany}
              disabled={saving}
            >
              Sauvegarder
            </Btn>
          </div>
        </Card>
      )}

      {/* ── Géolocalisation ── */}
      {tab === 'geoloc' && (
        <Card className="p-5 max-w-2xl">
          <SectionHeader title="Zone de pointage GPS" sub="Rayon autorisé pour le pointage des employés" />
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Latitude',       key: 'latitude',      type: 'number', step: '0.000001' },
                { label: 'Longitude',      key: 'longitude',     type: 'number', step: '0.000001' },
                { label: 'Rayon (mètres)', key: 'allowedRadius', type: 'number' },
              ].map(f => (
                <InputField
                  key={f.key}
                  label={f.label}
                  type={f.type}
                  step={f.step}
                  value={(geo as any)[f.key]}
                  onChange={e => setGeo({ ...geo, [f.key]: parseFloat(e.target.value) || 0 })}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <Btn
                variant="ghost"
                icon={<Ico.MapPin size={13} color={C.textSecondary} />}
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(p => setGeo(g => ({
                    ...g, latitude: p.coords.latitude, longitude: p.coords.longitude,
                  })));
                }}
              >
                Ma position
              </Btn>
              <Btn
                variant="primary"
                icon={saving ? <Ico.Loader size={13} color="#fff" /> : <Ico.Check size={13} color="#fff" />}
                onClick={saveGeo}
                disabled={saving}
              >
                Sauvegarder
              </Btn>
            </div>
          </div>
        </Card>
      )}

      {/* ── Primes ── */}
      {tab === 'primes' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: C.textSecondary }}>Templates de primes récurrentes</p>
            <Btn
              variant="ghost"
              size="sm"
              icon={<Ico.Plus size={12} color={C.textSecondary} />}
              onClick={() => setShowPrimeForm(!showPrimeForm)}
            >
              Ajouter
            </Btn>
          </div>

          {showPrimeForm && (
            <Card className="p-5 space-y-4">
              <p className="text-sm font-semibold" style={{ color: C.textPrimary }}>Nouveau template</p>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Libellé *"
                  value={primeForm.name}
                  onChange={e => setPrimeForm({ ...primeForm, name: e.target.value })}
                  placeholder="Prime transport"
                />
                <InputField
                  label="Montant (F)"
                  type="number"
                  value={primeForm.value}
                  onChange={e => setPrimeForm({ ...primeForm, value: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div className="flex gap-5">
                {[
                  { key: 'isTaxable', label: 'Imposable (ITS)' },
                  { key: 'isCnss',    label: 'CNSS' },
                ].map(ck => (
                  <label key={ck.key} className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: C.textSecondary }}>
                    <input
                      type="checkbox"
                      checked={(primeForm as any)[ck.key]}
                      onChange={e => setPrimeForm({ ...primeForm, [ck.key]: e.target.checked })}
                      className="rounded"
                    />
                    {ck.label}
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Btn variant="primary" size="sm" onClick={addPrime}>Ajouter</Btn>
                <Btn variant="ghost" size="sm" onClick={() => setShowPrimeForm(false)}>Annuler</Btn>
              </div>
            </Card>
          )}

          <Card>
            {primes.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: C.textMuted }}>
                Aucun template de prime
              </div>
            ) : (
              <div>
                {primes.map((p, i) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < primes.length - 1 ? `1px solid ${C.border}` : 'none' }}
                  >
                    <div>
                      <p className="text-sm font-medium" style={{ color: C.textPrimary }}>{p.name}</p>
                      <p className="text-xs mt-0.5 flex items-center gap-2" style={{ color: C.textMuted }}>
                        <span>{p.value > 0 ? `${p.value.toLocaleString('fr-FR')} F` : 'Variable'}</span>
                        <Badge label={p.isTaxable ? 'ITS' : 'Non imposable'} variant={p.isTaxable ? 'warning' : 'default'} />
                        <Badge label={p.isCnss ? 'CNSS' : 'Hors CNSS'} variant={p.isCnss ? 'info' : 'default'} />
                      </p>
                    </div>
                    <button
                      onClick={() => deletePrime(p.id)}
                      className="p-1.5 rounded-lg transition-colors"
                      style={{ color: C.textMuted }}
                      onMouseEnter={e => (e.currentTarget.style.color = C.red)}
                      onMouseLeave={e => (e.currentTarget.style.color = C.textMuted)}
                    >
                      <Ico.Trash size={13} color="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Départements ── */}
      {tab === 'departements' && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex gap-2">
            <InputField
              placeholder="Nom du département"
              value={deptName}
              onChange={e => setDeptName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDept()}
              className="flex-1"
            />
            <Btn variant="primary" onClick={addDept} disabled={!deptName.trim()}>
              Ajouter
            </Btn>
          </div>

          <Card>
            {depts.length === 0 ? (
              <div className="py-10 text-center text-sm" style={{ color: C.textMuted }}>
                Aucun département
              </div>
            ) : (
              <div>
                {depts.map((d, i) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: i < depts.length - 1 ? `1px solid ${C.border}` : 'none' }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                      >
                        <Ico.Network size={12} color={C.indigoL} />
                      </div>
                      <span className="text-sm font-medium" style={{ color: C.textPrimary }}>{d.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: C.textMuted }}>
                      {d._count?.employees ?? 0} employé{(d._count?.employees ?? 0) > 1 ? 's' : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Paramètres paie ── */}
      {tab === 'paie' && payrollSettings && (
        <Card className="p-5 max-w-2xl">
          <SectionHeader title="Paramètres de paie" sub="Taux CNSS, heures supplémentaires, jours ouvrés" />
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Taux CNSS salarial (%)',  key: 'cnssSalarialRate' },
                { label: 'Taux CNSS patronal (%)',  key: 'cnssEmployerRate' },
                { label: 'H.Sup ×10% — taux (%)',  key: 'overtimeRate10'   },
                { label: 'H.Sup ×25% — taux (%)',  key: 'overtimeRate25'   },
                { label: 'H.Sup ×50% — taux (%)',  key: 'overtimeRate50'   },
                { label: 'Jours ouvrés / mois',     key: 'workDaysPerMonth' },
              ].map(f => (
                <InputField
                  key={f.key}
                  label={f.label}
                  type="number"
                  value={payrollSettings[f.key] ?? ''}
                  onChange={e => setPayrollSettings({ ...payrollSettings, [f.key]: parseFloat(e.target.value) || 0 })}
                />
              ))}
            </div>
            <Btn
              variant="primary"
              icon={saving ? <Ico.Loader size={13} color="#fff" /> : <Ico.Check size={13} color="#fff" />}
              onClick={savePayroll}
              disabled={saving}
            >
              Sauvegarder
            </Btn>
          </div>
        </Card>
      )}
    </div>
  );
}