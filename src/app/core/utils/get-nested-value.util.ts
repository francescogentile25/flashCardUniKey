export function getNestedValue(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((o, key) => (o && o[key] !== undefined) ? o[key] : undefined, obj);
}
