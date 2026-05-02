// Server-only Anthropic wrapper.

import Anthropic from "@anthropic-ai/sdk";
import type { SharedSession, User } from "./types";

let _client: Anthropic | null = null;
function client(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

const MODEL = "claude-haiku-4-5";

function userBlurbProfile(u: User): string {
  return [
    `Year ${u.year}`,
    u.studyStyle === "no-preference" ? "no study style preference" : `prefers ${u.studyStyle} study`,
    u.productiveTime ? `${u.productiveTime} person` : "",
    u.partnerPriority ? `values ${u.partnerPriority}` : "",
    u.freeTimeInterests.length ? `enjoys ${u.freeTimeInterests.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export async function blurbForPair(a: User, b: User): Promise<string> {
  const c = client();
  if (!c) {
    // Deterministic fallback so the UI still works without an API key.
    const overlap = a.freeTimeInterests.filter((i) => b.freeTimeInterests.includes(i));
    if (a.partnerPriority && b.partnerPriority && a.partnerPriority === b.partnerPriority)
      return `Both care about ${a.partnerPriority}`;
    if (overlap.length) return `Both into ${overlap.slice(0, 2).join(" and ")}`;
    if (a.studyStyle === b.studyStyle && a.studyStyle !== "no-preference")
      return `Same study style — ${a.studyStyle} groups`;
    return "Worth saying hi to";
  }

  const sys =
    "You write a single short phrase (8-12 words, no period at end) describing what two university students have in common, based on their study style, energy, priorities, and interests. No emojis, no names, no quotes. Just the phrase.";
  const usr = `Student A: ${userBlurbProfile(a)}.
Student B: ${userBlurbProfile(b)}.

Phrase:`;

  const res = await c.messages.create({
    model: MODEL,
    max_tokens: 60,
    system: sys,
    messages: [{ role: "user", content: usr }],
  });
  const txt = res.content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim()
    .replace(/^["']|["']$/g, "");
  return txt || "Worth saying hi to";
}

export async function introMessage(
  from: User,
  to: User,
  shared: SharedSession[]
): Promise<string> {
  const c = client();
  const sameSessions = shared.filter((s) => s.status === "same");
  const swap = shared.filter((s) => s.status === "swappable");
  const sharedInterests = from.freeTimeInterests.filter((i) =>
    to.freeTimeInterests.includes(i)
  );

  if (!c) {
    // Fallback template
    const courseLine = sameSessions.length
      ? `we're both in ${sameSessions[0].courseCode} ${sameSessions[0].type}`
      : swap.length
      ? `we're both doing ${swap[0].courseCode}`
      : "we're in some of the same courses";
    const interestLine = sharedInterests.length
      ? ` Saw you're into ${sharedInterests[0]} too.`
      : "";
    return `Hey ${to.name.split(" ")[0]} — ${courseLine}.${interestLine} Wanted to say hi.`;
  }

  const sys =
    "You draft very short, casual opening messages between two university classmates who haven't met. 2 sentences max. Friendly but not over-the-top. No emojis. Reference one shared course or session and one shared interest if available. Use first names only.";
  const usr = `From: ${from.name} (year ${from.year}, ${from.degree}, into ${from.freeTimeInterests.join(
    "/"
  ) || "n/a"})
To: ${to.name} (year ${to.year}, ${to.degree}, into ${to.freeTimeInterests.join("/") || "n/a"})

Same sessions: ${sameSessions.map((s) => `${s.courseCode} ${s.type}`).join(", ") || "none"}
Same courses (different sessions): ${swap.map((s) => `${s.courseCode} ${s.type}`).join(", ") || "none"}
Shared interests: ${sharedInterests.join(", ") || "none"}

Write the opener (no preamble, no quotes):`;

  const res = await c.messages.create({
    model: MODEL,
    max_tokens: 200,
    system: sys,
    messages: [{ role: "user", content: usr }],
  });
  return res.content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
    .trim();
}
