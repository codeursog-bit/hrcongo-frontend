'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/tablettes/page.tsx
// ✅ Écran ADMIN/HR_MANAGER : gérer les tablettes de pointage (badge/QR) et
//    les identifiants (badges NFC existants + QR codes générés) des employés.
// ✅ Consomme le module backend checkin-devices livré précédemment.
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import {
  Tablet, Plus, Trash2, Loader2, Copy, Check, QrCode,
  Search, ShieldAlert, Radio, Download, X, Camera, CameraOff,
} from 'lucide-react';
import { api } from '@/services/api';
import { useNotification } from '@/components/providers/NotificationProvider';
import PresenceSubNav from '@/components/PresenceSubNav';
import { useBasePath } from '@/hooks/useBasePath';

const BADGE_SCAN_REGION_ID = 'admin-badge-scan-region';
// Mêmes formats que la tablette : QR codes ET codes-barres classiques
// (cartes d'accès, badges professionnels déjà imprimés).
const BADGE_SCAN_CONFIG = {
  fps: 8,
  qrbox: { width: 240, height: 160 },
  formatsToSupport: [
    Html5QrcodeSupportedFormats.QR_CODE,
    Html5QrcodeSupportedFormats.CODE_128,
    Html5QrcodeSupportedFormats.CODE_39,
    Html5QrcodeSupportedFormats.EAN_13,
    Html5QrcodeSupportedFormats.EAN_8,
    Html5QrcodeSupportedFormats.ITF,
    Html5QrcodeSupportedFormats.CODABAR,
  ],
};

