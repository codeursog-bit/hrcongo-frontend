'use client';

// ============================================================================
// 📁 app/(dashboard)/presences/ecrans/page.tsx
// ADMIN / RH :
//  1) approuver les écrans QR (saisie du code affiché sur la tablette), choisir
//     la portée (entreprise ou portefeuille), renommer, révoquer ;
//  2) définir / réinitialiser le code secret d'un employé (pointage sans téléphone).
// « Portefeuille » est réservé aux admins multi-entreprises.
// ============================================================================
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  MonitorSmartphone, Plus, Loader2, Trash2, ShieldCheck, Building2, Layers, KeyRound, Search, Pencil, Check, X, RefreshCw, Copy, ExternalLink, Share2,
} from 'lucide-react';
import PresenceSubNav from '@/components/PresenceSubNav';
import { useNotification } from '@/components/providers/NotificationProvider';
import { api } from '@/services/api';
import { adminScreensApi, employeeQrApi, secretError, AdminScreen, ScreenScope, SecretListItem } from '@/services/display-screen-api';

const STATUS_STYLE: Record<string, string> = {
  APPROVED: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  PENDING:  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  REVOKED:  'bg-red-500/15 text-red-600 dark:text-red-400',
};
const STATUS_LABEL: Record<string, string> = { APPROVED: 'Actif', PENDING: 'En attente', REVOKED: 'Révoqué' };
const field = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--brand)]';

interface Emp { id: string; label: string }
const empLabel = (e: any): string =>
  e.fullName || `${e.firstName ?? ''} ${e.lastName ?? ''}`.trim() || e.email || e.id;

