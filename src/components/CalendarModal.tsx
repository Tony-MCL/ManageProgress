// src/components/CalendarModal.tsx
import React, { useState } from "react";
import "../styles/panel.css";

export type HolidayPeriod = {
  id: string;
  name: string;
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
};

type CalendarModalProps = {
  open: boolean;
  holidays: HolidayPeriod[];
  useHolidays: boolean;
  onChangeHolidays: (items: HolidayPeriod[]) => void;
  onChangeUseHolidays: (use: boolean) => void;
  onClose: () => void;
};

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Beregner 1. påskedag (vestlig)
function computeEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=mar, 4=apr
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

function generateNorwegianHolidays(year: number): HolidayPeriod[] {
  const easter = computeEasterSunday(year);
  const result: HolidayPeriod[] = [];

  const pushDay = (name: string, d: Date) => {
    result.push({
      id: `${name}-${toDateString(d)}`,
      name,
      start: toDateString(d),
      end: toDateString(d),
    });
  };

  // Faste datoer
  pushDay("Nyttårsdag", new Date(year, 0, 1));
  pushDay("Arbeidernes dag", new Date(year, 4, 1));
  pushDay("Grunnlovsdagen", new Date(year, 4, 17));
  pushDay("1. juledag", new Date(year, 11, 25));
  pushDay("2. juledag", new Date(year, 11, 26));

  // Bevegelige helligdager
  pushDay("Skjærtorsdag", addDays(easter, -3));
  pushDay("Langfredag", addDays(easter, -2));
  pushDay("1. påskedag", easter);
  pushDay("2. påskedag", addDays(easter, 1));
  pushDay("Kristi himmelfartsdag", addDays(easter, 39));
  pushDay("1. pinsedag", addDays(easter, 49));
  pushDay("2. pinsedag", addDays(easter, 50));

  return result;
}

/* ==== [BLOCK: CalendarModal – fridager/ferier] BEGIN ==== */

