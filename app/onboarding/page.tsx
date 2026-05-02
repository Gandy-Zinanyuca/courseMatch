"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  FREE_TIME_OPTIONS,
  STUDENT_ID_RE,
  type AgeRange,
  type FreeTime,
  type Session,
  type StudentId,
  type StudyStyle,
  type User,
  type Year,
} from "@/lib/types";
import { CourseSessionPicker } from "@/components/onboarding/CourseSessionPicker";
import { WeekGrid } from "@/components/timetable/WeekGrid";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/cx";

type Draft = {
  id: string;
  name: string;
  degree: string;
  year: Year | null;
  ageRange: AgeRange | null;
  gender: string;
  freeTimeInterests: FreeTime[];
  studyStyle: StudyStyle | null;
};

const EMPTY_DRAFT: Draft = {
  id: "",
  name: "",
  degree: "",
  year: null,
  ageRange: null,
  gender: "",
  freeTimeInterests: [],
  studyStyle: null,
};

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const sessions = useStore((s) => s.sessions);
  const courses = useStore((s) => s.courses);
  const hydrated = useStore((s) => s.hydrated);
  const currentUserId = useStore((s) => s.currentUserId);

  const [step, setStep] = useState<1 | 2>(1);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  useEffect(() => {
    if (hydrated && currentUserId) router.replace("/profile");
  }, [hydrated, currentUserId, router]);

  const idValid = STUDENT_ID_RE.test(draft.id);
  const step1Ready =
    idValid && draft.name.trim() && draft.degree.trim() && sessionIds.length > 0;
  const step2Ready =
    draft.year !== null && draft.ageRange !== null && draft.gender && draft.studyStyle;

  function finish() {
    if (!step2Ready || !step1Ready) return;
    const user: User = {
      id: draft.id as StudentId,
      name: draft.name.trim(),
      degree: draft.degree.trim(),
      year: draft.year as Year,
      ageRange: draft.ageRange as AgeRange,
      gender: draft.gender,
      freeTimeInterests: draft.freeTimeInterests,
      studyStyle: draft.studyStyle as StudyStyle,
    };
    completeOnboarding(user, sessionIds);
    router.replace("/discover");
  }

  return (
    <div className="space-y-6">
      <Header step={step} />

      {step === 1 && (
        <Step1
          draft={draft}
          setDraft={setDraft}
          idValid={idValid}
          sessions={sessions}
          courses={courses}
          sessionIds={sessionIds}
          setSessionIds={setSessionIds}
        />
      )}

      {step === 2 && <Step2 draft={draft} setDraft={setDraft} />}

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(1)}
          disabled={step === 1}
          className="text-sm text-anu-navy/70 hover:text-anu-navy disabled:opacity-30 inline-flex items-center gap-1"
        >
          <ChevronLeft size={16} /> Back
        </button>
        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!step1Ready}
            className="text-sm bg-anu-navy text-white px-5 py-2 rounded-full hover:bg-anu-navyDark disabled:opacity-40 inline-flex items-center gap-1.5"
          >
            Next <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={finish}
            disabled={!step2Ready}
            className="text-sm bg-anu-gold text-white px-5 py-2 rounded-full hover:bg-anu-goldLight disabled:opacity-40"
          >
            Finish setup
          </button>
        )}
      </div>
    </div>
  );
}

function Header({ step }: { step: 1 | 2 }) {
  return (
    <div className="flex items-center gap-4">
      <h1 className="text-2xl font-semibold text-anu-navy">Set up your profile</h1>
      <div className="flex-1" />
      <div className="flex items-center gap-2 text-xs">
        <span
          className={cx(
            "h-2 w-8 rounded-full",
            step >= 1 ? "bg-anu-gold" : "bg-anu-navy/20"
          )}
        />
        <span
          className={cx(
            "h-2 w-8 rounded-full",
            step >= 2 ? "bg-anu-gold" : "bg-anu-navy/20"
          )}
        />
        <span className="text-anu-navy/60 ml-1">Step {step} of 2</span>
      </div>
    </div>
  );
}

