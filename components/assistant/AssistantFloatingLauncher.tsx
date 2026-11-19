"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
import { useAssistant } from "./AssistantProvider";
import { useGuide } from "@/components/guides/GuideProvider";
export function AssistantFloatingLauncher() {
  const ctx = useAssistant(),
    guide = useGuide();
  if (!ctx || ctx.open || ctx.helpOpen || guide?.active) return null;
  return (
    <button
      type="button"
      className="assistant-floating-launcher"
      aria-label="Ouvrir Agent Konza"
      onClick={ctx.show}
    >
      <MessageCircle size={21} strokeWidth={1.5} />
      <span>Agent Konza</span>
    </button>
  );
}
