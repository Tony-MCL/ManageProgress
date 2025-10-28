import React, { useEffect, useState } from "react"

type HelpPanelProps = {
  open: boolean
  onClose: () => void
}

const HelpPanel: React.FC<HelpPanelProps> = ({ open, onClose }) => {
  const [content, setContent] = useState<string>("")

  // Leser README_USER.md dynamisk fra rot
  useEffect(() => {
    if (open) {
      fetch("/README_USER.md")
        .then((res) => res.text())
        .then(setContent)
        .catch(() =>
          setContent("Kunne ikke laste hjelpetekst. Prøv igjen senere.")
        )
    }
  }, [open])

  return (
    <div className={`help-panel ${open ? "open" : ""}`}>
      <div className="help-header">
        <h2>Hjelp</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div className="help-body">
        <pre>{content}</pre>
      </div>
    </div>
  )
}

export default HelpPanel
