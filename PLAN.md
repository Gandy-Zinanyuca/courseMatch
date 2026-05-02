# courseMatch — Build Plan (ANU edition)

A buildathon-scoped MVP for ANU students. Desktop-first web, in-memory data, Claude for AI moments.

## Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 14+ (App Router) + TypeScript** | Single repo for UI + API routes (needed for Claude calls). Fastest scaffold. |
| Styling | **Tailwind CSS + shadcn/ui** | Production-looking UI in hours. ANU palette overlay (navy + gold) via Tailwind config. |
| State | **Zustand** | Global store for current user, students, sessions. Persists to localStorage so refreshes don't reset. |
| Drag & drop | **dnd-kit** | Modern, accessible, works great inside grid layouts (better than react-dnd for this use case). |
| Data | **Static JSON seed files in `/data`** | No DB. Loaded into Zustand on boot. Mutations live in store + mirror to localStorage. |
| AI | **Anthropic SDK in Next.js API routes** | `@anthropic-ai/sdk`, model `claude-haiku-4-5`. Two endpoints: blurb + intro. |
| Icons | **lucide-react** | |
| Auth | **None** | Single seeded "you". Hidden dev switcher behind **Ctrl+Shift+U** to demo both sides of a swap. |

## ANU specifics

- **Student IDs** match `^u\d{7}$` (e.g. `u7234189`). Validated at onboarding; used as the primary key for `User`.
- **Course codes** drawn from the real ANU catalog. Initial seed list (mix of colleges, courses students realistically share):

  | Code | Name |
  |---|---|
  | COMP1100 | Programming as Problem Solving |
  | COMP1110 | Structured Programming |
  | COMP1710 | Web Development & Design |
  | COMP2400 | Relational Databases |
  | COMP2610 | Information Theory |
  | ENGN1211 | Engineering Design 1 |
  | MATH1013 | Mathematics & Applications 1 |
  | MATH1014 | Mathematics & Applications 2 |
  | STAT1003 | Statistical Techniques |
  | STAT1008 | Quantitative Research Methods |
  | PSYC1003 | Psychology 1 |
  | ECON1101 | Microeconomics 1 |

  Twelve courses is enough to give 25 students realistic overlapping enrolments without making seed data tedious. We can extend at any time.
- **Timetable bounds:** Mon–Fri, **8:00–19:00**, in 30-minute rows.
- **Branding:** "courseMatch" wordmark + ANU navy/gold accents. No logo lifting from ANU; just colour palette inspired by it.

## Directory layout

```
courseMatch/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # router: → /onboarding or /discover
│   ├── onboarding/
│   │   ├── page.tsx                 # step coordinator
│   │   ├── courses/page.tsx         # step 1: degree + courses + sessions
│   │   └── quiz/page.tsx            # step 2: 5-Q quiz
│   ├── discover/page.tsx            # main feed
│   ├── search/page.tsx
│   ├── profile/page.tsx             # my timetable + drag-and-drop swap + edit
│   ├── student/[id]/page.tsx        # public student view
│   └── api/ai/
│       ├── blurb/route.ts
│       └── intro/route.ts
├── components/
│   ├── timetable/
│   │   ├── WeekGrid.tsx             # static grid, used everywhere read-only
│   │   └── DraggableGrid.tsx        # editable grid wrapping WeekGrid in dnd-kit
│   ├── student/StudentCard.tsx
│   ├── swap/SwapPreview.tsx         # ghost-overlay during drag
│   ├── onboarding/{CourseSearch,SessionPicker,QuizForm}.tsx
│   ├── dev/UserSwitcher.tsx         # mounted at root, hidden until Ctrl+Shift+U
│   └── ui/                          # shadcn primitives
├── lib/
│   ├── store.ts                     # Zustand: currentUser, students, sessions, mutations
│   ├── matching.ts                  # ranking algorithm
│   ├── timetable.ts                 # clash detection + "free now" + drop-zone validation
│   ├── claude.ts                    # server-side Anthropic wrapper
│   └── types.ts
├── data/
│   ├── courses.json                 # 12 ANU courses
│   ├── sessions.json                # 1 lecture + 2-3 tutorials + 1-2 labs per course
│   ├── students.json                # 25 seeded students with u-id, profile, quiz answers
│   └── userSessions.json            # who's in which session
├── .env.local                       # ANTHROPIC_API_KEY
└── PLAN.md
```

