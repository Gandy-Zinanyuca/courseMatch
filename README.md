# courseMatch

Find ANU classmates in your labs and tutorials, see who's in different sessions of the same course, and drag-and-drop your timetable to swap into the sessions where your matches sit.

Built for the buildathon. Desktop-first web app, no real backend, Claude for the AI moments.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** (with an ANU navy/gold accent palette)
- **Zustand** for state, persisted to localStorage
- **dnd-kit** for the drag-and-drop swap on the timetable
- **Anthropic SDK** (`claude-haiku-4-5`) for compatibility blurbs and intro-message drafting
- **lucide-react** for icons

No database. Seed data lives in `/data` as JSON: 12 ANU courses, 47 sessions across lectures/tutorials/labs, 25 seeded students with realistic overlapping enrolments.

## Run it

```bash
npm install
cp .env.local.example .env.local      # then fill in ANTHROPIC_API_KEY
npm run dev
```

The AI is optional — without an API key the blurb and message endpoints fall back to deterministic templates so the UI still works.

## Demo path

1. **Onboard.** Drop in a student ID matching `u\d{7}`, pick 3-4 courses with their lecture/tutorial/lab sessions, fill in the 5 quiz questions.
2. **Discover.** Land on a feed ranked by who's in your sessions, then who you could swap into. Cards have AI-generated one-liners explaining why you'd get along.
3. **Swap.** Hit "View timetable" on someone in a different session of a shared course, opens your profile with their schedule overlaid as a translucent ghost. Grab one of your own session blocks and drag it. Valid drop zones light up green ("3 matches sit here"), invalid ones red ("clashes with MATH1013"). Drop, confirm, your feed re-ranks.
4. **Search.** Find anyone by name, student ID, course code, or degree.

## Hidden dev menu

Press **Ctrl + Shift + U** to open a sidebar where you can:
- Become any of the 25 seeded students (instantly demos "the other side" of a swap)
- Time-warp to any Mon-Fri / 30-min slot to drive the "Free now" badge
- Reset the demo

## File map

```
app/
  layout.tsx                top nav + global toast host + dev switcher
  page.tsx                  router -> /onboarding or /discover
  onboarding/page.tsx       2-step setup
  discover/page.tsx         ranked feed
  search/page.tsx
  profile/page.tsx          editable timetable (drag-and-drop swap)
  student/[id]/page.tsx     public profile + their week
  api/ai/blurb/route.ts     POST {me,other} -> {blurb}
  api/ai/intro/route.ts     POST {me,other,shared} -> {message}

components/
  layout/TopNav.tsx
  timetable/WeekGrid.tsx       read-only Mon-Fri grid
  timetable/DraggableGrid.tsx  drag-and-drop swap grid
  student/StudentCard.tsx      discover-feed card
  student/MessageModal.tsx
  onboarding/CourseSessionPicker.tsx
  dev/DevSwitcher.tsx          hidden Ctrl+Shift+U sidebar
  ui/Toast.tsx

lib/
  types.ts        shared domain types
  store.ts        Zustand store (persists currentUser + their session ids)
  matching.ts     ranking algorithm
  timetable.ts    clash detection, valid drop targets, free-now
  claude.ts       server-only Anthropic SDK wrapper
  cx.ts           tiny classnames helper

data/
  courses.json
  sessions.json
  students.json
  userSessions.json
```

## Matching algorithm (`lib/matching.ts`)

For each peer `S` vs current user `U`, walk every (course, session-type) bucket they both have:

| Tag        | Score |
|------------|-------|
| same session  | +100 |
| swappable     | +25  |
| matching quiz answer (year, age, study style) | +5 each |
| overlapping interest                          | +3 each |

Sort descending. Anyone with no shared courses is filtered out of the feed.

## Swap mechanics (`lib/timetable.ts`)

`validDropTargets(currentSession, userSessions, allSessions)` returns alternative sessions of the same course + type whose times don't clash with the rest of your week. The DraggableGrid renders one drop zone per alternative — green if valid, red if it would clash. As you hover a green one, a peer count is shown ("N of your matches are here") so you can pick the slot that maximises overlap across multiple matches at once, not just any single peer's schedule.

## Notes

- Onboarding persists to `localStorage` under `coursematch-v1`. Dev menu's "Reset" clears it.
- `claude.ts` falls back to deterministic templates when `ANTHROPIC_API_KEY` is missing, so the demo doesn't break offline.
- The grid covers Mon-Fri 08:00-19:00 in 30-minute rows. Real ANU course catalogue codes used for the 12 seed courses.
