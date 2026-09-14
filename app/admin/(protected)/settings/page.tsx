'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings, Save, AlertTriangle, CheckCircle2, Loader2,
  RefreshCw, Info, Clock, BellRing,
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

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [msg, setMsg] = useState<{t:'ok'|'err';s:string}|null>(null);

  useEffect(() => {
    adminService.getSettings().then(d => { setSettings(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setMsg(null);
    try {
      await adminService.updateSettings({
        preShiftReminderMinutes: Number(settings?.preShiftReminderMinutes) || 20,
      });
      setMsg({ t: 'ok', s: 'Réglages sauvegardés avec succès' });
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
          <p className="text-gray-400 text-sm mt-0.5">Configuration globale de KonzaRH</p>
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

      <Section title="Rappel de pointage" icon={BellRing}>
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Minutes avant le début du shift
          </label>
          <input type="number" min={1} max={120}
            value={settings?.preShiftReminderMinutes ?? 20}
            onChange={e => setSettings((p: any) => ({ ...p, preShiftReminderMinutes: e.target.value }))}
            className="w-40 px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-white text-sm outline-none focus:border-red-500/50 transition-colors" />
          <p className="text-[11px] text-gray-600 mt-1.5">
            Toutes les entreprises reçoivent le rappel "n'oublie pas de pointer" ce nombre de
            minutes avant l'heure de début de shift configurée par chaque entreprise. Ce délai
            est le même pour toute la plateforme.
          </p>
        </div>
        {settings?.updatedAt && (
          <p className="text-[11px] text-gray-700">
            Dernière modification : {new Date(settings.updatedAt).toLocaleString('fr-FR')}
          </p>
        )}
      </Section>

      <Section title="Taux légaux (référence)" icon={Info}>
        <p className="text-xs text-gray-500 mb-2">
          Fixés par le Décret 78-360 — identiques pour toutes les entreprises par la loi,
          non modifiables depuis cet écran.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {[
            { l: 'CNSS salarié',  v: `${settings?.legalRates?.cnssSalarialRate}%` },
            { l: 'CNSS patronal', v: `${settings?.legalRates?.cnssEmployerRate}%` },
            { l: 'HS 10%/25%',    v: `${settings?.legalRates?.overtimeRate10}/${settings?.legalRates?.overtimeRate25}` },
            { l: 'HS 50%/100%',   v: `${settings?.legalRates?.overtimeRate50}/${settings?.legalRates?.overtimeRate100}` },
          ].map((r, i) => (
            <div key={i} className="bg-gray-800 rounded-xl p-3">
              <p className="text-[10px] text-gray-600 mb-1">{r.l}</p>
              <p className="text-sm font-bold text-white">{r.v}</p>
            </div>
          ))}
        </div>
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