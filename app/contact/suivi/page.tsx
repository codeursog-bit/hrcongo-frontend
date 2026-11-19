"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import SupportInbox from "@/components/support/SupportInbox";
import type { GuestAccess } from "@/lib/support/api";
import "@/components/support/support.css";
export default function ContactFollowUp() {
  const [access, setAccess] = useState<GuestAccess | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    const p = new URLSearchParams(window.location.hash.slice(1)),
      id = p.get("id"),
      token = p.get("token");
    if (
      id &&
      token &&
      /^[0-9a-f-]{36}$/i.test(id) &&
      /^[0-9a-f]{64}$/i.test(token)
    ) {
      const data = { id, token };
      sessionStorage.setItem("konza-support-guest", JSON.stringify(data));
      setAccess(data);
      history.replaceState(null, "", window.location.pathname);
    } else {
      try {
        const saved = JSON.parse(
          sessionStorage.getItem("konza-support-guest") || "null",
        );
        if (saved?.id && saved?.token) setAccess(saved);
      } catch {}
    }
    setReady(true);
  }, []);
  const stable = useMemo(() => access, [access]);
  return (
    <main className="support-guest-page">
      <Link href="/contact">Retour à Contact</Link>
      <h1>Votre conversation avec Konza</h1>
      <p className="support-muted">
        Ce suivi est personnel. Conservez le lien reçu par e-mail et ne le
        partagez pas.
      </p>
      {!ready ? (
        <p role="status">Ouverture de votre conversation…</p>
      ) : stable ? (
        <SupportInbox guest={stable} />
      ) : (
        <p className="support-info">
          Ouvrez le lien privé reçu lors de votre demande. Sans ce lien,
          contactez de nouveau notre équipe.
        </p>
      )}
    </main>
  );
}
