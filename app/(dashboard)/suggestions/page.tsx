"use client";
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lightbulb, Send } from "lucide-react";
import {
  Button,
  Card,
  Input,
  Textarea,
} from "@/components/design-system/primitives";
import { supportApi } from "@/lib/support/api";
import { authService } from "@/lib/services/authService";
import { canUseSupport } from "@/components/support/access";
import { DEMO_MODE } from "@/lib/demo/config";
import "./suggestions.css";

export default function SuggestionsPage() {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<{ key: string; id: string } | null>(null);
  const sending = useRef(false);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const role = (authService.getCurrentUser() as { role?: string } | null)
      ?.role;
    setBlocked(!canUseSupport(role));
  }, []);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (
      sending.current ||
      DEMO_MODE ||
      subject.trim().length < 3 ||
      !body.trim()
    )
      return;
    sending.current = true;
    setBusy(true);
    setError("");
    const key = JSON.stringify([subject.trim(), body.trim()]);
    if (request.current?.key !== key)
      request.current = { key, id: crypto.randomUUID() };
    try {
      await supportApi.create({
        subject: subject.trim(),
        body: body.trim(),
        category: "SUGGESTION",
        clientId: request.current.id,
      });
      setSent(true);
    } catch {
      setError(
        "Votre idée n’a pas pu être confirmée. Réessayez : le même envoi ne sera pas enregistré deux fois.",
      );
    } finally {
      sending.current = false;
      setBusy(false);
    }
  }
  if (blocked)
    return (
      <main className="product-suggestions">
        <Link href="/dashboard" className="product-suggestions-back">
          <ArrowLeft size={16} strokeWidth={1.5} />
          Retour au tableau de bord
        </Link>
        <Card>
          <p>
            Les suggestions à l’équipe Konza sont réservées aux
            administrateurs de l’entreprise. Partagez votre idée avec votre
            équipe RH depuis la messagerie.
          </p>
          <Link href="/messages">Ouvrir la messagerie</Link>
        </Card>
      </main>
    );
  return (
    <main className="product-suggestions">
      <Link href="/dashboard" className="product-suggestions-back">
        <ArrowLeft size={16} strokeWidth={1.5} />
        Retour au tableau de bord
      </Link>
      <header>
        <Lightbulb size={28} strokeWidth={1.5} />
        <div>
          <h1>Une idée pour améliorer Konza ?</h1>
          <p>
            Une nouvelle fonctionnalité, une tâche à simplifier : partagez ce
            qui ferait la différence pour votre équipe.
          </p>
        </div>
      </header>
      {sent ? (
        <Card className="product-suggestions-success">
          <CheckCircle2 size={40} strokeWidth={1.5} />
          <h2>Merci pour votre idée</h2>
          <p>
            Elle a été transmise à l’équipe Konza comme suggestion de
            fonctionnalité. Son envoi ne garantit pas sa réalisation ; nous
            pourrons vous répondre dans votre messagerie.
          </p>
          <Button
            onClick={() => {
              setSent(false);
              setSubject("");
              setBody("");
              request.current = null;
            }}
          >
            Proposer une autre idée
          </Button>
        </Card>
      ) : (
        <div className="product-suggestions-grid">
          <Card>
            <form onSubmit={submit}>
              <Input
                label="Votre idée en quelques mots"
                placeholder="Ex. Préparer les départs en congé depuis un calendrier"
                required
                minLength={3}
                maxLength={150}
                value={subject}
                disabled={busy}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                label="Qu’aimeriez-vous pouvoir faire ?"
                hint="Décrivez la situation actuelle et ce qui vous aiderait. Ne joignez aucune donnée personnelle d’employé."
                placeholder="Aujourd’hui, nous devons… Ce serait plus simple si…"
                required
                rows={7}
                maxLength={4000}
                value={body}
                disabled={busy}
                onChange={(e) => setBody(e.target.value)}
              />
              {DEMO_MODE && (
                <p role="status" className="k-caption">
                  Démonstration : aucun envoi réel. Connectez-vous hors démo
                  pour transmettre une idée.
                </p>
              )}
              {error && (
                <p role="alert" className="k-error">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                loading={busy}
                disabled={
                  DEMO_MODE || subject.trim().length < 3 || !body.trim()
                }
              >
                <Send size={17} strokeWidth={1.5} />
                Envoyer mon idée
              </Button>
            </form>
          </Card>
          <aside>
            <h2>Une proposition utile</h2>
            <ol>
              <li>La tâche que vous cherchez à accomplir.</li>
              <li>Ce qui vous ralentit aujourd’hui.</li>
              <li>Le résultat que vous aimeriez obtenir.</li>
            </ol>
            <div>
              <h3>Vous rencontrez un problème ?</h3>
              <p>
                Pour un incident ou une question, contactez directement notre
                équipe. Le motif choisi permet de vous orienter.
              </p>
              <Link href="/messages?support=1">
                Ouvrir la conversation avec Konza
              </Link>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}