// ── Types ────────────────────────────────────────────────────────────────
interface CurrentUser {
  id: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface KioskDevice {
  id: string;
  name: string;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  midDayStartHour: number | null;
  midDayEndHour: number | null;
  _count?: { additionalCompanies: number };
}

interface AdditionalCompanyLink {
  id: string;
  companyId: string;
  company: { tradeName: string | null; legalName: string };
  actingUserId: string;
  actingUser: { firstName: string; lastName: string };
}

interface PortfolioCompany {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  position?: string;
}

interface Credential {
  id: string;
  type: 'NFC_BADGE' | 'QR_CODE';
  identifier: string;
  isActive: boolean;
  createdAt: string;
  employee: { id: string; firstName: string; lastName: string };
}

export default function TablettesPage() {
  const { bp } = useBasePath();
  const router = useRouter();
  const { addNotification } = useNotification();

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // ── Formulaire nouvelle tablette ──────────────────────────────────────
  const [showDeviceForm, setShowDeviceForm] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [midDayStart, setMidDayStart] = useState('');
  const [midDayEnd, setMidDayEnd] = useState('');
  const [creatingDevice, setCreatingDevice] = useState(false);
  const [revealedKey, setRevealedKey] = useState<{ name: string; apiKey: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // ── Édition de la pause déjeuner d'une tablette existante ──────────────
  const [editingMidDay, setEditingMidDay] = useState<string | null>(null);
  const [editMidDayStart, setEditMidDayStart] = useState('');
  const [editMidDayEnd, setEditMidDayEnd] = useState('');
  const [savingMidDay, setSavingMidDay] = useState(false);

  // ── Partage d'une tablette entre plusieurs entreprises ─────────────────
  const [portfolioCompanies, setPortfolioCompanies] = useState<PortfolioCompany[]>([]);
  const [expandedSharing, setExpandedSharing] = useState<string | null>(null);
  const [sharingLinks, setSharingLinks] = useState<Record<string, AdditionalCompanyLink[]>>({});
  const [newShareCompanyId, setNewShareCompanyId] = useState('');
  const [newShareActingUserId, setNewShareActingUserId] = useState('');
  const [shareCompanyAdmins, setShareCompanyAdmins] = useState<{ id: string; firstName: string; lastName: string; role: string }[]>([]);
  const [loadingShareAdmins, setLoadingShareAdmins] = useState(false);
  const [savingShare, setSavingShare] = useState(false);

  // ── Bloc badges/QR ──────────────────────────────────────────────────
  const [employeeQuery, setEmployeeQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [generatingQr, setGeneratingQr] = useState(false);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [badgeIdentifier, setBadgeIdentifier] = useState('');
  const [registeringBadge, setRegisteringBadge] = useState(false);
  const [scanningBadge, setScanningBadge] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<string | null>(null);
  const badgeScannerRef = useRef<Html5Qrcode | null>(null);

  // ── Chargement initial ────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const stored = localStorage.getItem('user');
        if (!stored) { router.push(bp('/login')); return; }
        const user: CurrentUser = JSON.parse(stored);
        setCurrentUser(user);

        if (!['ADMIN', 'SUPER_ADMIN', 'HR_MANAGER'].includes(user.role)) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }
        setIsAuthorized(true);
        await Promise.all([loadDevices(), loadCredentials(), loadEmployees(), loadPortfolio()]);
      } catch {
        setIsAuthorized(false);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDevices = useCallback(async () => {
    try {
      const data = await api.get<KioskDevice[]>('/checkin-devices/devices');
      setDevices(data);
    } catch { /* silencieux — la section restera vide */ }
  }, []);

  const loadCredentials = useCallback(async () => {
    try {
      const data = await api.get<Credential[]>('/checkin-devices/credentials');
      setCredentials(data);
    } catch { /* idem */ }
  }, []);

  const loadEmployees = useCallback(async () => {
    try {
      const data = await api.get<Employee[]>('/attendance/employees-for-manual');
      setEmployees(data);
    } catch { /* idem */ }
  }, []);

  // Le portefeuille de l'admin — n'affiche des sociétés QUE s'il en gère
  // plusieurs (route déjà existante ailleurs dans l'app pour /portefeuille).
  const loadPortfolio = useCallback(async () => {
    try {
      const data = await api.get<PortfolioCompany[]>('/auth/my-companies');
      setPortfolioCompanies(data);
    } catch {
      setPortfolioCompanies([]); // pas de portefeuille → section masquée, sans casser la page
    }
  }, []);

  const loadSharingLinks = async (deviceId: string) => {
    try {
      const data = await api.get<AdditionalCompanyLink[]>(`/checkin-devices/devices/${deviceId}/companies`);
      setSharingLinks((prev) => ({ ...prev, [deviceId]: data }));
    } catch {
      setSharingLinks((prev) => ({ ...prev, [deviceId]: [] }));
    }
  };

  const toggleSharingPanel = (deviceId: string) => {
    if (expandedSharing === deviceId) {
      setExpandedSharing(null);
      return;
    }
    setExpandedSharing(deviceId);
    setNewShareCompanyId('');
    setNewShareActingUserId('');
    setShareCompanyAdmins([]);
    if (!sharingLinks[deviceId]) loadSharingLinks(deviceId);
  };

  // Dès qu'une entreprise est choisie dans le premier menu, on va chercher
  // ses admins/RH éligibles pour remplir le second menu (par nom, jamais par ID).
  const handleShareCompanyChange = async (companyId: string) => {
    setNewShareCompanyId(companyId);
    setNewShareActingUserId('');
    setShareCompanyAdmins([]);
    if (!companyId) return;
    setLoadingShareAdmins(true);
    try {
      const admins = await api.get<{ id: string; firstName: string; lastName: string; role: string }[]>(
        `/checkin-devices/company-admins?companyId=${companyId}`,
      );
      setShareCompanyAdmins(admins);
    } catch {
      setShareCompanyAdmins([]);
    } finally {
      setLoadingShareAdmins(false);
    }
  };

  const addSharedCompany = async (deviceId: string) => {
    if (!newShareCompanyId || !newShareActingUserId) return;
    setSavingShare(true);
    try {
      await api.post(`/checkin-devices/devices/${deviceId}/companies`, {
        companyId: newShareCompanyId,
        actingUserId: newShareActingUserId,
      });
      addNotification({ type: 'SUCCESS', title: 'Entreprise ajoutée', message: 'Cette tablette peut désormais servir cette société aussi.' });
      setNewShareCompanyId('');
      setNewShareActingUserId('');
      setShareCompanyAdmins([]);
      await loadSharingLinks(deviceId);
      await loadDevices();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || "Impossible d'ajouter cette entreprise." });
    } finally {
      setSavingShare(false);
    }
  };

