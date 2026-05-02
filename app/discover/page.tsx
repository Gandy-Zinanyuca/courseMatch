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
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-serif text-2xl text-anu-navy">
            Hey {me.name.split(" ")[0]} — here's who's around you
          </h1>
          <p className="text-sm text-muted mt-1">
            Ranked by who shares your sessions, then who you could swap into.
          </p>
        </div>
        <FilterPills filter={filter} setFilter={setFilter} matches={matches} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => {
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
                onMessage={() => setMessageWith(m)}
              />
            );
          })}
        </div>
      )}

      {messageWith && (
        <MessageModal match={messageWith} onClose={() => setMessageWith(null)} />
      )}
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
    <div className="card p-10 text-center text-muted">
      <p>No matches yet — make sure you've added your courses and picked sessions.</p>
    </div>
  );
}
