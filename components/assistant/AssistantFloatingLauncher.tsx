"use client";
import React from "react";
import { MessageCircle } from "lucide-react";
import { useAssistant } from "./AssistantProvider";
import { useGuide } from "@/components/guides/GuideProvider";
import { useDraggableWidget } from "@/hooks/useDraggableWidget";
export function AssistantFloatingLauncher() {
  const ctx = useAssistant(),
    guide = useGuide();
  // Déplaçable partout dans la page ; position mémorisée dans ce navigateur.
  const drag = useDraggableWidget<HTMLButtonElement>("konza:widget:sofia");
  if (!ctx || ctx.open || ctx.helpOpen || guide?.active) return null;
  if (ctx.actor.role === "EMPLOYEE") return null;
  return (
    <button
      ref={drag.ref}
      type="button"
      className="assistant-floating-launcher"
      aria-label="Ouvrir Sofia Konza, assistante IA"
      title={drag.handleTitle}
      style={{ ...drag.style, ...drag.handleStyle }}
      {...drag.handlers}
      onClick={() => {
        if (drag.didDrag()) return; // c'était un déplacement, pas un clic
        ctx.show();
      }}
    >
      <MessageCircle size={21} strokeWidth={1.5} />
      <span>Sofia Konza</span>
    </button>
  );
}