"use client";

import { useMemo, useState } from "react";
import { Search, Trash2 } from "lucide-react";
import type { Course, Session, SessionType } from "@/lib/types";
import { sessionTypeLabel, minToHHMM } from "@/lib/types";
import { cx } from "@/lib/cx";

const SESSION_TYPES: SessionType[] = ["lecture", "tutorial", "lab"];

export function CourseSessionPicker({
  courses,
  sessions,
  sessionIds,
  onChange,
}: {
  courses: Course[];
  sessions: Session[];
  sessionIds: string[];
  onChange: (next: string[]) => void;
}) {
  const [q, setQ] = useState("");

  // Which courses has the user "added"? Inferred from any sessionIds belonging to them.
  const addedCourseCodes = useMemo(() => {
    const set = new Set<string>();
    for (const sid of sessionIds) {
      const s = sessions.find((x) => x.id === sid);
      if (s) set.add(s.courseId);
    }
    return Array.from(set);
  }, [sessionIds, sessions]);

  const candidates = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return [];
    return courses
      .filter((c) => !addedCourseCodes.includes(c.code))
      .filter(
        (c) =>
          c.code.toLowerCase().includes(term) || c.name.toLowerCase().includes(term)
      )
      .slice(0, 6);
  }, [q, courses, addedCourseCodes]);

  function addCourse(code: string) {
    // Auto-add the lecture (first one) so they show up in the grid right away.
    const lec = sessions.find((s) => s.courseId === code && s.type === "lecture");
    onChange(lec ? [...sessionIds, lec.id] : sessionIds);
    setQ("");
  }

  function removeCourse(code: string) {
    onChange(sessionIds.filter((sid) => {
      const s = sessions.find((x) => x.id === sid);
      return !s || s.courseId !== code;
    }));
  }

  function setSessionForType(courseCode: string, type: SessionType, newSid: string | null) {
    // Remove any existing session of that course+type
    const filtered = sessionIds.filter((sid) => {
      const s = sessions.find((x) => x.id === sid);
      return !s || !(s.courseId === courseCode && s.type === type);
    });
    onChange(newSid ? [...filtered, newSid] : filtered);
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by code (COMP1100) or name…"
          className="w-full pl-10 pr-4 py-2.5 rounded-3xl border border-[#E0D8CC] bg-anu-cream text-sm focus:outline-none focus:border-terra transition"
        />
        {candidates.length > 0 && (
          <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl border border-[#E0D8CC] shadow-md z-10 max-h-60 overflow-y-auto">
            {candidates.map((c) => (
              <button
                key={c.code}
                onClick={() => addCourse(c.code)}
                className="w-full text-left px-4 py-2.5 hover:bg-anu-cream text-sm border-b border-[#E0D8CC] last:border-0 transition"
              >
                <span className="font-mono text-anu-navy">{c.code}</span>{" "}
                <span className="text-muted">{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {addedCourseCodes.length === 0 && (
        <p className="text-xs text-anu-navy/50 italic">No courses added yet.</p>
      )}

      <div className="space-y-2">
        {addedCourseCodes.map((code) => (
          <CourseRow
            key={code}
            code={code}
            courseName={courses.find((c) => c.code === code)?.name ?? code}
            sessions={sessions}
            sessionIds={sessionIds}
            onSetType={setSessionForType}
            onRemove={() => removeCourse(code)}
          />
        ))}
      </div>
    </div>
  );
}

function CourseRow({
  code,
  courseName,
  sessions,
  sessionIds,
  onSetType,
  onRemove,
}: {
  code: string;
  courseName: string;
  sessions: Session[];
  sessionIds: string[];
  onSetType: (course: string, type: SessionType, sid: string | null) => void;
  onRemove: () => void;
}) {
  return (
    <div className="border border-[#E0D8CC] rounded-xl p-3 bg-anu-cream/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-sage/15 border border-sage/40 text-sage font-mono">
            {code}
          </span>
          <span className="text-xs text-muted">{courseName}</span>
        </div>
        <button
          onClick={onRemove}
          className="text-muted hover:text-terra transition"
          title="Remove course"
        >
          <Trash2 size={14} />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SESSION_TYPES.map((type) => {
          const options = sessions.filter((s) => s.courseId === code && s.type === type);
          if (options.length === 0) {
            return (
              <div key={type} className="text-[10px] text-muted/50 italic">
                no {type}
              </div>
            );
          }
          const current = sessionIds.find((sid) => {
            const s = sessions.find((x) => x.id === sid);
            return s && s.courseId === code && s.type === type;
          });
          return (
            <label key={type} className="text-xs">
              <div className="text-[10px] uppercase tracking-wide text-muted mb-1">
                {sessionTypeLabel[type]}
              </div>
              <select
                value={current ?? ""}
                onChange={(e) => onSetType(code, type, e.target.value || null)}
                className="w-full px-2 py-1.5 rounded-lg border border-[#E0D8CC] bg-white text-xs focus:outline-none focus:border-terra transition"
              >
                <option value="">— pick —</option>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.day} {minToHHMM(o.startMin)}–{minToHHMM(o.endMin)}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>
    </div>
  );
}
