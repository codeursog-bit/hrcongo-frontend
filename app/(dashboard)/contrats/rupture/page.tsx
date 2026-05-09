// ============================================================================
// 📁 src/pages/ContractRupturePage.tsx
//
// Page Rupture de Contrat — version production
// ✅ Vrais appels API (GET /employees, POST /contract-rupture/calculate, POST /contract-rupture)
// ✅ ConventionGuard intégré (modal si pas de convention)
// ✅ PSE intégré (alerte + redirection si ≥ 5 lic. éco / 30j)
// ✅ Documents téléchargeables (ouverture dans iframe + impression)
// ✅ Historique des ruptures
// ✅ UX 3 étapes conservée + améliorations
// ============================================================================

import { useState, useEffect, useRef, useCallback } from "react";
import { useConventionGuard } from "@/hooks/useConventionGuard";

// ─── Types API ───────────────────────────────────────────────────────────────
interface Employee {
  id: string; firstName: string; lastName: string;
  employeeNumber: string; position: string;
  contractType: string; hireDate: string;
  baseSalary: number; department?: { name: string };
  professionalCategory?: string; echelon?: string;
  cnssNumber?: string;
}

interface RuptureCalculation {
  meta: {
    conventionCode: string; conventionNom: string;
    categorieNum: number; categorieLabel: string | null;
    salaireMinimum: number; salaireConforme: boolean;
  };
  employee: {
    id: string; nom: string; matricule: string; poste: string;
    contractType: string; hireDate: string; ruptureDate: string;
    yearsOfService: number; monthsOfService: number; cnssNumber?: string;
  };
  salaires: { dernierBrut: number; avg3Mois: number; avg12Mois: number; salaireBase: number };
  preavis: { dureeJours: number; travaille: boolean; dispense: boolean; payePar: string; montant: number };
  indemnites: {
    licenciement: number; licenciementDetail: string;
    preavis: number; conges: number; congesDays: number; congesPris: number;
    gratification: number; gratificationDetail: string;
    dernierSalaire: number; dernierSalaireDays: number;
    autresSommes: number; autresSommesDetail: string;
  };
  totaux: { brutImposable: number; indemnitesExonerees: number; brutTotal: number; its: number; cnss: number; net: number };
  eligibilite: { aLicenciement: boolean; aPreavis: boolean; aConges: boolean; aGratification: boolean; isRetraite: boolean; raisons: string[] };
  alertes: string[];
}

interface HistoriqueRupture {
  id: string; ruptureType: string; ruptureDate: string;
  conventionCode: string; totalNet: number; status: string;
  employee?: { firstName: string; lastName: string; employeeNumber: string; position: string };
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const RUPTURE_TYPES = [
  { value: "DEMISSION",                 label: "Démission",               color: "#3b82f6", icon: "→",  desc: "À l'initiative du salarié" },
  { value: "LICENCIEMENT_FAUTE_SIMPLE", label: "Faute simple",            color: "#f59e0b", icon: "⚠",  desc: "Licenciement disciplinaire" },
  { value: "LICENCIEMENT_FAUTE_GRAVE",  label: "Faute grave",             color: "#ef4444", icon: "✕",  desc: "Sans indemnité ni préavis" },
  { value: "LICENCIEMENT_FAUTE_LOURDE", label: "Faute lourde",            color: "#dc2626", icon: "✕",  desc: "Préjudice intentionnel" },
  { value: "LICENCIEMENT_ECONOMIQUE",   label: "Licenciement éco.",        color: "#8b5cf6", icon: "📉", desc: "Suppression de poste" },
  { value: "RUPTURE_CONVENTIONNELLE",   label: "Rupture conventionnelle",  color: "#0ea5e9", icon: "⇌",  desc: "Accord commun" },
  { value: "FIN_CDD",                   label: "Fin de CDD",               color: "#64748b", icon: "□",  desc: "Terme du contrat" },
  { value: "FIN_PERIODE_ESSAI",         label: "Fin période d'essai",      color: "#94a3b8", icon: "◇",  desc: "Pendant l'essai" },
  { value: "RETRAITE",                  label: "Départ à la retraite",     color: "#10b981", icon: "★",  desc: "Barème retraite spécial" },
  { value: "INVALIDITE",               label: "Invalidité",               color: "#f97316", icon: "⊘",  desc: "Inaptitude médicale" },
];

const fmt    = (n: number) => new Intl.NumberFormat("fr-FR").format(Math.round(n));
const fmtD   = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const fmtDL  = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "long",  year: "numeric" });
const months = (a: string, b: string) => Math.floor((new Date(b).getTime() - new Date(a).getTime()) / (1000*60*60*24*30.44));

