/* ==== [BLOCK: Date helpers] BEGIN ==== */
export function parseYmd(s?: string): Date | undefined {
  if (!s) return undefined
  // Forventet format "yyyy-mm-dd"
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (!m) return undefined
  const [_, yy, mm, dd] = m
  const d = new Date(Number(yy), Number(mm) - 1, Number(dd))
  return isNaN(d.getTime()) ? undefined : d
}

export function diffDaysInclusive(start?: string, slutt?: string): number | undefined {
  const a = parseYmd(start)
  const b = parseYmd(slutt)
  if (!a || !b) return undefined
  // Nullstill tid for å unngå TZ-effekter
  a.setHours(0, 0, 0, 0)
  b.setHours(0, 0, 0, 0)
  const ms = b.getTime() - a.getTime()
  const days = Math.floor(ms / 86400000)
  return days >= 0 ? days + 1 : undefined
}
/* ==== [BLOCK: Date helpers] END ==== */
