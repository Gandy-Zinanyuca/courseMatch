"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import type { User } from "@/lib/types";
import { mockAvatarUrl } from "@/lib/avatar";

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
      <h1 className="font-serif text-2xl text-anu-navy">Search</h1>
      <div className="flex items-center gap-3 bg-anu-cream rounded-3xl px-4 py-2.5 border border-transparent focus-within:border-terra transition max-w-xl">
        <SearchIcon size={16} className="text-muted flex-shrink-0" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Name, student ID, course code, or degree…"
          className="flex-1 bg-transparent text-sm text-anu-navy placeholder-muted focus:outline-none"
        />
      </div>

      {q.trim() === "" ? (
        <p className="text-sm text-muted">Type to search.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted">No matches for &quot;{q}&quot;.</p>
      ) : (
        <ul className="space-y-2">
          {results.map((s) => {
            const courses = Array.from(studentToCourses.get(s.id) ?? []);
            return (
              <li key={s.id}>
                <Link
                  href={`/student/${s.id}`}
                  className="card p-3.5 flex items-center justify-between gap-3 hover:border-terra/40 transition"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={mockAvatarUrl(s.id, s.name)}
                      alt={`${s.name} avatar`}
                      className="w-10 h-10 rounded-full border border-[#E0D8CC] bg-anu-cream mt-0.5"
                    />
                    <div>
                      <div className="text-anu-navy font-medium">
                        {s.name}{" "}
                        <span className="text-xs font-mono text-muted ml-1">{s.id}</span>
                      </div>
                      <div className="text-xs text-muted mt-0.5">
                        {s.degree} · Year {s.year}
                      </div>
                      <div className="text-[11px] text-muted mt-1 flex flex-wrap gap-1">
                        {courses.map((c) => (
                          <span
                            key={c}
                            className="font-mono bg-anu-cream px-2 py-0.5 rounded-full border border-[#E0D8CC]"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-terra font-medium flex-shrink-0">View →</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
