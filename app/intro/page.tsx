"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { ArrowRight, Users, BookOpen, Calendar } from "lucide-react";

// ─── Quiz data ────────────────────────────────────────────────────────────────

type QuizQuestion = {
  key: "studyStyle" | "productiveTime" | "partnerPriority" | "freeTimeInterests";
  eyebrow: string;
  q: string;
  helper: string;
  multiSelect?: boolean;
  opts: readonly { label: string; value: string }[];
};

const QUIZ: QuizQuestion[] = [
  {
    key: "studyStyle",
    eyebrow: "Study shape",
    q: "How do you actually like to study?",
    helper: "First signal for personality matching.",
    opts: [
      { label: "Solo, locked in", value: "alone" },
      { label: "Small crew (2–3)", value: "small" },
      { label: "Bigger, louder group", value: "large" },
      { label: "Depends on the subject", value: "no-preference" },
    ],
  },
  {
    key: "productiveTime",
    eyebrow: "Energy curve",
    q: "When are you most dangerous to your to-do list?",
    helper: "We match people on the same rhythm.",
    opts: [
      { label: "Early morning", value: "morning" },
      { label: "Afternoon grind", value: "afternoon" },
      { label: "Late-night mode", value: "night" },
      { label: "It shifts around", value: "flexible" },
    ],
  },
  {
    key: "partnerPriority",
    eyebrow: "Match signal",
    q: "What matters most in a study buddy?",
    helper: "This directly changes who shows up first.",
    opts: [
      { label: "Same courses", value: "courses" },
      { label: "Similar goals", value: "goals" },
      { label: "Personality fit", value: "personality" },
      { label: "The full package", value: "everything" },
    ],
  },
  {
    key: "freeTimeInterests",
    eyebrow: "Off-duty vibe",
    q: "What do you get up to when you're not studying?",
    helper: "Pick as many as feel right.",
    multiSelect: true,
    opts: FREE_TIME_OPTIONS.map((item) => ({ label: item, value: item })),
  },
];

