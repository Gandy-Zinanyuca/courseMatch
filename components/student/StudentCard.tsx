"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { useStore } from "@/lib/store";

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

  const stripeColor =
    sameCount > 0 ? "bg-terra" : swapCount > 0 ? "bg-sage" : "bg-muted";

  const me = useStore((s) => s.myProfile);

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
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id, me?.id]);

  return (
    <div className="bg-white rounded-2xl border border-[#E0D8CC] overflow-hidden flex animate-[fadeUp_.4s_ease-out_both]">
      <div className={`w-[3px] flex-shrink-0 ${stripeColor}`} />
      <div className="flex-1 p-4 space-y-2.5">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="font-medium text-anu-navy text-[15px] leading-tight">{user.name}</div>
            <div className="text-xs text-muted mt-0.5">{user.degree} · Year {user.year}</div>
          </div>
          {freeNow && (
            <div className="flex items-center gap-1.5 text-[11px] text-sage font-medium flex-shrink-0">
              <div className="w-1.5 h-1.5 rounded-full bg-sage" />
              Free now
            </div>
          )}
        </div>

        {/* Course tags */}
        {shared.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {shared.map((s, i) => (
              <span
                key={`${s.courseCode}-${s.type}-${i}`}
                className="text-[11px] px-2.5 py-0.5 rounded-full border border-[#E0D8CC] text-anu-navy inline-flex items-center gap-1"
              >
                {s.courseCode}
                <span className="text-muted text-[10px]">
                  {s.status === "same" ? `same ${s.type}` : `diff. session`}
                </span>
              </span>
            ))}
          </div>
        )}

        {/* AI blurb */}
        <p className="text-[12px] text-sage italic leading-snug">
          {blurb ?? "…"}
        </p>

        {/* Actions */}
        <div className="flex gap-2 pt-0.5">
          <Link
            href={`/student/${user.id}`}
            className="flex-1 py-2 px-3 rounded-[14px] border border-[#E0D8CC] text-xs text-anu-navy text-center hover:border-terra hover:text-terra transition"
          >
            View Timetable
          </Link>
          <button
            onClick={onMessage}
            className="flex-1 py-2 px-3 rounded-[14px] border border-terra bg-terra text-white text-xs hover:opacity-88 transition"
          >
            Message
          </button>
        </div>

      </div>
    </div>
  );
}
