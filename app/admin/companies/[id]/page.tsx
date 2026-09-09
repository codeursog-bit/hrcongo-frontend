// ============================================================================
// 🏢 PAGE DÉTAIL ENTREPRISE — Super Admin (CRUD complet)
// ============================================================================
// Fichier: frontend/app/admin/companies/[id]/page.tsx

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Building2, Mail, Phone, MapPin, Calendar,
  Users, CreditCard, Activity, Ban, PlayCircle, Archive,
  ArchiveRestore, Pencil, Loader2, X, AlertTriangle,
} from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

const PLANS = ['FREE', 'BASIC', 'PRO', 'ENTERPRISE'];

// ── Petit modal générique confirmation + raison optionnelle ─────────────────
function ConfirmModal({
  title, description, confirmLabel = 'Confirmer', danger = false,
  onConfirm, onClose,
}: {
  title: string; description?: string; confirmLabel?: string; danger?: boolean;
  onConfirm: (reason: string) => Promise<void>; onClose: () => void;
}) {
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-4">
          {description && <p className="text-sm text-gray-400">{description}</p>}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Raison (optionnel)</label>
            <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Annuler</button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); try { await onConfirm(reason); } finally { setSaving(false); } }}
            className={`px-5 py-2 text-sm font-bold rounded-lg flex items-center gap-2 disabled:opacity-50 ${
              danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}>
            {saving && <Loader2 size={14} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Modal d'édition des infos générales ──────────────────────────────────────
function EditCompanyModal({ company, onSave, onClose }: {
  company: any; onSave: (data: any) => Promise<void>; onClose: () => void;
}) {
  const [form, setForm] = useState({
    legalName: company.legalName ?? '',
    tradeName: company.tradeName ?? '',
    email: company.email ?? '',
    phone: company.phone ?? '',
    city: company.city ?? '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-gray-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Modifier l'entreprise</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Raison sociale</label>
              <input value={form.legalName} onChange={e => set('legalName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nom commercial</label>
              <input value={form.tradeName} onChange={e => set('tradeName', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <input value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Téléphone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Ville</label>
              <input value={form.city} onChange={e => set('city', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
            </div>
          </div>
        </div>
        <div className="p-5 border-t border-gray-800 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Annuler</button>
          <button
            disabled={saving}
            onClick={async () => { setSaving(true); try { await onSave(form); } finally { setSaving(false); } }}
            className="px-5 py-2 text-sm font-bold rounded-lg bg-brand-red hover:bg-red-700 text-white flex items-center gap-2 disabled:opacity-50">
            {saving && <Loader2 size={14} className="animate-spin" />}
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CompanyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [modal, setModal] = useState<null | 'edit' | 'archive' | 'suspend-sub' | 'plan' | 'extend'>(null);
  const [planChoice, setPlanChoice] = useState('PRO');
  const [extendDays, setExtendDays] = useState(30);

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

  useEffect(() => {
    if (companyId) loadCompanyDetails();
  }, [companyId]);

  const runAction = async (fn: () => Promise<any>) => {
    setBusy(true);
    try {
      await fn();
      await loadCompanyDetails();
      setModal(null);
    } catch (err: any) {
      alert(err.message || 'Erreur');
    } finally {
      setBusy(false);
    }
  };

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

  const isArchived = !!company.archivedAt;

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
              isArchived
                ? 'bg-gray-800 text-gray-400 border border-gray-700'
                : company.isActive
                ? 'bg-green-900/20 text-green-400 border border-green-900/50'
                : 'bg-red-900/20 text-red-400 border border-red-900/50'
            }`}>
              {isArchived ? 'Archivée' : company.isActive ? 'Active' : 'Suspendue'}
            </span>
          </div>
        </div>
      </div>

      {/* Bandeau archivage */}
      {isArchived && (
        <div className="flex items-start gap-3 bg-gray-800/50 border border-gray-700 rounded-xl p-4">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-sm text-gray-300">
            <p className="font-medium">Cette entreprise est archivée.</p>
            {company.archivedReason && (
              <p className="text-gray-500 mt-0.5">Raison : {company.archivedReason}</p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setModal('edit')}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm border border-gray-700">
          <Pencil className="w-4 h-4" />
          Modifier
        </button>

        {!isArchived && (
          <button
            onClick={() => runAction(() => adminService.updateCompanyStatus(companyId, !company.isActive))}
            disabled={busy}
            className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm border border-gray-700 disabled:opacity-50">
            {company.isActive ? <Ban className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
            {company.isActive ? 'Suspendre' : 'Réactiver'}
          </button>
        )}

        {isArchived ? (
          <button
            onClick={() => runAction(() => adminService.unarchiveCompany(companyId))}
            disabled={busy}
            className="flex items-center gap-2 bg-emerald-900/20 hover:bg-emerald-900/30 text-emerald-400 px-4 py-2 rounded-lg text-sm border border-emerald-900/50 disabled:opacity-50">
            <ArchiveRestore className="w-4 h-4" />
            Désarchiver
          </button>
        ) : (
          <button
            onClick={() => setModal('archive')}
            className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/30 text-red-400 px-4 py-2 rounded-lg text-sm border border-red-900/50">
            <Archive className="w-4 h-4" />
            Archiver
          </button>
        )}
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
                <div className="text-xs text-gray-500 uppercase">Statut abonnement</div>
                <div className="text-sm text-white">{company.subscription?.status || '—'}</div>
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
            </div>

            {/* Actions abonnement */}
            <div className="mt-5 pt-5 border-t border-gray-800 flex flex-wrap gap-2">
              <button
                onClick={() => runAction(() => adminService.activateSubscription(companyId))}
                disabled={busy}
                className="text-xs px-3 py-1.5 rounded-lg bg-emerald-900/20 text-emerald-400 border border-emerald-900/50 hover:bg-emerald-900/30 disabled:opacity-50">
                Activer
              </button>
              <button
                onClick={() => setModal('suspend-sub')}
                className="text-xs px-3 py-1.5 rounded-lg bg-amber-900/20 text-amber-400 border border-amber-900/50 hover:bg-amber-900/30">
                Suspendre / Annuler
              </button>
              <button
                onClick={() => setModal('plan')}
                className="text-xs px-3 py-1.5 rounded-lg bg-sky-900/20 text-sky-400 border border-sky-900/50 hover:bg-sky-900/30">
                Changer de plan
              </button>
              <button
                onClick={() => setModal('extend')}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700">
                Prolonger
              </button>
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
                <span className="text-xs text-gray-500 uppercase">Bulletins</span>
              </div>
              <div className="text-2xl font-bold text-white">{company.stats?.payrolls ?? 0}</div>
            </div>

            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-purple-500" />
                <span className="text-xs text-gray-500 uppercase">Congés</span>
              </div>
              <div className="text-2xl font-bold text-white">{company.stats?.leaves ?? 0}</div>
            </div>
          </div>

          {/* Compte créé */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-bold text-white mb-4">Informations</h3>
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

      {/* Modals */}
      {modal === 'edit' && (
        <EditCompanyModal
          company={company}
          onClose={() => setModal(null)}
          onSave={(data) => runAction(() => adminService.updateCompany(companyId, data))}
        />
      )}

      {modal === 'archive' && (
        <ConfirmModal
          title="Archiver l'entreprise"
          description="L'entreprise sera masquée de la liste principale et son accès désactivé. Aucune donnée n'est supprimée — vous pourrez la désarchiver à tout moment."
          confirmLabel="Archiver"
          danger
          onClose={() => setModal(null)}
          onConfirm={(reason) => runAction(() => adminService.archiveCompany(companyId, reason || undefined))}
        />
      )}

      {modal === 'suspend-sub' && (
        <ConfirmModal
          title="Suspendre l'abonnement"
          description="Passe l'abonnement en PAUSED. Utilisez la raison pour garder une trace (impayé, demande client, etc.)."
          confirmLabel="Suspendre"
          danger
          onClose={() => setModal(null)}
          onConfirm={(reason) => runAction(() => adminService.suspendSubscription(companyId, 'PAUSED', reason || undefined))}
        />
      )}

      {modal === 'plan' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Changer de plan</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
            </div>
            <div className="p-5">
              <select value={planChoice} onChange={e => setPlanChoice(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600">
                {PLANS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="p-5 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Annuler</button>
              <button
                disabled={busy}
                onClick={() => runAction(() => adminService.changeSubscriptionPlan(companyId, planChoice))}
                className="px-5 py-2 text-sm font-bold rounded-lg bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-2 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Appliquer
              </button>
            </div>
          </div>
        </div>
      )}

      {modal === 'extend' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white">Prolonger l'abonnement</h2>
              <button onClick={() => setModal(null)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
            </div>
            <div className="p-5">
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Nombre de jours</label>
              <input type="number" min={1} value={extendDays}
                onChange={e => setExtendDays(parseInt(e.target.value) || 1)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-gray-600" />
            </div>
            <div className="p-5 border-t border-gray-800 flex justify-end gap-3">
              <button onClick={() => setModal(null)} className="px-4 py-2 text-sm text-gray-400 hover:text-white">Annuler</button>
              <button
                disabled={busy}
                onClick={() => runAction(() => adminService.extendSubscription(companyId, extendDays))}
                className="px-5 py-2 text-sm font-bold rounded-lg bg-gray-700 hover:bg-gray-600 text-white flex items-center gap-2 disabled:opacity-50">
                {busy && <Loader2 size={14} className="animate-spin" />}
                Prolonger
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}