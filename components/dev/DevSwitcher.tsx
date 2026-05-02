"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Clock, RefreshCcw, UserCog, X } from "lucide-react";
import { cx } from "@/lib/cx";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export function DevSwitcher() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const allStudents = useStore((s) => s.allStudents());
  const currentUserId = useStore((s) => s.currentUserId);
  const setCurrentUser = useStore((s) => s.setCurrentUser);
  const resetDemo = useStore((s) => s.resetDemo);
  const timeWarp = useStore((s) => s.timeWarp);
  const setTimeWarp = useStore((s) => s.setTimeWarp);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 h-full w-[340px] bg-anu-navyDark text-white z-[8000] shadow-2xl flex flex-col">
      <div className="px-4 py-3 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <UserCog size={16} className="text-anu-goldLight" /> Dev switcher
        </div>
        <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
          <X size={16} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-white/10 space-y-2">
        <div className="text-xs text-white/60 inline-flex items-center gap-1.5">
          <Clock size={12} /> Time warp
        </div>
        <div className="flex items-center gap-1">
          {DAY_LABELS.map((label, i) => (
            <button
              key={label}
              onClick={() =>
                setTimeWarp({ day: i, minute: timeWarp?.minute ?? 11 * 60 })
              }
              className={cx(
                "text-[10px] px-2 py-1 rounded",
                timeWarp?.day === i
                  ? "bg-anu-goldLight text-anu-navy"
                  : "bg-white/10 text-white/70 hover:bg-white/20"
              )}
            >
              {label}
            </button>
          ))}
          <button
            onClick={() => setTimeWarp(null)}
            className={cx(
              "text-[10px] px-2 py-1 rounded ml-1",
              timeWarp === null ? "bg-white/20 text-white" : "text-white/50 hover:text-white"
            )}
            title="Use real time"
          >
            real
          </button>
        </div>
        {timeWarp && (
          <div className="space-y-1">
            <input
              type="range"
              min={8 * 60}
              max={19 * 60}
              step={30}
              value={timeWarp.minute}
              onChange={(e) =>
                setTimeWarp({ day: timeWarp.day, minute: Number(e.target.value) })
              }
              className="w-full accent-anu-goldLight"
            />
            <div className="text-[10px] text-white/70 font-mono">
              {DAY_LABELS[timeWarp.day]} {String(Math.floor(timeWarp.minute / 60)).padStart(2, "0")}:
              {String(timeWarp.minute % 60).padStart(2, "0")}
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-2">
        <button
          onClick={() => {
            resetDemo();
            router.replace("/onboarding");
          }}
          className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded bg-red-500/20 text-red-200 hover:bg-red-500/30"
        >
          <RefreshCcw size={11} /> Reset demo
        </button>
        <span className="text-[10px] text-white/40">clears your profile</span>
      </div>

      <div className="px-4 py-2 text-[10px] text-white/50 uppercase tracking-wide">
        Become a seeded student
      </div>
      <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
        {allStudents.map((s) => (
          <button
            key={s.id}
            onClick={() => setCurrentUser(s.id)}
            className={cx(
              "w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between gap-2",
              currentUserId === s.id
                ? "bg-anu-goldLight text-anu-navy"
                : "hover:bg-white/10 text-white/80"
            )}
          >
            <span className="truncate">{s.name}</span>
            <span className="font-mono text-[10px] opacity-60">{s.id}</span>
          </button>
        ))}
      </div>
      <div className="px-4 py-2 text-[10px] text-white/40 border-t border-white/10">
        Ctrl + Shift + U to toggle · Esc to close
      </div>
    </div>
  );
}
