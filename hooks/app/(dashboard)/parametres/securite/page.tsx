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
  CRITICAL: 'bg-red-500/10 text-red-400 border-red-500/25 border',
  WARN:     'bg-amber-500/10 text-amber-400 border-amber-500/25 border',
  INFO:     'bg-sky-500/10 text-sky-400 border-sky-500/20 border',
};
const SEV_ICON_COLOR: Record<string, string> = {
  CRITICAL: 'text-red-400 bg-red-500/10',
  WARN:     'text-amber-400 bg-amber-500/10',
  INFO:     'text-sky-400 bg-sky-500/10',
};
const ENTITY_BADGE: Record<string, string> = {
  AUTH:'text-violet-400 bg-violet-500/10', EMPLOYEE:'text-cyan-400 bg-cyan-500/10',
  PAYROLL:'text-emerald-400 bg-emerald-500/10', EXPORT:'text-orange-400 bg-orange-500/10',
  LEAVE:'text-teal-400 bg-teal-500/10', LOAN:'text-rose-400 bg-rose-500/10',
  CONTRACT:'text-red-400 bg-red-500/10', USER:'text-blue-400 bg-blue-500/10',
  COMPANY:'text-indigo-400 bg-indigo-500/10', CABINET:'text-purple-400 bg-purple-500/10',
  SETTINGS:'text-yellow-400 bg-yellow-500/10', SUBSCRIPTION:'text-pink-400 bg-pink-500/10',
  DOCUMENT:'text-slate-400 bg-slate-500/10', ATTENDANCE:'text-lime-400 bg-lime-500/10',
  ASSET:'text-amber-400 bg-amber-500/10', RECRUITMENT:'text-sky-400 bg-sky-500/10',
  TRAINING:'text-green-400 bg-green-500/10', BONUS:'text-fuchsia-400 bg-fuchsia-500/10',
  CNSS:'text-red-300 bg-red-500/10', ONBOARDING:'text-teal-400 bg-teal-500/10',
};
const ROLE_BADGE: Record<string, string> = {
  ADMIN:'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  HR_MANAGER:'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  MANAGER:'bg-amber-500/15 text-amber-400 border-amber-500/30',
  EMPLOYEE:'bg-slate-500/15 text-slate-400 border-slate-500/30',
  CABINET_ADMIN:'bg-purple-500/15 text-purple-400 border-purple-500/30',
  SUPER_ADMIN:'bg-red-500/15 text-red-400 border-red-500/30',
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
export default function SecuritePage() {
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
      <div className="flex items-center gap-4">
        <button onClick={()=>router.back()}
          className="p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.07] transition-colors">
          <ChevronLeft size={18} className="text-slate-400"/>
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 border border-violet-500/20 flex items-center justify-center">
            <Shield size={20} className="text-violet-400"/>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Sécurité du compte</h1>
            <p className="text-xs text-slate-600 mt-0.5">2FA TOTP · Journal d'audit complet · Traçabilité</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.07] rounded-xl p-1 w-fit">
        {[{k:'2fa',l:'Auth. 2FA',I:Smartphone},{k:'audit',l:'Journal d\'audit',I:Activity}].map(t=>(
          <button key={t.k} onClick={()=>setTab(t.k as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
              ${tab===t.k ? 'bg-white/[0.08] text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>
            <t.I size={14}/> {t.l}
          </button>
        ))}
      </div>

      {/* ══ 2FA ══════════════════════════════════════════════════════════════ */}
      {tab==='2fa' && (
        <div className="space-y-4 max-w-lg">

          {/* Statut */}
          <div className={`rounded-2xl border p-5 flex items-center justify-between gap-4
            ${twoFaOn ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
            <div className="flex items-center gap-3">
              {twoFaOn ? <ShieldCheck size={30} className="text-emerald-400 shrink-0"/> : <ShieldOff size={30} className="text-amber-400 shrink-0"/>}
              <div>
                <p className={`font-bold text-sm ${twoFaOn?'text-emerald-300':'text-amber-300'}`}>
                  {twoFaOn ? '2FA activé — Compte protégé' : '2FA désactivé — Compte vulnérable'}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {twoFaOn ? 'Un code unique est demandé à chaque connexion sur un nouvel appareil.'
                           : 'Activez pour bloquer les accès non autorisés même en cas de vol de mot de passe.'}
                </p>
              </div>
            </div>
            {!loadingMe && !twoFaOn && step==='idle' && (
              <button onClick={setup} disabled={busy}
                className="shrink-0 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50">
                {busy ? <Loader2 size={13} className="animate-spin"/> : <ShieldCheck size={13}/>}
                Activer
              </button>
            )}
          </div>

          {msg && (
            <div className={`flex items-center gap-2.5 p-3.5 rounded-xl text-sm font-medium
              ${msg.t==='ok' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                             : 'bg-red-500/10 border border-red-500/20 text-red-300'}`}>
              {msg.t==='ok' ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>}
              {msg.s}
            </div>
          )}

          {/* Setup */}
          {step==='setup' && (
            <div className="bg-[#0f1623] rounded-2xl border border-white/[0.07] p-6 space-y-6">

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Étape 1 — Ouvrez votre app d'authentification
                </p>
                <div className="flex flex-wrap gap-2">
                  {['Google Authenticator','Authy','Aegis','Microsoft Auth.'].map(a=>(
                    <span key={a} className="text-[11px] px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.07] text-slate-500">{a}</span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Étape 2 — Scannez le QR code
                </p>
                {qrUrl && (
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white rounded-2xl shadow-xl shadow-black/40">
                      <img src={qrUrl} alt="2FA QR" className="w-44 h-44"/>
                    </div>
                  </div>
                )}
                <button onClick={()=>setShowMan(v=>!v)}
                  className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1.5 transition-colors">
                  {showMan ? <EyeOff size={12}/> : <Eye size={12}/>}
                  {showMan ? 'Masquer la clé manuelle' : 'Entrer la clé manuellement'}
                </button>
                {showMan && (
                  <div className="mt-2 bg-white/[0.02] border border-white/[0.07] rounded-xl p-3 flex items-center gap-3">
                    <code className="font-mono text-[11px] text-sky-300 break-all flex-1 leading-relaxed">{manKey}</code>
                    <button onClick={()=>{navigator.clipboard.writeText(manKey);setCopMan(true);setTimeout(()=>setCopMan(false),2000);}}
                      className="p-2 rounded-lg bg-sky-500/15 text-sky-400 hover:bg-sky-500/25 transition-colors shrink-0">
                      {copMan?<CheckCircle2 size={13}/>:<Copy size={13}/>}
                    </button>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">
                  Étape 3 — Entrez le code affiché
                </p>
                <div className="flex gap-3">
                  <input type="text" inputMode="numeric" maxLength={6}
                    value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))}
                    placeholder="000 000"
                    className="flex-1 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] text-center text-3xl font-mono font-black tracking-[0.5em] text-white placeholder:text-white/[0.12] outline-none focus:border-sky-500/40 transition-colors"/>
                  <button onClick={activate} disabled={busy||code.length<6}
                    className="px-5 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-bold text-sm disabled:opacity-40 transition-colors flex items-center gap-2 shrink-0">
                    {busy?<Loader2 size={13} className="animate-spin"/>:<ShieldCheck size={13}/>}
                    Valider
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Backup codes */}
          {step==='backup' && (
            <div className="bg-[#0f1623] rounded-2xl border border-emerald-500/20 p-6 space-y-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 size={22} className="text-emerald-400 shrink-0 mt-0.5"/>
                <div>
                  <p className="font-bold text-white text-sm">2FA activé avec succès !</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Sauvegardez ces 8 codes dans un endroit sécurisé (gestionnaire de mots de passe, papier hors ligne).
                    Chaque code est à <span className="text-amber-400 font-semibold">usage unique</span> — ils vous permettent de vous connecter si vous perdez votre téléphone.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {backup.map((c,i)=>(
                  <div key={i} className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.07] rounded-lg px-3 py-2.5">
                    <span className="text-[10px] text-slate-700 font-mono w-4 shrink-0">{i+1}.</span>
                    <code className="font-mono text-sm font-bold text-white tracking-widest">{c}</code>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={()=>{navigator.clipboard.writeText(backup.join('\n'));setCopBak(true);setTimeout(()=>setCopBak(false),2000);}}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm font-semibold text-slate-300 hover:bg-white/[0.07] transition-colors">
                  {copBak?<CheckCircle2 size={13} className="text-emerald-400"/>:<Copy size={13}/>}
                  {copBak?'Copié !':'Copier tout'}
                </button>
                <button onClick={()=>{setStep('idle');setCode('');setBackup([]);}}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl text-sm font-bold transition-colors">
                  <CheckCircle2 size={13}/> Codes sauvegardés
                </button>
              </div>
            </div>
          )}

          {/* Disable 2FA */}
          {twoFaOn && step==='idle' && (
            <div className="bg-[#0f1623] rounded-2xl border border-white/[0.07] p-5">
              <p className="font-semibold text-white text-sm mb-1">Désactiver le 2FA</p>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                Action irréversible sans confirmation.
                {['ADMIN','HR_MANAGER','CABINET_ADMIN'].includes(role) &&
                  <span className="text-amber-400"> Votre rôle rend le 2FA obligatoire — la désactivation sera refusée par le serveur.</span>}
              </p>
              {!showDis ? (
                <button onClick={()=>setShowDis(true)}
                  className="px-4 py-2 rounded-xl border border-red-500/20 text-red-400 text-sm font-semibold hover:bg-red-500/5 transition-colors">
                  Désactiver
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <input type={showPwd?'text':'password'} value={disPwd}
                      onChange={e=>setDisPwd(e.target.value)} placeholder="Confirmez votre mot de passe"
                      className="w-full px-4 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.03] text-white text-sm outline-none focus:border-red-400/30 pr-10 transition-colors"/>
                    <button onClick={()=>setShowPwd(v=>!v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-400">
                      {showPwd?<EyeOff size={14}/>:<Eye size={14}/>}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={disable} disabled={busy}
                      className="px-4 py-2 bg-red-500 hover:bg-red-400 text-white rounded-xl font-bold text-sm disabled:opacity-50 transition-colors">
                      {busy?<Loader2 size={13} className="animate-spin inline"/>:'Confirmer'}
                    </button>
                    <button onClick={()=>{setShowDis(false);setDisPwd('');}}
                      className="px-4 py-2 border border-white/[0.08] text-slate-400 rounded-xl text-sm hover:bg-white/[0.04] transition-colors">
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
                { I:Activity,      l:'Événements (7j)', v:stats.total7d.toLocaleString('fr-FR'), c:'text-sky-400', sub:stats.period },
                { I:AlertTriangle, l:'Critiques (7j)',  v:stats.critical.toLocaleString('fr-FR'), c:'text-red-400',
                  sub:stats.critical>0?'Vérification recommandée':'Aucun incident critique' },
                { I:Zap,           l:'Action fréquente', v:stats.byAction[0]?.action.replace(/_/g,' ')??'—', c:'text-amber-400',
                  sub:stats.byAction[0]?`${stats.byAction[0].count}× cette semaine`:'' },
                { I:BarChart2,     l:'Entité active',  v:stats.byEntity[0]?.entity??'—', c:'text-emerald-400',
                  sub:stats.byEntity[0]?`${stats.byEntity[0].count} actions`:''},
              ].map((s,i)=>(
                <div key={i} className="bg-[#0f1623] rounded-2xl border border-white/[0.07] p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <s.I size={14} className={s.c}/>
                    <span className="text-[11px] text-slate-600 font-medium">{s.l}</span>
                  </div>
                  <p className={`text-2xl font-black ${s.c} truncate`}>{s.v}</p>
                  {s.sub && <p className="text-[10px] text-slate-700 mt-1 truncate">{s.sub}</p>}
                </div>
              ))}
            </div>
          )}

          {/* Graphique top actions */}
          {stats && stats.byAction.length>0 && (
            <div className="bg-[#0f1623] rounded-2xl border border-white/[0.07] p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-4">Répartition des actions — 7 jours</p>
              <div className="space-y-2.5">
                {stats.byAction.slice(0,7).map((a,i)=>{
                  const pct = Math.round((a.count/(stats.byAction[0]?.count||1))*100);
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-[10px] font-mono text-slate-700 w-3 text-right">{i+1}</span>
                      <span className="text-xs text-slate-500 w-48 truncate">{a.action.replace(/_/g,' ')}</span>
                      <div className="flex-1 bg-white/[0.03] rounded-full h-1.5">
                        <div className="h-full rounded-full bg-gradient-to-r from-sky-500/70 to-blue-600/70 transition-all duration-700"
                          style={{width:`${pct}%`}}/>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 w-8 text-right tabular-nums">{a.count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Contrôles */}
          <div className="bg-[#0f1623] rounded-2xl border border-white/[0.07] overflow-hidden">
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <p className="text-sm font-semibold text-white">
                  {meta?.total.toLocaleString('fr-FR')??'—'}
                  <span className="text-slate-600 font-normal text-xs ml-1.5">événements</span>
                </p>
                {fltCount>0 && (
                  <span className="px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 text-[10px] font-bold border border-sky-500/20">
                    {fltCount} filtre{fltCount>1?'s':''}
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowFlt(v=>!v)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors
                    ${showFlt?'bg-sky-500/15 border-sky-500/30 text-sky-400':'border-white/[0.08] text-slate-500 hover:text-slate-300 hover:border-white/15'}`}>
                  <Filter size={11}/> Filtres
                </button>
                <button onClick={()=>{setPage(1);loadLogs();loadStats();}} disabled={loading}
                  className="p-1.5 rounded-lg border border-white/[0.08] text-slate-600 hover:text-slate-400 transition-colors disabled:opacity-40">
                  <RefreshCw size={13} className={loading?'animate-spin':''}/>
                </button>
              </div>
            </div>

            {showFlt && (
              <div className="border-t border-white/[0.06] p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  {k:'action',l:'Action',ph:'LOGIN, EXPORT…'},
                  {k:'entity',l:'Entité',ph:'AUTH, EMPLOYEE…'},
                  {k:'severity',l:'Sévérité',ph:'CRITICAL / WARN…'},
                  {k:'from',l:'Depuis',ph:'',type:'date'},
                  {k:'to',l:'Jusqu\'à',ph:'',type:'date'},
                ].map(f=>(
                  <div key={f.k}>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-slate-700 mb-1.5">{f.l}</label>
                    <div className="relative">
                      <input type={f.type??'text'} value={(flt as any)[f.k]} placeholder={f.ph}
                        onChange={e=>{setFlt(p=>({...p,[f.k]:e.target.value}));setPage(1);}}
                        className="w-full px-3 py-2 pr-7 rounded-lg border border-white/[0.07] bg-white/[0.02] text-xs text-white placeholder:text-slate-700 outline-none focus:border-sky-500/40 transition-colors"/>
                      {(flt as any)[f.k] && (
                        <button onClick={()=>setFlt(p=>({...p,[f.k]:''}))}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-700 hover:text-slate-500">
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
          <div className="bg-[#0f1623] rounded-2xl border border-white/[0.07] overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <Loader2 size={26} className="animate-spin text-sky-500"/>
                <p className="text-xs text-slate-700">Chargement des événements…</p>
              </div>
            ) : logs.length===0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-700">
                <FileText size={32} className="mb-2 opacity-20"/>
                <p className="text-sm">Aucun événement pour ces critères</p>
                {fltCount>0 && (
                  <button onClick={()=>setFlt({action:'',entity:'',severity:'',from:'',to:''})}
                    className="mt-2 text-xs text-sky-500 hover:text-sky-400">
                    Effacer les filtres
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Lignes */}
                <div className="divide-y divide-white/[0.04]">
                  {logs.map(log=>{
                    const s    = sev(log);
                    const Icon = ACTION_ICON[log.action] ?? Shield;
                    const ent  = ENTITY_BADGE[log.entity] ?? 'text-slate-400 bg-white/5';
                    const sel  = detail?.id===log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <div
                          onClick={()=>setDetail(sel?null:log)}
                          className={`flex items-start gap-3 px-5 py-3.5 cursor-pointer transition-colors
                            ${SEV_ROW[s]??''}
                            ${sel?'bg-white/[0.04]':'hover:bg-white/[0.02]'}`}>

                          {/* Icône */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${SEV_ICON_COLOR[s]??'text-slate-400 bg-white/5'}`}>
                            <Icon size={12}/>
                          </div>

                          {/* Contenu */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-md ${SEV_BADGE[s]??''}`}>
                                {log.action.replace(/_/g,' ')}
                              </span>
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${ent}`}>
                                {log.entity}
                              </span>
                              {log.action.endsWith('_FAILED') && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-red-500/10 text-red-400 border border-red-500/20">ÉCHEC</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 truncate mb-1.5">{log.description}</p>
                            <div className="flex items-center gap-3 flex-wrap">
                              {log.user && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-600">
                                  <UserIcon size={10}/>
                                  {log.user.firstName} {log.user.lastName}
                                  <span className={`ml-1 text-[9px] font-bold px-1.5 py-0.5 rounded border ${ROLE_BADGE[log.user.role]??'bg-white/5 text-slate-600 border-white/10'}`}>
                                    {log.user.role}
                                  </span>
                                </span>
                              )}
                              {log.metadata?.ip && (
                                <span className="flex items-center gap-1 text-[11px] text-slate-700">
                                  <Globe size={10}/> {log.metadata.ip}
                                </span>
                              )}
                              {log.metadata?.duration && (
                                <span className="text-[11px] text-slate-700 font-mono">{log.metadata.duration}ms</span>
                              )}
                            </div>
                          </div>

                          {/* Date */}
                          <div className="text-right shrink-0">
                            <p className="text-[10px] font-mono text-slate-700 whitespace-nowrap">{fmtShort(log.createdAt)}</p>
                          </div>
                        </div>

                        {/* Panneau détail inline */}
                        {sel && (
                          <div className="bg-[#0b1020] border-t border-white/[0.05] px-5 py-5 space-y-4">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <Info size={12} className="text-sky-400"/> Détail complet
                              </p>
                              <button onClick={()=>setDetail(null)}
                                className="text-[11px] text-slate-700 hover:text-slate-500">fermer ×</button>
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
                                <div key={i} className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                                  <p className="text-[9px] text-slate-700 uppercase tracking-wider mb-1">{f.l}</p>
                                  <p className={`text-slate-400 truncate ${f.mono?'font-mono text-[10px]':'text-xs font-medium'}`}>{f.v}</p>
                                </div>
                              ))}
                            </div>

                            {/* Utilisateur */}
                            {log.user && (
                              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/15 flex items-center justify-center shrink-0">
                                  <span className="text-xs font-black text-sky-400">{log.user.firstName[0]}{log.user.lastName[0]}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-white">{log.user.firstName} {log.user.lastName}</p>
                                  <p className="text-xs text-slate-600 truncate">{log.user.email}</p>
                                </div>
                                <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-md border ${ROLE_BADGE[log.user.role]??'bg-white/5 text-slate-600 border-white/10'}`}>
                                  {log.user.role}
                                </span>
                              </div>
                            )}

                            {/* Body sanitizé */}
                            {log.metadata?.body && Object.keys(log.metadata.body).length>0 && (
                              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
                                <p className="text-[9px] text-slate-700 uppercase tracking-wider mb-2">Corps de la requête (champs sensibles masqués)</p>
                                <pre className="text-[11px] font-mono text-slate-500 overflow-auto max-h-32 leading-loose">
                                  {JSON.stringify(log.metadata.body,null,2)}
                                </pre>
                              </div>
                            )}

                            {/* Erreur */}
                            {log.metadata?.error && (
                              <div className="bg-red-500/5 border border-red-500/15 rounded-xl p-3">
                                <p className="text-[9px] text-red-600 uppercase tracking-wider mb-1">Message d'erreur</p>
                                <p className="text-xs text-red-400 font-mono">{log.metadata.error}</p>
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
                  <div className="px-5 py-3 border-t border-white/[0.05] flex items-center justify-between">
                    <span className="text-[11px] font-mono text-slate-700">
                      Page {meta.page}/{meta.totalPages} · {meta.total.toLocaleString('fr-FR')} événements
                    </span>
                    <div className="flex gap-2">
                      <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.07] text-slate-500 text-xs hover:bg-white/[0.04] disabled:opacity-30 transition-colors">
                        <ChevronLeft size={11}/> Préc.
                      </button>
                      <button onClick={()=>setPage(p=>Math.min(meta.totalPages,p+1))} disabled={page===meta.totalPages}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/[0.07] text-slate-500 text-xs hover:bg-white/[0.04] disabled:opacity-30 transition-colors">
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