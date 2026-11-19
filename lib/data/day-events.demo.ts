import type { DayEvent, DayEventsAdapter } from '@/types/contracts/day-events';
import type { FeatureActor } from '@/types/contracts/tasks';
import { requireActor } from './context';
const votes = new Map<string, Set<string>>();
const events = new Map<string, DayEvent[]>();
export function dayEventsDemo(actor: FeatureActor): DayEventsAdapter {
  const list = () => {
    requireActor(actor);
    if (!events.has(actor.companyId)) { const now = new Date(); events.set(actor.companyId, [{ id: `demo-birthday-${actor.companyId}`, companyId: actor.companyId, type: 'BIRTHDAY', subject: { id: 'demo-sandrine', name: 'Sandrine Mvoula' }, title: 'Bon anniversaire, Sandrine !', day: now.getDate(), month: now.getMonth() + 1, expiresAt: new Date(now.getTime() + 86400000).toISOString(), reactions: [] }]); }
    return events.get(actor.companyId)!.filter(e => new Date(e.expiresAt).getTime() > Date.now()).map(e => ({ ...e, reactions: ['🎉', '👏', '❤️', '🎂', '👍'].map(emoji => { const voters = votes.get(`${e.id}:${emoji}`); return { emoji, count: voters?.size || 0, mine: voters?.has(actor.id) || false }; }) }));
  };
  return { async list() { return structuredClone(list()); }, async react(id, emoji) { if (!list().some(e => e.id === id) || !['🎉', '👏', '❤️', '🎂', '👍'].includes(emoji)) throw new Error('Réaction indisponible'); const key = `${id}:${emoji}`; const voters = votes.get(key) || new Set<string>(); if (voters.has(actor.id)) voters.delete(actor.id); else voters.add(actor.id); votes.set(key, voters); } };
}
