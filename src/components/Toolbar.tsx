import React from "react"

type Props = {
  onAddRow: () => void
  onDeleteRow: () => void
  onExportCsv: () => void
}

const Toolbar: React.FC<Props> = ({ onAddRow, onDeleteRow, onExportCsv }) => {
  return (
    <div className="toolbar">
      <button className="toolbtn ok" onClick={onAddRow}>➕ Ny rad</button>
      <button className="toolbtn danger" onClick={onDeleteRow}>🗑️ Slett valgt rad</button>
      <button className="toolbtn" onClick={onExportCsv}>⤓ Eksporter CSV</button>
    </div>
  )
}
export default Toolbar
