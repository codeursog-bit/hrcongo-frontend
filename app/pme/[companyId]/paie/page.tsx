// 'use client';

// // app/pme/[companyId]/paie/page.tsx
// // Vue paie PME — identique à la page paie entreprise SAUF sans boutons "Générer"
// // Montre : stats masse salariale, liste bulletins, statuts — lecture seule

// import React, { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
// import { DollarSign, FileText, TrendingUp, Users, Info, ChevronDown, Loader2, Download } from 'lucide-react';
// import { api } from '@/services/api';

// const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
// const fmt    = (n: number) => new Intl.NumberFormat('fr-CG', { maximumFractionDigits: 0 }).format(n);

// const STATUS_CFG: Record<string, { label: string; color: string; bg: string }> = {
//   DRAFT:     { label: 'En cours',  color: 'text-amber-400',   bg: 'bg-amber-500/10'   },
//   VALIDATED: { label: 'Validé',    color: 'text-blue-400',    bg: 'bg-blue-500/10'    },
//   PAID:      { label: 'Payé',      color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
// };

// export default function PmePaiePage() {
//   const params    = useParams();
//   const companyId = params.companyId as string;

//   const now = new Date();
//   const [month,    setMonth]    = useState(now.getMonth() + 1);
//   const [year,     setYear]     = useState(now.getFullYear());
//   const [payrolls, setPayrolls] = useState<any[]>([]);
//   const [loading,  setLoading]  = useState(true);

//   useEffect(() => {
//     const load = async () => {
//       setLoading(true);
//       try {
//         // PME user a son companyId → pas besoin de ?companyId=
//         const res: any = await api.get(`/payrolls?month=${month}&year=${year}&limit=200`);
//         setPayrolls(Array.isArray(res) ? res : res?.data ?? []);
//       } catch { setPayrolls([]); }
//       finally  { setLoading(false); }
//     };
//     load();
//   }, [month, year]);

//   const totalGross = payrolls.reduce((s, p) => s + (p.grossSalary ?? 0), 0);
//   const totalNet   = payrolls.reduce((s, p) => s + (p.netSalary   ?? 0), 0);
//   const totalCost  = payrolls.reduce((s, p) => s + (p.totalEmployerCost ?? 0), 0);

//   const exportAll = async () => {
//     if (payrolls.length === 0) return;
//     try {
//       const ids  = payrolls.map(p => p.id);
//       const blob: any = await api.post('/payrolls/export/batch-pdf', { payrollIds: ids });
//       const url  = URL.createObjectURL(blob);
//       const a    = document.createElement('a');
//       a.href     = url;
//       a.download = `bulletins-${MONTHS[month - 1]}-${year}.pdf`;
//       a.click();
//     } catch {}
//   };

//   return (
//     <div className="space-y-5">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h1 className="text-2xl font-bold text-white flex items-center gap-2">
//             <DollarSign size={22} className="text-emerald-400" /> Paie
//           </h1>
//           <p className="text-gray-500 text-sm mt-0.5">Bulletins générés par votre cabinet</p>
//         </div>
//         {/* Info band — remplace les boutons de génération */}
//         <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-500/8 border border-blue-500/20 rounded-xl">
//           <Info size={14} className="text-blue-400 shrink-0" />
//           <span className="text-blue-300 text-sm">Paie gérée par votre cabinet</span>
//         </div>
//       </div>

//       {/* Sélecteur mois/année */}
//       <div className="flex items-center gap-2">
//         <div className="relative">
//           <select value={month} onChange={e => setMonth(Number(e.target.value))}
//             className="appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white pr-8 outline-none focus:border-white/30">
//             {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
//           </select>
//           <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
//         </div>
//         <div className="relative">
//           <select value={year} onChange={e => setYear(Number(e.target.value))}
//             className="appearance-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white pr-8 outline-none">
//             {[year-1, year, year+1].map(y => <option key={y} value={y}>{y}</option>)}
//           </select>
//           <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
//         </div>
//         {payrolls.length > 0 && (
//           <button onClick={exportAll}
//             className="flex items-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors ml-2">
//             <Download size={13} /> Exporter PDF
//           </button>
//         )}
//       </div>

