type NavItem = { href: string; group?: string; active?: boolean };
type Rect = { left: number; right: number; top: number; bottom: number };

/** Count the actual displayed tabs, including an active tab brought out of overflow. */
export function moduleNavVisibleCount(items: NavItem[], widths: number[], available: number, moreWidth: number) {
  const active = items.findIndex(item => item.active);
  for (let count = items.length; count >= 0; count--) {
    const indices = Array.from({ length: count }, (_, index) => index);
    if (count > 0 && active >= count) indices[count - 1] = active;
    const hasMore = count < items.length;
    let used = hasMore ? moreWidth : 0;
    indices.forEach((index, position) => {
      used += widths[index] ?? 0;
      // A separator is another flex child: its 13px width adds a second 4px gap.
      if (position > 0) used += 4 + (items[index].group !== items[indices[position - 1]].group ? 17 : 0);
    });
    if (hasMore && count > 0) used += 4;
    if (used <= available || count === 0) return count;
  }
  return 0;
}

/** Keep the entire popup inside both the module column and the viewport. */
export function moduleNavMenuPosition(anchor: Rect, column: Rect, viewport: { width: number; height: number }, naturalHeight = 420) {
  const margin = 12, gap = 8;
  const leftEdge = Math.max(margin, column.left);
  const rightEdge = Math.min(viewport.width - margin, column.right);
  const width = Math.max(0, Math.min(264, rightEdge - leftEdge));
  const left = Math.max(leftEdge, Math.min(anchor.right - width, rightEdge - width));
  const below = Math.max(0, viewport.height - margin - anchor.bottom - gap);
  const above = Math.max(0, anchor.top - margin - gap);
  const wanted = Math.min(420, naturalHeight);
  const upwards = below < wanted && above > below;
  return {
    left, width, maxHeight: Math.min(wanted, upwards ? above : below),
    ...(upwards ? { bottom: viewport.height - anchor.top + gap } : { top: anchor.bottom + gap }),
  };
}
