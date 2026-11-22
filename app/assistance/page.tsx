"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/services/api";
import { authService } from "@/lib/services/authService";
import { getRedirectUrl } from "@/lib/redirectAfterLogin";
import SupportInbox from "@/components/support/SupportInbox";
import { canUseSupport } from "@/components/support/access";
import "@/components/support/support.css";
export default function Assistance() {
  const [user, setUser] = useState<{
      id: string;
      role: string;
      firstName?: string;
      companyId?: string | null;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    api
      .get<{
        id: string;
        role: string;
        firstName?: string;
        companyId?: string | null;
      }>("/auth/me")
      .then((u) => {
        if (active) setUser(u);
      })
      .catch(() => {
        if (active)
          setError(
            "Connectez-vous à votre compte pour retrouver vos conversations. Sans compte, écrivez-nous depuis Contact.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  const staff = user && ["SUPER_ADMIN", "SUPPORT"].includes(user.role);
  return (
    <main className="support-guest-page">
      <header className="support-admin-header">
        <div>
          <h1>Support Konza</h1>
          <p className="support-muted">
            Vos conversations avec notre équipe, même sans entreprise
            configurée.
          </p>
        </div>
        <Link
          href={
            user
              ? getRedirectUrl({ ...authService.getCurrentUser(), ...user })
              : "/contact"
          }
        >
          {user ? "Retour à mon espace" : "Contact"}
        </Link>
      </header>
      {error ? (
        <div className="support-info">
          <p>{error}</p>
          <Link href="/auth/login">Se connecter</Link> ·{" "}
          <Link href="/contact">Contacter Konza sans compte</Link>
        </div>
      ) : !user ? (
        <p role="status">Vérification de votre session…</p>
      ) : staff ? (
        <Link href="/admin/support">Ouvrir la boîte de réception support</Link>
      ) : !canUseSupport(user.role) ? (
        <div className="support-info">
          <p>
            Le support Konza est réservé aux administrateurs de votre
            entreprise. Pour toute question, écrivez à votre équipe RH depuis
            la messagerie.
          </p>
          <Link href="/messages">Ouvrir la messagerie</Link>
        </div>
      ) : (
        <SupportInbox key={user.id + ":" + user.role} />
      )}
    </main>
  );
}