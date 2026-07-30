'use client';

// ============================================================================
// 📄 app/(dashboard)/documents/page.tsx  — Page Documents complète
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  FileText, Upload, Search, Filter, RefreshCw,
  CheckCircle2, Clock, XCircle, AlertTriangle,
  Eye, Download, Trash2, ChevronDown, Calendar,
  Building2, User, ShieldCheck, ShieldX, MoreVertical,
  FileQuestion, TrendingDown, AlertCircle,
} from 'lucide-react';
import { api } from '@/services/api';
import { UploadDocumentModal } from '@/components/documents/UploadDocumentModal';
import { DocumentViewerModal } from '@/components/documents/DocumentViewerModal';
import { RejectDocumentModal } from '@/components/documents/RejectDocumentModal';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Document {
  id: string;
  name: string;
  type: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  mimeType?: string;
  fileSize?: number;
  documentNumber?: string;
  issuingBody?: string;
  issuedAt?: string;
  expiresAt?: string;
  rejectionReason?: string;
  version: number;
  isArchived: boolean;
  createdAt: string;
  verifiedAt?: string;
  employee?: { firstName: string; lastName: string; position?: string };
  uploadedBy?: { id: string };
  verifiedBy?: { id: string };
}

interface Stats {
  total: number;
  pending: number;
  verified: number;
  rejected: number;
  expired: number;
  expiring30: number;
  expiring7: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  ID_CARD: 'Carte d\'identité', PASSPORT: 'Passeport',
  DRIVER_LICENSE: 'Permis de conduire', PAYSLIP: 'Bulletin de paie',
  CONTRACT: 'Contrat de travail', WORK_CERTIFICATE: 'Attestation de travail',
  SALARY_ATTESTATION: 'Attestation de salaire', EMPLOYMENT_LETTER: 'Lettre d\'embauche',
  DIPLOMA: 'Diplôme', CERTIFICATION: 'Certification / HSE',
  TRAINING_CERT: 'Attestation de formation', MEDICAL_CERT: 'Certificat médical',
  MEDICAL_VISIT: 'Visite médicale', RESUME: 'CV', OTHER: 'Autre',
};

const STATUS_CONFIG = {
  PENDING_REVIEW: { label: 'En attente',  color: 'text-amber-600  bg-amber-50  border-amber-200  dark:bg-amber-900/20  dark:border-amber-800',  dot: 'bg-amber-500',  Icon: Clock },
  VERIFIED:       { label: 'Validé',      color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-800', dot: 'bg-emerald-500', Icon: CheckCircle2 },
  REJECTED:       { label: 'Rejeté',      color: 'text-red-600    bg-red-50    border-red-200    dark:bg-red-900/20    dark:border-red-800',    dot: 'bg-red-500',    Icon: XCircle },
  EXPIRED:        { label: 'Expiré',      color: 'text-gray-600   bg-gray-50   border-gray-200   dark:bg-gray-800      dark:border-gray-700',   dot: 'bg-gray-400',   Icon: TrendingDown },
};

const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const formatSize = (b?: number) => b ? `${(b / 1024 / 1024).toFixed(1)} Mo` : '—';

const daysUntilExpiry = (expiresAt?: string) => {
  if (!expiresAt) return null;
  const diff = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000);
  return diff;
};

// ─── Composant badge statut ───────────────────────────────────────────────────

