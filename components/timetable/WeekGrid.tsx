"use client";

import { DAYS, type Day, type Session, type SessionType, GRID_START_MIN, GRID_END_MIN, sessionTypeLabel, minToHHMM } from "@/lib/types";
import { cx } from "@/lib/cx";

const ROW_PX = 28; // pixel height of one 30-min row
const TOTAL_ROWS = (GRID_END_MIN - GRID_START_MIN) / 30;

type Block = {
  session: Session;
  variant?: "primary" | "ghost" | "highlight" | "muted";
  badge?: string;
  onClick?: () => void;
};

export function WeekGrid({
  blocks = [],
  overlayBlocks = [],
  highlightDay,
  highlightMinute,
  className,
}: {
  blocks?: Block[];
  overlayBlocks?: Block[]; // rendered behind primary blocks; used for peer overlays
  highlightDay?: Day; // for "now" indicator
  highlightMinute?: number;
  className?: string;
}) {
  return (
    <div className={cx("card overflow-hidden", className)}>
      <div className="grid grid-cols-[60px_repeat(5,minmax(0,1fr))] text-xs">
        {/* Header */}
        <div className="border-b border-[#E0D8CC] bg-anu-cream/60" />
        {DAYS.map((d) => (
          <div
            key={d}
            className="text-center font-medium py-2 border-b border-l border-[#E0D8CC] bg-anu-cream/60"
          >
            {d}
          </div>
        ))}

        {/* Time column */}
        <div className="relative border-r border-[#E0D8CC]" style={{ height: TOTAL_ROWS * ROW_PX }}>
          {Array.from({ length: TOTAL_ROWS / 2 }).map((_, hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 text-muted px-1"
              style={{ top: hour * 2 * ROW_PX, height: 2 * ROW_PX }}
            >
              <span className="text-[10px]">
                {String(8 + hour).padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* Day columns */}
        {DAYS.map((day) => (
          <DayColumn
            key={day}
            day={day}
            blocks={blocks.filter((b) => b.session.day === day)}
            overlayBlocks={overlayBlocks.filter((b) => b.session.day === day)}
            highlightMinute={highlightDay === day ? highlightMinute : undefined}
          />
        ))}
      </div>
    </div>
  );
}

function DayColumn({
  day,
  blocks,
  overlayBlocks,
  highlightMinute,
}: {
  day: Day;
  blocks: Block[];
  overlayBlocks: Block[];
  highlightMinute?: number;
}) {
  return (
    <div
      className="relative border-l border-[#E0D8CC]"
      style={{ height: TOTAL_ROWS * ROW_PX }}
    >
      {/* Half-hour stripes */}
      {Array.from({ length: TOTAL_ROWS }).map((_, i) => (
        <div
          key={i}
          className={cx(
            "absolute left-0 right-0 border-t",
            i % 2 === 0 ? "border-[#E0D8CC]" : "border-anu-navy/5"
          )}
          style={{ top: i * ROW_PX, height: ROW_PX }}
        />
      ))}

      {/* Now line */}
      {highlightMinute != null &&
        highlightMinute >= GRID_START_MIN &&
        highlightMinute <= GRID_END_MIN && (
          <div
            className="absolute left-0 right-0 h-[2px] bg-red-500/80 z-30"
            style={{ top: ((highlightMinute - GRID_START_MIN) / 30) * ROW_PX }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-red-500" />
          </div>
        )}

      {/* Overlay (peer) blocks */}
      {overlayBlocks.map((b) => (
        <SessionBlock key={`o-${b.session.id}`} {...b} variant={b.variant ?? "ghost"} />
      ))}
      {/* Primary blocks */}
      {blocks.map((b) => (
        <SessionBlock key={b.session.id} {...b} variant={b.variant ?? "primary"} />
      ))}
    </div>
  );
}

export function SessionBlock({
  session,
  variant = "primary",
  badge,
  onClick,
}: Block) {
  const top = ((session.startMin - GRID_START_MIN) / 30) * ROW_PX;
  const height = ((session.endMin - session.startMin) / 30) * ROW_PX;

  const variantClass: Record<NonNullable<Block["variant"]>, string> = {
    primary:
      "bg-terra text-white border border-terra/40 hover:opacity-90 cursor-pointer",
    ghost:
      "bg-sage/20 text-sage border border-dashed border-sage/50",
    highlight:
      "bg-sage text-white border-2 border-sageDark animate-pulse",
    muted: "bg-muted/10 text-muted border border-muted/20",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className={cx(
        "absolute left-1 right-1 rounded-md px-2 py-1 text-[11px] leading-tight text-left overflow-hidden z-10",
        variantClass[variant],
        onClick && "transition"
      )}
      style={{ top, height: Math.max(height - 2, 16) }}
      title={`${session.courseId} ${sessionTypeLabel[session.type]} · ${minToHHMM(session.startMin)}-${minToHHMM(session.endMin)} · ${session.location}`}
    >
      <div className="font-semibold truncate">
        {session.courseId} <span className="font-normal opacity-70">{sessionTypeLabel[session.type]}</span>
      </div>
      <div className="opacity-80 truncate">{session.location}</div>
      {badge && (
        <div className="absolute top-1 right-1 bg-terra text-white text-[9px] px-1 rounded-full">
          {badge}
        </div>
      )}
    </button>
  );
}
