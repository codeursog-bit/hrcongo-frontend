import { api } from '@/services/api';
import type { DocLayout } from '@/types/document-layout';

export interface SavedDocumentLayout {
  id: string;
  companyId: string;
  docType: 'PAYSLIP';
  name: string;
  basePreset: string;
  config: DocLayout;
  version: number;
  updatedAt: string;
}

const endpoint = '/document-layouts/PAYSLIP';
const pending = new Map<string, Promise<SavedDocumentLayout | null>>();

export function loadPayslipLayout(companyId: string) {
  const current = pending.get(companyId);
  if (current) return current;
  const request = api.get<{ layout: SavedDocumentLayout | null }>(endpoint).then(({ layout }) => {
    if (layout && layout.companyId !== companyId) throw new Error('Le modèle appartient à une autre entreprise.');
    return layout;
  }).finally(() => {
    if (pending.get(companyId) === request) pending.delete(companyId);
  });
  pending.set(companyId, request);
  return request;
}

export const savePayslipLayout = (name: string, config: DocLayout) =>
  api.put<{ layout: SavedDocumentLayout }>(endpoint, { name, config: { ...config, independent: true } }).then(({ layout }) => layout);

export const resetPayslipLayout = () => api.delete<{ layout: null }>(endpoint);
