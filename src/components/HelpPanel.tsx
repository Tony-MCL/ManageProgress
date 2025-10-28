import React, { useEffect, useState } from "react"

type HelpPanelProps = {
  open: boolean
  onClose: () => void
}

// Enkel, intern markdown-til-HTML parser (for våre README-filer)
function renderMarkdown(md: string): string {
  // escape potensielle tags
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")

  // overskrifter (###, ##, #)
  html = html.replace(/^### (.*)$/gm, "<h3>$1</h3>")
  html = html.replace(/^## (.*)$/gm, "<h2>$1</h2>")
  html = html.replace(/^# (.*)$/gm, "<h1>$1</h1>")

  // punkter
  html = html.replace(/^- (.*)$/gm, "<li>$1</li>")
  html = html.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")

  // tabeller (veldig enkel)
  html = html.replace(/^\|(.+)\|\n\|([-| ]+)\|\n([\s\S]*?)\n\n/gm, (_m, header, _sep, rows) => {
    const headers = header.split("|").map((h: string) => h.trim())
    const trs = rows
      .trim()
      .split("\n")
      .map((r: string) => {
        const cells = r.split("|").map((c: string) => c.trim())
        return "<tr>" + cells.map((c) => `<td>${c}</td>`).join("") + "</tr>"
      })
      .join("")
    return (
      "<table><thead><tr>" +
      headers.map((h) => `<th>${h}</th>`).join("") +
      "</tr></thead><tbody>" +
      trs +
      "</tbody></table>"
    )
  })

  // linjeskift til <br> (for enkeltekst)
  html = html.replace(/\n{2,}/g, "</p><p>")
  html = "<p>" + html + "</p>"
  return html
}

const HelpPanel: React.FC<HelpPanelProps> = ({ open, onClose }) => {
  const [content, setContent] = useState<string>("")

  useEffect(() => {
    if (open) {
      fetch("/README_USER.md")
        .then((res) => res.text())
        .then((text) => setContent(renderMarkdown(text)))
        .catch(() =>
          setContent("<p>Kunne ikke laste hjelpetekst. Prøv igjen senere.</p>")
        )
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
