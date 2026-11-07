'use client';
import React,{useCallback,useEffect,useState} from 'react';
import {api} from '@/services/api';
import {useBasePath} from '@/hooks/useBasePath';

type ConnectorStatus={linked:boolean;remoteCompanyName:string|null;lastSyncAt:string|null;lastError:string|null;mappings:Record<string,string>;requirements:{key:string;label:string}[];blocked:{payrollId:string;detail:string}[];deliveries:{id:string;payrollId:string;state:string;detail:string|null;attempts:number}[];pendingPayrolls:number};
const states:Record<string,string>={PENDING:'En attente',SENT:'Reçu par Compta',FAILED:'Échec à reprendre',BLOCKED:'Bulletin à contrôler'};
const labels:Record<string,string>={GROSS:'Rémunérations brutes',NET:'Rémunérations nettes dues',NON_TAXABLE:'Indemnités non imposables',CNSS_SAL:'CNSS salariale',ITS:'ITS',BNC:'Retenue BNC',CNSS_EMP_DEBIT:'Charges CNSS patronales',CNSS_EMP_CREDIT:'CNSS patronale à reverser'};
const button='inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[var(--border)] px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 disabled:cursor-not-allowed disabled:opacity-50';
export function ComptaConnectorPanel(){
 const {companyId}=useBasePath();
 const query=companyId?'?companyId='+encodeURIComponent(companyId):'';
 const [data,setData]=useState<ConnectorStatus|null>(null),[mapping,setMapping]=useState<Record<string,string>>({});
 const [code,setCode]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState<string|null>(null),[message,setMessage]=useState<string|null>(null);
 const accept=(next:ConnectorStatus)=>{setData(next);setMapping(next.mappings);};
 const load=useCallback(async()=>{try{accept(await api.get<ConnectorStatus>('/compta-connector'+query));setError(null);}catch(e){setError(e instanceof Error?e.message:'Chargement du connecteur impossible.');}},[query]);
 useEffect(()=>{setData(null);setMessage(null);void load();},[load]);
 const action=async(name:'pair'|'sync'|'mappings'|'suspend')=>{
  if(busy)return;setBusy(true);setError(null);setMessage(null);
  try{
   const path='/compta-connector/'+name+query;
   const result=name==='mappings'?await api.patch<ConnectorStatus>(path,{mappings:Object.fromEntries(Object.entries(mapping).filter(([,v])=>v.trim()).map(([k,v])=>[k,v.trim()]))}):await api.post<ConnectorStatus>(path,name==='pair'?{code:code.trim()}:{});
   accept(result);if(name==='pair')setCode('');
   const failed=result.lastError||result.blocked.length||result.deliveries.some(d=>d.state==='FAILED'||d.state==='BLOCKED');
   setMessage(name==='sync'?(failed?'Synchronisation terminée avec des éléments à contrôler. Consultez les détails ci-dessous.':'Synchronisation terminée. Les états affichés ont été actualisés.'):name==='mappings'?'Affectations enregistrées.':name==='suspend'?'Échanges automatiques suspendus.':'Liaison confirmée.');
  }catch(e){setError(e instanceof Error?e.message:'Échange impossible.');}finally{setBusy(false);}
 };
 const requirements=new Map((data?.requirements??[]).map(row=>[row.key,row.label]));
 for(const key of Object.keys(data?.mappings??{}))if(!requirements.has(key))requirements.set(key,labels[key]??key);
 return <section className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-6 space-y-5 text-[var(--text)]" aria-label="Connecteur Konza Compta" aria-busy={busy}>
  <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="text-lg font-bold">Liaison avec Konza Compta</h2>{data&&<span className={`rounded-full px-3 py-1 text-xs font-semibold ${data.linked?'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400':'bg-amber-500/15 text-amber-700 dark:text-amber-400'}`}>{data.linked?'Connecté':'Non connecté'}</span>}</div>
  <p className="text-sm leading-relaxed text-[var(--text-muted)]">Seuls les bulletins passés « À payer » sont transmis ; ce statut les verrouille dans RH. Le paiement reste une action explicite dans Compta ; sa confirmation signée met à jour RH.</p>
  {error&&<p role="alert" className="rounded-xl bg-red-500/10 p-3 text-sm text-red-600 dark:text-red-400 break-words">{error}</p>}
  {message&&<p role="status" className="rounded-xl bg-emerald-500/10 p-3 text-sm">{message}</p>}
  {!data&&!error&&<p role="status">Chargement de la liaison…</p>}
  {data&&<>
   <p className="text-sm font-medium break-words">{data.linked?'Entreprise reliée : '+data.remoteCompanyName:'Aucune liaison active.'}</p>
   {!data.linked&&<div className="space-y-3"><p className="text-sm text-[var(--text-muted)]">Dans Compta → Intégrations → Konza RH, générez un code après vérification du dossier. Collez-le ici pour confirmer la liaison avec cette entreprise RH.</p><label className="block text-sm font-medium">Code de liaison<input className="mt-2 block min-h-[44px] w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3" value={code} onChange={e=>setCode(e.target.value)} autoComplete="off"/></label><button className={button+' bg-emerald-600 text-white hover:bg-emerald-700'} type="button" disabled={busy||!code.trim()} onClick={()=>void action('pair')}>Confirmer la liaison</button></div>}
   {data.linked&&<>
    <p className="text-sm text-[var(--text-muted)]">Affectations comptables : indiquez les comptes actifs du dossier Compta pour chaque rubrique. Les affectations enregistrées restent visibles après le paiement.</p>
    {!!requirements.size&&<div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full text-sm"><thead className="bg-[var(--surface-2)]"><tr><th className="p-3 text-left">Rubrique RH</th><th className="p-3 text-left">Compte SYSCOHADA</th></tr></thead><tbody>{Array.from(requirements).map(([key,label])=><tr key={key} className="border-t border-[var(--border)]"><td className="p-3">{label}</td><td className="p-3"><input aria-label={'Compte pour '+label} inputMode="numeric" className="min-h-[44px] w-full min-w-[90px] max-w-[180px] rounded-lg border border-[var(--border)] p-2 bg-transparent font-mono" value={mapping[key]??''} onChange={e=>setMapping(m=>({...m,[key]:e.target.value}))}/></td></tr>)}</tbody></table></div>}
    {!data.requirements.length&&<p className="text-sm text-[var(--text-muted)]">Aucun nouveau bulletin « À payer » à affecter.</p>}
    <div className="flex flex-col sm:flex-row flex-wrap gap-3"><button className={button} type="button" disabled={busy||!requirements.size} onClick={()=>void action('mappings')}>Enregistrer les affectations</button><button className={button+' bg-emerald-600 text-white hover:bg-emerald-700'} type="button" disabled={busy} onClick={()=>void action('sync')}>{busy?'Échange en cours…':'Synchroniser maintenant'}</button><button className={button+' text-red-600 dark:text-red-400'} type="button" disabled={busy} onClick={()=>void action('suspend')}>Suspendre les échanges RH</button></div>
   </>}
   <p className="text-xs leading-relaxed text-[var(--text-muted)]">Dernier contrôle : {data.lastSyncAt?new Date(data.lastSyncAt).toLocaleString('fr-FR',{timeZone:'Africa/Brazzaville'}):'Aucun'}. {data.linked?'Les échanges automatiques reprennent chaque minute.':'Les échanges automatiques sont suspendus.'} Liste limitée à 500 bulletins éligibles et 100 transmissions récentes.</p>
   {data.lastError&&<p role="alert" className="text-red-600 dark:text-red-400 whitespace-pre-wrap break-words">{data.lastError}</p>}
   {data.blocked.map(p=><p className="text-red-600 dark:text-red-400 text-sm break-words" key={p.payrollId}>Bulletin {p.payrollId.slice(0,8)} : {p.detail}</p>)}
   {data.deliveries.length>0&&<div className="overflow-x-auto rounded-xl border border-[var(--border)]"><table className="w-full text-sm text-left"><caption className="p-3 text-left font-semibold">Transmissions réellement enregistrées</caption><thead className="bg-[var(--surface-2)]"><tr>{['Bulletin','État','Essais','Détail'].map(label=><th className="p-3" key={label}>{label}</th>)}</tr></thead><tbody>{data.deliveries.map(d=><tr key={d.id} className="border-t border-[var(--border)]"><td className="p-3 font-mono">{d.payrollId.slice(0,8)}</td><td className="p-3"><span className={d.state==='SENT'?'text-emerald-600 dark:text-emerald-400':'text-amber-700 dark:text-amber-400'}>{states[d.state]??d.state}</span></td><td className="p-3">{d.attempts}</td><td className="p-3 break-words">{d.detail??'—'}</td></tr>)}</tbody></table></div>}
  </>}
  <button className={button} type="button" disabled={busy} onClick={()=>void load()}>Actualiser la liaison</button>
 </section>;
}