//       {/* Stats */}
//       {!loading && payrolls.length > 0 && (
//         <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//           {[
//             { label: 'Bulletins',    value: `${payrolls.length}`,      icon: FileText,    color: '#6366f1' },
//             { label: 'Masse nette',  value: `${fmt(totalNet)} F`,      icon: DollarSign,  color: '#22c55e' },
//             { label: 'Masse brute',  value: `${fmt(totalGross)} F`,    icon: TrendingUp,  color: '#0ea5e9' },
//             { label: 'Coût total',   value: `${fmt(totalCost)} F`,     icon: Users,       color: '#f97316' },
//           ].map(c => (
//             <div key={c.label} className="bg-white/3 border border-white/8 rounded-2xl p-4 flex items-center gap-3">
//               <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
//                    style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
//                 <c.icon size={16} style={{ color: c.color }} />
//               </div>
//               <div>
//                 <p className="text-white font-bold text-sm">{c.value}</p>
//                 <p className="text-xs text-gray-500">{c.label}</p>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Liste bulletins */}
//       <div className="bg-white/3 border border-white/8 rounded-2xl overflow-hidden">
//         <div className="px-5 py-4 border-b border-white/8">
//           <h2 className="font-semibold text-white text-sm">
//             {MONTHS[month-1]} {year} · {payrolls.length} bulletin{payrolls.length > 1 ? 's' : ''}
//           </h2>
//         </div>

//         {loading ? (
//           <div className="flex justify-center py-10"><Loader2 size={22} className="animate-spin text-gray-600" /></div>
//         ) : payrolls.length === 0 ? (
//           <div className="text-center py-12 text-gray-500">
//             <FileText size={28} className="mx-auto mb-2 text-gray-700" />
//             <p>Aucun bulletin pour {MONTHS[month-1]} {year}</p>
//             <p className="text-xs text-gray-600 mt-1">Votre cabinet n'a pas encore généré la paie ce mois-ci</p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-white/5">
//                   {['Employé','Poste','Brut','Net','Coût','Statut'].map(h => (
//                     <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium">{h}</th>
//                   ))}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-white/5">
//                 {payrolls.map((p: any) => {
//                   const sc = STATUS_CFG[p.status] ?? STATUS_CFG['DRAFT'];
//                   return (
//                     <tr key={p.id} className="hover:bg-white/3 transition-colors">
//                       <td className="px-4 py-3">
//                         <p className="text-white font-medium">{p.employee?.firstName} {p.employee?.lastName}</p>
//                         <p className="text-xs text-gray-500">{p.employee?.employeeNumber}</p>
//                       </td>
//                       <td className="px-4 py-3 text-gray-400 text-xs">{p.employee?.position}</td>
//                       <td className="px-4 py-3 text-gray-300 text-sm">{fmt(p.grossSalary ?? 0)} F</td>
//                       <td className="px-4 py-3 text-emerald-400 font-semibold text-sm">{fmt(p.netSalary ?? 0)} F</td>
//                       <td className="px-4 py-3 text-amber-400 text-sm">{fmt(p.totalEmployerCost ?? 0)} F</td>
//                       <td className="px-4 py-3">
//                         <span className={`text-xs px-2 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>{sc.label}</span>
//                       </td>
//                     </tr>
//                   );
//                 })}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }



'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Users, Settings, Wallet, Search, Filter, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalLoader } from '@/components/ui/GlobalLoader';
import { api } from '@/services/api';

import { PayrollStatsCards } from './components/PayrollStatsCards';
import { PayrollMonthSelector } from './components/PayrollMonthSelector';
import { PayrollTableRow } from './components/PayrollTableRow';
import { PayrollBatchActionsFooter } from './components/PayrollBatchActionsFooter';
import { PayrollPagination } from './components/PayrollPagination';
import { usePayrollData } from '@/hooks/usePayrollData';

type PayrollStatus = 'Draft' | 'Validated' | 'Paid' | 'Cancelled';

const ITEMS_PER_PAGE = 25;

