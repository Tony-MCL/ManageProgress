/* ==== [BLOCK: Imports] BEGIN ==== */
import React, { useState } from "react"
import TableCore from "@/components/TableCore"
import Toolbar from "@/components/Toolbar"
import type { Aktivitet } from "@/types"
/* ==== [BLOCK: Imports] END ==== */

/* ==== [BLOCK: Demo data (safe to remove)] BEGIN ==== */
const INIT: Aktivitet[] = [
  { id: "1", aktivitet: "Kickoff", start: "2025-11-03", slutt: "2025-11-03", varighet: 1, avhengigheter: "", ansvar: "PM", farge: "blå" },
  { id: "2", aktivitet: "Designfase", start: "2025-11-04", slutt: "2025-11-14", varighet: 11, avhengigheter: "1", ansvar: "Engineering", farge: "grønn" }
]
/* ==== [BLOCK: Demo data (safe to remove)] END ==== */

const App: React.FC = () => {
  const [rows, setRows] = useState<Aktivitet[]>(INIT)

  function onAddRow() {
    // Delegerer til TableCore sin knapp også; dublisert i toolbar for tilgjengelighet
    setRows(r => [...r, {
      id: String(r.length + 1),
      aktivitet: "",
      start: undefined,
      slutt: undefined,
      varighet: undefined,
      avhengigheter: "",
      ansvar: "",
      farge: "auto"
    }])
  }
  function onDeleteRow() {
    // Sletting håndteres enklest fra TableCore sin knapp (som vet hvilken rad som er valgt).
    // Denne knappen er her for symmetri/videre design – vi gjør ikke noe her nå.
    alert("Tips: Bruk 'Slett valgt rad' under tabellen (den vet hvilken rad som er valgt).")
  }
  function onExportCsv() {
    // Samme som i TableCore; beholdes her som 'placeholder' for når vi flytter actions til en felles ToolbarCore senere.
    const head = ["Aktivitet","Start","Slutt","Varighet (d)","Avhengigheter","Ansvar","Farge"].join(";")
    const body = rows.map(r => [r.aktivitet, r.start ?? "", r.slutt ?? "", r.varighet ?? "", r.avhengigheter ?? "", r.ansvar ?? "", r.farge ?? "auto"].join(";"))
    const csv = [head, ...body].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const a = document.createElement("a")
    a.href = URL.createObjectURL(blob)
    a.download = "progress-lite.csv"
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <header className="app-header">
        <div className="brand">Manage Progress <span className="sub">— LITE</span></div>
        <div className="sub">TableCore v0.1 (låses når stabil)</div>
      </header>

      <Toolbar
        onAddRow={onAddRow}
        onDeleteRow={onDeleteRow}
        onPrint={() => window.print()}
      />

      <main style={{ flex: 1 }}>
        <TableCore rows={rows} onRowsChange={setRows} />
      </main>

      <footer className="footer">© {new Date().getFullYear()} MorningCoffee Labs — Prototype LITE</footer>
    </div>
  )
}
export default App
