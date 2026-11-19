"use client";
import React, { useEffect, useRef } from "react";
import "./portfolio.css";
export function PortfolioDialog({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const previous = document.activeElement as HTMLElement | null;
    const title = d.querySelector("h2,h3,[data-portfolio-title]");
    if (title) {
      title.id ||= "portfolio-dialog-" + crypto.randomUUID();
      d.setAttribute("aria-labelledby", title.id);
    } else d.setAttribute("aria-label", "Action du portefeuille");
    d.showModal();
    return () => {
      d.close();
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className="portfolio-dialog"
      onCancel={(e) => {
        e.preventDefault();
        close.current();
      }}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return;
        const r = e.currentTarget.getBoundingClientRect();
        if (
          e.clientX < r.left ||
          e.clientX > r.right ||
          e.clientY < r.top ||
          e.clientY > r.bottom
        )
          close.current();
      }}
    >
      {children}
    </dialog>
  );
}
