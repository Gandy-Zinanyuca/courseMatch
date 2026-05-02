"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  Course,
  PersonalityQuizDraft,
  Session,
  StudentId,
  StudyGroup,
  User,
  UserSession,
} from "./types";

import coursesJson from "@/data/courses.json";
import sessionsJson from "@/data/sessions.json";
import studentsJson from "@/data/students.json";
import userSessionsJson from "@/data/userSessions.json";

const SEED_COURSES = coursesJson as Course[];
const SEED_SESSIONS = sessionsJson as Session[];
const SEED_STUDENTS = studentsJson as User[];
const SEED_USER_SESSIONS = userSessionsJson as UserSession[];
const SEED_STUDENT_IDS = new Set(SEED_STUDENTS.map((student) => student.id));

function getSeedProfileById(id: StudentId) {
  return SEED_STUDENTS.find((student) => student.id === id);
}

function getSeedSessionsByUserId(userId: StudentId) {
  return SEED_USER_SESSIONS.filter((session) => session.userId === userId);
}
const SEED_STUDY_GROUPS: StudyGroup[] = [
  {
    id: "g1",
    courseCode: "COMP1100",
    name: "COMP1100 Study Circle",
    description: "Share schedules, swap sessions, and chat about assignments.",
    ownerId: SEED_STUDENTS[0].id,
    memberIds: [SEED_STUDENTS[0].id, SEED_STUDENTS[1].id],
    requestIds: [SEED_STUDENTS[2].id],
    chat: [
      {
        id: "c1",
        text: "Anyone free to swap into Thursday tutorial?",
        at: Date.now() - 1000 * 60 * 45,
        authorId: SEED_STUDENTS[0].id,
        authorName: SEED_STUDENTS[0].name,
      },
      {
        id: "c2",
        text: "I can join if someone moves into the 10am session.",
        at: Date.now() - 1000 * 60 * 20,
        authorId: SEED_STUDENTS[1].id,
        authorName: SEED_STUDENTS[1].name,
      },
    ],
  },
];

type PersistedSlice = {
  currentUserId: StudentId | null;
  // Mutable layer over seed data — represents YOU plus any swaps you've made.
  myProfile: User | null;
  myUserSessions: UserSession[]; // your sessionIds (only)
  profilesById: Partial<Record<StudentId, User>>;
  userSessionsById: Partial<Record<StudentId, UserSession[]>>;
  personalityDraft: PersonalityQuizDraft | null;
  // Optional time-warp for "free now" demos. null = real time.
  timeWarp: { day: number; minute: number } | null; // 0=Mon..4=Fri
  chatByUserId: Record<StudentId, ChatMessage[]>;
  studyGroups: StudyGroup[];
  hasSeenTutorial: boolean;
};

