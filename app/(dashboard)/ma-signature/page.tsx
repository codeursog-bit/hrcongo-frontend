'use client';

// ============================================================================
// 📁 app/(dashboard)/ma-signature/page.tsx — LOT A
// Signature personnelle. L'upload n'est possible que si l'admin a accordé le
// droit de signer (fonction de validation). Sans ce droit : message clair, pas
// de bouton. La signature sera utilisée par les avis et les documents imprimables
// dans les lots suivants ; sans signature personnelle, le cachet entreprise
// continue de s'appliquer comme aujourd'hui.
// ============================================================================

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, PenTool, Trash2, Upload, ShieldCheck, Lock } from 'lucide-react';
import { useAlert } from '@/components/providers/AlertProvider';
import { approvalsApi, MyApprovalContext } from '@/services/approvals';

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function MaSignaturePage() {
  const router = useRouter();
  const alert = useAlert();
  const inputRef = useRef<HTMLInputElement>(null);

  const [ctx, setCtx] = useState<MyApprovalContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const load = async () => {
    try {
      setCtx(await approvalsApi.getMe());
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de charger vos informations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) {
      alert.error('Format non autorisé', 'Acceptés : JPG, PNG, WEBP.');
      return;
    }
    if (f.size > MAX_BYTES) {
      alert.error('Fichier trop volumineux', 'La taille maximale est de 2 Mo.');
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const cancelPick = () => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await approvalsApi.uploadMySignature(file);
      setCtx((c) => (c ? { ...c, signatureUrl: res.signatureUrl } : c));
      cancelPick();
      alert.success('Signature enregistrée', 'Votre signature a bien été enregistrée.');
    } catch (e: any) {
      alert.error('Erreur', e?.message || "Impossible d'enregistrer la signature.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Supprimer votre signature ?')) return;
    setDeleting(true);
    try {
      await approvalsApi.deleteMySignature();
      setCtx((c) => (c ? { ...c, signatureUrl: null } : c));
      alert.success('Signature supprimée', 'Votre signature a été supprimée.');
    } catch (e: any) {
      alert.error('Erreur', e?.message || 'Impossible de supprimer la signature.');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    );
  }

  const canSign = !!ctx?.canSign;

  return (
    <div className="max-w-2xl mx-auto pb-20 space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 bg-[var(--surface)] rounded-xl border border-[var(--border)] hover:bg-[var(--surface-2)] transition-colors"
        >
          <ArrowLeft size={20} className="text-[var(--text-muted)]" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">Ma signature</h1>
          <p className="text-sm text-[var(--text-muted)]">
            Utilisée quand vous donnez un avis et sur les documents validés.
          </p>
        </div>
      </div>

      {/* Fonctions attribuées */}
      {ctx && ctx.functions.length > 0 && (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
            Vos fonctions
          </p>
          <div className="flex flex-wrap gap-2">
            {ctx.functions.map((f) => (
              <span
                key={f.code}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30"
              >
                <ShieldCheck size={13} />
                {f.label}
                {f.canSign ? ' · peut signer' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {!canSign ? (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 flex items-start gap-3">
          <Lock size={18} className="text-[var(--text-muted)] mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-bold text-[var(--text)]">Signature non autorisée</p>
            <p className="text-sm text-[var(--text-muted)] mt-1">
              L&apos;enregistrement d&apos;une signature est réservé aux personnes à qui
              l&apos;administrateur a accordé ce droit. Contactez-le si vous en avez besoin.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-5">
          <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-2)] min-h-[160px] flex items-center justify-center p-4">
            {preview || ctx?.signatureUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview || ctx?.signatureUrl || ''}
                alt="Signature"
                className="max-h-36 max-w-full object-contain"
              />
            ) : (
              <div className="text-center text-[var(--text-muted)]">
                <PenTool size={28} className="mx-auto mb-2 opacity-60" />
                <p className="text-sm">Aucune signature enregistrée</p>
              </div>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={onPick}
            className="hidden"
          />

          {file ? (
            <div className="flex gap-3">
              <button
                onClick={cancelPick}
                disabled={uploading}
                className="flex-1 py-3 border border-[var(--border)] rounded-xl font-bold text-sm hover:bg-[var(--surface-2)] disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                Enregistrer
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => inputRef.current?.click()}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2"
              >
                <Upload size={16} />
                {ctx?.signatureUrl ? 'Remplacer ma signature' : 'Importer ma signature'}
              </button>
              {ctx?.signatureUrl && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-4 py-3 border border-[var(--border)] rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                  title="Supprimer ma signature"
                >
                  {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                </button>
              )}
            </div>
          )}

          <p className="text-xs text-[var(--text-muted)]">
            Image JPG, PNG ou WEBP, 2 Mo maximum. Idéalement sur fond blanc ou transparent.
          </p>
        </div>
      )}
    </div>
  );
}
