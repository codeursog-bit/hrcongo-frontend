// ============================================================================
// 📁 services/finance-api.ts
// Client du module Finances (caisse, dépenses, entrées, budgets) — ADMIN only
// ============================================================================

import { api } from '@/services/api';

// ── Types ────────────────────────────────────────────────────────────────────
export type FinanceFlow = 'EXPENSE' | 'INCOME';

export interface FinanceSettings {
  enabled: boolean;
  openingBalance: number;
  openingDate: string; // AAAA-MM-JJ
  currency: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  type: FinanceFlow;
  color: string | null;
  isActive: boolean;
}

export interface FinanceTransaction {
  id: string;
  type: FinanceFlow;
  categoryId: string;
  category: { id: string; name: string; color: string | null } | null;
  label: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  date: string; // AAAA-MM-JJ
  counterparty: string | null;
  note: string | null;
  receiptUrl: string | null;
  createdAt: string;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  type?: FinanceFlow;
  categoryId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionsPage {
  items: FinanceTransaction[];
  total: number;
  page: number;
  limit: number;
  totals: { income: number; expense: number };
}

export interface CreateTransactionPayload {
  type: FinanceFlow;
  categoryId: string;
  label: string;
  quantity?: number;
  unitPrice: number;
  date: string;
  counterparty?: string;
  note?: string;
}

export type UpdateTransactionPayload = Partial<
  Omit<CreateTransactionPayload, 'type'>
>;

export interface CategoryAmount {
  categoryId: string;
  name: string;
  color: string | null;
  total: number;
  percent: number;
}

export interface BudgetRow {
  categoryId: string;
  name: string;
  color: string | null;
  budget: number;
  spent: number;
  remaining: number;
  percent: number | null;
}

export interface FinanceDashboard {
  period: { from: string; to: string };
  currency: string;
  balance: {
    current: number;
    openingBalance: number;
    openingDate: string;
    atPeriodStart: number;
    atPeriodEnd: number;
  };
  totals: { income: number; expense: number; net: number };
  expenseByCategory: CategoryAmount[];
  incomeByCategory: CategoryAmount[];
  monthly: {
    month: string; // AAAA-MM
    income: number;
    expense: number;
    net: number;
    closingBalance: number;
  }[];
  budgetComparison: BudgetRow[];
  budgetTotals: { budget: number; spent: number };
}

export interface BudgetsMonth {
  year: number;
  month: number;
  rows: BudgetRow[];
  totals: { budget: number; spent: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function qs(params: Record<string, string | number | undefined | null>): string {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

// ── API ──────────────────────────────────────────────────────────────────────
export const financeApi = {
  // Statut (menu) & paramètres
  getStatus: () => api.get<{ enabled: boolean }>('/finance/status'),
  getSettings: () => api.get<FinanceSettings>('/finance/settings'),
  updateSettings: (data: { openingBalance?: number; openingDate?: string }) =>
    api.patch<FinanceSettings>('/finance/settings', data),

  // Catégories
  getCategories: (opts: { type?: FinanceFlow; includeInactive?: boolean } = {}) =>
    api.get<FinanceCategory[]>(
      `/finance/categories${qs({
        type: opts.type,
        includeInactive: opts.includeInactive ? 'true' : undefined,
      })}`,
    ),
  createCategory: (data: { name: string; type: FinanceFlow; color?: string }) =>
    api.post<FinanceCategory>('/finance/categories', data),
  updateCategory: (
    id: string,
    data: { name?: string; color?: string; isActive?: boolean },
  ) => api.patch<FinanceCategory>(`/finance/categories/${id}`, data),
  deleteCategory: (id: string) =>
    api.delete<{ archived: boolean; deleted: boolean }>(`/finance/categories/${id}`),

  // Transactions
  getTransactions: (f: TransactionFilters = {}) =>
    api.get<TransactionsPage>(`/finance/transactions${qs({ ...f })}`),
  exportTransactions: (f: Omit<TransactionFilters, 'page' | 'limit'> = {}) =>
    api.get<{ items: FinanceTransaction[] }>(
      `/finance/transactions/export${qs({ ...f })}`,
    ),
  createTransaction: (data: CreateTransactionPayload) =>
    api.post<FinanceTransaction>('/finance/transactions', data),
  updateTransaction: (id: string, data: UpdateTransactionPayload) =>
    api.patch<FinanceTransaction>(`/finance/transactions/${id}`, data),
  deleteTransaction: (id: string) =>
    api.delete<{ deleted: boolean }>(`/finance/transactions/${id}`),
  uploadReceipt: (id: string, file: File) => {
    const fd = new FormData();
    fd.append('receipt', file);
    return api.postFormData<FinanceTransaction>(
      `/finance/transactions/${id}/receipt`,
      fd,
    );
  },
  deleteReceipt: (id: string) =>
    api.delete<FinanceTransaction>(`/finance/transactions/${id}/receipt`),

  // Budgets
  getBudgets: (year: number, month: number) =>
    api.get<BudgetsMonth>(`/finance/budgets${qs({ year, month })}`),
  setBudget: (data: {
    categoryId: string;
    year: number;
    month: number;
    amount: number;
  }) => api.put('/finance/budgets', data),

  // Dashboard
  getDashboard: (from?: string, to?: string) =>
    api.get<FinanceDashboard>(`/finance/dashboard${qs({ from, to })}`),
};