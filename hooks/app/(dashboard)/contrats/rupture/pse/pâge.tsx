'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';

interface PSE {id:string;status:'OUVERT'|'EN_COURS'|'CLOTURE'|'ANNULE';motif:string;nbPostesSupprimes:number;dateOuverture:string;dateNotificationInspection?:string;dateReunionDP?:string;dateCloture?:string;notes?:string;etapes:Array<{label:string;done:boolean;requis:boolean;date?:string}>;salariesConcernes:Array<{id:string;nom:string;poste:string;matricule:string;statut:'PREVU'|'CONFIRME'|'MAINTENU'}>;}
interface Stats{total30j:number;total90j:number;totalAnnee:number;seuil:number;pseRequired:boolean;}

const ST={OUVERT:{l:'Ouvert',c:'text-amber-400',bg:'bg-amber-500/10',b:'border-amber-500/20'},EN_COURS:{l:'En cours',c:'text-cyan-400',bg:'bg-cyan-500/10',b:'border-cyan-500/20'},CLOTURE:{l:'Clôturé',c:'text-emerald-400',bg:'bg-emerald-500/10',b:'border-emerald-500/20'},ANNULE:{l:'Annulé',c:'text-red-400',bg:'bg-red-500/10',b:'border-red-500/20'}};
const fmtD=(d?:string)=>d?new Date(d).toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}):'—';
function Sp(){return<div className="w-4 h-4 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin"/>}
function Bdg({c,v='d'}:{c:React.ReactNode;v?:'d'|'s'|'w'|'r'|'i'}){const m={d:'bg-slate-800 text-slate-300 border-slate-700',s:'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',w:'bg-amber-500/10 text-amber-400 border-amber-500/20',r:'bg-red-500/10 text-red-400 border-red-500/20',i:'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'}[v];return<span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${m}`}>{c}</span>}
const inp="w-full bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all";

function NouvellePSE({onClose,onCreated}:{onClose:()=>void;onCreated:()=>void}){
  const[form,setForm]=useState({motif:'',nbPostesSupprimes:1,notes:'',salariesIds:[]as string[]});
  const[employees,setEmployees]=useState<any[]>([]);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState<string|null>(null);
  const[empSearch,setEmpSearch]=useState('');
  useEffect(()=>{api.get<any>('/employees?status=ACTIVE&limit=200').then(d=>setEmployees(Array.isArray(d)?d:(d.employees??d.data??[])));},[]);
  const toggle=(id:string)=>setForm(f=>({...f,salariesIds:f.salariesIds.includes(id)?f.salariesIds.filter(x=>x!==id):[...f.salariesIds,id]}));
  const filtered=employees.filter(e=>`${e.firstName} ${e.lastName} ${e.employeeNumber}`.toLowerCase().includes(empSearch.toLowerCase()));
  async function submit(){if(!form.motif.trim()){setError('Le motif est requis');return;}setLoading(true);setError(null);try{await api.post('/pse',form);onCreated();}catch(e:any){setError(e.message??'Erreur');}finally{setLoading(false);}}
  return<div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"><div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-xl max-h-[85vh] overflow-y-auto shadow-2xl">
    <div className="flex justify-between items-center mb-5"><div><h2 className="text-base font-bold">Ouvrir une procédure PSE</h2><p className="text-xs text-slate-500 mt-0.5">Art. 39 CT Congo</p></div><button onClick={onClose} className="text-slate-500 hover:text-slate-300 text-xl leading-none">&times;</button></div>
    <div className="mb-5 p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 leading-relaxed"><strong>Obligations légales :</strong> Notification à l'Inspection du Travail obligatoire avant toute notification aux salariés. Délai minimum : 15 jours ouvrables.</div>
    <div className="space-y-4">
      <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Motif économique <span className="text-red-400">*</span></label><textarea rows={3} value={form.motif} onChange={e=>setForm(f=>({...f,motif:e.target.value}))} placeholder="Raisons économiques, financières ou technologiques..." className={`${inp} resize-none`}/></div>
      <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Postes supprimés <span className="text-red-400">*</span></label><input type="number" min={1} value={form.nbPostesSupprimes} onChange={e=>setForm(f=>({...f,nbPostesSupprimes:+e.target.value}))} className="w-28 bg-slate-800/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"/></div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Salariés concernés — {form.salariesIds.length} sélectionné(s)</label>
        <input value={empSearch} onChange={e=>setEmpSearch(e.target.value)} placeholder="Rechercher..." className={`${inp} mb-2`}/>
        <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">{filtered.map(e=>{const s=form.salariesIds.includes(e.id);return<button key={e.id} onClick={()=>toggle(e.id)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${s?'bg-cyan-500/10 border-cyan-500/30':'bg-slate-800/40 border-white/5 hover:border-white/15'}`}><div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-all ${s?'bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-500':'bg-slate-800 border-slate-600'}`}>{s&&<svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>}</div><div className="min-w-0"><p className="text-xs font-semibold text-slate-200 truncate">{e.firstName} {e.lastName}</p><p className="text-xs text-slate-500">{e.employeeNumber} · {e.position}</p></div></button>})}</div>
      </div>
      <div><label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Notes internes</label><textarea rows={2} value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Notes pour le dossier..." className={`${inp} resize-none`}/></div>
    </div>
    {error&&<p className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400">{error}</p>}
    <button onClick={submit} disabled={loading||!form.motif.trim()} className={`mt-4 w-full py-3 rounded-xl font-bold text-sm transition-all ${form.motif.trim()&&!loading?'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20':'bg-slate-800 text-slate-600 cursor-not-allowed'}`}>{loading?'Ouverture...':'Ouvrir la procédure PSE'}</button>
  </div></div>;
}

function PSECard({pse,onUpdate}:{pse:PSE;onUpdate:()=>void}){
  const[open,setOpen]=useState(false);const[busy,setBusy]=useState(false);
  const st=ST[pse.status];const done=pse.etapes.filter(e=>e.done).length;const total=pse.etapes.length;const pct=total>0?Math.round((done/total)*100):0;
  const barC=pse.status==='CLOTURE'?'bg-emerald-500':pse.status==='EN_COURS'?'bg-cyan-500':'bg-amber-500';
  async function toggleE(idx:number){setBusy(true);try{await api.patch(`/pse/${pse.id}/etape/${idx}`,{done:!pse.etapes[idx].done});onUpdate();}finally{setBusy(false);}}
  async function updStat(sid:string,statut:string){try{await api.patch(`/pse/${pse.id}/salarie/${sid}`,{statut});onUpdate();}catch{}}
  return<div className={`bg-slate-900/60 border rounded-2xl overflow-hidden transition-all ${st.b}`}>
    <div className="p-4 sm:p-5 flex items-center gap-4 cursor-pointer" onClick={()=>setOpen(x=>!x)}>
      <div className={`w-10 h-10 rounded-xl ${st.bg} border ${st.b} flex items-center justify-center shrink-0`}><svg className={`w-5 h-5 ${st.c}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1"><p className="text-sm font-bold truncate">PSE — {pse.nbPostesSupprimes} poste(s) supprimé(s)</p><span className={`shrink-0 text-xs font-bold px-2 py-0.5 rounded-full border ${st.bg} ${st.c} ${st.b}`}>{st.l}</span></div>
        <p className="text-xs text-slate-500">Ouvert le {fmtD(pse.dateOuverture)} · {pse.salariesConcernes.length} salarié(s) · {done}/{total} étapes</p>
      </div>
      <div className="hidden sm:block w-24 shrink-0"><div className="flex justify-between text-xs mb-1"><span className="text-slate-600">Avancement</span><span className={`font-bold ${st.c}`}>{pct}%</span></div><div className="h-1.5 bg-slate-800 rounded-full overflow-hidden"><div className={`h-full ${barC} rounded-full transition-all duration-500`} style={{width:`${pct}%`}}/></div></div>
      <svg className={`w-4 h-4 text-slate-600 shrink-0 transition-transform ${open?'rotate-180':''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>
    </div>
    {open&&<div className="border-t border-white/10 p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Étapes légales ({done}/{total})</p>
        <div className="space-y-2">{pse.etapes.map((e,i)=><button key={i} onClick={()=>!busy&&toggleE(i)} className={`w-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all ${e.done?'bg-emerald-500/10 border-emerald-500/20':'bg-slate-800/40 border-white/5 hover:border-white/15'}`}><div className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 text-xs font-bold transition-all ${e.done?'bg-emerald-500 border-emerald-500 text-white':'bg-slate-800 border-slate-600 text-slate-500'}`}>{e.done?<svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/></svg>:i+1}</div><div className="flex-1 min-w-0"><p className={`text-xs font-semibold leading-snug ${e.done?'text-emerald-400':'text-slate-300'}`}>{e.label}</p>{e.date&&<p className="text-xs text-slate-600 mt-0.5">{fmtD(e.date)}</p>}</div>{e.requis&&!e.done&&<span className="text-xs text-red-400 font-bold shrink-0">Requis</span>}</button>)}</div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Salariés ({pse.salariesConcernes.length})</p>
          {pse.salariesConcernes.length===0?<p className="text-xs text-slate-600 py-4 text-center">Aucun salarié rattaché</p>:<div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar">{pse.salariesConcernes.map(s=>{const sv={PREVU:{c:'text-amber-400',bg:'bg-amber-500/10',b:'border-amber-500/20'},CONFIRME:{c:'text-red-400',bg:'bg-red-500/10',b:'border-red-500/20'},MAINTENU:{c:'text-emerald-400',bg:'bg-emerald-500/10',b:'border-emerald-500/20'}}[s.statut];return<div key={s.id} className="flex items-center gap-3 p-2.5 bg-slate-800/40 border border-white/5 rounded-xl"><div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-200 truncate">{s.nom}</p><p className="text-xs text-slate-500">{s.matricule} · {s.poste}</p></div><select value={s.statut} onChange={e=>updStat(s.id,e.target.value)} className={`text-xs font-bold px-2 py-1 rounded-lg border ${sv.bg} ${sv.c} ${sv.b} bg-transparent cursor-pointer focus:outline-none`}><option value="PREVU">Prévu</option><option value="CONFIRME">Confirmé</option><option value="MAINTENU">Maintenu</option></select></div>})}</div>}
        </div>
        <div className="p-3 bg-slate-800/40 border border-white/5 rounded-xl space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Dates clés</p>
          {[{l:'Ouverture',v:fmtD(pse.dateOuverture)},{l:'Notif. Inspection',v:fmtD(pse.dateNotificationInspection)},{l:'Réunion DP',v:fmtD(pse.dateReunionDP)},{l:'Clôture',v:fmtD(pse.dateCloture)}].map(({l,v})=><div key={l} className="flex justify-between text-xs"><span className="text-slate-600">{l}</span><span className={`font-semibold ${v==='—'?'text-slate-700':'text-slate-300'}`}>{v}</span></div>)}
        </div>
        {pse.motif&&<div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-xs text-purple-300 leading-relaxed"><strong>Motif :</strong> {pse.motif}</div>}
      </div>
    </div>}
  </div>;
}

