"use client";
import React from "react";
import { Lightbulb } from "lucide-react";
import { useAssistant } from "./AssistantProvider";
export function AssistantLauncher({
  placement = "topbar",
  onLaunch,
}: { placement?: "topbar" | "menu"; onLaunch?: () => void } = {}) {
  const context = useAssistant();
  if (!context) return null;
  return (
    <button
      data-guide={placement === "topbar" ? "guide-launcher" : undefined}
      type="button"
      role={placement === "menu" ? "menuitem" : undefined}
      className={
        placement === "topbar"
          ? "shell-icon-btn assistant-launcher-desktop"
          : "shell-menu-item assistant-launcher-mobile"
      }
      onClick={() => {
        context.showHelp();
        onLaunch?.();
      }}
      aria-label="Besoin d’aide ? Retrouvez votre chemin dans l’application"
      title="Besoin d’aide ? Vous ne savez pas où aller ?"
    >
      <Lightbulb size={20} strokeWidth={1.5} />
      {placement === "topbar" && (
        <span className="assistant-launcher-label">Besoin d’aide ?</span>
      )}
      {placement === "menu" && <span>Besoin d’aide ?</span>}
    </button>
  );
}
