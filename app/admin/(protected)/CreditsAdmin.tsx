"use client";
import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  assistantAdmin,
  type CreditPack,
  type CompanyCredits,
} from "@/lib/assistant/admin";
import { Card, Button, Input } from "@/components/design-system/primitives";
import { FancySelect } from "@/components/ui/FancySelect";

type Row = Partial<CreditPack> & { key: string };
const REASONS = {
  GRANT: "Offrir des crédits",
  PURCHASE: "Achat confirmé (paiement reçu)",
  ADJUST: "Correction (peut retirer)",
} as const;
const LABELS: Record<string, string> = {
  TRIAL: "Essai",
  GRANT: "Offert",
  PURCHASE: "Achat",
  USAGE: "Analyse",
  ADJUST: "Correction",
};

/** Packs de crédits proposés aux entreprises : le prix est fixé ici par le super admin. */
export function CreditPacksCard() {
  const [rows, setRows] = useState<Row[]>([]),
    [busy, setBusy] = useState<string | null>(null),
    [error, setError] = useState("");
  const load = async () => {
    try {
      const packs = await assistantAdmin.packs();
      setRows(packs.map((p) => ({ ...p, key: p.id })));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Packs indisponibles.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const edit = (key: string, patch: Partial<Row>) =>
    setRows((all) => all.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  const save = async (row: Row) => {
    setBusy(row.key);
    setError("");
    try {
      await assistantAdmin.savePack({
        id: row.id,
        name: (row.name || "").trim(),
        credits: Number(row.credits || 0),
        price: Number(row.price || 0),
        active: row.active !== false,
        sortOrder: Number(row.sortOrder || 0),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l’enregistrement.");
    } finally {
      setBusy(null);
    }
  };
  const remove = async (row: Row) => {
    if (!row.id) return setRows((all) => all.filter((r) => r.key !== row.key));
    setBusy(row.key);
    try {
      await assistantAdmin.removePack(row.id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Suppression impossible.");
    } finally {
      setBusy(null);
    }
  };
  return (
    <Card title="Packs de crédits">
      <p className="assistant-admin-muted">
        Un crédit paie une analyse (le coût est réglable plus haut). Les prix
        sont en XAF et vous les fixez librement. Tant que le paiement en ligne
        n’est pas branché, activez les crédits d’une entreprise dans la section
        ci-dessous après avoir reçu son paiement.
      </p>
      {error && <p role="alert">{error}</p>}
      {rows.map((row) => (
        <section key={row.key} className="assistant-admin-company">
          <Input
            label="Nom du pack"
            value={row.name || ""}
            onChange={(e) => edit(row.key, { name: e.target.value })}
          />
          <Input
            label="Crédits"
            type="number"
            min={1}
            step={1}
            value={row.credits ?? ""}
            onChange={(e) => edit(row.key, { credits: Number(e.target.value) })}
          />
          <Input
            label="Prix (XAF)"
            type="number"
            min={0}
            step={100}
            value={row.price ?? ""}
            onChange={(e) => edit(row.key, { price: Number(e.target.value) })}
          />
          <label>
            <input
              type="checkbox"
              checked={row.active !== false}
              onChange={(e) => edit(row.key, { active: e.target.checked })}
            />
            Proposé aux clients
          </label>
          <Button
            variant="secondary"
            loading={busy === row.key}
            disabled={!!busy || !(row.name || "").trim() || !row.credits}
            onClick={() => void save(row)}
          >
            Enregistrer
          </Button>
          <Button
            variant="secondary"
            disabled={!!busy}
            onClick={() => void remove(row)}
          >
            <Trash2 size={16} strokeWidth={1.5} />
            Supprimer
          </Button>
        </section>
      ))}
      <Button
        variant="secondary"
        onClick={() =>
          setRows((all) => [
            ...all,
            { key: "new:" + all.length + ":" + Date.now(), active: true },
          ])
        }
      >
        <Plus size={16} strokeWidth={1.5} />
        Ajouter un pack
      </Button>
    </Card>
  );
}

/** Solde, journal et activation manuelle des crédits d’une entreprise (offert, achat confirmé, correction). */
export function CompanyCreditsBox({
  companyId,
  initialBalance,
  onChanged,
}: {
  companyId: string;
  initialBalance: number;
  onChanged: () => void;
}) {
  const [data, setData] = useState<CompanyCredits | null>(null),
    [credits, setCredits] = useState(""),
    [reason, setReason] = useState<keyof typeof REASONS>("GRANT"),
    [reference, setReference] = useState(""),
    [note, setNote] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const open = async () => {
    setError("");
    try {
      setData(await assistantAdmin.credits(companyId));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Solde indisponible.");
    }
  };
  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      setData(
        await assistantAdmin.adjustCredits(companyId, {
          credits: Number(credits),
          reason,
          note: note.trim() || undefined,
          reference: reference.trim() || undefined,
        }),
      );
      setCredits("");
      setReference("");
      setNote("");
      onChanged();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l’opération.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <p>
        Crédits : <strong>{data ? data.balance : initialBalance}</strong>
        {data && !data.trialGrantedAt && " (essai non encore accordé)"}
      </p>
      {!data ? (
        <Button variant="secondary" onClick={() => void open()}>
          Gérer les crédits
        </Button>
      ) : (
        <>
          <FancySelect
            label="Opération"
            value={reason}
            options={Object.entries(REASONS).map(([value, label]) => ({
              value,
              label,
            }))}
            onChange={(v) => setReason(v as keyof typeof REASONS)}
          />
          <Input
            label="Nombre de crédits"
            type="number"
            step={1}
            value={credits}
            onChange={(e) => setCredits(e.target.value)}
          />
          {reason === "PURCHASE" && (
            <Input
              label="Référence du paiement"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          )}
          <Input
            label="Note (facultatif)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            loading={busy}
            disabled={
              busy ||
              !Number(credits) ||
              (reason === "PURCHASE" && !reference.trim())
            }
            onClick={() => void submit()}
          >
            Appliquer
          </Button>
          {error && <p role="alert">{error}</p>}
          {!!data.ledger.length && (
            <ul className="assistant-admin-muted">
              {data.ledger.slice(0, 8).map((l) => (
                <li key={l.id}>
                  {new Date(l.createdAt).toLocaleDateString("fr-FR")} ·{" "}
                  {LABELS[l.reason] || l.reason} · {l.delta > 0 ? "+" : ""}
                  {l.delta} → {l.balanceAfter}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
      {!data && error && <p role="alert">{error}</p>}
    </div>
  );
}