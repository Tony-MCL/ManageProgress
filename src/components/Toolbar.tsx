import React from "react"

type Props = {
  onAddRow: () => void
  onDeleteRow: () => void
  onPrint: () => void
}

const Toolbar: React.FC<Props> = ({ onAddRow, onDeleteRow, onPrint }) => {
  return (
    <div className="toolbar">
      <button className="toolbtn ok" onClick={onAddRow}>➕ Ny rad</button>
      <button className="toolbtn danger" onClick={onDeleteRow}>🗑️ Slett valgt rad</button>
      <button className="toolbtn" onClick={onPrint}>🖨️ Skriv ut / PDF</button>
    </div>
  )
}
export default Toolbar