## Data model

```ts
type User = {
  id: `u${string}`;                  // validated regex u\d{7}
  name: string;
  degree: string;
  year: 1|2|3|4;
  ageRange: '18-19'|'20-22'|'23+';
  gender: string;
  freeTimeInterests: string[];       // multi-select: gym, gaming, music, sport, art, socialising
  studyStyle: 'alone'|'small'|'large'|'no-preference';
};
type Course = { code: string; name: string };
type Session = {
  id: string; courseId: string;
  type: 'lecture'|'tutorial'|'lab';
  day: 'Mon'|'Tue'|'Wed'|'Thu'|'Fri';
  startMin: number; endMin: number;  // minutes from midnight
  location: string;
  capacity?: number;                 // optional, for showing "X/30 enrolled"
};
type UserSession = { userId: string; sessionId: string };
type Match = {
  userId: string; matchedUserId: string;
  shared: { courseCode: string; type: Session['type']; status: 'same'|'swappable' }[];
  score: number;
  blurb?: string;                    // lazy-filled from Claude
};
```

## Matching algorithm (`lib/matching.ts`)

For current user **U** vs every other student **S**:

1. For each course both are enrolled in, for each session type both have:
   - same `sessionId` → tag `same lecture/tutorial/lab`
   - different → tag `swappable`
2. Score:
   - **+100** per exact session match (drives "in your lab right now")
   - **+25** per swappable shared course
   - **+5** per matching quiz answer; **+3** per overlapping free-time interest (now that interests are multi-select)
3. Sort desc. Return top N for the feed.

Blurbs lazy-load from `/api/ai/blurb` only for visible cards.

## Swap flow — drag and drop (revised)

This replaces the "swap to match" one-click flow. **The user is in control of their own timetable.**

**Where:** `/profile` page hosts the editable `DraggableGrid`. From a student card on `/discover`, "View timetable" deep-links into `/profile` with the relevant peer's timetable rendered as a translucent overlay so you can see what slots they're in while you drag.

**Interaction:**

1. User grabs one of their own session blocks (e.g. their COMP2400 tutorial, currently Tue 11:00).
2. As they drag, valid drop zones light up: **other sessions of the same course + same type** (e.g. all alternative COMP2400 tutorials). Other slots are disabled.
3. Hovering a valid zone shows a live preview chip:
   - "Swap to Wed 14:00 lab — **3 of your matches sit here**" (lifts the count from the matching engine)
   - Or, if the drop would clash with another commitment: "Clashes with **MATH1013 lecture Wed 14:00**" — drop disallowed.
4. Drop on a valid zone → confirm modal → updates `userSessions` in Zustand → discover feed re-ranks.
5. Undo toast for 5s afterwards.

**Why drag-and-drop wins here:** the user can pick the slot that maximises overlap with **multiple** matches at once (e.g. one tutorial that has 4 different ranked students in it), rather than copying any single peer's timetable. That matches the messy reality the user pointed out — no two students share an identical schedule.

**`lib/timetable.ts` helpers needed:**
- `validDropTargets(currentSessionId, allSessions, userSessions)` → list of session IDs of the same course+type whose times don't clash with the rest of the user's timetable
- `dropZoneStats(targetSessionId, matchedStudents)` → `{ peerCount: number, peerNames: string[] }`
- `isFreeNow(userSessions, now)` → for the "Free now" badge

## "Free now" badge

