/* ==== [BLOCK: Types] BEGIN ==== */
export type ColumnDef = {
  id: string
  label: string
  width?: number
}

export type RowData = Record<string, string>

/** Tabellens endringshendelser – holder grid rent, domenelogikk bor utenfor */
export type TableChangeEvent =
  | { type: "edit"; row: number; colId: string; value: string }
  | { type: "paste"; top: number; leftColId: string; data: string[][] }
  | { type: "resizeCol"; colId: string; width: number }

export type TableCoreApi = {
  /** Les alle rader (klonet) */
  getData(): RowData[]
  /** Skriv hele datasettet */
  setData(rows: RowData[]): void
  /** Sett celleverdi (uten fokusflytt) */
  setCell(row: number, colId: string, value: string): void
  /** Returner nåværende utvalg som [rowStart,rowEnd,colStartIndex,colEndIndex] */
  getSelection(): [number, number, number, number] | null
}
/* ==== [BLOCK: Types] END ==== */