function StatusBadge({ status }: { status: Document['status'] }) {
  const cfg = STATUS_CONFIG[status];
  const { Icon } = cfg;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

// ─── Composant carte stat ─────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color, urgent }: {
  label: string; value: number; icon: any; color: string; urgent?: boolean;
}) {
  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-2xl p-5 border ${urgent && value > 0 ? 'border-red-300 dark:border-red-700' : 'border-gray-100 dark:border-gray-700'} shadow-sm`}>
      {urgent && value > 0 && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
      )}
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${color}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Composant ligne document ─────────────────────────────────────────────────

function DocumentRow({
  doc,
  onView,
  onDownload,
  onVerify,
  onReject,
  onDelete,
  isHR,
}: {
  doc: Document;
  onView: (d: Document) => void;
  onDownload: (d: Document) => void;
  onVerify: (d: Document) => void;
  onReject: (d: Document) => void;
  onDelete: (d: Document) => void;
  isHR: boolean;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const days = daysUntilExpiry(doc.expiresAt);
  const isExpiringSoon = days !== null && days <= 30 && days > 0 && doc.status === 'VERIFIED';
  const isCritical = days !== null && days <= 7 && days > 0;

  return (
    <tr className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
      {/* Document */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-900/20 flex items-center justify-center flex-shrink-0">
            <FileText size={16} className="text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-900 dark:text-white leading-tight">{doc.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {TYPE_LABELS[doc.type] ?? doc.type}
              {doc.version > 1 && <span className="ml-1 text-sky-500">v{doc.version}</span>}
            </p>
          </div>
        </div>
      </td>

      {/* Employé */}
      <td className="px-4 py-3.5">
        {doc.employee ? (
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {doc.employee.firstName} {doc.employee.lastName}
            </p>
            {doc.employee.position && (
              <p className="text-xs text-gray-400">{doc.employee.position}</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">—</span>
        )}
      </td>

      {/* Statut */}
      <td className="px-4 py-3.5">
        <StatusBadge status={doc.status} />
      </td>

      {/* Expiration */}
      <td className="px-4 py-3.5">
        {doc.expiresAt ? (
          <div>
            <p className={`text-sm font-medium ${isCritical ? 'text-red-600 dark:text-red-400' : isExpiringSoon ? 'text-amber-600 dark:text-amber-400' : 'text-gray-700 dark:text-gray-300'}`}>
              {formatDate(doc.expiresAt)}
            </p>
            {days !== null && days > 0 && doc.status === 'VERIFIED' && (
              <p className={`text-xs mt-0.5 ${isCritical ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                {isCritical ? `⚠ J-${days}` : `dans ${days}j`}
              </p>
            )}
            {days !== null && days <= 0 && (
              <p className="text-xs text-gray-400 mt-0.5">Expiré</p>
            )}
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Sans expiration</span>
        )}
      </td>

      {/* Date ajout */}
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(doc.createdAt)}</span>
      </td>

      {/* Taille */}
      <td className="px-4 py-3.5">
        <span className="text-sm text-gray-500 dark:text-gray-400">{formatSize(doc.fileSize)}</span>
      </td>

      {/* Actions */}
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onView(doc)}
            className="p-1.5 rounded-lg hover:bg-sky-50 dark:hover:bg-sky-900/20 text-gray-400 hover:text-sky-600 transition-colors"
            title="Voir"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onDownload(doc)}
            className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors"
            title="Télécharger"
          >
            <Download size={15} />
          </button>

          {isHR && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <MoreVertical size={15} />
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-20 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-lg py-1 w-44">
                    {doc.status === 'PENDING_REVIEW' && (
                      <>
                        <button
                          onClick={() => { onVerify(doc); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                        >
                          <ShieldCheck size={14} /> Valider
                        </button>
                        <button
                          onClick={() => { onReject(doc); setMenuOpen(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          <ShieldX size={14} /> Rejeter
                        </button>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
                      </>
                    )}
                    <button
                      onClick={() => { onDelete(doc); setMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={14} /> Supprimer
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function DocumentsPage() {
  const [documents, setDocuments]   = useState<Document[]>([]);
  const [stats, setStats]           = useState<Stats | null>(null);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter]     = useState<string>('ALL');

  const [uploadOpen, setUploadOpen]       = useState(false);
  const [viewDoc, setViewDoc]             = useState<Document | null>(null);
  const [rejectDoc, setRejectDoc]         = useState<Document | null>(null);

  // On détecte le rôle depuis le token — simplifié ici
  const [isHR, setIsHR] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [docs, statsData, me] = await Promise.all([
        api.get<Document[]>('/documents'),
        api.get<Stats>('/documents/stats').catch(() => null),
        api.get<any>('/auth/me').catch(() => null),
      ]);

      // S'assurer que docs est toujours un tableau
      setDocuments(Array.isArray(docs) ? docs : []);
      if (statsData) setStats(statsData);
      if (me?.role) {
        setIsHR(['ADMIN', 'HR_MANAGER', 'SUPER_ADMIN', 'CABINET_ADMIN', 'CABINET_GESTIONNAIRE'].includes(me.role));
      }
    } catch (e) {
      console.error('Erreur chargement documents:', e);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDownload = async (doc: Document) => {
    try {
      const res = await api.get<{ url: string; fileName: string }>(`/documents/${doc.id}/download`);
      window.open(res.url, '_blank');
    } catch {
      alert('Impossible de télécharger ce document');
    }
  };

  const handleVerify = async (doc: Document) => {
    if (!confirm(`Valider le document "${doc.name}" ?`)) return;
    try {
      await api.patch(`/documents/${doc.id}/verify`, {});
      load();
    } catch { alert('Erreur lors de la validation'); }
  };

  const handleDelete = async (doc: Document) => {
    if (!confirm(`Supprimer définitivement "${doc.name}" ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/documents/${doc.id}`);
      load();
    } catch { alert('Erreur lors de la suppression'); }
  };

  const handleRejectConfirm = async (reason: string) => {
    if (!rejectDoc) return;
    try {
      await api.patch(`/documents/${rejectDoc.id}/reject`, { reason });
      setRejectDoc(null);
      load();
    } catch { alert('Erreur lors du rejet'); }
  };

  // Filtres
  const filtered = documents.filter(d => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      d.name.toLowerCase().includes(q) ||
      `${d.employee?.firstName} ${d.employee?.lastName}`.toLowerCase().includes(q) ||
      (TYPE_LABELS[d.type] ?? '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchType   = typeFilter === 'ALL'   || d.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const pendingCount   = documents.filter(d => d.status === 'PENDING_REVIEW').length;
  const criticalCount  = documents.filter(d => {
    const days = daysUntilExpiry(d.expiresAt);
    return days !== null && days <= 7 && days > 0 && d.status === 'VERIFIED';
  }).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText className="text-sky-500" size={26} />
              Gestion documentaire
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              {documents.length} document{documents.length !== 1 ? 's' : ''} au total
              {pendingCount > 0 && (
                <span className="ml-2 text-amber-600 font-medium">• {pendingCount} en attente</span>
              )}
              {criticalCount > 0 && (
                <span className="ml-2 text-red-600 font-medium">• {criticalCount} critique{criticalCount !== 1 ? 's' : ''}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={load}
              className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setUploadOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-sky-200 dark:shadow-none"
            >
              <Upload size={16} />
              Ajouter un document
            </button>
          </div>
        </div>

        {/* ── Stats ───────────────────────────────────────────────────────── */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <StatCard label="Total"         value={stats.total}     icon={FileText}      color="bg-sky-50 dark:bg-sky-900/20 text-sky-600" />
            <StatCard label="En attente"    value={stats.pending}   icon={Clock}         color="bg-amber-50 dark:bg-amber-900/20 text-amber-600" urgent />
            <StatCard label="Validés"       value={stats.verified}  icon={CheckCircle2}  color="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600" />
            <StatCard label="Rejetés"       value={stats.rejected}  icon={XCircle}       color="bg-red-50 dark:bg-red-900/20 text-red-600" />
            <StatCard label="Expirés"       value={stats.expired}   icon={TrendingDown}  color="bg-gray-100 dark:bg-gray-700 text-gray-500" />
            <StatCard label="Exp. 30 jours" value={stats.expiring30} icon={AlertTriangle} color="bg-orange-50 dark:bg-orange-900/20 text-orange-600" urgent />
            <StatCard label="Exp. 7 jours"  value={stats.expiring7} icon={AlertCircle}   color="bg-red-50 dark:bg-red-900/20 text-red-600" urgent />
          </div>
        )}

        {/* ── Filtres ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 flex flex-col sm:flex-row gap-3">
          {/* Recherche */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un document, employé..."
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400"
            />
          </div>

          {/* Filtre statut */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING_REVIEW">En attente</option>
              <option value="VERIFIED">Validés</option>
              <option value="REJECTED">Rejetés</option>
              <option value="EXPIRED">Expirés</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Filtre type */}
          <div className="relative">
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500/30 cursor-pointer"
            >
              <option value="ALL">Tous les types</option>
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* ── Tableau ─────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="py-24 text-center">
              <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400 text-sm">Chargement des documents...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileQuestion size={28} className="text-gray-300 dark:text-gray-500" />
              </div>
              <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Aucun document trouvé</p>
              <p className="text-gray-400 text-sm">
                {search || statusFilter !== 'ALL' || typeFilter !== 'ALL'
                  ? 'Modifiez vos filtres ou votre recherche'
                  : 'Ajoutez votre premier document'}
              </p>
              {!search && statusFilter === 'ALL' && typeFilter === 'ALL' && (
                <button
                  onClick={() => setUploadOpen(true)}
                  className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-sky-500 text-white text-sm font-semibold rounded-xl hover:bg-sky-600 transition-colors"
                >
                  <Upload size={14} /> Ajouter un document
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Document</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Employé</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statut</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Expiration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Ajouté le</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Taille</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(doc => (
                    <DocumentRow
                      key={doc.id}
                      doc={doc}
                      onView={setViewDoc}
                      onDownload={handleDownload}
                      onVerify={handleVerify}
                      onReject={setRejectDoc}
                      onDelete={handleDelete}
                      isHR={isHR}
                    />
                  ))}
                </tbody>
              </table>

              <div className="px-4 py-3 border-t border-gray-50 dark:border-gray-700 text-xs text-gray-400">
                {filtered.length} résultat{filtered.length !== 1 ? 's' : ''} affiché{filtered.length !== 1 ? 's' : ''}
                {filtered.length !== documents.length && ` sur ${documents.length}`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
      <UploadDocumentModal
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { setUploadOpen(false); load(); }}
      />

      {viewDoc && (
        <DocumentViewerModal
          document={viewDoc}
          onClose={() => setViewDoc(null)}
          onDownload={handleDownload}
        />
      )}

      {rejectDoc && (
        <RejectDocumentModal
          document={rejectDoc}
          onClose={() => setRejectDoc(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  );
}