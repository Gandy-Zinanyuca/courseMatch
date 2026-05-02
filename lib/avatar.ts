import type { StudentId } from "./types";

const AVATAR_STYLES = ["personas", "lorelei", "adventurer", "notionists", "fun-emoji"] as const;

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export function seededInt(seed: string, min: number, max: number): number {
  const h = hash(seed);
  const span = max - min + 1;
  return min + (h % span);
}

export function mockAvatarUrl(userId: StudentId, name?: string): string {
  const style = AVATAR_STYLES[hash(userId) % AVATAR_STYLES.length];
  const seed = encodeURIComponent(`${userId}-${name ?? "student"}`);
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${seed}&backgroundType=gradientLinear&radius=50`;
}
