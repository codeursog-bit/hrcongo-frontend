'use client';
import React,{useEffect,useRef,useState} from 'react';
import { Loader2, LockKeyhole, Search, Trash2 } from 'lucide-react';
import { adminService } from '@/lib/services/adminService';

interface AccessState {plan:string;options:Record<string,string>;limits:Record<string,boolean|number>;usage:Record<string,number>;period:string;overrides:Record<string,{value:boolean|number;expiresAt?:string|null;note?:string}>}
export function CompanyEntitlements() {
  const [search,setSearch]=useState(''),[companies,setCompanies]=useState<any[]>([]),[company,setCompany]=useState('');
  const [data,setData]=useState<AccessState|null>(null),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false),[busy,setBusy]=useState(false),[key,setKey]=useState('hasDASDeclaration');
  const [value,setValue]=useState<boolean|number>(true),[until,setUntil]=useState(''),[note,setNote]=useState('');
  const generation=useRef(0);
  useEffect(()=>{let cancelled=false;const timer=setTimeout(()=>{adminService.getCompanies({search}).then((response:any)=>{if(!cancelled)setCompanies(Array.isArray(response)?response:response?.data??response?.companies??[]);}).catch(()=>{if(!cancelled)setError('Impossible de charger les entreprises.');});},250);return()=>{cancelled=true;clearTimeout(timer);};},[search]);
  useEffect(()=>{const revision=++generation.current;setData(null);setError('');setNotice('');if(!company)return;setLoading(true);
    adminService.getCompanyEntitlements(company).then(result=>{if(revision===generation.current)setData(result);}).catch(e=>{if(revision===generation.current)setError(e.message);}).finally(()=>{if(revision===generation.current)setLoading(false);});
  },[company]);
  const choose=(next:string)=>{setKey(next);setValue(data?.limits[next]??(next.startsWith('has')?true:0));setUntil('');setNote('');};
  const save=async(event:React.FormEvent)=>{event.preventDefault();if(!company||!data)return;setBusy(true);setError('');setNotice('');const revision=generation.current;
    try{const result=await adminService.setCompanyEntitlement(company,key,{value,expiresAt:until?new Date(until).toISOString():null,note});if(revision===generation.current){setData(result);setNotice('Option enregistrée. L’entreprise conserve son offre actuelle.');}}catch(e:any){if(revision===generation.current)setError(e.message);}finally{setBusy(false);}};
  const remove=async(option:string)=>{setBusy(true);setError('');const revision=generation.current;try{const result=await adminService.removeCompanyEntitlement(company,option);if(revision===generation.current){setData(result);setNotice('Option retirée : les droits de l’offre s’appliquent à nouveau.');}}catch(e:any){if(revision===generation.current)setError(e.message);}finally{setBusy(false);}};
  const field='w-full rounded-xl bg-[var(--surface-2)] px-3 py-3 text-sm text-[var(--text)]';
  return <section className="rounded-2xl bg-[var(--surface)] p-6 text-[var(--text)] space-y-6">
    <div><h2 className="text-lg font-semibold flex items-center gap-2"><LockKeyhole size={19} strokeWidth={1.5}/>Options et quotas par entreprise</h2><p className="mt-2 text-sm text-[var(--text-secondary)]">Accordez une fonctionnalité ou un quota supplémentaire après accord commercial. L’offre et son prix restent inchangés ; le règlement de l’option est géré séparément.</p></div>
    <div className="grid md:grid-cols-2 gap-4"><label className="text-sm">Rechercher une entreprise<div className="relative mt-2"><Search size={15} className="absolute left-3 top-4 opacity-60"/><input className={`${field} pl-9`} value={search} onChange={e=>setSearch(e.target.value)} placeholder="Nom de l’entreprise"/></div></label><label className="text-sm">Entreprise<select className={`${field} mt-2`} value={company} onChange={e=>setCompany(e.target.value)}><option value="">Choisir une entreprise</option>{companies.map(c=><option key={c.id} value={c.id}>{c.name||c.tradeName||c.legalName}</option>)}</select></label></div>
    {loading&&<p role="status" className="flex gap-2 text-sm"><Loader2 size={16} className="animate-spin"/>Chargement des droits…</p>}
    {error&&<p role="alert" className="text-sm text-[var(--danger-text)]">{error}</p>}{notice&&<p role="status" className="text-sm text-[var(--action)]">{notice}</p>}
    {data&&<><p className="text-sm">Offre actuelle : <strong>{data.plan}</strong> · Quotas de {data.period} (heure du Congo)</p>
      <form onSubmit={save} className="grid md:grid-cols-2 gap-4">
        <label className="text-sm">Fonctionnalité ou quota<select className={`${field} mt-2`} value={key} onChange={e=>choose(e.target.value)}>{Object.entries(data.options).map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
        <label className="text-sm">Valeur{key.startsWith('has')?<select className={`${field} mt-2`} value={String(value)} onChange={e=>setValue(e.target.value==='true')}><option value="true">Activée</option><option value="false">Désactivée</option></select>:<input type="number" min={-1} max={10000000} required className={`${field} mt-2`} value={typeof value==='number'?value:0} onChange={e=>setValue(Number(e.target.value))}/>}</label>
        <label className="text-sm">Fin de l’option (facultatif)<input type="datetime-local" className={`${field} mt-2`} value={until} onChange={e=>setUntil(e.target.value)}/></label>
        <label className="text-sm">Référence ou motif<input maxLength={500} className={`${field} mt-2`} value={note} onChange={e=>setNote(e.target.value)} placeholder="Ex. DAS annuelle — accord client"/></label>
        <p className="text-xs text-[var(--text-secondary)] md:col-span-2">Pour ouvrir un module soumis à quota, activez la fonctionnalité puis accordez un quota suffisant si celui de l’offre est nul. −1 signifie illimité.</p>
        <button disabled={busy} className="justify-self-start rounded-xl px-5 py-3 bg-[var(--brand)] text-[var(--on-brand)] text-sm font-semibold disabled:opacity-50">{busy?'Enregistrement…':'Enregistrer l’option'}</button>
      </form>
      <div className="overflow-x-auto"><table className="w-full text-sm"><caption className="text-left font-semibold py-3">Options spécifiques à cette entreprise</caption><thead className="text-left text-[var(--text-secondary)]"><tr><th className="p-3">Option</th><th className="p-3">Valeur</th><th className="p-3">Fin</th><th className="p-3">Motif</th><th className="p-3">Action</th></tr></thead><tbody>{Object.entries(data.overrides).map(([id,entry])=><tr key={id} className="border-t border-[var(--border)]"><td className="p-3">{data.options[id]||id}</td><td className="p-3">{typeof entry.value==='boolean'?(entry.value?'Activée':'Désactivée'):entry.value===-1?'Illimité':entry.value}</td><td className="p-3">{entry.expiresAt?new Date(entry.expiresAt).toLocaleString('fr-FR'):'Sans date de fin'}</td><td className="p-3">{entry.note||'—'}</td><td className="p-3"><button disabled={busy} type="button" onClick={()=>void remove(id)} className="inline-flex gap-2 items-center text-[var(--danger-text)]"><Trash2 size={14}/>Retirer</button></td></tr>)}</tbody></table>{!Object.keys(data.overrides).length&&<p className="py-4 text-sm text-[var(--text-secondary)]">Aucune option spécifique : les droits de l’offre s’appliquent.</p>}</div>
      <details><summary className="cursor-pointer text-sm">Voir les droits et limites effectifs</summary><dl className="grid sm:grid-cols-2 gap-3 mt-4">{Object.entries(data.options).map(([id,label])=><div key={id} className="rounded-xl bg-[var(--surface-2)] p-3 text-xs"><dt>{label}</dt><dd className="mt-2 font-semibold">{typeof data.limits[id]==='boolean'?(data.limits[id]?'Inclus':'En option'):data.limits[id]===-1?'Illimité':data.limits[id]??'—'}{data.usage[id]!==undefined&&` · ${data.usage[id]} utilisé(s)`}</dd></div>)}</dl></details>
    </>}
  </section>;
}
