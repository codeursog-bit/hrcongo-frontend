import React from 'react';

/** An unread/pending counter is navigation information, not an error status. */
export function SidebarCount({ count, mini = false }: { count: number; mini?: boolean }) {
  return <span className={`shell-nav-count${mini ? ' is-mini' : ''}`} aria-label={`${count} à consulter`}>{mini ? null : count > 99 ? '99+' : count}</span>;
}
