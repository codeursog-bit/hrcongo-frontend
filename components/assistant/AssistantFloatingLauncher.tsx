"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
import { useAssistant } from "./AssistantProvider";
import { useGuide } from "@/components/guides/GuideProvider";
export function AssistantFloatingLauncher() {
  const ctx = useAssistant(),
    guide = useGuide();
  if (!ctx || ctx.open || ctx.helpOpen || guide?.active) return null;
  if (ctx.actor.role === "EMPLOYEE") return null;
  return (
    <button
      type="button"
      className="assistant-floating-launcher"
      aria-label="Ouvrir Sofia Konza, assistante IA"
      onClick={ctx.show}
    >
      <MessageCircle size={21} strokeWidth={1.5} />
      <span>Sofia Konza</span>
    </button>
  );
}