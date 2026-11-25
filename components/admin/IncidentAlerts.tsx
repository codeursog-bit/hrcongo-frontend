"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { io } from "socket.io-client";
export function IncidentAlerts() {
  const path = usePathname();
  const [alert, setAlert] = useState<{
    title: string;
    message: string;
    link: string;
  } | null>(null);
  useEffect(() => {
    if (
      process.env.NEXT_PUBLIC_INCIDENTS_ENABLED !== "true" ||
      path === "/admin/login"
    )
      return;
    const socket = io(
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
      { withCredentials: true },
    );
    socket.on("platform-incident", (event) => {
      setAlert(event);
      window.dispatchEvent(new Event("platform-incident"));
    });
    return () => {
      socket.disconnect();
    };
  }, [path]);
  return alert ? (
    <aside
      role="alert"
      className="fixed bottom-6 right-6 z-[100] max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 text-[var(--text)] shadow-xl"
    >
      <div className="flex justify-between gap-5">
        <strong>{alert.title}</strong>
        <button aria-label="Fermer l’alerte" onClick={() => setAlert(null)}>
          ×
        </button>
      </div>
      <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm">
        {alert.message}
      </p>
      <Link
        href={alert.link}
        onClick={() => setAlert(null)}
        className="mt-3 inline-block text-sm font-semibold underline"
      >
        Consulter l’incident
      </Link>
    </aside>
  ) : null;
}
