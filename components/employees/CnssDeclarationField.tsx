'use client';
import React, { useEffect, useState } from 'react';
import { Badge, Button } from '@/components/design-system/primitives';
import { useToast } from '@/components/design-system/feedback';
import { api } from '@/services/api';
export const cnssDeclarationLabel=(value?:boolean|null)=>value===true?'Déclaré à la CNSS':value===false?'Non déclaré à la CNSS':'Déclaration CNSS à vérifier';
export function CnssDeclarationBadge({value}:{value?:boolean|null}) {return <Badge tone={value===true?'success':value===false?'warning':'neutral'}>{cnssDeclarationLabel(value)}</Badge>;}
/** Administrative declaration of the employee, separate from payroll and monthly filings. */
export function CnssDeclarationField({value,onChange,disabled=false}:{value?:boolean|null;onChange:(value:boolean|null)=>void;disabled?:boolean}) {
  return <div className="col-span-full space-y-2">
    <label className="block text-sm font-semibold text-[var(--text)]" htmlFor="cnss-employee-declared">Employé déclaré auprès de la CNSS</label>
    <select id="cnss-employee-declared" disabled={disabled} value={value===true?'yes':value===false?'no':'unknown'} onChange={e=>onChange(e.target.value==='yes'?true:e.target.value==='no'?false:null)} className="w-full">
      <option value="unknown">À vérifier</option><option value="yes">Oui — la CNSS connaît cet employé</option><option value="no">Non — employé à déclarer</option>
    </select>
    <p className="text-xs text-[var(--text-secondary)] leading-relaxed">À confirmer par les RH à partir du dossier administratif. Ce statut est indépendant du numéro CNSS et des cotisations de paie. Le renseigner ici ne transmet aucune déclaration à la CNSS.</p>
  </div>;
}
export function CnssRegistrationEditor({employeeId,companyId,value,onSaved}:{employeeId:string;companyId?:string;value?:boolean|null;onSaved:(value:boolean|null)=>void}) {
  const [draft,setDraft]=useState<boolean|null>(value??null),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const notify=useToast();
  useEffect(()=>{setDraft(value??null);},[value,employeeId]);
  const save=async()=>{setSaving(true);setError('');try{
    const result=await api.patch<{cnssEmployeeDeclared:boolean|null}>(`/employees/${employeeId}${companyId?`?companyId=${encodeURIComponent(companyId)}`:''}`,{cnssEmployeeDeclared:draft});
    if(!result||!('cnssEmployeeDeclared'in result))throw new Error('Ce serveur doit être mis à jour pour enregistrer le statut CNSS.');
    onSaved(result.cnssEmployeeDeclared??null);notify('success','Statut CNSS enregistré');
  }catch(e:any){setError(e?.message||'Le statut CNSS n’a pas pu être enregistré.');}finally{setSaving(false);}};
  return <section className="bg-[var(--surface)] p-5 rounded-2xl space-y-4" aria-label="Suivi de déclaration de l’employé à la CNSS">
    <CnssDeclarationField value={draft} onChange={setDraft} disabled={saving}/>
    {error&&<p role="alert" className="k-error">{error}</p>}
    <Button onClick={save} loading={saving} disabled={draft===(value??null)}>Enregistrer le statut CNSS</Button>
  </section>;
}
