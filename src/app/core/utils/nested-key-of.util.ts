export type NestedKeyOf<CHK extends object> = {
  [key in keyof CHK & (string | number)]: CHK[key] extends object | null | undefined ? `${ key }` | `${ key }.${ NestedKeyOf<NonNullable<CHK[key]>> }` : `${ key }`;
}[keyof CHK & (string | number)];
