'use client';
import React, { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/ProfileAvatar';

export function SidebarAccount({ name, role, email, photo, mini, onLogout }: { name: string; role: string; email?: string; photo?: string | null; mini: boolean; onLogout: () => void }) {
  const [sessionEmail, setSessionEmail] = useState('');
  useEffect(() => {
    try { const user = JSON.parse(localStorage.getItem('user') || '{}'); if (typeof user.email === 'string') setSessionEmail(user.email); } catch { /* Session may be unavailable while signing out. */ }
  }, []);
  return <footer className={`shell-account${mini ? ' is-mini' : ''}`}>
    <div className="shell-account-person">
      <ProfileAvatar src={photo || undefined} name={name} />
      {!mini && <div className="shell-account-identity"><strong title={name}>{name}</strong><span>{role}</span><small title={email || sessionEmail}>{email || sessionEmail}</small></div>}
    </div>
    <button type="button" onClick={onLogout} aria-label="Se déconnecter" title="Se déconnecter" className="shell-account-logout"><LogOut size={18} strokeWidth={1.5} aria-hidden="true" />{!mini && <span>Se déconnecter</span>}</button>
  </footer>;
}
