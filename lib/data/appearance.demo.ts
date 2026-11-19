import type { AppearanceActor, AppearanceAdapter, CompanyAppearance, UserAppearance } from '@/types/contracts/appearance';
import { resolveAppearance, validateColors } from '@/lib/appearance';
export const APPEARANCE_EVENT='konza:appearance:changed';
export const companyAppearanceKey=(id:string)=>'konza:appearance:demo:company:'+id;
export const userAppearanceKey=(id:string)=>'konza:appearance:demo:user:'+id;
export function appearanceDemo(actor:AppearanceActor):AppearanceAdapter {
  const check=()=>{if(!actor.id || !actor.companyId)throw new Error('Session requise.');};
  const company=():CompanyAppearance=>{check();const raw=localStorage.getItem(companyAppearanceKey(actor.companyId));if(!raw)return {colors:null,allowEmployeeCustomization:false};const value=JSON.parse(raw);if(value.colors)validateColors(value.colors);if(typeof value.allowEmployeeCustomization!=='boolean')throw new Error('Réglage entreprise invalide.');return value;};
  const user=():UserAppearance=>{check();const raw=localStorage.getItem(userAppearanceKey(actor.id));const value=raw?JSON.parse(raw):{colors:null,mode:'auto'};if(value.colors)validateColors(value.colors);if(!['auto','dark','light'].includes(value.mode))throw new Error('Mode invalide.');return value;};
  const changed=()=>window.dispatchEvent(new Event(APPEARANCE_EVENT));
  return {
    async get(){return resolveAppearance(company(),user());},
    async saveUser(value){check();if(value.colors)validateColors(value.colors);if(!['auto','dark','light'].includes(value.mode))throw new Error('Mode invalide.');if(!company().allowEmployeeCustomization && JSON.stringify(value.colors)!==JSON.stringify(user().colors))throw new Error('Les couleurs sont définies par votre entreprise.');localStorage.setItem(userAppearanceKey(actor.id),JSON.stringify(value));changed();},
    async saveCompany(value){check();if(actor.role!=='ADMIN')throw new Error('Réglage réservé à l’admin de l’entreprise.');if(value.colors)validateColors(value.colors);if(typeof value.allowEmployeeCustomization!=='boolean')throw new Error('Autorisation invalide.');localStorage.setItem(companyAppearanceKey(actor.companyId),JSON.stringify(value));changed();},
  };
}
