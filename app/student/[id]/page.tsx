"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, MessageCircle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { rankMatches } from "@/lib/matching";
import { WeekGrid } from "@/components/timetable/WeekGrid";
import { sessionTypeLabel, type StudentId, type PartnerPriority, type ProductiveTime } from "@/lib/types";
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
      <div className="card p-8 text-center text-muted">
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
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-anu-navy"
      >
        <ArrowLeft size={14} /> Back to search
      </Link>

      <div className="card p-5 grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 space-y-2">
          <h1 className="font-serif text-2xl text-anu-navy">{student.name}</h1>
          <div className="text-sm text-anu-navy/70">
            <span className="font-mono">{student.id}</span> · {student.degree} · Year{" "}
            {student.year}
          </div>
          <div className="text-xs text-muted">
            {student.gender} · {student.ageRange}
          </div>
          {(student.productiveTime || student.partnerPriority) && (
            <div className="flex flex-wrap gap-1.5 mt-1">
              <PersonalityChip label="Studies" value={STUDY_LABELS[student.studyStyle] ?? student.studyStyle} />
              {student.productiveTime && (
                <PersonalityChip label="Productive" value={PRODUCTIVE_LABELS[student.productiveTime]} />
              )}
              {student.partnerPriority && (
                <PersonalityChip label="Values" value={PRIORITY_LABELS[student.partnerPriority]} />
              )}
            </div>
          )}
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
            className="text-sm text-center bg-terra text-white px-4 py-2 rounded-full hover:opacity-90 transition inline-flex items-center justify-center gap-1.5"
          >
            <CalendarDays size={14} /> Compare on my grid
          </Link>
          {match && (
            <button
              onClick={() => setShowMessage(true)}
              className="text-sm border border-[#E0D8CC] text-anu-navy px-4 py-2 rounded-full hover:border-terra hover:text-terra transition inline-flex items-center justify-center gap-1.5"
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

const STUDY_LABELS: Record<string, string> = {
  alone: "Solo focus",
  small: "Small group",
  large: "Study groups",
  "no-preference": "Flexible",
};
const PRODUCTIVE_LABELS: Record<ProductiveTime, string> = {
  morning: "Morning person",
  afternoon: "Afternoon",
  night: "Night owl",
  flexible: "Whenever",
};
const PRIORITY_LABELS: Record<PartnerPriority, string> = {
  courses: "Same courses",
  goals: "Similar goals",
  personality: "Personality fit",
  everything: "The full package",
};

function PersonalityChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-anu-cream border border-[#E0D8CC]">
      <span className="text-[9px] text-muted uppercase tracking-wide">{label}</span>
      <span className="text-[11px] text-anu-navy font-medium">{value}</span>
    </div>
  );
}
