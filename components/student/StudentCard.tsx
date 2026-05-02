"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Match } from "@/lib/types";
import { useStore } from "@/lib/store";
import { mockAvatarUrl, seededInt } from "@/lib/avatar";

export function StudentCard({
  match,
  freeNow,
  rank,
  onMessage,
}: {
  match: Match;
  freeNow: boolean;
  rank?: number;
  onMessage: () => void;
}) {
  const { user, shared, score } = match;
  const sameCount = shared.filter((s) => s.status === "same").length;
  const swapCount = shared.filter((s) => s.status === "swappable").length;
  const compatibility = Math.min(98, 55 + sameCount * 15 + swapCount * 8 + (score % 9));
  const replyChance = seededInt(`${user.id}-reply`, 61, 95);
  const studyStreak = seededInt(`${user.id}-streak`, 2, 14);
  const avatar = mockAvatarUrl(user.id, user.name);

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
    <div className="bg-white rounded-2xl border border-[#E0D8CC] overflow-hidden flex animate-[fadeUp_.4s_ease-out_both] shadow-[0_10px_40px_-28px_rgba(28,35,42,0.7)]">
      <div className={`w-[3px] flex-shrink-0 ${stripeColor}`} />
      <div className="flex-1 p-4 space-y-2.5">

        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted">Recommended match</div>
          {typeof rank === "number" && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-anu-cream border border-[#E0D8CC] text-anu-navy">
              Rank #{rank}
            </span>
          )}
        </div>

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2.5">
            <img
              src={avatar}
              alt={`${user.name} avatar`}
              className="w-10 h-10 rounded-full border border-[#E0D8CC] bg-anu-cream"
            />
            <div>
              <div className="font-medium text-anu-navy text-[15px] leading-tight">{user.name}</div>
              <div className="text-xs text-muted mt-0.5">{user.degree} · Year {user.year}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[11px] font-semibold text-anu-navy">{compatibility}% match</div>
            <div className="text-[10px] text-muted">Reply chance {replyChance}%</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <div className="rounded-lg border border-[#E0D8CC] bg-anu-cream/70 px-2 py-1.5 text-center">
            <div className="text-muted uppercase tracking-wide">Same</div>
            <div className="text-anu-navy font-medium">{sameCount}</div>
          </div>
          <div className="rounded-lg border border-[#E0D8CC] bg-anu-cream/70 px-2 py-1.5 text-center">
            <div className="text-muted uppercase tracking-wide">Matchable Classes</div>
            <div className="text-anu-navy font-medium">{swapCount}</div>
          </div>
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

        <div>
          <div className="text-[10px] text-muted uppercase tracking-wide mb-1">AI compatibility note</div>
          <p className="text-[12px] text-sage italic leading-snug">
            {blurb ?? "…"}
          </p>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-muted">
          {freeNow ? (
            <div className="flex items-center gap-1.5 text-sage font-medium">
              <div className="w-1.5 h-1.5 rounded-full bg-sage" />
              Free now
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-muted" />
              In class now
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-terra" />
            Similar vibe score {Math.min(99, score)}
          </div>
        </div>

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
