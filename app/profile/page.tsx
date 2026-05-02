"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { rankMatches } from "@/lib/matching";
import { peersInSession } from "@/lib/timetable";
import { DraggableGrid } from "@/components/timetable/DraggableGrid";
import { useToast } from "@/components/ui/Toast";
import { Tutorial } from "@/components/tutorial/Tutorial";
import {
  FREE_TIME_OPTIONS,
  sessionTypeLabel,
  type FreeTime,
  type PartnerPriority,
  type ProductiveTime,
  type Session,
  type StudyStyle,
  type User,
} from "@/lib/types";
import { ChevronLeft, Settings2, Users, X } from "lucide-react";
import { cx } from "@/lib/cx";

export default function ProfilePage() {
  return (
    <Suspense fallback={null}>
      <ProfileInner />
    </Suspense>
  );
}

function ProfileInner() {
  const router = useRouter();
  const params = useSearchParams();
  const peerParam = params.get("peer");

  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const myUserSessions = useStore((s) => s.myUserSessions);
  const allUserSessions = useStore(useShallow((s) => s.allUserSessions()));
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const allSessions = useStore((s) => s.sessions);
  const courses = useStore((s) => s.courses);
  const swapMySession = useStore((s) => s.swapMySession);
  const studentById = useStore((s) => s.studentById);
  const sessionsForUser = useStore((s) => s.sessionsForUser);
  const updateMyProfile = useStore((s) => s.updateMyProfile);
  const hasSeenTutorial = useStore((s) => s.hasSeenTutorial);
  const setHasSeenTutorial = useStore((s) => s.setHasSeenTutorial);

  const toast = useToast();
  const [showEdit, setShowEdit] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    if (hydrated && !me) router.replace("/onboarding");
  }, [hydrated, me, router]);

  useEffect(() => {
    if (hydrated && me && !hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [hydrated, me, hasSeenTutorial]);

  // Pre-compute matches so we can highlight peers' presence in drop zones.
  const matches = useMemo(
    () =>
      me
        ? rankMatches(me, allStudents, allUserSessions, allSessions, courses)
        : [],
    [me, allStudents, allUserSessions, allSessions, courses],
  );
  const matchedIds = useMemo(() => matches.map((m) => m.user.id), [matches]);

  const peer = peerParam ? studentById(peerParam as `u${string}`) : null;
  const overlay = peer ? sessionsForUser(peer.id) : [];

  const peersAtSession = (sid: string) =>
    peersInSession(sid, allUserSessions, matchedIds);

  function handleSwap(oldId: string, newId: string) {
    swapMySession(oldId, newId);
    toast({
      message: "Swapped! Your matches have updated.",
      action: { label: "Undo", onClick: () => swapMySession(newId, oldId) },
    });
  }
  function handleConflict(oldId: string, target: Session, clashWith: Session) {
    toast({
      message: `Can't swap to ${target.courseId} ${sessionTypeLabel[target.type]} — clashes with ${clashWith.courseId} ${sessionTypeLabel[clashWith.type]} (${clashWith.day}).`,
      ttlMs: 6000,
    });
  }

  function handleTutorialClose() {
    setShowTutorial(false);
    setHasSeenTutorial(true);
  }

  if (!me) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-serif text-2xl text-anu-navy">My timetable</h1>
          <p className="text-sm text-muted mt-1">
            Drag any class block to swap into another session. Green slots are
            safe; red clash.
          </p>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#E0D8CC] text-anu-navy hover:border-terra hover:text-terra transition"
        >
          <Settings2 size={14} /> Edit profile
        </button>
      </div>

      {peer && (
        <div className="card px-3 py-2 flex items-center justify-between gap-2 bg-anu-cream/60">
          <div className="text-xs text-anu-navy/80 inline-flex items-center gap-1.5">
            <Users size={14} /> Showing{" "}
            <Link
              href={`/student/${peer.id}`}
              className="font-medium underline"
            >
              {peer.name}
            </Link>
            's timetable as a translucent overlay so you can drag toward their
            slots.
          </div>
          <Link
            href="/profile"
            className="text-anu-navy/60 hover:text-anu-navy"
            title="Clear overlay"
          >
            <X size={14} />
          </Link>
        </div>
      )}

      <PersonalityBar user={me} />

      <DraggableGrid
        myUserSessions={myUserSessions}
        allSessions={allSessions}
        peersAtSession={peersAtSession}
        overlaySessions={overlay}
        onSwap={handleSwap}
        onConflict={handleConflict}
        className="timetable-grid"
      />

      <ProfileSummary user={me} />

      {showEdit && (
        <EditProfileModal
          user={me}
          onClose={() => setShowEdit(false)}
          onSave={(patch) => {
            updateMyProfile(patch);
            setShowEdit(false);
            toast({ message: "Profile updated." });
          }}
        />
      )}

      <Tutorial isOpen={showTutorial} onClose={handleTutorialClose} />
    </div>
  );
}

