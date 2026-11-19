'use client';
import { PayrollAmounts } from '@/components/ui/PayrollAmounts';
import { DocumentReader } from '@/components/ui/DocumentReader';

// ============================================================================
// app/(dashboard)/paie/[id]/page.tsx
// ✅ Utilise BulletinDisplay — gère automatiquement mode template ET canvas
// ============================================================================

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Printer, Download, Check, Ban,
  DollarSign, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Info, Building2, Gift, Pencil, Trash2, RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import { useBasePath } from '@/hooks/useBasePath';
import AuditBlockedModal from '@/components/audit/AuditBlockedModal';
import { auditBlockedOf, type AuditBlocked } from '@/services/audit-engine';
import BulletinDisplay from '@/components/BulletinDisplay';
import { printBulletin, downloadBulletinPDF, getBulletinRootId } from '@/lib/bulletin-print';
import { Modal } from '@/components/design-system/feedback';
import './payroll-detail.css';
import { ModulePageFrame, ModulePageSkeleton } from '@/components/requests/ModulePageFrame';

interface PayrollData {
  employee?: {
    id: string;
    firstName?: string; lastName?: string;
    isSubjectToCnss?: boolean; isSubjectToIrpp?: boolean;
    professionalCategory?: string; employeeNumber?: string; position?: string;
    department?: { name?: string };
    cnssNumber?: string; nationalIdNumber?: string;
    paymentMethod?: string; maritalStatus?: string; numberOfChildren?: number;
    echelon?: string; contractType?: string; hireDate?: string;
  };
  company?: {
    legalName?: string; tradeName?: string; logo?: string;
    address?: string; city?: string; rccmNumber?: string;
    cnssNumber?: string; taxNumber?: string; nif?: string;
    phone?: string; email?: string; collectiveAgreement?: string;
    primaryColor?: string; secondaryColor?: string;
    [key: string]: any;
  };
  items?: Array<{
    id: string; code: string; label: string;
    type: 'GAIN' | 'DEDUCTION' | 'EMPLOYER_COST';
    base?: number; rate?: number; amount: number;
    isTaxable: boolean; isCnss: boolean; order: number;
  }>;
  status: string;
  month: number; year: number;
  grossSalary: number; netSalary: number;
  totalDeductions: number; totalEmployerCost?: number; employerCustomTaxTotal?: number;
  workDays?: number; workedDays?: number; absenceDays?: number;
  daysOnLeave?: number; daysRemote?: number;
  overtimeHours10?: number; overtimeHours25?: number;
  overtimeHours50?: number; overtimeHours100?: number;
  baseSalary?: number; adjustedBaseSalary?: number;
  absenceDeduction?: number; totalBonuses?: number;
  cnssSalarial?: number; cnssEmployer?: number;
  cnssEmployerPension?: number; cnssEmployerFamily?: number; cnssEmployerAccident?: number;
  its?: number; irppEffectiveRate?: number;
  tusDgiAmount?: number; tusCnssAmount?: number; tusTotal?: number;
}

const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

const STATUS_INFO: Record<string, { label: string; dot: string; border: string; text: string }> = {
  DRAFT: { label:'Brouillon', dot:'var(--text-secondary)', border:'var(--border)', text:'var(--text-secondary)' },
  VALIDATED: { label:'Validé', dot:'var(--green)', border:'var(--border)', text:'var(--success-text)' },
  TO_PAY: { label:'À payer', dot:'var(--mustard)', border:'var(--border)', text:'var(--warning-text)' },
  PAID: { label:'Payé', dot:'var(--green)', border:'var(--border)', text:'var(--success-text)' },
  CANCELLED: { label:'Annulé', dot:'var(--text-secondary)', border:'var(--border)', text:'var(--text-secondary)' },
};

const CONFIRM_CONFIG = {
  validate: { title:'Valider le bulletin ?',      sub:'Vous pourrez encore le corriger avant de le passer à payer.', btnLabel:'Valider', btnColor:'var(--action)', icon: Check      },
  pay:      { title:'Passer le bulletin à payer ?', sub:'Le bulletin sera verrouillé puis transmis à Compta.', btnLabel:'À payer', btnColor:'var(--action)', icon: DollarSign },
  cancel:   { title:'Annuler ce bulletin ?',      sub:'Le bulletin sera invalidé.',               btnLabel:'Annuler',   btnColor:'var(--action)', icon: Ban        },
  restore:  { title:'Remettre en brouillon ?',    sub:'Repassera en statut Brouillon.',           btnLabel:'Restaurer', btnColor:'var(--action)', icon: RotateCcw  },
  delete:   { title:'Supprimer définitivement ?', sub:'Action irréversible.',                     btnLabel:'Supprimer', btnColor:'var(--danger-text)', icon: Trash2     },
};

