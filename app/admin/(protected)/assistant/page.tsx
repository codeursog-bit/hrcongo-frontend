"use client";
import React, { useEffect, useState } from "react";
import { Save, RefreshCw, Search } from "lucide-react";
import {
  assistantAdmin,
  ASSISTANT_PLANS,
  type AssistantSettings,
  type AssistantUsage,
  type AssistantCompany,
} from "@/lib/assistant/admin";
import { GUIDES } from "@/lib/guides/catalog";
import { Card, Button, Input } from "@/components/design-system/primitives";
import { FancySelect } from "@/components/ui/FancySelect";
import "./assistant-admin.css";
export default function AssistantAdminPage() {
  const [settings, setSettings] = useState<AssistantSettings | null>(null),
    [usage, setUsage] = useState<AssistantUsage | null>(null),
    [companies, setCompanies] = useState<AssistantCompany[]>([]),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [search, setSearch] = useState(""),
    [companyBusy, setCompanyBusy] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [s, u, c] = await Promise.all([
        assistantAdmin.settings(),
        assistantAdmin.usage(),
        assistantAdmin.companies(),
      ]);
      setSettings(s);
      setUsage(u);
      setCompanies(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réglages indisponibles.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const {
        mode,
        analysisEnabled,
        killSwitch,
        guideEnabled,
        disabledGuides,
        retentionDays,
        planLimits,
        provider,
        model,
        licenseConfirmed,
        licenseProvider,
        licenseDate,
        licenseReference,
      } = settings;
      setSettings(
        await assistantAdmin.save({
          mode,
          analysisEnabled,
          killSwitch,
          guideEnabled,
          disabledGuides,
          retentionDays,
          planLimits,
          provider,
          model,
          licenseConfirmed,
          licenseProvider,
          licenseDate,
          licenseReference,
        }),
      );
      setMessage(
        "Les réglages sont enregistrés. Ils s’appliquent aux prochaines questions.",
      );
      setUsage(await assistantAdmin.usage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l’enregistrement.");
    } finally {
      setSaving(false);
    }
  };
  const searchCompanies = async () => {
    setError("");
    try {
      setCompanies(await assistantAdmin.companies(search));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Recherche indisponible.");
    }
  };
  const saveCompany = async (company: AssistantCompany) => {
    setCompanyBusy(company.id);
    setError("");
    try {
      await assistantAdmin.override(
        company.id,
        company.assistantOverride || { allowed: true, forceMode: null },
      );
      setMessage("Exception d’entreprise enregistrée.");
      setUsage(await assistantAdmin.usage());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Exception non enregistrée.");
    } finally {
      setCompanyBusy(null);
    }
  };
  const editCompany = (
    id: string,
    patch: Partial<NonNullable<AssistantCompany["assistantOverride"]>>,
  ) =>
    setCompanies((previous) =>
      previous.map((c) =>
        c.id === id
          ? {
              ...c,
              assistantOverride: {
                allowed: c.assistantOverride?.allowed ?? true,
                forceMode: c.assistantOverride?.forceMode ?? null,
                ...patch,
              },
            }
          : c,
      ),
    );
  return (
    <div className="assistant-admin">
      <header>
        <div>
          <h1>Agent Konza</h1>
          <p>
            Disponibilité, guides et quotas d’analyses. Aucun secret fournisseur
            dans cet écran.
          </p>
        </div>
        <div>
          <Button
            variant="secondary"
            onClick={() => void load()}
            disabled={loading || saving}
          >
            <RefreshCw size={16} strokeWidth={1.5} />
            Actualiser
          </Button>
          <Button
            onClick={() => void save()}
            disabled={!settings || loading}
            loading={saving}
          >
            <Save size={16} strokeWidth={1.5} />
            Enregistrer
          </Button>
        </div>
      </header>
      {error && (
        <p role="alert" className="k-tone-danger assistant-admin-notice">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="k-tone-success assistant-admin-notice">
          {message}
        </p>
      )}
      {loading && <p role="status">Chargement des réglages…</p>}
      {settings && (
        <>
          <Card title="Fonctionnement de la plateforme">
            <div className="assistant-admin-fields">
              <FancySelect
                label="Mode du chat"
                value={settings.mode}
                options={[
                  { value: "OFF", label: "Désactivé" },
                  { value: "INTEGRE", label: "Intégré — serveur Konza" },
                  {
                    value: "IA_AVANCEE",
                    label: "IA avancée — connecteur externe",
                  },
                ]}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    mode: value as AssistantSettings["mode"],
                  })
                }
              />
              <Input
                label="Conservation des conversations (jours)"
                type="number"
                min={1}
                max={90}
                step={1}
                value={settings.retentionDays}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    retentionDays: Number(e.target.value),
                  })
                }
              />
            </div>
            <label>
              <input
                type="checkbox"
                checked={settings.analysisEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    analysisEnabled: e.target.checked,
                  })
                }
              />
              Activer les outils d’analyse livrés pour ADMIN et RH
            </label>
            <label>
              <input
                type="checkbox"
                checked={settings.killSwitch}
                onChange={(e) =>
                  setSettings({ ...settings, killSwitch: e.target.checked })
                }
              />
              Bloquer tous les appels externes (interrupteur de sécurité : à
              décocher pour utiliser Gemini)
            </label>
            <p className="assistant-admin-muted">
              Le mode avancé exige la licence confirmée et un fournisseur
              configuré sur le serveur. Les calculs et les valeurs restent chez
              Konza. L’interrupteur externe conserve le fonctionnement intégré.
            </p>
          </Card>
          <Card title="Connecteur IA externe">
            <p className="assistant-admin-muted">
              Clé exclusivement dans ASSISTANT_API_KEY côté serveur. Ce premier
              connecteur compose une explication à partir de phrases vérifiées ;
              il ne reçoit ni question libre ni donnée RH brute.
            </p>
            <div className="assistant-admin-fields">
              <FancySelect
                label="Fournisseur"
                value={settings.provider || ""}
                options={[
                  { value: "", label: "Choisir" },
                  { value: "openai", label: "OpenAI / GPT" },
                  { value: "anthropic", label: "Anthropic / Claude" },
                  { value: "google", label: "Google / Gemini" },
                  { value: "mistral", label: "Mistral" },
                ]}
                onChange={(value) =>
                  setSettings({
                    ...settings,
                    provider: value,
                    licenseConfirmed: false,
                    licenseProvider: value,
                  })
                }
              />
              <Input
                label="Modèle (identique à ASSISTANT_MODEL)"
                value={settings.model || ""}
                onChange={(e) =>
                  setSettings({ ...settings, model: e.target.value })
                }
              />
              <Input
                label="Référence du contrat"
                value={settings.licenseReference || ""}
                onChange={(e) =>
                  setSettings({ ...settings, licenseReference: e.target.value })
                }
              />
              <Input
                label="Date du contrat"
                type="date"
                value={settings.licenseDate?.slice(0, 10) || ""}
                onChange={(e) =>
                  setSettings({ ...settings, licenseDate: e.target.value })
                }
              />
            </div>
            <label>
              <input
                type="checkbox"
                checked={settings.licenseConfirmed || false}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    licenseConfirmed: e.target.checked,
                    licenseProvider: settings.provider,
                  })
                }
              />
              Contrat sans conservation ni entraînement confirmé pour ce
              fournisseur
            </label>
            <Button
              variant="secondary"
              disabled={saving || settings.killSwitch}
              onClick={async () => {
                setSaving(true);
                setError("");
                setMessage("");
                try {
                  setMessage((await assistantAdmin.testModel()).message);
                } catch (e) {
                  setError(
                    e instanceof Error ? e.message : "Test indisponible.",
                  );
                } finally {
                  setSaving(false);
                }
              }}
            >
              Tester la connexion avec des données fictives
            </Button>
            {settings.killSwitch && (
              <p className="assistant-admin-muted">
                Le test est désactivé tant que l’interrupteur de sécurité
                ci-dessus est coché.
              </p>
            )}
            <p className="assistant-admin-muted">
              Le test utilise la configuration serveur actuelle, sans activer
              l’IA pour les clients. Pour l’activer : enregistrez la licence,
              choisissez IA avancée, décochez l’interrupteur de sécurité et
              vérifiez que l’entreprise a des crédits d’analyse.
            </p>
          </Card>
          <Card title="Guides pas à pas">
            <label>
              <input
                type="checkbox"
                checked={settings.guideEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, guideEnabled: e.target.checked })
                }
              />
              Autoriser les orientations, même quand le chat est désactivé
            </label>
            {GUIDES.map((g) => (
              <label key={g.id}>
                <input
                  type="checkbox"
                  checked={!settings.disabledGuides.includes(g.id)}
                  disabled={!settings.guideEnabled}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      disabledGuides: e.target.checked
                        ? settings.disabledGuides.filter((id) => id !== g.id)
                        : [...settings.disabledGuides, g.id],
                    })
                  }
                />
                {g.title}
              </label>
            ))}
          </Card>
          <Card title="Quotas partagés par entreprise">
            <p className="assistant-admin-muted">
              L’aide, les guides, les refus et les répétitions identiques dans
              les dix minutes ne consomment pas d’analyse. L’essai utilise son
              propre quota ; les autres forfaits suivent leur cycle mensuel de
              renouvellement. ENTERPRISE utilise un plafond d’usage raisonnable
              configurable.
            </p>
            <div className="assistant-admin-table">
              <table>
                <thead>
                  <tr>
                    <th>Forfait</th>
                    <th>Mode maximal</th>
                    <th>Analyses par période</th>
                  </tr>
                </thead>
                <tbody>
                  {ASSISTANT_PLANS.map((plan) => (
                    <tr key={plan}>
                      <th scope="row">{plan === "TRIAL" ? "Essai" : plan}</th>
                      <td>
                        <FancySelect
                          label={`Mode ${plan}`}
                          value={settings.planLimits[plan].maxMode}
                          options={[
                            { value: "OFF", label: "Désactivé" },
                            { value: "INTEGRE", label: "Intégré" },
                            { value: "IA_AVANCEE", label: "IA avancée" },
                          ]}
                          onChange={(value) =>
                            setSettings({
                              ...settings,
                              planLimits: {
                                ...settings.planLimits,
                                [plan]: {
                                  ...settings.planLimits[plan],
                                  maxMode: value,
                                },
                              },
                            })
                          }
                        />
                      </td>
                      <td>
                        <Input
                          label={`Quota ${plan}`}
                          type="number"
                          min={0}
                          max={100000}
                          step={1}
                          value={settings.planLimits[plan].monthlyAnalyses}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              planLimits: {
                                ...settings.planLimits,
                                [plan]: {
                                  ...settings.planLimits[plan],
                                  monthlyAnalyses: Number(e.target.value),
                                },
                              },
                            })
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
      <Card title="Exceptions par entreprise">
        <form
          className="assistant-admin-search"
          onSubmit={(e) => {
            e.preventDefault();
            void searchCompanies();
          }}
        >
          <Input
            label="Nom ou identifiant d’entreprise"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button variant="secondary" type="submit">
            <Search size={16} strokeWidth={1.5} />
            Rechercher
          </Button>
        </form>
        {companies.map((company) => (
          <section key={company.id} className="assistant-admin-company">
            <div>
              <h3>{company.legalName}</h3>
              <small>{company.id}</small>
            </div>
            <label>
              <input
                type="checkbox"
                checked={company.assistantOverride?.allowed !== false}
                onChange={(e) =>
                  editCompany(company.id, { allowed: e.target.checked })
                }
              />
              Chat autorisé
            </label>
            <FancySelect
              label="Restriction de mode"
              value={company.assistantOverride?.forceMode || "DEFAULT"}
              options={[
                { value: "DEFAULT", label: "Règles plateforme et forfait" },
                { value: "INTEGRE", label: "Intégré uniquement" },
                { value: "OFF", label: "Désactivé" },
              ]}
              onChange={(value) =>
                editCompany(company.id, {
                  forceMode:
                    value === "DEFAULT" ? null : (value as "OFF" | "INTEGRE"),
                })
              }
            />
            <Button
              variant="secondary"
              disabled={!!companyBusy}
              loading={companyBusy === company.id}
              onClick={() => void saveCompany(company)}
            >
              Enregistrer l’exception
            </Button>
          </section>
        ))}
        {!loading && !companies.length && (
          <p>Aucune entreprise ne correspond.</p>
        )}
      </Card>
      {usage && (
        <Card title="Usage et audit">
          <p>
            Depuis le {new Date(usage.from).toLocaleDateString("fr-FR")} :{" "}
            {usage.questions.toLocaleString("fr-FR")} questions ;{" "}
            {usage.conversations.toLocaleString("fr-FR")} conversations
            actuellement conservées.
          </p>
          <p>
            {usage.refusals} refus de sécurité ; {usage.upgradeClicks}{" "}
            consultations des offres.
            {usage.guideEvents.map((event) => (
              <span key={event.action}>
                {" "}
                {event.action === "GUIDE_STARTED"
                  ? "Guides démarrés"
                  : "Guides terminés"}{" "}
                : {event._count}.
              </span>
            ))}
          </p>
          <div className="assistant-admin-table">
            <table>
              <thead>
                <tr>
                  <th>Outil</th>
                  <th>Consomme le quota</th>
                  <th>Appels</th>
                </tr>
              </thead>
              <tbody>
                {usage.tools.map((t) => (
                  <tr key={t.tool + String(t.charged)}>
                    <td>{t.tool}</td>
                    <td>{t.charged ? "Oui" : "Non — répétition"}</td>
                    <td>{t._count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <h3>Derniers changements</h3>
          {usage.changes.map((change) => (
            <p key={change.id} className="assistant-admin-audit">
              <time>{new Date(change.createdAt).toLocaleString("fr-FR")}</time>
              <span>{change.description}</span>
              <small>Compte : {change.userId}</small>
            </p>
          ))}
        </Card>
      )}
    </div>
  );
}