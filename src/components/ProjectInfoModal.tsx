// src/components/ProjectInfoModal.tsx
import React, { useEffect, useState } from "react";
import "../styles/panel.css";

const STORAGE_KEY = "mcl-progress-project-info";

type ProjectInfo = {
  projectNumber: string;
  projectName: string;
  responsible: string;
  customer: string;
  contractValue: string;
  projectManager: string;
  notes: string;
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
  customer: "",
  contractValue: "",
  projectManager: "",
  notes: "",
  workSaturday: false,
  workSunday: false
};

function loadFromStorage(): ProjectInfo {
  if (typeof window === "undefined") return defaultInfo;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultInfo;
    const parsed = JSON.parse(raw) as Partial<ProjectInfo>;
    return {
      projectNumber: parsed.projectNumber ?? "",
      projectName: parsed.projectName ?? "",
      responsible: parsed.responsible ?? "",
      customer: parsed.customer ?? "",
      contractValue: parsed.contractValue ?? "",
      projectManager: parsed.projectManager ?? "",
      notes: parsed.notes ?? "",
      workSaturday: !!parsed.workSaturday,
      workSunday: !!parsed.workSunday
    };
  } catch {
    return defaultInfo;
  }
}

function saveToStorage(info: ProjectInfo) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(info));
  } catch {}
}

export default function ProjectInfoModal({ open, onClose }: ProjectInfoModalProps) {
  const [info, setInfo] = useState<ProjectInfo>(defaultInfo);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(true);
  const [savedToast, setSavedToast] = useState(false);

  // Last data når modalen åpnes
  useEffect(() => {
    if (!open) return;

    if (!hasLoaded) {
      const loaded = loadFromStorage();
      setInfo(loaded);

      const exists =
        loaded.projectNumber ||
        loaded.projectName ||
        loaded.customer ||
        loaded.contractValue ||
        loaded.projectManager ||
        loaded.notes ||
        loaded.responsible;

      // Hvis data finnes → start i lese-modus
      setIsEditing(!exists);

      setHasLoaded(true);
    }
  }, [open, hasLoaded]);

  // Toast timer
  useEffect(() => {
    if (!savedToast) return;

    const id = setTimeout(() => setSavedToast(false), 2000);
    return () => clearTimeout(id);

  }, [savedToast]);

  if (!open) return null;

  const disable = !isEditing;

  const onChange =
    (field: keyof ProjectInfo) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!isEditing) return;
      const value =
        e.target.type === "checkbox"
          ? (e.target as HTMLInputElement).checked
          : e.target.value;
      setInfo((prev) => ({ ...prev, [field]: value }));
    };

  const handleSave = () => {
    const trimmed: ProjectInfo = {
      projectNumber: info.projectNumber.trim(),
      projectName: info.projectName.trim(),
      responsible: info.responsible.trim(),
      customer: info.customer.trim(),
      contractValue: info.contractValue.trim(),
      projectManager: info.projectManager.trim(),
      notes: info.notes.trim(),
      workSaturday: info.workSaturday,
      workSunday: info.workSunday
    };

    saveToStorage(trimmed);
    setInfo(trimmed);

    // Gå til lese-modus
    setIsEditing(false);

    // Vis liten bekreftelse
    setSavedToast(true);
  };

  return (
    <div className="mcl-modal-backdrop" onClick={() => onClose()}>
      <div className="mcl-modal" onClick={(e) => e.stopPropagation()}>
        <div className="mcl-modal-header">
          <h2>Prosjektinformasjon</h2>
          <button className="mcl-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="mcl-modal-body">
          {savedToast && (
            <div className="mcl-modal-toast">
              Prosjektinformasjon lagret
            </div>
          )}

          <div className="calendar-section">
            <h3>Grunnleggende informasjon</h3>
            <div className="calendar-form-grid">
              <label>
                Prosjektnummer
                <input
                  disabled={disable}
                  value={info.projectNumber}
                  onChange={onChange("projectNumber")}
                />
              </label>

              <label>
                Prosjektnavn
                <input
                  disabled={disable}
                  value={info.projectName}
                  onChange={onChange("projectName")}
                />
              </label>

              <label>
                Ansvarlige
                <textarea
                  disabled={disable}
                  rows={3}
                  value={info.responsible}
                  onChange={onChange("responsible")}
                />
              </label>
            </div>
          </div>

          <div className="calendar-section">
            <h3>Kunde og kontrakt</h3>
            <div className="calendar-form-grid">
              <label>
                Kunde
                <input
                  disabled={disable}
                  value={info.customer}
                  onChange={onChange("customer")}
                />
              </label>

              <label>
                Kontraktsverdi
                <input
                  disabled={disable}
                  value={info.contractValue}
                  onChange={onChange("contractValue")}
                />
              </label>

              <label>
                Prosjektleder
                <input
                  disabled={disable}
                  value={info.projectManager}
                  onChange={onChange("projectManager")}
                />
              </label>
            </div>
          </div>

          <div className="calendar-section">
            <h3>Arbeidsdager i helg</h3>
            <label className="calendar-checkbox-row">
              <input
                type="checkbox"
                disabled={disable}
                checked={info.workSaturday}
                onChange={onChange("workSaturday")}
              />
              Lørdag er arbeidsdag
            </label>

            <label className="calendar-checkbox-row">
              <input
                type="checkbox"
                disabled={disable}
                checked={info.workSunday}
                onChange={onChange("workSunday")}
              />
              Søndag er arbeidsdag
            </label>
          </div>

          <div className="calendar-section">
            <h3>Notater</h3>
            <textarea
              disabled={disable}
              rows={4}
              value={info.notes}
              onChange={onChange("notes")}
            />
          </div>
        </div>

        <div className="mcl-modal-footer">
          {isEditing ? (
            <button onClick={handleSave}>Lagre prosjektinfo</button>
          ) : (
            <button onClick={() => setIsEditing(true)}>
              Rediger prosjektinfo
            </button>
          )}

          <button className="secondary" onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
}
