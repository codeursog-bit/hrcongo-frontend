// ============================================================================
// 📁 services/contract-chain.ts
// Types = EXACTEMENT ce que renvoie le back (src/contract-chain). Chaque champ
// déclaré ici est affiché quelque part dans ContractChainPanel : si tu ajoutes
// un champ côté back, ajoute-le ici ET dans l'écran, sinon il reste invisible.
// ============================================================================
import { api } from '@/services/api';

export type ContractLinkKind = 'INITIAL' | 'RENEWAL' | 'CONVERSION_CDI';

export interface ContractLink {
  id: string;
  rank: number;
  kind: ContractLinkKind;
  contractType: string;
  status: string;
  startDate: string;
  endDate: string | null;
  duration: number | null;
  position: string;
  baseSalary: string; // Decimal sérialisé en texte par le back
  trialPeriodDays: number | null;
  trialEndDate: string | null;
  signedAt: string | null;
  signedByEmp: boolean;
  renewalCount: number;
  cddMotif: string | null;
  renewalReason: string | null;
  renewedAt: string | null;
  renewedByName: string | null;
  previousContractId: string | null;
  createdAt: string;
  createdByName: string | null;
}

export interface ContractChain {
  chainId: string;
  current: boolean;
  renewalsUsed: number;
  renewalsAllowed: number;
  links: ContractLink[]; // trié par rang croissant
}

export interface RuleViolation {
  code: string;
  level: 'BLOCK' | 'WARN';
  message: string;
  legalRef?: string;
  overridable: boolean;
}

export interface RenewalPreview {
  allowed: boolean;
  overridableOnly: boolean;
  violations: RuleViolation[];
}

export interface CddMotif {
  code: string;
  label: string;
  shortCap: boolean;
}

export interface ChainRules {
  motifs: CddMotif[];
  limits: { MAX_RENEWALS: number; MAX_TOTAL_MONTHS: number; SHORT_MOTIF_MAX_MONTHS: number };
}

export interface RenewPayload {
  startDate?: string;
  endDate: string;
  cddMotif?: string;
  reason: string;
  signedAt?: string;
  baseSalary?: number;
  position?: string;
  notes?: string;
  overrideReason?: string;
}

export interface ConvertPayload {
  startDate?: string;
  reason: string;
  signedAt?: string;
  baseSalary?: number;
  position?: string;
  notes?: string;
}

/** Retire les champs vides : le back (whitelist + forbidNonWhitelisted) refuse '' sur un champ date. */
export function clean<T extends object>(payload: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === '' || v === undefined || v === null) continue;
    out[k] = v;
  }
  return out as T;
}

/** Violations portées par une erreur 422 du back (voir patch du filtre d'exceptions). */
export function violationsOf(err: any): RuleViolation[] {
  return Array.isArray(err?.data?.violations) ? err.data.violations : [];
}

export const contractChainService = {
  rules: () => api.get<ChainRules>('/contract-chain/rules'),
  chains: (employeeId: string) =>
    api.get<ContractChain[]>(`/contract-chain/employee/${employeeId}`),
  preview: (contractId: string, payload: RenewPayload) =>
    api.post<RenewalPreview>(`/contract-chain/${contractId}/renewal/preview`, clean(payload)),
  renew: (contractId: string, payload: RenewPayload) =>
    api.post<{ contract: ContractLink; warnings: RuleViolation[] }>(
      `/contract-chain/${contractId}/renew`,
      clean(payload),
    ),
  convertToCdi: (contractId: string, payload: ConvertPayload) =>
    api.post<{ contract: ContractLink }>(`/contract-chain/${contractId}/convert-to-cdi`, clean(payload)),
};