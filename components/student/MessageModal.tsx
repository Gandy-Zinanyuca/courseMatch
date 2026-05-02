"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, X } from "lucide-react";
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
    return () => {
      cancelled = true;
    };
  }, [match.user.id, me?.id]);

  function copy() {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 bg-anu-navy/40 z-[9000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-anu-navy">Message {match.user.name}</h3>
            <p className="text-xs text-anu-navy/60">AI-drafted opener you can copy.</p>
          </div>
          <button onClick={onClose} className="text-anu-navy/40 hover:text-anu-navy">
            <X size={18} />
          </button>
        </div>

        <textarea
          value={loading ? "" : text ?? ""}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={loading ? "Drafting…" : "Your message"}
          className="w-full p-3 rounded-md border border-anu-navy/20 text-sm focus:outline-anu-navy resize-none"
        />

        <div className="flex items-center justify-end gap-2">
          {loading && (
            <Loader2 size={16} className="animate-spin text-anu-navy/40" />
          )}
          <button
            onClick={copy}
            disabled={!text}
            className={cx(
              "inline-flex items-center gap-1.5 text-sm px-4 py-1.5 rounded-full",
              copied
                ? "bg-emerald-500 text-white"
                : "bg-anu-navy text-white hover:bg-anu-navyDark disabled:opacity-40"
            )}
          >
            <Copy size={14} /> {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
