'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/services/api';

export default function NewCabinetJobPage() {
  const { cabinetId, companyId } = useParams<{ cabinetId: string; companyId: string }>();
  const base = `/cabinet/${cabinetId}/entreprise/${companyId}/recrutement`;
  const router = useRouter();
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', requirements: '', departmentId: '', contractType: 'CDI', location: '', status: 'DRAFT' });
  useEffect(() => {
    let active = true;
    api.get<any>(`/departments?companyId=${companyId}`).then(r => { if (active) setDepartments(Array.isArray(r) ? r : r.data ?? []); })
      .catch((e: Error) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [companyId]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const job = await api.post<{ id: string }>(`/recruitment/jobs?companyId=${companyId}`, { ...form, title: form.title.trim(), description: form.description.trim(), processingMode: 'MANUAL', showOnPortal: false });
      router.replace(`${base}/${job.id}`);
    } catch (e: any) { setError(e.message || 'Création impossible'); }
    finally { setSaving(false); }
  }
  const field = 'w-full mt-1 rounded-lg border border-slate-600 bg-slate-900 px-3 py-2 text-slate-100';
  return <div className="p-6 max-w-3xl text-slate-100 space-y-5">
    <Link href={base} className="text-cyan-400">← Recrutement</Link><h1 className="text-2xl font-semibold">Nouvelle offre d’emploi</h1>
    {error && <p role="alert" className="rounded-lg bg-red-950 p-3 text-red-200">{error}</p>}
    {loading ? <p role="status">Chargement des départements…</p> : <form onSubmit={submit} className="space-y-4">
      <label className="block">Intitulé<input required maxLength={180} className={field} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></label>
      <label className="block">Département<select required className={field} value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}><option value="">Sélectionner un département</option>{departments.map(d => <option value={d.id} key={d.id}>{d.name}</option>)}</select></label>
      {!departments.length && <p className="text-amber-300">Aucun département disponible. Demandez à l’administrateur de la PME d’en créer un.</p>}
      <div className="grid sm:grid-cols-2 gap-4"><label>Contrat<select className={field} value={form.contractType} onChange={e => setForm({ ...form, contractType: e.target.value })}>{['CDI','CDD','STAGE','INTERIM','CONSULTANT'].map(v => <option key={v}>{v}</option>)}</select></label>
        <label>Lieu<input className={field} value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></label></div>
      <label className="block">Description<textarea required rows={6} className={field} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></label>
      <label className="block">Profil recherché<textarea rows={4} className={field} value={form.requirements} onChange={e => setForm({ ...form, requirements: e.target.value })} /></label>
      <label className="block">Statut<select className={field} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}><option value="DRAFT">Brouillon</option><option value="PUBLISHED">Publiée par lien direct</option></select></label>
      <p className="text-sm text-slate-400">L’offre n’apparaît pas automatiquement sur le portail public.</p>
      <button disabled={saving || !departments.length} className="rounded-lg bg-indigo-600 px-5 py-2 disabled:opacity-50">{saving ? 'Enregistrement…' : 'Créer l’offre'}</button>
    </form>}
  </div>;
}