// ─── Helpers UI ───────────────────────────────────────────────────────────────
const S: Record<string, React.CSSProperties> = {
  input: { width: "100%", padding: "10px 13px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e293b", color: "#e2e8f0", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  card:  { background: "#0d1421", borderRadius: 16, padding: "20px 22px", border: "1px solid #1e2640" },
};

function Card({ title, icon, children, action }: { title: string; icon: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div style={S.card}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 15 }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>{title}</span>
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "#475569", fontWeight: 700, textTransform: "uppercase", letterSpacing: .5, marginBottom: 6 }}>
        {label}{req && <span style={{ color: "#ef4444", marginLeft: 3 }}>*</span>}
      </div>
      {children}
    </div>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: "#94a3b8" }}>
      <div onClick={onChange} style={{
        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
        background: checked ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e293b",
        border: `1px solid ${checked ? "#6366f1" : "#334155"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer", transition: "all .15s",
      }}>
        {checked && <span style={{ color: "#fff", fontSize: 11, lineHeight: 1 }}>✓</span>}
      </div>
      {label}
    </label>
  );
}

// ─── Alerte PSE ───────────────────────────────────────────────────────────────
function AlertePSE({ count, onDismiss }: { count: number; onDismiss: () => void }) {
  return (
    <div style={{
      position: "fixed", top: 80, right: 24, zIndex: 500, maxWidth: 400,
      background: "#1a0a2e", border: "1px solid #7c3aed", borderRadius: 16,
      padding: "20px 24px", boxShadow: "0 8px 40px #7c3aed30",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: "#7c3aed20",
          border: "1px solid #7c3aed40", display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 18, flexShrink: 0,
        }}>⚖️</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#c4b5fd", marginBottom: 6 }}>
            Plan de Sauvegarde de l'Emploi requis
          </div>
          <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6 }}>
            {count} licenciements économiques sur les 30 derniers jours. La loi congolaise (art. 39 CT) impose l'ouverture d'une procédure PSE avant tout licenciement supplémentaire.
          </div>
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button onClick={() => window.location.href = "contrats/rupture/pse"} style={{
              padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12, fontWeight: 700,
              background: "#7c3aed", border: "none", color: "#fff",
            }}>Ouvrir une procédure PSE</button>
            <button onClick={onDismiss} style={{
              padding: "7px 14px", borderRadius: 8, cursor: "pointer", fontSize: 12,
              background: "transparent", border: "1px solid #334155", color: "#64748b",
            }}>Ignorer</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE PRINCIPALE
// ═══════════════════════════════════════════════════════════════════════════════
export default function ContractRupturePage() {
  const { status: convStatus, predefined, showModal, activating, error: convError, activateConvention } = useConventionGuard();

  const [tab,          setTab]          = useState<"nouveau" | "historique">("nouveau");
  const [step,         setStep]         = useState<1 | 2 | 3>(1);
  const [employees,    setEmployees]     = useState<Employee[]>([]);
  const [empLoading,   setEmpLoading]    = useState(true);
  const [search,       setSearch]        = useState("");
  const [selectedEmp,  setSelectedEmp]   = useState<Employee | null>(null);
  const [form,         setForm]          = useState({
    ruptureType: "", ruptureDate: new Date().toISOString().split("T")[0],
    noticePeriodDays: 30, noticeWorked: false, noticeWaived: false,
    employerInitiated: true, congesPrisAnneeEnCours: 0,
    autresSommesDues: 0, autresSommesDetail: "", causeDetail: "",
    causeLabel: "", notes: "",
  });
  const [calc,         setCalc]          = useState<RuptureCalculation | null>(null);
  const [calcLoading,  setCalcLoading]   = useState(false);
  const [calcError,    setCalcError]     = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [ruptureId,    setRuptureId]     = useState<string | null>(null);
  const [pseCount,     setPseCount]      = useState(0);
  const [showPSE,      setShowPSE]       = useState(false);
  const [activeDoc,    setActiveDoc]     = useState<"lettre" | "certificat" | "cnss" | null>(null);
  const [docHtml,      setDocHtml]       = useState<string | null>(null);
  const [historique,   setHistorique]    = useState<HistoriqueRupture[]>([]);
  const [histLoading,  setHistLoading]   = useState(false);
  const calcRef                          = useRef<HTMLDivElement>(null);
  const iframeRef                        = useRef<HTMLIFrameElement>(null);

  // ── Charger les employés ──────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/employees?status=ACTIVE&limit=200", { credentials: "include" })
      .then(r => r.json())
      .then(d => setEmployees(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => setEmployees([]))
      .finally(() => setEmpLoading(false));
  }, []);

  // ── Charger l'historique ──────────────────────────────────────────────────
  const loadHistorique = useCallback(() => {
    setHistLoading(true);
    fetch("/api/contract-rupture?limit=50", { credentials: "include" })
      .then(r => r.json())
      .then(d => setHistorique(Array.isArray(d) ? d : d.data ?? []))
      .catch(() => setHistorique([]))
      .finally(() => setHistLoading(false));
  }, []);

  useEffect(() => { if (tab === "historique") loadHistorique(); }, [tab, loadHistorique]);

  const filteredEmps = employees.filter(e =>
    `${e.firstName} ${e.lastName} ${e.employeeNumber} ${e.position}`
      .toLowerCase().includes(search.toLowerCase())
  );

  const ruptureInfo = RUPTURE_TYPES.find(r => r.value === form.ruptureType);
  const anciennete  = selectedEmp && form.ruptureDate ? months(selectedEmp.hireDate, form.ruptureDate) : 0;

  // ── Preview (appel API) ───────────────────────────────────────────────────
  async function handlePreview() {
    if (!selectedEmp || !form.ruptureType) return;
    setCalcLoading(true);
    setCalcError(null);
    try {
      const res = await fetch("/api/contract-rupture/calculate", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmp.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erreur de calcul");

      // Alerte PSE
      if (form.ruptureType === "LICENCIEMENT_ECONOMIQUE") {
        const pseRes = await fetch("/api/contract-rupture/pse-check", { credentials: "include" });
        if (pseRes.ok) { const pse = await pseRes.json(); setPseCount(pse.count ?? 0); if ((pse.count ?? 0) >= 4) setShowPSE(true); }
      }

      setCalc(data);
      setStep(2);
      setTimeout(() => calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
    } catch (e: any) {
      setCalcError(e.message);
    } finally {
      setCalcLoading(false);
    }
  }

  // ── Confirmer (persister) ─────────────────────────────────────────────────
  async function handleConfirm() {
    if (!selectedEmp) return;
    setConfirmLoading(true);
    try {
      const res = await fetch("/api/contract-rupture", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId: selectedEmp.id, ...form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erreur lors de la clôture");
      setRuptureId(data.ruptureId);
      setStep(3);
    } catch (e: any) {
      setCalcError(e.message);
    } finally {
      setConfirmLoading(false);
    }
  }

  // ── Charger un document ───────────────────────────────────────────────────
  async function loadDocument(type: "lettre" | "certificat" | "cnss") {
    if (!ruptureId && step < 3) {
      setDocHtml("<p style='padding:20px;color:#64748b'>Confirmez d'abord la rupture pour générer les documents.</p>");
      setActiveDoc(type); return;
    }
    try {
      const res = await fetch(`/api/contract-rupture/${ruptureId}/document/${type}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const html = await res.text();
      setDocHtml(html);
      setActiveDoc(type);
    } catch {
      setDocHtml("<p style='padding:20px;color:#ef4444'>Erreur lors du chargement du document.</p>");
      setActiveDoc(type);
    }
  }

  function printDoc() {
    if (!iframeRef.current) return;
    iframeRef.current.contentWindow?.print();
  }

  function reset() {
    setStep(1); setCalc(null); setCalcError(null);
    setSelectedEmp(null); setRuptureId(null); setActiveDoc(null); setDocHtml(null);
    setForm(f => ({ ...f, ruptureType: "", causeDetail: "", causeLabel: "" }));
  }

  const pct = (n: number, t: number) => t > 0 ? Math.round((n / t) * 100) : 0;
  const brutTotal = calc?.totaux.brutTotal ?? 0;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#070d1a", fontFamily: "'DM Sans','Segoe UI',sans-serif", color: "#e2e8f0" }}>

      {/* ── Modal Convention Guard ── */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,.85)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0d1421", borderRadius: 20, border: "1px solid #1e293b", padding: "36px 32px", maxWidth: 680, width: "100%", maxHeight: "85vh", overflowY: "auto" }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 20, background: "#fbbf2415", border: "1px solid #fbbf2430", marginBottom: 14 }}>
                <span>⚠️</span><span style={{ fontSize: 11, color: "#fbbf24", fontWeight: 800, letterSpacing: .5 }}>CONVENTION COLLECTIVE REQUISE</span>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#e2e8f0", margin: "0 0 8px" }}>Choisissez votre convention collective</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0, lineHeight: 1.6 }}>Les barèmes légaux (indemnités, préavis, retraite) dépendent de la convention de votre secteur. Ce paramètre s'applique à toute l'entreprise.</p>
            </div>
            <ConventionModalInner predefined={predefined} activating={activating} error={convError} onSelect={activateConvention} />
          </div>
        </div>
      )}

      {/* ── Alerte PSE ── */}
      {showPSE && <AlertePSE count={pseCount} onDismiss={() => setShowPSE(false)} />}

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(135deg,#0a1228 0%,#111827 50%,#0a1228 100%)",
        borderBottom: "1px solid #1e2640", padding: "0 40px",
        position: "sticky", top: 0, zIndex: 100, backdropFilter: "blur(12px)",
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, height: 64 }}>
          {/* Logo module */}
          <div style={{ width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, boxShadow: "0 0 20px #6366f140", flexShrink: 0 }}>⚖</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -.3 }}>Rupture de Contrat</div>
            <div style={{ fontSize: 11, color: "#475569", marginTop: 1 }}>Solde de tout compte — Code du Travail Congo</div>
          </div>

          {/* Convention badge */}
          {convStatus?.hasConvention && (
            <div style={{ marginLeft: 16, padding: "4px 12px", borderRadius: 20, background: "#1e1b4b", border: "1px solid #6366f130", fontSize: 11, color: "#a5b4fc", fontWeight: 700, letterSpacing: .5 }}>
              {convStatus.conventionCode}
            </div>
          )}

          {/* Tabs */}
          <div style={{ marginLeft: "auto", display: "flex", gap: 4, background: "#0a1228", padding: 4, borderRadius: 10, border: "1px solid #1e2640" }}>
            {[
              { key: "nouveau" as const,    label: "Nouvelle rupture", icon: "+" },
              { key: "historique" as const, label: "Historique",       icon: "⊞" },
            ].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: "7px 16px", borderRadius: 7, cursor: "pointer", fontSize: 12, fontWeight: 700,
                background: tab === t.key ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "transparent",
                border: "none", color: tab === t.key ? "#fff" : "#475569",
                transition: "all .2s", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span>{t.icon}</span>{t.label}
              </button>
            ))}
          </div>

          {/* Stepper */}
          {tab === "nouveau" && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 16 }}>
              {[{n:1,l:"Saisie"},{n:2,l:"Calcul"},{n:3,l:"Clôture"}].map((s,i) => (
                <div key={s.n} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {i > 0 && <div style={{ width: 24, height: 1, background: step > i ? "#6366f1" : "#1e2640" }} />}
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: "50%", fontSize: 10, fontWeight: 800,
                      background: step >= s.n ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e2640",
                      color: step >= s.n ? "#fff" : "#334155",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: step === s.n ? "0 0 12px #6366f160" : "none",
                      transition: "all .3s",
                    }}>{step > s.n ? "✓" : s.n}</div>
                    <span style={{ fontSize: 11, color: step >= s.n ? "#a5b4fc" : "#334155", fontWeight: step === s.n ? 700 : 400 }}>{s.l}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contenu ── */}
      <div style={{ maxWidth: 1160, margin: "0 auto", padding: "32px 24px 80px" }}>

        {/* ══ HISTORIQUE ══ */}
        {tab === "historique" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: 0 }}>Historique des ruptures</h2>
              <button onClick={loadHistorique} style={{ padding: "7px 14px", borderRadius: 8, cursor: "pointer", background: "#1e2640", border: "1px solid #334155", color: "#94a3b8", fontSize: 12 }}>
                ↻ Actualiser
              </button>
            </div>
            {histLoading ? (
              <div style={{ textAlign: "center", padding: 48, color: "#475569" }}>Chargement…</div>
            ) : historique.length === 0 ? (
              <div style={{ textAlign: "center", padding: 48, color: "#334155" }}>Aucune rupture enregistrée</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {historique.map(r => {
                  const rt = RUPTURE_TYPES.find(t => t.value === r.ruptureType);
                  return (
                    <div key={r.id} style={{ background: "#0d1421", borderRadius: 12, border: "1px solid #1e2640", padding: "14px 18px", display: "flex", alignItems: "center", gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: `${rt?.color ?? "#475569"}15`, border: `1px solid ${rt?.color ?? "#475569"}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>{rt?.icon ?? "•"}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>{r.employee ? `${r.employee.firstName} ${r.employee.lastName}` : r.id}</div>
                        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                          {r.employee?.employeeNumber} · {rt?.label ?? r.ruptureType} · {fmtD(r.ruptureDate)}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: "#a5b4fc" }}>{fmt(r.totalNet)} FCFA</div>
                        <div style={{ fontSize: 10, color: "#334155", marginTop: 2 }}>
                          <span style={{ padding: "2px 8px", borderRadius: 20, background: r.status === "CONFIRME" ? "#14532d30" : "#1e3a5f30", color: r.status === "CONFIRME" ? "#4ade80" : "#60a5fa" }}>{r.status}</span>
                          {r.conventionCode && <span style={{ marginLeft: 6, color: "#475569" }}>{r.conventionCode}</span>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══ ÉTAPE 1 — FORMULAIRE ══ */}
        {tab === "nouveau" && step === 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 20 }}>

            {/* Colonne gauche — Employé */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <Card title="Employé concerné" icon="👤">
                <input placeholder="Rechercher nom, matricule, poste…" value={search}
                  onChange={e => setSearch(e.target.value)} style={{ ...S.input, marginBottom: 10 }} />
                {empLoading ? (
                  <div style={{ textAlign: "center", padding: 24, color: "#475569", fontSize: 13 }}>Chargement…</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 420, overflowY: "auto" }}>
                    {filteredEmps.length === 0 && (
                      <div style={{ padding: "16px 0", textAlign: "center", color: "#334155", fontSize: 13 }}>Aucun employé actif trouvé</div>
                    )}
                    {filteredEmps.map(e => {
                      const isSel = selectedEmp?.id === e.id;
                      return (
                        <button key={e.id} onClick={() => setSelectedEmp(e)} style={{
                          padding: "11px 13px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                          background: isSel ? "linear-gradient(135deg,#1e1b4b,#2d2a6e)" : "#0c1220",
                          border: `1px solid ${isSel ? "#6366f1" : "#1e2640"}`,
                          color: "#e2e8f0", transition: "all .18s",
                          boxShadow: isSel ? "0 0 18px #6366f125" : "none",
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700 }}>{e.firstName} {e.lastName}</div>
                              <div style={{ fontSize: 11, color: "#64748b", marginTop: 1 }}>{e.employeeNumber} · {e.position}</div>
                              {e.department && <div style={{ fontSize: 10, color: "#334155", marginTop: 1 }}>{e.department.name}</div>}
                            </div>
                            <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: e.contractType === "CDI" ? "#1e3a5f" : "#1e2640", color: e.contractType === "CDI" ? "#60a5fa" : "#94a3b8", fontWeight: 700, letterSpacing: .5, flexShrink: 0 }}>{e.contractType}</span>
                          </div>
                          {isSel && form.ruptureDate && (
                            <div style={{ marginTop: 8, padding: "6px 10px", background: "#312e8140", borderRadius: 7, fontSize: 11, color: "#a5b4fc" }}>
                              Ancienneté : <strong>{Math.floor(anciennete/12)} ans {anciennete%12} mois</strong>
                              {e.professionalCategory && <span style={{ marginLeft: 8, color: "#6366f1" }}>Cat. {e.professionalCategory}</span>}
                              {anciennete < 18 && <span style={{ color: "#fca5a5", marginLeft: 8 }}>⚠ &lt; 18 mois</span>}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>

            {/* Colonne droite — Paramètres */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Type de rupture */}
              <Card title="Nature de la rupture" icon="⚡">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {RUPTURE_TYPES.map(r => {
                    const isSel = form.ruptureType === r.value;
                    return (
                      <button key={r.value} onClick={() => setForm(f => ({ ...f, ruptureType: r.value }))} style={{
                        padding: "11px 14px", borderRadius: 10, textAlign: "left", cursor: "pointer",
                        background: isSel ? `${r.color}18` : "#0c1220",
                        border: `1px solid ${isSel ? r.color : "#1e2640"}`,
                        color: isSel ? r.color : "#475569", fontSize: 12,
                        fontWeight: isSel ? 700 : 400, transition: "all .18s",
                        boxShadow: isSel ? `0 0 14px ${r.color}25` : "none",
                        display: "flex", flexDirection: "column", gap: 4,
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 15 }}>{r.icon}</span>
                          <span>{r.label}</span>
                        </div>
                        <div style={{ fontSize: 10, color: isSel ? `${r.color}99` : "#334155", paddingLeft: 24 }}>{r.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Dates & préavis */}
              <Card title="Dates & préavis" icon="📅">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <Field label="Date de rupture" req>
                    <input type="date" value={form.ruptureDate} onChange={e => setForm(f => ({...f, ruptureDate: e.target.value}))} style={S.input} />
                  </Field>
                  <Field label="Durée préavis (jours)">
                    <input type="number" min={0} value={form.noticePeriodDays} onChange={e => setForm(f => ({...f, noticePeriodDays: +e.target.value}))} style={S.input} />
                  </Field>
                  <Field label="Congés pris (jours)">
                    <input type="number" min={0} max={26} value={form.congesPrisAnneeEnCours} onChange={e => setForm(f => ({...f, congesPrisAnneeEnCours: +e.target.value}))} style={S.input} />
                  </Field>
                </div>
                <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                  <Checkbox checked={form.noticeWorked}     onChange={() => setForm(f => ({...f, noticeWorked: !f.noticeWorked}))}     label="Préavis travaillé" />
                  <Checkbox checked={form.noticeWaived}     onChange={() => setForm(f => ({...f, noticeWaived: !f.noticeWaived}))}     label="Préavis dispensé" />
                  <Checkbox checked={form.employerInitiated} onChange={() => setForm(f => ({...f, employerInitiated: !f.employerInitiated}))} label="Rupture à l'initiative de l'employeur" />
                </div>
              </Card>

              {/* Motif & autres */}
              <Card title="Motif & compléments" icon="📝">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <Field label="Libellé motif">
                    <input value={form.causeLabel} onChange={e => setForm(f => ({...f, causeLabel: e.target.value}))} placeholder="ex: Insuffisance professionnelle" style={S.input} />
                  </Field>
                  <Field label="Autres sommes dues (FCFA)">
                    <input type="number" min={0} value={form.autresSommesDues} onChange={e => setForm(f => ({...f, autresSommesDues: +e.target.value}))} style={S.input} />
                  </Field>
                </div>
                <Field label="Détail du motif / faits">
                  <textarea rows={3} value={form.causeDetail} onChange={e => setForm(f => ({...f, causeDetail: e.target.value}))} placeholder="Description détaillée des faits…" style={{ ...S.input, resize: "vertical", minHeight: 72 }} />
                </Field>
              </Card>

              {/* Erreur */}
              {calcError && (
                <div style={{ padding: "12px 16px", borderRadius: 10, background: "#ef444415", border: "1px solid #ef444430", fontSize: 13, color: "#fca5a5" }}>
                  ❌ {calcError}
                </div>
              )}

              {/* CTA */}
              <button onClick={handlePreview}
                disabled={!selectedEmp || !form.ruptureType || !form.ruptureDate || calcLoading}
                style={{
                  padding: "15px 32px", borderRadius: 12, cursor: selectedEmp && form.ruptureType ? "pointer" : "not-allowed",
                  background: selectedEmp && form.ruptureType ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e2640",
                  border: "none", color: selectedEmp && form.ruptureType ? "#fff" : "#334155",
                  fontSize: 14, fontWeight: 800, transition: "all .3s",
                  boxShadow: selectedEmp && form.ruptureType ? "0 4px 28px #6366f145" : "none",
                  opacity: calcLoading ? .7 : 1,
                }}>
                {calcLoading ? "⏳ Calcul en cours…" : "→ Calculer le solde de tout compte"}
              </button>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 2 — RÉSULTATS ══ */}
        {tab === "nouveau" && step === 2 && calc && (
          <div ref={calcRef}>
            <button onClick={() => setStep(1)} style={{ marginBottom: 20, padding: "7px 16px", borderRadius: 8, cursor: "pointer", background: "transparent", border: "1px solid #1e2640", color: "#64748b", fontSize: 13 }}>
              ← Modifier
            </button>

            {/* Header employé */}
            <div style={{
              background: "linear-gradient(135deg,#0d1421,#1a1040)",
              borderRadius: 16, padding: "22px 26px", marginBottom: 20,
              border: "1px solid #1e2640", display: "flex", justifyContent: "space-between", alignItems: "center",
              boxShadow: "0 0 40px #6366f108",
            }}>
              <div>
                <div style={{ fontSize: 11, color: ruptureInfo?.color ?? "#6366f1", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                  {ruptureInfo?.icon} {ruptureInfo?.label}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -.5 }}>{calc.employee.nom}</div>
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 3 }}>
                  {calc.employee.matricule} · {calc.employee.poste} · {calc.employee.contractType} ·
                  <span style={{ marginLeft: 6, color: "#6366f1" }}>{calc.meta.conventionCode}</span>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, color: "#475569", marginBottom: 2 }}>Ancienneté</div>
                <div style={{ fontSize: 26, fontWeight: 800, color: "#a5b4fc" }}>
                  {Math.floor(calc.employee.yearsOfService)} ans {calc.employee.monthsOfService % 12} mois
                </div>
                <div style={{ fontSize: 11, color: "#334155", marginTop: 2 }}>
                  {fmtD(calc.employee.hireDate)} → {fmtD(calc.employee.ruptureDate)}
                </div>
                {!calc.meta.salaireConforme && (
                  <div style={{ marginTop: 6, fontSize: 11, color: "#fbbf24", padding: "3px 10px", borderRadius: 20, background: "#fbbf2415", border: "1px solid #fbbf2430" }}>
                    ⚠ Salaire sous le minimum conventionnel
                  </div>
                )}
              </div>
            </div>

            {/* Alertes */}
            {calc.alertes.length > 0 && (
              <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 6 }}>
                {calc.alertes.map((a, i) => (
                  <div key={i} style={{ padding: "10px 14px", borderRadius: 10, background: a.startsWith("⚠") ? "#fbbf2415" : "#60a5fa15", border: `1px solid ${a.startsWith("⚠") ? "#fbbf2430" : "#60a5fa30"}`, fontSize: 12, color: a.startsWith("⚠") ? "#fbbf24" : "#60a5fa" }}>{a}</div>
                ))}
              </div>
            )}

            {/* Éligibilité */}
            {calc.eligibilite.raisons.length > 0 && (
              <div style={{ marginBottom: 16, padding: "12px 16px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e2640", display: "flex", flexWrap: "wrap", gap: 8 }}>
                {calc.eligibilite.raisons.map((r, i) => (
                  <span key={i} style={{ fontSize: 12, color: r.startsWith("✅") ? "#4ade80" : r.startsWith("❌") ? "#f87171" : "#94a3b8" }}>{r}</span>
                ))}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20, marginBottom: 20 }}>

              {/* Décompte principal */}
              <Card title="Décompte — Solde de tout compte" icon="🧾">
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {[
                    { label: calc.eligibilite.isRetraite ? "Indemnité de retraite" : "Indemnité de licenciement", value: calc.indemnites.licenciement, detail: calc.indemnites.licenciementDetail, tag: "Exonérée ITS", tagColor: "#4ade80", show: calc.indemnites.licenciement > 0 },
                    { label: `Congés payés non pris (${Math.round(calc.indemnites.congesDays*10)/10} j — ${calc.indemnites.congesPris} j pris)`, value: calc.indemnites.conges, tag: "Art. 127 CT · Toujours dû", tagColor: "#60a5fa", show: true },
                    { label: `Gratification proratisée`, value: calc.indemnites.gratification, detail: calc.indemnites.gratificationDetail, tag: "Légale obligatoire", tagColor: "#a78bfa", show: calc.eligibilite.aGratification },
                    { label: `Préavis compensatoire (${calc.preavis.dureeJours} j) — payé par ${calc.preavis.payePar}`, value: calc.indemnites.preavis, tag: "Imposable ITS", tagColor: "#fbbf24", show: calc.eligibilite.aPreavis },
                    { label: `Dernier salaire proratisé (${calc.indemnites.dernierSalaireDays} j)`, value: calc.indemnites.dernierSalaire, show: calc.indemnites.dernierSalaire > 0 },
                    ...(calc.indemnites.autresSommes > 0 ? [{ label: calc.indemnites.autresSommesDetail || "Autres sommes dues", value: calc.indemnites.autresSommes, show: true }] : []),
                  ].filter(r => r.show).map((row, i) => (
                    <div key={i} style={{ padding: "12px 14px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e2640", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#e2e8f0" }}>{row.label}</div>
                        {row.detail && <div style={{ fontSize: 11, color: "#475569", marginTop: 2 }}>{row.detail}</div>}
                        {row.tag && <span style={{ display: "inline-block", marginTop: 5, fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${row.tagColor}15`, color: row.tagColor, border: `1px solid ${row.tagColor}25` }}>{row.tag}</span>}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <div style={{ fontSize: 16, fontWeight: 800 }}>{fmt(row.value)}</div>
                        <div style={{ fontSize: 10, color: "#334155" }}>FCFA</div>
                      </div>
                    </div>
                  ))}

                  {/* Séparateur totaux */}
                  <div style={{ borderTop: "1px solid #1e2640", paddingTop: 12, marginTop: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div style={{ padding: "14px 16px", borderRadius: 10, background: "#0c1220", border: "1px solid #1e2640" }}>
                      <div style={{ fontSize: 10, color: "#475569", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Brut imposable</div>
                      <div style={{ fontSize: 16, fontWeight: 700 }}>{fmt(calc.totaux.brutImposable)} <span style={{ fontSize: 11, color: "#334155" }}>FCFA</span></div>
                      {calc.totaux.its > 0 && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 4 }}>− ITS {fmt(calc.totaux.its)} FCFA (8%)</div>}
                    </div>
                    <div style={{ padding: "14px 16px", borderRadius: 10, background: "linear-gradient(135deg,#0d1421,#1a1040)", border: "1px solid #6366f130" }}>
                      <div style={{ fontSize: 10, color: "#6366f1", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4, fontWeight: 800 }}>Total NET à payer</div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "#a5b4fc" }}>{fmt(calc.totaux.net)} <span style={{ fontSize: 11, color: "#6366f160" }}>FCFA</span></div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "#334155", textAlign: "right", paddingRight: 2 }}>
                    Total brut : {fmt(brutTotal)} FCFA · Indemnités exonérées : {fmt(calc.totaux.indemnitesExonerees)} FCFA
                  </div>
                </div>
              </Card>

              {/* Panneau latéral droit */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

                {/* Répartition */}
                <Card title="Répartition" icon="📊">
                  {[
                    { l: "Licenciement", v: calc.indemnites.licenciement, c: "#6366f1" },
                    { l: "Congés",       v: calc.indemnites.conges,       c: "#0ea5e9" },
                    { l: "Gratification",v: calc.indemnites.gratification, c: "#10b981" },
                    { l: "Préavis",      v: calc.indemnites.preavis,      c: "#f59e0b" },
                    { l: "Dernier sal.", v: calc.indemnites.dernierSalaire,c: "#8b5cf6" },
                  ].filter(r => r.v > 0).map(r => (
                    <div key={r.l} style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: "#94a3b8" }}>{r.l}</span>
                        <span style={{ color: r.c, fontWeight: 700 }}>{pct(r.v, brutTotal)}%</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 3, background: "#0c1220", overflow: "hidden" }}>
                        <div style={{ width: `${pct(r.v, brutTotal)}%`, height: "100%", background: r.c, borderRadius: 3, boxShadow: `0 0 6px ${r.c}50`, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  ))}
                </Card>

                {/* Préavis */}
                <Card title="Préavis" icon="📋">
                  {[
                    { k: "Durée",    v: `${calc.preavis.dureeJours} jours` },
                    { k: "Statut",   v: calc.preavis.travaille ? "Travaillé" : calc.preavis.dispense ? "Dispensé" : "Non applicable" },
                    { k: "Payé par", v: calc.preavis.payePar },
                    { k: "Montant",  v: `${fmt(calc.preavis.montant)} FCFA` },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "8px 12px", background: "#0c1220", borderRadius: 8, fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: "#64748b" }}>{k}</span>
                      <span style={{ fontWeight: 700 }}>{v}</span>
                    </div>
                  ))}
                </Card>

                {/* Salaires de référence */}
                <Card title="Bases de calcul" icon="💰">
                  {[
                    { k: "Dernier brut", v: fmt(calc.salaires.dernierBrut) },
                    { k: "Moy. 3 mois",  v: fmt(calc.salaires.avg3Mois) },
                    { k: "Moy. 12 mois", v: fmt(calc.salaires.avg12Mois) },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "7px 12px", background: "#0c1220", borderRadius: 8, fontSize: 12, marginBottom: 5 }}>
                      <span style={{ color: "#64748b" }}>{k}</span>
                      <span style={{ fontWeight: 700, color: "#94a3b8" }}>{v} FCFA</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>

            {/* Documents */}
            <Card title="Documents officiels" icon="📄">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: activeDoc ? 16 : 0 }}>
                {[
                  { key: "lettre"      as const, icon: "✉️",  label: "Lettre de notification",  sub: "Art. 46 CT Congo" },
                  { key: "certificat"  as const, icon: "🏅",  label: "Certificat de travail",     sub: "Exempté de timbre" },
                  { key: "cnss"        as const, icon: "🏛️", label: "Attestation CNSS",           sub: "Cessation d'activité" },
                ].map(d => (
                  <button key={d.key} onClick={() => loadDocument(d.key)} style={{
                    padding: "18px 14px", borderRadius: 12, cursor: "pointer", textAlign: "center",
                    background: activeDoc === d.key ? "linear-gradient(135deg,#1e1b4b,#2d2a6e)" : "#0c1220",
                    border: `1px solid ${activeDoc === d.key ? "#6366f1" : "#1e2640"}`,
                    color: "#e2e8f0", transition: "all .2s",
                    boxShadow: activeDoc === d.key ? "0 0 18px #6366f125" : "none",
                  }}>
                    <div style={{ fontSize: 26, marginBottom: 8 }}>{d.icon}</div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>{d.label}</div>
                    <div style={{ fontSize: 10, color: "#475569", marginTop: 3 }}>{d.sub}</div>
                  </button>
                ))}
              </div>

              {activeDoc && (
                <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid #1e2640" }}>
                  <div style={{ padding: "10px 16px", background: "#0c1220", borderBottom: "1px solid #1e2640", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>
                      Aperçu — {activeDoc === "lettre" ? "Lettre de notification" : activeDoc === "certificat" ? "Certificat de travail" : "Attestation CNSS"}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={printDoc} style={{ padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#6366f1", border: "none", color: "#fff", fontSize: 12, fontWeight: 600 }}>🖨 Imprimer</button>
                      <button onClick={() => setActiveDoc(null)} style={{ padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#1e2640", border: "1px solid #334155", color: "#64748b", fontSize: 12 }}>✕</button>
                    </div>
                  </div>
                  {docHtml ? (
                    <iframe ref={iframeRef} srcDoc={docHtml} style={{ width: "100%", height: 500, border: "none", background: "#fff" }} title="Document preview" />
                  ) : (
                    <div style={{ padding: 32, textAlign: "center", color: "#475569", fontSize: 13 }}>Chargement du document…</div>
                  )}
                </div>
              )}
            </Card>

            {/* Erreur confirm */}
            {calcError && (
              <div style={{ marginTop: 12, padding: "12px 16px", borderRadius: 10, background: "#ef444415", border: "1px solid #ef444430", fontSize: 13, color: "#fca5a5" }}>❌ {calcError}</div>
            )}

            {/* CTA Confirmer */}
            <div style={{ marginTop: 20, display: "flex", gap: 14, alignItems: "center" }}>
              <button onClick={handleConfirm} disabled={confirmLoading} style={{
                padding: "15px 40px", borderRadius: 12, cursor: "pointer",
                background: "linear-gradient(135deg,#10b981,#059669)",
                border: "none", color: "#fff", fontSize: 14, fontWeight: 800,
                boxShadow: "0 4px 28px #10b98145", transition: "all .3s",
                opacity: confirmLoading ? .7 : 1,
              }}>
                {confirmLoading ? "⏳ Enregistrement…" : "✓ Confirmer & clôturer le contrat"}
              </button>
              <div style={{ fontSize: 12, color: "#334155", lineHeight: 1.5 }}>
                Mettra à jour le statut de l'employé,<br />enregistrera la rupture en base de données
              </div>
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 3 — CLÔTURE ══ */}
        {tab === "nouveau" && step === 3 && calc && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", margin: "0 auto 24px", background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, boxShadow: "0 0 50px #10b98145" }}>✓</div>
            <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -.5, marginBottom: 8 }}>Contrat clôturé</div>
            <div style={{ color: "#64748b", fontSize: 14, marginBottom: 32 }}>
              La rupture de <strong style={{ color: "#e2e8f0" }}>{calc.employee.nom}</strong> a été enregistrée avec succès.
              {ruptureId && <span style={{ display: "block", fontSize: 11, color: "#334155", marginTop: 4 }}>ID : {ruptureId}</span>}
            </div>
            <div style={{ display: "inline-grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, marginBottom: 36, padding: "24px 32px", background: "#0d1421", borderRadius: 16, border: "1px solid #1e2640" }}>
              {[
                { l: "Total NET versé",  v: `${fmt(calc.totaux.net)} FCFA`,  c: "#a5b4fc" },
                { l: "Ancienneté",       v: `${Math.floor(calc.employee.yearsOfService)} ans`, c: "#60a5fa" },
                { l: "Convention",       v: calc.meta.conventionCode,         c: "#818cf8" },
                { l: "Motif",            v: ruptureInfo?.label ?? "",         c: "#94a3b8" },
              ].map(({ l, v, c }) => (
                <div key={l}>
                  <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: c }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Documents post-clôture */}
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 32 }}>
              {(["lettre","certificat","cnss"] as const).map(d => (
                <button key={d} onClick={() => loadDocument(d)} style={{ padding: "9px 18px", borderRadius: 9, cursor: "pointer", background: "#0d1421", border: "1px solid #1e2640", color: "#94a3b8", fontSize: 12, fontWeight: 600 }}>
                  {d === "lettre" ? "✉️ Lettre" : d === "certificat" ? "🏅 Certificat" : "🏛️ CNSS"}
                </button>
              ))}
            </div>

            {activeDoc && docHtml && (
              <div style={{ maxWidth: 860, margin: "0 auto 32px", borderRadius: 12, overflow: "hidden", border: "1px solid #1e2640" }}>
                <div style={{ padding: "10px 16px", background: "#0c1220", borderBottom: "1px solid #1e2640", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#a5b4fc" }}>Aperçu document</span>
                  <button onClick={printDoc} style={{ padding: "5px 12px", borderRadius: 7, cursor: "pointer", background: "#6366f1", border: "none", color: "#fff", fontSize: 12 }}>🖨 Imprimer</button>
                </div>
                <iframe ref={iframeRef} srcDoc={docHtml} style={{ width: "100%", height: 440, border: "none", background: "#fff" }} title="Document" />
              </div>
            )}

            <button onClick={reset} style={{ padding: "12px 28px", borderRadius: 10, cursor: "pointer", background: "#1e2640", border: "1px solid #334155", color: "#e2e8f0", fontSize: 13, fontWeight: 600 }}>
              + Nouvelle rupture de contrat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sous-composant modal convention (interne) ────────────────────────────────
function ConventionModalInner({ predefined, activating, error, onSelect }: {
  predefined: any[]; activating: boolean; error: string | null; onSelect: (code: string) => Promise<boolean>;
}) {
  const [sel, setSel] = useState("");
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(190px,1fr))", gap: 8, marginBottom: 20 }}>
        {predefined.map(c => (
          <button key={c.code} onClick={() => setSel(c.code)} style={{
            padding: "13px 15px", borderRadius: 11, textAlign: "left", cursor: "pointer", transition: "all .18s",
            background: sel === c.code ? "#1e1b4b" : "#0c1220", border: `1px solid ${sel === c.code ? "#6366f1" : "#1e2640"}`,
            boxShadow: sel === c.code ? "0 0 18px #6366f120" : "none",
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: sel === c.code ? "#a5b4fc" : "#334155", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>{c.code}</div>
            <div style={{ fontSize: 12, color: sel === c.code ? "#e2e8f0" : "#64748b", fontWeight: 600, lineHeight: 1.3 }}>{c.name.replace(c.code + " - ", "")}</div>
          </button>
        ))}
      </div>
      {error && <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 14, background: "#ef444415", border: "1px solid #ef444430", fontSize: 12, color: "#fca5a5" }}>❌ {error}</div>}
      <button onClick={() => sel && onSelect(sel)} disabled={!sel || activating} style={{
        width: "100%", padding: 15, borderRadius: 11, cursor: sel ? "pointer" : "not-allowed",
        background: sel ? "linear-gradient(135deg,#6366f1,#8b5cf6)" : "#1e2640",
        border: "none", color: sel ? "#fff" : "#334155", fontSize: 14, fontWeight: 800,
        boxShadow: sel ? "0 4px 28px #6366f140" : "none", opacity: activating ? .7 : 1,
      }}>
        {activating ? "⏳ Activation…" : sel ? `✓ Activer ${sel}` : "Sélectionnez une convention"}
      </button>
    </>
  );
}