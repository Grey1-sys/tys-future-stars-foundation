# -*- coding: utf-8 -*-
"""
Render docs/DIRECTOR-GUIDE.md to a PDF a non-technical reader can follow
on a phone or print out.

    pip install reportlab
    python tools/md-to-pdf.py docs/DIRECTOR-GUIDE.md docs/DIRECTOR-GUIDE.pdf

reportlab is a Python package, deliberately NOT a devDependency in
package.json: Netlify must never see it, and it has nothing to do with
the site. Regenerate the PDF whenever the guide changes -- a stale PDF in
someone's inbox is worse than no PDF, because she will trust it.

Purpose-built for the subset of Markdown that file actually uses --
headings, paragraphs, pipe tables, bullet and numbered lists,
blockquotes, rules, and inline bold/italic/code/links. Not a general
Markdown engine, and it should not become one: if the guide grows a
construct this does not handle, that is a prompt to simplify the guide.
"""
import io, re, sys, os

from reportlab.lib.pagesizes import LETTER
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (BaseDocTemplate, PageTemplate, Frame,
                                Paragraph, Spacer, Table, TableStyle,
                                HRFlowable, KeepTogether, ListFlowable,
                                ListItem)

SRC = sys.argv[1]
OUT = sys.argv[2]

# ---- Brand, taken from assets/tokens.css ----
NAVY   = colors.HexColor("#0A1E3F")
INK    = colors.HexColor("#0E1E3A")
SLATE  = colors.HexColor("#5A6B85")
ORANGE = colors.HexColor("#C5470C")   # the AA-safe accent, not #F26522
LINK   = colors.HexColor("#1B4F9C")
RULE   = colors.HexColor("#DFE6EF")
WASH   = colors.HexColor("#F2F5FA")
TINT   = colors.HexColor("#E8F1FB")

PAGE_W, PAGE_H = LETTER
MARGIN = 0.78 * inch
CONTENT_W = PAGE_W - 2 * MARGIN

BODY_SIZE = 11.2
BODY_LEAD = 16.2


def style(name, **kw):
    base = dict(fontName="Helvetica", fontSize=BODY_SIZE, leading=BODY_LEAD,
                textColor=INK, alignment=TA_LEFT, spaceBefore=0, spaceAfter=0)
    base.update(kw)
    return ParagraphStyle(name, **base)


S = {
    "title":  style("title", fontName="Helvetica-Bold", fontSize=25, leading=29,
                    textColor=NAVY, spaceAfter=10),
    "h2":     style("h2", fontName="Helvetica-Bold", fontSize=17, leading=21,
                    textColor=NAVY, spaceBefore=4, spaceAfter=7),
    "h3":     style("h3", fontName="Helvetica-Bold", fontSize=13, leading=17,
                    textColor=ORANGE, spaceBefore=12, spaceAfter=5),
    "h4":     style("h4", fontName="Helvetica-Bold", fontSize=11.6, leading=15,
                    textColor=INK, spaceBefore=10, spaceAfter=4),
    "body":   style("body", spaceAfter=8),
    "quote":  style("quote", fontSize=11.6, leading=17, textColor=NAVY,
                    leftIndent=11, spaceBefore=2, spaceAfter=2),
    "li":     style("li", spaceAfter=4),
    "th":     style("th", fontName="Helvetica-Bold", fontSize=10,
                    leading=13.4, textColor=NAVY),
    "td":     style("td", fontSize=10, leading=13.4),
    "foot":   style("foot", fontSize=8.4, leading=11, textColor=SLATE),
}


