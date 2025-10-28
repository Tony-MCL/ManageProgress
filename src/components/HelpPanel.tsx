import React, { useEffect, useState } from "react"

type HelpPanelProps = {
  open: boolean
  onClose: () => void
}

// Enkel, intern markdown→HTML-parser med TS-typer
function renderMarkdown(md: string): string {
  // 1) Escape
  let html: string = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // 2) Headings
  html = html.replace(/^### (.*)$/gm, (_m: string, h3: string) => `<h3>${h3}</h3>`)
  html = html.replace(/^## (.*)$/gm, (_m: string, h2: string) => `<h2>${h2}</h2>`)
  html = html.replace(/^# (.*)$/gm, (_m: string, h1: string) => `<h1>${h1}</h1>`)

  // 3) List items
  html = html.replace(/^- +(.+)$/gm, (_m: string, item: string) => `<li>${item}</li>`)

  // 4) Group consecutive <li>...</li> into a single <ul>…</ul>
  html = html.replace(
    /(?:<li>[\s\S]*?<\/li>\s*)+/g,
    (m: string) => `<ul>${m.replace(/\s+$/g, "")}</ul>`
  )

  // 5) Very simple GitHub-style tables:
  // | H1 | H2 |
  // |----|----|
  // | c1 | c2 |
  html = html.replace(
    /^\|(.+)\|\n\|([-| :]+)\|\n([\s\S]*?)(?:\n{2,}|\n?$)/gm,
    (_m: string, header: string, _sep: string, body: string) => {
      const headers: string[] = header.split("|").map((h: string) => h.trim())
      const rows: string[] = body
        .trim()
        .split("\n")
        .filter((r: string) => r.trim().length > 0)

      const thead = `<thead><tr>${headers.map((h: string) => `<th>${h}</th>`).join("")}</tr></thead>`
      const tbody = `<tbody>${rows
        .map((r: string) => {
          const cells: string[] = r.split("|").map((c: string) => c.trim())
          return `<tr>${cells.map((c: string) => `<td>${c}</td>`).join("")}</tr>`
        })
        .join("")}</tbody>`

      return `<table>${thead}${tbody}</table>`
    }
  )

  // 6) Paragraphs (enkelt): del på blanklinjer
  const parts: string[] = html.split(/\n{2,}/).map((p: string) => p.trim()).filter(Boolean)
  html = parts.map((p: string) => {
    // ikke pakk tabeller/ul/headers i <p>
    if (/^(<h\d|<ul>|<table>)/.test(p)) return p
    return `<p>${p.replace(/\n/g, "<br>")}</p>`
  }).join("\n")

  return html
}

const HelpPanel: React.FC<HelpPanelProps> = ({ open, onClose }) => {
  const [content, setContent] = useState<string>("")

  useEffect(() => {
    if (open) {
      fetch("/README_USER.md")
        .then((res) => res.text())
        .then((text: string) => setContent(renderMarkdown(text)))
        .catch(() => setContent("<p>Kunne ikke laste hjelpetekst. Prøv igjen senere.</p>"))
    }
  }, [open])

  return (
    <div className={`help-panel ${open ? "open" : ""}`}>
      <div className="help-header">
        <h2>Hjelp</h2>
        <button className="close-btn" onClick={onClose}>×</button>
      </div>
      <div
        className="help-body"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    </div>
  )
}

export default HelpPanel
