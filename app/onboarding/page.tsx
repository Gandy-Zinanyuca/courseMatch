"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  FREE_TIME_OPTIONS,
  STUDENT_ID_RE,
  type FreeTime,
  type PartnerPriority,
  type ProductiveTime,
  type Session,
  type StudentId,
  type StudyStyle,
  type User,
  type Year,
  type AgeRange,
} from "@/lib/types";
import { CourseSessionPicker } from "@/components/onboarding/CourseSessionPicker";
import { WeekGrid } from "@/components/timetable/WeekGrid";
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
  productiveTime: ProductiveTime | null;
  partnerPriority: PartnerPriority | null;
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
  productiveTime: null,
  partnerPriority: null,
};

type QuizQ = {
  key: string;
  q: string;
  multiSelect?: boolean;
  opts: { label: string; value: string | number }[];
};

const QUIZ: QuizQ[] = [
  {
    key: "studyStyle",
    q: "How do you prefer to study?",
    opts: [
      { label: "Solo, deep focus sessions", value: "alone" },
      { label: "Small group of 2–3", value: "small" },
      { label: "Larger study groups", value: "large" },
      { label: "Flexible, depends on topic", value: "no-preference" },
    ],
  },
  {
    key: "productiveTime",
    q: "When are you most productive?",
    opts: [
      { label: "Early morning", value: "morning" },
      { label: "Afternoon", value: "afternoon" },
      { label: "Late night", value: "night" },
      { label: "Varies by week", value: "flexible" },
    ],
  },
  {
    key: "partnerPriority",
    q: "What matters most in a study partner?",
    opts: [
      { label: "Same courses", value: "courses" },
      { label: "Similar goals", value: "goals" },
      { label: "Personality fit", value: "personality" },
      { label: "All of the above", value: "everything" },
    ],
  },
  {
    key: "year",
    q: "What year are you in?",
    opts: [
      { label: "Year 1", value: 1 },
      { label: "Year 2", value: 2 },
      { label: "Year 3", value: 3 },
      { label: "Year 4", value: 4 },
    ],
  },
  {
    key: "ageRange",
    q: "How old are you?",
    opts: [
      { label: "18–19", value: "18-19" },
      { label: "20–22", value: "20-22" },
      { label: "23+", value: "23+" },
    ],
  },
  {
    key: "gender",
    q: "Your gender?",
    opts: [
      { label: "Female", value: "female" },
      { label: "Male", value: "male" },
      { label: "Non-binary", value: "non-binary" },
      { label: "Prefer not to say", value: "prefer not to say" },
    ],
  },
  {
    key: "freeTimeInterests",
    q: "What do you get up to in your free time?",
    multiSelect: true,
    opts: FREE_TIME_OPTIONS.map((f) => ({ label: f, value: f })),
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const sessions = useStore((s) => s.sessions);
  const courses = useStore((s) => s.courses);
  const hydrated = useStore((s) => s.hydrated);
  const currentUserId = useStore((s) => s.currentUserId);
  const personalityDraft = useStore((s) => s.personalityDraft);

  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [sessionIds, setSessionIds] = useState<string[]>([]);

  useEffect(() => {
    if (hydrated && currentUserId) router.replace("/profile");
    if (hydrated && !currentUserId && !personalityDraft) router.replace("/intro");
  }, [hydrated, currentUserId, personalityDraft, router]);

  const idValid = STUDENT_ID_RE.test(draft.id);
  const step1Ready =
    idValid && draft.name.trim() && draft.degree.trim() && sessionIds.length > 0;

  function finish() {
    const personality = personalityDraft ?? {
      studyStyle: null,
      productiveTime: null,
      partnerPriority: null,
      freeTimeInterests: [],
    };
    const user: User = {
      id: draft.id as StudentId,
      name: draft.name.trim(),
      degree: draft.degree.trim(),
      year: (draft.year ?? 1) as Year,
      ageRange: (draft.ageRange ?? "18-19") as AgeRange,
      gender: draft.gender || "prefer not to say",
      freeTimeInterests: personality.freeTimeInterests,
      studyStyle: (personality.studyStyle ?? "no-preference") as StudyStyle,
      productiveTime: personality.productiveTime ?? undefined,
      partnerPriority: personality.partnerPriority ?? undefined,
    };
    completeOnboarding(user, sessionIds);
    router.replace("/discover");
  }

  return (
    <div className="space-y-6">
      <ProgressBar step={1} />

      {personalityDraft && <PersonalityRecap draft={personalityDraft} />}

      <Step1
        draft={draft}
        setDraft={setDraft}
        idValid={idValid}
        sessions={sessions}
        courses={courses}
        sessionIds={sessionIds}
        setSessionIds={setSessionIds}
      />

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-xs text-muted">
          You can tweak the personality quiz later from the intro page.
        </p>
        <button
          onClick={finish}
          disabled={!step1Ready}
          className="text-sm bg-terra text-white px-5 py-2 rounded-full hover:opacity-90 disabled:opacity-40 inline-flex items-center gap-1.5 transition"
        >
          Finish onboarding →
        </button>
      </div>
    </div>
  );
}

function ProgressBar({ step }: { step: 1 | 2 }) {
  return (
    <div>
      <div className="h-[2px] bg-[#E0D8CC] rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-terra rounded-full transition-all duration-500"
          style={{ width: step === 1 ? "50%" : "100%" }}
        />
      </div>
      <h1 className="font-serif text-2xl text-anu-navy">
        Your courses & sessions
      </h1>
      <p className="text-sm text-muted mt-1">
        Add your courses and pick the sessions you're enrolled in.
      </p>
    </div>
  );
}

function PersonalityRecap({ draft }: { draft: { studyStyle: StudyStyle | null; productiveTime: ProductiveTime | null; partnerPriority: PartnerPriority | null; freeTimeInterests: FreeTime[] } }) {
  const chips: { label: string; value: string }[] = [];
  if (draft.studyStyle) chips.push({ label: "Study", value: draft.studyStyle });
  if (draft.productiveTime) chips.push({ label: "Energy", value: draft.productiveTime });
  if (draft.partnerPriority) chips.push({ label: "Match", value: draft.partnerPriority });
  if (draft.freeTimeInterests.length > 0)
    chips.push({ label: "Off-duty", value: draft.freeTimeInterests.join(", ") });

  return (
    <div className="card p-4 border-dashed border-[#D9CEC0] bg-anu-cream/60 space-y-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Quiz locked in</p>
          <p className="text-sm text-anu-navy">Your vibe will shape who gets recommended.</p>
        </div>
        <div className="text-xs text-muted">This part feeds matching.</div>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <span
            key={chip.label}
            className="px-3 py-1.5 rounded-full border border-[#D9CEC0] bg-white text-xs text-anu-navy"
          >
            <span className="text-muted mr-1">{chip.label}</span>
            {chip.value}
          </span>
        ))}
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
                "w-full px-3 py-2 rounded-xl border text-sm font-mono transition",
                draft.id && !idValid
                  ? "border-red-400 bg-soft-red/30 focus:outline-none"
                  : "border-[#E0D8CC] bg-anu-cream focus:outline-none focus:border-terra"
              )}
            />
          </Field>
          <Field label="Full name">
            <input
              value={draft.name}
              onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
              placeholder="Alex Tran"
              className="w-full px-3 py-2 rounded-xl border border-[#E0D8CC] bg-anu-cream text-sm focus:outline-none focus:border-terra transition"
            />
          </Field>
          <Field label="Degree">
            <input
              value={draft.degree}
              onChange={(e) => setDraft((d) => ({ ...d, degree: e.target.value }))}
              placeholder="Bachelor of Computing"
              className="w-full px-3 py-2 rounded-xl border border-[#E0D8CC] bg-anu-cream text-sm focus:outline-none focus:border-terra transition"
            />
          </Field>
        </div>

        <div className="card p-4 space-y-3">
          <h2 className="font-medium text-anu-navy">Your courses</h2>
          <p className="text-xs text-muted">
            Search ANU course codes or names. For each, pick your lecture, tutorial, and lab session.
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
        <h2 className="text-sm font-medium text-muted">Your week</h2>
        <WeekGrid blocks={previewBlocks} />
      </div>
    </div>
  );
}

