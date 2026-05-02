"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { rankMatches } from "@/lib/matching";
import { WeekGrid } from "@/components/timetable/WeekGrid";
import { sessionTypeLabel, type StudentId } from "@/lib/types";
import { useState } from "react";
import { MessageModal } from "@/components/student/MessageModal";

export default function StudentPage() {
  const params = useParams();
  const router = useRouter();
  const id = (Array.isArray(params.id) ? params.id[0] : params.id) as StudentId;

  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const studentById = useStore((s) => s.studentById);
  const sessionsForUser = useStore((s) => s.sessionsForUser);
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const allUserSessions = useStore(useShallow((s) => s.allUserSessions()));
  const allSessions = useStore((s) => s.sessions);
  const courses = useStore((s) => s.courses);

  useEffect(() => {
    if (hydrated && !me) router.replace("/onboarding");
  }, [hydrated, me, router]);

  const student = studentById(id);
  const [showMessage, setShowMessage] = useState(false);

  const match = useMemo(() => {
    if (!me || !student) return null;
    return rankMatches(me, [student], allUserSessions, allSessions, courses)[0] ?? null;
  }, [me, student, allUserSessions, allSessions, courses]);

  if (!me) return null;
  if (!student) {
    return (
      <div className="card p-8 text-center text-anu-navy/60">
        No student found with id <code className="font-mono">{id}</code>.{" "}
        <Link href="/search" className="underline">
          Back to search
        </Link>
        .
      </div>
    );
  }

  const studentSessions = sessionsForUser(student.id);

  return (
    <div className="space-y-5">
      <Link
        href="/search"
        className="inline-flex items-center gap-1 text-sm text-anu-navy/60 hover:text-anu-navy"
      >
        <ArrowLeft size={14} /> Back to search
      </Link>

      <div className="card p-5 grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-2">
          <h1 className="text-2xl font-semibold text-anu-navy">{student.name}</h1>
          <div className="text-sm text-anu-navy/70">
            <span className="font-mono">{student.id}</span> · {student.degree} · Year{" "}
            {student.year}
          </div>
          <div className="text-xs text-anu-navy/70">
            {student.gender} · {student.ageRange} · prefers {student.studyStyle} study
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {student.freeTimeInterests.map((i) => (
              <span
                key={i}
                className="text-[10px] px-1.5 py-0.5 rounded bg-anu-cream text-anu-navy/70"
              >
                {i}
              </span>
            ))}
          </div>
          {match && match.shared.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {match.shared.map((s, i) => (
                <span
                  key={i}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${
                    s.status === "same"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {s.courseCode} · {s.status === "same" ? `same ${s.type}` : `swap ${s.type}`}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col items-stretch gap-2 justify-center">
          <Link
            href={`/profile?peer=${student.id}`}
            className="text-sm text-center bg-anu-navy text-white px-4 py-2 rounded-full hover:bg-anu-navyDark inline-flex items-center justify-center gap-1.5"
          >
            <CalendarDays size={14} /> Compare on my grid
          </Link>
          {match && (
            <button
              onClick={() => setShowMessage(true)}
              className="text-sm border border-anu-navy/20 text-anu-navy px-4 py-2 rounded-full hover:bg-anu-navy/5 inline-flex items-center justify-center gap-1.5"
            >
              <MessageCircle size={14} /> Draft a message
            </button>
          )}
        </div>
      </div>

      <h2 className="text-lg font-medium text-anu-navy mt-2">Their week</h2>
      <WeekGrid blocks={studentSessions.map((s) => ({ session: s }))} />

      {showMessage && match && (
        <MessageModal match={match} onClose={() => setShowMessage(false)} />
      )}
    </div>
  );
}
