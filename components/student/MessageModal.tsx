"use client";

import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { cx } from "@/lib/cx";
import { useStore } from "@/lib/store";
import type { Match } from "@/lib/types";

export function MessageModal({ match, onClose }: { match: Match; onClose: () => void }) {
  const me = useStore((s) => s.myProfile);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!me) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ me, other: match.user, shared: match.shared }),
        });
        const json = await res.json();
        if (!cancelled) setText(json.message ?? "");
      } catch {
        if (!cancelled) setText("");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [match.user.id, me?.id]);

  function copy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function regen() {
    if (!me) return;
    setLoading(true);
    setText(null);
    (async () => {
      try {
        const res = await fetch("/api/ai/intro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ me, other: match.user, shared: match.shared }),
        });
        const json = await res.json();
        setText(json.message ?? "");
      } catch {
        setText("");
      } finally {
        setLoading(false);
      }
    })();
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
          value={loading ? "" : text ?? ""}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={loading ? "Drafting…" : "Your message"}
          className="w-full p-3.5 rounded-xl border border-[#E0D8CC] text-sm bg-anu-cream focus:outline-terra resize-none leading-relaxed"
        />

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
          <button
            onClick={copy}
            disabled={!text}
            className={cx(
              "text-sm px-5 py-2 rounded-full font-medium transition",
              copied
                ? "bg-sage text-white"
                : "bg-terra text-white hover:opacity-90 disabled:opacity-40"
            )}
          >
            {copied ? "Copied ✓" : "Copy message"}
          </button>
        </div>
      </div>
    </div>
  );
}