const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  holidays,
  useHolidays,
  onChangeHolidays,
  onChangeUseHolidays,
  onClose,
}) => {
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  if (!open) return null;

  // SORTERING: vis alltid lista kronologisk
  const sortedHolidays: HolidayPeriod[] = [...holidays].sort((a, b) => {
    if (a.start < b.start) return -1;
    if (a.start > b.start) return 1;
    if (a.end < b.end) return -1;
    if (a.end > b.end) return 1;
    return a.name.localeCompare(b.name, "nb");
  });

  const resetForm = () => {
    setEditId(null);
    setName("");
    setStart("");
    setEnd("");
  };

  const handleSubmit = () => {
    if (!start && !end) return;

    let s = start || end;
    let e = end || start;
    if (!s || !e) return;

    const sd = new Date(s + "T00:00:00");
    const ed = new Date(e + "T00:00:00");
    if (ed < sd) {
      const tmp = s;
      s = e;
      e = tmp;
    }

    const label =
      name.trim() ||
      (s === e ? "Fridag" : "Ferie / friperiode");

    if (editId) {
      onChangeHolidays(
        holidays.map((h) =>
          h.id === editId ? { ...h, name: label, start: s, end: e } : h
        )
      );
    } else {
      const id = `hp-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
      const newItem: HolidayPeriod = {
        id,
        name: label,
        start: s,
        end: e,
      };
      onChangeHolidays([...holidays, newItem]);
    }

    resetForm();
  };

  const handleEdit = (id: string) => {
    const target = holidays.find((h) => h.id === id);
    if (!target) return;
    setEditId(id);
    setName(target.name);
    setStart(target.start);
    setEnd(target.end);
  };

  const handleDelete = (id: string) => {
    onChangeHolidays(holidays.filter((h) => h.id !== id));
    if (editId === id) {
      resetForm();
    }
  };

  const handleGenerateNorwegian = () => {
    const generated = generateNorwegianHolidays(year);
    const existingKeys = new Set(
      holidays.map((h) => `${h.name}|${h.start}|${h.end}`)
    );
    const merged: HolidayPeriod[] = [
      ...holidays,
      ...generated.filter(
        (g) => !existingKeys.has(`${g.name}|${g.start}|${g.end}`)
      ),
    ];
    onChangeHolidays(merged);
  };

  return (
    <div className="mcl-modal-backdrop" onClick={onClose}>
      <div
        className="mcl-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Kalender – fridager og ferier"
      >
        <div className="mcl-modal-header">
          <h2>Kalender – fridager og ferier</h2>
          <button
            type="button"
            className="mcl-modal-close"
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div className="mcl-modal-body">
          {/* Topp: innstilling for om kalender påvirker planen */}
          <div className="calendar-section">
            <label className="calendar-checkbox-row">
              <input
                type="checkbox"
                checked={useHolidays}
                onChange={(e) => onChangeUseHolidays(e.target.checked)}
              />
              <span>
                Bruk innlagte fridager og ferier i fremdriftsplanen
              </span>
            </label>
          </div>

          {/* Hoved-grid: venstre (skjema) / høyre (liste) */}
          <div className="calendar-main-grid">
            {/* VENSTRE SIDE – legg til / rediger + norske fridager */}
            <div className="calendar-left">
              <div className="calendar-section">
                <h3>{editId ? "Rediger periode" : "Legg til fridag / ferie"}</h3>
                <div className="calendar-form-grid">
                  <label>
                    Navn (valgfritt)
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={
                        start && end && start === end
                          ? "Fridag"
                          : "Ferie / friperiode"
                      }
                    />
                  </label>
                  <label>
                    Fra-dato
                    <input
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                    />
                  </label>
                  <label>
                    Til-dato
                    <input
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                    />
                  </label>
                </div>
                <div className="calendar-form-actions">
                  <button type="button" onClick={handleSubmit}>
                    {editId ? "Oppdater periode" : "Legg til periode"}
                  </button>
                  {editId && (
                    <button
                      type="button"
                      className="secondary"
                      onClick={resetForm}
                    >
                      Avbryt redigering
                    </button>
                  )}
                </div>
              </div>

              <div className="calendar-section">
                <h3>Norske offentlige fridager</h3>
                <div className="calendar-year-row">
                  <label>
                    År
                    <input
                      type="number"
                      value={year}
                      onChange={(e) =>
                        setYear(
                          Number.isNaN(Number(e.target.value))
                            ? new Date().getFullYear()
                            : Number(e.target.value)
                        )
                      }
                      min={1900}
                      max={2100}
                    />
                  </label>
                  <button type="button" onClick={handleGenerateNorwegian}>
                    Legg til norske fridager for valgt år
                  </button>
                </div>
              </div>
            </div>

            {/* HØYRE SIDE – liste i egen scroll-ramme */}
            <div className="calendar-right">
              <h3>Registrerte fridager og ferier</h3>
              <div className="calendar-list-container">
                {sortedHolidays.length === 0 ? (
                  <p className="calendar-empty">
                    Ingen fridager eller ferier er registrert ennå.
                  </p>
                ) : (
                  <ul className="calendar-list">
                    {sortedHolidays.map((h) => (
                      <li key={h.id} className="calendar-list-item">
                        <div className="calendar-list-main">
                          <div className="calendar-list-name">{h.name}</div>
                          <div className="calendar-list-dates">
                            {h.start === h.end
                              ? h.start
                              : `${h.start} → ${h.end}`}
                          </div>
                        </div>
                        <div className="calendar-list-actions">
                          <button
                            type="button"
                            onClick={() => handleEdit(h.id)}
                          >
                            Rediger
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDelete(h.id)}
                          >
                            Slett
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mcl-modal-footer">
          <button type="button" onClick={onClose}>
            Lukk
          </button>
        </div>
      </div>
    </div>
  );
};

/* ==== [BLOCK: CalendarModal – fridager/ferier] END ==== */

export default CalendarModal;
