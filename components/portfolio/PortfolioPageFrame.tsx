"use client";
import React from "react";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { ModulePageFrame } from "@/components/requests/ModulePageFrame";
import "./portfolio.css";
/** Presentation only: business screens keep their queries, handlers, forms and exports. */
export function PortfolioPageFrame({
  children,
  kind = "list",
  error,
}: {
  children: React.ReactNode;
  kind?: "list" | "detail" | "dashboard";
  error?: string;
}) {
  const path = usePathname() || "";
  return (
    <MotionConfig reducedMotion="user">
      <section
        className={`portfolio-workspace portfolio-${kind}`}
        data-portfolio-module={
          path.split("/").filter(Boolean).slice(1).join("-") || "dashboard"
        }
      >
        {error && (
          <p role="alert" className="portfolio-error">
            {error}
          </p>
        )}
        <ModulePageFrame kind={kind}>
          <div className="portfolio-content">{children}</div>
        </ModulePageFrame>
      </section>
    </MotionConfig>
  );
}