  const removeSharedCompany = async (deviceId: string, linkId: string) => {
    try {
      await api.delete(`/checkin-devices/devices/${deviceId}/companies/${linkId}`);
      await loadSharingLinks(deviceId);
      await loadDevices();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Suppression impossible.' });
    }
  };

  // ── Créer une tablette ─────────────────────────────────────────────────
  const handleCreateDevice = async () => {
    if (!deviceName.trim() || !currentUser) return;
    setCreatingDevice(true);
    try {
      const result = await api.post<{ id: string; name: string; apiKey: string }>(
        '/checkin-devices/devices',
        {
          name: deviceName.trim(),
          actingUserId: currentUser.id,
          midDayStartHour: midDayStart ? parseInt(midDayStart, 10) : undefined,
          midDayEndHour: midDayEnd ? parseInt(midDayEnd, 10) : undefined,
        },
      );
      setRevealedKey({ name: result.name, apiKey: result.apiKey });
      setDeviceName('');
      setMidDayStart('');
      setMidDayEnd('');
      setShowDeviceForm(false);
      await loadDevices();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Création impossible.' });
    } finally {
      setCreatingDevice(false);
    }
  };

  const handleDeleteDevice = async (id: string, name: string) => {
    if (!window.confirm(`Supprimer définitivement la tablette "${name}" ? Cette action est irréversible.`)) return;
    try {
      await api.delete(`/checkin-devices/devices/${id}`);
      addNotification({ type: 'SUCCESS', title: 'Tablette supprimée', message: 'Elle a été retirée définitivement.' });
      await loadDevices();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Suppression impossible.' });
    }
  };

  const openMidDayEdit = (device: KioskDevice) => {
    setEditingMidDay(device.id);
    setEditMidDayStart(device.midDayStartHour != null ? String(device.midDayStartHour) : '');
    setEditMidDayEnd(device.midDayEndHour != null ? String(device.midDayEndHour) : '');
  };

  const saveMidDayEdit = async (id: string) => {
    setSavingMidDay(true);
    try {
      await api.post(`/checkin-devices/devices/${id}/midday`, {
        midDayStartHour: editMidDayStart ? parseInt(editMidDayStart, 10) : null,
        midDayEndHour: editMidDayEnd ? parseInt(editMidDayEnd, 10) : null,
      });
      addNotification({ type: 'SUCCESS', title: 'Pause déjeuner mise à jour', message: 'La tablette appliquera ce nouveau créneau au prochain rafraîchissement.' });
      setEditingMidDay(null);
      await loadDevices();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Mise à jour impossible.' });
    } finally {
      setSavingMidDay(false);
    }
  };

  // ── QR code employé ────────────────────────────────────────────────────
  const handleGenerateQr = async (employee: Employee) => {
    setSelectedEmployee(employee);
    setQrImage(null);
    setGeneratingQr(true);
    try {
      const result = await api.get<{ identifier: string; qrImageDataUrl: string }>(
        `/checkin-devices/credentials/${employee.id}/qrcode`,
      );
      setQrImage(result.qrImageDataUrl);
      await loadCredentials();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Génération du QR impossible.' });
    } finally {
      setGeneratingQr(false);
    }
  };

