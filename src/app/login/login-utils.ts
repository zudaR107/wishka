export function isSafeNextUrl(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}
