import React, { useEffect, useState } from "react"

// Hvis ts ikke kjenner vite-typene kan du alternativt bruke (import.meta as any).env.BASE_URL
// og la denne importen være som den er.
type HelpPanelProps = {
  open: boolean
  onClose: () => void
}

/** Enkel markdown→HTML for vårt behov (overskrifter, lister, tabeller, avsnitt) */
function renderMarkdown(md: string): string {
  let html: string = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  // Headings
  html = html.replace(/^### (.*)$/gm, (_m: string, h3: string) => `<h3>${h3}</h3>`)
  html = html.replace(/^## (.*)$/gm, (_m: string, h2: string) => `<h2>${h2}</h2>`)
  html = html.replace(/^# (.*)$/gm, (_m: string, h1: string) => `<h1>${h1}</h1>`)

  // List items → ul
  html = html.replace(/^- +(.+)$/gm, (_m: string, item: string) => `<li>${item}</li>`)
  html = html.replace(/(?:<li>[\s\S]*?<\/li>\s*)+/g, (m: string) => `<ul>${m.replace(/\s+$/g, "")}</ul>`)

  // Enkle tabeller
  html = html.replace(
    /^\|(.+)\|\n\|([-| :]+)\|\n([\s\S]*?)(?:\n{2,}|\n?$)/gm,
    (_m: string, header: string, _sep: string, body: string) => {
      const headers: string[] = header.split("|").map((h: string) => h.trim())
      const rows: string[] = body
        .trim()
        .split("\n")
        .filter((r: string) => r.trim().length > 0)

      const thead = `<thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>`
      const tbody = `<tbody>${rows
        .map((r) => {
          const cells = r.split("|").map((c) => c.trim())
          return `<tr>${cells.map((c) => `<td>${c}</td>`).join("")}</tr>`
        })
        .join("")}</tbody>`
      return `<table>${thead}${tbody}</table>`
    }
  )

  // Enkle avsnitt: del på blanklinjer; ikke pakk blokk-elementer
  const parts = html.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean)
  html = parts
    .map((p) => (/^(<h\d|<ul>|<table>)/.test(p) ? p : `<p>${p.replace(/\n/g, "<br>")}</p>`))
    .join("\n")

  return html
}

const HelpPanel: React.FC<HelpPanelProps> = ({ open, onClose }) => {
  const [content, setContent] = useState<string>("")

  useEffect(() => {
  if (!open) return;
  try {
    const url = new URL("help.md", document.baseURI).toString();
    fetch(url)
      .then((res) => res.text())
      .then((text: string) => setContent(renderMarkdown(text)))
      .catch(() =>
        setContent("<p>Kunne ikke laste hjelpetekst. Prøv igjen senere.</p>")
      );
  } catch (e) {
    setContent("<p>Kunne ikke bestemme base-URL for hjelpetekst.</p>");
  }
}, [open]);

  return (
    <div className={`help-panel ${open ? "open" : ""}`}>
      <div className="help-header">
        <h2>Hjelp</h2>
        <button className="close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="help-body" dangerouslySetInnerHTML={{ __html: content }} />
    </div>
  )
}

export default HelpPanel
