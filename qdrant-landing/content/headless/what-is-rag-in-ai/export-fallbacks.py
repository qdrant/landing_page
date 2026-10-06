#!/usr/bin/env python3
"""Export the live diagrams' desktop states as self-contained image fallbacks.

Run from any directory. Uses the checked-in Geist Mono font and resolved light
palette on an opaque surface so exports remain readable on either host theme.
The island module remains the source of labels, geometry, and connections.
"""

import base64
import html
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[3]
MODULES = Path(__file__).resolve().parent
ASSETS = ROOT / "static/articles_data/what-is-rag-in-ai"
FONT = ROOT / "themes/qdrant-2024/static/fonts/Geist_Mono/static/GeistMono-Regular.ttf"
COLORS = {"query": "#00838f", "data": "#9c27b0", "model": "#6047ff", "database": "#dc244c"}


def export(module):
    source = (module / "index.js").read_text()
    diagram = json.loads(re.search(r"^const DIAGRAM = (.*);$", source, re.M).group(1))
    license_text = html.escape("\n".join(line.rstrip() for line in (FONT.parents[1] / "OFL.txt").read_text().splitlines()))
    name = diagram["name"]
    height = diagram["height"]
    font = base64.b64encode(FONT.read_bytes()).decode()
    parts = [f'''<svg xmlns="http://www.w3.org/2000/svg" width="800" height="{height}" viewBox="0 0 800 {height}" role="img" aria-labelledby="title desc">
  <title id="title">RAG {name} diagram</title>
  <desc id="desc">{html.escape(diagram["caption"])}</desc>
  <metadata>{license_text}</metadata>
  <style>
    @font-face {{ font-family: 'RAG Geist Mono'; src: url(data:font/ttf;base64,{font}) format('truetype'); }}
    text {{ font-family: 'RAG Geist Mono', monospace; font-size: 18px; fill: #303547; }}
  </style>
  <rect width="800" height="{height}" fill="#f0f3fa"/>
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10Z" fill="#656b7f"/></marker></defs>''']
    for edge in diagram["edges"]:
        parts.append(f'  <path d="{edge}" fill="none" stroke="#656b7f" stroke-width="2" marker-end="url(#arrow)"/>')
    for lines, role, position in zip(diagram["labels"], diagram["roles"], diagram["positions"]):
        x, y, width, box_height = position
        offsets = [8, 4, 0] if role == "data" else [0]
        for offset in offsets:
            parts.append(f'  <rect x="{x + offset}" y="{y - offset}" width="{width}" height="{box_height}" rx="6" fill="#f0f3fa" stroke="{COLORS[role]}" stroke-width="2"/>')
        center_y = y + box_height / 2 - (len(lines) - 1) * 11
        for index, label in enumerate(lines):
            parts.append(f'  <text x="{x + width / 2:g}" y="{center_y + index * 22:g}" text-anchor="middle" dominant-baseline="central">{html.escape(label)}</text>')
    parts.append('</svg>\n')
    (ASSETS / diagram["image"]).with_suffix('.svg').write_text('\n'.join(parts))


for module in sorted(MODULES.iterdir()):
    if module.is_dir() and (module / 'index.js').exists():
        export(module)