export default function PSEPage(){
  const[procedures,setProcedures]=useState<PSE[]>([]);const[stats,setStats]=useState<Stats|null>(null);const[loading,setLoading]=useState(true);const[showModal,setShowModal]=useState(false);const[tab,setTab]=useState<'actifs'|'historique'>('actifs');
  const load=useCallback(async()=>{setLoading(true);try{const[p,s]=await Promise.all([api.get<PSE[]>('/pse'),api.get<Stats>('/contract-rupture/eco-stats')]);setProcedures(p);setStats(s);}catch{}finally{setLoading(false);}},[]);
  useEffect(()=>{load();},[load]);
  const actifs=procedures.filter(p=>['OUVERT','EN_COURS'].includes(p.status));const historique=procedures.filter(p=>['CLOTURE','ANNULE'].includes(p.status));const displayed=tab==='actifs'?actifs:historique;

  return<div className="min-h-screen bg-[#020617] text-slate-100">
    {showModal&&<NouvellePSE onClose={()=>setShowModal(false)} onCreated={()=>{setShowModal(false);load();}}/>}

    {/* Header */}
    <div className="sticky top-0 z-30 bg-[#020617]/90 backdrop-blur-xl border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/30 shrink-0"><svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg></div>
        <div className="flex-1 min-w-0"><p className="text-sm font-bold leading-none">Plan de Sauvegarde de l'Emploi</p><p className="text-xs text-slate-500 hidden sm:block">Art. 39 CT Congo — Licenciements économiques collectifs</p></div>
        {stats?.pseRequired&&<span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/30 text-red-400 animate-pulse">PSE obligatoire · {stats.total30j} lic. éco / 30j</span>}
        <Link href="/contrats/rupture" className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-200 border border-white/10 hover:border-white/20 px-2.5 py-1.5 rounded-lg transition-all shrink-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>Rupture
        </Link>
        <button onClick={load} className="text-xs text-slate-600 hover:text-slate-300 border border-white/10 w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg></button>
        <button onClick={()=>setShowModal(true)} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg shadow-purple-500/20 shrink-0">+ Ouvrir PSE</button>
      </div>
    </div>

    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[{l:'Lic. éco — 30 jours',v:stats?.total30j??0,sub:'Seuil PSE = 5',alert:stats?.pseRequired},{l:'Lic. éco — 90 jours',v:stats?.total90j??0,sub:'3 derniers mois',alert:false},{l:'Lic. éco — Année',v:stats?.totalAnnee??0,sub:'Depuis janv.',alert:false},{l:'Procédures actives',v:actifs.length,sub:`${historique.length} clôturée(s)`,alert:false}].map(({l,v,sub,alert})=><div key={l} className={`bg-slate-900/60 border rounded-2xl p-4 shadow-xl ${alert?'border-red-500/30':'border-white/10'}`}><p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">{l}</p><p className={`text-3xl font-black tracking-tight ${alert?'text-red-400':'text-slate-100'}`}>{v}</p><p className="text-xs text-slate-600 mt-1">{sub}</p>{alert&&<p className="text-xs text-red-400 font-bold mt-1">Seuil PSE atteint</p>}</div>)}
      </div>

      {/* Alerte */}
      {stats?.pseRequired&&<div className="p-4 sm:p-5 bg-purple-950/60 border border-purple-500/30 rounded-2xl flex gap-4 items-start">
        <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0"><svg className="w-4 h-4 text-purple-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg></div>
        <div><p className="text-sm font-bold text-purple-300 mb-1">Procédure PSE obligatoire — Art. 39 CT Congo</p><p className="text-xs text-slate-400 leading-relaxed"><strong className="text-slate-200">{stats.total30j} licenciements économiques</strong> sur 30 jours — seuil légal de <strong className="text-slate-200">5</strong> dépassé. Toute rupture supplémentaire requiert l'autorisation préalable de la Commission des Litiges du Travail.</p><button onClick={()=>setShowModal(true)} className="mt-2 text-xs font-bold text-purple-400 hover:text-purple-300 underline">Ouvrir une procédure PSE</button></div>
      </div>}

      {/* Tabs */}
      <div className="flex bg-slate-800/60 rounded-xl p-0.5 gap-0.5 w-fit">
        {([{k:'actifs'as const,l:`Actives (${actifs.length})`},{k:'historique'as const,l:`Historique (${historique.length})`}]).map(t=><button key={t.k} onClick={()=>setTab(t.k)} className={`px-3 py-1.5 rounded-[10px] text-xs font-bold transition-all ${tab===t.k?'bg-gradient-to-r from-purple-600 to-indigo-600 text-white':'text-slate-500 hover:text-slate-200'}`}>{t.l}</button>)}
      </div>

      {/* Liste */}
      {loading?<div className="flex justify-center py-12"><Sp/></div>:displayed.length===0?<div className="text-center py-16 bg-slate-900/40 border border-white/10 border-dashed rounded-2xl">
        <svg className="w-10 h-10 text-slate-700 mx-auto mb-3" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18"/></svg>
        <p className="text-sm font-semibold text-slate-500 mb-1">{tab==='actifs'?'Aucune procédure PSE active':'Aucune procédure clôturée'}</p>
        <p className="text-xs text-slate-700 mb-4">{tab==='actifs'?'Se déclenche automatiquement si 5 lic. éco. ou plus sur 30 jours.':'L\'historique apparaîtra ici.'}</p>
        {tab==='actifs'&&<button onClick={()=>setShowModal(true)} className="text-xs font-bold text-purple-400 hover:text-purple-300 border border-purple-500/20 px-3 py-1.5 rounded-lg transition-all">Ouvrir manuellement</button>}
      </div>:<div className="space-y-3">{displayed.map(p=><PSECard key={p.id} pse={p} onUpdate={load}/>)}</div>}

      <div className="p-4 bg-slate-900/40 border border-white/5 rounded-xl text-xs text-slate-600 leading-relaxed">
        <strong className="text-slate-500">Note légale — Art. 39 CT Congo :</strong> Tout licenciement collectif pour motif économique de 5 salariés et plus sur 30 jours est soumis à autorisation préalable de l'Inspecteur du Travail et consultation des délégués du personnel. Le non-respect rend les licenciements nuls et de nul effet.
      </div>
    </div>
  </div>;
}