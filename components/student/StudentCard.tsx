"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, MessageCircle, Sparkles, Zap } from "lucide-react";
import type { Match, SessionType } from "@/lib/types";
import { sessionTypeLabel } from "@/lib/types";
import { cx } from "@/lib/cx";
import { useStore } from "@/lib/store";

const STATUS_TONE: Record<string, string> = {
  same: "bg-emerald-100 text-emerald-800 border-emerald-300",
  swappable: "bg-amber-100 text-amber-800 border-amber-300",
};

export function StudentCard({
  match,
  freeNow,
  onMessage,
}: {
  match: Match;
  freeNow: boolean;
  onMessage: () => void;
}) {
  const { user, shared, score } = match;
  const sameCount = shared.filter((s) => s.status === "same").length;
  const swapCount = shared.filter((s) => s.status === "swappable").length;

  const me = useStore((s) => s.myProfile);

  // Lazy fetch the AI blurb when the card mounts.
  const [blurb, setBlurb] = useState<string | undefined>(match.blurb);
  useEffect(() => {
    if (blurb || !me) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/ai/blurb", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ me, other: user }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!cancelled) setBlurb(json.blurb);
      } catch {
        /* noop */
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, me?.id]);

  return (
    <div className="card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-anu-navy">{user.name}</h3>
            <span className="text-xs text-anu-navy/50 font-mono">{user.id}</span>
          </div>
          <p className="text-xs text-anu-navy/70">
            {user.degree} · Year {user.year}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {freeNow && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
              <Zap size={10} /> Free now
            </span>
          )}
          <span className="text-[10px] text-anu-navy/40">match score {score}</span>
        </div>
      </div>

      {/* Blurb */}
      <div className="flex items-start gap-1.5 text-xs text-anu-navy/80 italic">
        <Sparkles size={12} className="mt-0.5 text-anu-gold flex-shrink-0" />
        <span>{blurb ?? "…"}</span>
      </div>

      {/* Shared sessions */}
      <div className="flex flex-wrap gap-1.5">
        {shared.map((s, i) => (
          <span
            key={`${s.courseCode}-${s.type}-${i}`}
            className={cx(
              "text-[10px] px-2 py-0.5 rounded-full border",
              STATUS_TONE[s.status]
            )}
            title={
              s.status === "same"
                ? `Same ${sessionTypeLabel[s.type].toLowerCase()}`
                : `Different ${sessionTypeLabel[s.type].toLowerCase()} — swappable`
            }
          >
            {s.courseCode} · {s.status === "same" ? `same ${s.type}` : `swap ${s.type}`}
          </span>
        ))}
      </div>

      {/* Interests */}
      {user.freeTimeInterests.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {user.freeTimeInterests.map((i) => (
            <span
              key={i}
              className="text-[10px] px-1.5 py-0.5 rounded bg-anu-cream text-anu-navy/70"
            >
              {i}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t border-anu-navy/10 mt-1">
        <Link
          href={`/student/${user.id}`}
          className="flex-1 text-center text-xs py-1.5 rounded-md border border-anu-navy/20 text-anu-navy hover:bg-anu-navy/5 inline-flex items-center justify-center gap-1.5"
        >
          <CalendarDays size={13} /> View timetable
        </Link>
        <button
          onClick={onMessage}
          className="flex-1 text-xs py-1.5 rounded-md bg-anu-navy text-white hover:bg-anu-navyDark inline-flex items-center justify-center gap-1.5"
        >
          <MessageCircle size={13} /> Message
        </button>
      </div>

      {sameCount + swapCount === 0 && (
        <p className="text-[10px] text-anu-navy/40 italic">No shared courses found.</p>
      )}
    </div>
  );
}
