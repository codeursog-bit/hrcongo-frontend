"use client";
import React, { useEffect, useState } from "react";
import { BarChart3, Search } from "lucide-react";
import type { AssistantAdapter, ChatInput } from "@/types/contracts/assistant";
const choices = [
  ["headcount_summary", "Effectifs"],
  ["explain_payroll_variation", "Évolution de la masse salariale"],
  ["top_paid_employees", "Rémunérations les plus élevées"],
  ["explain_employee_pay", "Comprendre une paie"],
  ["permissions_ranking", "Classement des permissions"],
  ["leave_departures", "Départs en congé"],
  ["leave_returns", "Retours de congé"],
  ["leave_balance", "Solde de congé"],
  ["leave_allowance", "Allocation de congé"],
  ["attendance_summary", "Résumé des présences"],
  ["absences_ranking", "Classement des absences"],
  ["lateness_ranking", "Classement des retards"],
  ["leave_planning", "Planning de congés proposé"],
];
export function AnalysisComposer({
  adapter,
  disabled,
  onRun,
}: {
  adapter: AssistantAdapter;
  disabled: boolean;
  onRun: (
    message: string,
    analysis: NonNullable<ChatInput["analysis"]>,
  ) => void;
}) {
  const [open, setOpen] = useState(false),
    [tool, setTool] = useState(choices[0][0]),
    [period, setPeriod] = useState(
      new Date()
        .toLocaleDateString("sv-SE", { timeZone: "Africa/Brazzaville" })
        .slice(0, 7),
    ),
    [query, setQuery] = useState(""),
    [employeeId, setEmployeeId] = useState(""),
    [employees, setEmployees] = useState<
      {
        id: string;
        firstName: string;
        lastName: string;
        employeeNumber: string;
      }[]
    >([]),
    [days, setDays] = useState("26"),
    [error, setError] = useState("");
  const individual = [
    "explain_employee_pay",
    "leave_balance",
    "leave_allowance",
  ].includes(tool);
  useEffect(() => {
    let active = true;
    setEmployeeId("");
    setEmployees([]);
    if (!open || !individual || query.trim().length < 2 || !adapter.employees)
      return;
    const timer = setTimeout(() => {
      adapter.employees!(query.trim())
        .then((e) => {
          if (active) {
            setEmployees(e);
            setError("");
          }
        })
        .catch(() => {
          if (active) setError("Recherche indisponible. Réessayez.");
        });
    }, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, individual, adapter, open]);
  return (
    <details
      className="assistant-analysis-picker"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <BarChart3 size={16} strokeWidth={1.5} />
        Explorer mes données<span>Période et résultat précis</span>
      </summary>
      <div>
        <label>
          Analyse
          <select
            value={tool}
            disabled={disabled}
            onChange={(e) => {
              setTool(e.target.value);
              setEmployeeId("");
              setQuery("");
            }}
          >
            {choices.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {tool !== "leave_balance" && (
          <label>
            Période
            <input
              type="month"
              value={period}
              min="2020-01"
              disabled={disabled}
              onChange={(e) => setPeriod(e.target.value)}
            />
          </label>
        )}
        {individual && (
          <>
            <label>
              <span>
                <Search size={13} />
                Rechercher un employé
                <input
                  value={query}
                  maxLength={80}
                  placeholder="Nom ou matricule, 2 caractères minimum"
                  disabled={disabled}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </span>
            </label>
            <label>
              Employé
              <select
                value={employeeId}
                disabled={disabled || !employees.length}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Choisir explicitement une personne</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} · {e.employeeNumber}
                  </option>
                ))}
              </select>
            </label>
            {query.trim().length >= 2 && !employees.length && !error && (
              <small>Aucun employé trouvé pour cette recherche.</small>
            )}
          </>
        )}
        {tool === "leave_allowance" && (
          <label>
            Nombre de jours
            <input
              type="number"
              min={0.5}
              max={366}
              step={0.5}
              value={days}
              disabled={disabled}
              onChange={(e) => setDays(e.target.value)}
            />
          </label>
        )}
        {error && <p role="alert">{error}</p>}
        <button
          type="button"
          className="k-button k-button-secondary"
          disabled={
            disabled ||
            !period ||
            (individual && !employeeId) ||
            (tool === "leave_allowance" &&
              (!Number.isFinite(Number(days)) ||
                Number(days) < 0.5 ||
                Number(days) > 366))
          }
          onClick={() => {
            const [year, month] = period.split("-").map(Number);
            if (!month || !year) {
              setError("Choisissez une période.");
              return;
            }
            onRun(
              choices.find((c) => c[0] === tool)![1] +
                (tool === "leave_balance" ? " actuel" : " — " + period),
              {
                tool,
                month,
                year,
                ...(individual ? { employeeId } : {}),
                ...(tool === "leave_allowance" ? { days: Number(days) } : {}),
              },
            );
            setOpen(false);
          }}
        >
          Afficher l’analyse
        </button>
      </div>
    </details>
  );
}