'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Shield, ShieldCheck, ShieldOff, Key, Smartphone,
  CheckCircle2, XCircle, AlertTriangle, Eye, EyeOff,
  RefreshCw, Download, Filter, ChevronLeft, ChevronRight,
  Lock, Loader2, Copy, Clock, Globe, User as UserIcon,
  FileText, Trash2, LogOut, Settings, Zap, Activity,
  BarChart2, Calendar, CreditCard, Building2, Info,
  AlertCircle, CheckCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { KonzaLoader } from '@/components/ui/KonzaLoader';
import { SettingsFrame as ModulePageFrame } from '@/components/settings/SettingsFrame';

// ─── Types ─────────────────────────────────────────────────────────────────────
interface AuditLog {
  id:          string;
  action:      string;
  entity:      string;
  entityId:    string | null;
  description: string;
  createdAt:   string;
  metadata?: {
    severity?: string; ip?: string; duration?: number;
    method?: string;   path?: string;
    query?:  Record<string, any>;
    body?:   Record<string, any>;
    error?:  string;
  };
  user?: { id: string; email: string; firstName: string; lastName: string; role: string; };
}
interface AuditMeta  { total: number; page: number; limit: number; totalPages: number; }
interface AuditStats {
  period: string; total7d: number; critical: number;
  byAction: { action: string; count: number }[];
  byEntity: { entity: string; count: number }[];
}

// ─── Maps visuelles ────────────────────────────────────────────────────────────
const SEV_ROW: Record<string, string> = {
  CRITICAL: 'border-l-2 border-l-red-500/60',
  WARN:     'border-l-2 border-l-amber-500/40',
  INFO:     '',
};
const SEV_BADGE: Record<string, string> = {
  CRITICAL: 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)] border',
  WARN:     'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)] border',
  INFO:     'bg-[var(--brand-soft)] text-[var(--success-text)] border-[var(--border)] border',
};
const SEV_ICON_COLOR: Record<string, string> = {
  CRITICAL: 'text-[var(--danger-text)] bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]',
  WARN:     'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
  INFO:     'text-[var(--success-text)] bg-[var(--brand-soft)]',
};
const ENTITY_BADGE: Record<string, string> = {
  AUTH:'text-[var(--success-text)] bg-[var(--brand-soft)]', EMPLOYEE:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
  PAYROLL:'text-[var(--success-text)] bg-[var(--brand-soft)]', EXPORT:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
  LEAVE:'text-[var(--success-text)] bg-[var(--brand-soft)]', LOAN:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
  CONTRACT:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', USER:'text-[var(--success-text)] bg-[var(--brand-soft)]',
  COMPANY:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', CABINET:'text-[var(--success-text)] bg-[var(--brand-soft)]',
  SETTINGS:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', SUBSCRIPTION:'text-[var(--success-text)] bg-[var(--brand-soft)]',
  DOCUMENT:'text-[var(--text-secondary)] bg-[var(--surface-2)]', ATTENDANCE:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
  ASSET:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', RECRUITMENT:'text-[var(--success-text)] bg-[var(--brand-soft)]',
  TRAINING:'text-[var(--success-text)] bg-[var(--brand-soft)]', BONUS:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]',
  CNSS:'text-[var(--warning-text)] bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]', ONBOARDING:'text-[var(--success-text)] bg-[var(--brand-soft)]',
};
const ROLE_BADGE: Record<string, string> = {
  ADMIN:'bg-[var(--brand-soft)] text-[var(--success-text)] border-[var(--border)]',
  HR_MANAGER:'bg-[var(--brand-soft)] text-[var(--success-text)] border-[var(--border)]',
  MANAGER:'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]',
  EMPLOYEE:'bg-[var(--surface-2)] text-[var(--text-secondary)] border-[var(--border)]',
  CABINET_ADMIN:'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] border-[var(--border)]',
  SUPER_ADMIN:'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border-[var(--border)]',
};
const ACTION_ICON: Record<string, React.ElementType> = {
  LOGIN:Globe, LOGOUT:LogOut, REGISTER:UserIcon, CHANGE_PASSWORD:Key,
  RESET_PASSWORD:Key, '2FA_ACTIVATED':ShieldCheck, '2FA_DISABLED':ShieldOff,
  EMPLOYEE_CREATE:CheckCircle2, EMPLOYEE_UPDATE:Settings, EMPLOYEE_DELETE:Trash2,
  EMPLOYEE_IMPORT:Download, PAYROLL_CREATE:CheckCircle2, PAYROLL_GENERATE_BATCH:Zap,
  PAYROLL_UPDATE:Settings, PAYROLL_DELETE:Trash2, PAYROLL_RECALCULATE:RefreshCw,
  EXPORT_EXCEL:Download, EXPORT_SAGE:Download, EXPORT_ETAX:Download,
  EXPORT_CSV:Download, EXPORT_CNSS:Download, EXPORT_PDF_BATCH:Download,
  CONTRACT_RUPTURE:XCircle, LEAVE_CREATE:Calendar, LEAVE_STATUS:CheckCircle,
  USER_INVITE:UserIcon, USER_UPDATE:Settings, COMPANY_UPDATE:Building2,
  SUBSCRIPTION_UPGRADE:CreditCard, SUBSCRIPTION_CANCEL:AlertTriangle,
  SETTINGS_PAYROLL:Settings, CABINET_REMOVE_COMPANY:AlertTriangle,
  DOCUMENT_DOWNLOAD:Download, ATTENDANCE_MANUAL:Clock, ATTENDANCE_CORRECT:Settings,
  OVERTIME_APPROVE:CheckCircle2, LOAN_CREATE:CreditCard, ADVANCE_CREATE:CreditCard,
};

