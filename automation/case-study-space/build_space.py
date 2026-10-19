#!/usr/bin/env python3
"""Embed every published case study and project the embeddings to 2D.

Writes qdrant-landing/data/case_study_space.json, which the "nearest
neighbors" explorer at the top of /customers/ renders. See README.md.
"""

import json
import re
import struct
import sys
from pathlib import Path

import numpy as np
import umap
import yaml
from fastembed import TextEmbedding
from svgelements import SVG

ROOT = Path(__file__).resolve().parents[2]
SITE = ROOT / "qdrant-landing"
BLOG = SITE / "content" / "blog"
CLIENTS = SITE / "content" / "customers" / "clients" / "_index.md"
OUT = SITE / "data" / "case_study_space.json"

MODEL = "BAAI/bge-small-en-v1.5"
SEED = 42
TOP_K = 4

# Panel units used by the page. Distances and scores are computed in these.
W, H = 1000, 760
# Logos get equal area rather than equal height, so a wide wordmark does
# not outweigh a compact mark: height = sqrt(AREA / aspect), clamped.
LOGO_AREA, LOGO_H_MIN, LOGO_H_MAX, LOGO_W_MAX, PAD = 30 * 105, 20, 40, 150, 7
WORDMARK_ASPECT = 3.4
PORTRAIT_SCALE = 0.9  # logos are drawn this much smaller on phones, to fit
BOTTOM = 60  # strip kept clear for the hint line inside the panel

# Logo files that read better on the map than the /customers grid ones.
LOGO_OVERRIDES = {
    "bazaarvoice": "/img/customers-case-studies-logo/bazaarvoice-horizontal.svg",
    "bloop": "/case-studies/bloop/bloop-logo.png",  # bloop.svg is empty
}

# Published case studies that are not in the /customers grid data yet.
# Everything else comes from content/customers/clients/_index.md. These
# values mirror the grid entries added on branch
# customers-grid-missing-case-studies, so the output does not change when
# that branch merges. Once it has, delete these entries: the grid wins for
# any slug it already has.
EXTRAS = {
    "case-study-bayer": dict(
        id="bayer", name="Bayer", industry="Life sciences", product="Hybrid",
        use_cases=["Hybrid search", "RAG", "Multimodal search"],
        logo="/img/healthcare/logo-bayer.svg"),
    "case-study-go-perfect": dict(
        id="go-perfect", name="GoPerfect", industry="Recruiting",
        product="Qdrant Cloud",
        use_cases=["Hybrid search", "Semantic search", "Generative AI"]),
    "case-study-lucy": dict(
        id="lucy", name="Lucy", industry="Financial services",
        product="Self-managed",
        use_cases=["RAG", "Hybrid search", "Semantic search"]),
    "case-study-minima": dict(
        id="minima", name="Minima", industry="Technology",
        use_cases=["RAG", "Hybrid search", "Generative AI"]),
    "case-study-sapu": dict(
        id="sapu", name="Sapu", industry="Life sciences", product="Qdrant Cloud",
        use_cases=["RAG", "Semantic search", "Hybrid search"],
        logo="/img/resilience/sapu-logo.svg"),
    "case-study-sunny-health-ai": dict(
        id="sunny-health-ai", name="Sunny Health", industry="Healthcare",
        use_cases=["Hybrid search", "Semantic search", "Generative AI"]),
}

# Case studies superseded by a newer version of the same story.
SKIP = {"case-study-dust"}

# Query chips. Each is embedded like a document and projected into the
# same 2D space, so a chip lands where its text would.
QUERIES = [
    ("commerce", "E-commerce search",
     "E-commerce product search and discovery for online shoppers"),
    ("support", "RAG for support",
     "Retrieval-augmented generation for customer support assistants and help desks"),
    ("recs", "Recommendations",
     "Personalized recommendations for users based on behavior and content"),
    ("media", "Media & entertainment",
     "Search and recommendations for video, news, and media content"),
    ("research", "Pharma & research",
     "Search over scientific literature and research documents for pharma, biotech, and healthcare"),
    ("agents", "AI agents",
     "Retrieval for autonomous AI agents and agentic workflows"),
    ("legal", "Legal & finance",
     "Search over legal documents, patents, and financial filings"),
]