# ---- Inline markup -> reportlab's mini-HTML ----
def inline(t):
    t = t.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Code first: its contents must not be re-parsed for emphasis.
    holds = []

    def hold(m):
        holds.append(m.group(1))
        return "\x00%d\x00" % (len(holds) - 1)
    t = re.sub(r"`([^`]+)`", hold, t)

    # Links. Internal anchors (#...) are table-of-contents jumps in a
    # flowing document, so they render as plain text.
    t = re.sub(r"\[([^\]]+)\]\((#[^)]*)\)", r"\1", t)
    t = re.sub(r"\[([^\]]+)\]\(([^)]+)\)",
               r'<link href="\2" color="#1B4F9C"><u>\1</u></link>', t)

    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<![*\w])\*([^*\n]+)\*(?!\w)", r"<i>\1</i>", t)

    def unhold(m):
        code = holds[int(m.group(1))]
        return ('<font face="Courier" size="%.1f" backColor="#F2F5FA">%s</font>'
                % (BODY_SIZE - 0.8, code))
    return re.sub(r"\x00(\d+)\x00", unhold, t)


def P(text, st="body"):
    return Paragraph(inline(text), S[st])


# ---- Block parsing ----
lines = io.open(SRC, encoding="utf-8").read().replace("\r\n", "\n").split("\n")
flow = []
i = 0
n = len(lines)


def table_widths(rows):
    """Proportional to the longest cell, clamped so no column collapses."""
    cols = max(len(r) for r in rows)
    longest = [1] * cols
    for r in rows:
        for c in range(len(r)):
            longest[c] = max(longest[c], len(re.sub(r"[*`\[\]]", "", r[c])))
    total = float(sum(longest))
    w = [max(0.9 * inch, CONTENT_W * (L / total)) for L in longest]
    scale = CONTENT_W / sum(w)
    return [x * scale for x in w]


while i < n:
    raw = lines[i]
    s = raw.strip()

    if not s:
        i += 1
        continue

    # Horizontal rule
    if re.match(r"^(-{3,}|\*{3,}|_{3,})$", s):
        flow.append(Spacer(1, 7))
        flow.append(HRFlowable(width="100%", thickness=0.7, color=RULE,
                               spaceBefore=0, spaceAfter=11))
        i += 1
        continue

    # Headings
    m = re.match(r"^(#{1,4})\s+(.*)$", s)
    if m:
        level = len(m.group(1))
        text = m.group(2).strip()
        st = {1: "title", 2: "h2", 3: "h3", 4: "h4"}[level]
        if level == 2:
            flow.append(Spacer(1, 6))
            flow.append(KeepTogether([
                P(text, st),
                HRFlowable(width="100%", thickness=2, color=ORANGE,
                           spaceBefore=0, spaceAfter=9),
            ]))
        else:
            flow.append(P(text, st))
        i += 1
        continue

    # Pipe table
    if s.startswith("|") and i + 1 < n and re.match(
            r"^\s*\|[\s:\-|]+\|\s*$", lines[i + 1]):
        def cells(row):
            return [c.strip() for c in row.strip().strip("|").split("|")]
        head = cells(s)
        i += 2
        body = []
        while i < n and lines[i].strip().startswith("|"):
            body.append(cells(lines[i]))
            i += 1
        allrows = [head] + body
        cols = max(len(r) for r in allrows)
        allrows = [r + [""] * (cols - len(r)) for r in allrows]

        data = [[Paragraph(inline(c), S["th"]) for c in allrows[0]]]
        for r in allrows[1:]:
            data.append([Paragraph(inline(c), S["td"]) for c in r])

        t = Table(data, colWidths=table_widths(allrows), repeatRows=1,
                  hAlign="LEFT")
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), TINT),
            ("LINEBELOW", (0, 0), (-1, 0), 0.9, NAVY),
            ("GRID", (0, 0), (-1, -1), 0.4, RULE),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 7),
            ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ("TOPPADDING", (0, 0), (-1, -1), 5.5),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#FAFBFD")]),
        ]))
        flow.append(Spacer(1, 3))
        flow.append(t)
        flow.append(Spacer(1, 11))
        continue

    # Blockquote: the guide uses these for the rules that matter most,
    # so give them a visible left bar rather than just an indent.
    if s.startswith(">"):
        buf = []
        while i < n and lines[i].strip().startswith(">"):
            buf.append(re.sub(r"^\s*>\s?", "", lines[i]).rstrip())
            i += 1
        text = " ".join(x.strip() for x in buf if x.strip())
        inner = Table([[Paragraph(inline(text), S["quote"])]],
                      colWidths=[CONTENT_W - 6], hAlign="LEFT")
        inner.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), WASH),
            ("LINEBEFORE", (0, 0), (0, -1), 3, ORANGE),
            ("LEFTPADDING", (0, 0), (-1, -1), 11),
            ("RIGHTPADDING", (0, 0), (-1, -1), 11),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ]))
        flow.append(Spacer(1, 3))
        flow.append(inner)
        flow.append(Spacer(1, 11))
        continue

    # Lists. Nested content (an indented table or sub-bullets) is flattened
    # to one level: three levels of indent on a phone is unreadable, and the
    # guide never relies on depth to carry meaning.
    m = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", raw)
    if m:
        ordered = bool(re.match(r"^\d", m.group(2)))
        items = []
        start = 1
        if ordered:
            start = int(re.match(r"^(\d+)", m.group(2)).group(1))
        while i < n:
            mm = re.match(r"^(\s*)([-*+]|\d+[.)])\s+(.*)$", lines[i])
            if not mm:
                # A continuation line belongs to the current item.
                if (lines[i].strip() and lines[i].startswith((" ", "\t"))
                        and items and not lines[i].strip().startswith("|")):
                    items[-1] += " " + lines[i].strip()
                    i += 1
                    continue
                break
            is_ord = bool(re.match(r"^\d", mm.group(2)))
            if is_ord != ordered:
                break
            items.append(mm.group(3).strip())
            i += 1
            # Blank line inside a list is fine; stop only at a real break.
            while i < n and not lines[i].strip():
                nxt = i + 1
                if (nxt < n and re.match(r"^(\s*)([-*+]|\d+[.)])\s+", lines[nxt])
                        or (nxt < n and lines[nxt].startswith((" ", "\t"))
                            and lines[nxt].strip())):
                    i += 1
                else:
                    break
        flow.append(ListFlowable(
            [ListItem(P(x, "li"), leftIndent=20, value=(start + k) if ordered else None)
             for k, x in enumerate(items)],
            bulletType="1" if ordered else "bullet",
            start=start if ordered else None,
            bulletFontName="Helvetica", bulletFontSize=BODY_SIZE,
            bulletColor=ORANGE if not ordered else NAVY,
            leftIndent=20, spaceAfter=9,
        ))
        continue

    # Paragraph
    buf = [s]
    i += 1
    while i < n:
        t = lines[i].strip()
        if (not t or t.startswith(("#", ">", "|", "---"))
                or re.match(r"^(\s*)([-*+]|\d+[.)])\s+", lines[i])):
            break
        buf.append(t)
        i += 1
    flow.append(P(" ".join(buf), "body"))


