"use client";
import React, { useState } from "react";
import { ArrowRight, Compass, Search } from "lucide-react";
import { Modal } from "@/components/design-system/feedback";
import { searchGuides } from "@/lib/guides/catalog";
import { useGuide } from "./GuideProvider";
export function GuideLauncher({
  placement = "topbar",
  onLaunch,
}: { placement?: "topbar" | "menu"; onLaunch?: () => void } = {}) {
  const context = useGuide(),
    [open, setOpen] = useState(false),
    [query, setQuery] = useState("");
  if (
    !context ||
    !context.enabled ||
    !["ADMIN", "HR_MANAGER"].includes(context.role)
  )
    return null;
  const guides = searchGuides(query, context.role).filter(
    (g) => !context.disabledGuides.includes(g.id),
  );
  return (
    <>
      <button
        data-guide="guide-launcher"
        type="button"
        className={
          placement === "topbar"
            ? "shell-icon-btn guide-launcher-desktop"
            : "shell-menu-item guide-launcher-mobile"
        }
        role={placement === "menu" ? "menuitem" : undefined}
        aria-label="Ouvrir les guides pas à pas"
        title="Guides pas à pas"
        disabled={context.active}
        onClick={() => setOpen(true)}
      >
        <Compass size={20} strokeWidth={1.5} />
        {placement === "menu" && <span>Guides pas à pas</span>}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Un coup de main, sur votre écran"
      >
        <p className="guide-intro">
          Choisissez un parcours. Le guide vous montre où cliquer, à votre
          rythme.
        </p>
        <label className="guide-search">
          <Search size={18} strokeWidth={1.5} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Paie, recrutement, employé…"
            aria-label="Rechercher un guide"
          />
        </label>
        <div className="guide-catalog">
          {context.loading ? (
            <p role="status">Vérification des parcours disponibles…</p>
          ) : context.error ? (
            <p role="alert">
              Impossible de vérifier votre abonnement. Réessayez après le
              chargement de la page.
            </p>
          ) : guides.length ? (
            guides.map((guide) => {
              const enabled =
                !guide.features ||
                guide.features.some((f) => context.hasFeature(f));
              return (
                <button
                  key={guide.id}
                  type="button"
                  disabled={!enabled}
                  onClick={() => {
                    setOpen(false);
                    context.start(guide.id);
                    onLaunch?.();
                  }}
                >
                  <span>
                    <strong>{guide.title}</strong>
                    <small>
                      {enabled
                        ? guide.description
                        : "Ce parcours nécessite une fonctionnalité de votre abonnement."}
                    </small>
                  </span>
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              );
            })
          ) : (
            <p>
              Aucun parcours ne correspond. Essayez « paie » ou « employé ».
            </p>
          )}
        </div>
        <p className="guide-footnote">
          Vous gardez la main. Le guide ne saisit rien et ne valide aucune
          opération.
        </p>
      </Modal>
    </>
  );
}
