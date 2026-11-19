import type { createDemoStore } from './transport';
import { company, employees } from './employees';

export interface DemoAsset { id:string;name:string;category:string;status:'AVAILABLE'|'IN_USE'|'MAINTENANCE'|'RETIRED';serialNumber:string;purchaseValue:number;purchaseDate:string;employee:typeof employees[number]|null }
export const assets:DemoAsset[]=[
 {id:'demo-laptop',name:'Ordinateur portable RH',category:'COMPUTER',status:'IN_USE',serialNumber:'DEMO-PC-001',purchaseValue:480000,purchaseDate:'2026-02-03',employee:employees[0]},
 {id:'demo-phone',name:'Téléphone de service',category:'PHONE',status:'AVAILABLE',serialNumber:'DEMO-TEL-002',purchaseValue:120000,purchaseDate:'2026-03-12',employee:null},
 {id:'demo-printer',name:'Imprimante du bureau',category:'OFFICE_EQUIPMENT',status:'MAINTENANCE',serialNumber:'DEMO-IMP-003',purchaseValue:210000,purchaseDate:'2025-10-07',employee:null},
 {id:'demo-chair',name:'Fauteuil réformé',category:'FURNITURE',status:'RETIRED',serialNumber:'DEMO-MOB-004',purchaseValue:85000,purchaseDate:'2024-01-08',employee:null},
];
export function demoAssets(url:URL,method:string,body:Record<string,unknown>,store:ReturnType<typeof createDemoStore>,role:'ADMIN'|'EMPLOYEE'):Response|null {
 if(!/^\/assets(?:\/|$)/.test(url.pathname))return null;
 const json=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
 if(url.searchParams.has('companyId')&&url.searchParams.get('companyId')!==company.id)return json({message:'Entreprise inaccessible.'},404);
 if(role!=='ADMIN')return json({message:'Gestion du matériel réservée aux RH.'},403);
 const match=url.pathname.match(/^\/assets(?:\/([^/]+)(?:\/(assign|status))?)?$/);if(!match)return json({message:'Action non simulée.'},501);
 if(!match[1]&&method==='GET')return json(store.assets);
 const fields=()=>({name:String(body.name||'').trim(),category:String(body.category||'').trim(),serialNumber:String(body.serialNumber||''),purchaseValue:Number(body.purchaseValue),purchaseDate:String(body.purchaseDate||'')});
 if(!match[1]&&method==='POST'){
  const data=fields();if(!data.name||!data.category||!Number.isFinite(data.purchaseValue))return json({message:'Nom, catégorie et valeur requis.'},400);
  const asset:DemoAsset={...data,id:`demo-asset-${crypto.randomUUID()}`,employee:null,status:'AVAILABLE'};store.assets.unshift(asset);return json(asset,201);
 }
 const asset=store.assets.find(a=>a.id===match[1]);if(!asset)return json({message:'Matériel inaccessible.'},404);
 if(method==='PATCH'&&match[2]==='assign'){
  const employee=body.employeeId===null?null:store.employees.find(e=>e.id===body.employeeId&&e.companyId===company.id);
  if(employee===undefined)return json({message:'Employé inaccessible.'},404);
  asset.employee=employee;asset.status=employee?'IN_USE':'AVAILABLE';return json(asset);
 }
 if(method==='PATCH'&&match[2]==='status'){
  if(!['AVAILABLE','MAINTENANCE','RETIRED'].includes(String(body.status)))return json({message:'Statut invalide.'},400);
  asset.status=body.status as DemoAsset['status'];return json(asset);
 }
 if(method==='PATCH'&&!match[2]){const data=fields();if(!data.name||!data.category||!Number.isFinite(data.purchaseValue))return json({message:'Vérifiez le formulaire.'},400);Object.assign(asset,data);return json(asset);}
 if(method==='DELETE'&&!match[2]){if(asset.status==='IN_USE')return json({message:'Retirez l’attribution avant de supprimer.'},400);store.assets.splice(store.assets.indexOf(asset),1);return json({success:true});}
 return json({message:'Action non simulée.'},501);
}