const fmtFull  = (d: string) => new Date(d).toLocaleString('fr-FR',
  { day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',second:'2-digit' });
const fmtShort = (d: string) => new Date(d).toLocaleString('fr-FR',
  { day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit' });
const sev      = (log: AuditLog) => log.metadata?.severity ?? 'INFO';

// ─── Page ──────────────────────────────────────────────────────────────────────
function SecuritePage() {
  const router = useRouter();
  const [tab, setTab] = useState<'2fa'|'audit'>('2fa');

  // 2FA state
  const [twoFaOn,    set2faOn]    = useState(false);
  const [loadingMe,  setLoadMe]   = useState(true);
  const [step,       setStep]     = useState<'idle'|'setup'|'backup'>('idle');
  const [qrUrl,      setQrUrl]    = useState('');
  const [manKey,     setManKey]   = useState('');
  const [code,       setCode]     = useState('');
  const [backup,     setBackup]   = useState<string[]>([]);
  const [showMan,    setShowMan]  = useState(false);
  const [copMan,     setCopMan]   = useState(false);
  const [copBak,     setCopBak]   = useState(false);
  const [showDis,    setShowDis]  = useState(false);
  const [disPwd,     setDisPwd]   = useState('');
  const [showPwd,    setShowPwd]  = useState(false);
  const [busy,       setBusy]     = useState(false);
  const [msg,        setMsg]      = useState<{t:'ok'|'err';s:string}|null>(null);
  const [role,       setRole]     = useState('');

  // Audit state
  const [logs,       setLogs]     = useState<AuditLog[]>([]);
  const [stats,      setStats]    = useState<AuditStats|null>(null);
  const [meta,       setMeta]     = useState<AuditMeta|null>(null);
  const [loading,    setLoading]  = useState(false);
  const [page,       setPage]     = useState(1);
  const [showFlt,    setShowFlt]  = useState(false);
  const [detail,     setDetail]   = useState<AuditLog|null>(null);
  const [flt, setFlt] = useState({ action:'', entity:'', severity:'', from:'', to:'' });

  // Init
  useEffect(() => {
    api.get<any>('/auth/me').then(me => {
      set2faOn(me.twoFactorEnabled ?? false);
      setRole(me.role ?? '');
    }).catch(()=>{}).finally(()=>setLoadMe(false));
  }, []);

  // Load logs
  const loadLogs = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ page: String(page), limit:'30' });
      if (flt.action)   p.set('action',   flt.action.toUpperCase());
      if (flt.entity)   p.set('entity',   flt.entity.toUpperCase());
      if (flt.severity) p.set('severity', flt.severity.toUpperCase());
      if (flt.from)     p.set('from',     flt.from);
      if (flt.to)       p.set('to',       flt.to);
      const r = await api.get<{data:AuditLog[];meta:AuditMeta}>(`/audit/logs?${p}`);
      setLogs(r.data??[]); setMeta(r.meta??null);
    } catch { setLogs([]); } finally { setLoading(false); }
  }, [page, flt]);

  const loadStats = useCallback(async () => {
    try { setStats(await api.get<AuditStats>('/audit/stats')); } catch {}
  }, []);

  useEffect(() => { if (tab==='audit') { loadLogs(); loadStats(); } }, [tab,page,flt,loadLogs,loadStats]);

  // 2FA actions
  const setup = async () => {
    setBusy(true); setMsg(null);
    try {
      const r = await api.post<any>('/auth/2fa/setup', {});
      setQrUrl(r.qrCodeUrl); setManKey(r.manualKey); setStep('setup');
    } catch(e:any){ setMsg({t:'err',s:e.message}); } finally { setBusy(false); }
  };
  const activate = async () => {
    if(code.length<6){ setMsg({t:'err',s:'Saisissez le code à 6 chiffres'}); return; }
    setBusy(true); setMsg(null);
    try {
      const r = await api.post<any>('/auth/2fa/activate',{code});
      setBackup(r.backupCodes??[]); set2faOn(true); setStep('backup');
    } catch(e:any){ setMsg({t:'err',s:e.message}); } finally { setBusy(false); }
  };
  const disable = async () => {
    if(!disPwd){ setMsg({t:'err',s:'Mot de passe requis'}); return; }
    setBusy(true); setMsg(null);
    try {
      await api.post('/auth/2fa/disable',{password:disPwd});
      set2faOn(false); setShowDis(false); setDisPwd(''); setStep('idle');
      setMsg({t:'ok',s:'2FA désactivé avec succès'});
    } catch(e:any){ setMsg({t:'err',s:e.message}); } finally { setBusy(false); }
  };

  const fltCount = Object.values(flt).filter(Boolean).length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 sm:px-6 space-y-6">

      {/* Header */}
      <div className="settings-page-header flex items-center gap-4">
        <button onClick={()=>router.back()}
          className="p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface)] transition-colors">
          <ChevronLeft size={18} className="text-[var(--text-secondary)]"/>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--brand-soft)] border border-[var(--border)] flex items-center justify-center">
            <Shield size={20} className="text-[var(--success-text)]"/>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-[var(--text)]">Sécurité du compte</h1>
            <p className="text-xs text-[var(--text-secondary)]  mt-0.5">2FA TOTP · Journal d'audit complet · Traçabilité</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-1 w-fit">
        {[{k:'2fa',l:'Auth. 2FA',I:Smartphone},{k:'audit',l:'Journal d\'audit',I:Activity}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab===t.k ? 'bg-[var(--surface)] text-[var(--text)] shadow' : 'text-[var(--text-secondary)] hover:text-[var(--text-secondary)]'}`}>
            <t.I size={14}/> {t.l}
          </button>
        ))}
      </div>

      {/* ══ 2FA ══════════════════════════════════════════════════════════════ */}
      {tab==='2fa' && (
        <div className="space-y-4 max-w-lg">

          {/* Statut */}
          <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4
            ${twoFaOn ? 'bg-[var(--brand-soft)] border-[var(--border)]' : 'bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] border-[var(--border)]'}`}>
            <div className="flex items-center gap-3">
              {twoFaOn ? <ShieldCheck size={30} className="text-[var(--success-text)] shrink-0"/> : <ShieldOff size={30} className="text-[var(--warning-text)] shrink-0"/>}
              <div>
                <p className={`font-semibold text-sm ${twoFaOn?'text-[var(--success-text)]':'text-[var(--warning-text)]'}`}>
                  {twoFaOn ? '2FA activé — Compte protégé' : '2FA désactivé — Compte vulnérable'}
                </p>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 leading-relaxed">
                  {twoFaOn ? 'Un code unique est demandé à chaque connexion sur un nouvel appareil.'
                           : 'Activez pour bloquer les accès non autorisés même en cas de vol de mot de passe.'}
                </p>
              </div>
            </div>
            {!loadingMe && !twoFaOn && step==='idle' && (
              <button onClick={setup} disabled={busy}
                className="shrink-0 px-4 py-2 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl font-semibold text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                {busy ? <Loader2 size={13} className="animate-spin"/> : <ShieldCheck size={13}/>}
                Activer
              </button>
            )}
          </div>

          {msg && (
            <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium
              ${msg.t==='ok' ? 'bg-[var(--brand-soft)] border border-[var(--border)] text-[var(--success-text)]'
                             : 'bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] text-[var(--danger-text)]'}`}>
              {msg.t==='ok' ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>}
              {msg.s}
            </div>
          )}

          {/* Setup */}
          {step==='setup' && (
            <div className="bg-[#0f1623] rounded-2xl border border-[var(--border)] p-6 space-y-6">

              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                  Étape 1 — Ouvrez votre app d'authentification
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Google Authenticator','Authy','Aegis','Microsoft Auth.'].map(a=>(
                    <span key={a} className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)]">{a}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                  Étape 2 — Scannez le QR code
                </p>
                {qrUrl && (
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-[var(--surface)] rounded-2xl shadow-xl ">
                      <img src={qrUrl} alt="2FA QR" className="w-44 h-44"/>
                    </div>
                  </div>
                )}
                <button onClick={()=>setShowMan(v=>!v)}
                  className="text-xs text-[var(--success-text)] hover:text-[var(--success-text)] flex items-center gap-1.5 transition-colors">
                  {showMan ? <EyeOff size={12}/> : <Eye size={12}/>}
                  {showMan ? 'Masquer la clé manuelle' : 'Entrer la clé manuellement'}
                </button>
                {showMan && (
                  <div className="mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex items-center gap-3">
                    <code className="font-mono text-[11px] text-[var(--success-text)] break-all flex-1 leading-relaxed">{manKey}</code>
                    <button onClick={()=>{navigator.clipboard.writeText(manKey);setCopMan(true);setTimeout(()=>setCopMan(false),2000);}}
                      className="p-2 rounded-lg bg-[var(--brand-soft)] text-[var(--success-text)] hover:bg-[var(--brand-soft)] transition-colors shrink-0">
                      {copMan?<CheckCircle2 size={13}/>:<Copy size={13}/>}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                  Étape 3 — Entrez le code affiché
                </p>
                <div className="flex gap-3">
                  <input type="text" inputMode="numeric" maxLength={6}
                    value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}
                    placeholder="000 000"
                    className="flex-1 px-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-center text-3xl font-mono font-semibold tracking-[0.5em] text-[var(--text)] placeholder:text-[var(--text)] outline-none focus:border-[var(--border)] transition-colors"/>
                  <button onClick={activate} disabled={busy||code.length<6}
                    className="px-5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl font-semibold text-sm disabled:opacity-40 transition-colors flex items-center gap-2 shrink-0">
                    {busy?<Loader2 size={13} className="animate-spin"/>:<ShieldCheck size={13}/>}
                    Valider
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup codes */}
          {step==='backup' && (
            <div className="bg-[#0f1623] rounded-2xl border border-[var(--border)] p-6 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={22} className="text-[var(--success-text)] shrink-0 mt-0.5"/>
                <div>
                  <p className="font-semibold text-[var(--text)] text-sm">2FA activé avec succès !</p>
                  <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">
                    Sauvegardez ces 8 codes dans un endroit sécurisé (gestionnaire de mots de passe, papier hors ligne).
                    Chaque code est à <span className="text-[var(--warning-text)] font-semibold">usage unique</span> — ils vous permettent de vous connecter si vous perdez votre téléphone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backup.map((c,i)=>(
                  <div key={i} className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg px-3 py-2.5">
                    <span className="text-[10px] text-[var(--text-secondary)]  font-mono w-4 shrink-0">{i+1}.</span>
                    <code className="font-mono text-sm font-semibold text-[var(--text)] tracking-widest">{c}</code>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={()=>{navigator.clipboard.writeText(backup.join('\n'));setCopBak(true);setTimeout(()=>setCopBak(false),2000);}}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-sm font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface)] transition-colors">
                  {copBak?<CheckCircle2 size={13} className="text-[var(--success-text)]"/>:<Copy size={13}/>}
                  {copBak?'Copié !':'Copier tout'}
                </button>
                <button onClick={()=>{setStep('idle');setCode('');setBackup([]);}}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[var(--brand)] hover:bg-[var(--brand)] text-[var(--on-brand)] rounded-xl text-sm font-semibold transition-colors">
                  <CheckCircle2 size={13}/> Codes sauvegardés
                </button>
              </div>
            </div>
          )}

          {/* Disable 2FA */}
          {twoFaOn && step==='idle' && (
            <div className="bg-[#0f1623] rounded-2xl border border-[var(--border)] p-5">
              <p className="font-semibold text-[var(--text)] text-sm mb-1">Désactiver le 2FA</p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-4">
                Action irréversible sans confirmation.
                {['ADMIN','HR_MANAGER','CABINET_ADMIN'].includes(role) &&
                  <span className="text-[var(--warning-text)]"> Votre rôle rend le 2FA obligatoire — la désactivation sera refusée par le serveur.</span>}
              </p>
              {!showDis ? (
                <button onClick={()=>setShowDis(true)}
                  className="px-4 py-2 rounded-xl border border-[var(--border)] text-[var(--danger-text)] text-sm font-semibold hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] transition-colors">
                  Désactiver
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input type={showPwd?'text':'password'} value={disPwd}
                      onChange={e=>setDisPwd(e.target.value)} placeholder="Confirmez votre mot de passe"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] text-sm outline-none focus:border-[var(--border)] pr-10 transition-colors"/>
                    <button onClick={()=>setShowPwd(v=>!v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]  hover:text-[var(--text-secondary)]">
                      {showPwd?<EyeOff size={14}/>:<Eye size={14}/>}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={disable} disabled={busy}
                      className="px-4 py-2 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--text)] rounded-xl font-semibold text-sm disabled:opacity-50 transition-colors">
                      {busy?<Loader2 size={13} className="animate-spin inline"/>:'Confirmer'}
                    </button>
                    <button onClick={()=>{setShowDis(false);setDisPwd('');}}
                      className="px-4 py-2 border border-[var(--border)] text-[var(--text-secondary)] rounded-xl text-sm hover:bg-[var(--surface)] transition-colors">
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ══ AUDIT ════════════════════════════════════════════════════════════ */}
      {tab==='audit' && (
        <div className="space-y-5">

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { I:Activity,      l:'Événements (7j)', v:stats.total7d.toLocaleString('fr-FR'), c:'text-[var(--success-text)]', sub:stats.period },
                { I:AlertTriangle, l:'Critiques (7j)',  v:stats.critical.toLocaleString('fr-FR'), c:'text-[var(--danger-text)]',
                  sub:stats.critical>0?'Vérification recommandée':'Aucun incident critique' },
                { I:Zap,           l:'Action fréquente', v:stats.byAction[0]?.action.replace(/_/g,' ')??'—', c:'text-[var(--warning-text)]',
                  sub:stats.byAction[0]?`${stats.byAction[0].count}× cette semaine`:'' },
                { I:BarChart2,     l:'Entité active',  v:stats.byEntity[0]?.entity??'—', c:'text-[var(--success-text)]',
                  sub:stats.byEntity[0]?`${stats.byEntity[0].count} actions`:''},
              ].map((s,i)=>(
                <div key={i} className="bg-[#0f1623] rounded-2xl border border-[var(--border)] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <s.I size={14} className={s.c}/>
                    <span className="text-[11px] text-[var(--text-secondary)]  font-medium">{s.l}</span>
                  </div>
                  <p className={`text-2xl font-semibold ${s.c} truncate`}>{s.v}</p>
                  {s.sub && <p className="text-[10px] text-[var(--text-secondary)]  mt-1 truncate">{s.sub}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Graphique top actions */}
          {stats && stats.byAction.length>0 && (
            <div className="bg-[#0f1623] rounded-2xl border border-[var(--border)] p-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]  mb-4">Répartition des actions — 7 jours</p>
              <div className="space-y-2.5">
                {stats.byAction.slice(0,7).map((a,i)=>{
                  const pct = Math.round((a.count/(stats.byAction[0]?.count||1))*100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-[var(--text-secondary)]  w-3 text-right">{i+1}</span>
                      <span className="text-xs text-[var(--text-secondary)] w-48 truncate">{a.action.replace(/_/g,' ')}</span>
                      <div className="flex-1 bg-[var(--surface)] rounded-full h-1.5">
                        <div className="h-full rounded-full bg-[var(--brand-soft)] transition-colors duration-700"
                          style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-[11px] font-semibold text-[var(--text-secondary)] w-8 text-right tabular-nums">{a.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contrôles */}
          <div className="bg-[#0f1623] rounded-2xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-[var(--text)]">
                  {meta?.total.toLocaleString('fr-FR')??'—'}
                  <span className="text-[var(--text-secondary)]  font-normal text-xs ml-1.5">événements</span>
                </p>
                {fltCount>0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--brand-soft)] text-[var(--success-text)] text-[10px] font-semibold border border-[var(--border)]">
                    {fltCount} filtre{fltCount>1?'s':''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowFlt(v=>!v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                    ${showFlt?'bg-[var(--brand-soft)] border-[var(--border)] text-[var(--success-text)]':'border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-secondary)] hover:border-[var(--border)]'}`}>
                  <Filter size={11}/> Filtres
                </button>
                <button onClick={()=>{setPage(1);loadLogs();loadStats();}} disabled={loading}
                  className="p-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)]  hover:text-[var(--text-secondary)] transition-colors disabled:opacity-40">
                  <RefreshCw size={13} className={loading?'animate-spin':''}/>
                </button>
              </div>
            </div>

            {showFlt && (
              <div className="border-t border-[var(--border)] p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  {k:'action',l:'Action',ph:'LOGIN, EXPORT…'},
                  {k:'entity',l:'Entité',ph:'AUTH, EMPLOYEE…'},
                  {k:'severity',l:'Sévérité',ph:'CRITICAL / WARN…'},
                  {k:'from',l:'Depuis',ph:'',type:'date'},
                  {k:'to',l:'Jusqu\'à',ph:'',type:'date'},
                ].map(f=>(
                  <div key={f.k}>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-[var(--text-secondary)]  mb-1.5">{f.l}</label>
                    <div className="relative">
                      <input type={f.type??'text'} value={(flt as any)[f.k]} placeholder={f.ph}
                        onChange={e=>{setFlt(p=>({...p,[f.k]:e.target.value}));setPage(1);}}
                        className="w-full px-3 py-2 pr-7 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text)] placeholder:text-[var(--text-secondary)] outline-none focus:border-[var(--border)] transition-colors"/>
                      {(flt as any)[f.k] && (
                        <button onClick={()=>setFlt(p=>({...p,[f.k]:''}))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]  hover:text-[var(--text-secondary)]">
                          <XCircle size={11}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div className="bg-[#0f1623] rounded-2xl border border-[var(--border)] overflow-hidden">
            {loading ? (
              <KonzaLoader variant="section" label="Chargement des événements…" />
            ) : logs.length===0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-[var(--text-secondary)] ">
                <FileText size={32} className="mb-2 opacity-20"/>
                <p className="text-sm">Aucun événement pour ces critères</p>
                {fltCount>0 && (
                  <button onClick={()=>setFlt({action:'',entity:'',severity:'',from:'',to:''})}
                    className="mt-2 text-xs text-[var(--success-text)] hover:text-[var(--success-text)]">
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Lignes */}
                <div className="divide-y divide-[var(--border)]">
                  {logs.map(log=>{
                    const s    = sev(log);
                    const Icon = ACTION_ICON[log.action] ?? Shield;
                    const ent  = ENTITY_BADGE[log.entity] ?? 'text-[var(--text-secondary)] bg-[var(--surface)]';
                    const sel  = detail?.id===log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <div
                          onClick={()=>setDetail(sel?null:log)}
                          className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors
                            ${SEV_ROW[s]??''}
                            ${sel?'bg-[var(--surface)]':'hover:bg-[var(--surface)]'}`}>

                          {/* Icône */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${SEV_ICON_COLOR[s]??'text-[var(--text-secondary)] bg-[var(--surface)]'}`}>
                            <Icon size={12}/>
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-semibold font-mono px-2 py-0.5 rounded-md ${SEV_BADGE[s]??''}`}>
                                {log.action.replace(/_/g,' ')}
                              </span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${ent}`}>
                                {log.entity}
                              </span>
                              {log.action.endsWith('_FAILED') && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] text-[var(--danger-text)] border border-[var(--border)]">ÉCHEC</span>
                              )}
                            </div>
                            <p className="text-xs text-[var(--text-secondary)] truncate mb-1.5">{log.description}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {log.user && (
                                <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] ">
                                  <UserIcon size={10}/>
                                  {log.user.firstName} {log.user.lastName}
                                  <span className={`ml-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${ROLE_BADGE[log.user.role]??'bg-[var(--surface)] text-[var(--text-secondary)]  border-[var(--border)]'}`}>
                                    {log.user.role}
                                  </span>
                                </span>
                              )}
                              {log.metadata?.ip && (
                                <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] ">
                                  <Globe size={10}/> {log.metadata.ip}
                                </span>
                              )}
                              {log.metadata?.duration && (
                                <span className="text-[11px] text-[var(--text-secondary)]  font-mono">{log.metadata.duration}ms</span>
                              )}
                            </div>
                          </div>

                          {/* Date */}
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-mono text-[var(--text-secondary)]  whitespace-nowrap">{fmtShort(log.createdAt)}</p>
                          </div>
                        </div>

                        {/* Panneau détail inline */}
                        {sel && (
                          <div className="bg-[#0b1020] border-t border-[var(--border)] px-5 py-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-1.5">
                                <Info size={12} className="text-[var(--success-text)]"/> Détail complet
                              </p>
                              <button onClick={()=>setDetail(null)}
                                className="text-[11px] text-[var(--text-secondary)]  hover:text-[var(--text-secondary)]">fermer ×</button>
                            </div>

                            {/* Grille infos */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                              {[
                                {l:'ID événement', v:log.id,                mono:true},
                                {l:'Date & heure', v:fmtFull(log.createdAt)},
                                {l:'Sévérité',     v:s},
                                {l:'IP source',    v:log.metadata?.ip??'—', mono:true},
                                {l:'Méthode',      v:log.metadata?.method??'—'},
                                {l:'Route',        v:log.metadata?.path??'—', mono:true},
                                {l:'Durée',        v:log.metadata?.duration?`${log.metadata.duration}ms`:'—'},
                                {l:'Entité ID',    v:log.entityId??'—',     mono:true},
                              ].map((f,i)=>(
                                <div key={i} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                                  <p className="text-[9px] text-[var(--text-secondary)]  uppercase tracking-wider mb-1">{f.l}</p>
                                  <p className={`text-[var(--text-secondary)] truncate ${f.mono?'font-mono text-[10px]':'text-xs font-medium'}`}>{f.v}</p>
                                </div>
                              ))}
                            </div>

                            {/* Utilisateur */}
                            {log.user && (
                              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-[var(--brand-soft)] border border-[var(--border)] flex items-center justify-center shrink-0">
                                  <span className="text-xs font-semibold text-[var(--success-text)]">{log.user.firstName[0]}{log.user.lastName[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-[var(--text)]">{log.user.firstName} {log.user.lastName}</p>
                                  <p className="text-xs text-[var(--text-secondary)]  truncate">{log.user.email}</p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-semibold px-2 py-1 rounded-md border ${ROLE_BADGE[log.user.role]??'bg-[var(--surface)] text-[var(--text-secondary)]  border-[var(--border)]'}`}>
                                  {log.user.role}
                                </span>
                              </div>
                            )}

                            {/* Body sanitizé */}
                            {log.metadata?.body && Object.keys(log.metadata.body).length>0 && (
                              <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                                <p className="text-[9px] text-[var(--text-secondary)]  uppercase tracking-wider mb-2">Corps de la requête (champs sensibles masqués)</p>
                                <pre className="text-[11px] font-mono text-[var(--text-secondary)] overflow-auto max-h-32 leading-loose">
                                  {JSON.stringify(log.metadata.body,null,2)}
                                </pre>
                              </div>
                            )}

                            {/* Erreur */}
                            {log.metadata?.error && (
                              <div className="bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] border border-[var(--border)] rounded-xl p-3">
                                <p className="text-[9px] text-[var(--danger-text)] uppercase tracking-wider mb-1">Message d'erreur</p>
                                <p className="text-xs text-[var(--danger-text)] font-mono">{log.metadata.error}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Pagination */}
                {meta && meta.totalPages>1 && (
                  <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-[var(--text-secondary)] ">
                      Page {meta.page}/{meta.totalPages} · {meta.total.toLocaleString('fr-FR')} événements
                    </span>
                    <div className="flex gap-2">
                      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-[var(--surface)] disabled:opacity-30 transition-colors">
                        <ChevronLeft size={11}/> Préc.
                      </button>
                      <button onClick={()=>setPage(p=>Math.min(meta.totalPages,p+1))} disabled={page===meta.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--border)] text-[var(--text-secondary)] text-xs hover:bg-[var(--surface)] disabled:opacity-30 transition-colors">
                        Suiv. <ChevronRight size={11}/>
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function SecuritePageWithFrame() {
  return (
    <ModulePageFrame kind="list">
      <SecuritePage />
    </ModulePageFrame>
  );
}
