'use client';

import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, List, Users } from 'lucide-react';

/** Pagination locale : la recherche, les droits et les actions restent dans la page. */
export function UserCollection({ children, filterKey }: { children: React.ReactNode; filterKey: string }) {
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [size, setSize] = useState(10);
  const [position, setPosition] = useState({ filterKey, page: 1 });
  useEffect(() => { setPosition({ filterKey, page: 1 }); }, [filterKey]);
  const items = React.Children.toArray(children);
  const pages = Math.max(1, Math.ceil(items.length / size));
  const page = Math.min(position.filterKey === filterKey ? position.page : 1, pages);
  const start = (page - 1) * size;
  const go = (next: number) => setPosition({ filterKey, page: next });

  return <section className="settings-users-collection" aria-label="Liste des utilisateurs">
    <div className="settings-users-controls">
      <p>{items.length} utilisateur{items.length > 1 ? 's' : ''}</p>
      <div className="k-segmented" role="group" aria-label="Présentation des utilisateurs">
        <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} strokeWidth={1.5} />Liste</button>
        <button type="button" aria-pressed={view === 'grid'} onClick={() => setView('grid')}><LayoutGrid size={16} strokeWidth={1.5} />Grille</button>
      </div>
    </div>
    {view === 'list' && items.length > 0 && <div className="settings-users-list-heading" aria-hidden="true"><span>Utilisateur</span><span>Rôle et accès</span><span>Actions</span></div>}
    {items.length ? <div className={`settings-users-${view}`}>{items.slice(start, start + size)}</div> : <div className="settings-users-empty"><Users size={24} strokeWidth={1.5} /><h2>Aucun utilisateur trouvé</h2><p>Essayez un autre nom, une adresse e-mail ou un autre rôle.</p></div>}
    <footer className="settings-users-pagination">
      <p>{items.length ? `${start + 1}–${Math.min(start + size, items.length)} sur ${items.length}` : '0 utilisateur'}</p>
      <label>Par page <select value={size} onChange={event => { setSize(Number(event.target.value)); go(1); }} className="k-input">{[10,20,30,40,50].map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <div className="flex items-center gap-2">
        <button type="button" className="shell-icon-btn" aria-label="Page précédente" disabled={page === 1} onClick={() => go(page - 1)}><ChevronLeft size={18} strokeWidth={1.5} /></button>
        <span aria-live="polite">{page} / {pages}</span>
        <button type="button" className="shell-icon-btn" aria-label="Page suivante" disabled={page === pages} onClick={() => go(page + 1)}><ChevronRight size={18} strokeWidth={1.5} /></button>
      </div>
    </footer>
  </section>;
}
