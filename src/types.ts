/* ==== [BLOCK: Types] BEGIN ==== */
export type FargeKey = "auto" | "blå" | "grønn" | "gul" | "rød" | "lilla"

export type Aktivitet = {
  id: string
  aktivitet: string
  start?: string // yyyy-mm-dd
  slutt?: string // yyyy-mm-dd
  varighet?: number // dager (inkl. slutt)
  avhengigheter?: string // f.eks. "1,3"
  ansvar?: string
  farge?: FargeKey
}
/* ==== [BLOCK: Types] END ==== */
