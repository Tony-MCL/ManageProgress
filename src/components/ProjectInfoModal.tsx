// src/components/ProjectInfoModal.tsx
import React, { useEffect, useState } from "react";
import "../styles/panel.css";

const STORAGE_KEY = "mcl-progress-project-info";

type ProjectInfo = {
  projectNumber: string;
  projectName: string;
  responsible: string;
  workSaturday: boolean;
  workSunday: boolean;
};

type ProjectInfoModalProps = {
  open: boolean;
  onClose: () => void;
};

const defaultInfo: ProjectInfo = {
  projectNumber: "",
  projectName: "",
  responsible: "",
  workSaturday: false,
  workSunday: false,
};

function loadFromStorage(): ProjectInfo {
  if (typeof window === "undefined") return defaultInfo;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultInfo;
    const parsed = JSON.parse(raw) as Partial<ProjectInfo>;
    return {
      projectNumber: parsed.projectNumber ?? "",
      projectName: parsed.projectName ?? "",
      responsible: parsed.responsible ?? "",
      workSaturday: !!parsed.workSaturday,
      workSunday: !!parsed.workSunday,
    };
  } catch {
    return defaultInfo;
  }
}

function saveToStorage(info: ProjectInfo) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {
    // stille feil – lagring er "best effort"
  }
}

/**
 * Prosjektinfo-modal
 * - Grunnleggende prosjektdata (nr/navn/ansvarlige)
 * - Valg for arbeid på lørdag/søndag
 * - Lagrer til localStorage slik at vi kan hente det opp i andre deler av appen senere
 */
const ProjectInfoModal: React.FC<ProjectInfoModalProps> = ({ open, onClose }) => {
  const [info, setInfo] = useState<ProjectInfo>(defaultInfo);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Last verdier fra storage når modalen åpnes første gang
  useEffect(() => {
    if (!open) return;
    if (!hasLoaded) {
      setInfo(loadFromStorage());
      setHasLoaded(true);
    }
  }, [open, hasLoaded]);

  // Escape lukker modalen
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange =
    (field: keyof ProjectInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setInfo((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  const handleSave = () => {
    const trimmed: ProjectInfo = {
      projectNumber: info.projectNumber.trim(),
      projectName: info.projectName.trim(),
      responsible: info.responsible.trim(),
      workSaturday: info.workSaturday,
      workSunday: info.workSunday,
    };
    saveToStorage(trimmed);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="mcl-modal-backdrop"
      onClick={handleBackdropClick}
      role="presentation"
    >
      <div
        className="mcl-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Prosjektinformasjon"
      >
        <div className="mcl-modal-header">
          <h2>Prosjektinformasjon</h2>
          <button
            type="button"
            className="mcl-modal-close"
            onClick={onClose}
            aria-label="Lukk"
          >
            ×
          </button>
        </div>

        <div className="mcl-modal-body">
          {/* Vi gjenbruker layout-klasser fra CalendarModal for å slippe ny CSS */}
          <div className="calendar-section">
            <h3>Grunnleggende informasjon</h3>
            <div className="calendar-form-grid">
              <label>
                Prosjektnummer
                <input
                  type="text"
                  value={info.projectNumber}
                  onChange={handleChange("projectNumber")}
                  placeholder="F.eks. 12345"
                />
              </label>
              <label>
                Prosjektnavn
                <input
                  type="text"
                  value={info.projectName}
                  onChange={handleChange("projectName")}
                  placeholder="F.eks. Hodnaberg – styringsanlegg"
                />
              </label>
              <label>
                Ansvarlige
                <textarea
                  value={info.responsible}
                  onChange={handleChange("responsible")}
                  placeholder="Navn, roller eller avdelinger (komma-separert)"
                  rows={3}
                />
              </label>
            </div>
          </div>

          <div className="calendar-section">
            <h3>Arbeidsdager i helg</h3>
            <p style={{ fontSize: "0.85rem", marginBottom: "0.5rem" }}>
              Disse valgene brukes senere til å bestemme om lørdag/søndag
              regnes som arbeidsdager i fremdriftsplanen.
            </p>
            <div className="calendar-section">
              <label className="calendar-checkbox-row">
                <input
                  type="checkbox"
                  checked={info.workSaturday}
                  onChange={handleChange("workSaturday")}
                />
                <span>Arbeid på lørdag i dette prosjektet</span>
              </label>
              <label className="calendar-checkbox-row">
                <input
                  type="checkbox"
                  checked={info.workSunday}
                  onChange={handleChange("workSunday")}
                />
                <span>Arbeid på søndag i dette prosjektet</span>
              </label>
            </div>
          </div>
        </div>

        <div className="mcl-modal-footer">
          <button type="button" onClick={handleSave}>
            Lagre
          </button>
          <button
            type="button"
            className="secondary"
            onClick={onClose}
            style={{ marginLeft: "0.5rem" }}
          >
            Avbryt
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectInfoModal;
