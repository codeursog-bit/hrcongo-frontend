import { api } from '@/services/api';
import type { DocLayout } from '@/types/document-layout';
import type { AdministrativeType } from './administrative';

export type EditableDocumentType = AdministrativeType | 'CONTRACTOR_INVOICE';
export type SavedAdministrativeLayout = {
  companyId: string;
  docType: EditableDocumentType;
  basePreset: string;
  name?: string;
  version?: number;
  config?: DocLayout;
};
const pending = new Map<string, Promise<SavedAdministrativeLayout | null>>();
const endpoint = (type: EditableDocumentType) => `/document-layouts/${type}`;

export function loadAdministrativeLayout(companyId: string, type: EditableDocumentType) {
  const key = `${companyId}:${type}`;
  const current = pending.get(key);
  if (current) return current;
  const request = api.get<{ layout: SavedAdministrativeLayout | null }>(endpoint(type)).then(({ layout }) => {
    if (layout && (layout.companyId !== companyId || layout.docType !== type)) throw new Error('Modèle indisponible.');
    return layout;
  }).finally(() => {
    if (pending.get(key) === request) pending.delete(key);
  });
  pending.set(key, request);
  return request;
}

export const saveAdministrativeLayout = (type: EditableDocumentType, config: DocLayout, name?: string) =>
  api.put<{ layout: SavedAdministrativeLayout }>(endpoint(type), { config: { ...config, independent: true }, name }).then(result => result.layout);
export const resetAdministrativeLayout = (type: EditableDocumentType) => api.delete(endpoint(type));
