"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { useShallow } from "zustand/shallow";
import {
  BookOpen,
  Check,
  MessageCircle,
  Plus,
  Search,
  Users,
  X,
} from "lucide-react";
import { cx } from "@/lib/cx";
import type { StudyGroup } from "@/lib/types";

export default function StudyGroupsPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const courses = useStore((s) => s.courses);
  const studyGroups = useStore((s) => s.studyGroups);
  const allStudents = useStore(useShallow((s) => s.allStudents()));
  const sessionsForUser = useStore((s) => s.sessionsForUser);
  const courseByCode = useStore((s) => s.courseByCode);
  const createStudyGroup = useStore((s) => s.createStudyGroup);
  const requestJoinGroup = useStore((s) => s.requestJoinGroup);
  const approveJoinRequest = useStore((s) => s.approveJoinRequest);
  const declineJoinRequest = useStore((s) => s.declineJoinRequest);
  const leaveStudyGroup = useStore((s) => s.leaveStudyGroup);
  const appendGroupChatMessage = useStore((s) => s.appendGroupChatMessage);

  const [search, setSearch] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    courses[0]?.code ?? "",
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [chatText, setChatText] = useState("");

  useEffect(() => {
    if (hydrated && !me) {
      router.replace("/onboarding");
    }
  }, [hydrated, me, router]);

  const filteredCourses = useMemo(
    () =>
      courses.filter((course) =>
        `${course.code} ${course.name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [courses, search],
  );

  const courseGroups = useMemo(
    () =>
      studyGroups.filter((group) => group.courseCode === selectedCourseCode),
    [studyGroups, selectedCourseCode],
  );

  const selectedGroup = useMemo(
    () => studyGroups.find((group) => group.id === selectedGroupId) ?? null,
    [studyGroups, selectedGroupId],
  );

  const myGroups = useMemo(
    () =>
      me
        ? studyGroups.filter(
            (group) =>
              group.ownerId === me.id || group.memberIds.includes(me.id),
          )
        : [],
    [me, studyGroups],
  );

  if (!me) return null;

  const currentCourse = courseByCode(selectedCourseCode);

  function handleCreateGroup() {
    if (!selectedCourseCode || !groupName.trim()) return;
    createStudyGroup(selectedCourseCode, groupName.trim(), description.trim());
    setGroupName("");
    setDescription("");
    setShowCreate(false);
  }

  function handleSendMessage(group: StudyGroup) {
    if (!chatText.trim()) return;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `msg-${Date.now()}`;
    appendGroupChatMessage(group.id, {
      id,
      sender: "me",
      text: chatText.trim(),
      at: Date.now(),
    });
    setChatText("");
  }

  const groupCount = filteredCourses.reduce(
    (sum, course) =>
      sum +
      studyGroups.filter((group) => group.courseCode === course.code).length,
    0,
  );

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-[#E0D8CC] bg-[radial-gradient(circle_at_top_left,_#f7efe3,_transparent_55%)] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              Study groups
            </p>
            <h1 className="font-serif text-3xl text-anu-navy mt-3">
              Discover study groups and share your timetable.
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-anu-navy/75">
              Search every course, start a group, request access to group chat,
              and coordinate sessions with classmates.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreate((value) => !value)}
            className="inline-flex items-center gap-2 rounded-full bg-terra px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-terra/20 hover:bg-terra-600 transition"
          >
            <Plus size={16} />
            {showCreate ? "Hide" : "Create new study group"}
          </button>
        </div>
      </section>

      {showCreate && (
        <section className="rounded-3xl border border-[#E0D8CC] bg-white p-6 shadow-sm shadow-slate-100">
          <div className="grid gap-4 lg:grid-cols-[1fr_1.5fr]">
            <label className="space-y-2 text-sm text-anu-navy">
              Course
              <select
                value={selectedCourseCode}
                onChange={(event) => setSelectedCourseCode(event.target.value)}
                className="w-full rounded-2xl border border-[#E0D8CC] bg-white px-3 py-2 text-sm text-anu-navy outline-none focus:border-terra"
              >
                {courses.map((course) => (
                  <option key={course.code} value={course.code}>
                    {course.code} — {course.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm text-anu-navy">
              Group name
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                placeholder="E.g. COMP1100 Wednesday review"
                className="w-full rounded-2xl border border-[#E0D8CC] px-3 py-2 text-sm text-anu-navy outline-none focus:border-terra"
              />
            </label>
          </div>

          <label className="space-y-2 text-sm text-anu-navy">
            Description
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={3}
              placeholder="What does your group focus on? Timetable swap help, assignment prep, or weekly check-ins."
              className="w-full resize-none rounded-2xl border border-[#E0D8CC] px-3 py-2 text-sm text-anu-navy outline-none focus:border-terra"
            />
          </label>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={handleCreateGroup}
              className="rounded-full bg-anu-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#293554] transition"
            >
              Start study group
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-full border border-[#E0D8CC] px-4 py-2 text-sm text-anu-navy hover:border-terra hover:text-terra transition"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E0D8CC] bg-white p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">
                  Search courses
                </div>
                <h2 className="mt-2 text-xl font-semibold text-anu-navy">
                  Browse course groups
                </h2>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-sage/10 px-3 py-1 text-xs font-semibold text-sage">
                <BookOpen size={14} /> {groupCount} total group
                {groupCount === 1 ? "" : "s"}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-[#E0D8CC] bg-[#F8F5EE] px-3 py-2 text-sm text-anu-navy">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by course code or name"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div className="rounded-3xl border border-[#E0D8CC] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">
                  Selected course
                </div>
                <p className="mt-2 text-lg font-semibold text-anu-navy">
                  {currentCourse?.code} — {currentCourse?.name}
                </p>
              </div>
              <div className="rounded-full bg-anu-navy/5 px-3 py-1 text-xs text-anu-navy">
                {courseGroups.length} group
                {courseGroups.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="grid gap-3">
              {filteredCourses.slice(0, 8).map((course) => {
                const count = studyGroups.filter(
                  (group) => group.courseCode === course.code,
                ).length;
                return (
                  <button
                    type="button"
                    key={course.code}
                    onClick={() => {
                      setSelectedCourseCode(course.code);
                      setSelectedGroupId(null);
                    }}
                    className={cx(
                      "w-full rounded-3xl border p-4 text-left transition",
                      selectedCourseCode === course.code
                        ? "border-terra bg-terra/10"
                        : "border-[#E0D8CC] bg-white hover:border-terra",
                    )}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-anu-navy">
                          {course.code}
                        </div>
                        <div className="text-sm text-muted mt-1">
                          {course.name}
                        </div>
                      </div>
                      <div className="rounded-full bg-sage/10 px-3 py-1 text-xs text-sage">
                        {count} group{count === 1 ? "" : "s"}
                      </div>
                    </div>
                  </button>
                );
              })}
              {filteredCourses.length === 0 && (
                <div className="rounded-3xl border border-dashed border-[#E0D8CC] bg-[#faf6f0] p-6 text-sm text-anu-navy/80">
                  No courses match your search. Try different keywords.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-[#E0D8CC] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-xs uppercase tracking-[0.15em] text-muted">
                  Groups for this course
                </div>
                <p className="mt-2 text-lg font-semibold text-anu-navy">
                  {currentCourse?.code}
                </p>
              </div>
              <div className="rounded-full bg-anu-navy/5 px-3 py-1 text-xs text-anu-navy">
                {courseGroups.length} group
                {courseGroups.length === 1 ? "" : "s"}
              </div>
            </div>
            <div className="space-y-3">
              {courseGroups.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#E0D8CC] bg-[#fbf5ed] p-6 text-sm text-anu-navy/80">
                  No groups have been created yet for this course.
                </div>
              ) : (
                courseGroups.map((group) => {
                  const isMember = group.memberIds.includes(me.id);
                  const isOwner = group.ownerId === me.id;
                  return (
                    <button
                      type="button"
                      key={group.id}
                      onClick={() => setSelectedGroupId(group.id)}
                      className={cx(
                        "w-full rounded-3xl border p-4 text-left transition",
                        selectedGroupId === group.id
                          ? "border-terra bg-terra/10"
                          : "border-[#E0D8CC] bg-white hover:border-terra",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-anu-navy">
                            {group.name}
                          </div>
                          <div className="text-sm text-muted mt-1">
                            {group.description}
                          </div>
                        </div>
                        <div className="text-right text-xs text-anu-navy/70">
                          <div>{group.memberIds.length} members</div>
                          <div>{group.requestIds.length} requests</div>
                          {isOwner && (
                            <div className="mt-1 text-sage">Owner</div>
                          )}
                          {isMember && !isOwner && (
                            <div className="mt-1 text-terra">Joined</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-[#E0D8CC] bg-white p-5">
            <div className="flex items-center gap-3 text-anu-navy">
              <Users size={18} />
              <div>
                <div className="text-xs uppercase tracking-[0.14em] text-muted">
                  Your study groups
                </div>
                <p className="font-semibold">
                  {myGroups.length} group{myGroups.length === 1 ? "" : "s"}
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-3 text-sm text-anu-navy/80">
              {myGroups.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-[#E0D8CC] bg-[#faf6f0] p-4">
                  You don’t belong to any study groups yet. Create one or
                  request to join a group from the list above.
                </div>
              ) : (
                myGroups.map((group) => {
                  const course = courseByCode(group.courseCode);
                  return (
                    <div
                      key={group.id}
                      className="rounded-3xl border border-[#E0D8CC] bg-[#f8f5ef] p-4"
                    >
                      <div className="font-semibold text-anu-navy">
                        {group.name}
                      </div>
                      <div className="text-xs text-muted mt-1">
                        {course?.code} • {course?.name}
                      </div>
                      <div className="mt-2 text-xs text-anu-navy/75">
                        {group.memberIds.length} members ·{" "}
                        {group.requestIds.length} requests
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {selectedGroup ? (
        <section className="rounded-3xl border border-[#E0D8CC] bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-[0.15em] text-muted">
                Group details
              </div>
              <h2 className="mt-2 text-2xl font-semibold text-anu-navy">
                {selectedGroup.name}
              </h2>
              <p className="mt-2 text-sm text-anu-navy/75">
                {selectedGroup.description}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedGroupId(null)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#E0D8CC] text-anu-navy hover:border-terra hover:text-terra"
            >
              <X size={18} />
            </button>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InfoTile label="Course" value={selectedGroup.courseCode} />
            <InfoTile
              label="Members"
              value={`${selectedGroup.memberIds.length}`}
            />
            <InfoTile
              label="Requests"
              value={`${selectedGroup.requestIds.length}`}
            />
            <InfoTile
              label="Owner"
              value={
                allStudents.find(
                  (student) => student.id === selectedGroup.ownerId,
                )?.name ?? "Unknown"
              }
            />
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border border-[#E0D8CC] bg-[#faf6f0] p-4">
                {selectedGroup.memberIds.includes(me.id) ? (
                  <button
                    type="button"
                    onClick={() => leaveStudyGroup(selectedGroup.id)}
                    className="w-full rounded-full border border-[#E0D8CC] bg-white px-4 py-2 text-sm font-semibold text-anu-navy hover:border-terra hover:text-terra transition"
                  >
                    Leave this group
                  </button>
                ) : selectedGroup.requestIds.includes(me.id) ? (
                  <div className="rounded-3xl bg-white p-4 text-sm text-anu-navy/80">
                    Your request to join group chat is pending approval.
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => requestJoinGroup(selectedGroup.id)}
                    className="w-full rounded-full bg-anu-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#293554] transition"
                  >
                    Request to join group chat
                  </button>
                )}
              </div>

              {selectedGroup.ownerId === me.id &&
                selectedGroup.requestIds.length > 0 && (
                  <div className="rounded-3xl border border-[#E0D8CC] bg-[#f0f6f0] p-4">
                    <div className="text-sm font-semibold text-anu-navy">
                      Pending join requests
                    </div>
                    <div className="mt-3 space-y-3">
                      {selectedGroup.requestIds.map((requestId) => {
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
                                onClick={() =>
                                  approveJoinRequest(
                                    selectedGroup.id,
                                    requestId,
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-full bg-sage px-3 py-1.5 text-xs font-semibold text-white hover:bg-sage-600 transition"
                              >
                                <Check size={14} /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  declineJoinRequest(
                                    selectedGroup.id,
                                    requestId,
                                  )
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-[#E0D8CC] bg-white px-3 py-1.5 text-xs text-anu-navy hover:border-terra hover:text-terra transition"
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
            </div>

            <div className="rounded-3xl border border-[#E0D8CC] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-anu-navy">
                <MessageCircle size={16} /> Group chat
              </div>
              {selectedGroup.memberIds.includes(me.id) ? (
                <>
                  <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-2 text-sm">
                    {selectedGroup.chat.length === 0 ? (
                      <div className="text-muted">
                        No messages yet — start the conversation.
                      </div>
                    ) : (
                      selectedGroup.chat.map((message) => (
                        <div
                          key={message.id}
                          className={cx(
                            "rounded-2xl p-3",
                            message.sender === "me"
                              ? "bg-terra/10 text-anu-navy self-end"
                              : "bg-sage/10 text-anu-navy",
                          )}
                        >
                          <div className="text-[11px] text-muted">
                            {message.sender === "me" ? "You" : "Group"}
                          </div>
                          <div className="mt-1 text-sm">{message.text}</div>
                        </div>
                      ))
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
                      onClick={() => handleSendMessage(selectedGroup)}
                      className="inline-flex items-center gap-2 rounded-full bg-anu-navy px-4 py-2 text-sm font-semibold text-white hover:bg-[#293554] transition"
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

            <div className="rounded-3xl border border-[#E0D8CC] bg-white p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-anu-navy">
                <Users size={16} /> Timetable sharing
              </div>
              <div className="mt-4 space-y-3 text-sm text-anu-navy/80">
                {selectedGroup.memberIds.map((memberId) => {
                  const student = allStudents.find(
                    (item) => item.id === memberId,
                  );
                  const sessions = sessionsForUser(memberId);
                  return (
                    <div
                      key={memberId}
                      className="rounded-2xl border border-[#E0D8CC] bg-[#f8f5ef] p-3"
                    >
                      <div className="font-medium text-anu-navy">
                        {student?.name ?? memberId}
                      </div>
                      <div className="text-xs text-muted">
                        {student?.degree ?? "Student"}
                      </div>
                      <div className="mt-3 space-y-2">
                        {sessions.length === 0 ? (
                          <div className="rounded-2xl bg-white px-3 py-2 text-xs text-muted">
                            No timetable shared.
                          </div>
                        ) : (
                          sessions.map((session) => (
                            <div
                              key={session.id}
                              className="rounded-2xl bg-white px-3 py-2 text-xs"
                            >
                              <div className="font-medium text-anu-navy">
                                {session.courseId} {session.type}
                              </div>
                              <div>
                                {session.day}{" "}
                                {String(
                                  Math.floor(session.startMin / 60),
                                ).padStart(2, "0")}
                                :
                                {String(session.startMin % 60).padStart(2, "0")}{" "}
                                —{" "}
                                {String(
                                  Math.floor(session.endMin / 60),
                                ).padStart(2, "0")}
                                :{String(session.endMin % 60).padStart(2, "0")}
                              </div>
                              <div className="text-muted">
                                {session.location}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
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
