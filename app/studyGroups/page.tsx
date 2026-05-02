"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Plus, Search, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { cx } from "@/lib/cx";

export default function StudyGroupsPage() {
  const router = useRouter();
  const hydrated = useStore((s) => s.hydrated);
  const me = useStore((s) => s.myProfile);
  const courses = useStore((s) => s.courses);
  const studyGroups = useStore((s) => s.studyGroups);
  const courseByCode = useStore((s) => s.courseByCode);
  const createStudyGroup = useStore((s) => s.createStudyGroup);

  const [search, setSearch] = useState("");
  const [selectedCourseCode, setSelectedCourseCode] = useState<string>(
    courses[0]?.code ?? "",
  );
  const [showCreate, setShowCreate] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

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
            className="inline-flex items-center gap-2 rounded-full bg-terra px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-terra/20 transition hover:bg-terra-600"
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
              className="rounded-full bg-anu-navy px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#293554]"
            >
              Start study group
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-full border border-[#E0D8CC] px-4 py-2 text-sm text-anu-navy transition hover:border-terra hover:text-terra"
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
                    onClick={() => setSelectedCourseCode(course.code)}
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
                        <div className="mt-1 text-sm text-muted">
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
                    <Link
                      key={group.id}
                      href={`/studyGroups/${group.id}`}
                      className={cx(
                        "block w-full rounded-3xl border p-4 text-left transition",
                        "border-[#E0D8CC] bg-white hover:border-terra hover:bg-[#fffaf4]",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-base font-semibold text-anu-navy">
                            {group.name}
                          </div>
                          <div className="mt-1 text-sm text-muted">
                            {group.description}
                          </div>
                        </div>
                        <div className="text-right text-xs text-anu-navy/70">
                          <div>{group.memberIds.length} members</div>
                          <div>{group.requestIds.length} requests</div>
                          {isOwner && <div className="mt-1 text-sage">Owner</div>}
                          {isMember && !isOwner && (
                            <div className="mt-1 text-terra">Joined</div>
                          )}
                        </div>
                      </div>
                    </Link>
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
                    <Link
                      key={group.id}
                      href={`/studyGroups/${group.id}`}
                      className="block rounded-3xl border border-[#E0D8CC] bg-[#f8f5ef] p-4 transition hover:border-terra hover:bg-[#fffaf4]"
                    >
                      <div className="font-semibold text-anu-navy">
                        {group.name}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {course?.code} • {course?.name}
                      </div>
                      <div className="mt-2 text-xs text-anu-navy/75">
                        {group.memberIds.length} members ·{" "}
                        {group.requestIds.length} requests
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
