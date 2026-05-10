// ============================================================================
// 📁 src/pages/PSEPage.tsx
//
// Page Plan de Sauvegarde de l'Emploi (PSE)
// Art. 39 CT Congo — Déclenché automatiquement si ≥ 5 lic. éco / 30 jours
//
// ✅ Tableau de bord PSE actif / historique
// ✅ Ouverture d'une procédure PSE
// ✅ Suivi des étapes légales (notification inspection, délai, réunion DP)
// ✅ Liste des salariés concernés
// ✅ Statistiques licenciements économiques
// ============================================================================

"use client"

import { useState, useEffect, useCallback } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
interface PSEProcedure {
  id: string;
  status: "OUVERT" | "EN_COURS" | "CLOTURE" | "ANNULE";
  motif: string;
  nbPostesSupprimes: number;
  dateOuverture: string;
  dateNotificationInspection?: string;
  dateReunionDP?: string;
  dateCloture?: string;
  salariesConcernes: Array<{
    id: string; nom: string; poste: string; matricule: string;
    departement?: string; statut: "PREVU" | "CONFIRME" | "MAINTENU";
  }>;
  etapes: Array<{
    label: string; done: boolean; date?: string; requis: boolean;
  }>;
  createdBy: string;
  notes?: string;
}

interface EcoStats {
  total30j: number;
  total90j: number;
  totalAnnee: number;
  seuil: number; // 5 = seuil PSE obligatoire
  pseRequired: boolean;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  OUVERT:   { label: "Ouvert",    color: "#f59e0b", bg: "#fbbf2415" },
  EN_COURS: { label: "En cours",  color: "#6366f1", bg: "#6366f115" },
  CLOTURE:  { label: "Clôturé",   color: "#4ade80", bg: "#4ade8015" },
  ANNULE:   { label: "Annulé",    color: "#ef4444", bg: "#ef444415" },
};

const ETAPES_PSE = [
  { label: "Notification à l'Inspection du Travail",              requis: true  },
  { label: "Réunion des Délégués du Personnel",                   requis: true  },
  { label: "Délai de réflexion (15 jours ouvrables)",             requis: true  },
  { label: "Autorisation Commission des Litiges",                  requis: true  },
  { label: "Notification individuelle aux salariés concernés",    requis: true  },
  { label: "Mise en œuvre des mesures d'accompagnement",          requis: false },
  { label: "Clôture de la procédure",                             requis: true  },
];

const fmt  = (n: number) => new Intl.NumberFormat("fr-FR").format(n);
const fmtD = (d?: string) => d ? new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

// ─── Composants UI ────────────────────────────────────────────────────────────
const S = {
  card:  { background: "#0d1421", borderRadius: 16, padding: "20px 22px", border: "1px solid #1e2640" } as React.CSSProperties,
  input: { width: "100%", padding: "10px 13px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e2640", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
};

function StatCard({ label, value, sub, color, alert }: { label: string; value: number | string; sub?: string; color: string; alert?: boolean }) {
  return (
    <div style={{
      ...S.card,
      border: alert ? `1px solid ${color}40` : "1px solid #1e2640",
      boxShadow: alert ? `0 0 24px ${color}15` : "none",
    }}>
      <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 8 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, color, letterSpacing: -1 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: "#334155", marginTop: 4 }}>{sub}</div>}
      {alert && <div style={{ marginTop: 8, fontSize: 11, color, fontWeight: 700 }}>⚠ Seuil PSE atteint</div>}
    </div>
  );
}

