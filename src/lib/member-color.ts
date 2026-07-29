/**
 * Maps a household member's position in `household.members` (index 0 or 1 —
 * household size is hard-capped at two, see
 * src/domain/household/household-member-cap.test.ts) to one of two fixed
 * accent colors. Colors are CSS custom properties defined in globals.css, so
 * they adapt automatically between light and dark mode. Not stored, not
 * configurable — see docs/adr/0003-member-accent-color-by-household-order.md.
 */
export type MemberAccent = {
  color: string;
  foreground: string;
};

const MEMBER_ACCENTS: [MemberAccent, MemberAccent] = [
  { color: "var(--member-1)", foreground: "var(--member-1-foreground)" },
  { color: "var(--member-2)", foreground: "var(--member-2-foreground)" },
];

export function memberAccent(memberIndex: 0 | 1): MemberAccent {
  return MEMBER_ACCENTS[memberIndex];
}