function ProfileSummary({ user }: { user: User }) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-sage/20 flex items-center justify-center font-serif text-xl text-sage flex-shrink-0">
          {initials}
        </div>
        <div>
          <div className="font-serif text-xl text-anu-navy">{user.name}</div>
          <div className="text-sm text-muted mt-0.5">
            {user.degree} · Year {user.year}
          </div>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm pt-2 border-t border-[#E0D8CC]">
        <Row
          label="Student ID"
          value={<span className="font-mono text-xs">{user.id}</span>}
        />
        <Row label="Age" value={user.ageRange} />
        <Row label="Gender" value={user.gender} />
        <Row label="Study style" value={user.studyStyle} />
        <Row
          label="Interests"
          value={
            user.freeTimeInterests.length > 0 ? (
              user.freeTimeInterests.join(", ")
            ) : (
              <span className="text-muted/50">none</span>
            )
          }
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted mb-0.5">
        {label}
      </div>
      <div className="text-anu-navy text-sm">{value}</div>
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

function PersonalityBar({ user }: { user: User }) {
  if (!user.productiveTime && !user.partnerPriority) return null;

  const chips: { label: string; value: string }[] = [
    {
      label: "Studies",
      value: STUDY_LABELS[user.studyStyle] ?? user.studyStyle,
    },
  ];
  if (user.productiveTime)
    chips.push({
      label: "Productive",
      value: PRODUCTIVE_LABELS[user.productiveTime],
    });
  if (user.partnerPriority)
    chips.push({
      label: "Values",
      value: PRIORITY_LABELS[user.partnerPriority],
    });

  return (
    <div className="card p-4 flex items-center gap-3 flex-wrap">
      <span className="text-[11px] uppercase tracking-wider text-muted font-medium">
        Personality
      </span>
      <div className="flex gap-2 flex-wrap">
        {chips.map((c) => (
          <div
            key={c.label}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-anu-cream border border-[#E0D8CC]"
          >
            <span className="text-[10px] text-muted uppercase tracking-wide">
              {c.label}
            </span>
            <span className="text-xs text-anu-navy font-medium">{c.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EditProfileModal({
  user,
  onClose,
  onSave,
}: {
  user: User;
  onClose: () => void;
  onSave: (patch: Partial<User>) => void;
}) {
  const [interests, setInterests] = useState<FreeTime[]>(
    user.freeTimeInterests,
  );
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(user.studyStyle);

  const toggleInterest = (i: FreeTime) =>
    setInterests((arr) =>
      arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i],
    );

  return (
    <div
      className="fixed inset-0 bg-anu-navy/40 z-[9000] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-anu-navy">Edit profile</h3>
          <button
            onClick={onClose}
            className="text-anu-navy/40 hover:text-anu-navy"
          >
            <X size={18} />
          </button>
        </div>
        <div>
          <div className="text-xs font-medium text-anu-navy/80 mb-1">
            Free-time interests
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FREE_TIME_OPTIONS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={cx(
                  "px-3 py-1 rounded-full text-xs border",
                  interests.includes(i)
                    ? "bg-terra text-white border-terra"
                    : "bg-anu-cream text-anu-navy border-[#E0D8CC]",
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-anu-navy/80 mb-1">
            Study style
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["alone", "small", "large", "no-preference"] as StudyStyle[]).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => setStudyStyle(s)}
                  className={cx(
                    "px-3 py-1 rounded-full text-xs border",
                    studyStyle === s
                      ? "bg-terra text-white border-terra"
                      : "bg-anu-cream text-anu-navy border-[#E0D8CC]",
                  )}
                >
                  {s}
                </button>
              ),
            )}
          </div>
        </div>
        <p className="text-[11px] text-anu-navy/50">
          Editing courses & sessions: swap on the grid by dragging. To add or
          remove a course entirely, redo onboarding from the dev menu
          (Ctrl+Shift+U → reset).
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => onSave({ freeTimeInterests: interests, studyStyle })}
            className="text-sm bg-terra text-white px-4 py-1.5 rounded-full hover:opacity-90 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