  // ── Scanner un badge avec la caméra de CET ordinateur/téléphone ────────
  // Pas besoin d'avoir déjà une tablette configurée : n'importe quel
  // appareil avec une caméra (webcam, portable) peut lire un badge une
  // fois, pour récupérer son identifiant machine et l'associer ici.
  const startBadgeScan = async () => {
    setScanFeedback(null);
    setScanningBadge(true);
    // Laisse le temps au <div> de s'afficher avant d'y attacher la caméra.
    setTimeout(async () => {
      try {
        const scanner = new Html5Qrcode(BADGE_SCAN_REGION_ID, { verbose: false });
        badgeScannerRef.current = scanner;
        await scanner.start(
          { facingMode: 'environment' },
          BADGE_SCAN_CONFIG,
          (decodedText) => {
            setBadgeIdentifier(decodedText.trim());
            setScanFeedback(`Code lu : ${decodedText.trim()} — vérifie puis clique "Associer".`);
            stopBadgeScan();
          },
          () => {},
        );
      } catch {
        setScanFeedback("Caméra indisponible ou permission refusée sur cet appareil.");
        setScanningBadge(false);
      }
    }, 50);
  };

  const stopBadgeScan = () => {
    const scanner = badgeScannerRef.current;
    badgeScannerRef.current = null;
    setScanningBadge(false);
    if (scanner) {
      scanner.stop().catch(() => {}).finally(() => scanner.clear());
    }
  };

  // Coupe proprement la caméra si l'admin change d'employé ou quitte la page
  // pendant qu'un scan est en cours.
  useEffect(() => {
    return () => {
      badgeScannerRef.current?.stop().catch(() => {});
    };
  }, []);
  const handleRegisterBadge = async () => {
    if (!selectedEmployee || !badgeIdentifier.trim()) return;
    setRegisteringBadge(true);
    try {
      await api.post('/checkin-devices/credentials', {
        employeeId: selectedEmployee.id,
        type: 'NFC_BADGE',
        identifier: badgeIdentifier.trim(),
      });
      addNotification({ type: 'SUCCESS', title: 'Badge associé', message: `Le badge est maintenant lié à ${selectedEmployee.firstName}.` });
      setBadgeIdentifier('');
      setScanFeedback(null);
      await loadCredentials();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Association impossible.' });
    } finally {
      setRegisteringBadge(false);
    }
  };

  const handleDeleteCredential = async (id: string, employeeName: string) => {
    if (!window.confirm(`Supprimer définitivement ce badge/QR de ${employeeName} ?`)) return;
    try {
      await api.delete(`/checkin-devices/credentials/${id}`);
      addNotification({ type: 'SUCCESS', title: 'Identifiant supprimé', message: 'Ce badge/QR a été retiré définitivement.' });
      await loadCredentials();
    } catch (e: any) {
      addNotification({ type: 'ALERT', title: 'Erreur', message: e.message || 'Suppression impossible.' });
    }
  };

