

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, Printer, Download, Check, Ban, 
  DollarSign, ChevronDown, ChevronUp, AlertCircle,
  Loader2, Info, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/services/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Composants
import PayslipHeader from './components/PayslipHeader';
import PayslipEmployeeInfo from './components/PayslipEmployeeInfo';
import PayslipBreakdown from './components/PayslipBreakdown';
import PayslipFooter from './components/PayslipFooter';

export default function PayslipPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showEmployer, setShowEmployer] = useState(false);
  const [showConfirm, setShowConfirm] = useState<{show: boolean, action: 'validate' | 'pay' | 'cancel'} | null>(null);

  useEffect(() => {
    fetchPayroll();
  }, [params.id]);

  const fetchPayroll = async () => {
    try {
      const payroll = await api.get(`/payrolls/${params.id}`);
      console.log("📄 Bulletin chargé:", payroll);
      setData(payroll);
    } catch (error) {
      console.error("❌ Erreur chargement bulletin:", error);
      alert("Impossible de charger le bulletin");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async () => {
    if (!showConfirm) return;
    setIsUpdating(true);
    
    const statusMap: any = {
      'validate': 'VALIDATED',
      'pay': 'PAID',
      'cancel': 'CANCELLED'
    };
    const backendStatus = statusMap[showConfirm.action];

    try {
      const updated = await api.patch(`/payrolls/${params.id}`, { status: backendStatus });
      console.log("✅ Statut mis à jour:", updated);
      setData(updated);
      setShowConfirm(null);
    } catch (e: any) {
      console.error("❌ Erreur mise à jour:", e);
      alert(`Erreur: ${e.response?.data?.message || e.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!printRef.current || !data) return;
    
    setIsGeneratingPDF(true);
    
    try {
      const element = printRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10;
      
      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      
      const fileName = `Bulletin_${data.employee?.firstName}_${data.employee?.lastName}_${data.month}-${data.year}.pdf`;
      pdf.save(fileName);
      
    } catch (error) {
      console.error("❌ Erreur génération PDF:", error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const formatMoney = (val: number) => val?.toLocaleString('fr-FR') || '0';

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={32}/>
      </div>
    );
  }
  
  if (!data) {
    return (
      <div className="p-8 text-center">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">Bulletin introuvable</p>
        <button 
          onClick={() => router.back()} 
          className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold"
        >
          Retour
        </button>
      </div>
    );
  }

  const employerCosts = (data.items || []).filter((i: any) => i.type === 'EMPLOYER_COST');

  return (
    <>
      {/* STYLES D'IMPRESSION */}
      <style jsx global>{`
        @media print {
          body { 
            background: white !important; 
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          
          @page { 
            size: A4; 
            margin: 1.5cm; 
          }
        }
      `}</style>

      <div className="max-w-[1200px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">
        
        {/* TOP ACTIONS */}
        <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <button 
            onClick={() => router.back()} 
            className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-500" />
          </button>

          <div className="flex flex-wrap items-center gap-3">
            {data.status === 'DRAFT' && (
              <button 
                onClick={() => setShowConfirm({show: true, action: 'validate'})} 
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <Check size={18} /> Valider
              </button>
            )}
            {data.status === 'VALIDATED' && (
              <button 
                onClick={() => setShowConfirm({show: true, action: 'pay'})} 
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                <DollarSign size={18} /> Marquer Payé
              </button>
            )}
            {data.status !== 'CANCELLED' && data.status !== 'PAID' && (
              <button 
                onClick={() => setShowConfirm({show: true, action: 'cancel'})} 
                className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl transition-all flex items-center gap-2"
              >
                <Ban size={18} /> Annuler
              </button>
            )}
            <button 
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingPDF ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              {isGeneratingPDF ? 'Génération...' : 'Télécharger PDF'}
            </button>
            <button 
              onClick={handlePrint} 
              className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Printer size={18} /> Imprimer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:block">
          
          {/* BULLETIN PRINCIPAL */}
          <div 
            ref={printRef}
            className="lg:col-span-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xl print:shadow-none rounded-xl print:rounded-none overflow-hidden border border-gray-200 dark:border-gray-700 print:border-2 print:border-gray-900 print:bg-white print:text-black"
          >
            {/* HEADER */}
            <PayslipHeader
              company={data.company}
              month={data.month}
              year={data.year}
              status={data.status}
            />

            {/* INFO EMPLOYÉ */}
            <PayslipEmployeeInfo
              employee={data.employee}
              payslip={{
                month: data.month,
                year: data.year,
                workDays: data.workDays,
                workedDays: data.workedDays,
                absenceDays: data.absenceDays,
                daysOnLeave: data.daysOnLeave,
                daysRemote: data.daysRemote,
                daysHoliday: data.daysHoliday,
                overtimeHours15: data.overtimeHours15,
                overtimeHours50: data.overtimeHours50
              }}
            />

            {/* DÉTAIL DES LIGNES */}
            <div className="p-8 print:p-6">
              <PayslipBreakdown
                items={data.items || []}
                grossSalary={data.grossSalary}
                netSalary={data.netSalary}
              />

              {/* FOOTER */}
              <PayslipFooter />
            </div>
          </div>

          {/* SIDEBAR INFO */}
          <div className="space-y-6 no-print">
            {/* COÛT EMPLOYEUR */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button 
                onClick={() => setShowEmployer(!showEmployer)} 
                className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={18} className="text-sky-500" />
                  Coût Employeur
                </span>
                {showEmployer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              <AnimatePresence>
                {showEmployer && (
                  <motion.div 
                    initial={{ height: 0 }} 
                    animate={{ height: 'auto' }} 
                    exit={{ height: 0 }}
                    className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700"
                  >
                    <div className="p-4 space-y-3 text-sm">
                      <div className="flex justify-between text-gray-600 dark:text-gray-400">
                        <span>Salaire Brut</span>
                        <span className="font-mono font-bold">{formatMoney(data.grossSalary)} F</span>
                      </div>
                      
                      {employerCosts.map((cost: any) => (
                        <div key={cost.id} className="flex justify-between text-gray-600 dark:text-gray-400">
                          <span>{cost.label}</span>
                          <span className="font-mono font-bold text-red-500">+{formatMoney(cost.amount)} F</span>
                        </div>
                      ))}
                      
                      <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 text-gray-900 dark:text-white">
                        <span>Coût Total</span>
                        <span className="font-mono">{formatMoney(data.totalEmployerCost)} F</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* INFO LÉGALES */}
            <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-sky-200 dark:border-sky-800">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Info size={18} className="text-sky-500" />
                Réglementation
              </h3>
              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                <p>• Code du Travail RDC</p>
                <p>• CNSS: 4% (salarié) + 16% (employeur)</p>
                <p>• Plafond CNSS: 1 200 000 FCFA</p>
                <p>• ITS selon barème progressif</p>
                <p>• Heures sup: +15% et +50%</p>
              </div>
            </div>

            {/* RÉCAPITULATIF RAPIDE */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Récapitulatif</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Brut</span>
                  <span className="font-mono font-bold text-emerald-600">{formatMoney(data.grossSalary)} F</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Déductions</span>
                  <span className="font-mono font-bold text-red-600">-{formatMoney(data.totalDeductions)} F</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <span className="font-bold text-gray-900 dark:text-white">Net</span>
                  <span className="font-mono font-bold text-gray-900 dark:text-white">{formatMoney(data.netSalary)} F</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONFIRM MODAL */}
        <AnimatePresence>
          {showConfirm && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print"
            >
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                    showConfirm.action === 'validate' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
                    showConfirm.action === 'pay' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-500' : 
                    'bg-red-100 dark:bg-red-900/30 text-red-500'
                  }`}>
                    <AlertCircle size={32} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {showConfirm.action === 'validate' ? 'Valider le bulletin ?' : 
                     showConfirm.action === 'pay' ? 'Confirmer le paiement ?' : 'Annuler ce bulletin ?'}
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
                    {showConfirm.action === 'validate' ? 'Le bulletin ne pourra plus être modifié.' :
                     showConfirm.action === 'pay' ? 'Cette action marquera le bulletin comme payé.' : 
                     'Le bulletin sera invalidé définitivement.'}
                  </p>
                  
                  <div className="flex gap-3 w-full">
                    <button 
                      onClick={() => setShowConfirm(null)} 
                      className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      Retour
                    </button>
                    <button 
                      onClick={handleAction} 
                      disabled={isUpdating} 
                      className={`flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${
                        showConfirm.action === 'validate' ? 'bg-emerald-500 hover:bg-emerald-600' :
                        showConfirm.action === 'pay' ? 'bg-sky-500 hover:bg-sky-600' : 
                        'bg-red-500 hover:bg-red-600'
                      }`}
                    >
                      {isUpdating ? <Loader2 className="animate-spin" size={20}/> : 'Confirmer'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}


// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import { 
//   ArrowLeft, Printer, Download, Check, X, 
//   DollarSign, Building2, ChevronDown, ChevronUp, AlertCircle,
//   Loader2, Ban, Hexagon, FileText, Info
// } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';
// import { api } from '@/services/api';

// export default function PayslipPage({ params }: { params: { id: string } }) {
//   const router = useRouter();
//   const [data, setData] = useState<any>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isUpdating, setIsUpdating] = useState(false);
//   const [showEmployer, setShowEmployer] = useState(false);
//   const [showItems, setShowItems] = useState(true);
//   const [showConfirm, setShowConfirm] = useState<{show: boolean, action: 'validate' | 'pay' | 'cancel'} | null>(null);

//   useEffect(() => {
//     const fetchPayroll = async () => {
//       try {
//         // 🔥 VRAI APPEL API
//         const payroll = await api.get(`/payrolls/${params.id}`);
//         console.log("📄 Bulletin chargé:", payroll);
//         setData(payroll);
//       } catch (error) {
//         console.error("❌ Erreur chargement bulletin:", error);
//         alert("Impossible de charger le bulletin");
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchPayroll();
//   }, [params.id]);

//   const handleAction = async () => {
//     if (!showConfirm) return;
//     setIsUpdating(true);
    
//     let backendStatus = 'DRAFT';
//     if (showConfirm.action === 'validate') backendStatus = 'VALIDATED';
//     if (showConfirm.action === 'pay') backendStatus = 'PAID';
//     if (showConfirm.action === 'cancel') backendStatus = 'CANCELLED';

//     try {
//         // 🔥 VRAI APPEL API
//         const updated = await api.patch(`/payrolls/${params.id}`, { status: backendStatus });
//         console.log("✅ Statut mis à jour:", updated);
//         setData(updated);
//         setShowConfirm(null);
//     } catch (e: any) {
//         console.error("❌ Erreur mise à jour:", e);
//         alert(`Erreur: ${e.response?.data?.message || e.message}`);
//     } finally {
//         setIsUpdating(false);
//     }
//   };

//   const handlePrint = () => {
//       window.print();
//   };

//   const formatMoney = (val: number) => val?.toLocaleString('fr-FR') || '0';

//   const getStatusBadge = (status: string) => {
//     const map: any = {
//       'DRAFT': { label: 'Brouillon', class: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
//       'VALIDATED': { label: 'Validé', class: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
//       'PAID': { label: 'Payé', class: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400' },
//       'CANCELLED': { label: 'Annulé', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' }
//     };
//     const s = map[status] || map.DRAFT;
//     return <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${s.class}`}>{s.label}</span>;
//   };

//   const getMonthName = (m: number) => {
//     const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
//     return months[m - 1] || 'Inconnu';
//   };

//   if (isLoading) return (
//     <div className="min-h-screen flex items-center justify-center">
//       <Loader2 className="animate-spin text-sky-500" size={32}/>
//     </div>
//   );
  
//   if (!data) return (
//     <div className="p-8 text-center">
//       <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
//       <p className="text-gray-500 dark:text-gray-400">Bulletin introuvable</p>
//       <button 
//         onClick={() => router.back()} 
//         className="mt-4 px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold"
//       >
//         Retour
//       </button>
//     </div>
//   );

//   const emp = data.employee;
//   const company = data.company;
  
//   // 🔥 Grouper les items par type (vient du backend)
//   const gains = (data.items || []).filter((i: any) => i.type === 'GAIN' && i.amount > 0);
//   const deductions = (data.items || []).filter((i: any) => i.type === 'DEDUCTION' && i.amount > 0);
//   const employerCosts = (data.items || []).filter((i: any) => i.type === 'EMPLOYER_COST');

//   return (
//     <>
//       {/* STYLES D'IMPRESSION */}
//       <style jsx global>{`
//         @media print {
//           body { 
//             background: white !important; 
//             print-color-adjust: exact;
//             -webkit-print-color-adjust: exact;
//           }
//           .no-print { display: none !important; }
//           .print-only { display: block !important; }
          
//           @page { 
//             size: A4; 
//             margin: 1.5cm; 
//           }
//         }
//       `}</style>

//       <div className="max-w-[1200px] mx-auto pb-20 px-4 print:p-0 print:max-w-none">
        
//         {/* TOP ACTIONS */}
//         <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//           <button 
//             onClick={() => router.back()} 
//             className="p-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 transition-colors"
//           >
//             <ArrowLeft size={20} className="text-gray-500" />
//           </button>

//           <div className="flex flex-wrap items-center gap-3">
//              {data.status === 'DRAFT' && (
//                <button 
//                  onClick={() => setShowConfirm({show: true, action: 'validate'})} 
//                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
//                >
//                  <Check size={18} /> Valider
//                </button>
//              )}
//              {data.status === 'VALIDATED' && (
//                <button 
//                  onClick={() => setShowConfirm({show: true, action: 'pay'})} 
//                  className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
//                >
//                  <DollarSign size={18} /> Marquer Payé
//                </button>
//              )}
//              {data.status !== 'CANCELLED' && data.status !== 'PAID' && (
//                <button 
//                  onClick={() => setShowConfirm({show: true, action: 'cancel'})} 
//                  className="px-4 py-2 border border-red-200 dark:border-red-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold rounded-xl transition-all flex items-center gap-2"
//                >
//                  <Ban size={18} /> Annuler
//                </button>
//              )}
//              <button 
//                onClick={handlePrint} 
//                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
//              >
//                 <Printer size={18} /> Imprimer PDF
//              </button>
//           </div>
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start print:block">
          
//           {/* BULLETIN PRINCIPAL */}
//           <div className="lg:col-span-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-xl print:shadow-none rounded-xl print:rounded-none overflow-hidden border border-gray-200 dark:border-gray-700 print:border-2 print:border-gray-900 print:bg-white print:text-black">
             
//              {/* HEADER */}
//              <div className="p-8 print:p-6 border-b-2 border-gray-200 dark:border-gray-700 print:border-gray-900 flex justify-between items-start bg-gray-50 dark:bg-gray-900/50 print:bg-white">
//                 <div className="flex items-center gap-4">
//                    {company?.logo ? (
//                        <div className="w-20 h-20 relative">
//                            <img src={company.logo} alt="Logo" className="w-full h-full object-contain" />
//                        </div>
//                    ) : (
//                        <div className="w-16 h-16 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg print:shadow-none print:bg-gray-100 print:text-gray-800 print:border-2 print:border-gray-900">
//                           <Building2 size={32} />
//                        </div>
//                    )}
                   
//                    <div>
//                       <h1 className="text-xl font-bold text-gray-900 dark:text-white print:text-black tracking-tight">
//                         {company?.legalName || 'Entreprise'}
//                       </h1>
//                       <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-700">
//                         {company?.address || 'Adresse'}
//                       </p>
//                       <p className="text-sm text-gray-500 dark:text-gray-400 print:text-gray-700">
//                         RCCM: {company?.rccmNumber || 'N/A'}
//                       </p>
//                    </div>
//                 </div>
//                 <div className="text-right">
//                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white print:text-black uppercase tracking-widest mb-1">
//                      Bulletin de Paie
//                    </h2>
//                    <p className="font-bold text-sky-600 dark:text-sky-400 print:text-black text-lg">
//                      {getMonthName(data.month)} {data.year}
//                    </p>
//                    <div className="mt-2 print:hidden">{getStatusBadge(data.status)}</div>
//                 </div>
//              </div>

//              {/* INFO GRID */}
//              <div className="p-8 print:p-6 grid grid-cols-2 gap-x-12 gap-y-6 text-sm border-b border-gray-200 dark:border-gray-700 print:border-gray-300">
//                 <div className="space-y-4">
//                    <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1">
//                      Employé
//                    </h3>
//                    <div className="flex items-center gap-3 mb-2">
//                       <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 print:bg-gray-200 rounded-full flex items-center justify-center font-bold text-lg text-gray-600 dark:text-gray-300 print:text-gray-700 print:hidden">
//                           {emp?.firstName?.[0]}{emp?.lastName?.[0]}
//                       </div>
//                       <div>
//                          <p className="font-bold text-lg text-gray-900 dark:text-white print:text-black">
//                            {emp?.firstName} {emp?.lastName}
//                          </p>
//                          <p className="font-mono text-gray-500 dark:text-gray-400 print:text-gray-700">
//                            Matricule: {emp?.employeeNumber}
//                          </p>
//                       </div>
//                    </div>
//                    <div className="grid grid-cols-2 gap-2">
//                       <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Poste:</div>
//                       <div className="font-medium text-gray-900 dark:text-white print:text-black">{emp?.position}</div>
//                       <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Département:</div>
//                       <div className="font-medium text-gray-900 dark:text-white print:text-black">{emp?.department?.name}</div>
//                       <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">CNSS:</div>
//                       <div className="font-medium text-gray-900 dark:text-white print:text-black">{emp?.cnssNumber || 'N/A'}</div>
//                    </div>
//                 </div>
                
//                 <div className="space-y-4">
//                    <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 print:text-gray-600 tracking-wider border-b border-gray-100 dark:border-gray-700 print:border-gray-300 pb-1">
//                      Période & Détails
//                    </h3>
//                    <div className="grid grid-cols-2 gap-2">
//                       <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Période:</div>
//                       <div className="font-medium text-gray-900 dark:text-white print:text-black">
//                         {getMonthName(data.month)} {data.year}
//                       </div>
//                       <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Jours travaillés:</div>
//                       <div className="font-medium text-gray-900 dark:text-white print:text-black">
//                         {data.workedDays}/{data.workDays} jours
//                       </div>
//                       <div className="text-gray-500 dark:text-gray-400 print:text-gray-600">Paiement:</div>
//                       <div className="font-medium text-gray-900 dark:text-white print:text-black uppercase text-xs">
//                         {emp?.paymentMethod?.replace('_', ' ') || 'VIREMENT'}
//                       </div>
//                    </div>
//                 </div>
//              </div>

//              {/* DÉTAIL DES LIGNES */}
//              <div className="p-8 print:p-6">
//                 <button 
//                   onClick={() => setShowItems(!showItems)} 
//                   className="no-print w-full flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
//                 >
//                   <span className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
//                     <FileText size={18} className="text-sky-500" />
//                     Détail du Bulletin ({data.items?.length || 0} lignes)
//                   </span>
//                   {showItems ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
//                 </button>

//                 <AnimatePresence>
//                   {showItems && (
//                     <motion.div 
//                       initial={{ height: 0, opacity: 0 }} 
//                       animate={{ height: 'auto', opacity: 1 }} 
//                       exit={{ height: 0, opacity: 0 }}
//                       className="space-y-6"
//                     >
//                       {/* GAINS */}
//                       {gains.length > 0 && (
//                         <div>
//                           <h4 className="text-xs font-bold uppercase text-emerald-600 dark:text-emerald-400 print:text-emerald-700 mb-3 flex items-center gap-2">
//                             <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
//                             Rémunérations
//                           </h4>
//                           <div className="space-y-2">
//                             {gains.map((item: any) => (
//                               <div 
//                                 key={item.id} 
//                                 className="flex justify-between items-center p-3 bg-emerald-50/50 dark:bg-emerald-900/10 print:bg-emerald-50 rounded-lg border border-emerald-100 dark:border-emerald-900/30 print:border-emerald-200"
//                               >
//                                 <div>
//                                   <p className="font-bold text-sm text-gray-900 dark:text-white print:text-black">
//                                     {item.label}
//                                   </p>
//                                   {item.base && item.rate && (
//                                     <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
//                                       {formatMoney(item.base)} × {(item.rate * 100).toFixed(0)}%
//                                     </p>
//                                   )}
//                                 </div>
//                                 <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 print:text-emerald-700">
//                                   +{formatMoney(item.amount)} F
//                                 </span>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* DÉDUCTIONS */}
//                       {deductions.length > 0 && (
//                         <div>
//                           <h4 className="text-xs font-bold uppercase text-red-600 dark:text-red-400 print:text-red-700 mb-3 flex items-center gap-2">
//                             <div className="w-2 h-2 bg-red-500 rounded-full"></div>
//                             Retenues
//                           </h4>
//                           <div className="space-y-2">
//                             {deductions.map((item: any) => (
//                               <div 
//                                 key={item.id} 
//                                 className="flex justify-between items-center p-3 bg-red-50/50 dark:bg-red-900/10 print:bg-red-50 rounded-lg border border-red-100 dark:border-red-900/30 print:border-red-200"
//                               >
//                                 <div>
//                                   <p className="font-bold text-sm text-gray-900 dark:text-white print:text-black">
//                                     {item.label}
//                                   </p>
//                                   {item.base && item.rate && (
//                                     <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600">
//                                       {formatMoney(item.base)} × {(item.rate * 100).toFixed(0)}%
//                                     </p>
//                                   )}
//                                 </div>
//                                 <span className="font-mono font-bold text-red-600 dark:text-red-400 print:text-red-700">
//                                   -{formatMoney(item.amount)} F
//                                 </span>
//                               </div>
//                             ))}
//                           </div>
//                         </div>
//                       )}

//                       {/* TOTAL */}
//                       <div className="pt-6 border-t-2 border-dashed border-gray-200 dark:border-gray-700 print:border-gray-400">
//                         <div className="flex justify-between items-end p-6 bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black print:from-white print:to-gray-50 print:border-2 print:border-gray-900 rounded-2xl">
//                           <span className="text-sm font-bold text-gray-300 dark:text-gray-400 print:text-gray-900 uppercase tracking-widest">
//                             Net à Payer
//                           </span>
//                           <span className="text-4xl font-extrabold text-white dark:text-white print:text-black font-mono tracking-tight">
//                             {formatMoney(data.netSalary)} <span className="text-lg text-gray-400 dark:text-gray-500 print:text-gray-600 font-normal">FCFA</span>
//                           </span>
//                         </div>
//                       </div>
//                     </motion.div>
//                   )}
//                 </AnimatePresence>
                
//                 <div className="mt-12 text-xs text-gray-400 dark:text-gray-500 print:text-gray-500 flex justify-between items-end border-t border-gray-100 dark:border-gray-800 print:border-gray-300 pt-6">
//                     <div>
//                         <p className="mb-1">Généré le {new Date().toLocaleDateString('fr-FR')}</p>
//                         <p>Document certifié conforme.</p>
//                     </div>
                    
//                     <div className="flex items-center gap-2 opacity-60 print:opacity-100">
//                         <Hexagon size={16} className="text-gray-400 dark:text-gray-600 print:text-gray-600" />
//                         <span className="font-bold text-gray-500 dark:text-gray-600 print:text-gray-600 tracking-wide uppercase">
//                           Propulsé par HRCongo
//                         </span>
//                     </div>
//                 </div>
//              </div>
//           </div>

//           {/* SIDEBAR INFO */}
//           <div className="space-y-6 no-print">
//             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
//                <button 
//                  onClick={() => setShowEmployer(!showEmployer)} 
//                  className="w-full flex items-center justify-between p-4 font-bold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
//                >
//                   <span className="flex items-center gap-2">
//                     <Info size={18} className="text-sky-500" />
//                     Coût Employeur
//                   </span>
//                   {showEmployer ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
//                </button>
//                <AnimatePresence>
//                   {showEmployer && (
//                      <motion.div 
//                        initial={{ height: 0 }} 
//                        animate={{ height: 'auto' }} 
//                        exit={{ height: 0 }}
//                        className="bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700"
//                      >
//                         <div className="p-4 space-y-3 text-sm">
//                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
//                               <span>Salaire Brut</span>
//                               <span className="font-mono font-bold">{formatMoney(data.grossSalary)}</span>
//                            </div>
//                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
//                               <span>CNSS Patronale (16%)</span>
//                               <span className="font-mono font-bold text-red-500">+{formatMoney(data.cnssEmployer)}</span>
//                            </div>
//                            <div className="flex justify-between font-bold pt-2 border-t border-gray-200 dark:border-gray-700 mt-2 text-gray-900 dark:text-white">
//                               <span>Coût Total Employeur</span>
//                               <span className="font-mono">{formatMoney(data.totalEmployerCost)} F</span>
//                            </div>
//                         </div>
//                      </motion.div>
//                   )}
//                </AnimatePresence>
//             </div>

//             <div className="bg-gradient-to-br from-sky-50 to-emerald-50 dark:from-sky-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-sky-200 dark:border-sky-800">
//               <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
//                 <FileText size={18} className="text-sky-500" />
//                 Informations Légales
//               </h3>
//               <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
//                 <p>• Conforme au Code du Travail congolais</p>
//                 <p>• CNSS: 4% (salarié) / 16% (employeur)</p>
//                 <p>• Plafond CNSS: 1,200,000 FCFA</p>
//                 <p>• ITS selon barème progressif CEMAC</p>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* CONFIRM MODAL */}
//         <AnimatePresence>
//           {showConfirm && (
//               <motion.div 
//                   initial={{ opacity: 0 }} 
//                   animate={{ opacity: 1 }} 
//                   exit={{ opacity: 0 }}
//                   className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 no-print"
//               >
//                   <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
//                       <div className="flex flex-col items-center text-center">
//                           <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
//                             showConfirm.action === 'validate' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500' :
//                             showConfirm.action === 'pay' ? 'bg-sky-100 dark:bg-sky-900/30 text-sky-500' : 
//                             'bg-red-100 dark:bg-red-900/30 text-red-500'
//                           }`}>
//                             <AlertCircle size={32} />
//                           </div>
//                           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
//                             {showConfirm.action === 'validate' ? 'Valider le bulletin ?' : 
//                              showConfirm.action === 'pay' ? 'Confirmer le paiement ?' : 'Annuler ce bulletin ?'}
//                           </h3>
//                           <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">
//                             {showConfirm.action === 'validate' ? 'Le bulletin ne pourra plus être modifié.' :
//                              showConfirm.action === 'pay' ? 'Cette action marquera le bulletin comme payé.' : 
//                              'Le bulletin sera invalidé définitivement.'}
//                           </p>
                          
//                           <div className="flex gap-3 w-full">
//                               <button 
//                                 onClick={() => setShowConfirm(null)} 
//                                 className="flex-1 py-3 border border-gray-200 dark:border-gray-700 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
//                               >
//                                 Retour
//                               </button>
//                               <button 
//                                 onClick={handleAction} 
//                                 disabled={isUpdating} 
//                                 className={`flex-1 py-3 text-white font-bold rounded-xl flex justify-center items-center gap-2 transition-all ${
//                                   showConfirm.action === 'validate' ? 'bg-emerald-500 hover:bg-emerald-600' :
//                                   showConfirm.action === 'pay' ? 'bg-sky-500 hover:bg-sky-600' : 
//                                   'bg-red-500 hover:bg-red-600'
//                                 }`}
//                               >
//                                   {isUpdating ? <Loader2 className="animate-spin" size={20}/> : 'Confirmer'}
//                               </button>
//                           </div>
//                       </div>
//                   </div>
//               </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     </>
//   );
// }