type State = PersistedSlice & {
  hydrated: boolean;
  setHydrated: (b: boolean) => void;

  // Derived getters (read-only)
  courses: Course[];
  sessions: Session[];

  // Returns ALL students = seed students + (you, if onboarded). You replace yourself in the list if your id collides.
  allStudents: () => User[];
  // Returns ALL userSessions = seed userSessions + your current sessions (no dupes).
  allUserSessions: () => UserSession[];
  studentById: (id: StudentId) => User | undefined;
  sessionById: (id: string) => Session | undefined;
  courseByCode: (code: string) => Course | undefined;
  sessionsForUser: (userId: StudentId) => Session[];
  groupByCourse: (courseCode: string) => StudyGroup[];
  groupsForUser: (userId: StudentId) => StudyGroup[];
  groupById: (groupId: string) => StudyGroup | undefined;

  // Mutations
  completeOnboarding: (user: User, sessionIds: string[]) => void;
  setPersonalityDraft: (draft: PersonalityQuizDraft) => void;
  clearPersonalityDraft: () => void;
  updateMyProfile: (patch: Partial<User>) => void;
  setMyCourses: (sessionIds: string[]) => void;
  swapMySession: (oldSessionId: string, newSessionId: string) => void;
  setCurrentUser: (id: StudentId | null) => void; // dev switcher
  resetDemo: () => void;
  setTimeWarp: (t: PersistedSlice["timeWarp"]) => void;
  chatForUser: (userId: StudentId) => ChatMessage[];
  appendChatMessage: (userId: StudentId, message: ChatMessage) => void;
  clearChatForUser: (userId: StudentId) => void;
  createStudyGroup: (
    courseCode: string,
    name: string,
    description: string,
  ) => void;
  requestJoinGroup: (groupId: string) => void;
  approveJoinRequest: (groupId: string, userId: StudentId) => void;
  declineJoinRequest: (groupId: string, userId: StudentId) => void;
  leaveStudyGroup: (groupId: string) => void;
  appendGroupChatMessage: (groupId: string, message: ChatMessage) => void;
  setHasSeenTutorial: (b: boolean) => void;
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      myProfile: null,
      myUserSessions: [],
      profilesById: {},
      userSessionsById: {},
      personalityDraft: null,
      timeWarp: null,
      chatByUserId: {},
      studyGroups: SEED_STUDY_GROUPS,
      hasSeenTutorial: false,
      hydrated: false,
      setHydrated: (b) => set({ hydrated: b }),

      courses: SEED_COURSES,
      sessions: SEED_SESSIONS,

      allStudents: () => {
        const profilesById = get().profilesById;
        const customProfiles = Object.values(profilesById).filter(
          (profile): profile is User => Boolean(profile),
        );
        const customById = new Map(
          customProfiles.map((profile) => [profile.id, profile]),
        );
        const mergedSeeds = SEED_STUDENTS.map(
          (seed) => customById.get(seed.id) ?? seed,
        );
        const customOnly = customProfiles.filter(
          (profile) => !SEED_STUDENT_IDS.has(profile.id),
        );
        return [...mergedSeeds, ...customOnly];
      },
      allUserSessions: () => {
        const sessionsById = get().userSessionsById;
        const savedEntries = Object.entries(sessionsById).filter(
          (
            entry,
          ): entry is [StudentId, UserSession[]] =>
            Boolean(entry[0]) && Array.isArray(entry[1]),
        );
        const result: UserSession[] = [];
        const seen = new Set<string>();
        const pushSessions = (sessions: UserSession[]) => {
          sessions.forEach((session) => {
            const key = `${session.userId}:${session.sessionId}`;
            if (seen.has(key)) return;
            seen.add(key);
            result.push(session);
          });
        };

        SEED_STUDENTS.forEach((student) => {
          pushSessions(
            sessionsById[student.id] ?? getSeedSessionsByUserId(student.id),
          );
        });

        savedEntries.forEach(([userId, sessions]) => {
          if (SEED_STUDENT_IDS.has(userId)) return;
          pushSessions(sessions);
        });

        return result;
      },
      studentById: (id) =>
        get()
          .allStudents()
          .find((s) => s.id === id),
      sessionById: (id) => get().sessions.find((s) => s.id === id),
      courseByCode: (code) => get().courses.find((c) => c.code === code),
      sessionsForUser: (userId) => {
        const ids = get()
          .allUserSessions()
          .filter((u) => u.userId === userId)
          .map((u) => u.sessionId);
        return get().sessions.filter((s) => ids.includes(s.id));
      },
      groupByCourse: (courseCode) =>
        get().studyGroups.filter((group) => group.courseCode === courseCode),
      groupsForUser: (userId) =>
        get().studyGroups.filter(
          (group) =>
            group.ownerId === userId || group.memberIds.includes(userId),
        ),
      groupById: (groupId) =>
        get().studyGroups.find((group) => group.id === groupId),

      completeOnboarding: (user, sessionIds) => {
        const myUserSessions = sessionIds.map((sid) => ({
          userId: user.id,
          sessionId: sid,
        }));
        set({
          currentUserId: user.id,
          myProfile: user,
          myUserSessions,
          profilesById: {
            ...get().profilesById,
            [user.id]: user,
          },
          userSessionsById: {
            ...get().userSessionsById,
            [user.id]: myUserSessions,
          },
        });
      },
      setPersonalityDraft: (draft) => set({ personalityDraft: draft }),
      clearPersonalityDraft: () => set({ personalityDraft: null }),
      updateMyProfile: (patch) => {
        const cur = get().myProfile;
        if (!cur) return;
        const next = { ...cur, ...patch };
        set({
          myProfile: next,
          profilesById: {
            ...get().profilesById,
            [cur.id]: next,
          },
        });
      },
      setMyCourses: (sessionIds) => {
        const id = get().currentUserId;
        if (!id) return;
        const myUserSessions = sessionIds.map((sid) => ({
          userId: id,
          sessionId: sid,
        }));
        set({
          myUserSessions,
          userSessionsById: {
            ...get().userSessionsById,
            [id]: myUserSessions,
          },
        });
      },
      swapMySession: (oldSessionId, newSessionId) => {
        const id = get().currentUserId;
        if (!id) return;
        const myUserSessions = get().myUserSessions.map((u) =>
          u.sessionId === oldSessionId
            ? { userId: id, sessionId: newSessionId }
            : u,
        );
        set({
          myUserSessions,
          userSessionsById: {
            ...get().userSessionsById,
            [id]: myUserSessions,
          },
        });
      },
      chatForUser: (userId) => get().chatByUserId[userId] ?? [],
      appendChatMessage: (userId, message) => {
        const existing = get().chatByUserId[userId] ?? [];
        set({
          chatByUserId: {
            ...get().chatByUserId,
            [userId]: [...existing, message],
          },
        });
      },
      clearChatForUser: (userId) => {
        const next = { ...get().chatByUserId };
        delete next[userId];
        set({ chatByUserId: next });
      },
      setCurrentUser: (id) => {
        if (id === null) {
          set({
            currentUserId: null,
            myProfile: null,
            myUserSessions: [],
          });
          return;
        }
        const profile = get().profilesById[id] ?? getSeedProfileById(id);
        if (!profile) return;
        const sessions =
          get().userSessionsById[id] ?? getSeedSessionsByUserId(id);
        set({
          currentUserId: id,
          myProfile: profile,
          myUserSessions: sessions,
        });
      },
      resetDemo: () => {
        set({
          currentUserId: null,
          myProfile: null,
          myUserSessions: [],
          profilesById: {},
          userSessionsById: {},
          personalityDraft: null,
          timeWarp: null,
          chatByUserId: {},
          studyGroups: SEED_STUDY_GROUPS,
        });
      },
      createStudyGroup: (courseCode, name, description) => {
        const userId = get().currentUserId;
        if (!userId) return;
        const id =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `g${Date.now()}`;
        const newGroup: StudyGroup = {
          id,
          courseCode,
          name,
          description,
          ownerId: userId,
          memberIds: [userId],
          requestIds: [],
          chat: [],
        };
        set({ studyGroups: [newGroup, ...get().studyGroups] });
      },
      requestJoinGroup: (groupId) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({
          studyGroups: get().studyGroups.map((group) =>
            group.id !== groupId
              ? group
              : {
                  ...group,
                  requestIds: group.requestIds.includes(userId)
                    ? group.requestIds
                    : [...group.requestIds, userId],
                },
          ),
        });
      },
      approveJoinRequest: (groupId, userId) => {
        set({
          studyGroups: get().studyGroups.map((group) =>
            group.id !== groupId
              ? group
              : {
                  ...group,
                  memberIds: group.memberIds.includes(userId)
                    ? group.memberIds
                    : [...group.memberIds, userId],
                  requestIds: group.requestIds.filter((id) => id !== userId),
                },
          ),
        });
      },
      declineJoinRequest: (groupId, userId) => {
        set({
          studyGroups: get().studyGroups.map((group) =>
            group.id !== groupId
              ? group
              : {
                  ...group,
                  requestIds: group.requestIds.filter((id) => id !== userId),
                },
          ),
        });
      },
      leaveStudyGroup: (groupId) => {
        const userId = get().currentUserId;
        if (!userId) return;
        set({
          studyGroups: get().studyGroups.map((group) =>
            group.id !== groupId
              ? group
              : {
                  ...group,
                  memberIds: group.memberIds.filter((id) => id !== userId),
                  requestIds: group.requestIds.filter((id) => id !== userId),
                },
          ),
        });
      },
      appendGroupChatMessage: (groupId, message) => {
        set({
          studyGroups: get().studyGroups.map((group) =>
            group.id !== groupId
              ? group
              : { ...group, chat: [...group.chat, message] },
          ),
        });
      },
      setTimeWarp: (t) => set({ timeWarp: t }),
      setHasSeenTutorial: (b) => set({ hasSeenTutorial: b }),
    }),
    {
      name: "coursematch-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        myProfile: s.myProfile,
        myUserSessions: s.myUserSessions,
        profilesById: s.profilesById,
        userSessionsById: s.userSessionsById,
        personalityDraft: s.personalityDraft,
        timeWarp: s.timeWarp,
        chatByUserId: s.chatByUserId,
        studyGroups: s.studyGroups,
        hasSeenTutorial: s.hasSeenTutorial,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.myProfile) {
          state.profilesById = {
            ...state.profilesById,
            [state.myProfile.id]: state.myProfile,
          };
        }
        if (state.currentUserId && state.myUserSessions.length > 0) {
          state.userSessionsById = {
            ...state.userSessionsById,
            [state.currentUserId]: state.myUserSessions,
          };
        }
        state.studyGroups = state.studyGroups.map((group) => {
          const ownerName = state.allStudents().find((student) => student.id === group.ownerId)?.name;
          return {
            ...group,
            chat: group.chat.map((message) => ({
              ...message,
              authorId:
                message.authorId ??
                (message.sender === "me"
                  ? state.currentUserId ?? undefined
                  : group.ownerId),
              authorName:
                message.authorName ??
                (message.sender === "me" ? state.myProfile?.name : ownerName),
            })),
          };
        });
        state?.setHydrated(true);
      },
    },
  ),
);
