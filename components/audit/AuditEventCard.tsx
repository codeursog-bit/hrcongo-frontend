'use client';

// ============================================================================
// 📁 components/audit/AuditEventCard.tsx
// Affiche UN événement du journal d'audit avec TOUS les champs renvoyés par le
// back : n° d'ordre, date, gravité, action, résumé, acteur (nom, rôle, type, id),
// IP, objet concerné (type + id), valeurs avant → après, champs non conservés.
// ============================================================================
import React, { useState } from 'react';
import {
  ChevronDown, ChevronRight, Info, AlertTriangle, ShieldAlert, Bot, User,
  EyeOff, ArrowRight, History, Filter,
} from 'lucide-react';
import type { AuditEvent, AuditSeverity } from '@/services/audit-trail';
import {
  actionLabel, entityLabel, fieldLabel, fmtDateTime, fmtValue, ROLE_LABEL,
} from '@/lib/audit-labels';

const SEVERITY: Record<AuditSeverity, { label: string; cls: string; icon: React.ElementType }> = {
  INFO: { label: 'Information', cls: 'bg-[var(--surface-2)] text-[var(--text-muted)]', icon: Info },
  WARN: { label: 'Important', cls: 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-100', icon: AlertTriangle },
  CRITICAL: { label: 'Critique', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400', icon: ShieldAlert },
};

export function SeverityBadge({ severity }: { severity: AuditSeverity }) {
  const m = SEVERITY[severity] ?? SEVERITY.INFO;
  const Icon = m.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${m.cls}`}>
      <Icon className="w-3 h-3" /> {m.label}
    </span>
  );
}

function Tech({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">{label}</dt>
      <dd className="text-xs font-mono text-[var(--text)] break-all">{value ?? '—'}</dd>
    </div>
  );
}

export default function AuditEventCard({
  event, viewerRole, defaultOpen = false, onFilterActor, onShowHistory,
}: {
  event: AuditEvent;
  viewerRole?: string;
  defaultOpen?: boolean;
  /** Filtrer le journal sur cet acteur (page Journal uniquement). */
  onFilterActor?: (actorId: string, label: string) => void;
  /** Filtrer le journal sur cet objet (page Journal uniquement). */
  onShowHistory?: (entity: string, entityId: string, label: string) => void;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const values = Object.entries(event.changes?.values ?? {});
  const masked = event.changes?.maskedFields ?? [];
  const hasDetail = true; // l'identité technique est toujours consultable
  const valuesHidden = viewerRole === 'SUPER_ADMIN' && values.length === 0 && masked.length > 0;

  const actorName = event.actor.label ?? (event.actor.type === 'SYSTEM' ? 'Système' : 'Utilisateur inconnu');
  const ActorIcon = event.actor.type === 'SYSTEM' ? Bot : User;

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
      <button type="button" onClick={() => hasDetail && setOpen(o => !o)}
        className="w-full text-left p-4 flex items-start gap-3 hover:bg-[var(--surface-2)]/50 transition-colors">
        <span className="mt-0.5 text-[var(--text-muted)] shrink-0">
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <SeverityBadge severity={event.severity} />
            <span className="text-sm font-bold text-[var(--text)]">{actionLabel(event.action)}</span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text-muted)]">
              {entityLabel(event.entity)}
            </span>
            <span className="text-[11px] font-mono text-[var(--text-muted)]">#{event.seq}</span>
          </div>
          <p className="text-sm text-[var(--text)] mt-1.5 break-words">{event.summary}</p>
          <div className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-1.5 text-xs text-[var(--text-muted)]">
            <span>{fmtDateTime(event.occurredAt)}</span>
            <span className="flex items-center gap-1">
              <ActorIcon className="w-3 h-3" /> {actorName}
              {event.actor.role && <span>({ROLE_LABEL[event.actor.role] ?? event.actor.role})</span>}
            </span>
            {event.ip && <span>IP {event.ip}</span>}
            {values.length > 0 && <span>{values.length} valeur{values.length > 1 ? 's' : ''} modifiée{values.length > 1 ? 's' : ''}</span>}
            {masked.length > 0 && <span>{masked.length} champ{masked.length > 1 ? 's' : ''} non conservé{masked.length > 1 ? 's' : ''}</span>}
          </div>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--border)] p-4 space-y-4 bg-[var(--surface-2)]/30">
          {values.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-2">Valeurs avant → après</p>
              <div className="rounded-lg border border-[var(--border)] overflow-hidden divide-y divide-[var(--border)] bg-[var(--surface)]">
                {values.map(([field, ch]) => (
                  <div key={field} className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-1 sm:gap-3 px-3 py-2 text-sm">
                    <span className="font-semibold text-[var(--text)]">{fieldLabel(field)}</span>
                    <span className="flex items-center gap-2 flex-wrap text-[var(--text-muted)]">
                      <span className="line-through">{fmtValue(field, ch.from)}</span>
                      <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      <span className="font-bold text-[var(--text)]">{fmtValue(field, ch.to)}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {valuesHidden && (
            <p className="flex items-start gap-2 text-xs text-[var(--text-muted)]">
              <EyeOff className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              Votre rôle (support plateforme) voit qui a fait quoi et quand, mais pas les valeurs des entreprises clientes.
            </p>
          )}

          {masked.length > 0 && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-1.5 flex items-center gap-1.5">
                <EyeOff className="w-3 h-3" /> Champs modifiés, valeur non conservée
              </p>
              <div className="flex flex-wrap gap-1.5">
                {masked.map(f => (
                  <span key={f} className="px-2 py-0.5 rounded-md text-xs bg-[var(--surface)] border border-[var(--border)] text-[var(--text-muted)]">
                    {fieldLabel(f)}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                Données personnelles ou sensibles : le journal garde le fait que le champ a changé, jamais son contenu.
              </p>
            </div>
          )}

          {values.length === 0 && masked.length === 0 && (
            <p className="text-xs text-[var(--text-muted)]">Aucune valeur modifiée enregistrée pour cet événement.</p>
          )}

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
            <Tech label="Identifiant de l'événement" value={event.id} />
            <Tech label="Type d'acteur" value={event.actor.type === 'SYSTEM' ? 'Système (automatique)' : 'Utilisateur'} />
            <Tech label="Identifiant de l'acteur" value={event.actor.id} />
            <Tech label="Type d'objet" value={event.entity} />
            <Tech label="Identifiant de l'objet" value={event.entityId} />
            <Tech label="Code de l'action" value={event.action} />
          </dl>

          {(onFilterActor || onShowHistory) && (
            <div className="flex flex-wrap gap-2">
              {onFilterActor && event.actor.id && (
                <button type="button" onClick={() => onFilterActor(event.actor.id!, actorName)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)]">
                  <Filter className="w-3 h-3" /> Tout ce qu'a fait {actorName}
                </button>
              )}
              {onShowHistory && event.entityId && (
                <button type="button" onClick={() => onShowHistory(event.entity, event.entityId!, `${entityLabel(event.entity)} ${event.entityId!.slice(0, 8)}…`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--surface-2)] text-[var(--text)]">
                  <History className="w-3 h-3" /> Historique de cet objet
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}