Same as before. Helper takes `now`. Demo gets a **time-warp slider** (only visible to dev switcher) so the badge always works regardless of demo time.

## Onboarding revisions

**Step 1:**
- Field: **Student ID** (`u\d{7}`, validated)
- Field: Name, Degree (free text)
- Course search: type to filter, pick courses, then per-course session pickers (dropdowns), live `WeekGrid` preview updates after each pick.

**Step 2 — quiz (multi-select where noted):**
1. Year (1 / 2 / 3 / 4) — single
2. Age (18–19 / 20–22 / 23+) — single
3. Gender (options + prefer not to say) — single
4. Free time — gym / gaming / music / sport / art / socialising — **multi-select chips**
5. Study preference (alone / small group / large group / no preference) — single

## Hidden dev switcher

- Mounted in root layout. Listens for `keydown` with `ctrlKey + shiftKey + key === 'U'`.
- Toggles a fixed-position sidebar listing all 25 seeded students; clicking one swaps `currentUser` in the store.
- Also exposes the time-warp slider for the "Free now" badge.
- Same keystroke hides it.

## AI integration

Two server routes, both calling `claude-haiku-4-5`:

- **`/api/ai/blurb`** — POST `{ a: User, b: User }` → `{ blurb: string }`. 8–12 word phrase comparing study style + interests. Cached by sorted id pair.
- **`/api/ai/intro`** — POST `{ from, to, sharedCourses, sessionOverlap }` → `{ message: string }`. Casual 2-sentence opener.

Server-only. `ANTHROPIC_API_KEY` in `.env.local`.

## Build order

**Phase 1 — Foundation**
- `npx create-next-app`, Tailwind, shadcn init, Zustand, dnd-kit
- `lib/types.ts` finalised
- Seed: 12 courses × ~4 sessions each, 25 students with `u\d{7}` IDs, realistic overlapping enrolments
- `WeekGrid` component (read-only, used everywhere)

**Phase 2 — Onboarding**
- Step 1: student ID + degree + course/session picker with live grid
- Step 2: 5-Q quiz with multi-select interests
- On finish: write currentUser + UserSessions into store + localStorage; redirect to `/discover`

**Phase 3 — Discover feed**
- `lib/matching.ts` ranking
- `StudentCard` with shared course chips, session-status label, "Free now" badge, View timetable / Message buttons

**Phase 4 — Drag-and-drop swap (the headline feature)**
- `DraggableGrid` wrapping `WeekGrid` with dnd-kit
- `validDropTargets` + `dropZoneStats` helpers
- Live preview chip during drag
- Confirm modal + undo toast

**Phase 5 — Search + Profile + Student detail**
- Search page (filter by name / course code / degree)
- My Profile already exists from phase 4 (it hosts the draggable grid); add "edit courses" + "edit quiz" sections
- `student/[id]` public view

**Phase 6 — AI wiring**
- `/api/ai/blurb` + `/api/ai/intro`
- Message button: modal with AI-drafted opener, copy-to-clipboard

**Phase 7 — Demo polish**
- Hidden dev switcher (Ctrl+Shift+U) + time-warp
- Empty states, skeleton loaders
- Scripted demo: open as fresh student → see one classmate in your lab + several swappables → drag your tutorial to a slot where 3 matches sit → refresh discover, you now share that tutorial with all of them

## Decisions baked in

- Single "you" persisted to localStorage. Dev switcher behind keystroke for demoing both sides.
- No realtime — swaps are local. Fine for solo demo.
- Mon–Fri 8:00–19:00, 30-min rows.
- Free-time interests are multi-select chips.
- Drag-and-drop replaces 1-click "swap to match". Quick "View timetable" from a card overlays their schedule on yours so dragging is informed by who you'd join.
- 25 seeded students, `u\d{7}` IDs.
- ANU course codes from the real catalog (12 to start).
- Intro messages drafted by Claude → copy to clipboard. No real messaging backend.