// ─── Formulaire nouvelle procédure ───────────────────────────────────────────
function NouvelleProceduреModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    motif: "", nbPostesSupprimes: 1, notes: "",
    salariesIds: [] as string[],
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/employees?status=ACTIVE&limit=200", { credentials: "include" })
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : d.data ?? []));
  }, []);

  async function handleSubmit() {
    if (!form.motif.trim()) { setError("Le motif est requis"); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/pse", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message); }
      onCreated();
    } catch (e: any) {
      setError(e.message ?? "Erreur lors de l'ouverture de la procédure");
    } finally {
      setLoading(false);
    }
  }

  const toggleEmployee = (id: string) =>
    setForm(f => ({ ...f, salariesIds: f.salariesIds.includes(id) ? f.salariesIds.filter(x => x !== id) : [...f.salariesIds, id] }));

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9000, background: "rgba(0,0,0,.8)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "#0d1421", borderRadius: 20, border: "1px solid #1e2640", padding: "32px 28px", maxWidth: 640, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px" }}>Ouvrir une procédure PSE</h2>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Plan de Sauvegarde de l'Emploi — Art. 39 CT Congo</p>
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, cursor: "pointer", background: "#1e2640", border: "none", color: "#64748b", fontSize: 16 }}>✕</button>
        </div>

        {/* Alerte légale */}
        <div style={{ padding: "12px 16px", borderRadius: 10, background: "#7c3aed15", border: "1px solid #7c3aed30", marginBottom: 20, fontSize: 12, color: "#c4b5fd", lineHeight: 1.6 }}>
          ⚖️ <strong>Obligations légales :</strong> La notification à l'Inspection du Travail est obligatoire <strong>avant</strong> toute notification aux salariés. La Commission des Litiges doit autoriser les licenciements. Délai minimum : 15 jours ouvrables.
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Motif économique <span style={{ color: "#ef4444" }}>*</span></div>
            <textarea rows={3} value={form.motif} onChange={e => setForm(f => ({ ...f, motif: e.target.value }))}
              placeholder="Décrire les raisons économiques, financières ou technologiques justifiant le PSE…"
              style={{ ...S.input, resize: "vertical", minHeight: 80 }} />
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Nombre de postes supprimés <span style={{ color: "#ef4444" }}>*</span></div>
            <input type="number" min={1} value={form.nbPostesSupprimes}
              onChange={e => setForm(f => ({ ...f, nbPostesSupprimes: +e.target.value }))} style={{ ...S.input, maxWidth: 120 }} />
          </div>

          {/* Sélection salariés concernés */}
          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 8 }}>
              Salariés concernés — {form.salariesIds.length} sélectionné(s)
            </div>
            <div style={{ maxHeight: 220, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {employees.map(e => {
                const isSel = form.salariesIds.includes(e.id);
                return (
                  <button key={e.id} onClick={() => toggleEmployee(e.id)} style={{
                    padding: "10px 14px", borderRadius: 9, textAlign: "left", cursor: "pointer",
                    background: isSel ? "#1e1b4b" : "#0c1220", border: `1px solid ${isSel ? "#6366f1" : "#1e2640"}`,
                    color: "#e2e8f0", display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{ width: 18, height: 18, borderRadius: 5, background: isSel ? "#6366f1" : "#1e2640", border: `1px solid ${isSel ? "#6366f1" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>
                      {isSel && "✓"}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{e.firstName} {e.lastName}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{e.employeeNumber} · {e.position}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>Notes internes</div>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Notes pour le dossier PSE…" style={{ ...S.input, resize: "vertical" }} />
          </div>

          {error && <div style={{ padding: "10px 14px", borderRadius: 8, background: "#ef444415", border: "1px solid #ef444430", fontSize: 12, color: "#fca5a5" }}>❌ {error}</div>}

          <button onClick={handleSubmit} disabled={loading || !form.motif.trim()} style={{
            padding: "14px", borderRadius: 11, cursor: form.motif.trim() ? "pointer" : "not-allowed",
            background: form.motif.trim() ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "#1e2640",
            border: "none", color: form.motif.trim() ? "#fff" : "#334155",
            fontSize: 14, fontWeight: 800, opacity: loading ? .7 : 1,
          }}>
            {loading ? "⏳ Ouverture en cours…" : "⚖️ Ouvrir la procédure PSE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Carte procédure PSE ──────────────────────────────────────────────────────
function PSECard({ pse, onUpdate }: { pse: PSEProcedure; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading]   = useState(false);
  const st = STATUS_CONFIG[pse.status];
  const etapesDone = pse.etapes.filter(e => e.done).length;

  async function updateEtape(idx: number) {
    setLoading(true);
    try {
      await fetch(`/api/pse/${pse.id}/etape/${idx}`, {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !pse.etapes[idx].done }),
      });
      onUpdate();
    } finally { setLoading(false); }
  }

  return (
    <div style={{ background: "#0d1421", borderRadius: 16, border: `1px solid ${st.color}30`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "18px 22px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }} onClick={() => setExpanded(x => !x)}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: st.bg, border: `1px solid ${st.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>⚖️</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 14, fontWeight: 800 }}>PSE — {pse.nbPostesSupprimes} poste(s) supprimé(s)</span>
            <span style={{ fontSize: 10, padding: "2px 9px", borderRadius: 20, background: st.bg, color: st.color, fontWeight: 700, border: `1px solid ${st.color}30` }}>{st.label}</span>
          </div>
          <div style={{ fontSize: 12, color: "#64748b" }}>
            Ouvert le {fmtD(pse.dateOuverture)} · {pse.salariesConcernes.length} salarié(s) · Étapes : {etapesDone}/{pse.etapes.length}
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ width: 100, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#475569", marginBottom: 5 }}>
            <span>Avancement</span>
            <span style={{ color: st.color, fontWeight: 700 }}>{Math.round(etapesDone / pse.etapes.length * 100)}%</span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: "#0c1220", overflow: "hidden" }}>
            <div style={{ width: `${etapesDone / pse.etapes.length * 100}%`, height: "100%", background: st.color, borderRadius: 3, transition: "width .5s ease" }} />
          </div>
        </div>
        <span style={{ color: "#334155", fontSize: 16 }}>{expanded ? "▲" : "▼"}</span>
      </div>

      {expanded && (
        <div style={{ borderTop: "1px solid #1e2640", padding: "20px 22px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

          {/* Étapes légales */}
          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Étapes légales</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pse.etapes.map((etape, i) => (
                <button key={i} onClick={() => !loading && updateEtape(i)} style={{
                  padding: "11px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                  background: etape.done ? "#14532d20" : "#0c1220",
                  border: `1px solid ${etape.done ? "#4ade8030" : etape.requis ? "#1e2640" : "#1e2640"}`,
                  color: "#e2e8f0", transition: "all .18s", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: etape.done ? "#4ade80" : "#1e2640", border: `1px solid ${etape.done ? "#4ade80" : "#334155"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: "#fff" }}>
                    {etape.done ? "✓" : i + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: etape.done ? "#4ade80" : "#94a3b8" }}>{etape.label}</div>
                    {etape.date && <div style={{ fontSize: 10, color: "#475569", marginTop: 2 }}>{fmtD(etape.date)}</div>}
                  </div>
                  {etape.requis && !etape.done && <span style={{ fontSize: 10, color: "#ef4444", fontWeight: 700 }}>Requis</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Salariés concernés */}
          <div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>
              Salariés concernés ({pse.salariesConcernes.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto" }}>
              {pse.salariesConcernes.length === 0 ? (
                <div style={{ padding: "16px 0", textAlign: "center", color: "#334155", fontSize: 12 }}>Aucun salarié rattaché</div>
              ) : pse.salariesConcernes.map(s => {
                const statusColors = { PREVU: "#f59e0b", CONFIRME: "#ef4444", MAINTENU: "#4ade80" };
                const statusLabels = { PREVU: "Prévu", CONFIRME: "Confirmé", MAINTENU: "Maintenu" };
                const sc = statusColors[s.statut];
                return (
                  <div key={s.id} style={{ padding: "10px 14px", borderRadius: 9, background: "#0c1220", border: "1px solid #1e2640", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{s.nom}</div>
                      <div style={{ fontSize: 11, color: "#64748b" }}>{s.matricule} · {s.poste}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${sc}15`, color: sc, border: `1px solid ${sc}30`, fontWeight: 700 }}>
                      {statusLabels[s.statut]}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Infos clés */}
            <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e2640" }}>
              <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 10 }}>Dates clés</div>
              {[
                { l: "Ouverture",              v: fmtD(pse.dateOuverture) },
                { l: "Notif. Inspection",       v: fmtD(pse.dateNotificationInspection) },
                { l: "Réunion DP",              v: fmtD(pse.dateReunionDP) },
                { l: "Clôture prévue",          v: fmtD(pse.dateCloture) },
              ].map(({ l, v }) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", marginBottom: 7, fontSize: 12 }}>
                  <span style={{ color: "#475569" }}>{l}</span>
                  <span style={{ fontWeight: 600, color: v === "—" ? "#334155" : "#94a3b8" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Motif */}
          {pse.motif && (
            <div style={{ gridColumn: "1/-1", padding: "12px 16px", borderRadius: 10, background: "#7c3aed10", border: "1px solid #7c3aed20", fontSize: 12, color: "#c4b5fd", lineHeight: 1.6 }}>
              <strong>Motif :</strong> {pse.motif}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PSE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function PSEPage() {
  const [procedures,   setProcedures]  = useState<PSEProcedure[]>([]);
  const [stats,        setStats]       = useState<EcoStats | null>(null);
  const [loading,      setLoading]     = useState(true);
  const [showModal,    setShowModal]   = useState(false);
  const [tab,          setTab]         = useState<"actifs" | "historique">("actifs");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pseRes, statsRes] = await Promise.all([
        fetch("/api/pse", { credentials: "include" }),
        fetch("/api/contract-rupture/eco-stats", { credentials: "include" }),
      ]);
      if (pseRes.ok)   setProcedures(await pseRes.json());
      if (statsRes.ok) setStats(await statsRes.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const actifs     = procedures.filter(p => ["OUVERT","EN_COURS"].includes(p.status));
  const historique = procedures.filter(p => ["CLOTURE","ANNULE"].includes(p.status));
  const displayed  = tab === "actifs" ? actifs : historique;

  return (
    <div style={{ minHeight: "100vh", background: "#070d1a", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>

      {showModal && (
        <NouvelleProceduреModal onClose={() => setShowModal(false)} onCreated={() => { setShowModal(false); load(); }} />
      )}

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg,#0a1228,#111827,#0a1228)",
        borderBottom: "1px solid #1e2640", padding: "0 40px",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 64 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#7c3aed,#6d28d9)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px #7c3aed40", flexShrink: 0 }}>⚖️</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -.3 }}>Plan de Sauvegarde de l'Emploi</div>
            <div style={{ fontSize: 11, color: "#475569" }}>Art. 39 CT Congo — Licenciements économiques collectifs</div>
          </div>

          {stats?.pseRequired && (
            <div style={{ marginLeft: 12, padding: "5px 14px", borderRadius: 20, background: "#ef444420", border: "1px solid #ef444440", fontSize: 11, color: "#fca5a5", fontWeight: 800, animation: "pulse 2s infinite" }}>
              ⚠ PSE OBLIGATOIRE — {stats.total30j} licenciements éco / 30j
            </div>
          )}

          <div style={{ marginLeft: "auto", display: "flex", gap: 10 }}>
            <button onClick={() => load()} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", background: "#1e2640", border: "1px solid #334155", color: "#64748b", fontSize: 12 }}>↻</button>
            <button onClick={() => setShowModal(true)} style={{
              padding: "8px 18px", borderRadius: 9, cursor: "pointer", fontSize: 13, fontWeight: 700,
              background: "linear-gradient(135deg,#7c3aed,#6d28d9)", border: "none", color: "#fff",
              boxShadow: "0 4px 20px #7c3aed40",
            }}>+ Ouvrir une procédure PSE</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 28 }}>
          <StatCard label="Lic. éco — 30 jours"  value={stats?.total30j  ?? 0} sub="Seuil PSE = 5"          color={stats?.pseRequired ? "#ef4444" : "#f59e0b"} alert={stats?.pseRequired} />
          <StatCard label="Lic. éco — 90 jours"  value={stats?.total90j  ?? 0} sub="3 derniers mois"        color="#8b5cf6" />
          <StatCard label="Lic. éco — Année"     value={stats?.totalAnnee ?? 0} sub="Depuis le 1er janvier" color="#6366f1" />
          <StatCard label="Procédures PSE"        value={actifs.length}          sub={`${historique.length} clôturée(s)`} color="#4ade80" />
        </div>

        {/* Alerte légale si seuil atteint */}
        {stats?.pseRequired && (
          <div style={{
            marginBottom: 24, padding: "18px 22px", borderRadius: 14,
            background: "linear-gradient(135deg,#1a0a2e,#1e1040)",
            border: "1px solid #7c3aed40",
            display: "flex", gap: 18, alignItems: "flex-start",
          }}>
            <div style={{ fontSize: 28, flexShrink: 0 }}>⚖️</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#c4b5fd", marginBottom: 6 }}>
                Procédure PSE obligatoire — Article 39 du Code du Travail
              </div>
              <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.7 }}>
                Votre entreprise a procédé à <strong style={{ color: "#e2e8f0" }}>{stats.total30j} licenciements économiques</strong> au cours des 30 derniers jours, dépassant le seuil légal de <strong style={{ color: "#e2e8f0" }}>5 licenciements</strong>. Tout nouveau licenciement économique nécessite l'autorisation préalable de la Commission des Litiges du Travail et l'ouverture d'une procédure PSE.
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
                <button onClick={() => setShowModal(true)} style={{ padding: "8px 18px", borderRadius: 8, cursor: "pointer", background: "#7c3aed", border: "none", color: "#fff", fontSize: 13, fontWeight: 700 }}>Ouvrir une procédure PSE →</button>
                <a href="https://www.unicongo.cg" target="_blank" rel="noreferrer" style={{ padding: "8px 18px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid #334155", color: "#64748b", fontSize: 13, textDecoration: "none", display: "flex", alignItems: "center" }}>Consulter le CT Congo</a>
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#0a1228", padding: 4, borderRadius: 10, border: "1px solid #1e2640", width: "fit-content" }}>
          {[
            { key: "actifs"     as const, label: `Procédures actives (${actifs.length})` },
            { key: "historique" as const, label: `Historique (${historique.length})` },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              padding: "7px 18px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: tab === t.key ? "linear-gradient(135deg,#7c3aed,#6d28d9)" : "transparent",
              border: "none", color: tab === t.key ? "#fff" : "#475569", transition: "all .2s",
            }}>{t.label}</button>
          ))}
        </div>

        {/* Liste procédures */}
        {loading ? (
          <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>Chargement…</div>
        ) : displayed.length === 0 ? (
          <div style={{
            textAlign: "center", padding: "56px 32px",
            background: "#0d1421", borderRadius: 16, border: "1px dashed #1e2640",
          }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>⚖️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#334155", marginBottom: 8 }}>
              {tab === "actifs" ? "Aucune procédure PSE active" : "Aucune procédure clôturée"}
            </div>
            <div style={{ fontSize: 13, color: "#1e2640" }}>
              {tab === "actifs"
                ? "Une procédure PSE s'ouvre automatiquement si ≥ 5 licenciements économiques sur 30 jours."
                : "L'historique des procédures clôturées apparaîtra ici."}
            </div>
            {tab === "actifs" && (
              <button onClick={() => setShowModal(true)} style={{ marginTop: 20, padding: "10px 24px", borderRadius: 10, cursor: "pointer", background: "#1e2640", border: "1px solid #334155", color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>
                + Ouvrir manuellement une procédure
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {displayed.map(pse => (
              <PSECard key={pse.id} pse={pse} onUpdate={load} />
            ))}
          </div>
        )}

        {/* Notice légale */}
        <div style={{ marginTop: 32, padding: "14px 18px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e2640", fontSize: 11, color: "#334155", lineHeight: 1.7 }}>
          <strong style={{ color: "#475569" }}>📋 Rappel légal — Art. 39 CT Congo :</strong> Tout licenciement collectif pour motif économique de 5 salariés et plus sur une période de 30 jours est soumis à autorisation préalable de l'Inspecteur du Travail et à consultation des délégués du personnel. Le non-respect de cette procédure rend les licenciements nuls et de nul effet.
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.6} }`}</style>
    </div>
  );
}