"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  ChatMessage,
  Course,
  PersonalityQuizDraft,
  Session,
  StudentId,
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

type PersistedSlice = {
  currentUserId: StudentId | null;
  // Mutable layer over seed data — represents YOU plus any swaps you've made.
  myProfile: User | null;
  myUserSessions: UserSession[]; // your sessionIds (only)
  personalityDraft: PersonalityQuizDraft | null;
  // Optional time-warp for "free now" demos. null = real time.
  timeWarp: { day: number; minute: number } | null; // 0=Mon..4=Fri
  chatByUserId: Record<StudentId, ChatMessage[]>;
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
};

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      currentUserId: null,
      myProfile: null,
      myUserSessions: [],
      personalityDraft: null,
      timeWarp: null,
      chatByUserId: {},
      hydrated: false,
      setHydrated: (b) => set({ hydrated: b }),

      courses: SEED_COURSES,
      sessions: SEED_SESSIONS,

      allStudents: () => {
        const me = get().myProfile;
        if (!me) return SEED_STUDENTS;
        // Replace if collision (dev switcher), else append.
        const others = SEED_STUDENTS.filter((s) => s.id !== me.id);
        return [me, ...others];
      },
      allUserSessions: () => {
        const meId = get().currentUserId;
        const mine = get().myUserSessions;
        if (!meId) return SEED_USER_SESSIONS;
        const others = SEED_USER_SESSIONS.filter((u) => u.userId !== meId);
        return [...mine, ...others];
      },
      studentById: (id) => get().allStudents().find((s) => s.id === id),
      sessionById: (id) => get().sessions.find((s) => s.id === id),
      courseByCode: (code) => get().courses.find((c) => c.code === code),
      sessionsForUser: (userId) => {
        const ids = get()
          .allUserSessions()
          .filter((u) => u.userId === userId)
          .map((u) => u.sessionId);
        return get().sessions.filter((s) => ids.includes(s.id));
      },

      completeOnboarding: (user, sessionIds) => {
        set({
          currentUserId: user.id,
          myProfile: user,
          myUserSessions: sessionIds.map((sid) => ({ userId: user.id, sessionId: sid })),
        });
      },
      setPersonalityDraft: (draft) => set({ personalityDraft: draft }),
      clearPersonalityDraft: () => set({ personalityDraft: null }),
      updateMyProfile: (patch) => {
        const cur = get().myProfile;
        if (!cur) return;
        set({ myProfile: { ...cur, ...patch } });
      },
      setMyCourses: (sessionIds) => {
        const id = get().currentUserId;
        if (!id) return;
        set({ myUserSessions: sessionIds.map((sid) => ({ userId: id, sessionId: sid })) });
      },
      swapMySession: (oldSessionId, newSessionId) => {
        const id = get().currentUserId;
        if (!id) return;
        set({
          myUserSessions: get().myUserSessions.map((u) =>
            u.sessionId === oldSessionId ? { userId: id, sessionId: newSessionId } : u
          ),
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
          set({ currentUserId: null, myProfile: null, myUserSessions: [], chatByUserId: {} });
          return;
        }
        const seed = SEED_STUDENTS.find((s) => s.id === id);
        if (!seed) return;
        const sessionIds = SEED_USER_SESSIONS.filter((u) => u.userId === id).map(
          (u) => u.sessionId
        );
        set({
          currentUserId: id,
          myProfile: seed,
          myUserSessions: sessionIds.map((sid) => ({ userId: id, sessionId: sid })),
        });
      },
      resetDemo: () => {
        set({
          currentUserId: null,
          myProfile: null,
          myUserSessions: [],
          personalityDraft: null,
          timeWarp: null,
          chatByUserId: {},
        });
      },
      setTimeWarp: (t) => set({ timeWarp: t }),
    }),
    {
      name: "coursematch-v1",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        currentUserId: s.currentUserId,
        myProfile: s.myProfile,
        myUserSessions: s.myUserSessions,
        personalityDraft: s.personalityDraft,
        timeWarp: s.timeWarp,
        chatByUserId: s.chatByUserId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
