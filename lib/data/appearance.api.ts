import type { AppearanceAdapter } from '@/types/contracts/appearance';
import type { AppearanceSnapshot } from '@/types/contracts/appearance';
import { api } from '@/services/api';
import { featureActor } from './context';
// Live: GET /appearance/me; PATCH /companies/:id/appearance (admin + audit);
// PATCH /users/me/appearance. Server resolves active-company policy and validates contrast.
export const appearanceApi:AppearanceAdapter={
  get:()=>api.get<AppearanceSnapshot>('/appearance/me'),
  saveUser:async value=>{await api.patch('/users/me/appearance',value);},
  saveCompany:async value=>{const actor=featureActor();if(!actor.companyId)throw new Error('Sélectionnez une entreprise.');await api.patch(`/companies/${encodeURIComponent(actor.companyId)}/appearance`,value);},
};
