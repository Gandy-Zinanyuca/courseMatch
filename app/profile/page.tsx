"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { rankMatches } from "@/lib/matching";
import { peersInSession } from "@/lib/timetable";
import { DraggableGrid } from "@/components/timetable/DraggableGrid";
import { useToast } from "@/components/ui/Toast";
import {
  FREE_TIME_OPTIONS,
  sessionTypeLabel,
  type FreeTime,
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
  const allUserSessions = useStore((s) => s.allUserSessions());
  const allStudents = useStore((s) => s.allStudents());
  const allSessions = useStore((s) => s.sessions);
  const courses = useStore((s) => s.courses);
  const swapMySession = useStore((s) => s.swapMySession);
  const studentById = useStore((s) => s.studentById);
  const sessionsForUser = useStore((s) => s.sessionsForUser);
  const updateMyProfile = useStore((s) => s.updateMyProfile);

  const toast = useToast();
  const [showEdit, setShowEdit] = useState(false);

  useEffect(() => {
    if (hydrated && !me) router.replace("/onboarding");
  }, [hydrated, me, router]);

  // Pre-compute matches so we can highlight peers' presence in drop zones.
  const matches = useMemo(
    () => (me ? rankMatches(me, allStudents, allUserSessions, allSessions, courses) : []),
    [me, allStudents, allUserSessions, allSessions, courses]
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

  if (!me) return null;

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-anu-navy">My timetable</h1>
          <p className="text-sm text-anu-navy/60">
            Drag any class block to swap into another session of the same course. Green slots are
            safe; red slots clash.
          </p>
        </div>
        <button
          onClick={() => setShowEdit(true)}
          className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-anu-navy/20 text-anu-navy hover:bg-anu-navy/5"
        >
          <Settings2 size={14} /> Edit profile
        </button>
      </div>

      {peer && (
        <div className="card px-3 py-2 flex items-center justify-between gap-2 bg-anu-cream/60">
          <div className="text-xs text-anu-navy/80 inline-flex items-center gap-1.5">
            <Users size={14} /> Showing{" "}
            <Link href={`/student/${peer.id}`} className="font-medium underline">
              {peer.name}
            </Link>
            's timetable as a translucent overlay so you can drag toward their slots.
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

      <DraggableGrid
        myUserSessions={myUserSessions}
        allSessions={allSessions}
        peersAtSession={peersAtSession}
        overlaySessions={overlay}
        onSwap={handleSwap}
        onConflict={handleConflict}
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
    </div>
  );
}

function ProfileSummary({ user }: { user: User }) {
  return (
    <div className="card p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
      <Row label="Name" value={user.name} />
      <Row label="Student ID" value={<span className="font-mono">{user.id}</span>} />
      <Row label="Degree" value={user.degree} />
      <Row label="Year" value={`Year ${user.year}`} />
      <Row label="Age" value={user.ageRange} />
      <Row label="Gender" value={user.gender} />
      <Row label="Study style" value={user.studyStyle} />
      <Row
        label="Interests"
        value={user.freeTimeInterests.join(", ") || <span className="opacity-50">none</span>}
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-anu-navy/50">{label}</div>
      <div className="text-anu-navy">{value}</div>
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
  const [interests, setInterests] = useState<FreeTime[]>(user.freeTimeInterests);
  const [studyStyle, setStudyStyle] = useState<StudyStyle>(user.studyStyle);

  const toggleInterest = (i: FreeTime) =>
    setInterests((arr) => (arr.includes(i) ? arr.filter((x) => x !== i) : [...arr, i]));

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
          <button onClick={onClose} className="text-anu-navy/40 hover:text-anu-navy">
            <X size={18} />
          </button>
        </div>
        <div>
          <div className="text-xs font-medium text-anu-navy/80 mb-1">Free-time interests</div>
          <div className="flex flex-wrap gap-1.5">
            {FREE_TIME_OPTIONS.map((i) => (
              <button
                key={i}
                onClick={() => toggleInterest(i)}
                className={cx(
                  "px-3 py-1 rounded-full text-xs border",
                  interests.includes(i)
                    ? "bg-anu-navy text-white border-anu-navy"
                    : "bg-white text-anu-navy border-anu-navy/20"
                )}
              >
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-anu-navy/80 mb-1">Study style</div>
          <div className="flex flex-wrap gap-1.5">
            {(["alone", "small", "large", "no-preference"] as StudyStyle[]).map((s) => (
              <button
                key={s}
                onClick={() => setStudyStyle(s)}
                className={cx(
                  "px-3 py-1 rounded-full text-xs border",
                  studyStyle === s
                    ? "bg-anu-navy text-white border-anu-navy"
                    : "bg-white text-anu-navy border-anu-navy/20"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-anu-navy/50">
          Editing courses & sessions: swap on the grid by dragging. To add or remove a course
          entirely, redo onboarding from the dev menu (Ctrl+Shift+U → reset).
        </p>
        <div className="flex justify-end">
          <button
            onClick={() => onSave({ freeTimeInterests: interests, studyStyle })}
            className="text-sm bg-anu-navy text-white px-4 py-1.5 rounded-full hover:bg-anu-navyDark"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
