import type { Announcement, AnnouncementsAdapter } from '@/types/contracts/announcements';
import type { FeatureActor } from '@/types/contracts/tasks';
import { canAssign, requireActor } from './context';
const rows: Announcement[] = [{ id: 'demo-announcement', companyId: 'demo-company', title: 'Pensez à vérifier vos coordonnées', body: 'Une nouvelle adresse ou un nouveau numéro ? Retrouvez vos informations dans Mon compte.', createdAt: '2026-11-12T08:00:00+01:00' }];
export function announcementsDemo(actor: FeatureActor): AnnouncementsAdapter {
  return { async list() { requireActor(actor); return structuredClone(rows.filter(e => e.companyId === actor.companyId)); }, async create(title, body) { requireActor(actor); if (!canAssign(actor)) throw new Error('Accès réservé'); if (!title.trim() || !body.trim()) throw new Error('Renseignez le titre et le message'); const row = { id: crypto.randomUUID(), companyId: actor.companyId, title: title.trim(), body: body.trim(), createdAt: new Date().toISOString() }; rows.push(row); return structuredClone(row); } };
}