export default function EcransPage() {
  const { addNotification } = useNotification();
  const [userRole, setUserRole] = useState('');
  const [isMulti, setIsMulti] = useState(false);

  // ── Écrans ────────────────────────────────────────────────────────────────
  const [screens, setScreens] = useState<AdminScreen[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<ScreenScope>('COMPANY');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // 🆕 Lien public de la page tablette : à copier / ouvrir / partager (personne ne tape /ecran à la main)
  const [publicUrl, setPublicUrl] = useState('/ecran');
  const [copied, setCopied] = useState(false);
  useEffect(() => { setPublicUrl(`${window.location.origin}/ecran`); }, []);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      // Repli (navigateur sans accès au presse-papiers, page non sécurisée…)
      const ta = document.createElement('textarea');
      ta.value = publicUrl;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* rien de plus à tenter */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const shareLink = async () => {
    try { await (navigator as any).share({ title: 'Écran de pointage Konza RH', url: publicUrl }); } catch { /* annulé */ }
  };

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      setUserRole(u.role || ''); setIsMulti(!!u.manageMultipleCompanies);
    } catch { /* noop */ }
  }, []);

  const notifyError = useCallback((title: string, e: any, fallback: string) =>
    addNotification({ type: 'ALERT', title, message: e?.message || fallback }), [addNotification]);

  const load = useCallback(async () => {
    try { setScreens(await adminScreensApi.list()); }
    catch (e: any) { notifyError('Erreur', e, 'Chargement impossible.'); }
    finally { setLoading(false); }
  }, [notifyError]);
  useEffect(() => { load(); }, [load]);

  const approve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim().length < 4 || !name.trim()) return;
    setSaving(true);
    try {
      await adminScreensApi.approve({ code: code.trim().toUpperCase(), name: name.trim(), scope });
      addNotification({ type: 'SUCCESS', title: 'Écran approuvé', message: 'La tablette affiche maintenant le QR code.' });
      setCode(''); setName(''); await load();
    } catch (err: any) { notifyError('Approbation impossible', err, 'Code invalide ou expiré.'); }
    finally { setSaving(false); }
  };

  const revoke = async (s: AdminScreen) => {
    if (!confirm(`Révoquer « ${s.name || 'cet écran'} » ? Il cessera d'afficher le QR immédiatement.`)) return;
    try { await adminScreensApi.revoke(s.id); await load(); }
    catch (err: any) { notifyError('Erreur', err, 'Révocation impossible.'); }
  };

  const regenerate = async (s: AdminScreen) => {
    if (!confirm(`Régénérer le QR de « ${s.name || 'cet écran'} » ? Tous les QR déjà affichés ou photographiés deviennent invalides. La tablette se met à jour en moins d'une minute.`)) return;
    try {
      await adminScreensApi.regenerate(s.id);
      addNotification({ type: 'SUCCESS', title: 'QR régénéré', message: "Les anciens QR sont invalides. La tablette affichera le nouveau d'ici une minute." });
    } catch (err: any) { notifyError('Erreur', err, 'Régénération impossible.'); }
  };

  const saveName = async (id: string) => {
    if (!editName.trim()) return;
    try { await adminScreensApi.rename(id, editName.trim()); setEditingId(null); await load(); }
    catch (err: any) { notifyError('Erreur', err, 'Renommage impossible.'); }
  };

  // ── Codes secrets des employés ────────────────────────────────────────────
  const [emps, setEmps] = useState<Emp[]>([]);
  const [search, setSearch] = useState('');
  const [empId, setEmpId] = useState('');
  const [hasSecret, setHasSecret] = useState<boolean | null>(null);
  const [newSecret, setNewSecret] = useState('');
  const [secretSaving, setSecretSaving] = useState(false);
  const [secretErr, setSecretErr] = useState('');

  // Employés qui ONT un code secret (traçabilité : qui n'y figure pas ne peut pas pointer par code)
  const [enrolled, setEnrolled] = useState<SecretListItem[]>([]);
  const [enrolledLoading, setEnrolledLoading] = useState(true);
  const loadEnrolled = useCallback(async () => {
    try { setEnrolled(await employeeQrApi.listSecrets()); }
    catch { setEnrolled([]); }
    finally { setEnrolledLoading(false); }
  }, []);
  useEffect(() => { loadEnrolled(); }, [loadEnrolled]);

  useEffect(() => {
    api.get<any>('/employees/simple')
      .then((r) => { const list = Array.isArray(r) ? r : (r?.employees ?? r?.data ?? []); setEmps(list.map((e: any) => ({ id: e.id, label: empLabel(e) }))); })
      .catch(() => setEmps([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (q ? emps.filter((e) => e.label.toLowerCase().includes(q)) : emps).slice(0, 8);
  }, [emps, search]);

  const pickEmployee = async (e: Emp) => {
    setEmpId(e.id); setSearch(e.label); setNewSecret(''); setSecretErr(''); setHasSecret(null);
    try { setHasSecret((await employeeQrApi.employeeSecret(e.id)).hasSecret); } catch { setHasSecret(null); }
  };

  const saveSecret = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setSecretErr('');
    const weak = secretError(newSecret);
    if (weak) return setSecretErr(weak);
    setSecretSaving(true);
    try {
      await employeeQrApi.setEmployeeSecret(empId, newSecret.trim());
      addNotification({ type: 'SUCCESS', title: 'Code enregistré', message: 'Communiquez-le à l’employé de vive voix, sans l’écrire.' });
      setHasSecret(true); setNewSecret(''); loadEnrolled();
    } catch (err: any) { setSecretErr(err?.message || 'Enregistrement impossible.'); }
    finally { setSecretSaving(false); }
  };

  const removeSecret = async () => {
    if (!confirm('Supprimer le code secret de cet employé ?')) return;
    try { await employeeQrApi.removeEmployeeSecret(empId); setHasSecret(false); loadEnrolled(); }
    catch (err: any) { notifyError('Erreur', err, 'Suppression impossible.'); }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <PresenceSubNav userRole={userRole} />
      <div>
        <h1 className="text-2xl font-extrabold text-[var(--text)] flex items-center gap-2"><MonitorSmartphone /> Écrans QR</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Ouvrez <code className="px-1.5 py-0.5 rounded bg-[var(--surface-2)]">/ecran</code> sur la tablette, puis saisissez ici le code qu&apos;elle affiche.
          Les employés pointent ensuite en scannant le QR depuis « Ma pointeuse ».
        </p>
      </div>

      {/* 🆕 Lien public de l'écran (à ouvrir sur la tablette) */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase text-[var(--text-muted)]">Lien public de l&apos;écran</p>
          <p className="font-mono text-sm text-[var(--text)] truncate mt-0.5" title={publicUrl}>{publicUrl}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">
            À ouvrir sur la tablette (dans son navigateur). Elle affiche un code : saisissez-le ci-dessous pour l&apos;approuver.
            Sans votre approbation, aucun QR ne s&apos;affiche.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={copyLink}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] text-white font-semibold px-4 py-2.5 text-sm">
            {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Lien copié' : 'Copier le lien'}
          </button>
          <a href={publicUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] text-[var(--text)] font-semibold px-4 py-2.5 text-sm hover:bg-[var(--surface-2)]">
            <ExternalLink size={16} /> Ouvrir
          </a>
          {typeof navigator !== 'undefined' && (navigator as any).share && (
            <button type="button" onClick={shareLink} aria-label="Partager le lien"
              className="inline-flex items-center rounded-xl border border-[var(--border)] text-[var(--text)] px-3 py-2.5 hover:bg-[var(--surface-2)]">
              <Share2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Approbation */}
      <form onSubmit={approve} className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] items-end">
        <label className="block text-sm font-semibold text-[var(--text)]">Code de la tablette
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={8} placeholder="K7M2QX"
            className={`${field} mt-1 font-mono tracking-[0.3em] text-lg uppercase`} autoComplete="off" />
        </label>
        <label className="block text-sm font-semibold text-[var(--text)]">Nom de l&apos;écran
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} placeholder="Accueil — Siège" className={`${field} mt-1`} />
        </label>
        <button disabled={saving || code.trim().length < 4 || !name.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-white font-semibold px-6 py-3 disabled:opacity-50">
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />} Approuver
        </button>

        <fieldset className="sm:col-span-3 grid gap-3 sm:grid-cols-2">
          <legend className="text-sm font-semibold text-[var(--text)] mb-2">Qui peut pointer sur cet écran ?</legend>
          {([
            ['COMPANY', 'Cette entreprise uniquement', 'Seuls ses employés peuvent pointer ; les autres reçoivent « Vous ne faites pas partie de cette entreprise ».', Building2, true],
            ['PORTFOLIO', 'Toutes mes entreprises', 'Les employés de chaque entreprise de votre portefeuille peuvent pointer sur cet écran.', Layers, isMulti],
          ] as const).map(([val, title, desc, Icon, enabled]) => (
            <label key={val} className={`flex gap-3 rounded-xl border p-4 transition ${scope === val ? 'border-[var(--brand)]' : 'border-[var(--border)]'} ${enabled ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}>
              <input type="radio" name="scope" className="mt-1" checked={scope === val} disabled={!enabled} onChange={() => setScope(val)} />
              <span>
                <span className="flex items-center gap-2 font-semibold text-[var(--text)]"><Icon size={16} /> {title}</span>
                <span className="block text-xs text-[var(--text-muted)] mt-0.5">{desc}{!enabled && ' (réservé aux admins multi-entreprises)'}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </form>

      {/* Liste */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="px-5 py-3 border-b border-[var(--border)] font-bold text-[var(--text)] flex items-center gap-2"><ShieldCheck size={18} /> Écrans appairés</div>
        {loading ? <div className="p-10 grid place-items-center"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>
          : screens.length === 0 ? <p className="p-8 text-center text-[var(--text-muted)]">Aucun écran pour le moment.</p>
          : <ul className="divide-y divide-[var(--border)]">
              {screens.map((s) => (
                <li key={s.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    {editingId === s.id ? (
                      <div className="flex items-center gap-2">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} maxLength={100} autoFocus
                          className={`${field} py-2`} onKeyDown={(e) => { if (e.key === 'Enter') saveName(s.id); if (e.key === 'Escape') setEditingId(null); }} />
                        <button onClick={() => saveName(s.id)} aria-label="Valider" className="p-2 rounded-lg text-emerald-500 hover:bg-emerald-500/10"><Check size={18} /></button>
                        <button onClick={() => setEditingId(null)} aria-label="Annuler" className="p-2 rounded-lg hover:bg-[var(--surface-2)]"><X size={18} /></button>
                      </div>
                    ) : (
                      <p className="font-semibold text-[var(--text)] truncate">{s.name || 'Sans nom'}</p>
                    )}
                    <p className="text-xs text-[var(--text-muted)]">
                      {s.scope === 'PORTFOLIO' ? 'Portefeuille' : s.companyLabel || 'Entreprise'} ·{' '}
                      {s.lastSeenAt ? `vu ${new Date(s.lastSeenAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}` : 'jamais vu'}
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>{STATUS_LABEL[s.status]}</span>
                  {s.status === 'APPROVED' && editingId !== s.id && (
                    <>
                      <button onClick={() => { setEditingId(s.id); setEditName(s.name || ''); }} aria-label="Renommer" className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"><Pencil size={17} /></button>
                      <button onClick={() => regenerate(s)} aria-label="Régénérer le QR" title="Régénérer le QR" className="p-2 rounded-lg hover:bg-[var(--surface-2)] text-[var(--text-muted)]"><RefreshCw size={17} /></button>
                      <button onClick={() => revoke(s)} aria-label="Révoquer" className="p-2 rounded-lg text-red-500 hover:bg-red-500/10"><Trash2 size={18} /></button>
                    </>
                  )}
                </li>
              ))}
            </ul>}
      </div>

      {/* Codes secrets */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 space-y-4">
        <div>
          <h2 className="font-bold text-[var(--text)] flex items-center gap-2"><KeyRound size={18} /> Code secret d&apos;un employé</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Pour les employés sans smartphone : ils tapent ce code sur la tablette. Seuls l&apos;admin et la RH peuvent le définir ; un employé sans code ne peut pas pointer avec.
            Le code n&apos;est jamais lisible après enregistrement.
          </p>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setEmpId(''); setHasSecret(null); }} placeholder="Rechercher un employé…" className={`${field} pl-11`} />
          {search && !empId && filtered.length > 0 && (
            <ul className="absolute z-10 mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-xl overflow-hidden">
              {filtered.map((e) => (
                <li key={e.id}><button type="button" onClick={() => pickEmployee(e)} className="w-full text-left px-4 py-2.5 hover:bg-[var(--surface-2)] text-[var(--text)]">{e.label}</button></li>
              ))}
            </ul>
          )}
        </div>

        {empId && (
          <form onSubmit={saveSecret} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] items-end">
            <label className="block text-sm font-semibold text-[var(--text)]">
              {hasSecret ? 'Nouveau code (remplace l’actuel)' : 'Code à définir'}
              <input value={newSecret} onChange={(e) => setNewSecret(e.target.value)} maxLength={32} autoComplete="off" spellCheck={false}
                placeholder="Mot (5+ caractères) ou PIN (6 à 10 chiffres)" className={`${field} mt-1`} />
            </label>
            <button disabled={secretSaving || !newSecret}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-white font-semibold px-5 py-3 disabled:opacity-50">
              {secretSaving && <Loader2 className="animate-spin" size={16} />} {hasSecret ? 'Réinitialiser' : 'Définir'}
            </button>
            {hasSecret && (
              <button type="button" onClick={removeSecret} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-500/40 text-red-500 px-4 py-3">
                <Trash2 size={16} /> Supprimer
              </button>
            )}
            <p className="sm:col-span-3 text-xs text-[var(--text-muted)]">
              {hasSecret === null ? 'Vérification…' : hasSecret ? 'Cet employé a déjà un code secret.' : 'Cet employé n’a pas encore de code secret.'}
            </p>
            {secretErr && <p className="sm:col-span-3 text-sm text-red-500" role="alert">{secretErr}</p>}
          </form>
        )}

        {/* Employés enregistrés avec un code secret */}
        <div className="pt-4 border-t border-[var(--border)]">
          <h3 className="text-sm font-bold text-[var(--text)] flex items-center gap-2 mb-3">
            Employés avec un code secret
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">{enrolled.length}</span>
          </h3>
          {enrolledLoading ? (
            <div className="py-6 grid place-items-center"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>
          ) : enrolled.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Aucun employé n&apos;a encore de code secret.</p>
          ) : (
            <ul className="divide-y divide-[var(--border)] rounded-xl border border-[var(--border)] overflow-hidden">
              {enrolled.map((e) => (
                <li key={e.employeeId} className="flex flex-wrap items-center gap-3 px-4 py-3 bg-[var(--bg)]">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--text)] truncate">{e.fullName}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {[e.position, e.department].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  {e.status !== 'ACTIVE' && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600">
                      {e.status === 'ON_LEAVE' ? 'En congé' : e.status === 'SUSPENDED' ? 'Suspendu' : 'Inactif'}
                    </span>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">
                    Défini le {new Date(e.updatedAt).toLocaleDateString('fr-FR')}{e.setByName ? ` par ${e.setByName}` : ''}
                  </p>
                  <button type="button" onClick={() => pickEmployee({ id: e.employeeId, label: e.fullName })}
                    className="text-xs font-semibold text-[var(--brand)] hover:underline">Modifier</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}