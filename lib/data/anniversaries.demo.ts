import type { AnniversariesAdapter, AnniversaryNotification } from '@/types/contracts/anniversaries';
import type { FeatureActor } from '@/types/contracts/tasks';
import { canAssign, requireActor } from './context';
import { anniversaryNotifications } from '@/lib/demo/events';
const notifications: AnniversaryNotification[] = structuredClone(anniversaryNotifications);
export function anniversariesDemo(actor: FeatureActor): AnniversariesAdapter {
  const visible = (row: AnniversaryNotification) => row.companyId === actor.companyId && (row.recipientId === actor.id || canAssign(actor));
  return { async list() { requireActor(actor); return structuredClone(notifications.filter(visible)); }, async markRead(id) { requireActor(actor); const row = notifications.find(e => e.id === id && visible(e)); if (!row) throw new Error('Notification inaccessible'); row.read = true; } };
}
