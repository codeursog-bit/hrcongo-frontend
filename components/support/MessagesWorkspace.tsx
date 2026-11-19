"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Headphones, Users } from "lucide-react";
import ChatPage from "@/components/chat/ChatPage";
import { authService } from "@/lib/services/authService";
import SupportInbox from "./SupportInbox";
import { supportApi } from "@/lib/support/api";
import { DEMO_MODE } from "@/lib/demo/config";
import "./support.css";
export default function MessagesWorkspace() {
  const support = useSearchParams().get("support") === "1",
    u = authService.getCurrentUser();
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    if (support || DEMO_MODE || !u?.id) return;
    let active = true,
      timer: ReturnType<typeof setTimeout>;
    async function poll() {
      if (!active) return;
      try {
        if (!document.hidden) {
          const data = await supportApi.list();
          if (active) setUnread(data.unreadTotal || 0);
        }
      } catch {
      } finally {
        if (active) timer = setTimeout(poll, 20000);
      }
    }
    void poll();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [support, u?.id]);
  return (
    <>
      <nav className="support-channel-nav" aria-label="Espace de messagerie">
        <Link href="?" aria-current={!support ? "page" : undefined}>
          <Users size={17} />
          Équipe
        </Link>
        <Link href="?support=1" aria-current={support ? "page" : undefined}>
          <Headphones size={17} />
          Support Konza
          {!support && unread > 0 && (
            <span aria-label={`${unread} conversations non lues`}>
              {unread}
            </span>
          )}
        </Link>
      </nav>
      {support ? <SupportInbox key={u?.id || "guest"} /> : <ChatPage />}
    </>
  );
}
