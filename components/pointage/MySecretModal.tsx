'use client';

// ============================================================================
// 📁 components/pointage/MySecretModal.tsx
// L'employé choisit lui-même son code secret (mot ou PIN) depuis son espace
// connecté. Il le saisira ensuite sur la tablette (« Mon code secret »).
// Stocké côté serveur sous forme d'empreinte : personne ne peut le relire.
// ============================================================================
import React, { useEffect, useState } from 'react';
import { KeyRound, X, Loader2, Eye, EyeOff, CheckCircle2, Trash2 } from 'lucide-react';
import { employeeQrApi, secretError } from '@/services/display-screen-api';

interface Props { onClose: () => void }

export default function MySecretModal({ onClose }: Props) {
  const [loading, setLoading] = useState(true);
  const [hasSecret, setHasSecret] = useState(false);
  const [secret, setSecret] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    employeeQrApi.mySecret().then((s) => setHasSecret(s.hasSecret)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const weak = secretError(secret);
    if (weak) return setError(weak);
    if (secret.trim() !== confirm.trim()) return setError('Les deux saisies ne sont pas identiques.');
    setSaving(true);
    try {
      await employeeQrApi.setMySecret(secret.trim());
      setSaved(true); setHasSecret(true); setSecret(''); setConfirm('');
    } catch (err: any) { setError(err?.message || 'Enregistrement impossible.'); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (!window.confirm('Supprimer votre code secret ? Vous ne pourrez plus pointer avec lui sur la tablette.')) return;
    try { await employeeQrApi.removeMySecret(); setHasSecret(false); setSaved(false); }
    catch (err: any) { setError(err?.message || 'Suppression impossible.'); }
  };

  const field = 'w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none focus:border-[var(--brand)]';

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 p-0 sm:p-4" role="dialog" aria-modal="true" aria-label="Mon code secret">
      <div className="w-full sm:max-w-md bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl overflow-hidden max-h-[100dvh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2 font-bold"><KeyRound size={18} /> Mon code secret</div>
          <button onClick={onClose} aria-label="Fermer" className="p-2 rounded-full hover:bg-[var(--surface-2)]"><X size={18} /></button>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="py-12 grid place-items-center"><Loader2 className="animate-spin text-[var(--text-muted)]" /></div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                Pour pointer sur la tablette sans téléphone : tapez ce code sur l&apos;écran, il enregistre votre entrée puis votre sortie.
                Choisissez un <b>mot</b> de 5 caractères minimum, ou un <b>PIN</b> de 6 à 10 chiffres. Gardez-le pour vous.
              </p>

              {hasSecret && !saved && (
                <div className="flex items-center justify-between gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600">
                  <span className="flex items-center gap-2"><CheckCircle2 size={16} /> Un code est déjà défini.</span>
                  <button type="button" onClick={remove} className="inline-flex items-center gap-1 text-red-500 font-semibold"><Trash2 size={14} /> Supprimer</button>
                </div>
              )}
              {saved && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 text-sm text-emerald-600">
                  <CheckCircle2 size={16} /> Code enregistré. Vous pouvez l&apos;utiliser sur la tablette.
                </div>
              )}

              <label className="block text-sm font-semibold">{hasSecret ? 'Nouveau code' : 'Votre code'}
                <div className="relative mt-1">
                  <input type={show ? 'text' : 'password'} value={secret} onChange={(e) => setSecret(e.target.value)} maxLength={32}
                    autoComplete="new-password" autoCapitalize="off" spellCheck={false} className={`${field} pr-12`} />
                  <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Masquer' : 'Afficher'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">{show ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                </div>
              </label>
              <label className="block text-sm font-semibold">Confirmez le code
                <input type={show ? 'text' : 'password'} value={confirm} onChange={(e) => setConfirm(e.target.value)} maxLength={32}
                  autoComplete="new-password" autoCapitalize="off" spellCheck={false} className={`${field} mt-1`} />
              </label>

              {error && <p className="text-sm text-red-500" role="alert">{error}</p>}

              <button disabled={saving || !secret || !confirm}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] text-white font-semibold py-3 disabled:opacity-50">
                {saving && <Loader2 className="animate-spin" size={18} />} {hasSecret ? 'Changer mon code' : 'Enregistrer mon code'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}