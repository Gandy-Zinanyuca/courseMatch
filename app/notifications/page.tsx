"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import { Bell, Check, MessageCircle, X } from "lucide-react";

export default function NotificationsPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const studyGroups = useStore((s) => s.studyGroups);
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const approveJoinRequest = useStore((s) => s.approveJoinRequest);
  const declineJoinRequest = useStore((s) => s.declineJoinRequest);

  useEffect(() => {
    if (hydrated && !me) {
      router.replace("/onboarding");
    }
  }, [hydrated, me, router]);

  if (!me) return null;

  const ownedGroups = studyGroups.filter((group) => group.ownerId === me.id);
  const pendingRequests = ownedGroups.flatMap((group) =>
    group.requestIds.map((requestId) => ({ group, requestId })),
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#E0D8CC] bg-[radial-gradient(circle_at_top_left,_#f7efe3,_transparent_55%)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              Notifications
            </p>
            <h1 className="font-serif text-3xl text-anu-navy mt-3">
              Pending join requests
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-anu-navy/75">
              Only the creator of a study group can approve or decline requests
              to join the group chat.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-anu-navy/10 px-4 py-2 text-sm font-semibold text-anu-navy">
            <Bell size={16} /> {pendingRequests.length} pending request
            {pendingRequests.length === 1 ? "" : "s"}
          </div>
        </div>
      </section>

      {ownedGroups.length === 0 ? (
        <section className="rounded-3xl border border-[#E0D8CC] bg-white p-6 text-anu-navy/80">
          You are not the creator of any study groups yet. Create a group in
          Study Groups to receive requests here.
        </section>
      ) : pendingRequests.length === 0 ? (
        <section className="rounded-3xl border border-[#E0D8CC] bg-white p-6 text-anu-navy/80">
          No pending requests right now. Your study groups are ready for new
          members.
        </section>
      ) : (
        <section className="grid gap-4">
          {ownedGroups.map((group) => {
            if (group.requestIds.length === 0) return null;
            return (
              <div
                key={group.id}
                className="rounded-3xl border border-[#E0D8CC] bg-white p-5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.15em] text-muted">
                      Group
                    </div>
                    <p className="text-xl font-semibold text-anu-navy">
                      {group.name}
                    </p>
                    <p className="text-sm text-anu-navy/75 mt-1">
                      {group.courseCode}
                    </p>
                  </div>
                  <div className="rounded-full bg-sage/10 px-3 py-1 text-xs text-sage">
                    {group.requestIds.length} request
                    {group.requestIds.length === 1 ? "" : "s"}
                  </div>
                </div>
                <div className="space-y-3">
                  {group.requestIds.map((requestId) => {
                    const student = allStudents.find(
                      (item) => item.id === requestId,
                    );
                    return (
                      <div
                        key={requestId}
                        className="flex flex-col gap-3 rounded-3xl border border-[#E0D8CC] bg-[#faf6f0] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-anu-navy">
                            {student?.name ?? requestId}
                          </p>
                          <p className="text-sm text-muted">
                            {student?.degree ?? "Student"}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              approveJoinRequest(group.id, requestId)
                            }
                            className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-2 text-xs font-semibold text-white hover:bg-sage-600 transition"
                          >
                            <Check size={14} /> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              declineJoinRequest(group.id, requestId)
                            }
                            className="inline-flex items-center gap-2 rounded-full border border-[#E0D8CC] bg-white px-3 py-2 text-xs text-anu-navy hover:border-terra hover:text-terra transition"
                          >
                            <X size={14} /> Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
