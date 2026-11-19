import { employees, company } from './employees';
import { subscription } from './subscription';
export const documentMetadata=[
 {id:'demo-document-1',employeeId:employees[0].id,name:'Exemple de dossier — Laure Djouma',type:'OTHER',status:'PENDING_REVIEW',version:1,isArchived:false,fileSize:85000,createdAt:'2026-11-12T08:00:00+01:00',employee:employees[0]},
 {id:'demo-document-2',employeeId:employees[1].id,name:'Exemple de pièce vérifiée — Sandrine Mvoula',type:'OTHER',status:'VERIFIED',version:1,isArchived:false,fileSize:120000,createdAt:'2026-11-10T08:00:00+01:00',employee:employees[1]},
];
/** Metadata only: no document, official declaration or payment is generated. */
export function demoServiceCatalogs(url:URL,method:string,role:'ADMIN'|'EMPLOYEE'):Response|null {
 const p=url.pathname,json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(!['/documents','/documents/stats','/public/subscriptions/plans','/subscriptions/quote','/subscriptions/payment-provider','/cnss-declaration/history','/cnss-declaration/recap'].includes(p)||method!=='GET')return null;
 if(url.searchParams.has('companyId')&&url.searchParams.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
 const docs=documentMetadata.filter(d=>role==='ADMIN'||d.employeeId===employees[0].id);
 if(p==='/documents')return json(docs);
 if(p==='/documents/stats')return json({total:docs.length,pending:docs.filter(d=>d.status==='PENDING_REVIEW').length,verified:docs.filter(d=>d.status==='VERIFIED').length,rejected:0,expired:0,expiring30:0,expiring7:0});
 if(p==='/subscriptions/quote')return json({quote:null});
 if(p==='/subscriptions/payment-provider')return json({provider:'NONE'});
 if(p==='/public/subscriptions/plans')return json({plans:Object.fromEntries(['FREE','BASIC','PRO','ENTERPRISE'].map(key=>[key,{...subscription.planDetails,name:key==='FREE'?'Gratuit':key,description:'Exemple de présentation — tarifs indisponibles en démo.',priceMonthly:null,priceYearly:null,isPriceConfigured:false,popular:key==='PRO'}]))});
 if(p.startsWith('/cnss-declaration/')){
  if(role!=='ADMIN')return json({message:'Accès réservé aux RH.'},403);
  if(p.endsWith('/history'))return json([]);
  return json({message:'Les déclarations et montants CNSS nécessitent le backend. Aucun calcul ni document officiel n’est simulé.'},501);
 }
 return null;
}
