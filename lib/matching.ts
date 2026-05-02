import type {
  Course,
  Match,
  Session,
  SessionType,
  SharedSession,
  StudentId,
  User,
  UserSession,
} from "./types";

const SCORE_SAME_SESSION = 100;
const SCORE_SWAPPABLE = 25;
const SCORE_QUIZ_MATCH = 5;
const SCORE_INTEREST_OVERLAP = 3;

function quizSimilarity(a: User, b: User): number {
  let score = 0;
  if (a.year === b.year) score += SCORE_QUIZ_MATCH;
  if (a.ageRange === b.ageRange) score += SCORE_QUIZ_MATCH;
  if (a.studyStyle === b.studyStyle) score += SCORE_QUIZ_MATCH;
  const interestOverlap = a.freeTimeInterests.filter((i) =>
    b.freeTimeInterests.includes(i)
  ).length;
  score += interestOverlap * SCORE_INTEREST_OVERLAP;
  return score;
}

/** Returns shared session details + raw session-shape score. */
function sharedSessionsBetween(
  a: User,
  b: User,
  allUserSessions: UserSession[],
  allSessions: Session[],
  courses: Course[]
): { shared: SharedSession[]; sessionScore: number } {
  const aSessIds = new Set(
    allUserSessions.filter((u) => u.userId === a.id).map((u) => u.sessionId)
  );
  const bSessIds = new Set(
    allUserSessions.filter((u) => u.userId === b.id).map((u) => u.sessionId)
  );

  const aSessions = allSessions.filter((s) => aSessIds.has(s.id));
  const bSessions = allSessions.filter((s) => bSessIds.has(s.id));

  const courseByCode = new Map(courses.map((c) => [c.code, c]));

  // Group by (courseId, type) for both users.
  type Bucket = Map<string, Session>; // key = `${courseId}::${type}` -> session
  function bucketize(list: Session[]): Bucket {
    const m: Bucket = new Map();
    for (const s of list) m.set(`${s.courseId}::${s.type}`, s);
    return m;
  }
  const aB = bucketize(aSessions);
  const bB = bucketize(bSessions);

  const shared: SharedSession[] = [];
  let sessionScore = 0;
  for (const key of new Set([...aB.keys(), ...bB.keys()])) {
    const aS = aB.get(key);
    const bS = bB.get(key);
    if (!aS || !bS) continue;
    const courseName = courseByCode.get(aS.courseId)?.name ?? aS.courseId;
    if (aS.id === bS.id) {
      shared.push({
        courseCode: aS.courseId,
        courseName,
        type: aS.type,
        status: "same",
        theirSessionId: bS.id,
        yourSessionId: aS.id,
      });
      sessionScore += SCORE_SAME_SESSION;
    } else {
      shared.push({
        courseCode: aS.courseId,
        courseName,
        type: aS.type,
        status: "swappable",
        theirSessionId: bS.id,
        yourSessionId: aS.id,
      });
      sessionScore += SCORE_SWAPPABLE;
    }
  }

  // Sort shared so "same" entries come first, then by course code.
  shared.sort((x, y) => {
    if (x.status !== y.status) return x.status === "same" ? -1 : 1;
    return x.courseCode.localeCompare(y.courseCode);
  });

  return { shared, sessionScore };
}

export function rankMatches(
  me: User,
  allStudents: User[],
  allUserSessions: UserSession[],
  allSessions: Session[],
  courses: Course[]
): Match[] {
  const matches: Match[] = [];
  for (const s of allStudents) {
    if (s.id === me.id) continue;
    const { shared, sessionScore } = sharedSessionsBetween(
      me,
      s,
      allUserSessions,
      allSessions,
      courses
    );
    if (shared.length === 0) continue; // no shared courses -> not in feed
    const score = sessionScore + quizSimilarity(me, s);
    matches.push({ user: s, shared, score });
  }
  matches.sort((a, b) => b.score - a.score);
  return matches;
}
