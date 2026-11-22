"use client";
import React, { useEffect, useRef, useState } from "react";
import { useGuide } from "./GuideProvider";

/**
 * Accueil de première arrivée : Sofia se présente et propose le guide « Premiers pas ».
 * Le serveur décide de l'éligibilité (créateur d'un compte neuf, jamais démarré ni masqué) :
 *  - « Commencer »        : lance le guide ; l'accueil ne reviendra plus.
 *  - « Plus tard »        : enregistré côté serveur, il revient à la prochaine connexion (sur tous les appareils).
 *  - « Ne plus afficher » : enregistré côté serveur, définitif sur tous les appareils.
 */
const GUIDE_ID = "getting-started";
const STEPS = [
  "Vérifier les informations de votre entreprise",
  "Créer vos primes et configurer vos taxes",
  "Ajouter vos employés",
  "Leur attribuer leurs primes",
  "Créer un premier bulletin de test",
];
export function WelcomeGuide({
  eligible,
  track,
  refresh,
}: {
  eligible: boolean;
  track: (id: string, state: "STARTED" | "COMPLETED" | "DISMISSED" | "POSTPONED", sessionId: string) => Promise<void> | void;
  refresh: () => Promise<void>;
}) {
  const guide = useGuide();
  const [later, setLater] = useState(false),
    [done, setDone] = useState(false),
    primary = useRef<HTMLButtonElement>(null);
  const open =
    eligible &&
    !later &&
    !done &&
    !!guide?.enabled &&
    !guide.active &&
    !guide.loading &&
    !guide.error &&
    !guide.disabledGuides.includes(GUIDE_ID);
  useEffect(() => {
    if (open) primary.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") postpone();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  if (!open) return null;
  const postpone = () => {
    setLater(true);
    void Promise.resolve(track(GUIDE_ID, "POSTPONED", crypto.randomUUID()));
  };
  const start = () => {
    setDone(true);
    guide?.start(GUIDE_ID);
    window.setTimeout(() => void refresh(), 1500);
  };
  const never = () => {
    setDone(true);
    void Promise.resolve(track(GUIDE_ID, "DISMISSED", crypto.randomUUID())).then(() => refresh());
  };
  return (
    <div className="welcome-guide-backdrop">
      <section
        className="welcome-guide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-guide-title"
      >
        <div className="welcome-guide-avatar" aria-hidden="true">S</div>
        <h2 id="welcome-guide-title">Bienvenue sur Konza !</h2>
        <p>
          Bonjour, je m’appelle <strong>Sofia</strong>, votre assistante Konza RH.
          Je vais vous guider pas à pas pour vos premières actions :
        </p>
        <ol>
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="welcome-guide-note">
          Rien n’est enregistré par le guide : vous gardez la main à chaque étape,
          et vous pourrez le relancer depuis le menu Guides. Prêt ?
        </p>
        <div className="welcome-guide-actions">
          <button ref={primary} className="k-button k-button-primary" onClick={start}>
            Commencer
          </button>
          <button className="k-button k-button-secondary" onClick={postpone}>
            Plus tard
          </button>
        </div>
        <button className="welcome-guide-never" onClick={never}>
          Ne plus afficher
        </button>
      </section>
    </div>
  );
}