export function getDefaultDigestDays(config: Record<string, unknown>) {
  const value = config.defaultDigestDays;

  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.min(Math.max(Math.floor(value), 1), 30);
  }

  return 3;
}

export function getDefaultDigestLang(config: Record<string, unknown>) {
  return config.defaultDigestLang === "en" ? "en" : "zh";
}