function QuizStep({
  draft,
  setDraft,
  onDone,
}: {
  draft: Draft;
  setDraft: React.Dispatch<React.SetStateAction<Draft>>;
  onDone: () => void;
}) {
  const [qIdx, setQIdx] = useState(0);
  const [justPicked, setJustPicked] = useState<string | number | null>(null);
  const [brushDone, setBrushDone] = useState(false);

  const q = QUIZ[qIdx];
  const isLast = qIdx === QUIZ.length - 1;
  const multiValue: FreeTime[] = draft.freeTimeInterests;

  function pickSingle(val: string | number) {
    if (justPicked !== null) return;
    setJustPicked(val);
    setDraft((d) => ({ ...d, [q.key]: val }) as Draft);
    if (isLast) {
      setBrushDone(true);
      setTimeout(onDone, 900);
    } else {
      setTimeout(() => {
        setJustPicked(null);
        setQIdx((i) => i + 1);
      }, 300);
    }
  }

  function toggleMulti(val: FreeTime) {
    setDraft((d) => {
      const cur = d.freeTimeInterests;
      const next = cur.includes(val) ? cur.filter((x) => x !== val) : [...cur, val];
      return { ...d, freeTimeInterests: next };
    });
  }

  function advance() {
    if (isLast) {
      setBrushDone(true);
      setTimeout(onDone, 900);
    } else {
      setQIdx((i) => i + 1);
    }
  }

  return (
    <div className="relative max-w-lg">
      {/* Progress fraction */}
      <p className="text-xs text-muted text-right mb-6 font-mono">
        {qIdx + 1} / {QUIZ.length}
      </p>

      {/* Question */}
      <p className="font-serif text-[1.75rem] leading-snug text-anu-navy mb-8">{q.q}</p>

      {/* Choices */}
      <div className="flex flex-col gap-3">
        {q.multiSelect
          ? q.opts.map((opt) => {
              const active = multiValue.includes(opt.value as FreeTime);
              return (
                <button
                  key={String(opt.value)}
                  onClick={() => toggleMulti(opt.value as FreeTime)}
                  className={cx(
                    "w-full py-4 px-5 rounded-3xl border text-left text-base transition-all",
                    active
                      ? "bg-terra border-terra text-white"
                      : "bg-anu-cream border-[#E0D8CC] text-anu-navy hover:border-terra hover:text-terra"
                  )}
                >
                  {opt.label}
                </button>
              );
            })
          : q.opts.map((opt) => (
              <button
                key={String(opt.value)}
                onClick={() => pickSingle(opt.value)}
                className={cx(
                  "w-full py-4 px-5 rounded-3xl border text-left text-base transition-all",
                  justPicked === opt.value
                    ? "bg-terra border-terra text-white"
                    : "bg-anu-cream border-[#E0D8CC] text-anu-navy hover:border-terra hover:text-terra"
                )}
              >
                {opt.label}
              </button>
            ))}
      </div>

      {/* Next button for multi-select */}
      {q.multiSelect && (
        <button
          onClick={advance}
          className="mt-6 w-full py-3.5 rounded-full bg-terra text-white font-medium hover:opacity-90 transition"
        >
          {isLast ? "All done →" : "Next →"}
        </button>
      )}

      {/* Brushstroke animation on completion */}
      <div
        className="absolute -bottom-6 left-0 right-0 h-[3px] rounded-full"
        style={{
          background: "linear-gradient(90deg, #C4714A, #7A9E8A)",
          transform: brushDone ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.8s ease-out",
        }}
      />
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
      <div className="text-[10px] uppercase tracking-wider text-muted mb-1.5">{label}</div>
      {children}
      {hint && <div className="text-[10px] text-muted/70 mt-1">{hint}</div>}
    </label>
  );
}
