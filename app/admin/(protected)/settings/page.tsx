'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Save, AlertTriangle, CheckCircle2, Loader2,
  Server, Shield, CreditCard, Bell, Database, Key, Globe,
  RefreshCw, Info, Clock,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center gap-2">
        <Icon size={16} className="text-red-500" />
        <p className="font-bold text-white text-sm">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', hint }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-red-500/50 transition-colors" />
      {hint && <p className="text-[11px] text-gray-700 mt-1">{hint}</p>}
    </div>
  );
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [msg, setMsg] = useState<{t:'ok'|'err';s:string}|null>(null);

  useEffect(() => {
    adminService.getSettings().then(d => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const set = (key: string, val: any) => setSettings((p: any) => ({ ...p, [key]: val }));

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminService.updateSettings?.(settings);
      setMsg({ t: 'ok', s: 'Paramètres sauvegardés avec succès' });
    } catch(e: any) { setMsg({ t: 'err', s: e.message || 'Erreur de sauvegarde' }); }
    finally { setSaving(false); setTimeout(() => setMsg(null), 4000); }
  };

  if (loading) return <div className="flex justify-center py-24"><Loader2 size={28} className="animate-spin text-red-500" /></div>;

  return (
    <div className="space-y-6 max-w-3xl">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Settings className="text-red-500" size={24} /> Paramètres Plateforme
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">Configuration globale de Konza RH SaaS</p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Sauvegarder
        </button>
      </div>

      {msg && (
        <div className={`flex items-center gap-2 p-3.5 rounded-xl border text-sm font-medium
          ${msg.t === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-red-500/10 border-red-500/20 text-red-300'}`}>
          {msg.t === 'ok' ? <CheckCircle2 size={15} /> : <AlertTriangle size={15} />} {msg.s}
        </div>
      )}

      <Section title="Informations plateforme" icon={Globe}>
        <Field label="Nom de la plateforme" value={settings?.platformName} onChange={(v: any) => set('platformName', v)} />
        <Field label="URL application" value={settings?.appUrl ?? process.env.NEXT_PUBLIC_APP_URL} onChange={(v: any) => set('appUrl', v)} hint="URL publique de l'application front-end" />
        <Field label="Email support" value={settings?.supportEmail} onChange={(v: any) => set('supportEmail', v)} type="email" />
      </Section>

      <Section title="Paramètres paie par défaut" icon={CreditCard}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Jours travaillés / mois" value={settings?.workDaysPerMonth} onChange={(v: any) => set('workDaysPerMonth', +v)} type="number" hint="Défaut Congo : 26 jours" />
          <Field label="Heures / jour" value={settings?.workHoursPerDay} onChange={(v: any) => set('workHoursPerDay', +v)} type="number" hint="Défaut Congo : 8h" />
          <Field label="Taux CNSS salarié (%)" value={settings?.cnssSalarialRate} onChange={(v: any) => set('cnssSalarialRate', +v)} type="number" hint="4% — Décret n°2009-392" />
          <Field label="Taux CNSS patronal (%)" value={settings?.cnssEmployerRate} onChange={(v: any) => set('cnssEmployerRate', +v)} type="number" hint="16.5% total (3 branches)" />
        </div>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2">
          <Info size={14} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-300">Ces valeurs s'appliquent uniquement aux nouvelles entreprises. Les entreprises existantes conservent leur propre configuration dans Paramètres → Paie.</p>
        </div>
      </Section>

      <Section title="Sécurité plateforme" icon={Shield}>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expiration session (heures)" value={settings?.sessionDurationH ?? 2} onChange={(v: any) => set('sessionDurationH', +v)} type="number" hint="JWT access token (défaut: 2h)" />
          <Field label="Tentatives login max" value={settings?.maxLoginAttempts ?? 10} onChange={(v: any) => set('maxLoginAttempts', +v)} type="number" hint="Avant verrouillage compte (défaut: 10)" />
        </div>
        <div className="bg-sky-500/5 border border-sky-500/20 rounded-xl p-3 flex items-start gap-2">
          <Shield size={14} className="text-sky-400 shrink-0 mt-0.5" />
          <p className="text-xs text-sky-300">Le 2FA est obligatoire pour ADMIN, HR_MANAGER et CABINET_ADMIN. Il ne peut pas être désactivé pour ces rôles depuis cette interface.</p>
        </div>
      </Section>

      <Section title="Rétention des logs" icon={Database}>
        <Field label="Durée de rétention audit (jours)" value={settings?.auditRetentionDays ?? 365} onChange={(v: any) => set('auditRetentionDays', +v)} type="number" hint="Recommandé : 365 jours minimum pour conformité" />
        <Field label="Nettoyage sessions expirées (jours)" value={settings?.sessionCleanupDays ?? 30} onChange={(v: any) => set('sessionCleanupDays', +v)} type="number" hint="Sessions révoquées supprimées après X jours" />
      </Section>

      <Section title="Maintenance base de données" icon={RefreshCw}>
        <div className="space-y-3">
          <div className="bg-gray-800 rounded-xl p-4 space-y-2 text-xs text-gray-400 leading-relaxed">
            <p>Le nettoyage automatique s'exécute chaque nuit :</p>
            <p>• <span className="text-amber-400">02h00</span> — Erreurs 4xx résolues (+7j) et anciennes (+30j), erreurs 500 (+90j)</p>
            <p>• <span className="text-sky-400">03h00</span> — Sessions expirées (+7j) et révoquées (+30j)</p>
            <p>• <span className="text-emerald-400">04h00</span> — Logs audit : INFO (+90j), WARN (+1an), CRITICAL (+2ans)</p>
            <p>• <span className="text-violet-400">Dimanche 01h00</span> — Rapport hebdomadaire dans les logs serveur</p>
          </div>
          <button
            onClick={async () => {
              if (!confirm('Lancer le nettoyage manuel maintenant ? Cette opération peut prendre quelques secondes.')) return;
              setCleaning(true);
              try {
                const r = await adminService.runCleanup?.();
                setMsg({ t: 'ok', s: `Nettoyage terminé — ${r?.errors ?? 0} erreurs, ${r?.sessions ?? 0} sessions, ${r?.auditLogs ?? 0} logs supprimés` });
              } catch(e: any) { setMsg({ t: 'err', s: e.message }); }
              finally { setCleaning(false); setTimeout(() => setMsg(null), 6000); }
            }}
            disabled={cleaning}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-800 border border-gray-700 hover:border-gray-500 text-gray-300 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {cleaning ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            {cleaning ? 'Nettoyage en cours…' : 'Lancer le nettoyage maintenant'}
          </button>
        </div>
      </Section>

    </div>
  );
}