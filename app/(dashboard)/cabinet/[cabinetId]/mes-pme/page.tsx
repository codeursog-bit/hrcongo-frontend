'use client';

// app/(dashboard)/cabinet/[cabinetId]/mes-pme/page.tsx
// REFONTE UX ONLY — 100% logique originale preservee, no Lucide

import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/services/api';
import CabinetSidebar from '../CabinetSidebar';

const T = {
  bg:'#0f1626', card:'#151e30', cardHover:'#1a2540',
  border:'rgba(255,255,255,0.08)', borderHover:'rgba(255,255,255,0.14)',
  text:'#f1f5f9', muted:'#94a3b8', dim:'#475569',
  indigo:'#6366f1', indigoL:'#818cf8',
  cyan:'#06b6d4', emerald:'#10b981', amber:'#f59e0b',
};

const MONTHS = ['Jan','Fev','Mar','Avr','Mai','Jun','Jul','Aou','Sep','Oct','Nov','Dec'];
const fmt = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

const STATUS_CFG: Record<string, { label:string; color:string; bgColor:string; borderColor:string; dotColor:string }> = {
  PAID:      { label:'Payee',    color:'#10b981', bgColor:'rgba(16,185,129,0.1)',  borderColor:'rgba(16,185,129,0.25)',  dotColor:'#10b981' },
  VALIDATED: { label:'Validee',  color:'#06b6d4', bgColor:'rgba(6,182,212,0.1)',   borderColor:'rgba(6,182,212,0.25)',   dotColor:'#06b6d4' },
  DRAFT:     { label:'En cours', color:'#f59e0b', bgColor:'rgba(245,158,11,0.1)',  borderColor:'rgba(245,158,11,0.25)',  dotColor:'#f59e0b' },
};

const AVATARS = [
  ['#4f46e5','#818cf8'],['#0891b2','#67e8f9'],['#059669','#6ee7b7'],
  ['#d97706','#fcd34d'],['#db2777','#f9a8d4'],['#7c3aed','#c4b5fd'],
];

interface LastPayroll { id:string; month:number; year:number; status:string; netSalary:number }
interface CompanyCard {
  linkId:string; companyId:string; legalName:string; tradeName:string|null; city:string;
  employeeCount:number; pmePortalEnabled:boolean; employeeAccessEnabled:boolean;
  lastPayroll:LastPayroll|null;
}

