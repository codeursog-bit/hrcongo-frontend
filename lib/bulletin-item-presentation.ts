import type { PayrollItem } from '@/types/bulletin-template';

function itemRank(item: PayrollItem): number {
  if (item.code === 'SAL_BASE') return 0;
  if (item.code === 'ABS_DEDUCT') return 1;
  if (item.type !== 'GAIN') return 5;
  if (item.code === 'CONGE_SUPP') return 4.1;
  if (item.code === 'INDEM_CONGE' || /cong[eé]/i.test(item.label)) return 4;
  if (/anciennet[eé]/i.test(item.label) || /SENIOR|ANCIEN/i.test(item.code)) return 2;
  return 3;
}

export function compareBulletinItems(a: PayrollItem, b: PayrollItem): number {
  return itemRank(a) - itemRank(b) || a.order - b.order;
}

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
