"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/cx";
import {
  FREE_TIME_OPTIONS,
  type FreeTime,
  type PersonalityQuizDraft,
  type PartnerPriority,
  type ProductiveTime,
  type StudyStyle,
} from "@/lib/types";
import { ArrowRight, Sparkles } from "lucide-react";

type QuizQuestion = {
  key: "studyStyle" | "productiveTime" | "partnerPriority" | "freeTimeInterests";
  eyebrow: string;
  q: string;
  helper: string;
  multiSelect?: boolean;
  opts: readonly { label: string; value: string | number }[];
};

const QUIZ: QuizQuestion[] = [
  {
    key: "studyStyle",
    eyebrow: "Study shape",
    q: "How do you actually like to study?",
    helper: "This is the first signal we use for personality fit.",
    opts: [
      { label: "Solo, locked in", value: "alone" },
      { label: "Small crew, 2-3 people", value: "small" },
      { label: "Bigger, louder group", value: "large" },
      { label: "Depends on the subject", value: "no-preference" },
    ] as const,
  },
  {
    key: "productiveTime",
    eyebrow: "Energy curve",
    q: "When are you most dangerous to your to-do list?",
    helper: "We try to match you with people on the same rhythm.",
    opts: [
      { label: "Early morning", value: "morning" },
      { label: "Afternoon grind", value: "afternoon" },
      { label: "Late-night mode", value: "night" },
      { label: "It shifts around", value: "flexible" },
    ] as const,
  },
  {
    key: "partnerPriority",
    eyebrow: "Match signal",
    q: "What matters most in a study buddy?",
    helper: "This one directly changes the recommendation ranking.",
    opts: [
      { label: "Same courses", value: "courses" },
      { label: "Similar goals", value: "goals" },
      { label: "Personality fit", value: "personality" },
      { label: "The full package", value: "everything" },
    ] as const,
  },
  {
    key: "freeTimeInterests",
    eyebrow: "Off-duty vibe",
    q: "What do you usually do when you’re not studying?",
    helper: "Pick as many as feel right.",
    multiSelect: true,
    opts: FREE_TIME_OPTIONS.map((item) => ({ label: item, value: item })),
  },
] as const;

type QuizKey = (typeof QUIZ)[number]["key"];
type QuizDraft = PersonalityQuizDraft;

const EMPTY_DRAFT: QuizDraft = {
  studyStyle: null,
  productiveTime: null,
  partnerPriority: null,
  freeTimeInterests: [],
};

const STUDY_LABELS: Record<StudyStyle, string> = {
  alone: "Solo focus",
  small: "Small crew",
  large: "Group energy",
  "no-preference": "Flexible",
};
const PRODUCTIVE_LABELS: Record<ProductiveTime, string> = {
  morning: "Morning",
  afternoon: "Afternoon",
  night: "Night owl",
  flexible: "Flexible",
};
const PRIORITY_LABELS: Record<PartnerPriority, string> = {
  courses: "Same courses",
  goals: "Similar goals",
  personality: "Personality fit",
  everything: "The full package",
};

