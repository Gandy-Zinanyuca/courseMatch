// Core domain types — referenced by lib, components, and seed data.

export type StudentId = `u${string}`; // pattern enforced at runtime: ^u\d{7}$

export type Day = "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
export const DAYS: Day[] = ["Mon", "Tue", "Wed", "Thu", "Fri"];

export type SessionType = "lecture" | "tutorial" | "lab";

export type Year = 1 | 2 | 3 | 4;
export type AgeRange = "18-19" | "20-22" | "23+";
export type StudyStyle = "alone" | "small" | "large" | "no-preference";
export type ProductiveTime = "morning" | "afternoon" | "night" | "flexible";
export type PartnerPriority =
  | "courses"
  | "goals"
  | "personality"
  | "everything";
export type PersonalityQuizDraft = {
  studyStyle: StudyStyle | null;
  productiveTime: ProductiveTime | null;
  partnerPriority: PartnerPriority | null;
  freeTimeInterests: FreeTime[];
};

export const FREE_TIME_OPTIONS = [
  "gym",
  "gaming",
  "music",
  "sport",
  "art",
  "socialising",
] as const;
export type FreeTime = (typeof FREE_TIME_OPTIONS)[number];

export type User = {
  id: StudentId;
  name: string;
  degree: string;
  year: Year;
  ageRange: AgeRange;
  gender: string;
  freeTimeInterests: FreeTime[];
  studyStyle: StudyStyle;
  productiveTime?: ProductiveTime;
  partnerPriority?: PartnerPriority;
};

export type Course = {
  code: string;
  name: string;
};

export type Session = {
  id: string;
  courseId: string; // course code, e.g. "COMP1100"
  type: SessionType;
  day: Day;
  startMin: number; // minutes from midnight
  endMin: number;
  location: string;
};

export type UserSession = {
  userId: StudentId;
  sessionId: string;
};

export type StudyGroup = {
  id: string;
  courseCode: string;
  name: string;
  description: string;
  ownerId: StudentId;
  memberIds: StudentId[];
  requestIds: StudentId[];
  chat: ChatMessage[];
};

export type SharedSession = {
  courseCode: string;
  courseName: string;
  type: SessionType;
  status: "same" | "swappable";
  // The other person's session ID (handy for the swap modal preview).
  theirSessionId: string;
  // Your session ID (only meaningful when status === 'swappable').
  yourSessionId?: string;
};

export type Match = {
  user: User;
  shared: SharedSession[];
  score: number;
  blurb?: string;
};

export type ChatSender = "me" | "them";

export type ChatMessage = {
  id: string;
  text: string;
  at: number;
  authorId?: StudentId;
  authorName?: string;
  sender?: ChatSender;
};

// Bounds for the timetable grid (in minutes from midnight).
export const GRID_START_MIN = 8 * 60; // 08:00
export const GRID_END_MIN = 19 * 60; // 19:00
export const SLOT_MIN = 30; // 30-min rows

// Validation
export const STUDENT_ID_RE = /^u\d{7}$/;
export const isStudentId = (s: string): s is StudentId => STUDENT_ID_RE.test(s);

// Helpers
export const minToHHMM = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export const sessionTypeLabel: Record<SessionType, string> = {
  lecture: "Lecture",
  tutorial: "Tutorial",
  lab: "Lab",
};
