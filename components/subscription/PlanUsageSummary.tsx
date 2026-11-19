'use client';
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
const labels:Record<string,string>={maxLoansAdvances:'Prêts et avances',maxPermissionTickets:'Tickets de permission',maxAbsenceRequests:'Demandes d’absence',maxLeaveRequests:'Demandes de congé',maxPayrollGenerations:'Bulletins générés',maxDocumentsGenerated:'Documents ajoutés ou générés',maxContractGenerations:'Contrats générés',maxReportsExports:'Exports de rapports',maxJobOffers:'Offres de recrutement',maxMessages:'Messages internes',maxTrainingSessions:'Sessions de formation',maxAssets:'Matériels enregistrés',maxEvaluations:'Évaluations',maxTasks:'Tâches',maxAnnouncements:'Annonces'};
export function PlanUsageSummary() {
  const {data,isLoading,error,refetch}=useQuery<{period:string;limits:Record<string,number|boolean>;usage:Record<string,number>}>({queryKey:['subscription-entitlements'],queryFn:()=>api.get('/subscriptions/entitlements'),staleTime:0,refetchInterval:30000});
  if(isLoading)return <p role="status" className="text-sm text-[var(--text-secondary)]">Chargement de vos quotas…</p>;
  if(error)return <p className="text-sm text-[var(--text-secondary)]">Vos quotas ne sont pas disponibles. <button onClick={()=>void refetch()} className="text-[var(--action)]">Réessayer</button></p>;
  if(!data)return null;
  return <section className="rounded-2xl bg-[var(--surface)] p-5 my-6 shadow-[var(--shadow-card)]"><h2 className="font-semibold">Vos possibilités ce mois-ci</h2><p className="mt-2 text-xs text-[var(--text-secondary)]">Quotas partagés par l’entreprise · {data.period} · Remise à zéro au début du mois, heure du Congo. Des options supplémentaires peuvent être accordées par Support Konza.</p><dl className="mt-5 grid sm:grid-cols-2 gap-x-6 gap-y-4">{Object.entries(labels).map(([key,label])=>{const max=Number(data.limits[key]??0),used=data.usage[key]??0;return <div key={key}><div className="flex justify-between gap-3 text-xs"><dt>{label}</dt><dd className="font-semibold tabular-nums whitespace-nowrap">{max===-1?'Illimité':max===0?'En option':`${used} / ${max}`}</dd></div>{max>0&&<progress aria-label={label} className="w-full h-1.5 mt-2 accent-[var(--brand)]" value={Math.min(used,max)} max={max}/>}</div>;})}</dl></section>;
}
