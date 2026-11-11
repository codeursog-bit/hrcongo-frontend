import type { PayrollItem } from '@/types/bulletin-template';

/** Shared display rules, including slips generated before these rules existed. */
export function presentBulletinItem(item: PayrollItem): PayrollItem {
  if (item.code === 'TUS_DGI') return { ...item, label: 'TUS FISC' };
  if (item.type === 'GAIN' && (
    ['INDEM_CONGE', 'CONGE_SUPP'].includes(item.code) || /cong[eé]/i.test(item.label)
  )) {
    return { ...item, base: undefined, rate: undefined, quantity: undefined };
  }
  return item;
}
