import {
  DAYS,
  GRID_END_MIN,
  GRID_START_MIN,
  type Day,
  type Session,
  type SessionType,
  type StudentId,
  type User,
  type UserSession,
} from "./types";

/** Two sessions clash if same day and overlapping time range. */
export function sessionsClash(a: Session, b: Session): boolean {
  if (a.day !== b.day) return false;
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/** Sessions of the same course + type, excluding the current one. */
export function alternativeSessionsFor(
  currentSession: Session,
  allSessions: Session[]
): Session[] {
  return allSessions.filter(
    (s) =>
      s.id !== currentSession.id &&
      s.courseId === currentSession.courseId &&
      s.type === currentSession.type
  );
}

/**
 * Given the user's current sessions and a session they want to drop into,
 * is it safe? (No clash with their other sessions.) Returns the conflicting
 * session if any, or null if safe.
 */
export function dropClash(
  currentSessionId: string,
  targetSession: Session,
  userSessions: UserSession[],
  allSessions: Session[]
): Session | null {
  const otherIds = userSessions
    .map((u) => u.sessionId)
    .filter((id) => id !== currentSessionId);
  for (const id of otherIds) {
    const s = allSessions.find((x) => x.id === id);
    if (s && sessionsClash(s, targetSession)) return s;
  }
  return null;
}

/** Among alternatives, which are valid drop targets (no clash). */
export function validDropTargets(
  currentSession: Session,
  userSessions: UserSession[],
  allSessions: Session[]
): Session[] {
  return alternativeSessionsFor(currentSession, allSessions).filter(
    (alt) => !dropClash(currentSession.id, alt, userSessions, allSessions)
  );
}

/** How many of the given peer set sit in this session? */
export function peersInSession(
  sessionId: string,
  userSessions: UserSession[],
  peerIds: StudentId[]
): StudentId[] {
  const set = new Set(peerIds);
  return userSessions
    .filter((u) => u.sessionId === sessionId && set.has(u.userId))
    .map((u) => u.userId);
}

/** Day index 0-4 for Mon-Fri, or null for weekend. */
export function dayOfDate(d: Date): Day | null {
  const i = d.getDay(); // 0=Sun..6=Sat
  if (i < 1 || i > 5) return null;
  return DAYS[i - 1];
}

export type NowMoment = { day: Day; minute: number };

export function realNow(): NowMoment | null {
  const d = new Date();
  const day = dayOfDate(d);
  if (!day) return null;
  const minute = d.getHours() * 60 + d.getMinutes();
  return { day, minute };
}

export function isInSession(now: NowMoment, s: Session): boolean {
  return s.day === now.day && now.minute >= s.startMin && now.minute < s.endMin;
}

export function isFreeNow(
  now: NowMoment | null,
  userSessions: UserSession[],
  allSessions: Session[]
): boolean {
  if (!now) return true; // weekend = free
  for (const u of userSessions) {
    const s = allSessions.find((x) => x.id === u.sessionId);
    if (s && isInSession(now, s)) return false;
  }
  return true;
}

/** All sessions a user is currently in (usually 0 or 1). */
export function currentSessionsFor(
  now: NowMoment | null,
  userSessions: UserSession[],
  allSessions: Session[]
): Session[] {
  if (!now) return [];
  return userSessions
    .map((u) => allSessions.find((s) => s.id === u.sessionId))
    .filter((s): s is Session => !!s)
    .filter((s) => isInSession(now, s));
}

export const GRID = {
  startMin: GRID_START_MIN,
  endMin: GRID_END_MIN,
  rows: (GRID_END_MIN - GRID_START_MIN) / 30, // 22 half-hour rows for 8-19
};