const EMPTY_DRAFT: PersonalityQuizDraft = {
  studyStyle: null,
  productiveTime: null,
  partnerPriority: null,
  freeTimeInterests: [],
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IntroPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const currentUserId = useStore((s) => s.currentUserId);
  const storedDraft = useStore((s) => s.personalityDraft);
  const setPersonalityDraft = useStore((s) => s.setPersonalityDraft);

  const [draft, setDraft] = useState<PersonalityQuizDraft>(storedDraft ?? EMPTY_DRAFT);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (storedDraft) setDraft(storedDraft);
  }, [storedDraft]);

  useEffect(() => {
    if (hydrated && currentUserId) router.replace("/discover");
  }, [hydrated, currentUserId, router]);

  const question = QUIZ[index];
  const isLast = index === QUIZ.length - 1;

  function scrollToQuiz() {
    quizRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function finish() {
    setPersonalityDraft(draft);
    setDone(true);
    window.setTimeout(() => router.push("/onboarding"), 380);
  }

  function nextOrFinish() {
    if (isLast) { finish(); return; }
    setChosen(null);
    setIndex((i) => i + 1);
  }

  function selectSingle(value: string) {
    if (chosen !== null) return;
    setChosen(value);
    setDraft((d) => ({ ...d, [question.key]: value } as PersonalityQuizDraft));
    window.setTimeout(nextOrFinish, 220);
  }

  function toggleInterest(value: FreeTime) {
    setDraft((d) => {
      const has = d.freeTimeInterests.includes(value);
      return {
        ...d,
        freeTimeInterests: has
          ? d.freeTimeInterests.filter((x) => x !== value)
          : [...d.freeTimeInterests, value],
      };
    });
  }

  const answersSoFar = useMemo(() => {
    const chips: { label: string; value: string }[] = [];
    if (draft.studyStyle) chips.push({ label: "Study", value: draft.studyStyle });
    if (draft.productiveTime) chips.push({ label: "Energy", value: draft.productiveTime });
    if (draft.partnerPriority) chips.push({ label: "Match", value: draft.partnerPriority });
    if (draft.freeTimeInterests.length)
      chips.push({ label: "Life", value: draft.freeTimeInterests.join(", ") });
    return chips;
  }, [draft]);

  if (!hydrated) {
    return (
      <div className="-mx-6 -my-6 min-h-screen flex items-center justify-center bg-[#F5F0E8]">
        <span className="text-muted text-sm">Loading…</span>
      </div>
    );
  }

  return (
    /* Full-bleed wrapper — breaks out of the layout's max-w-6xl padding */
    <div className="-mx-6 -my-6 min-h-screen overflow-x-hidden">

      {/* ── Mesh-gradient background ─────────────────────────────── */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 10% 10%, #FFD4C8 0%, transparent 55%)," +
            "radial-gradient(ellipse 70% 50% at 90% 20%, #C8E6F5 0%, transparent 55%)," +
            "radial-gradient(ellipse 60% 70% at 50% 80%, #D4ECD8 0%, transparent 55%)," +
            "#FFF8F3",
        }}
      />

      <div className="max-w-6xl mx-auto px-6 pt-10 pb-20 space-y-20">

        {/* ══════════════════════════════════════════════════
            HERO
        ══════════════════════════════════════════════════ */}
        <section className="relative grid lg:grid-cols-[1fr_auto] gap-10 items-start pt-4">

          {/* Decorative blobs */}
          <div className="pointer-events-none absolute -top-16 -right-10 h-72 w-72 rounded-full bg-[#C8E6F5]/50 blur-3xl -z-10" />
          <div className="pointer-events-none absolute top-32 -left-14 h-56 w-56 rounded-full bg-[#FFD4C8]/60 blur-3xl -z-10" />

          {/* Headline + CTA */}
          <div className="space-y-6 max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#D8CCBE] bg-white/70 px-4 py-1.5 text-[11px] uppercase tracking-[0.24em] text-anu-navy/70 backdrop-blur-sm">
              ANU · Semester 1, 2026
            </div>

            <h1 className="font-serif leading-[0.92] tracking-tight">
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-anu-navy">Find your</span>
              <span
                className="block text-5xl sm:text-6xl lg:text-7xl"
                style={{
                  WebkitTextStroke: "2px #C4714A",
                  color: "transparent",
                }}
              >
                people
              </span>
              <span className="block text-5xl sm:text-6xl lg:text-7xl text-anu-navy">at ANU.</span>
            </h1>

            <p className="text-base sm:text-lg text-anu-navy/65 leading-7 max-w-md">
              Match with classmates who share your labs and tutorials — then swap timetable slots to study together for real.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={scrollToQuiz}
                className="inline-flex items-center gap-2 rounded-full bg-terra px-7 py-3.5 text-sm font-medium text-white shadow-[0_4px_20px_rgba(196,113,74,0.35)] hover:opacity-90 transition"
              >
                Take the quiz <ArrowRight size={15} />
              </button>
              <a
                href="/onboarding"
                className="inline-flex items-center gap-2 rounded-full border border-[#D8CCBE] bg-white/70 px-7 py-3.5 text-sm font-medium text-anu-navy hover:bg-white transition backdrop-blur-sm"
              >
                Skip quiz →
              </a>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-6 pt-2">
              <Stat icon={<Users size={14} />} value="25+" label="classmates" />
              <Stat icon={<BookOpen size={14} />} value="12" label="courses" />
              <Stat icon={<Calendar size={14} />} value="47" label="sessions" />
            </div>
          </div>

          {/* Floating feature cards — right column (desktop) */}
          <div className="hidden lg:flex flex-col gap-3 w-64 mt-6">
            <FloatCard
              accent="#C4714A"
              title="Same session?"
              body="Find out who sits in your exact lab or tutorial — and message them directly."
            />
            <FloatCard
              accent="#7A9E8A"
              title="Can swap?"
              body="If you're in different sessions of the same course, one click proposes a timetable swap."
            />
            <FloatCard
              accent="#5B8AC4"
              title="Personality match"
              body="Four quick answers shape who we surface first — study style, energy, interests."
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            HOW IT WORKS
        ══════════════════════════════════════════════════ */}
        <section className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.26em] text-muted">How it works</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-anu-navy">Three steps. Five minutes.</h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <HowCard
              step="01"
              title="Take the quiz"
              body="Tell us how you study, when you're switched on, and what you do off-duty."
              bg="bg-[#FFF0EB]"
              accent="text-terra"
            />
            <HowCard
              step="02"
              title="Add your courses"
              body="Pick your exact lecture, tutorial, and lab sessions from the ANU timetable."
              bg="bg-[#EBF5EF]"
              accent="text-sage"
            />
            <HowCard
              step="03"
              title="Meet your matches"
              body="Browse classmates ranked by shared sessions and personality fit. Swap if needed."
              bg="bg-[#EBF0FA]"
              accent="text-[#5B8AC4]"
            />
          </div>
        </section>

        {/* ══════════════════════════════════════════════════
            PERSONALITY QUIZ
        ══════════════════════════════════════════════════ */}
        <section ref={quizRef} className="scroll-mt-8 space-y-6">
          <div className="text-center space-y-2">
            <p className="text-[11px] uppercase tracking-[0.26em] text-muted">Personality quiz</p>
            <h2 className="font-serif text-3xl sm:text-4xl text-anu-navy">Quick, four questions.</h2>
            <p className="text-sm text-muted max-w-sm mx-auto">
              Shapes who gets recommended to you. You can skip — but more answers means better matches.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="rounded-3xl border border-[#E0D8CC] bg-white/80 backdrop-blur-sm shadow-[0_8px_40px_rgba(28,35,64,0.07)] overflow-hidden">

              {/* Progress bar */}
              <div className="h-1 bg-[#EFE7DC]">
                <div
                  className="h-full bg-terra transition-all duration-400"
                  style={{ width: `${((index + 1) / QUIZ.length) * 100}%` }}
                />
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                {/* Question header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.26em] text-muted mb-1">
                      {question.eyebrow} · {index + 1} / {QUIZ.length}
                    </p>
                    <h3 className="font-serif text-2xl sm:text-[1.75rem] leading-tight text-anu-navy">
                      {question.q}
                    </h3>
                    <p className="mt-1 text-sm text-muted">{question.helper}</p>
                  </div>
                </div>

                {/* Options */}
                <div className="grid gap-3">
                  {question.multiSelect
                    ? question.opts.map((opt) => {
                        const active = draft.freeTimeInterests.includes(opt.value as FreeTime);
                        return (
                          <button
                            key={opt.value}
                            onClick={() => toggleInterest(opt.value as FreeTime)}
                            className={cx(
                              "w-full rounded-2xl border px-5 py-3.5 text-left text-[15px] transition-all duration-150",
                              active
                                ? "border-terra bg-terra text-white shadow-sm"
                                : "border-[#E0D8CC] bg-anu-cream/60 text-anu-navy hover:border-terra hover:bg-white"
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
                            "w-full rounded-2xl border px-5 py-3.5 text-left text-[15px] transition-all duration-150",
                            chosen === opt.value
                              ? "border-terra bg-terra text-white shadow-sm"
                              : "border-[#E0D8CC] bg-anu-cream/60 text-anu-navy hover:border-terra hover:bg-white"
                          )}
                        >
                          {opt.label}
                        </button>
                      ))}
                </div>

                {/* Your vibe so far + action row */}
                <div className="space-y-4 pt-1">
                  {answersSoFar.length > 0 && (
                    <div className="rounded-2xl border border-dashed border-[#DDD2C6] bg-anu-cream/50 px-4 py-3 space-y-2">
                      <p className="text-[9px] uppercase tracking-[0.26em] text-muted">Your vibe so far</p>
                      <div className="flex flex-wrap gap-2">
                        {answersSoFar.map((chip) => (
                          <span
                            key={chip.label}
                            className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD2C6] bg-white px-3 py-1 text-xs text-anu-navy"
                          >
                            <span className="text-muted uppercase text-[9px] tracking-wide">{chip.label}</span>
                            {chip.value}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-muted">Stored on your device until onboarding.</p>
                    <button
                      onClick={nextOrFinish}
                      disabled={question.multiSelect && !draft.freeTimeInterests.length && isLast}
                      className={cx(
                        "inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition",
                        done
                          ? "bg-sage text-white"
                          : "bg-terra text-white shadow-[0_2px_12px_rgba(196,113,74,0.3)] hover:opacity-90 disabled:opacity-40"
                      )}
                    >
                      {isLast ? "Start onboarding" : "Next"} <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-anu-navy/70">
      <span className="text-terra">{icon}</span>
      <span className="font-medium text-anu-navy">{value}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}

function FloatCard({ accent, title, body }: { accent: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[#E0D8CC] bg-white/75 backdrop-blur-sm p-4 shadow-[0_4px_20px_rgba(28,35,64,0.06)]">
      <div className="flex items-center gap-2 mb-2">
        <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: accent }} />
        <p className="text-[13px] font-medium text-anu-navy">{title}</p>
      </div>
      <p className="text-xs text-muted leading-5">{body}</p>
    </div>
  );
}

function HowCard({
  step,
  title,
  body,
  bg,
  accent,
}: {
  step: string;
  title: string;
  body: string;
  bg: string;
  accent: string;
}) {
  return (
    <div className={cx("rounded-3xl p-6 space-y-3", bg)}>
      <p className={cx("font-mono text-3xl font-bold leading-none", accent)}>{step}</p>
      <h3 className="font-serif text-xl text-anu-navy">{title}</h3>
      <p className="text-sm text-anu-navy/65 leading-6">{body}</p>
    </div>
  );
}
