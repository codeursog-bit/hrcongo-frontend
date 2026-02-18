// ============================================================================
// 📊 ADMIN SERVICE - Tous les endpoints Super Admin
// ============================================================================
// Fichier: frontend/lib/services/adminService.ts (NOUVEAU)

import { api } from '../api';

export const adminService = {
  // ==========================================================================
  // 📊 DASHBOARD
  // ==========================================================================
  getDashboardStats: () => api.get('/admin/stats'),
  
  // ==========================================================================
  // 🏢 COMPANIES
  // ==========================================================================
  getAllCompanies: (filters?: { 
    status?: string; 
    plan?: string; 
    search?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.plan) params.append('plan', filters.plan);
    if (filters?.search) params.append('search', filters.search);
    
    const queryString = params.toString();
    return api.get(`/admin/companies${queryString ? `?${queryString}` : ''}`);
  },
  
  getCompanyDetails: (id: string) => api.get(`/admin/companies/${id}`),
  
  // ==========================================================================
  // 💰 BILLING
  // ==========================================================================
  getBillingStats: () => api.get('/admin/billing'),
  
  // ==========================================================================
  // 📈 ANALYTICS
  // ==========================================================================
  getAnalytics: () => api.get('/admin/analytics'),
  
  // ==========================================================================
  // 🔧 MONITORING
  // ==========================================================================
  getMonitoringData: () => api.get('/admin/monitoring'),
  
  // ==========================================================================
  // ⚙️ SETTINGS
  // ==========================================================================
  getGlobalSettings: () => api.get('/admin/settings'),
  
  updateGlobalSettings: (settings: any) => api.post('/admin/settings', settings),
};