export default function IntroPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const currentUserId = useStore((s) => s.currentUserId);
  const storedDraft = useStore((s) => s.personalityDraft);
  const setPersonalityDraft = useStore((s) => s.setPersonalityDraft);

  const [draft, setDraft] = useState<QuizDraft>(storedDraft ?? EMPTY_DRAFT);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | number | null>(null);
  const [donePulse, setDonePulse] = useState(false);

  useEffect(() => {
    if (storedDraft) setDraft(storedDraft);
  }, [storedDraft]);

  useEffect(() => {
    if (hydrated && currentUserId) router.replace("/discover");
  }, [hydrated, currentUserId, router]);

  const question = QUIZ[index];
  const isLast = index === QUIZ.length - 1;
  const summary = useMemo(() => {
    const items: { label: string; value: string }[] = [];
    if (draft.studyStyle) items.push({ label: "Study", value: STUDY_LABELS[draft.studyStyle] });
    if (draft.productiveTime)
      items.push({ label: "Energy", value: PRODUCTIVE_LABELS[draft.productiveTime] });
    if (draft.partnerPriority)
      items.push({ label: "Match", value: PRIORITY_LABELS[draft.partnerPriority] });
    if (draft.freeTimeInterests.length > 0) {
      items.push({ label: "Life", value: draft.freeTimeInterests.join(", ") });
    }
    return items;
  }, [draft]);

  function updateDraft(
    key: Exclude<QuizKey, "freeTimeInterests">,
    value: StudyStyle | ProductiveTime | PartnerPriority
  ) {
    setDraft((current) => ({ ...current, [key]: value } as QuizDraft));
  }

  function finish() {
    setPersonalityDraft(draft);
    setDonePulse(true);
    window.setTimeout(() => router.push("/onboarding"), 450);
  }

  function nextOrFinish() {
    if (isLast) {
      finish();
      return;
    }
    setChosen(null);
    setIndex((current) => current + 1);
  }

  function selectSingle(value: string | number) {
    if (chosen !== null) return;
    setChosen(value);
    updateDraft(question.key as Exclude<QuizKey, "freeTimeInterests">, value as never);
    window.setTimeout(nextOrFinish, 220);
  }

  function toggleInterest(value: FreeTime) {
    setDraft((current) => {
      const next = current.freeTimeInterests.includes(value)
        ? current.freeTimeInterests.filter((item) => item !== value)
        : [...current.freeTimeInterests, value];
      return { ...current, freeTimeInterests: next };
    });
  }

  if (!hydrated) {
    return <div className="py-24 text-center text-muted">Loading quiz…</div>;
  }

  return (
    <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-6 items-stretch">
      <section className="relative overflow-hidden rounded-[32px] border border-[#D8CCBE] bg-[linear-gradient(135deg,#1C2340_0%,#2D355A_48%,#C4714A_150%)] p-6 sm:p-8 text-white shadow-[0_20px_50px_rgba(28,35,64,0.22)]">
        <div className="absolute -top-20 -right-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-24 left-1/3 h-56 w-56 rounded-full bg-[#7A9E8A]/25 blur-3xl" />
        <div className="relative z-10 flex h-full flex-col justify-between gap-10">
          <div className="space-y-5 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] uppercase tracking-[0.24em] text-white/80">
              <Sparkles size={12} /> Personality quiz
            </div>
            <div className="space-y-4">
              <h1 className="font-serif text-4xl sm:text-5xl leading-[0.95] tracking-tight">
                Before we build your profile, learn your study vibe.
              </h1>
              <p className="max-w-xl text-sm sm:text-base text-white/78 leading-6">
                Four quick prompts. No essay. We use the answers to rank classmates by more than just shared classes.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-w-lg">
              <Metric label="Time" value="~2 min" />
              <Metric label="Questions" value="4" />
              <Metric label="Signal" value="Personality + courses" />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/60">What this unlocks</p>
            <div className="flex flex-wrap gap-2 text-sm text-white/85">
              <Badge>Sharper recommendations</Badge>
              <Badge>Better intro blurbs</Badge>
              <Badge>Less random matching</Badge>
            </div>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6 space-y-5 bg-white/92 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-muted">Question {index + 1} of {QUIZ.length}</p>
            <div className="mt-2 h-1.5 w-36 rounded-full bg-[#EFE7DC] overflow-hidden">
              <div
                className="h-full rounded-full bg-terra transition-all duration-300"
                style={{ width: `${((index + 1) / QUIZ.length) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-[11px] text-muted text-right max-w-[11rem]">
            {draft.partnerPriority === "personality" || draft.partnerPriority === "everything"
              ? "We’ll lean harder into personality fit."
              : "You can make this more social or more course-first."}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted">{question.eyebrow}</p>
          <h2 className="font-serif text-[1.8rem] leading-tight text-anu-navy">{question.q}</h2>
          <p className="text-sm text-muted">{question.helper}</p>
        </div>

        <div className="flex flex-col gap-3">
          {question.multiSelect
            ? question.opts.map((opt) => {
                const active = draft.freeTimeInterests.includes(opt.value as FreeTime);
                return (
                  <button
                    key={opt.value}
                    onClick={() => toggleInterest(opt.value as FreeTime)}
                    className={cx(
                      "w-full rounded-[22px] border px-4 py-4 text-left text-[15px] transition-all",
                      active
                        ? "border-terra bg-terra text-white shadow-sm"
                        : "border-[#E0D8CC] bg-anu-cream/70 text-anu-navy hover:border-terra hover:bg-white"
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })
            : question.opts.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectSingle(opt.value)}
                  className={cx(
                    "w-full rounded-[22px] border px-4 py-4 text-left text-[15px] transition-all",
                    chosen === opt.value
                      ? "border-terra bg-terra text-white shadow-sm"
                      : "border-[#E0D8CC] bg-anu-cream/70 text-anu-navy hover:border-terra hover:bg-white"
                  )}
                >
                  {opt.label}
                </button>
              ))}
        </div>

        <div className="space-y-3 rounded-[24px] border border-dashed border-[#DDD2C6] bg-anu-cream/60 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[10px] uppercase tracking-[0.22em] text-muted">Your vibe so far</p>
            <p className="text-[11px] text-muted">Saved locally</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {summary.length > 0 ? (
              summary.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 rounded-full border border-[#DDD2C6] bg-white px-3 py-1.5 text-xs text-anu-navy"
                >
                  <span className="text-muted uppercase tracking-wide text-[9px]">{item.label}</span>
                  {item.value}
                </span>
              ))
            ) : (
              <span className="text-sm text-muted">Pick a few answers and we’ll build your profile from there.</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted">
            Personality answers stay on your device until you finish onboarding.
          </p>
          <button
            onClick={nextOrFinish}
            disabled={!draft.freeTimeInterests.length && isLast}
            className={cx(
              "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition",
              donePulse
                ? "bg-sage text-white"
                : "bg-terra text-white hover:opacity-90 disabled:opacity-40"
            )}
          >
            {isLast ? "Start onboarding" : "Next"} <ArrowRight size={14} />
          </button>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-white/10 px-3 py-3 backdrop-blur-sm">
      <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">{label}</div>
      <div className="mt-1 text-sm font-medium text-white">{value}</div>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5">{children}</span>;
}
