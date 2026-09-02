/**
 * porsche-design-system#4684: the DSR `splitChildren` helper runs
 * `typeof children === 'object' && 'type' in children`, and `typeof null` is
 * `'object'`, so a bare `null` child throws during prerender. It only fires in
 * `next build`, never in `next dev`.
 *
 * Every P* component that takes children is affected. Use `{cond && <X/>}`
 * (which yields `false`) for elements, and this helper for text.
 */
export function pdsText(value: string | number | null | undefined): string {
  return value === null || value === undefined ? '' : String(value);
}
