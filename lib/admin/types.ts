export interface Company {
  id: string;
  name: string;
  logo: string;
  plan: 'Starter' | 'Pro' | 'Enterprise' | 'Trial';
  employees: number;
  lastActive: string;
  status: 'Active' | 'Trial' | 'Suspended' | 'Cancelled';
  mrr: number;
  region: string;
  rccm?: string;
  email?: string;
  joinedDate?: string;
  contactPerson?: string;
  health?: {
    payment: 'good' | 'warning' | 'critical';
    usage: 'good' | 'warning' | 'critical';
    support: 'good' | 'warning' | 'critical';
  };
}

export interface Metric {
  label: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

export interface ActivityLog {
  id: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'critical' | 'success';
}

export interface PaymentFailure {
  id: string;
  companyName: string;
  amount: number;
  attempts: number;
  error: string;
  contact: string;
}

export interface ChartDataPoint {
  name: string;
  revenue: number;
  companies: number;
  users: number;
}

export interface Transaction {
  id: string;
  invoiceId: string;
  companyId: string;
  companyName: string;
  companyLogo: string;
  plan: 'Starter' | 'Pro' | 'Enterprise';
  amount: number;
  date: string;
  method: 'Airtel Money' | 'MTN Mobile Money' | 'Bank Transfer' | 'Manual';
  status: 'Success' | 'Failed' | 'Pending' | 'Refunded';
}

export interface SubscriptionEvent {
  id: string;
  type: 'upgrade' | 'downgrade' | 'cancellation' | 'new';
  companyName: string;
  details: string;
  impact: number; // Positive or negative value
  date: string;
}

// --- System Settings Types ---

export interface TaxBracket {
  id: string;
  min: number;
  max: number | null; // null for infinity
  rate: number;
}

export interface Holiday {
  id: string;
  date: string;
  name: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  ip: string;
}

// --- Analytics Types ---

export interface AnalyticsDataset {
    label: string;
    value: number;
    color?: string;
}

export interface CohortData {
    cohort: string;
    months: number[]; // Percentages for Month 1, 2, 3, 6, 12
}

export interface GeoDistribution {
    city: string;
    count: number;
    growth: number;
}

// --- Monitoring Types ---

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'DEBUG' | 'WARN' | 'ERROR' | 'FATAL';
  service: string;
  message: string;
  user?: string;
  ip?: string;
  duration?: number;
}

export interface ApiRequest {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  user: string;
  company: string;
  status: number;
  duration: number;
}

export interface DbQuery {
  id: string;
  timestamp: string;
  query: string;
  duration: number;
  rows: number;
  table: string;
  user: string;
}

export interface ErrorGroup {
  id: string;
  message: string;
  count: number;
  trend: number; // percentage
  affectedUsers: number;
  lastSeen: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Ignored';
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: string;
  user: string;
  ip: string;
  location: string;
  risk: 'Low' | 'Medium' | 'High' | 'Critical';
}

export interface WebhookDelivery {
  id: string;
  timestamp: string;
  endpoint: string;
  event: string;
  status: number;
  attempts: number;
  duration: string;
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  status: 'Success' | 'Failed' | 'Running' | 'Disabled';
  duration: string;
}
