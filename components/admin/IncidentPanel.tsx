"use client";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from 'next/navigation';
import { adminService } from "@/lib/services/adminService";
type Incident = {
  id: string;
  source: string;
  severity: string;
  status: string;
  count: number;
  companyCount: number;
  userCount: number;
  firstSeen: string;
  lastSeen: string;
  version?: string;
  errors: {
    id: string;
    message: string;
    path: string;
    stack?: string;
    context?: unknown;
    occurrences: number;
    createdAt: string;
  }[];
};
type Detail = Incident & {
  report: string;
  note?: string;
  historyNote: string;
  companies: {
    id: string;
    legalName: string;
    subscription?: { plan: string };
  }[];
  users: { id: string; firstName: string; lastName: string; role: string }[];
};
const labels: Record<string, string> = {
  NEW: "Nouveau",
  ACKNOWLEDGED: "Pris en charge",
  RESOLVED: "Résolu",
  IGNORED: "Ignoré",
  REGRESSED: "Récidive",
  FRONT: "Navigateur",
  BACK: "Serveur",
  CRON: "Tâche planifiée",
  THIRD_PARTY: "Service tiers",
};
export function IncidentPanel() {
  return <Suspense fallback={null}><IncidentPanelContent /></Suspense>;
}
function IncidentPanelContent() {
  const searchParams = useSearchParams();
  const [preferences,setPreferences]=useState<{emailEnabled:boolean;emailAvailable:boolean}|null>(null);
  const [savingPreferences,setSavingPreferences]=useState(false);
  const [source, setSource] = useState(""),
    [status, setStatus] = useState(""),
    [severity, setSeverity] = useState(""),
    [companyId, setCompanyId] = useState(searchParams?.get('companyId') || ''),
    [from, setFrom] = useState(""),
    [page, setPage] = useState(1);
  const [data, setData] = useState<{
      rows: Incident[];
      total: number;
      pages: number;
    } | null>(null),
    [detail, setDetail] = useState<Detail | null>(null),
    [note, setNote] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [copied, setCopied] = useState(false);
  const load = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_INCIDENTS_ENABLED !== "true") return;
    if (companyId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(companyId)) { setError('Saisissez un identifiant d’entreprise complet.'); return; }
    setError("");
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (source) params.set("source", source);
      if (status) params.set("status", status);
      if (severity) params.set("severity", severity);
      if (companyId) params.set("companyId", companyId);
      if (from) params.set("from", new Date(from).toISOString());
      setData(await adminService.get(`/admin/incidents?${params}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [page, source, status, severity, companyId, from]);
  useEffect(()=>{if(process.env.NEXT_PUBLIC_INCIDENTS_ENABLED!=='true')return;adminService.get<{emailEnabled:boolean;emailAvailable:boolean}>('/admin/incidents/preferences').then(setPreferences).catch(e=>setError(e.message))},[]);
  const toggleEmail=async()=>{if(!preferences)return;setSavingPreferences(true);try{setPreferences(await adminService.patch('/admin/incidents/preferences',{emailEnabled:!preferences.emailEnabled}))}catch(e){setError((e as Error).message)}finally{setSavingPreferences(false)}};
  const open = async (id: string) => {
    setBusy(true);
    setError("");
    setCopied(false);
    try {
      const value = await adminService.get<Detail>(`/admin/incidents/${id}`);
      setDetail(value);
      setNote(value.note || "");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  useEffect(() => {
    void load();
    const update = () => void load();
    window.addEventListener("platform-incident", update);
    return () => window.removeEventListener("platform-incident", update);
  }, [load]);
  useEffect(() => {
    const id = searchParams?.get("incident");
    if (id && /^[0-9a-f-]{36}$/i.test(id)) void open(id);
  }, [searchParams]);
  if (process.env.NEXT_PUBLIC_INCIDENTS_ENABLED !== "true") return null;
  const change = async (next: string) => {
    if (!detail) return;
    setBusy(true);
    setError("");
    try {
      await adminService.patch(`/admin/incidents/${detail.id}`, {
        status: next,
        note,
      });
      await open(detail.id);
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const field =
    "rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--text)]";
  return (
    <section className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Incidents regroupés</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Priorité à l’impact : entreprises, utilisateurs et occurrences.
          </p>
        </div>
        <button onClick={() => void load()} className={field}>
          Actualiser
        </button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border)] p-4">
        <div><p className="text-sm font-medium">Recevoir les alertes par e-mail</p><p className="text-xs text-[var(--text-muted)]">Choix personnel · désactivé par défaut. Les alertes dans l’application restent actives.</p>{preferences&&!preferences.emailAvailable&&<p className="text-xs text-[var(--text-muted)]">Le canal e-mail est désactivé sur le serveur ; votre préférence reste enregistrée.</p>}</div>
        <button type="button" role="switch" aria-checked={preferences?.emailEnabled??false} aria-label="Recevoir les alertes d’incidents par e-mail" disabled={!preferences||savingPreferences} onClick={()=>void toggleEmail()} className={`${field} disabled:opacity-50`}>{savingPreferences?'Enregistrement…':preferences?.emailEnabled?'E-mails activés':'E-mails désactivés'}</button>
      </div>
      <div className="flex flex-wrap gap-3">
        {[
          {
            label: "Source",
            value: source,
            set: setSource,
            choices: ["FRONT", "BACK", "CRON", "THIRD_PARTY"],
          },
          {
            label: "Statut",
            value: status,
            set: setStatus,
            choices: [
              "NEW",
              "ACKNOWLEDGED",
              "RESOLVED",
              "IGNORED",
              "REGRESSED",
            ],
          },
          {
            label: "Gravité",
            value: severity,
            set: setSeverity,
            choices: ["INFO", "WARN", "ERROR", "CRITICAL"],
          },
        ].map((filter) => (
          <select
            key={filter.label}
            aria-label={filter.label}
            className={field}
            value={filter.value}
            onChange={(e) => {
              filter.set(e.target.value);
              setPage(1);
            }}
          >
            <option value="">{filter.label} : toutes</option>
            {filter.choices.map((value) => (
              <option key={value} value={value}>
                {labels[value] || value}
              </option>
            ))}
          </select>
        ))}
        <input
          aria-label="Entreprise (identifiant)"
          placeholder="Identifiant de l’entreprise"
          value={companyId}
          className={field}
          onChange={(e) => {
            setCompanyId(e.target.value);
            setPage(1);
          }}
        />
        <input
          aria-label="Depuis le"
          type="date"
          className={field}
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-[var(--danger-text)]">
          {error}
        </p>
      )}
      {data && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr>
                  {[
                    "Incident",
                    "Source / gravité",
                    "Statut",
                    "Impact",
                    "Dernier passage",
                  ].map((label) => (
                    <th
                      className="p-3 font-medium text-[var(--text-muted)]"
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr className="border-t border-[var(--border)]" key={row.id}>
                    <td className="min-w-64 p-3">
                      <button
                        className="text-left font-medium underline"
                        onClick={() => void open(row.id)}
                      >
                        {row.errors[0]?.message || row.id}
                      </button>
                      <div className="text-xs text-[var(--text-muted)]">
                        {row.errors[0]?.path}
                      </div>
                    </td>
                    <td className="p-3">
                      {labels[row.source]}
                      <div>{row.severity}</div>
                    </td>
                    <td className="p-3">{labels[row.status]}</td>
                    <td className="p-3 whitespace-nowrap">
                      {row.count} occurrence(s)
                      <div className="text-xs text-[var(--text-muted)]">
                        {row.companyCount} entreprise(s) · {row.userCount}{" "}
                        utilisateur(s)
                      </div>
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      {new Date(row.lastSeen).toLocaleString("fr-CG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!data.rows.length && (
            <p className="text-sm text-[var(--text-muted)]">
              Aucun incident pour ces filtres.
            </p>
          )}
          <div className="flex justify-between text-sm">
            <span>
              {data.total} incident(s) · page {page} / {data.pages}
            </span>
            <div className="flex gap-4">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Précédent
              </button>
              <button
                disabled={page >= data.pages}
                onClick={() => setPage(page + 1)}
              >
                Suivant
              </button>
            </div>
          </div>
        </>
      )}
      {detail && (
        <article className="space-y-4 border-t border-[var(--border)] pt-5">
          <div className="flex justify-between gap-4">
            <h3 className="font-semibold">
              Fiche de l’incident · {labels[detail.status]}
            </h3>
            <button onClick={() => setDetail(null)}>Fermer la fiche</button>
          </div>
          <p className="text-sm">
            {detail.count} occurrence(s) · version{" "}
            {detail.version || "non renseignée"}
          </p>
          <div className="flex flex-wrap gap-3 text-sm">
            {detail.companies.map((company) => (
              <span key={company.id}>
                {company.legalName} ·{" "}
                {company.subscription?.plan || "Sans plan"}
              </span>
            ))}
            {detail.users.map((user) => (
              <span key={user.id}>
                {user.firstName} {user.lastName} · {user.role}
              </span>
            ))}
          </div>
          <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-[var(--surface-2)] p-4 text-xs">
            {detail.errors[0]?.stack || "Pile indisponible."}
          </pre>
          <details>
            <summary className="cursor-pointer text-sm">
              Chronologie et traces techniques
            </summary>
            <p className="mt-2 text-xs text-[var(--text-muted)]">
              {detail.historyNote}
            </p>
            {detail.errors.map((occurrence) => (
              <div
                key={occurrence.id}
                className="my-3 rounded-xl border border-[var(--border)] p-3 text-sm"
              >
                <strong>
                  {new Date(occurrence.createdAt).toLocaleString("fr-CG")} ·{" "}
                  {occurrence.occurrences} occurrence(s)
                </strong>
                <p>{occurrence.message}</p>
                <pre className="overflow-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(occurrence.context, null, 2)}
                </pre>
              </div>
            ))}
          </details>
          <label className="block text-sm">
            Note de suivi
            <textarea
              className={`${field} mt-2 block w-full`}
              value={note}
              maxLength={2000}
              rows={3}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-3">
            {["ACKNOWLEDGED", "RESOLVED", "IGNORED"].map((next) => (
              <button
                className={field}
                key={next}
                disabled={busy}
                onClick={() => void change(next)}
              >
                {next === "ACKNOWLEDGED"
                  ? "Reconnaître"
                  : next === "RESOLVED"
                    ? "Résoudre"
                    : "Ignorer"}
              </button>
            ))}
            <button
              className={field}
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(detail.report);
                  setCopied(true);
                } catch {
                  setError("Copie impossible dans ce navigateur.");
                }
              }}
            >
              {copied ? "Rapport copié" : "Copier le rapport pour l’IA"}
            </button>
          </div>
        </article>
      )}
    </section>
  );
}
