/** Prefix an absolute app path with the configured base, so links work under a sub-path too. */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${path}`;
}
