import React, { useState } from "react"
import HelpModal from "./HelpModal"

type Props = {
  onAddRow: () => void
  onDeleteRow: () => void
  onPrint: () => void
}

const Toolbar: React.FC<Props> = ({ onAddRow, onDeleteRow, onPrint }) => {
  const [helpOpen, setHelpOpen] = useState(false)

  return (
    <>
      <div className="toolbar">
        <button className="toolbtn ok" onClick={onAddRow}>➕ Ny rad</button>
        <button className="toolbtn danger" onClick={onDeleteRow}>🗑️ Slett valgt rad</button>
        <button className="toolbtn" onClick={onPrint}>🖨️ Skriv ut / PDF</button>
        <button className="toolbtn info" onClick={() => setHelpOpen(true)}>❓ Hjelp</button>
      </div>

      <HelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />
    </>
  )
}

export default Toolbar