  const copyKey = async () => {
    if (!revealedKey) return;
    await navigator.clipboard.writeText(revealedKey.apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredEmployees = employees.filter((e) =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber}`.toLowerCase().includes(employeeQuery.toLowerCase()),
  );

  // ── États de garde ─────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert size={40} className="text-red-500 mb-4" />
        <h2 className="text-lg font-bold text-[var(--text)]">Accès réservé</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Seuls les administrateurs et responsables RH peuvent gérer les tablettes de pointage.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <PresenceSubNav userRole={currentUser?.role || ''} />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)] flex items-center gap-2">
            <Tablet size={20} className="text-emerald-500" /> Tablettes de pointage
          </h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Badge NFC ou QR code — sans matériel dédié, juste une tablette ou un vieux téléphone Android.
          </p>
        </div>
      </div>

      {/* ══════════════════════ TABLETTES ══════════════════════ */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)]">
            Vos tablettes
          </h2>
          <button
            onClick={() => setShowDeviceForm((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 transition-colors"
          >
            <Plus size={14} /> Nouvelle tablette
          </button>
        </div>

        {showDeviceForm && (
          <div className="bg-[var(--surface-2)] rounded-xl p-4 mb-4 border border-[var(--border)]">
            <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
              Nom de la tablette
            </label>
            <div className="flex gap-2">
              <input
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="Ex : Accueil Brazzaville"
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleCreateDevice}
                disabled={creatingDevice || !deviceName.trim()}
                className="px-4 py-2 rounded-lg bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
              >
                {creatingDevice && <Loader2 size={14} className="animate-spin" />} Créer
              </button>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] mt-2">
              Les pointages faits par cette tablette seront enregistrés au nom de{' '}
              <span className="font-semibold">{currentUser?.firstName} {currentUser?.lastName} (vous)</span>.
            </p>

            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 block">
                Pause déjeuner (facultatif) — sinon la tablette reste au repos entre les arrivées et les départs
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number" min={0} max={23}
                  value={midDayStart}
                  onChange={(e) => setMidDayStart(e.target.value)}
                  placeholder="12"
                  className="w-20 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-emerald-500/50"
                />
                <span className="text-xs text-[var(--text-muted)]">à</span>
                <input
                  type="number" min={0} max={23}
                  value={midDayEnd}
                  onChange={(e) => setMidDayEnd(e.target.value)}
                  placeholder="14"
                  className="w-20 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-emerald-500/50"
                />
                <span className="text-xs text-[var(--text-muted)]">heures</span>
              </div>
            </div>
          </div>
        )}

        {devices.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)] text-center py-6">Aucune tablette enregistrée pour l'instant.</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => (
              <div key={d.id} className="rounded-xl bg-[var(--surface-2)] border border-[var(--border)] overflow-hidden">
                <div className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${d.isActive ? 'bg-emerald-500/15 text-emerald-500' : 'bg-red-500/15 text-red-500'}`}>
                      <Tablet size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--text)]">{d.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {d.lastSeenAt ? `Vue pour la dernière fois le ${new Date(d.lastSeenAt).toLocaleString('fr-FR')}` : 'Jamais utilisée'}
                        {d.midDayStartHour != null && d.midDayEndHour != null && (
                          <> · Pause {d.midDayStartHour}h-{d.midDayEndHour}h</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {portfolioCompanies.length > 0 && (
                      <button
                        onClick={() => toggleSharingPanel(d.id)}
                        className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors"
                      >
                        Entreprises ({1 + (d._count?.additionalCompanies ?? 0)})
                      </button>
                    )}
                    <button
                      onClick={() => (editingMidDay === d.id ? setEditingMidDay(null) : openMidDayEdit(d))}
                      className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors"
                    >
                      Pause déjeuner
                    </button>
                    <button onClick={() => handleDeleteDevice(d.id, d.name)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {expandedSharing === d.id && (
                  <div className="px-3 pb-3 border-t border-[var(--border)] pt-3">
                    <p className="text-[11px] text-[var(--text-muted)] mb-2">
                      Cette tablette sert aussi ces entreprises — un seul appareil, plusieurs sociétés, chacune avec ses propres règles.
                    </p>
                    <div className="space-y-1.5 mb-3">
                      {(sharingLinks[d.id] ?? []).map((link) => (
                        <div key={link.id} className="flex items-center justify-between p-2 rounded-lg bg-[var(--surface)] border border-[var(--border)]">
                          <div>
                            <p className="text-xs font-bold text-[var(--text)]">{link.company.tradeName || link.company.legalName}</p>
                            <p className="text-[10px] text-[var(--text-muted)]">Porteur : {link.actingUser.firstName} {link.actingUser.lastName}</p>
                          </div>
                          <button onClick={() => removeSharedCompany(d.id, link.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                      {(sharingLinks[d.id] ?? []).length === 0 && (
                        <p className="text-[11px] text-[var(--text-muted)] italic">Aucune entreprise supplémentaire pour l'instant.</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={newShareCompanyId}
                        onChange={(e) => handleShareCompanyChange(e.target.value)}
                        className="px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none"
                      >
                        <option value="">Choisir une entreprise...</option>
                        {portfolioCompanies.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>

                      <select
                        value={newShareActingUserId}
                        onChange={(e) => setNewShareActingUserId(e.target.value)}
                        disabled={!newShareCompanyId || loadingShareAdmins}
                        className="flex-1 min-w-[180px] px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none disabled:opacity-50"
                      >
                        <option value="">
                          {loadingShareAdmins
                            ? 'Chargement...'
                            : !newShareCompanyId
                            ? "Choisis d'abord une entreprise"
                            : shareCompanyAdmins.length === 0
                            ? 'Aucun admin/RH trouvé'
                            : 'Choisir le porteur...'}
                        </option>
                        {shareCompanyAdmins.map((u) => (
                          <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => addSharedCompany(d.id)}
                        disabled={savingShare || !newShareCompanyId || !newShareActingUserId}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5"
                      >
                        {savingShare && <Loader2 size={12} className="animate-spin" />} Ajouter
                      </button>
                    </div>
                    <p className="text-[10px] text-[var(--text-muted)] mt-2">
                      ⚠️ Le porteur doit être un compte RH/admin qui appartient fixement à cette entreprise-là — pas un compte portefeuille qui bascule d'une société à l'autre.
                    </p>
                  </div>
                )}

                {editingMidDay === d.id && (
                  <div className="px-3 pb-3 flex items-center gap-2 flex-wrap">
                    <input
                      type="number" min={0} max={23}
                      value={editMidDayStart}
                      onChange={(e) => setEditMidDayStart(e.target.value)}
                      placeholder="Aucune"
                      className="w-20 px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none focus:border-emerald-500/50"
                    />
                    <span className="text-xs text-[var(--text-muted)]">à</span>
                    <input
                      type="number" min={0} max={23}
                      value={editMidDayEnd}
                      onChange={(e) => setEditMidDayEnd(e.target.value)}
                      placeholder="Aucune"
                      className="w-20 px-2.5 py-1.5 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-xs outline-none focus:border-emerald-500/50"
                    />
                    <button
                      onClick={() => saveMidDayEdit(d.id)}
                      disabled={savingMidDay}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-1.5"
                    >
                      {savingMidDay && <Loader2 size={12} className="animate-spin" />} Enregistrer
                    </button>
                    <span className="text-[10px] text-[var(--text-muted)] w-full">Laisse les deux champs vides pour désactiver la pause sur cette tablette.</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════ BADGES & QR ══════════════════════ */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
        <h2 className="text-sm font-bold uppercase tracking-widest text-[var(--text-muted)] mb-4">
          Badges &amp; QR codes employés
        </h2>

        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={employeeQuery}
            onChange={(e) => setEmployeeQuery(e.target.value)}
            placeholder="Chercher un employé..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {/* ── Liste employés ── */}
          <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
            {filteredEmployees.map((emp) => (
              <button
                key={emp.id}
                onClick={() => { stopBadgeScan(); setScanFeedback(null); setBadgeIdentifier(''); setSelectedEmployee(emp); setQrImage(null); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-colors ${
                  selectedEmployee?.id === emp.id
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-[var(--surface-2)] border-[var(--border)] hover:bg-[var(--border)]'
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-[var(--text)]">{emp.firstName} {emp.lastName}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{emp.employeeNumber} {emp.position ? `· ${emp.position}` : ''}</p>
                </div>
              </button>
            ))}
          </div>

          {/* ── Panneau employé sélectionné ── */}
          <div className="bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-4">
            {!selectedEmployee ? (
              <p className="text-sm text-[var(--text-muted)] text-center py-10">Choisis un employé à gauche.</p>
            ) : (
              <div className="space-y-5">
                <p className="text-sm font-bold text-[var(--text)]">{selectedEmployee.firstName} {selectedEmployee.lastName}</p>

                {/* QR */}
                <div>
                  <button
                    onClick={() => handleGenerateQr(selectedEmployee)}
                    disabled={generatingQr}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 disabled:opacity-50"
                  >
                    {generatingQr ? <Loader2 size={16} className="animate-spin" /> : <QrCode size={16} />}
                    Générer / afficher le QR code
                  </button>
                  {qrImage && (
                    <div className="mt-3 flex flex-col items-center gap-2 bg-white rounded-xl p-3">
                      <img src={qrImage} alt="QR code de pointage" className="w-40 h-40" />
                      <a
                        href={qrImage}
                        download={`qr-${selectedEmployee.firstName}-${selectedEmployee.lastName}.png`}
                        className="flex items-center gap-1.5 text-xs font-bold text-emerald-600"
                      >
                        <Download size={14} /> Télécharger
                      </a>
                    </div>
                  )}
                </div>

                {/* Badge NFC existant */}
                <div>
                  <label className="text-xs font-semibold text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                    <Radio size={13} /> Associer un badge existant
                  </label>

                  {!scanningBadge ? (
                    <button
                      onClick={startBadgeScan}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[var(--surface)] border border-dashed border-[var(--border)] text-[var(--text)] text-sm font-semibold hover:border-emerald-500/50 hover:text-emerald-500 transition-colors mb-2"
                    >
                      <Camera size={15} /> Scanner ce badge avec la caméra
                    </button>
                  ) : (
                    <div className="relative rounded-lg overflow-hidden bg-black mb-2 aspect-video">
                      <div id={BADGE_SCAN_REGION_ID} className="w-full h-full [&_video]:w-full [&_video]:h-full [&_video]:object-cover" />
                      <button
                        onClick={stopBadgeScan}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 text-white hover:bg-black/80"
                      >
                        <CameraOff size={14} />
                      </button>
                    </div>
                  )}

                  {scanFeedback && (
                    <p className="text-[11px] text-emerald-500 mb-2">{scanFeedback}</p>
                  )}

                  <div className="flex gap-2">
                    <input
                      value={badgeIdentifier}
                      onChange={(e) => setBadgeIdentifier(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && badgeIdentifier.trim()) handleRegisterBadge(); }}
                      placeholder="Ou pose le badge sur un lecteur RFID USB / saisis à la main"
                      className="flex-1 px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm outline-none focus:border-emerald-500/50"
                    />
                    <button
                      onClick={handleRegisterBadge}
                      disabled={registeringBadge || !badgeIdentifier.trim()}
                      className="px-3 py-2 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] text-sm font-bold hover:bg-[var(--border)] disabled:opacity-50"
                    >
                      {registeringBadge ? <Loader2 size={14} className="animate-spin" /> : 'Associer'}
                    </button>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                    Fonctionne avec un QR code, un code-barres imprimé, un lecteur RFID USB (le champ se remplit tout seul), ou une saisie manuelle du numéro inscrit sur le badge.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Table des identifiants existants ── */}
        {credentials.length > 0 && (
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
              Identifiants actifs
            </h3>
            <div className="space-y-1.5">
              {credentials.map((c) => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)]">
                  <div className="flex items-center gap-3">
                    {c.type === 'NFC_BADGE' ? <Radio size={15} className="text-sky-500" /> : <QrCode size={15} className="text-emerald-500" />}
                    <div>
                      <p className="text-sm font-bold text-[var(--text)]">{c.employee.firstName} {c.employee.lastName}</p>
                      <p className="text-[11px] text-[var(--text-muted)] font-mono">{c.identifier.slice(0, 18)}...</p>
                    </div>
                  </div>
                  <button onClick={() => handleDeleteCredential(c.id, `${c.employee.firstName} ${c.employee.lastName}`)} className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════ MODALE CLÉ API (une seule fois) ══════════════════════ */}
      {revealedKey && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-base font-bold text-[var(--text)]">Tablette "{revealedKey.name}" créée</h3>
              <button onClick={() => setRevealedKey(null)}><X size={18} className="text-[var(--text-muted)]" /></button>
            </div>
            <p className="text-xs text-amber-500 font-semibold mb-3">
              ⚠️ Cette clé ne sera plus jamais affichée. Copie-la maintenant et colle-la dans l'écran de configuration de la tablette (/kiosk).
            </p>
            <div className="flex items-center gap-2 bg-[var(--surface-2)] rounded-xl p-3 font-mono text-xs break-all text-[var(--text)]">
              {revealedKey.apiKey}
            </div>
            <button
              onClick={copyKey}
              className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copié !' : 'Copier la clé'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}