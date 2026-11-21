'use client';
import React from 'react';
import Link from 'next/link';
import { Card, Skeleton } from '@/components/design-system/primitives';

interface RegistrationSummary {
  cnss: { declared?:number;notDeclared?:number;unverified?:number;numberRecorded:number;numberMissing:number;contributionEnabled:number;contributionDisabled:number;contributionEnabledWithoutNumber:number };
  incomeTax: { withholdingEnabled:number;withholdingDisabled:number };
}
export interface WorkforceSummary {
  total:number;
  byContractType?:{type:string;label:string;count:number}[];
  registrationSummary?:RegistrationSummary|null;
}
// Toujours affichés : les contrats courants. Les autres (intérim, consultant, prestataire…) n'apparaissent
// qu'à partir du moment où au moins un employé en a un.
const contracts=[['CDI','CDI'],['CDD','CDD'],['STAGE','Stages']];
const optionalOrder=['INTERIM','CONSULTANT','PRESTATAIRE'];
const optionalLabels:Record<string,string>={INTERIM:'Intérim',CONSULTANT:'Consultants',PRESTATAIRE:'Prestataires'};
export function WorkforceOverview({summary,loading,filtered,canOpenDeclaration,declarationHref}:{summary:WorkforceSummary|null;loading:boolean;filtered:boolean;canOpenDeclaration:boolean;declarationHref:string}) {
  const value=(n:number|undefined)=>loading?<Skeleton style={{height:32,width:64}}/>:typeof n==='number'?n.toLocaleString('fr-FR'):'—';
  const cnss=summary?.registrationSummary?.cnss,tax=summary?.registrationSummary?.incomeTax;
  return <section className="workforce-overview template-stack" aria-label="Tableau de bord des effectifs" aria-busy={loading}>
    <div className="workforce-overview-heading"><div><h2>Vue d’ensemble des effectifs</h2><p>{filtered?'Périmètre de la recherche et des filtres actifs.':'Tous les employés actifs de votre périmètre autorisé.'}</p></div><span>Les indicateurs portent sur l’ensemble des résultats, toutes pages confondues.</span></div>
    <div className="workforce-kpis">
      <Card className="workforce-total"><p>Effectif total</p><strong>{value(summary?.total)}</strong><span>Employés actifs</span></Card>
      {contracts.map(([type,label])=><Card key={type}><p>{label}</p><strong>{value(summary?summary.byContractType?.find(c=>c.type===type)?.count ?? (Array.isArray(summary.byContractType)?0:undefined):undefined)}</strong><span>Type de contrat</span></Card>)}
      {(summary?.byContractType||[]).filter(c=>!contracts.some(([type])=>c.type===type)&&c.count>0).sort((a,b)=>{const ia=optionalOrder.indexOf(a.type),ib=optionalOrder.indexOf(b.type);return (ia<0?99:ia)-(ib<0?99:ib);}).map(c=><Card key={c.type}><p>{optionalLabels[c.type]||c.label}</p><strong>{value(c.count)}</strong><span>Type de contrat</span></Card>)}
    </div>
    {canOpenDeclaration&&<div className="workforce-admin-grid">
      <Card title="Employés déclarés auprès de la CNSS">
        <p className="workforce-note">Statut administratif confirmé par les RH : la CNSS connaît cet employé. Aucun statut n’est déduit du numéro ou des retenues de paie.</p>
        <dl className="workforce-metrics"><div><dt>Déclarés à la CNSS</dt><dd>{value(cnss?.declared)}</dd></div><div data-tone="warning"><dt>Non déclarés — à déclarer</dt><dd>{value(cnss?.notDeclared)}</dd></div><div><dt>Statut à vérifier</dt><dd>{value(cnss?.unverified)}</dd></div></dl>
        {!loading&&(!cnss||typeof cnss.declared!=='number')&&<p className="workforce-note">Le suivi des déclarations d’employés CNSS nécessite la mise à jour du serveur.</p>}
        {canOpenDeclaration&&<Link href={declarationHref} className="workforce-followup">Ouvrir les déclarations mensuelles CNSS</Link>}
      </Card>
      <Card title="Retenues de paie">
        <p className="workforce-note">Réglages des dossiers employés. Une retenue activée ne signifie pas qu’une déclaration a été déposée.</p>
        <dl className="workforce-metrics"><div><dt>CNSS en paie activée</dt><dd>{value(cnss?.contributionEnabled)}</dd></div><div><dt>CNSS en paie désactivée</dt><dd>{value(cnss?.contributionDisabled)}</dd></div><div><dt>ITS / IRPP en paie activé</dt><dd>{value(tax?.withholdingEnabled)}</dd></div><div><dt>ITS / IRPP en paie désactivé</dt><dd>{value(tax?.withholdingDisabled)}</dd></div></dl>
      </Card>
    </div>}
  </section>;
}