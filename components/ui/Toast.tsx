"use client";

import { create } from "zustand";
import { useEffect } from "react";
import { X } from "lucide-react";

type Toast = {
  id: string;
  message: string;
  action?: { label: string; onClick: () => void };
  ttlMs: number;
};

type State = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id" | "ttlMs"> & { ttlMs?: number }) => void;
  dismiss: (id: string) => void;
};

export const useToasts = create<State>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = Math.random().toString(36).slice(2);
    const toast: Toast = { id, ttlMs: t.ttlMs ?? 5000, ...t };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    setTimeout(() => get().dismiss(id), toast.ttlMs);
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}));

export function ToastHost() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[10000] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="bg-anu-navy text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[280px]"
        >
          <span className="text-sm flex-1">{t.message}</span>
          {t.action && (
            <button
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
              className="text-anu-goldLight text-sm font-medium hover:underline"
            >
              {t.action.label}
            </button>
          )}
          <button onClick={() => dismiss(t.id)} className="text-white/70 hover:text-white">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  return useToasts((s) => s.push);
}
