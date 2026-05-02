"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  DAYS,
  GRID_START_MIN,
  GRID_END_MIN,
  type Day,
  type Session,
  type StudentId,
  type UserSession,
  sessionTypeLabel,
  minToHHMM,
} from "@/lib/types";
import {
  alternativeSessionsFor,
  dropClash,
  validDropTargets,
} from "@/lib/timetable";
import { cx } from "@/lib/cx";
import { SessionBlock } from "./WeekGrid";

const ROW_PX = 28;
const TOTAL_ROWS = (GRID_END_MIN - GRID_START_MIN) / 30;

type Props = {
  myUserSessions: UserSession[];
  allSessions: Session[];
  /** For a given session id, the matched peers (already filtered to people we care about) sitting there. */
  peersAtSession?: (sessionId: string) => StudentId[];
  /** Optional translucent overlay (e.g. peer's timetable). */
  overlaySessions?: Session[];
  onSwap: (oldSessionId: string, newSessionId: string) => void;
  onConflict?: (oldSessionId: string, target: Session, clashWith: Session) => void;
};

export function DraggableGrid({
  myUserSessions,
  allSessions,
  peersAtSession,
  overlaySessions = [],
  onSwap,
  onConflict,
}: Props) {
  const [dragId, setDragId] = useState<string | null>(null);

  const draggedSession = useMemo(
    () => (dragId ? allSessions.find((s) => s.id === dragId) ?? null : null),
    [dragId, allSessions]
  );
  const allAlternatives = useMemo(
    () => (draggedSession ? alternativeSessionsFor(draggedSession, allSessions) : []),
    [draggedSession, allSessions]
  );
  const validIds = useMemo(() => {
    if (!draggedSession) return new Set<string>();
    return new Set(
      validDropTargets(draggedSession, myUserSessions, allSessions).map((s) => s.id)
    );
  }, [draggedSession, myUserSessions, allSessions]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const mySessions = useMemo(
    () =>
      myUserSessions
        .map((u) => allSessions.find((s) => s.id === u.sessionId))
        .filter((s): s is Session => !!s),
    [myUserSessions, allSessions]
  );

  function handleDragStart(e: DragStartEvent) {
    setDragId(String(e.active.id));
  }
  function handleDragEnd(e: DragEndEvent) {
    const oldId = String(e.active.id);
    const newId = e.over ? String(e.over.id) : null;
    setDragId(null);
    if (!newId || newId === oldId) return;
    const target = allSessions.find((s) => s.id === newId);
    if (!target) return;
    const clash = dropClash(oldId, target, myUserSessions, allSessions);
    if (clash) onConflict?.(oldId, target, clash);
    else onSwap(oldId, newId);
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setDragId(null)}
    >
      <div className="card overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] text-xs">
          {/* Header */}
          <div className="border-b border-anu-navy/10 bg-anu-cream" />
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center font-medium py-2 border-b border-l border-anu-navy/10 bg-anu-cream"
            >
              {d}
            </div>
          ))}

          {/* Time column */}
          <div
            className="relative border-r border-anu-navy/10"
            style={{ height: TOTAL_ROWS * ROW_PX }}
          >
            {Array.from({ length: TOTAL_ROWS / 2 }).map((_, hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-anu-navy/50 px-1"
                style={{ top: hour * 2 * ROW_PX, height: 2 * ROW_PX }}
              >
                <span className="text-[10px]">{String(8 + hour).padStart(2, "0")}:00</span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {DAYS.map((day) => (
            <DayColumn
              key={day}
              day={day}
              mySessions={mySessions.filter((s) => s.day === day)}
              overlaySessions={overlaySessions.filter((s) => s.day === day)}
              alternatives={allAlternatives.filter((a) => a.day === day)}
              validIds={validIds}
              peersAtSession={peersAtSession}
              dragging={!!dragId}
            />
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {draggedSession && (
          <div className="bg-anu-navy text-white rounded-md px-2 py-1 text-[11px] shadow-2xl border border-anu-gold opacity-90">
            <div className="font-semibold">
              {draggedSession.courseId} {sessionTypeLabel[draggedSession.type]}
            </div>
            <div className="opacity-80">
              {minToHHMM(draggedSession.startMin)}–{minToHHMM(draggedSession.endMin)}
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}

function DayColumn({
  day,
  mySessions,
  overlaySessions,
  alternatives,
  validIds,
  peersAtSession,
  dragging,
}: {
  day: Day;
  mySessions: Session[];
  overlaySessions: Session[];
  alternatives: Session[];
  validIds: Set<string>;
  peersAtSession?: (sessionId: string) => StudentId[];
  dragging: boolean;
}) {
  return (
    <div
      className="relative border-l border-anu-navy/10"
      style={{ height: TOTAL_ROWS * ROW_PX }}
    >
      {Array.from({ length: TOTAL_ROWS }).map((_, i) => (
        <div
          key={i}
          className={cx(
            "absolute left-0 right-0 border-t",
            i % 2 === 0 ? "border-anu-navy/10" : "border-anu-navy/5"
          )}
          style={{ top: i * ROW_PX, height: ROW_PX }}
        />
      ))}

      {/* Peer overlay (translucent) */}
      {overlaySessions.map((s) => (
        <SessionBlock key={`peer-${s.id}`} session={s} variant="ghost" />
      ))}

      {/* Drop zones — only when dragging */}
      {dragging &&
        alternatives.map((alt) => {
          const valid = validIds.has(alt.id);
          const peers = peersAtSession?.(alt.id) ?? [];
          return <DropZone key={alt.id} session={alt} valid={valid} peerCount={peers.length} />;
        })}

      {/* My draggable sessions */}
      {mySessions.map((s) => (
        <DraggableBlock key={s.id} session={s} />
      ))}
    </div>
  );
}

function DraggableBlock({ session }: { session: Session }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.id,
  });
  const top = ((session.startMin - GRID_START_MIN) / 30) * ROW_PX;
  const height = ((session.endMin - session.startMin) / 30) * ROW_PX;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      className={cx(
        "absolute left-1 right-1 rounded-md px-2 py-1 text-[11px] leading-tight text-left overflow-hidden z-20",
        "bg-anu-navy text-white border border-anu-navy/40 cursor-grab active:cursor-grabbing select-none",
        isDragging && "opacity-30"
      )}
      style={{ top, height: Math.max(height - 2, 16) }}
    >
      <div className="font-semibold truncate">
        {session.courseId}{" "}
        <span className="font-normal opacity-70">{sessionTypeLabel[session.type]}</span>
      </div>
      <div className="opacity-80 truncate">{session.location}</div>
    </button>
  );
}

function DropZone({
  session,
  valid,
  peerCount,
}: {
  session: Session;
  valid: boolean;
  peerCount: number;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: session.id,
    disabled: !valid,
  });
  const top = ((session.startMin - GRID_START_MIN) / 30) * ROW_PX;
  const height = ((session.endMin - session.startMin) / 30) * ROW_PX;

  return (
    <div
      ref={setNodeRef}
      className={cx(
        "absolute left-1 right-1 rounded-md text-[10px] leading-tight px-1.5 py-1 z-10 border-2 border-dashed transition-colors",
        valid
          ? isOver
            ? "bg-emerald-500/30 border-emerald-600 text-emerald-900"
            : "bg-emerald-100/70 border-emerald-400 text-emerald-800"
          : "bg-red-100/60 border-red-300 text-red-700"
      )}
      style={{ top, height: Math.max(height - 2, 16) }}
      title={
        valid
          ? `${session.courseId} ${sessionTypeLabel[session.type]} — drop to swap`
          : `${session.courseId} ${sessionTypeLabel[session.type]} — clashes with another class`
      }
    >
      <div className="font-medium truncate">
        {valid ? "Drop to swap" : "Clash"}
      </div>
      {valid && peerCount > 0 && (
        <div className="opacity-90 truncate">
          {peerCount} match{peerCount > 1 ? "es" : ""} here
        </div>
      )}
    </div>
  );
}
