"use client";
// Questions que les clients ont TAPÉES et que Sofia n'a pas su traiter avec un outil.
// Texte déjà masqué côté serveur (noms, montants, identifiants retirés), 90 jours maximum.
import React, { useCallback, useEffect, useState } from "react";
import { Copy, RefreshCw } from "lucide-react";
import { api } from "@/services/api";
import { Card, Button } from "@/components/design-system/primitives";

type Status = "NEW" | "PLANNED" | "DONE" | "IGNORED";
type Group = {
  key: string;
  question: string;
  status: Status;
  note: string | null;
  count: number;
  companies: number;
  reasons: Record<string, number>;
  lastSeen: string;
};
type Payload = { days: number; totalQuestions: number; groups: Group[] };

const STATUS_LABEL: Record<Status, string> = {
  NEW: "À traiter",
  PLANNED: "Prévu",
  DONE: "Fait",
  IGNORED: "Ignoré",
};
const REASON_LABEL: Record<string, string> = {
  OUT_OF_SCOPE: "Hors périmètre",
  OPEN_LANE: "Réponse libre, sans outil",
  ANALYSIS_FAILED: "Analyse en échec",
};

const selectStyle: React.CSSProperties = {
  background: "var(--surface-2, transparent)",
  color: "inherit",
  border: "1px solid var(--border)",
  borderRadius: 10,
  padding: "8px 10px",
};

export default function UnansweredQuestionsCard() {
  const [days, setDays] = useState("7");
  const [status, setStatus] = useState<string>("NEW");
  const [reason, setReason] = useState("");
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams({ days });
      if (status) q.set("status", status);
      if (reason) q.set("reason", reason);
      setData(await api.get<Payload>(`/admin/assistant/unanswered?${q.toString()}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Chargement impossible.");
    } finally {
      setLoading(false);
    }
  }, [days, status, reason]);

  useEffect(() => {
    void load();
  }, [load]);

  const setGroupStatus = async (key: string, next: Status) => {
    setBusy(key);
    setError("");
    try {
      await api.patch(`/admin/assistant/unanswered/${key}`, { status: next });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mise à jour impossible.");
    } finally {
      setBusy(null);
    }
  };

  const copyList = async () => {
    if (!data?.groups.length) return;
    const text = data.groups.map((g) => `${g.count}× ${g.question}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copie impossible depuis ce navigateur.");
    }
  };

  return (
    <Card title="Questions sans réponse">
      <p className="assistant-admin-muted">
        Questions tapées par vos clients que Sofia n’a pas pu traiter avec un outil
        : à partir d’ici, décidez quels outils ajouter. Les noms, montants,
        adresses et identifiants sont masqués avant l’enregistrement, et rien
        n’est conservé plus de 90 jours. Les boutons et suggestions ne sont
        jamais enregistrés.
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "12px 0" }}>
        <select aria-label="Période" value={days} onChange={(e) => setDays(e.target.value)} style={selectStyle}>
          <option value="7">7 derniers jours</option>
          <option value="30">30 derniers jours</option>
          <option value="90">90 derniers jours</option>
        </select>
        <select aria-label="Statut" value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="NEW">À traiter</option>
          <option value="PLANNED">Prévu</option>
          <option value="DONE">Fait</option>
          <option value="IGNORED">Ignoré</option>
          <option value="">Tous les statuts</option>
        </select>
        <select aria-label="Type" value={reason} onChange={(e) => setReason(e.target.value)} style={selectStyle}>
          <option value="">Tous les types</option>
          <option value="OUT_OF_SCOPE">Hors périmètre</option>
          <option value="OPEN_LANE">Réponse libre, sans outil</option>
          <option value="ANALYSIS_FAILED">Analyse en échec</option>
        </select>
        <Button variant="secondary" onClick={() => void load()} disabled={loading}>
          <RefreshCw size={16} strokeWidth={1.5} /> Actualiser
        </Button>
        <Button variant="secondary" onClick={() => void copyList()} disabled={!data?.groups.length}>
          <Copy size={16} strokeWidth={1.5} /> {copied ? "Copié" : "Copier la liste"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="k-tone-danger assistant-admin-notice">
          {error}
        </p>
      )}
      {loading && !data ? (
        <p role="status">Chargement…</p>
      ) : !data?.groups.length ? (
        <p className="assistant-admin-muted">
          Aucune question dans cette sélection{data ? ` (${data.totalQuestions} enregistrée(s) sur la période, tous statuts confondus)` : ""}.
        </p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
          {data.groups.map((g) => (
            <li key={g.key} style={{ border: "1px solid var(--border)", borderRadius: 14, padding: "12px 14px" }}>
              <p style={{ margin: 0, fontWeight: 600 }}>{g.question}</p>
              <p className="assistant-admin-muted" style={{ margin: "4px 0 10px" }}>
                {g.count} fois · {g.companies} entreprise{g.companies > 1 ? "s" : ""} · dernière le{" "}
                {new Date(g.lastSeen).toLocaleDateString("fr-FR")} ·{" "}
                {Object.entries(g.reasons)
                  .map(([r, n]) => `${REASON_LABEL[r] || r} (${n})`)
                  .join(", ")}{" "}
                · {STATUS_LABEL[g.status]}
              </p>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {(["PLANNED", "DONE", "IGNORED", "NEW"] as Status[])
                  .filter((s) => s !== g.status)
                  .map((s) => (
                    <Button
                      key={s}
                      variant="secondary"
                      disabled={busy === g.key}
                      onClick={() => void setGroupStatus(g.key, s)}
                    >
                      {s === "NEW" ? "Rouvrir" : s === "PLANNED" ? "Marquer prévu" : s === "DONE" ? "Marquer fait" : "Ignorer"}
                    </Button>
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}