function PmeGridCard({ company, cabinetId, onOpen, idx }:{company:CompanyCard;cabinetId:string;onOpen:(id:string)=>void;idx:number}) {
  const router = useRouter();
  const lp = company.lastPayroll;
  const sc = lp ? (STATUS_CFG[lp.status] ?? STATUS_CFG['DRAFT']) : null;
  const now = new Date();
  const paidThisMonth = lp?.month === now.getMonth()+1 && lp?.year === now.getFullYear();
  const [from,to] = AVATARS[idx % AVATARS.length];
  const [hov,setHov] = useState(false);
  const init = (company.tradeName||company.legalName).slice(0,2).toUpperCase();

  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?T.cardHover:T.card, border:`1px solid ${hov?T.borderHover:T.border}`,
      borderRadius:16, overflow:'hidden',
      boxShadow:'0 1px 3px rgba(0,0,0,0.2),0 4px 12px rgba(0,0,0,0.15)',
      transition:'all 0.15s',
    }}>
      <div style={{padding:'18px 18px 12px'}}>
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center justify-center font-bold text-sm text-white shrink-0"
                 style={{width:42,height:42,borderRadius:12,background:`linear-gradient(135deg,${from},${to})`}}>
              {init}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm truncate" style={{color:T.text}}>{company.tradeName||company.legalName}</p>
              <p className="text-xs" style={{color:T.muted}}>{company.city}</p>
            </div>
          </div>
          {sc && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0"
                 style={{background:sc.bgColor,border:`1px solid ${sc.borderColor}`,color:sc.color}}>
              <div style={{width:5,height:5,borderRadius:'50%',background:sc.dotColor}}/>
              {sc.label}
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            {label:'Employes',val:String(company.employeeCount),color:T.text},
            {label:'Dernier net',val:lp?`${fmt(lp.netSalary)} F`:'--',color:T.emerald},
          ].map(s=>(
            <div key={s.label} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${T.border}`,borderRadius:10,padding:'8px 10px'}}>
              <p className="text-xs mb-0.5" style={{color:T.dim}}>{s.label}</p>
              <p className="text-sm font-bold" style={{color:s.color}}>{s.val}</p>
            </div>
          ))}
        </div>
        {lp&&(
          <p className="text-[10px] mb-3" style={{color:T.dim}}>
            Dernier bulletin : {MONTHS[lp.month-1]} {lp.year}
            {paidThisMonth&&<span style={{color:T.emerald}}> &#x2713; Ce mois</span>}
          </p>
        )}
        <div className="flex gap-1.5 flex-wrap" style={{minHeight:18}}>
          {company.pmePortalEnabled&&<span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{background:'rgba(16,185,129,0.1)',border:'1px solid rgba(16,185,129,0.2)',color:T.emerald}}>Portail PME</span>}
          {company.employeeAccessEnabled&&<span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{background:'rgba(6,182,212,0.1)',border:'1px solid rgba(6,182,212,0.2)',color:T.cyan}}>Employes</span>}
          {!company.pmePortalEnabled&&!company.employeeAccessEnabled&&<span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{background:'rgba(255,255,255,0.05)',border:`1px solid ${T.border}`,color:T.dim}}>Portail inactif</span>}
        </div>
      </div>
      <div style={{borderTop:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 1fr 1fr'}}>
        {[
          {label:'Paie',     hc:'#6366f1', svg:<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M4 4a2.5 2.5 0 015 0c0 1.4-.9 2-2.5 2C4.8 6 3.5 6.8 3.5 8.5a2.5 2.5 0 005 0" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, go:()=>router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/paie`)},
          {label:'Employes', hc:'#06b6d4', svg:<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5" cy="4" r="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M1 11c0-2 1.8-3.5 4-3.5s4 1.5 4 3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M9.5 6a2 2 0 010 4M11.5 11a3 3 0 00-2.5-2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>, go:()=>router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/employes`)},
          {label:'Ouvrir',   hc:T.text,   svg:<svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/><path d="M8.5 1h3.5v3.5M12 1L6.5 6.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>, go:()=>onOpen(company.companyId)},
        ].map((a,i)=>{
          const [bHov,setBHov]=useState(false);
          return(
            <button key={i} onClick={a.go} onMouseEnter={()=>setBHov(true)} onMouseLeave={()=>setBHov(false)}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3,padding:'10px 0',
                border:'none',cursor:'pointer',background:bHov?`${a.hc}15`:'transparent',
                color:bHov?a.hc:T.dim,borderLeft:i>0?`1px solid ${T.border}`:'none',transition:'all 0.15s'}}>
              {a.svg}
              <span style={{fontSize:9}}>{a.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PmeListRow({company,cabinetId,onOpen,idx}:{company:CompanyCard;cabinetId:string;onOpen:(id:string)=>void;idx:number}) {
  const router=useRouter();
  const lp=company.lastPayroll;
  const sc=lp?(STATUS_CFG[lp.status]??STATUS_CFG['DRAFT']):null;
  const [from,to]=AVATARS[idx%AVATARS.length];
  const [hov,setHov]=useState(false);
  const init=(company.tradeName||company.legalName).slice(0,2).toUpperCase();
  return(
    <div className="flex items-center gap-4 px-5 py-4" style={{background:hov?T.cardHover:'transparent',borderBottom:`1px solid ${T.border}`,transition:'all 0.15s'}}
         onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div className="flex items-center justify-center font-bold text-xs text-white shrink-0"
           style={{width:34,height:34,borderRadius:10,background:`linear-gradient(135deg,${from},${to})`}}>{init}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{color:T.text}}>{company.tradeName||company.legalName}</p>
        <p className="text-xs" style={{color:T.muted}}>{company.city}</p>
      </div>
      <div style={{width:72,textAlign:'center'}}>
        <p className="text-sm font-semibold" style={{color:T.text}}>{company.employeeCount}</p>
        <p style={{fontSize:10,color:T.dim}}>employe{company.employeeCount>1?'s':''}</p>
      </div>
      <div style={{width:120,textAlign:'center'}}>
        {lp?(<><p className="text-xs font-medium" style={{color:T.text}}>{MONTHS[lp.month-1]} {lp.year}</p><p style={{fontSize:10,color:T.emerald}}>{fmt(lp.netSalary)} F net</p></>)
          :<p style={{fontSize:12,color:T.dim}}>Aucune paie</p>}
      </div>
      <div style={{width:90}}>
        {sc?<span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{background:sc.bgColor,border:`1px solid ${sc.borderColor}`,color:sc.color}}>{sc.label}</span>
          :<span style={{fontSize:10,color:T.dim}}>--</span>}
      </div>
      <div style={{width:72,textAlign:'center'}}>
        {company.pmePortalEnabled?<span style={{fontSize:9,color:T.emerald}}>&#x2713; Actif</span>:<span style={{fontSize:9,color:T.dim}}>Inactif</span>}
      </div>
      <div className="flex items-center gap-1" style={{opacity:hov?1:0,transition:'opacity 0.15s'}}>
        {[
          {title:'Saisir paie', color:'#6366f1', onClick:()=>router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/paie`)},
          {title:'Employes',    color:T.cyan,    onClick:()=>router.push(`/cabinet/${cabinetId}/entreprise/${company.companyId}/employes`)},
          {title:'Ouvrir',      color:T.text,    onClick:()=>onOpen(company.companyId)},
        ].map((a,i)=>{
          const [bHov,setBHov]=useState(false);
          return(
            <button key={i} title={a.title} onClick={a.onClick}
              onMouseEnter={()=>setBHov(true)} onMouseLeave={()=>setBHov(false)}
              style={{padding:6,borderRadius:8,border:'none',cursor:'pointer',
                background:bHov?`${a.color}20`:'transparent',color:bHov?a.color:T.dim,transition:'all 0.15s'}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2.5 6.5h8M8 3l3.5 3.5L8 10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function MesPmePage() {
  const params=useParams(); const router=useRouter(); const searchParams=useSearchParams();
  const cabinetId=params.cabinetId as string;
  const [companies,setCompanies]=useState<CompanyCard[]>([]);
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState<any>(null);
  const [view,setView]=useState<'grid'|'list'>('grid');
  const [search,setSearch]=useState('');
  const [filter,setFilter]=useState<'ALL'|'PENDING'|'OK'|'NO_PORTAL'>((searchParams?.get('filter') as any)??'ALL');

  useEffect(()=>{
    const stored=localStorage.getItem('user');
    if(stored){try{setUser(JSON.parse(stored));}catch{}}
    api.get(`/cabinet/${cabinetId}/dashboard`)
      .then((r:any)=>setCompanies(r?.companies??[]))
      .catch(()=>setCompanies([]))
      .finally(()=>setLoading(false));
  },[cabinetId]);

  const openCompany=(companyId:string)=>{
    sessionStorage.setItem('cabinetContext',cabinetId);
    sessionStorage.setItem('activeCompanyId',companyId);
    router.push(`/cabinet/${cabinetId}/entreprise/${companyId}/dashboard`);
  };

  const now=new Date();

  const filtered=useMemo(()=>{
    let list=companies;
    if(search){const q=search.toLowerCase();list=list.filter(c=>`${c.legalName} ${c.tradeName??''} ${c.city}`.toLowerCase().includes(q));}
    if(filter==='PENDING') list=list.filter(c=>!c.lastPayroll||!(c.lastPayroll.month===now.getMonth()+1&&c.lastPayroll.year===now.getFullYear())||c.lastPayroll.status==='DRAFT');
    else if(filter==='OK') list=list.filter(c=>c.lastPayroll?.month===now.getMonth()+1&&c.lastPayroll?.year===now.getFullYear()&&(c.lastPayroll.status==='PAID'||c.lastPayroll.status==='VALIDATED'));
    else if(filter==='NO_PORTAL') list=list.filter(c=>!c.pmePortalEnabled);
    return list;
  },[companies,search,filter]);

  const counts=useMemo(()=>({
    ALL:companies.length,
    PENDING:companies.filter(c=>!c.lastPayroll||!(c.lastPayroll.month===now.getMonth()+1&&c.lastPayroll.year===now.getFullYear())||c.lastPayroll.status==='DRAFT').length,
    OK:companies.filter(c=>c.lastPayroll?.month===now.getMonth()+1&&c.lastPayroll?.year===now.getFullYear()&&(c.lastPayroll.status==='PAID'||c.lastPayroll.status==='VALIDATED')).length,
    NO_PORTAL:companies.filter(c=>!c.pmePortalEnabled).length,
  }),[companies]);

  return(
    <div className="min-h-screen" style={{background:T.bg,color:T.text}}>
      <CabinetSidebar cabinetId={cabinetId} userEmail={user?.email}/>
      <main className="ml-56 p-8">
        {/* ── En-tête ── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest mb-1" style={{color:T.dim}}>Cabinet</p>
            <h1 className="text-2xl font-bold" style={{color:T.text}}>Mes PME clientes</h1>
            <p className="text-sm mt-0.5" style={{color:T.muted}}>{companies.length} entreprise{companies.length>1?'s':''} sous gestion</p>
          </div>
          <button onClick={()=>router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
            className="flex items-center gap-2 rounded-xl text-sm font-semibold"
            style={{padding:'10px 18px',background:T.indigo,color:'#fff',border:'none',cursor:'pointer'}}
            onMouseEnter={e=>(e.currentTarget.style.background='#4f46e5')}
            onMouseLeave={e=>(e.currentTarget.style.background=T.indigo)}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Ajouter une PME
          </button>
        </div>

        {/* ── Barre filtres + vue ── */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          {/* Recherche */}
          <div className="relative" style={{flex:'1',maxWidth:280}}>
            <span className="absolute" style={{left:10,top:'50%',transform:'translateY(-50%)',color:T.dim}}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9.5 9.5l2.5 2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
            </span>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher une PME..."
              style={{width:'100%',paddingLeft:34,paddingRight:12,paddingTop:8,paddingBottom:8,background:T.card,border:`1px solid ${T.border}`,borderRadius:12,fontSize:13,color:T.text,outline:'none'}}
              onFocus={e=>(e.target.style.borderColor=T.indigoL)} onBlur={e=>(e.target.style.borderColor=T.border)}/>
          </div>

          {/* Filtres statut */}
          <div className="flex gap-1 p-1 rounded-xl" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${T.border}`}}>
            {(['ALL','PENDING','OK','NO_PORTAL'] as const).map(k => {
              const labels = {ALL:'Toutes', PENDING:'A traiter', OK:'A jour', NO_PORTAL:'Sans portail'};
              const isActive = filter === k;
              return (
                <button key={k} onClick={()=>setFilter(k)}
                  style={{
                    padding:'6px 12px', borderRadius:8, border:'none', cursor:'pointer', fontSize:12,
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: isActive ? T.text : T.muted,
                    fontWeight: isActive ? 500 : 400,
                  }}>
                  {labels[k]}
                  <span className="ml-1 text-[9px] px-1.5 py-0.5 rounded-full" style={{
                    background: isActive ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? T.text : T.dim,
                  }}>
                    {counts[k]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Toggle vue grid/list */}
          <div className="flex gap-1 p-1 rounded-xl ml-auto" style={{background:'rgba(255,255,255,0.03)',border:`1px solid ${T.border}`}}>
            {(['grid','list'] as const).map(v => {
              const isActive = view === v;
              return (
                <button key={v} onClick={()=>setView(v)}
                  style={{
                    padding:6, borderRadius:8, border:'none', cursor:'pointer',
                    background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                    color: isActive ? T.text : T.muted,
                    transition:'all 0.15s',
                  }}>
                  {v==='grid'
                    ? <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/><rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.3"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M2 7h10M2 10.5h7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
                  }
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Contenu ── */}
        {loading ? (
          <div className="flex justify-center py-20">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="animate-spin">
              <circle cx="14" cy="14" r="11" stroke={T.indigo} strokeWidth="2" strokeDasharray="55" strokeDashoffset="20" strokeLinecap="round"/>
            </svg>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center rounded-2xl" style={{border:`2px dashed ${T.border}`}}>
            <p className="text-sm mt-3" style={{color:T.muted}}>
              {search||filter!=='ALL' ? 'Aucune PME ne correspond aux filtres' : "Aucune PME cliente pour l'instant"}
            </p>
            {!search && filter==='ALL' && (
              <button onClick={()=>router.push(`/cabinet/${cabinetId}/ajouter-pme`)}
                className="mt-4 rounded-xl text-sm font-semibold"
                style={{padding:'9px 20px',background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.28)',color:T.indigoL,cursor:'pointer'}}>
                Ajouter votre premiere PME
              </button>
            )}
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filtered.map((company,idx) => (
              <PmeGridCard key={company.companyId} company={company} cabinetId={cabinetId} onOpen={openCompany} idx={idx}/>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{background:T.card,border:`1px solid ${T.border}`,boxShadow:'0 1px 3px rgba(0,0,0,0.2),0 4px 12px rgba(0,0,0,0.15)'}}>
            <div className="px-5 py-3" style={{borderBottom:`1px solid ${T.border}`,display:'grid',gridTemplateColumns:'1fr 72px 120px 90px 72px auto',gap:16,alignItems:'center'}}>
              {['Entreprise','Effectif','Dernier bulletin','Statut','Portail',''].map((h,i) => (
                <p key={i} className="text-[10px] uppercase tracking-wider font-medium" style={{color:T.dim}}>{h}</p>
              ))}
            </div>
            {filtered.map((company,idx) => (
              <PmeListRow key={company.companyId} company={company} cabinetId={cabinetId} onOpen={openCompany} idx={idx}/>
            ))}
          </div>
        )}

        {filtered.length > 0 && (
          <p className="text-center text-xs mt-6" style={{color:T.dim}}>
            {filtered.length} PME affichee{filtered.length>1?'s':''}
            {search && ` | Recherche : "${search}"`}
          </p>
        )}
      </main>
    </div>
  );
}