function Step1({
  draft,
  setDraft,
  idValid,
  sessions,
  courses,
  sessionIds,
  setSessionIds,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  idValid: boolean;
  sessions: Session[];
  courses: { code: string; name: string }[];
  sessionIds: string[];
  setSessionIds: (ids: string[]) => void;
}) {
  const previewBlocks = sessions
    .filter((s) => sessionIds.includes(s.id))
    .map((s) => ({ session: s }));

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-4">
        <div className="card p-4 space-y-3">
          <Field label="Student ID" hint="ANU format: u + 7 digits (e.g. u7234189)">
            <input
              value={draft.id}
              onChange={(e) => setDraft((d) => ({ ...d, id: e.target.value.trim() }))}
              placeholder="u7234189"
              className={cx(
                "w-full px-3 py-2 rounded-md border bg-white text-sm font-mono",
                draft.id && !idValid
                  ? "border-red-400 focus:outline-red-400"
                  : "border-anu-navy/20 focus:outline-anu-navy"
              )}
            />
          </Field>
          <Field label="Full name">
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Alex Tran"
              className="w-full px-3 py-2 rounded-md border border-anu-navy/20 bg-white text-sm focus:outline-anu-navy"
            />
          </Field>
          <Field label="Degree">
            <input
              value={draft.degree}
              onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value }))}
              placeholder="Bachelor of Computing"
              className="w-full px-3 py-2 rounded-md border border-anu-navy/20 bg-white text-sm focus:outline-anu-navy"
            />
          </Field>
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-anu-navy">Your courses</h2>
          <p className="text-xs text-anu-navy/60">
            Search ANU course codes or names. For each, pick the lecture, tutorial, and lab
            (if there is one) you're enrolled in.
          </p>
          <CourseSessionPicker
            courses={courses}
            sessions={sessions}
            sessionIds={sessionIds}
            onChange={setSessionIds}
          />
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-sm font-medium text-anu-navy/80">Your week</h2>
        <WeekGrid blocks={previewBlocks} />
      </div>
    </div>
  );
}

function Step2({
  draft,
  setDraft,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
}) {
  return (
    <div className="card p-6 space-y-6 max-w-2xl">
      <h2 className="text-lg font-medium text-anu-navy">A few quick questions</h2>

      <Question label="What year are you in?">
        <ChoiceRow
          options={[1, 2, 3, 4]}
          value={draft.year}
          onSelect={(v) => setDraft((d) => ({ ...d, year: v as Year }))}
          render={(v) => `Year ${v}`}
        />
      </Question>

      <Question label="How old are you?">
        <ChoiceRow
          options={["18-19", "20-22", "23+"] as AgeRange[]}
          value={draft.ageRange}
          onSelect={(v) => setDraft((d) => ({ ...d, ageRange: v as AgeRange }))}
          render={(v) => v}
        />
      </Question>

      <Question label="Gender">
        <ChoiceRow
          options={["female", "male", "non-binary", "prefer not to say"]}
          value={draft.gender}
          onSelect={(v) => setDraft((d) => ({ ...d, gender: v as string }))}
          render={(v) => v}
        />
      </Question>

      <Question label="What do you do in your free time? (pick any that apply)">
        <ChoiceRow
          multiSelect
          options={FREE_TIME_OPTIONS as readonly FreeTime[]}
          value={draft.freeTimeInterests}
          onSelect={(v) => {
            const arr = draft.freeTimeInterests.includes(v as FreeTime)
              ? draft.freeTimeInterests.filter((x) => x !== v)
              : [...draft.freeTimeInterests, v as FreeTime];
            setDraft((d) => ({ ...d, freeTimeInterests: arr }));
          }}
          render={(v) => v}
        />
      </Question>

      <Question label="How do you prefer to study?">
        <ChoiceRow
          options={["alone", "small", "large", "no-preference"] as StudyStyle[]}
          value={draft.studyStyle}
          onSelect={(v) => setDraft((d) => ({ ...d, studyStyle: v as StudyStyle }))}
          render={(v) =>
            v === "small" ? "small group" : v === "large" ? "large group" : v === "no-preference" ? "no preference" : v
          }
        />
      </Question>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-anu-navy/80 mb-1">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-anu-navy/50 mt-1">{hint}</div>}
    </label>
  );
}

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium text-anu-navy mb-2">{label}</div>
      {children}
    </div>
  );
}

function ChoiceRow<T extends string | number>({
  options,
  value,
  onSelect,
  render,
  multiSelect,
}: {
  options: readonly T[];
  value: T | T[] | null;
  onSelect: (v: T) => void;
  render: (v: T) => string;
  multiSelect?: boolean;
}) {
  const isSelected = (v: T) =>
    multiSelect ? Array.isArray(value) && value.includes(v) : value === v;
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={String(opt)}
          onClick={() => onSelect(opt)}
          className={cx(
            "px-3 py-1.5 rounded-full text-sm border transition",
            isSelected(opt)
              ? "bg-anu-navy text-white border-anu-navy"
              : "bg-white text-anu-navy border-anu-navy/20 hover:border-anu-navy/40"
          )}
        >
          {render(opt)}
        </button>
      ))}
    </div>
  );
}
