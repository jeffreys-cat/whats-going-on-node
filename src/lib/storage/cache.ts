export function buildDailyCacheKey(sourceId: string, rangeStart: string, rangeEnd: string) {
  return `${sourceId}:${rangeStart}:${rangeEnd}`;
}