export default function PayslipPage({ params }: { params: { id: string } }) {
  const router   = useRouter();
  const { bp }   = useBasePath();
  const [pdfLoading, setPdfLoading] = React.useState(false);

  const [data, setData]             = useState<PayrollData | null>(null);
  const [userRole, setUserRole]     = useState<string | null>(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [isBusy, setIsBusy]         = useState(false);
  const [auditBlocked, setAuditBlocked] = useState<AuditBlocked | null>(null);
  const [showEmployer, setShowEmployer] = useState(false);
  const [confirm, setConfirm]       = useState<keyof typeof CONFIRM_CONFIG | null>(null);
  const [bonuses, setBonuses]       = useState<any[]>([]);

  useEffect(() => { fetchData(); }, [params.id]);

  const fetchData = async () => {
    try {
      const stored = localStorage.getItem('user');
      if (stored) setUserRole(JSON.parse(stored).role);
      const payroll = await api.get<PayrollData>(`/payrolls/${params.id}`);
      setData(payroll);
      if (payroll?.employee?.id) {
        try {
          const bd: any = await api.get(`/employee-bonuses?employeeId=${payroll.employee.id}`);
          const all = Array.isArray(bd) ? bd : bd?.data ?? [];
          setBonuses(all.filter((b: any) => b.isRecurring || b.source === 'AUTOMATIC'));
        } catch {}
      }
    } catch { router.push(bp('/paie')); }
    finally { setIsLoading(false); }
  };

  const handleConfirm = async () => {
    if (!confirm) return;
    setIsBusy(true);
    try {
      if (confirm === 'delete') {
        await api.delete(`/payrolls/${params.id}`);
        router.push(bp('/paie'));
        return;
      }
      const statusMap: Record<string, string> = {
        validate:'VALIDATED', pay:'TO_PAY', cancel:'CANCELLED', restore:'DRAFT',
      };
      const updated = await api.patch<PayrollData>(`/payrolls/${params.id}`, { status: statusMap[confirm] });
      setData(updated);
      setConfirm(null);
    } catch (e: any) {
      // 🛡️ Validation refusée par le contrôle de paie (422 AUDIT_BLOCKED)
      const blocked = auditBlockedOf(e);
      if (blocked) { setConfirm(null); setAuditBlocked(blocked); }
      else alert(`Erreur : ${e.response?.data?.message || e.message}`);
    } finally { setIsBusy(false); }
  };

  const fmt    = (v: any) => (Number(v) || 0).toLocaleString('fr-FR');
  const isAdmin = ['SUPER_ADMIN','ADMIN','HR_MANAGER'].includes(userRole || '');
  const isDraft = data?.status === 'DRAFT';

  if (isLoading) return <ModulePageSkeleton label="Chargement du bulletin de paie…" />;

  if (!data) return (
    <ModulePageFrame kind="detail">
      <div className="p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-[var(--danger-text)] mb-4" />
        <p className="text-[var(--text-secondary)]">Bulletin introuvable</p>
        <button onClick={() => router.push(bp('/paie'))} className="mt-4 px-6 py-2 bg-[var(--surface-2)] text-[var(--on-brand)] rounded-xl font-semibold">Retour</button>
      </div>
    </ModulePageFrame>
  );

  const cnssItem = (data.items || []).find(i => i.code === 'CNSS_SAL');
  const irppItem = (data.items || []).find(i => i.code === 'ITS' || i.code === 'BNC_SOURCE');
  const isSubjectToCnss = data.employee?.isSubjectToCnss ?? ((cnssItem?.amount ?? 0) > 0);
  const isSubjectToIrpp = data.employee?.isSubjectToIrpp ?? ((irppItem?.amount ?? 0) > 0);
  const statusInfo      = STATUS_INFO[data.status] ?? STATUS_INFO['DRAFT'];
  const monthLabel      = MONTHS[(data.month ?? 1) - 1];
  const tusDgiAmount    = Number(data.tusDgiAmount  ?? 0);
  const tusCnssAmount   = Number(data.tusCnssAmount ?? 0);

  // Objet payroll compatible BulletinDisplay (données API telles quelles)
  const payrollForDisplay = {
    ...data,
    items:   (data.items ?? []) as any,
    bonuses: bonuses.length > 0 ? bonuses : [],
    employee: data.employee ?? { id:'' },
    company:  data.company  ?? {},
  };

  return (
    <ModulePageFrame kind="detail">
      <>
      <style jsx global>{`
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          .no-print, nav, header, aside, footer,
          [class*="sidebar"],[class*="Sidebar"],
          [class*="navbar"],[class*="Navbar"] { display: none !important; }
          .payslip-sheet-wrap { display: block !important; position: static !important; }
        }
      `}</style>

      <div className="payroll-detail-page max-w-[1440px] mx-auto pb-20 print:p-0 print:max-w-none">

        {/* ── BARRE D'ACTIONS ── */}
        <div className="no-print payroll-detail-heading">

          {/* Ligne titre */}
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="flex-shrink-0 p-2.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors">
              <ArrowLeft size={18} className="text-[var(--text-secondary)]" />
            </button>
            <div className="payroll-detail-identity">
              <p className="payroll-detail-label">Bulletin de paie · {monthLabel} {data.year}</p>
              <h1 className="font-semibold text-[var(--text)] text-2xl">
                {data.employee?.firstName} {data.employee?.lastName}
              </h1>
              <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, border:`1.5px solid ${statusInfo.border}`, color:statusInfo.text, background:'var(--surface)', flexShrink:0 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:statusInfo.dot }} />
                {statusInfo.label}
              </span>
              <span className="text-sm text-[var(--text-secondary)]">{data.employee?.employeeNumber} {data.employee?.position}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="payroll-detail-actions">
            {isAdmin && isDraft && (
              <button onClick={() => router.push(bp(`/paie/${params.id}/modifier`))}
                className="k-button k-button-secondary">
                <Pencil size={16} /> Modifier
              </button>
            )}
            {isAdmin && data.status==='DRAFT'     && <button onClick={()=>setConfirm('validate')} className="flex items-center gap-2 px-4 py-2.5 bg-[var(--brand-soft)] hover:bg-[var(--brand-soft)] text-[var(--action)] font-semibold rounded-xl text-sm"><Check size={15}/> Valider</button>}
            {isAdmin && data.status==='VALIDATED' && <button onClick={()=>setConfirm('pay')}      className="flex items-center gap-2 px-4 py-2.5 bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))] text-[var(--warning-text)] font-semibold rounded-xl text-sm"><DollarSign size={15}/> À payer</button>}
            {isAdmin && !['CANCELLED','PAID'].includes(data.status) && <button onClick={()=>setConfirm('cancel')}  className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)]  text-[var(--warning-text)] hover:bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  font-semibold rounded-xl text-sm"><Ban size={15}/> Annuler</button>}
            {isAdmin && data.status==='CANCELLED' && <button onClick={()=>setConfirm('restore')} className="flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--surface-2)] font-semibold rounded-xl text-sm"><RotateCcw size={15}/> Restaurer</button>}
            <div className="w-px h-7 bg-[var(--border)] hidden sm:block mx-1" />
            <button
              disabled={pdfLoading}
              onClick={async () => {
                setPdfLoading(true);
                try {
                  await downloadBulletinPDF(
                    getBulletinRootId(data?.company?.bulletinTemplateId ?? 'default'),
                    `bulletin-${MONTHS[(data?.month??1)-1].toLowerCase()}-${data?.year}.pdf`
                  );
                } finally {
                  setPdfLoading(false);
                }
              }}
              className="k-button k-button-secondary"
            >
              <Download size={15}/>
              {pdfLoading ? 'Génération PDF…' : 'Télécharger PDF'}
            </button>
            <button
              onClick={() => printBulletin(getBulletinRootId(data?.company?.bulletinTemplateId ?? 'default'))}
              className="flex items-center gap-2 px-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] font-semibold rounded-xl text-sm hover:bg-[var(--surface-2)] transition-colors"
            >
              <Printer size={15}/> Imprimer
            </button>
            {isAdmin && !['TO_PAY','PAID'].includes(data.status) && <button onClick={()=>setConfirm('delete')} className="ml-auto flex items-center gap-2 px-3 py-2.5 border border-[var(--border)]  text-[var(--danger-text)] hover:bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))] font-semibold rounded-xl text-sm"><Trash2 size={14}/> Supprimer</button>}
          </div>

          {/* Bandeau modifiable */}

        </div>

        <section className="payroll-pay-summary no-print" aria-label="Rémunération du bulletin">
          <div><span>Salaire brut</span><strong>{fmt(data.grossSalary)} <small>FCFA</small></strong></div>
          <div><span>Total des retenues</span><strong>{fmt(data.totalDeductions)} <small>FCFA</small></strong></div>
          <div className="is-net"><span>Net à payer</span><strong>{fmt(data.netSalary)} <small>FCFA</small></strong></div>
        </section>
        {/* ── LAYOUT ── */}
        <div className="payroll-detail-layout print:block">

          {/* ✅ BULLETIN A4 */}
          <section className="payroll-preview">
          <div className="no-print payroll-preview-title"><h2>Bulletin officiel</h2><p>Aperçu du document transmis à l’employé.</p></div>
          <DocumentReader title="Bulletin officiel" fitPage initialZoom={0.72}>
          <div className="loan-document-protected">
            <div className="payslip-sheet-wrap">
              <BulletinDisplay payroll={payrollForDisplay as any} />
            </div>
          </div>

          </DocumentReader></section>
          {/* ── SIDEBAR ── */}
          <div className="no-print payroll-detail-context space-y-5">



            {bonuses.length > 0 && (
              <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] flex items-center gap-2">
                  <Gift size={15} className="text-[var(--success-text)]" />
                  <h3 className="font-semibold text-[var(--text)] text-sm">Primes ce mois</h3>
                </div>
                <div className="p-4 space-y-2">
                  {bonuses.map((b: any) => (
                    <div key={b.id} className="flex justify-between text-sm">
                      <span className="text-[var(--text-muted)] truncate flex-1 mr-2">{b.bonusType || b.label}</span>
                      <span className="font-mono font-semibold text-[var(--success-text)] flex-shrink-0">+{fmt(b.amount || 0)} F</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(!isSubjectToCnss || !isSubjectToIrpp) && (
              <div className="bg-[color-mix(in_srgb,var(--mustard)_14%,var(--surface))]  border border-[var(--border)] rounded-2xl p-4">
                <p className="font-semibold text-[var(--warning-text)]  text-sm flex items-center gap-2 mb-2"><AlertCircle size={14}/> Exemptions actives</p>
                {!isSubjectToCnss && <p className="text-xs text-[var(--warning-text)]">• CNSS : exempté</p>}
                {!isSubjectToIrpp && <p className="text-xs text-[var(--warning-text)]">• ITS : exempté</p>}
              </div>
            )}

            {isAdmin && (
              <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] overflow-hidden">
                <button onClick={() => setShowEmployer(!showEmployer)}
                  className="w-full flex items-center justify-between p-4 font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors">
                  <span className="flex items-center gap-2 text-sm"><Building2 size={15} className="text-[var(--success-text)]"/> Coût Employeur</span>
                  {showEmployer ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                </button>
                <AnimatePresence>
                  {showEmployer && (
                    <motion.div initial={{ height:0 }} animate={{ height:'auto' }} exit={{ height:0 }}
                      className="border-t border-[var(--border)] overflow-hidden">
                      <div className="p-4 space-y-2 text-sm bg-[var(--surface-2)]">
                        <PayrollAmounts payroll={data} side="employer" />
                        <div className="flex justify-between font-semibold pt-2 border-t border-[var(--border)] text-[var(--text)]">
                          <span>Coût Total</span>
                          <span className="font-mono">{data.totalEmployerCost == null ? '—' : `${fmt(data.totalEmployerCost)} F`}</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--border)] p-5">
              <h3 className="font-semibold text-[var(--text)] mb-4 text-sm">Récapitulatif</h3>
              <div className="space-y-2.5 text-sm">
                {[
                  { label:'Brut', val:`+${fmt(data.grossSalary)} F`,       cls:'text-[var(--success-text)] font-mono font-semibold' },
                ].map(r => (
                  <div key={r.label} className="flex justify-between">
                    <span className="text-[var(--text-muted)]">{r.label}</span>
                    <span className={r.cls}>{r.val}</span>
                  </div>
                ))}
                <PayrollAmounts payroll={data} side="employee" />
                <div className="flex justify-between pt-2.5 border-t border-[var(--border)]">
                  <span className="font-semibold text-[var(--text)]">Total des retenues</span>
                  <span className="font-mono text-[var(--text)]">{fmt(data.totalDeductions)} F</span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-[var(--border)]">
                  <span className="font-semibold text-[var(--text)]">Net</span>
                  <span className="font-mono font-semibold text-[var(--text)]">{fmt(data.netSalary)} F</span>
                </div>
              </div>
            </div>

            <div className="bg-[color-mix(in_srgb,var(--green)_12%,var(--surface))]  rounded-2xl p-4 border border-[var(--border)] ">
              <h3 className="font-semibold text-[var(--text)] mb-3 flex items-center gap-2 text-sm">
                <Info size={14} className="text-[var(--success-text)]"/> Congo 2026
              </h3>
              <div className="space-y-1 text-xs text-[var(--text-muted)]">
                <p>• ITS 2026 — barème progressif — Abattement 20%</p>
                <p>• CNSS salarié : 4% (plafond 1 200 000 F)</p>
                <p>• CNSS patronale : 8% + 10,03% + 2,25%</p>
                <p className="font-semibold text-[var(--warning-text)] ">• TUS FISC : 2,025% sur brut</p>
                <p className="font-semibold text-[var(--warning-text)] ">• TUS CNSS : 5,475% sur brut</p>
                <p>• SMIG : 70 400 FCFA/mois</p>
              </div>
            </div>
          </div>
        </div>

        {auditBlocked && (
          <AuditBlockedModal
            blocked={auditBlocked}
            month={data.month}
            year={data.year}
            onClose={() => setAuditBlocked(null)}
            onRetry={() => { setAuditBlocked(null); setConfirm('validate'); }}
          />
        )}

        {/* ── MODAL CONFIRMATION ── */}
        <AnimatePresence>
          {confirm && (
            <Modal open onClose={() => { !isBusy && setConfirm(null); }} title={CONFIRM_CONFIG[confirm].title}>
              <motion.div initial={{ scale:0.92, y:16 }} animate={{ scale:1, y:0 }} exit={{ scale:0.92, y:16 }}
                className="payroll-confirm-body">
                {(() => {
                  const cfg  = CONFIRM_CONFIG[confirm];
                  const Icon = cfg.icon;
                  const isDel = confirm === 'delete';
                  return (
                    <div className="flex flex-col items-center text-center">
                      <div className="payroll-confirm-icon"
                        style={{ background:isDel?'var(--surface-2)':'var(--surface-2)', color:isDel?'var(--danger-text)':'var(--text-muted)' }}>
                        <Icon size={30}/>
                      </div>
                      <p className="text-sm text-[var(--text-muted)] mb-5">{cfg.sub}</p>
                      {isDel && (
                        <div className="w-full mb-4 p-3 bg-[color-mix(in_srgb,var(--danger)_10%,var(--surface))]  border border-[var(--border)]  rounded-xl text-left">
                          <p className="text-xs text-[var(--danger-text)]  font-semibold">Cette action est irréversible.</p>
                        </div>
                      )}
                      <div className="flex gap-3 w-full">
                        <button onClick={() => setConfirm(null)}
                          className="flex-1 py-3 border border-[var(--border)] rounded-xl font-semibold text-sm hover:bg-[var(--surface-2)] transition-colors">
                          Retour
                        </button>
                        <button onClick={handleConfirm} disabled={isBusy}
                          className="flex-1 py-3 text-[var(--on-brand)] font-semibold rounded-xl flex justify-center items-center gap-2 text-sm disabled:opacity-50"
                          style={{ background:cfg.btnColor }}>
                          {isBusy ? <Loader2 className="animate-spin" size={18}/> : <Icon size={16}/>}
                          {isBusy ? '…' : cfg.btnLabel}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            </Modal>
          )}
        </AnimatePresence>
      </div>
      </>
    </ModulePageFrame>
  );
}
