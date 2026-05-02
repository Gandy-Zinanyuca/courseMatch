"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cx } from "@/lib/cx";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

const EMPTY_CHAT: { id: string; sender: "me" | "them"; text: string; at: number }[] = [];

export function MessageModal({ match, onClose }: { match: Match; onClose: () => void }) {
  const me = useStore((s) => s.myProfile);
  const chat = useStore((s) => s.chatByUserId[match.user.id] ?? EMPTY_CHAT);
  const appendChatMessage = useStore((s) => s.appendChatMessage);

  const [draft, setDraft] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const replyTimers = useRef<number[]>([]);

  function messageId() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function generateDraft(variant: number) {
    if (!me) return;
    setLoading(true);
    setDraft(null);
    try {
      const res = await fetch("/api/ai/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ me, other: match.user, shared: match.shared, variant }),
      });
      const json = await res.json();
      setDraft(json.message ?? "");
    } catch {
      setDraft("");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void generateDraft(Date.now());
    return () => {
      replyTimers.current.forEach((id) => window.clearTimeout(id));
      replyTimers.current = [];
    };
  }, [match.user.id, me?.id]);

  function copy() {
    if (!draft) return;
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function regen() {
    void generateDraft(Date.now() + Math.floor(Math.random() * 10000));
  }

  function mockReplyText() {
    const same = match.shared.find((s) => s.status === "same");
    const swap = match.shared.find((s) => s.status === "swappable");
    const courseRef = same
      ? `${same.courseCode} ${same.type}`
      : swap
      ? `${swap.courseCode} ${swap.type}`
      : "our classes";
    const replies = [
      `Hey! Great idea. Want to chat about ${courseRef} this week?`,
      `Nice message, thanks for reaching out. I'm keen to compare notes for ${courseRef}.`,
      `Sounds good to me. Happy to connect and figure out a study time.`
    ];
    return replies[Math.floor(Math.random() * replies.length)];
  }

  function sendMessage() {
    const text = (draft ?? "").trim();
    if (!text) return;

    appendChatMessage(match.user.id, {
      id: messageId(),
      sender: "me",
      text,
      at: Date.now(),
    });
    setDraft("");

    const timer = window.setTimeout(() => {
      appendChatMessage(match.user.id, {
        id: messageId(),
        sender: "them",
        text: mockReplyText(),
        at: Date.now(),
      });
    }, 900 + Math.floor(Math.random() * 600));
    replyTimers.current.push(timer);
  }

  return (
    <div
      className="fixed inset-0 bg-anu-navy/30 z-[9000] flex items-end justify-center p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl p-5 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="w-10 h-[3px] bg-[#E0D8CC] rounded-full mx-auto sm:hidden" />

        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-serif text-lg text-anu-navy">Message {match.user.name}</h3>
            <p className="text-xs text-muted mt-0.5">AI-suggested opener — edit freely</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-anu-navy p-1">
            <X size={18} />
          </button>
        </div>

        <textarea
          value={loading ? "" : draft ?? ""}
          onChange={(e) => setDraft(e.target.value)}
          rows={5}
          placeholder={loading ? "Drafting…" : "Your message"}
          className="w-full p-3.5 rounded-xl border border-[#E0D8CC] text-sm bg-anu-cream focus:outline-terra resize-none leading-relaxed"
        />

        <div className="rounded-xl border border-[#E0D8CC] bg-[#FFFEFC] p-2.5 space-y-2 max-h-56 overflow-auto">
          {chat.length === 0 ? (
            <p className="text-xs text-muted px-1 py-2">No messages yet. Send your draft to start this mock chat.</p>
          ) : (
            chat.map((m) => (
              <div
                key={m.id}
                className={cx(
                  "max-w-[85%] px-2.5 py-2 rounded-2xl text-xs leading-relaxed",
                  m.sender === "me"
                    ? "ml-auto bg-terra text-white rounded-br-md"
                    : "mr-auto bg-anu-cream text-anu-navy rounded-bl-md border border-[#E0D8CC]"
                )}
              >
                {m.text}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={regen}
              disabled={loading}
              className="border border-[#E0D8CC] rounded-xl px-3 py-1.5 text-xs text-muted hover:border-terra hover:text-terra transition disabled:opacity-40"
            >
              ↻ Regenerate
            </button>
            {loading && <Loader2 size={14} className="animate-spin text-muted" />}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              disabled={!draft}
              className={cx(
                "text-sm px-3.5 py-2 rounded-full font-medium transition border border-[#E0D8CC]",
                copied
                  ? "bg-sage text-white border-sage"
                  : "text-anu-navy hover:border-terra hover:text-terra disabled:opacity-40"
              )}
            >
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button
              onClick={sendMessage}
              disabled={!draft || loading}
              className="text-sm px-5 py-2 rounded-full font-medium transition bg-terra text-white hover:opacity-90 disabled:opacity-40"
            >
              Send to chat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
