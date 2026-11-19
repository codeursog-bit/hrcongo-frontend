"use client";
import React, { useEffect, useState } from "react";
import { UserPlus } from "lucide-react";
import SupportInbox from "@/components/support/SupportInbox";
import { supportApi, type SupportAgent } from "@/lib/support/api";
import { authService } from "@/lib/services/authService";
import "@/components/support/support.css";
export default function SupportPage() {
  const [manage, setManage] = useState(false),
    [agents, setAgents] = useState<SupportAgent[]>([]),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [form, setForm] = useState({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
  const [superAdmin, setSuperAdmin] = useState(false);
  useEffect(() => {
    setSuperAdmin(authService.getCurrentUser()?.role === "SUPER_ADMIN");
  }, []);
  useEffect(() => {
    if (!manage) return;
    let active = true;
    supportApi
      .agents()
      .then((a) => {
        if (active) setAgents(a);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [manage]);
  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await supportApi.createAgent(form);
      setForm({ firstName: "", lastName: "", email: "", password: "" });
      setAgents(await supportApi.agents());
      setNotice(
        "Agent créé. Transmettez-lui son mot de passe provisoire par votre canal sécurisé ; il devra le changer.",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  }
  async function toggle(a: SupportAgent) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await supportApi.updateAgent(a.id, !a.isActive);
      setAgents(await supportApi.agents());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Modification impossible.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="support-admin">
      <header className="support-admin-header">
        <div>
          <h1>Support & relation clients</h1>
          <p>
            Un seul espace pour accompagner chaque personne, avec ou sans
            entreprise.
          </p>
        </div>
        {superAdmin && (
          <button
            className="support-secondary"
            onClick={() => setManage((v) => !v)}
          >
            <UserPlus size={17} />
            {manage ? "Retour aux messages" : "Agents support"}
          </button>
        )}
      </header>
      {error && (
        <p className="support-error" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="support-info" role="status">
          {notice}
        </p>
      )}
      {manage && superAdmin ? (
        <section className="support-agents">
          <h2>Votre équipe support</h2>
          <p className="support-muted">
            Ces comptes ont accès aux conversations support. Ils ne disposent
            pas des outils de gestion de la plateforme.
          </p>
          <form className="support-agent-form" onSubmit={create}>
            <label className="support-field">
              Prénom
              <input
                required
                maxLength={100}
                autoComplete="off"
                value={form.firstName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, firstName: e.target.value }))
                }
              />
            </label>
            <label className="support-field">
              Nom
              <input
                required
                maxLength={100}
                autoComplete="off"
                value={form.lastName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, lastName: e.target.value }))
                }
              />
            </label>
            <label className="support-field">
              E-mail
              <input
                required
                type="email"
                maxLength={255}
                autoComplete="off"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
            </label>
            <label className="support-field">
              Mot de passe provisoire
              <input
                required
                type="password"
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={form.password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, password: e.target.value }))
                }
              />
              <small>
                12 caractères minimum, à communiquer personnellement à l’agent.
              </small>
            </label>
            <button className="support-primary" disabled={busy}>
              {busy ? "Création…" : "Créer l’agent"}
            </button>
          </form>
          {agents.map((a) => (
            <div className="support-agent-row" key={a.id}>
              <div>
                <strong>
                  {a.firstName} {a.lastName}
                </strong>
                <small>
                  {a.email} · {a.isActive ? "Actif" : "Désactivé"}
                </small>
              </div>
              {a.role === "SUPPORT" && (
                <button
                  className="support-secondary"
                  disabled={busy}
                  onClick={() => void toggle(a)}
                >
                  {a.isActive ? "Désactiver" : "Réactiver"}
                </button>
              )}
            </div>
          ))}
        </section>
      ) : (
        <SupportInbox staff />
      )}
    </div>
  );
}
