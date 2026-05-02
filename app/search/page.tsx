"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import type { User } from "@/lib/types";

export default function SearchPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const allUserSessions = useStore(useShallow((s) => s.allUserSessions()));

  useEffect(() => {
    if (hydrated && !me) router.replace("/onboarding");
  }, [hydrated, me, router]);

  const [q, setQ] = useState("");

  const studentToCourses = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const u of allUserSessions) {
      // sessionId looks like "COMP1100-LEC-01" — split on first dash to get course code.
      const code = u.sessionId.split("-")[0];
      if (!map.has(u.userId)) map.set(u.userId, new Set());
      map.get(u.userId)!.add(code);
    }
    return map;
  }, [allUserSessions]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [] as User[];
    return allStudents.filter((s) => {
      if (s.id === me?.id) return false; // exclude self
      if (s.name.toLowerCase().includes(term)) return true;
      if (s.id.toLowerCase().includes(term)) return true;
      if (s.degree.toLowerCase().includes(term)) return true;
      const codes = studentToCourses.get(s.id);
      if (codes) for (const c of codes) if (c.toLowerCase().includes(term)) return true;
      return false;
    });
  }, [q, allStudents, studentToCourses, me]);

  if (!me) return null;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold text-anu-navy">Search</h1>
      <div className="relative max-w-xl">
        <SearchIcon
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-anu-navy/50"
        />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, student ID (u1234567), course code (COMP1100), or degree…"
          className="w-full pl-9 pr-3 py-2.5 rounded-full border border-anu-navy/20 bg-white text-sm focus:outline-anu-navy"
        />
      </div>

      {q.trim() === "" ? (
        <p className="text-sm text-anu-navy/50">Type to search.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-anu-navy/50">No matches for &quot;{q}&quot;.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((s) => {
            const courses = Array.from(studentToCourses.get(s.id) ?? []);
            return (
              <li key={s.id}>
                <Link
                  href={`/student/${s.id}`}
                  className="card p-3 flex items-center justify-between gap-3 hover:border-anu-navy/30 transition"
                >
                  <div>
                    <div className="text-anu-navy font-medium">
                      {s.name}{" "}
                      <span className="text-xs font-mono text-anu-navy/40 ml-1">{s.id}</span>
                    </div>
                    <div className="text-xs text-anu-navy/60">
                      {s.degree} · Year {s.year}
                    </div>
                    <div className="text-[11px] text-anu-navy/60 mt-0.5 flex flex-wrap gap-1">
                      {courses.map((c) => (
                        <span
                          key={c}
                          className="font-mono bg-anu-cream px-1.5 py-0.5 rounded"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-anu-gold font-medium">View →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
