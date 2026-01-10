// // ============================================================================
// // 📄 2. app/documents/page.tsx (SANS ERREURS)
// // ============================================================================

// 'use client';

// import React, { useState, useEffect } from 'react';
// import { 
//   FileText, Plus, Download, Loader2, Lock, 
//   Calendar, User, ExternalLink, File,
//   GraduationCap, DollarSign, Award, FileCheck,
//   Paperclip, Receipt, Folder
// } from 'lucide-react';
// import { UploadDocumentModal } from '@/components/documents/UploadDocumentModal';
// import { api } from '@/services/api';

// export default function DocumentsPage() {
//   const [documents, setDocuments] = useState<any[]>([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [userRole, setUserRole] = useState<string>('');
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   useEffect(() => {
//     fetchDocuments();
//   }, []);

//   const fetchDocuments = async () => {
//     const storedUser = localStorage.getItem('user');
//     if (storedUser) setUserRole(JSON.parse(storedUser).role);

//     setIsLoading(true);
//     try {
//       const data = await api.get<any[]>('/documents');
//       setDocuments(data);
//     } catch (e) {
//       console.error('Erreur chargement documents:', e);
//       setDocuments([]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleDownload = (doc: any) => {
//     window.open(doc.fileUrl, '_blank');
//   };

//   const getDocumentIcon = (type: string) => {
//     const iconMap: Record<string, { Icon: any; color: string }> = {
//       contrat_cdi: { Icon: File, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
//       contrat_cdd: { Icon: File, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
//       contrat_stage: { Icon: GraduationCap, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
//       bulletin_paie: { Icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
//       certificat_travail: { Icon: Award, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
//       attestation_employeur: { Icon: FileCheck, color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30' },
//       avenant: { Icon: Paperclip, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' },
//       solde_tout_compte: { Icon: Receipt, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
//       autre: { Icon: Folder, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' }
//     };
//     return iconMap[type] || { Icon: FileText, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' };
//   };

//   const formatFileSize = (bytes: number) => {
//     if (!bytes) return 'N/A';
//     return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
//   };

//   const formatDate = (dateString: string) => {
//     return new Date(dateString).toLocaleDateString('fr-FR', {
//       day: '2-digit',
//       month: 'short',
//       year: 'numeric'
//     });
//   };

//   const isAdminOrRH = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);

//   return (
//     <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
//             {isAdminOrRH ? 'Gestion Documentaire' : 'Mes Documents'}
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1">
//             {isAdminOrRH 
//               ? 'Gérez les documents administratifs de vos employés' 
//               : 'Consultez vos bulletins de paie et contrats'}
//           </p>
//         </div>

//         {isAdminOrRH && (
//           <button
//             onClick={() => setIsModalOpen(true)}
//             className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-105"
//           >
//             <Plus size={20} strokeWidth={2.5} />
//             Nouveau Document
//           </button>
//         )}
//       </div>

//       {isLoading ? (
//         <div className="flex justify-center py-20">
//           <Loader2 className="animate-spin text-sky-500" size={48} />
//         </div>
//       ) : documents.length === 0 ? (
//         <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
//           <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
//             <FileText size={40} className="text-gray-400" />
//           </div>
//           <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
//             Aucun document
//           </h3>
//           <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
//             {isAdminOrRH
//               ? "Commencez par uploader un contrat, un bulletin de paie ou une attestation."
//               : "Vous n'avez aucun document disponible pour le moment."}
//           </p>
//           {isAdminOrRH && (
//             <button
//               onClick={() => setIsModalOpen(true)}
//               className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
//             >
//               <Plus size={20} />
//               Ajouter un document
//             </button>
//           )}
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//           {documents.map((doc) => {
//             const { Icon, color } = getDocumentIcon(doc.type);
            
//             return (
//               <div
//                 key={doc.id}
//                 className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
//               >
//                 <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
//                   <div className="flex items-start justify-between mb-3">
//                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
//                       <Icon size={24} />
//                     </div>
//                     <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
//                       <Lock size={12} />
//                       <span>Sécurisé</span>
//                     </div>
//                   </div>
//                   <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-2" title={doc.name}>
//                     {doc.name}
//                   </h3>
//                 </div>

//                 <div className="p-5 space-y-3">
//                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
//                     <User size={14} />
//                     <span className="truncate">{doc.employee?.firstName} {doc.employee?.lastName}</span>
//                   </div>
//                   <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
//                     <Calendar size={14} />
//                     <span>{formatDate(doc.createdAt)}</span>
//                   </div>
//                   {doc.fileSize && (
//                     <div className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</div>
//                   )}
//                 </div>

//                 <div className="p-5 pt-0">
//                   <button
//                     onClick={() => handleDownload(doc)}
//                     className="w-full py-2.5 border-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center justify-center gap-2 group-hover:scale-105"
//                   >
//                     <Download size={16} />
//                     Télécharger
//                     <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
//                   </button>
//                 </div>
//               </div>
//             );
//           })}
//         </div>
//       )}

//       <UploadDocumentModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSuccess={() => {
//           fetchDocuments();
//           setIsModalOpen(false);
//         }}
//       />
//     </div>
//   );
// }
'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, Plus, Download, Loader2, Lock, 
  Calendar, User, ExternalLink, File,
  GraduationCap, DollarSign, Award, FileCheck,
  Paperclip, Receipt, Folder
} from 'lucide-react';
import { UploadDocumentModal } from '@/components/documents/UploadDocumentModal';
import { api } from '@/services/api';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUserRole(JSON.parse(storedUser).role);

    setIsLoading(true);
    try {
      const data = await api.get<any[]>('/documents');
      setDocuments(data);
    } catch (e) {
      console.error('Erreur chargement documents:', e);
      setDocuments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 🔑 TÉLÉCHARGEMENT AVEC URL SIGNÉE
  const handleDownload = async (doc: any) => {
    setDownloadingId(doc.id);
    
    try {
      console.log('🔑 Demande URL signée pour:', doc.name);
      
      // 1️⃣ Demander une URL signée au backend
      const response = await api.get<{ url: string; fileName: string }>(
        `/documents/${doc.id}/download`
      );

      console.log('✅ URL signée reçue (valide 1h)');

      // 2️⃣ Ouvrir l'URL signée dans un nouvel onglet
      window.open(response.url, '_blank');
      
    } catch (error: any) {
      console.error('❌ Erreur téléchargement:', error);
      alert('Erreur lors du téléchargement du document');
    } finally {
      setDownloadingId(null);
    }
  };

  const getDocumentIcon = (type: string) => {
    const iconMap: Record<string, { Icon: any; color: string }> = {
      contrat_cdi: { Icon: File, color: 'text-indigo-600 bg-indigo-100 dark:bg-indigo-900/30' },
      contrat_cdd: { Icon: File, color: 'text-violet-600 bg-violet-100 dark:bg-violet-900/30' },
      contrat_stage: { Icon: GraduationCap, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
      bulletin_paie: { Icon: DollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30' },
      certificat_travail: { Icon: Award, color: 'text-amber-600 bg-amber-100 dark:bg-amber-900/30' },
      attestation_employeur: { Icon: FileCheck, color: 'text-sky-600 bg-sky-100 dark:bg-sky-900/30' },
      avenant: { Icon: Paperclip, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' },
      solde_tout_compte: { Icon: Receipt, color: 'text-rose-600 bg-rose-100 dark:bg-rose-900/30' },
      autre: { Icon: Folder, color: 'text-slate-600 bg-slate-100 dark:bg-slate-700' }
    };
    return iconMap[type] || { Icon: FileText, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700' };
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isAdminOrRH = ['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(userRole);

  return (
    <div className="max-w-[1600px] mx-auto pb-20 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isAdminOrRH ? 'Gestion Documentaire' : 'Mes Documents'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {isAdminOrRH 
              ? 'Gérez les documents administratifs de vos employés' 
              : 'Consultez vos bulletins de paie et contrats'}
          </p>
        </div>

        {isAdminOrRH && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all hover:scale-105"
          >
            <Plus size={20} strokeWidth={2.5} />
            Nouveau Document
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-sky-500" size={48} />
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-12 text-center">
          <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
            Aucun document
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {isAdminOrRH
              ? "Commencez par uploader un contrat, un bulletin de paie ou une attestation."
              : "Vous n'avez aucun document disponible pour le moment."}
          </p>
          {isAdminOrRH && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Ajouter un document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {documents.map((doc) => {
            const { Icon, color } = getDocumentIcon(doc.type);
            const isDownloading = downloadingId === doc.id;
            
            return (
              <div
                key={doc.id}
                className="group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${color}`}>
                      <Icon size={24} />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
                      <Lock size={12} />
                      <span className="font-bold">Sécurisé</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight line-clamp-2" title={doc.name}>
                    {doc.name}
                  </h3>
                </div>

                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User size={14} />
                    <span className="truncate">{doc.employee?.firstName} {doc.employee?.lastName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Calendar size={14} />
                    <span>{formatDate(doc.createdAt)}</span>
                  </div>
                  {doc.fileSize && (
                    <div className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</div>
                  )}
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                    className="w-full py-2.5 border-2 border-sky-500 text-sky-600 dark:text-sky-400 font-bold rounded-xl hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all flex items-center justify-center gap-2 group-hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <Download size={16} />
                        Télécharger
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <UploadDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          fetchDocuments();
          setIsModalOpen(false);
        }}
      />
    </div>
  );
}