export default function PayrollPage() {
  const router = useRouter();
  const now    = new Date();
  const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const [selectedMonth,      setSelectedMonth]      = useState(MONTHS[now.getMonth()]);
  const [selectedYear,       setSelectedYear]        = useState(now.getFullYear());
  const [activeTab,          setActiveTab]           = useState<'All' | PayrollStatus>('All');
  const [searchQuery,        setSearchQuery]         = useState('');
  const [selectedIds,        setSelectedIds]         = useState<string[]>([]);
  const [showFilters,        setShowFilters]         = useState(false);
  const [actionLoadingId,    setActionLoadingId]     = useState<string | null>(null);
  const [filterDept,         setFilterDept]          = useState('Tous');
  const [showMonthSelector,  setShowMonthSelector]   = useState(false);
  const [isBatchActionLoading, setIsBatchActionLoading] = useState(false);
  const [currentPage,        setCurrentPage]         = useState(1);

  // ── ÉTAT MODAL SUPPRESSION ───────────────────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: '', name: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const { entries, isLoading, stats, refetch, setEntries } = usePayrollData(selectedMonth, selectedYear);

  // ── CHANGEMENT STATUT ────────────────────────────────────────────────────
  const handleStatusChange = async (id: string, newStatus: string) => {
    setActionLoadingId(id);
    const backendStatus  = newStatus.toUpperCase();
    const frontendStatus = newStatus === 'VALIDATED' ? 'Validated'
                         : newStatus === 'PAID'      ? 'Paid'
                         : newStatus === 'DRAFT'     ? 'Draft'
                         : 'Cancelled';
    try {
      if (newStatus === 'CANCELLED') {
        const cur = entries.find(e => e.id === id);
        if (cur?.status === 'Paid') {
          await api.delete(`/payrolls/${id}`);
        } else {
          await api.patch(`/payrolls/${id}`, { status: backendStatus });
        }
      } else {
        await api.patch(`/payrolls/${id}`, { status: backendStatus });
      }
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: frontendStatus as PayrollStatus } : e));
    } catch (e: any) {
      alert(`❌ ${e.message || 'Impossible de mettre à jour le statut'}`);
      refetch();
    } finally {
      setActionLoadingId(null);
    }
  };

  // ── SUPPRESSION DÉFINITIVE ────────────────────────────────────────────────
  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({ open: true, id, name });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/payrolls/${deleteModal.id}`);
      setEntries(prev => prev.filter(e => e.id !== deleteModal.id));
      setSelectedIds(prev => prev.filter(i => i !== deleteModal.id));
      setDeleteModal({ open: false, id: '', name: '' });
    } catch (e: any) {
      alert(`❌ ${e.message || 'Impossible de supprimer le bulletin'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── ACTIONS EN MASSE ──────────────────────────────────────────────────────
  const handleBatchAction = async (action: string) => {
    if (selectedIds.length === 0) {
      alert('⚠️ Veuillez sélectionner au moins un bulletin');
      return;
    }
    const label = action === 'VALIDATED' ? 'Valider' : action === 'PAID' ? 'Marquer comme payé' : 'Annuler';
    if (!confirm(`Voulez-vous vraiment ${label} ${selectedIds.length} bulletin(s) ?`)) return;

    setIsBatchActionLoading(true);
    let successCount = 0, failCount = 0;
    for (const id of selectedIds) {
      try {
        if (action === 'CANCELLED') {
          const cur = entries.find(e => e.id === id);
          if (cur?.status === 'Paid') await api.delete(`/payrolls/${id}`);
          else await api.patch(`/payrolls/${id}`, { status: action });
        } else {
          await api.patch(`/payrolls/${id}`, { status: action });
        }
        successCount++;
      } catch { failCount++; }
    }
    alert(`✅ ${successCount} réussis, ❌ ${failCount} échecs`);
    setSelectedIds([]);
    refetch();
    setIsBatchActionLoading(false);
  };

  // ── FILTRAGE + PAGINATION ─────────────────────────────────────────────────
  const filteredEntries = useMemo(() => entries.filter(entry => {
    const matchesTab    = activeTab === 'All' || entry.status === activeTab;
    const matchesSearch = entry.name.toLowerCase().includes(searchQuery.toLowerCase())
                       || entry.matricule.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDept   = filterDept === 'Tous' || entry.department === filterDept;
    return matchesTab && matchesSearch && matchesDept;
  }), [entries, activeTab, searchQuery, filterDept]);

  const totalPages      = Math.ceil(filteredEntries.length / ITEMS_PER_PAGE);
  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const toggleSelection = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const selectAll = () =>
    setSelectedIds(selectedIds.length === paginatedEntries.length ? [] : paginatedEntries.map(e => e.id));

  if (isLoading) return <GlobalLoader />;

  return (
    <div className="space-y-6 min-h-screen pb-32" onClick={() => setShowMonthSelector(false)}>

      {/* ── HEADER ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestion de Paie</h1>
          <p className="text-gray-500 dark:text-gray-400">Gérez les bulletins, validations et paiements.</p>
        </div>

        <PayrollMonthSelector
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={m => { setSelectedMonth(m); setShowMonthSelector(false); setCurrentPage(1); }}
          onYearChange={y => { setSelectedYear(y); setCurrentPage(1); }}
          isOpen={showMonthSelector}
          onToggle={e => { e.stopPropagation(); setShowMonthSelector(!showMonthSelector); }}
        />

        <div className="flex items-center gap-3">
          <Link href="/parametres/paie"
            className="p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            <Settings size={20} />
          </Link>
        </div>
      </div>

      {/* ── STATS ── */}
      <PayrollStatsCards
        totalGross={stats.totalGross}
        totalCharges={stats.totalCharges}
        totalNet={stats.totalNet}
        paidCount={stats.paidCount}
        totalActive={stats.totalActive}
      />

      {/* ── TABLE ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">

        {/* Toolbar */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex bg-gray-100 dark:bg-gray-750 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
            {[
              { id: 'All',       label: 'Tous',       count: entries.length },
              { id: 'Draft',     label: 'Brouillons', count: entries.filter(e => e.status === 'Draft').length },
              { id: 'Validated', label: 'Validés',    count: entries.filter(e => e.status === 'Validated').length },
              { id: 'Paid',      label: 'Payés',      count: entries.filter(e => e.status === 'Paid').length },
            ].map(tab => (
              <button key={tab.id}
                onClick={() => { setActiveTab(tab.id as any); setCurrentPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap flex items-center gap-2
                  ${activeTab === tab.id ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {tab.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full
                  ${activeTab === tab.id ? 'bg-gray-100 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-700'}`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="Rechercher..." value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-750 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500"
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-xl border ${showFilters ? 'bg-sky-50 border-sky-200 text-sky-600' : 'border-gray-200 dark:border-gray-700 text-gray-500'}`}>
              <Filter size={18} />
            </button>
          </div>
        </div>

        {/* Tableau */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs uppercase text-gray-500 font-semibold sticky top-0 z-10">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input type="checkbox"
                    checked={selectedIds.length === paginatedEntries.length && paginatedEntries.length > 0}
                    onChange={selectAll}
                    className="rounded border-gray-300 text-sky-500 focus:ring-sky-500"
                  />
                </th>
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Poste</th>
                <th className="px-6 py-4 text-center">Jours</th>
                <th className="px-6 py-4 text-right">Salaire Net</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
              {paginatedEntries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <p className="text-gray-500">Aucun bulletin trouvé.</p>
                  </td>
                </tr>
              ) : (
                paginatedEntries.map(entry => (
                  <PayrollTableRow
                    key={entry.id}
                    entry={entry}
                    isSelected={selectedIds.includes(entry.id)}
                    isActionLoading={actionLoadingId === entry.id}
                    onToggleSelect={() => toggleSelection(entry.id)}
                    onView={() => router.push(`/paie/${entry.id}`)}
                    onStatusChange={status => handleStatusChange(entry.id, status)}
                    // ✅ NOUVEAU : modifier (seulement DRAFT) + supprimer définitivement
                    onEdit={entry.status === 'Draft'
                      ? () => router.push(`/paie/${entry.id}/modifier`)
                      : undefined}
                    onDelete={() => openDeleteModal(entry.id, entry.name)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <PayrollPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        )}
      </div>

      {/* ── FOOTER BATCH ── */}
      <PayrollBatchActionsFooter
        selectedCount={selectedIds.length}
        isLoading={isBatchActionLoading}
        onValidate={() => handleBatchAction('VALIDATED')}
        onPay={() => handleBatchAction('PAID')}
        onCancel={() => handleBatchAction('CANCELLED')}
        onClear={() => setSelectedIds([])}
      />

      {/* ── MODAL SUPPRESSION DÉFINITIVE ── */}
      <AnimatePresence>
        {deleteModal.open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => !isDeleting && setDeleteModal({ open: false, id: '', name: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                {/* Icône */}
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <Trash2 size={32} className="text-red-600 dark:text-red-400" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Supprimer définitivement ?
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">
                  Le bulletin de <strong className="text-gray-900 dark:text-white">{deleteModal.name}</strong> sera supprimé de la base de données.
                </p>

                {/* Avertissement */}
                <div className="w-full mb-5 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-left">
                  <AlertCircle size={14} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 dark:text-red-300 font-medium">
                    Action irréversible. Vous devrez recréer le bulletin si nécessaire.
                  </p>
                </div>

                <div className="flex gap-3 w-full">
                  <button
                    onClick={() => setDeleteModal({ open: false, id: '', name: '' })}
                    disabled={isDeleting}
                    className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={18} />}
                    {isDeleting ? 'Suppression...' : 'Supprimer'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}