def front_matter(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---\s*\n(.*)$", text, re.S)
    if not m:
        return {}, text
    return yaml.safe_load(m.group(1)) or {}, m.group(2)


def clean(body):
    body = re.sub(r"\{\{[<%].*?[%>]\}\}", " ", body, flags=re.S)  # shortcodes
    body = re.sub(r"!\[[^\]]*\]\([^)]*\)", " ", body)               # images
    body = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", body)            # links
    body = re.sub(r"<[^>]+>", " ", body)                            # html
    body = re.sub(r"```.*?```", " ", body, flags=re.S)              # code
    body = re.sub(r"[#*_>|`]", " ", body)
    return re.sub(r"\s+", " ", body).strip()


def passages(text, words=180):
    w = text.split()
    return [" ".join(w[i:i + words]) for i in range(0, len(w), words)] or [text]


def load_case_studies():
    clients, _ = front_matter(CLIENTS)
    by_slug = {}
    for c in clients["clients"]:
        slug = c["blog_path"].strip("/").split("/")[-1]
        by_slug[slug] = c

    items = []
    files = sorted(BLOG.glob("case-study-*.md")) + [BLOG / "iris-agent-qdrant.md"]
    for path in files:
        slug = path.stem
        fm, body = front_matter(path)
        if fm.get("draft") or slug in SKIP:
            continue
        if slug in by_slug:
            c = by_slug[slug]
            meta = dict(id=c["id"], name=c["name"], industry=c.get("industry"),
                        product=c.get("product"), use_cases=c.get("use_cases", []),
                        logo=c.get("logo", {}).get("src"))
        elif slug in EXTRAS:
            meta = dict(EXTRAS[slug])
        else:
            sys.exit(f"{slug} is published but has no metadata: add it to EXTRAS")
        meta["url"] = f"/blog/{slug}/"
        title = fm.get("title", "")
        desc = fm.get("description", "") or fm.get("short_description", "")
        meta["summary"] = f"{title}. {desc}"
        meta["text"] = clean(body)
        items.append(meta)

    missing = set(by_slug) - {i["url"].strip("/").split("/")[-1] for i in items}
    if missing:
        sys.exit(f"In the /customers grid but not a published case study: {missing}")
    return items


def unit(v):
    return v / np.linalg.norm(v, axis=-1, keepdims=True)


def embed_docs(model, items):
    """One vector per case study: the mean of its body passages, plus its
    title and description weighted as much as the whole body."""
    vecs = []
    for it in items:
        body = unit(np.mean(list(model.passage_embed(passages(it["text"]))), axis=0))
        head = next(iter(model.passage_embed([it["summary"]])))
        vecs.append(unit(body + unit(head)))
    return np.array(vecs)


def logo_box(src):
    """Crop a logo to what it draws. Returns the drawn width / height and the
    CSS mask size and position that show only that part of the file, or
    None for a wordmark. Logo files carry padding, often half their height."""
    if not src:
        return None
    for base in (SITE / "static", SITE / "themes" / "qdrant-2024" / "static"):
        f = base / src.lstrip("/")
        if f.exists():
            break
    else:
        sys.exit(f"Logo not found: {src}")
    if f.suffix == ".png":
        w, h = struct.unpack(">II", f.read_bytes()[16:24])
        return {"aspect": round(w / h, 3)}
    svg = SVG.parse(str(f))
    vx, vy, vw, vh = svg.viewbox.x, svg.viewbox.y, svg.viewbox.width, svg.viewbox.height
    box = svg.bbox()
    if not box or "clip-path" in f.read_text(encoding="utf-8"):
        return {"aspect": round(vw / vh, 3)}  # bbox ignores clipping; trust the viewBox
    x0, y0 = max(box[0], vx), max(box[1], vy)
    x1, y1 = min(box[2], vx + vw), min(box[3], vy + vh)
    bw, bh = x1 - x0, y1 - y0
    pos = lambda off, full, part: 0 if full == part else 100 * off / (full - part)
    return {
        "aspect": round(bw / bh, 3),
        "mask_size": "{:.1f}% {:.1f}%".format(100 * vw / bw, 100 * vh / bh),
        "mask_pos": "{:.1f}% {:.1f}%".format(pos(x0 - vx, vw, bw), pos(y0 - vy, vh, bh)),
    }


def logo_size(aspect):
    """Drawn width and height of a logo in panel units."""
    a = aspect or WORDMARK_ASPECT
    h = min(max((LOGO_AREA / a) ** 0.5, LOGO_H_MIN), LOGO_H_MAX)
    w = min(h * a, LOGO_W_MAX)
    return w, w / a


def spread(xy, aspects, size, scale=1.0, iters=800):
    """Nudge points apart so logo boxes do not overlap, staying close to
    their projected position. xy are fractions of size, in panel units."""
    size = np.array(size)
    p = xy * size
    home = p.copy()
    half = np.array([[scale * logo_size(a)[0] / 2 + PAD, scale * logo_size(a)[1] / 2 + PAD]
                     for a in aspects])
    for step in range(iters):
        moved = False
        for i in range(len(p)):
            for j in range(i + 1, len(p)):
                d = p[j] - p[i]
                over = half[i] + half[j] - np.abs(d)
                if over[0] > 0.5 and over[1] > 0.5:
                    axis = 0 if over[0] / half[i][0] < over[1] / half[i][1] else 1
                    push = (over[axis] / 2 + 1) * (1 if d[axis] >= 0 else -1)
                    p[i][axis] -= push
                    p[j][axis] += push
                    moved = True
        p = np.clip(p, half, size - half - [0, BOTTOM])
        if not moved:
            break
        # Pull back toward the projection early on, then let the boxes settle.
        if step < iters // 4:
            p += 0.02 * (home - p)
    if moved:
        sys.exit(f"Logos still overlap after spreading in {tuple(size)}: lower LOGO_AREA")
    return p / size


def main():
    items = load_case_studies()
    model = TextEmbedding(MODEL)
    docs = embed_docs(model, items)
    queries = unit(np.array(list(model.query_embed([q[2] for q in QUERIES]))))

    # Every case study talks about Qdrant and vector search, so that shared
    # direction dominates raw similarity. Remove it before projecting.
    centered = unit(docs - docs.mean(axis=0))
    reducer = umap.UMAP(n_components=2, n_neighbors=6, min_dist=0.35,
                        metric="cosine", random_state=SEED)
    xy = reducer.fit_transform(centered)
    lo, hi = xy.min(axis=0), xy.max(axis=0)
    xy = (xy - lo) / (hi - lo)

    for it in items:
        it["logo"] = LOGO_OVERRIDES.get(it["id"], it.get("logo"))
        it["box"] = logo_box(it["logo"])
    aspects = [(it["box"] or {}).get("aspect") for it in items]
    # Phones draw the map transposed (portrait, 760 x 1000), but logos stay
    # horizontal, so the boxes are spread again in that orientation.
    portrait = spread(xy[:, ::-1], aspects, (H, W), scale=PORTRAIT_SCALE)
    xy = spread(xy, aspects, (W, H))

    # A chip ranks case studies by cosine similarity in the full embedding
    # space, and sits at the similarity-weighted centroid of its top k on
    # the map. Short queries do not project well with UMAP.transform.
    sims = queries @ docs.T
    chips = []
    for (qid, label, text), s in zip(QUERIES, sims):
        top = np.argsort(-s)[:TOP_K]
        w = np.exp((s[top] - s[top].max()) / 0.02)
        q = (xy[top] * w[:, None]).sum(axis=0) / w.sum()
        chips.append({
            "id": qid, "label": label, "text": text,
            "x": round(float(q[0]), 4), "y": round(float(q[1]), 4),
            "hits": [{"id": items[i]["id"], "cosine": round(float(s[i]), 3)} for i in top],
        })

    # A logo works as a query too: its nearest other case studies, by cosine
    # similarity of the mean-centered full embeddings, as used for the map.
    doc_sims = centered @ centered.T
    np.fill_diagonal(doc_sims, -1)
    for it, s in zip(items, doc_sims):
        it["hits"] = [{"id": items[i]["id"], "cosine": round(float(s[i]), 3)}
                      for i in np.argsort(-s)[:TOP_K]]

    keys = ("id", "name", "url", "industry", "product", "use_cases", "logo", "hits")
    out = {
        "_generated_by": "automation/case-study-space/build_space.py",
        "model": MODEL,
        "projection": "mean-centered, UMAP cosine, n_neighbors=6, min_dist=0.35, seed 42, de-overlapped",
        "width": W,
        "height": H,
        "points": [
            {k: it[k] for k in keys if it.get(k)}
            | (it["box"] or {})
            | {"h": round(logo_size((it["box"] or {}).get("aspect"))[1], 1),
                              "x": round(float(p[0]), 4), "y": round(float(p[1]), 4),
                 "px": round(float(t[0]), 4), "py": round(float(t[1]), 4)}
            for it, p, t in zip(items, xy, portrait)
        ],
        "queries": chips,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} case studies and {len(QUERIES)} queries to {OUT.relative_to(ROOT)}")
    for c in chips:
        hits = ", ".join(f"{h['id']} {h['cosine']}" for h in c["hits"])
        print(f"  {c['label']:22s} {hits}")


if __name__ == "__main__":
    main()
