"use client";
import { useEffect } from "react";
import { reportClientIncident } from "@/lib/client-incidents";
export default function GlobalError({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  useEffect(() => reportClientIncident(error, "REACT_ERROR"), [error]);
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: "system-ui",
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f5f6f7",
          color: "#242728",
        }}
      >
        <main style={{ maxWidth: 480, padding: 32 }}>
          <h1>La page ne peut pas s’afficher</h1>
          <p>Une erreur a interrompu le chargement. Vous pouvez réessayer.</p>
          <button
            onClick={reset}
            style={{ padding: "12px 20px", cursor: "pointer" }}
          >
            Réessayer
          </button>
          <p>
            <a href="/dashboard">Revenir au tableau de bord</a>
          </p>
        </main>
      </body>
    </html>
  );
}
