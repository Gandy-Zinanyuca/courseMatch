"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { rankMatches } from "@/lib/matching";
import { isFreeNow, realNow, type NowMoment } from "@/lib/timetable";
import { StudentCard } from "@/components/student/StudentCard";
import { MessageModal } from "@/components/student/MessageModal";
import type { Match } from "@/lib/types";
import { cx } from "@/lib/cx";
import { seededInt } from "@/lib/avatar";

type Filter = "all" | "same" | "swap";

export default function DiscoverPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const allUserSessions = useStore(useShallow((s) => s.allUserSessions()));
  const allSessions = useStore((s) => s.sessions);
  const courses = useStore((s) => s.courses);
  const timeWarp = useStore((s) => s.timeWarp);

  const [filter, setFilter] = useState<Filter>("all");
  const [messageWith, setMessageWith] = useState<Match | null>(null);

  useEffect(() => {
    if (hydrated && !me) router.replace("/onboarding");
  }, [hydrated, me, router]);

  const matches = useMemo(() => {
    if (!me) return [];
    return rankMatches(me, allStudents, allUserSessions, allSessions, courses);
  }, [me, allStudents, allUserSessions, allSessions, courses]);

  const filtered = useMemo(() => {
    if (filter === "all") return matches;
    if (filter === "same") return matches.filter((m) => m.shared.some((s) => s.status === "same"));
    return matches.filter((m) => m.shared.some((s) => s.status === "swappable"));
  }, [matches, filter]);

  const recommendationSignals = useMemo(() => {
    const same = matches.filter((m) => m.shared.some((s) => s.status === "same")).length;
    const swap = matches.filter((m) => m.shared.some((s) => s.status === "swappable")).length;
    const highIntent = matches.filter((m) => seededInt(`${m.user.id}-reply`, 61, 95) >= 80).length;
    return { same, swap, highIntent };
  }, [matches]);

  const now = useMemo<NowMoment | null>(() => {
    if (timeWarp) {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri"] as const;
      return { day: days[timeWarp.day], minute: timeWarp.minute };
    }
    return realNow();
  }, [timeWarp]);

  if (!me) return null;

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-3xl border border-[#E0D8CC] bg-[radial-gradient(circle_at_15%_0%,#F3E6D6,transparent_42%),radial-gradient(circle_at_85%_10%,#DCE7DE,transparent_40%),#fffdf8] p-5 sm:p-6">
        <div className="relative z-10 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.16em] text-muted">For you today</div>
            <h1 className="font-serif text-2xl text-anu-navy mt-1">
              {me.name.split(" ")[0]}, your recommendation queue is ready
            </h1>
            <p className="text-sm text-anu-navy/70 mt-1 max-w-xl">
              We ranked classmates by timetable overlap, swap potential, and personality fit signals.
            </p>
          </div>
          <FilterPills filter={filter} setFilter={setFilter} matches={matches} />
        </div>
      </section>

      <section className="grid sm:grid-cols-3 gap-3">
        <SignalCard label="People in your classes" value={recommendationSignals.same} hint="same session overlap" tone="terra" />
        <SignalCard label="People to match classes with" value={recommendationSignals.swap} hint="different session, same course" tone="sage" />
      </section>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-anu-navy">Recommended classmates</h2>
            <p className="text-xs text-muted">Sorted by compatibility score</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m, index) => {
            const peerSessions = allUserSessions
              .filter((u) => u.userId === m.user.id)
              .map((u) => u.sessionId);
            const peerSessionObjs = allSessions.filter((s) => peerSessions.includes(s.id));
            const free = isFreeNow(now, peerSessionObjs.map((s) => ({ userId: m.user.id, sessionId: s.id })), allSessions);
            return (
              <StudentCard
                key={m.user.id}
                match={m}
                freeNow={free}
                  rank={index + 1}
                onMessage={() => setMessageWith(m)}
              />
            );
          })}
          </div>
        </div>
      )}

      {messageWith && (
        <MessageModal match={messageWith} onClose={() => setMessageWith(null)} />
      )}
    </div>
  );
}

function SignalCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: number;
  hint: string;
  tone: "terra" | "sage" | "navy";
}) {
  const toneMap: Record<typeof tone, string> = {
    terra: "from-[#F3E6D6] to-[#fffdf9] text-terra",
    sage: "from-[#DDE8E0] to-[#fffdf9] text-sage",
    navy: "from-[#DFE4EA] to-[#fffdf9] text-anu-navy",
  };
  return (
    <div className={cx("rounded-2xl border border-[#E0D8CC] p-4 bg-gradient-to-br", toneMap[tone])}>
      <div className="text-[10px] uppercase tracking-[0.15em] text-muted">Overview</div>
      <div className="mt-1 text-2xl font-serif">{value}</div>
      <div className="text-sm font-medium text-anu-navy mt-1">{label}</div>
      <div className="text-xs text-muted mt-0.5">{hint}</div>
    </div>
  );
}

function FilterPills({
  filter,
  setFilter,
  matches,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
  matches: Match[];
}) {
  const sameCount = matches.filter((m) => m.shared.some((s) => s.status === "same")).length;
  const swapCount = matches.filter((m) => m.shared.some((s) => s.status === "swappable")).length;
  const items: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: matches.length },
    { id: "same", label: "Same session", count: sameCount },
    { id: "swap", label: "Swappable", count: swapCount },
  ];
  return (
    <div className="flex items-center gap-2">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => setFilter(it.id)}
          className={cx(
            "px-3.5 py-1.5 text-xs rounded-full border transition",
            filter === it.id
              ? "bg-anu-navy text-white border-anu-navy"
              : "bg-white text-anu-navy border-[#E0D8CC] hover:border-terra hover:text-terra"
          )}
        >
          {it.label} <span className="opacity-60 ml-0.5">{it.count}</span>
        </button>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card p-10 text-center text-muted bg-[radial-gradient(circle_at_center,#F3E6D6_0%,transparent_70%)]">
      <p className="text-anu-navy">No recommendations yet.</p>
      <p className="text-xs mt-1">Try adding more courses or updating your study preferences in profile.</p>
    </div>
  );
}
