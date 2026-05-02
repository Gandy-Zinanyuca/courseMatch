"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, MessageCircle, Users } from "lucide-react";
import { useShallow } from "zustand/shallow";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/cx";
import { mockAvatarUrl } from "@/lib/avatar";
import type { ChatMessage, StudyGroup } from "@/lib/types";

export function StudyGroupDetails({ group }: { group: StudyGroup }) {
  const me = useStore((s) => s.myProfile);
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const requestJoinGroup = useStore((s) => s.requestJoinGroup);
  const approveJoinRequest = useStore((s) => s.approveJoinRequest);
  const declineJoinRequest = useStore((s) => s.declineJoinRequest);
  const leaveStudyGroup = useStore((s) => s.leaveStudyGroup);
  const appendGroupChatMessage = useStore((s) => s.appendGroupChatMessage);

  const [chatText, setChatText] = useState("");

  if (!me) return null;
  const currentUser = me;

  const ownerName =
    allStudents.find((student) => student.id === group.ownerId)?.name ??
    "Unknown";

  function handleSendMessage() {
    if (!chatText.trim()) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `msg-${Date.now()}`;
    appendGroupChatMessage(group.id, {
      id,
      text: chatText.trim(),
      at: Date.now(),
      authorId: currentUser.id,
      authorName: currentUser.name,
      sender: "me",
    });
    setChatText("");
  }

  function getMessageAuthor(message: ChatMessage) {
    if (message.authorName) return message.authorName;
    if (message.authorId) {
      return (
        allStudents.find((student) => student.id === message.authorId)?.name ??
        message.authorId
      );
    }
    if (message.sender === "me") return currentUser.name;
    if (message.sender === "them") return ownerName;
    return "Unknown";
  }

  function isMyMessage(message: ChatMessage) {
    if (message.authorId) return message.authorId === currentUser.id;
    return message.sender === "me";
  }

  return (
    <section className="rounded-3xl border border-[#E0D8CC] bg-white p-5 shadow-sm shadow-slate-100">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.15em] text-muted">
            Group details
          </div>
          <h2 className="mt-2 text-2xl font-semibold text-anu-navy">
            {group.name}
          </h2>
          <p className="mt-2 text-sm text-anu-navy/75">{group.description}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <InfoTile label="Course" value={group.courseCode} />
        <InfoTile label="Members" value={`${group.memberIds.length}`} />
        <InfoTile label="Requests" value={`${group.requestIds.length}`} />
        <InfoTile label="Owner" value={ownerName} />
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr] lg:items-start">
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#E0D8CC] bg-[#faf6f0] p-4">
            {group.memberIds.includes(currentUser.id) ? (
              <button
                type="button"
                onClick={() => leaveStudyGroup(group.id)}
                className="w-full rounded-full border border-[#E0D8CC] bg-white px-4 py-2 text-sm font-semibold text-anu-navy transition hover:border-terra hover:text-terra"
              >
                Leave this group
              </button>
            ) : group.requestIds.includes(currentUser.id) ? (
              <div className="rounded-3xl bg-white p-4 text-sm text-anu-navy/80">
                Your request to join group chat is pending approval.
              </div>
            ) : (
              <button
                type="button"
                onClick={() => requestJoinGroup(group.id)}
                className="w-full rounded-full bg-anu-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#293554]"
              >
                Request to join group chat
              </button>
            )}
          </div>

          {group.ownerId === currentUser.id && group.requestIds.length > 0 && (
            <div className="rounded-3xl border border-[#E0D8CC] bg-[#f0f6f0] p-4">
              <div className="text-sm font-semibold text-anu-navy">
                Pending join requests
              </div>
              <div className="mt-3 space-y-3">
                {group.requestIds.map((requestId) => {
                  const student = allStudents.find(
                    (item) => item.id === requestId,
                  );
                  return (
                    <div
                      key={requestId}
                      className="flex flex-col gap-3 rounded-2xl border border-[#E0D8CC] bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="font-medium text-anu-navy">
                          {student?.name ?? requestId}
                        </div>
                        <div className="text-xs text-muted">
                          {student?.degree ?? "Student"}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => approveJoinRequest(group.id, requestId)}
                          className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sage-600"
                        >
                          <Check size={14} /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => declineJoinRequest(group.id, requestId)}
                          className="inline-flex items-center gap-2 rounded-full border border-[#E0D8CC] bg-white px-3 py-1.5 text-xs text-anu-navy transition hover:border-terra hover:text-terra"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="rounded-3xl border border-[#E0D8CC] bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-anu-navy">
              <Users size={16} /> Group members
            </div>
            <div className="mt-4 space-y-2">
              {group.memberIds.map((memberId) => {
                const student = allStudents.find((item) => item.id === memberId);
                if (!student) return null;
                return (
                  <Link
                    key={memberId}
                    href={`/student/${student.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[#E0D8CC] bg-[#f8f5ef] p-3 transition hover:border-terra hover:bg-[#fffaf4]"
                  >
                    <img
                      src={mockAvatarUrl(student.id, student.name)}
                      alt={`${student.name} avatar`}
                      className="h-10 w-10 rounded-full border border-[#E0D8CC] bg-anu-cream"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-medium text-anu-navy">
                        {student.name}
                      </div>
                      <div className="truncate text-xs text-muted">
                        {student.degree}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-terra">View</div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-[#E0D8CC] bg-white p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-anu-navy">
            <MessageCircle size={16} /> Group chat
          </div>
          {group.memberIds.includes(currentUser.id) ? (
            <>
              <div className="mt-4 max-h-80 space-y-3 overflow-y-auto pr-2 text-sm">
                {group.chat.length === 0 ? (
                  <div className="text-muted">
                    No messages yet — start the conversation.
                  </div>
                ) : (
                  group.chat.map((message) => {
                    const mine = isMyMessage(message);
                    return (
                      <div
                        key={message.id}
                        className={cx(
                          "max-w-[85%] rounded-2xl p-3",
                          mine
                            ? "ml-auto bg-terra/10 text-anu-navy"
                            : "bg-sage/10 text-anu-navy",
                        )}
                      >
                        <div className="text-[11px] text-muted">
                          {getMessageAuthor(message)}
                        </div>
                        <div className="mt-1 text-sm">{message.text}</div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={chatText}
                  onChange={(event) => setChatText(event.target.value)}
                  placeholder="Type a message..."
                  className="w-full rounded-2xl border border-[#E0D8CC] px-3 py-2 text-sm text-anu-navy outline-none focus:border-terra"
                />
                <button
                  type="button"
                  onClick={handleSendMessage}
                  className="inline-flex items-center gap-2 rounded-full bg-anu-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#293554]"
                >
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="mt-4 text-sm text-anu-navy/80">
              Request to join the group chat to view and participate.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-[#E0D8CC] bg-[#fbf6ef] p-4">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
        {label}
      </div>
      <div className="mt-2 text-sm font-semibold text-anu-navy">{value}</div>
    </div>
  );
}
