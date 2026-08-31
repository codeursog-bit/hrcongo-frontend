'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Users, TrendingUp, Building2, Loader2, Check, X, Pencil,
  Briefcase, Bell, ChevronDown, ChevronUp, Phone, AlertCircle,
  CheckCircle2, Clock, XCircle, Settings, RefreshCw, FileText, Zap,
} from 'lucide-react';

interface WithdrawalRequest {
  id: string; amount: number;
  status: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED';
  disbursementId?: string; disbursementStatus?: string;
  paidAt?: string; paymentNote?: string; rejectionReason?: string;
  createdAt: string;
  affiliate: {
    id: string; firstName: string; lastName: string;
    email: string; phone?: string; disbursementPhone?: string;
    commissionRate: number;
  };
}

interface Affiliate {
  id: string; firstName: string; lastName: string;
  email: string; phone?: string; disbursementPhone?: string;
  referralCode: string; commissionRate: number; isActive: boolean;
  totalCompanies: number; totalCabinets: number;
  pendingCompany: number; pendingCabinet: number; totalPending: number;
  paidCompany: number; paidCabinet: number; totalPaid: number; totalEarned: number;
  threshold: number; thresholdReached: boolean;
  pendingWithdrawal?: { id: string; amount: number; status: string; createdAt: string } | null;
  createdAt: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat('fr-CG', { style: 'currency', currency: 'XAF', minimumFractionDigits: 0 }).format(n);
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; label: string; icon: React.ReactNode }> = {
    PENDING:  { cls: 'bg-amber-900/30 text-amber-400 border-amber-800/50',  label: 'En attente',  icon: <Clock className="w-3 h-3" /> },
    APPROVED: { cls: 'bg-blue-900/30 text-blue-400 border-blue-800/50',     label: 'Yabetoo J+1', icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    PAID:     { cls: 'bg-green-900/30 text-green-400 border-green-800/50',  label: 'Versé',       icon: <CheckCircle2 className="w-3 h-3" /> },
    REJECTED: { cls: 'bg-red-900/30 text-red-400 border-red-800/50',        label: 'Rejeté',      icon: <XCircle className="w-3 h-3" /> },
  };
  const { cls, label, icon } = map[status] ?? { cls: 'bg-gray-800 text-gray-400 border-gray-700', label: status, icon: null };
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${cls}`}>
      {icon}{label}
    </span>
  );
}

export default function AffiliatesAdminPage() {
  const API = process.env.NEXT_PUBLIC_API_URL;
  const [tab, setTab] = useState<'withdrawals' | 'affiliates'>('withdrawals');
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loadingAff, setLoadingAff] = useState(true);
  const [loadingWd, setLoadingWd] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState(10);
  const [savingRate, setSavingRate] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [threshold, setThreshold] = useState(15_000);
  const [editThreshold, setEditThreshold] = useState(false);
  const [newThreshold, setNewThreshold] = useState(15_000);
  const [savingThreshold, setSavingThreshold] = useState(false);

  const [distributing, setDistributing] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [paymentNote, setPaymentNote] = useState('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [savingReject, setSavingReject] = useState(false);

  const fetchAffiliates = useCallback(async () => {
    setLoadingAff(true);
    try {
      const r = await fetch(`${API}/affiliate/admin/all`, { credentials: 'include' });
      setAffiliates(await r.json());
    } catch { setError('Impossible de charger les affiliés.'); }
    finally { setLoadingAff(false); }
  }, [API]);

  const fetchWithdrawals = useCallback(async () => {
    setLoadingWd(true);
    try {
      const r = await fetch(`${API}/affiliate/admin/withdrawals/pending`, { credentials: 'include' });
      setWithdrawals(await r.json());
    } catch { setError('Impossible de charger les demandes.'); }
    finally { setLoadingWd(false); }
  }, [API]);

  const fetchThreshold = useCallback(async () => {
    try {
      const r = await fetch(`${API}/affiliate/admin/threshold`, { credentials: 'include' });
      if (r.ok) { const d = await r.json(); setThreshold(d.threshold); setNewThreshold(d.threshold); }
    } catch {}
  }, [API]);

  useEffect(() => { fetchAffiliates(); fetchWithdrawals(); fetchThreshold(); }, []);

  const refresh = () => { fetchAffiliates(); fetchWithdrawals(); };
  const showOk = (msg: string) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 8000); };
  const showError = (msg: string) => { setError(msg); setTimeout(() => setError(''), 8000); };

  const handleSaveThreshold = async () => {
    setSavingThreshold(true);
    try {
      await fetch(`${API}/affiliate/admin/threshold`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: newThreshold }),
      });
      setThreshold(newThreshold); setEditThreshold(false); fetchAffiliates();
    } finally { setSavingThreshold(false); }
  };

  const handleSaveRate = async (id: string) => {
    setSavingRate(true);
    try {
      await fetch(`${API}/affiliate/admin/${id}/commission-rate`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commissionRate: newRate }),
      });
      setEditingId(null); fetchAffiliates();
    } finally { setSavingRate(false); }
  };

  const handleToggle = async (id: string, current: boolean) => {
    setTogglingId(id);
    try {
      await fetch(`${API}/affiliate/admin/${id}/toggle`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !current }),
      });
      fetchAffiliates();
    } finally { setTogglingId(null); }
  };

  const handleDistribute = async (id: string) => {
    setDistributing(id);
    try {
      const r = await fetch(`${API}/affiliate/admin/withdrawals/${id}/distribute`, {
        method: 'POST', credentials: 'include',
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Erreur Yabetoo');
      showOk(`⚡ Yabetoo — ${data.affiliateName} — ${fmt(data.amount)} planifié (J+1). ID: ${data.disbursementId}`);
      refresh();
    } catch (e: any) { showError(e.message); }
    finally { setDistributing(null); }
  };

  const handleMarkPaidClick = (id: string) => { setMarkingId(id); setPaymentNote(''); setRejectingId(null); };

  const handleConfirmPaid = async (id: string) => {
    setConfirmingId(id);
    try {
      const r = await fetch(`${API}/affiliate/admin/withdrawals/${id}/mark-paid`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentNote: paymentNote || undefined }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Erreur');
      showOk(`✅ Manuel — ${data.affiliateName} — ${fmt(data.amount)} versé. (${data.companyCount} PME + ${data.cabinetCount} cabinet)`);
      setMarkingId(null); setPaymentNote(''); refresh();
    } catch (e: any) { showError(e.message); }
    finally { setConfirmingId(null); }
  };

  const handleReject = async (id: string) => {
    setSavingReject(true);
    try {
      await fetch(`${API}/affiliate/admin/withdrawals/${id}/reject`, {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason || undefined }),
      });
      setRejectingId(null); setRejectReason(''); refresh();
    } finally { setSavingReject(false); }
  };

  const totalPendingAll = affiliates.reduce((s, a) => s + a.totalPending, 0);
  const totalPaidAll    = affiliates.reduce((s, a) => s + a.totalPaid, 0);
  const thresholdCount  = affiliates.filter(a => a.thresholdReached).length;
  const pendingReqCount = withdrawals.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🤝 Affiliés</h1>
          <p className="text-gray-400 text-sm mt-1">
            Commissions PME & Cabinet ·{' '}
            <span className="text-indigo-400"><Zap className="w-3 h-3 inline" /> Distribuer</span> = Yabetoo auto (J+1) ·{' '}
            <span className="text-gray-400"><FileText className="w-3 h-3 inline" /> Marquer versé</span> = manuel (fallback)
          </p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 flex items-center gap-3">
          <Settings className="w-4 h-4 text-gray-500" />
          {editThreshold ? (
            <div className="flex items-center gap-2">
              <input type="number" min={1000} step={500} value={newThreshold}
                onChange={e => setNewThreshold(Number(e.target.value))}
                className="w-28 px-2 py-1 text-sm bg-gray-800 border border-indigo-600 rounded text-white text-center focus:outline-none" />
              <span className="text-xs text-gray-500">XAF</span>
              <button onClick={handleSaveThreshold} disabled={savingThreshold}
                className="p-1.5 bg-indigo-600 hover:bg-indigo-700 rounded text-white disabled:opacity-50">
                {savingThreshold ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              </button>
              <button onClick={() => setEditThreshold(false)} className="p-1.5 bg-gray-700 rounded text-gray-300"><X className="w-3 h-3" /></button>
            </div>
          ) : (
            <button onClick={() => setEditThreshold(true)} className="flex items-center gap-1.5 text-sm text-gray-300 hover:text-white group">
              <span className="text-xs text-gray-500">Seuil :</span>
              <span className="font-semibold text-amber-400">{fmt(threshold)}</span>
              <Pencil className="w-3 h-3 text-gray-600 group-hover:text-indigo-400 transition-colors" />
            </button>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Affiliés actifs', value: `${affiliates.filter(a => a.isActive).length}/${affiliates.length}`, icon: <Users className="w-4 h-4 text-indigo-400" />, accent: 'text-white' },
          { label: 'PME apportées', value: String(affiliates.reduce((s, a) => s + a.totalCompanies, 0)), icon: <Building2 className="w-4 h-4 text-blue-400" />, accent: 'text-white' },
          { label: 'Cabinets apportés', value: String(affiliates.reduce((s, a) => s + a.totalCabinets, 0)), icon: <Briefcase className="w-4 h-4 text-purple-400" />, accent: 'text-white' },
          { label: 'À verser', value: fmt(totalPendingAll), icon: <TrendingUp className="w-4 h-4 text-amber-400" />, accent: 'text-amber-400' },
          { label: 'Total versé', value: fmt(totalPaidAll), icon: <CheckCircle2 className="w-4 h-4 text-green-400" />, accent: 'text-green-400' },
        ].map(k => (
          <div key={k.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-1.5 bg-gray-800 rounded-lg">{k.icon}</div>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider font-medium leading-tight">{k.label}</p>
            </div>
            <p className={`text-xl font-bold ${k.accent}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Messages */}
      {error && (
        <div className="bg-red-900/20 border border-red-900/50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-red-400 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}</span>
          <button onClick={() => setError('')}><X className="w-4 h-4 text-red-400" /></button>
        </div>
      )}
      {successMsg && (
        <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-4 flex items-center justify-between">
          <span className="text-green-400 text-sm">{successMsg}</span>
          <button onClick={() => setSuccessMsg('')}><X className="w-4 h-4 text-green-400" /></button>
        </div>
      )}

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-900/60 border border-gray-800 rounded-xl p-1 w-fit">
        <button onClick={() => setTab('withdrawals')}
          className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'withdrawals' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}>
          <Bell className="w-4 h-4" />Demandes
          {pendingReqCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{pendingReqCount}</span>
          )}
        </button>
        <button onClick={() => setTab('affiliates')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${tab === 'affiliates' ? 'bg-white text-gray-900' : 'text-gray-400 hover:text-gray-200'}`}>
          <Users className="w-4 h-4" />Affiliés ({affiliates.length})
          {thresholdCount > 0 && <span className="bg-amber-500/20 text-amber-400 text-xs px-1.5 py-0.5 rounded-full border border-amber-800/40">{thresholdCount} seuil</span>}
        </button>
      </div>

      {/* ═══════ DEMANDES ═══════ */}
      {tab === 'withdrawals' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-white">Demandes de retrait</h2>
              <p className="text-xs text-gray-500 mt-1">
                <span className="text-indigo-400 font-medium"><Zap className="w-3 h-3 inline mr-1" />Distribuer</span> = Yabetoo verse automatiquement (J+1) ·{' '}
                <span className="text-gray-400 font-medium"><FileText className="w-3 h-3 inline mr-1" />Marquer versé</span> = vous avez viré manuellement
              </p>
            </div>
            <button onClick={fetchWithdrawals} className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {loadingWd ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 text-indigo-500 animate-spin" /></div>
          ) : withdrawals.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-10 h-10 text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Aucune demande en attente.</p>
              <p className="text-xs text-gray-600 mt-1">Seuil requis : {fmt(threshold)}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {withdrawals.map(wd => (
                <div key={wd.id} className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center shrink-0">
                          <span className="text-white font-bold text-sm">{wd.affiliate.firstName[0]}{wd.affiliate.lastName[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{wd.affiliate.firstName} {wd.affiliate.lastName}</p>
                          <p className="text-xs text-gray-500">{wd.affiliate.email}</p>
                        </div>
                        <StatusBadge status={wd.status} />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 ml-13">
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {wd.affiliate.disbursementPhone || wd.affiliate.phone
                            ? <span className="text-gray-300 font-mono">{wd.affiliate.disbursementPhone || wd.affiliate.phone}</span>
                            : <span className="text-red-400 font-medium">⚠ Aucun numéro</span>}
                        </span>
                        <span>Le <span className="text-gray-300">{fmtDate(wd.createdAt)}</span></span>
                        <span>Taux <span className="text-gray-300">{wd.affiliate.commissionRate}%</span></span>
                        {wd.disbursementId && (
                          <span className="font-mono text-[10px] text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">Yabetoo: {wd.disbursementId}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-amber-400">{fmt(wd.amount)}</p>
                        <p className="text-xs text-gray-600">PME + Cabinet</p>
                      </div>

                      {wd.status === 'PENDING' && markingId !== wd.id && rejectingId !== wd.id && (
                        <div className="flex items-center gap-2 flex-wrap justify-end">
                          <button onClick={() => setRejectingId(wd.id)}
                            className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-900/50 rounded-lg text-xs font-medium">
                            Rejeter
                          </button>
                          <button onClick={() => handleMarkPaidClick(wd.id)}
                            title="Vous avez effectué le virement manuellement"
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 border border-gray-600 rounded-lg text-xs font-medium transition-colors">
                            <FileText className="w-3.5 h-3.5" />Marquer versé
                          </button>
                          <button
                            onClick={() => handleDistribute(wd.id)}
                            disabled={distributing === wd.id || (!wd.affiliate.disbursementPhone && !wd.affiliate.phone)}
                            title={!wd.affiliate.disbursementPhone && !wd.affiliate.phone ? 'Numéro Mobile Money manquant' : 'Versement automatique Yabetoo — exécution J+1'}
                            className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/30">
                            {distributing === wd.id ? <><Loader2 className="w-4 h-4 animate-spin" />Envoi…</> : <><Zap className="w-4 h-4" />Distribuer</>}
                          </button>
                        </div>
                      )}

                      {wd.status === 'APPROVED' && (
                        <div className="text-right space-y-1">
                          <p className="text-xs text-blue-400 flex items-center justify-end gap-1.5">
                            <Loader2 className="w-3 h-3 animate-spin" />Yabetoo en traitement (J+1)
                          </p>
                          <button onClick={() => handleMarkPaidClick(wd.id)}
                            className="text-[10px] text-gray-600 hover:text-gray-400 underline">
                            Forcer manuellement si problème
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {wd.status === 'PENDING' && !wd.affiliate.disbursementPhone && !wd.affiliate.phone && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-red-400 bg-red-900/20 border border-red-900/40 rounded-lg px-3 py-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      Numéro Mobile Money manquant — distribution Yabetoo désactivée. Utilisez "Marquer versé".
                    </div>
                  )}

                  {markingId === wd.id && (
                    <div className="mt-4 bg-gray-800/40 border border-gray-700/50 rounded-xl p-4">
                      <p className="text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />Versement manuel — confirmation
                      </p>
                      <p className="text-xs text-gray-500 mb-3">
                        Vous avez envoyé <span className="text-amber-400 font-bold">{fmt(wd.amount)}</span>{' '}
                        sur <span className="text-gray-300 font-mono">{wd.affiliate.disbursementPhone || wd.affiliate.phone || '—'}</span>.
                        Saisissez la référence (optionnel).
                      </p>
                      <div className="flex items-center gap-3">
                        <input type="text" value={paymentNote} onChange={e => setPaymentNote(e.target.value)}
                          placeholder="Référence (ex: MTN-TXN-20250101-123456)"
                          className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-gray-500" />
                        <button onClick={() => handleConfirmPaid(wd.id)} disabled={confirmingId === wd.id}
                          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2 whitespace-nowrap">
                          {confirmingId === wd.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}Confirmer
                        </button>
                        <button onClick={() => setMarkingId(null)} className="p-2 text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}

                  {rejectingId === wd.id && (
                    <div className="mt-4 bg-red-900/10 border border-red-800/40 rounded-xl p-4">
                      <div className="flex items-center gap-3">
                        <input type="text" value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                          placeholder="Motif du rejet (optionnel)"
                          className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-red-800/50 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:ring-1 focus:ring-red-600" />
                        <button onClick={() => handleReject(wd.id)} disabled={savingReject}
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1 whitespace-nowrap">
                          {savingReject ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}Rejeter
                        </button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }} className="p-2 text-gray-500 hover:text-gray-300"><X className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════ AFFILIÉS ═══════ */}
      {tab === 'affiliates' && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Tous les affiliés</h2>
            <button onClick={fetchAffiliates} className="p-2 text-gray-500 hover:text-gray-300 rounded-lg hover:bg-gray-800"><RefreshCw className="w-4 h-4" /></button>
          </div>

          {loadingAff ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="w-7 h-7 text-indigo-500 animate-spin" /></div>
          ) : affiliates.length === 0 ? (
            <div className="py-16 text-center"><Users className="w-10 h-10 text-gray-700 mx-auto mb-3" /><p className="text-sm text-gray-500">Aucun affilié.</p></div>
          ) : (
            <div className="divide-y divide-gray-800/50">
              {affiliates.map(a => (
                <div key={a.id}>
                  <div className="grid grid-cols-[1fr_auto] gap-4 px-6 py-4 hover:bg-gray-800/20 cursor-pointer"
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}>
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${a.isActive ? 'bg-gradient-to-br from-indigo-600 to-purple-700' : 'bg-gray-800'}`}>
                        <span className={`font-bold text-sm ${a.isActive ? 'text-white' : 'text-gray-500'}`}>{a.firstName[0]}{a.lastName[0]}</span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-white">{a.firstName} {a.lastName}</p>
                          <span className="text-xs font-mono bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded border border-gray-700">{a.referralCode}</span>
                          {!a.isActive && <span className="text-xs text-gray-600 bg-gray-800 px-2 py-0.5 rounded-full">Inactif</span>}
                          {a.thresholdReached && (
                            <span className="text-xs font-medium text-amber-400 bg-amber-900/20 border border-amber-800/50 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Bell className="w-2.5 h-2.5" />Seuil atteint
                            </span>
                          )}
                          {a.pendingWithdrawal && <StatusBadge status={a.pendingWithdrawal.status} />}
                        </div>
                        <p className="text-xs text-gray-500 truncate">{a.email}</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          <span><Building2 className="w-3 h-3 inline mr-1" />{a.totalCompanies} PME</span>
                          <span><Briefcase className="w-3 h-3 inline mr-1" />{a.totalCabinets} cabinets</span>
                          <span className={`font-mono ${(a.disbursementPhone || a.phone) ? 'text-gray-500' : 'text-red-500'}`}>
                            {a.disbursementPhone || a.phone || '⚠ pas de numéro'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-5 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">En attente</p>
                        <p className="text-base font-bold text-amber-400">{fmt(a.totalPending)}</p>
                        <p className="text-[10px] text-gray-600">PME {fmt(a.pendingCompany)} · Cab {fmt(a.pendingCabinet)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-0.5">Versé</p>
                        <p className="text-base font-bold text-green-400">{fmt(a.totalPaid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 mb-1">Taux</p>
                        {editingId === a.id ? (
                          <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                            <input type="number" min={0} max={50} step={0.5} value={newRate}
                              onChange={e => setNewRate(Number(e.target.value))}
                              className="w-14 px-2 py-1 text-xs bg-gray-800 border border-indigo-600 rounded text-center text-white focus:outline-none" />
                            <span className="text-xs text-gray-500">%</span>
                            <button onClick={() => handleSaveRate(a.id)} disabled={savingRate}
                              className="p-1.5 bg-indigo-600 rounded text-white disabled:opacity-50">
                              {savingRate ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 bg-gray-700 rounded text-gray-300"><X className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={e => { e.stopPropagation(); setEditingId(a.id); setNewRate(a.commissionRate); }}
                            className="group flex items-center gap-1 text-sm font-bold text-gray-300 hover:text-indigo-400">
                            {a.commissionRate}%<Pencil className="w-3 h-3 text-gray-600 group-hover:text-indigo-400" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col items-center gap-2 pt-1">
                        <button onClick={e => { e.stopPropagation(); handleToggle(a.id, a.isActive); }}
                          disabled={togglingId === a.id}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium border transition-colors disabled:opacity-50 ${a.isActive ? 'bg-red-900/30 text-red-400 border-red-900/50' : 'bg-green-900/30 text-green-400 border-green-900/50'}`}>
                          {togglingId === a.id ? <Loader2 className="w-3 h-3 animate-spin inline" /> : a.isActive ? 'Désactiver' : 'Activer'}
                        </button>
                        {expandedId === a.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                      </div>
                    </div>
                  </div>

                  {expandedId === a.id && (
                    <div className="px-6 pb-5 bg-gray-800/20 border-t border-gray-800/50">
                      <div className="grid grid-cols-2 gap-6 pt-4">
                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Commissions détaillées</h3>
                          <div className="space-y-2">
                            {[
                              { label: 'PME — en attente', value: a.pendingCompany, accent: 'text-amber-400' },
                              { label: 'Cabinet — en attente', value: a.pendingCabinet, accent: 'text-amber-400' },
                              { label: 'PME — versé', value: a.paidCompany, accent: 'text-green-400' },
                              { label: 'Cabinet — versé', value: a.paidCabinet, accent: 'text-green-400' },
                            ].map(r => (
                              <div key={r.label} className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">{r.label}</span>
                                <span className={`font-semibold ${r.accent}`}>{fmt(r.value)}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-2 mt-2">
                              <span className="text-gray-300 font-medium">Total gagné</span>
                              <span className="font-bold text-white">{fmt(a.totalEarned)}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Numéro Mobile Money</h3>
                          <div className="space-y-2 text-xs mb-4">
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Contact</span>
                              <span className="text-gray-300 font-mono">{a.phone || '—'}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-gray-500">Disbursement Yabetoo</span>
                              <span className={`font-mono ${a.disbursementPhone ? 'text-green-400' : 'text-red-400'}`}>
                                {a.disbursementPhone || '⚠ Non renseigné'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-gray-500">Progression seuil</span>
                              <span className={a.thresholdReached ? 'text-green-400 font-semibold' : 'text-gray-400'}>
                                {Math.min(100, Math.round((a.totalPending / a.threshold) * 100))}%
                              </span>
                            </div>
                            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${a.thresholdReached ? 'bg-green-500' : 'bg-amber-500'}`}
                                style={{ width: `${Math.min(100, (a.totalPending / a.threshold) * 100)}%` }} />
                            </div>
                            <p className="text-[10px] text-gray-600 mt-1">{fmt(a.totalPending)} / {fmt(a.threshold)}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}