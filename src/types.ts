export type ColumnDef = {
  id: string
  label: string
  width?: number
  readOnly?: boolean
  placeholder?: string   // vises kun ved fokus når cella er tom
}

export type RowData = Record<string, string>

export type TableChangeEvent =
  | { type: "edit"; row: number; colId: string; value: string }
  | { type: "paste"; top: number; leftColId: string; data: string[][] }
  | { type: "resizeCol"; colId: string; width: number }

export type TableCoreApi = {
  getData(): RowData[]
  setData(rows: RowData[]): void
  setCell(row: number, colId: string, value: string): void
  getSelection(): [number, number, number, number] | null
}
