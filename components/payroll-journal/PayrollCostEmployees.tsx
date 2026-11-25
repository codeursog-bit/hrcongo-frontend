'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import { ModuleSelect } from '@/components/ui/ModuleSelect';

type Page = {page:number;pages:number;total:number;rows:{id:string;status:string;grossSalary:number;netSalary:number;totalDeductions:number;totalEmployerCost:number;employerCharges:number;outsideGross:number;employee:{firstName:string;lastName:string;employeeNumber:string;department:{name:string};contractType:string}}[]};
const money=(value:number)=>new Intl.NumberFormat('fr-CG',{maximumFractionDigits:0}).format(value);

export function PayrollCostEmployees({month,year}:{month:number;year:number}) {
  const {bp}=useBasePath();
  const [page,setPage]=useState(1),[limit,setLimit]=useState(20),[search,setSearch]=useState(''),[query,setQuery]=useState(''),[sort,setSort]=useState('totalEmployerCost');
  const [data,setData]=useState<Page|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true);
  useEffect(()=>{const timer=setTimeout(()=>{setQuery(search.trim());setPage(1)},300);return()=>clearTimeout(timer)},[search]);
  useEffect(()=>{let active=true;setLoading(true);setData(null);setError('');
    const params=new URLSearchParams({month:String(month),year:String(year),page:String(page),limit:String(limit),search:query,sort});
    api.get<Page>(`/payroll-journal/costs/employees?${params}`).then(value=>{if(active)setData(value)}).catch(e=>{if(active)setError(e.message||'Chargement impossible')}).finally(()=>{if(active)setLoading(false)});
    return()=>{active=false};
  },[month,year,page,limit,query,sort]);
  return <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
    <div><h2 className="font-semibold text-[var(--text)]">Détail par salarié</h2><p className="text-sm text-[var(--text-muted)]">Bulletins Congo non annulés · montants enregistrés en FCFA</p></div>
    <div className="flex flex-wrap items-center gap-3">
      <input aria-label="Rechercher un salarié" placeholder="Nom ou matricule…" value={search} maxLength={100} onChange={e=>setSearch(e.target.value)} className="min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 text-[var(--text)]"/>
      <ModuleSelect aria-label="Trier les salariés" value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}}><option value="totalEmployerCost">Coût employeur décroissant</option><option value="grossSalary">Brut décroissant</option><option value="netSalary">Net décroissant</option><option value="totalDeductions">Retenues décroissantes</option></ModuleSelect>
      <ModuleSelect aria-label="Lignes par page" value={limit} onChange={e=>{setLimit(Number(e.target.value));setPage(1)}}>{[20,50,100].map(n=><option key={n} value={n}>{n} lignes</option>)}</ModuleSelect>
    </div>
    {loading?<p role="status" className="text-sm text-[var(--text-muted)]">Chargement des salariés…</p>:error?<p role="alert" className="text-[var(--danger-text)]">{error}</p>:data&&<>
      <div className="overflow-x-auto"><table className="w-full text-sm whitespace-nowrap"><thead><tr className="border-b border-[var(--border)] text-left text-[var(--text-muted)]">{['Salarié','Département / contrat','Brut','Retenues','Net','Charges patronales','Hors brut','Coût employeur','Bulletin'].map(label=><th className="p-3 font-medium" key={label}>{label}</th>)}</tr></thead><tbody>{data.rows.map(row=><tr key={row.id} className="border-b border-[var(--border)] text-[var(--text)]"><td className="p-3"><strong>{row.employee.firstName} {row.employee.lastName}</strong><div className="text-xs text-[var(--text-muted)]">{row.employee.employeeNumber}</div></td><td className="p-3">{row.employee.department.name}<div className="text-xs text-[var(--text-muted)]">{row.employee.contractType}{row.status==='DRAFT'?' · Brouillon':''}</div></td>{[row.grossSalary,row.totalDeductions,row.netSalary,row.employerCharges,row.outsideGross,row.totalEmployerCost].map((amount,index)=><td className="p-3 text-right tabular-nums" key={index}>{money(amount)}</td>)}<td className="p-3"><Link className="text-[var(--action)]" href={bp(`/paie/${row.id}`)}>Consulter</Link></td></tr>)}</tbody></table></div>
      {data.total===0&&<p className="text-sm text-[var(--text-muted)]">Aucun salarié pour cette recherche.</p>}
      <div className="flex items-center justify-between gap-3 text-sm text-[var(--text-muted)]"><span>{data.total} salarié(s) · page {data.page} / {data.pages}</span><div className="flex gap-4"><button disabled={data.page<=1} className="disabled:opacity-40" onClick={()=>setPage(data.page-1)}>Précédent</button><button disabled={data.page>=data.pages} className="disabled:opacity-40" onClick={()=>setPage(data.page+1)}>Suivant</button></div></div>
    </>}
  </section>;
}
