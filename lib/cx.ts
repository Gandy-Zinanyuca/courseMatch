// Tiny classnames helper. Avoids a clsx/cva dependency.
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
