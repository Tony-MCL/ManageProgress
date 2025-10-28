import React from "react"

type HelpModalProps = {
  open: boolean
  onClose: () => void
}

const HelpModal: React.FC<HelpModalProps> = ({ open, onClose }) => {
  if (!open) return null

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>Hjelp – Manage Progress LITE</h2>

        <section>
          <h3>Navigasjon og markering</h3>
          <ul>
            <li><b>Klikk:</b> Velg celle for redigering</li>
            <li><b>Shift + klikk:</b> Marker område</li>
            <li><b>Piltaster:</b> Flytt markering</li>
            <li><b>Ctrl + C / V / X:</b> Kopier, lim, klipp</li>
            <li><b>Ctrl + Z / Y:</b> Angre / Gjenta</li>
          </ul>
        </section>

        <section>
          <h3>Rader</h3>
          <ul>
            <li><b>➕ Ny rad:</b> Legg til nederst</li>
            <li><b>🗑️ Slett rad:</b> Fjern valgt</li>
            <li><b>Dra i #:</b> Endre rekkefølge</li>
          </ul>
        </section>

        <section>
          <h3>Kolonner</h3>
          <ul>
            <li><b>Dra i navn:</b> Flytt kolonne</li>
            <li><b>Dra i høyrekant:</b> Endre bredde</li>
            <li><b>#-kolonnen:</b> Fast bredde, ikke redigerbar</li>
          </ul>
        </section>

        <section>
          <h3>Utskrift</h3>
          <ul>
            <li><b>🖨️ Skriv ut / PDF:</b> Åpner utskriftsdialog</li>
          </ul>
        </section>

        <div className="modal-footer">
          <button onClick={onClose}>Lukk</button>
        </div>
      </div>
    </div>
  )
}

export default HelpModal
