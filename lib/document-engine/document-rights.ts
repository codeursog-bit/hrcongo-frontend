import { api } from '@/services/api';

export type DocumentRights = {
  canCustomizeDocuments: boolean;
  canBuildDocumentsFromScratch: boolean;
};

export function loadDocumentRights() {
  return api.get<DocumentRights>('/document-layouts/rights');
}