# ---- Page furniture ----
TITLE = "Editing the Ty's Future Stars Foundation website"


def furniture(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8.4)
    canvas.setFillColor(SLATE)
    if doc.page > 1:
        canvas.drawString(MARGIN, PAGE_H - MARGIN + 20,
                          "Ty's Future Stars Foundation - website editing guide")
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.5)
    canvas.line(MARGIN, MARGIN - 16, PAGE_W - MARGIN, MARGIN - 16)
    canvas.drawString(MARGIN, MARGIN - 29, "tysfuturestars.org/admin")
    canvas.drawRightString(PAGE_W - MARGIN, MARGIN - 29, "Page %d" % doc.page)
    canvas.restoreState()


doc = BaseDocTemplate(
    OUT, pagesize=LETTER,
    leftMargin=MARGIN, rightMargin=MARGIN,
    topMargin=MARGIN, bottomMargin=MARGIN,
    title=TITLE, author="Ty's Future Stars Foundation",
    subject="How to edit the website at tysfuturestars.org/admin",
)
doc.addPageTemplates([PageTemplate(
    id="main",
    frames=[Frame(MARGIN, MARGIN, CONTENT_W, PAGE_H - 2 * MARGIN, id="f")],
    onPage=furniture,
)])
doc.build(flow)

print("wrote %s  (%.0f KB)" % (OUT, os.path.getsize(OUT) / 1024.0))
