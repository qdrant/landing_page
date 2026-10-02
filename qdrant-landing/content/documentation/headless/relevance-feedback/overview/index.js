// Static overview: illustrative bar lengths preserve the original comparisons,
// not measurements. Separate phone geometry keeps the same entities readable.
const DOCUMENTS = [
  [0.96, 0.68],
  [0.86, 1],
  [0.7, 0.54],
  [0.67, 0.77],
  [0.46, 0.38],
];
const CANDIDATES = [
  [0.77, 0.4, 0.66, "- delta"],
  [0.61, 0.88, 0.3, "+ delta"],
  [0.48, 0.26, 0.49, "- delta"],
];
const DESCRIPTION =
  "A feedback model scores five retrieved documents. Doc 2 is selected as the positive example and Doc 5 as the negative example. The query and this context pair rescore candidates from the collection: Candidate 2 receives a positive adjustment, while Candidates 1 and 3 receive negative adjustments. Bar lengths are illustrative.";

export function drawing(mobile = false, fallback = false) {
  const w = mobile ? 320 : 700;
  const f = fallback ? 30 : mobile ? 14 : 22;
  const row = fallback ? 66 : mobile ? 48 : 56;
  const top = fallback ? 138 : mobile ? 110 : 116;
  const end = top + 5 * row;
  const pair = end + 65;
  const second = pair + (mobile ? 145 : 100);
  const candidates = second + (mobile ? 140 : 125);
  const cr = fallback ? 125 : mobile ? 112 : 104;
  const height = candidates + 3 * cr + 34;
  const x = mobile ? 65 : 120;
  const bw = mobile ? 120 : 310;
  const parts = [];
  const text = (x, y, s, size = f, anchor = "start") =>
    parts.push(
      `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}">${s}</text>`,
    );
  const box = (x, y, width, height, color = "var(--qi-muted)") =>
    parts.push(
      `<rect class="qi-frame" x="${x}" y="${y}" width="${width}" height="${height}" rx="6" style="stroke:${color};stroke-width:1.5"/>`,
    );
  const line = (x1, y1, x2, y2, color = "var(--qi-muted)", dash = "") =>
    parts.push(
      `<path d="M${x1} ${y1} L${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`,
    );
  const bar = (y, fraction, color) =>
    parts.push(
      `<rect x="${x}" y="${y}" width="${bw * fraction}" height="${mobile ? 7 : 10}" rx="2" fill="${color}"/>`,
    );
  const purple = "var(--qi-cat-1)",
    teal = "var(--qi-cat-3)",
    green = "#388e3c",
    red = "var(--qi-cat-4)";
  box(2, 2, w - 4, end + 27);
  text(18, mobile ? 28 : 38, "1. Feedback model");
  parts.push(
    `<rect x="18" y="${mobile ? 45 : 58}" width="12" height="12" fill="${purple}"/>`,
  );
  text(38, mobile ? 57 : 71, "Retriever");
  parts.push(
    `<rect x="${mobile ? 174 : 300}" y="${mobile ? 45 : 58}" width="12" height="12" fill="${teal}"/>`,
  );
  text(mobile ? 194 : 320, mobile ? 57 : 71, "Feedback");
  const confidence = x + bw * 0.8;
  line(confidence, top - 20, confidence, end - 14, teal, "4 4");
  text(confidence, top - 28, "Confidence", mobile ? 14 : f, "middle");
  DOCUMENTS.forEach(([a, b], i) => {
    const y = top + i * row;
    text(18, y + 12, `Doc ${i + 1}`);
    bar(y - 4, a, purple);
    bar(y + 10, b, teal);
    if (i === 1 || i === 4) {
      const label =
        i === 1
          ? mobile
            ? "+ Doc 2"
            : "+ Positive"
          : mobile
            ? "- Doc 5"
            : "- Negative";
      box(
        mobile ? 200 : 452,
        y - 14,
        mobile ? 102 : 228,
        mobile ? 34 : 44,
        i === 1 ? green : red,
      );
      text(mobile ? 208 : 467, y + (mobile ? 8 : 16), label);
    }
  });
  // The selected pair remains identified by both words/signs and color.
  text(w / 2, end + 60, "Selected context pair", f, "middle");
  const cardW = mobile ? 148 : 220;
  const gap = mobile ? 10 : 12;
  const total = mobile ? 2 * cardW + gap : 3 * cardW + 2 * gap;
  const start = (w - total) / 2;
  const cards = mobile
    ? [
        ["Positive: Doc 2", green],
        ["Negative: Doc 5", red],
      ]
    : [
        ["Query", purple],
        ["Positive: Doc 2", green],
        ["Negative: Doc 5", red],
      ];
  cards.forEach(([label, color], i) => {
    const cx = start + i * (cardW + gap);
    box(cx, pair, cardW, fallback ? 70 : 46, color);
    if (fallback && i > 0) {
      text(
        cx + cardW / 2,
        pair + 27,
        i === 1 ? "Positive" : "Negative",
        30,
        "middle",
      );
      text(
        cx + cardW / 2,
        pair + 58,
        i === 1 ? "Doc 2" : "Doc 5",
        30,
        "middle",
      );
    } else {
      text(
        cx + cardW / 2,
        pair + 30,
        label,
        mobile ? 14 : fallback ? 30 : 20,
        "middle",
      );
    }
  });
  if (mobile) {
    box(91, pair + 60, 138, 42, purple);
    text(160, pair + 87, "Query", f, "middle");
  }
  const arrowY = pair + (mobile ? 108 : fallback ? 74 : 50);
  line(w / 2, arrowY, w / 2, second - 10);
  parts.push(
    `<path d="M${w / 2 - 5} ${second - 17} L${w / 2} ${second - 9} L${w / 2 + 5} ${second - 17}" fill="none" stroke="var(--qi-muted)" stroke-width="2"/>`,
  );
  box(2, second, w - 4, height - second - 2);
  text(18, second + 34, "2. Rescore collection");
  text(18, second + 65, "With one context pair");
  // Similarity to query is the baseline; the pair contributes + or - delta.
  [
    ["To query", purple],
    ["To positive", green],
    ["To negative", red],
  ].forEach(([label, color], i) => {
    const lx = mobile ? 18 + i * 99 : 18 + i * 225;
    parts.push(
      `<rect x="${lx}" y="${second + 85}" width="10" height="10" fill="${color}"/>`,
    );
    text(
      lx + 15,
      second + 95,
      mobile ? label.replace("To ", "") : label,
      mobile ? 14 : fallback ? 30 : 18,
    );
  });
  CANDIDATES.forEach(([q, p, n, label], i) => {
    const y = candidates + i * cr;
    text(18, y, `Candidate ${i + 1}`);
    const bx = mobile ? 18 : 230,
      width = mobile ? 190 : 220;
    [q, p, n].forEach((value, j) =>
      parts.push(
        `<rect x="${bx}" y="${y + (mobile ? 14 : 7) + j * 15}" width="${value * width}" height="9" rx="2" fill="${[purple, green, red][j]}"/>`,
      ),
    );
    text(mobile ? 218 : 492, y + (mobile ? 40 : 33), label, mobile ? 14 : f);
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" class="qi-svg qi-rf__${mobile ? "mobile" : "desktop"}" width="${w}" height="${height}" viewBox="0 0 ${w} ${height}" role="img" aria-label="${DESCRIPTION}"><title>Relevance feedback overview</title><desc>${DESCRIPTION}</desc>${parts.join("")}</svg>`;
}

function desktop() {
  const purple = "var(--qi-cat-1)",
    teal = "var(--qi-cat-3)",
    green = "#388e3c",
    red = "var(--qi-cat-4)";
  let body = "";
  const text = (x, y, label, size = 17) =>
    (body += `<text x="${x}" y="${y}" font-size="${size}">${label}</text>`);
  const box = (x, y, w, h, color = "var(--qi-muted)") =>
    (body += `<rect class="qi-frame" x="${x}" y="${y}" width="${w}" height="${h}" rx="6" style="stroke:${color};stroke-width:1.5"/>`);
  const bar = (x, y, w, color) =>
    (body += `<rect x="${x}" y="${y}" width="${w}" height="8" rx="2" fill="${color}"/>`);
  box(2, 2, 332, 556);
  box(354, 2, 344, 556);
  text(18, 32, "1. Feedback model");
  text(370, 32, "2. Rescore collection");
  text(370, 58, "One context pair");
  bar(18, 60, 12, purple);
  text(38, 70, "Retriever");
  bar(180, 60, 12, teal);
  text(200, 70, "Feedback");
  text(129, 105, "Confidence");
  body += `<path d="M196 115V383" stroke="${teal}" stroke-width="2" stroke-dasharray="4 4"/>`;
  DOCUMENTS.forEach(([r, f], i) => {
    const y = 136 + i * 52;
    text(18, y + 12, `Doc ${i + 1}`);
    bar(84, y, 140 * r, purple);
    bar(84, y + 13, 140 * f, teal);
    if (i === 1 || i === 4) {
      box(230, y - 3, 90, 34, i === 1 ? green : red);
      text(237, y + 19, i === 1 ? "+ Doc 2" : "- Doc 5", 17);
    }
  });
  text(18, 420, "Selected context pair");
  box(18, 440, 298, 44, green);
  text(33, 468, "Positive example: Doc 2");
  box(18, 498, 298, 44, red);
  text(33, 526, "Negative example: Doc 5");
  [
    ["To query", purple],
    ["To positive", green],
    ["To negative", red],
  ].forEach(([label, color], i) => {
    bar(370, 82 + i * 25, 12, color);
    text(390, 92 + i * 25, label);
  });
  CANDIDATES.forEach(([q, p, n, label], i) => {
    const y = 174 + i * 86;
    text(370, y, `Candidate ${i + 1}`);
    [q, p, n].forEach((v, j) =>
      bar(370, y + 14 + j * 13, 178 * v, [purple, green, red][j]),
    );
    text(578, y + 44, label);
  });
  text(370, 444, "Query + selected pair");
  box(370, 464, 312, 78, purple);
  text(390, 493, "Rescore candidates across");
  text(390, 519, "the collection");
  body +=
    '<path d="M335 468H351M345 462L351 468L345 474" fill="none" stroke="var(--qi-muted)" stroke-width="2"/>';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="qi-svg qi-rf__desktop" viewBox="0 0 700 560" role="img" aria-label="${DESCRIPTION}"><title>Relevance feedback overview</title><desc>${DESCRIPTION}</desc>${body}</svg>`;
}

export function mount(node) {
  node.classList.add("qi-rf");
  node.innerHTML = `<div class="qi-fig">${desktop()}${drawing(true)}</div>`;
  node.dispatchEvent(new CustomEvent("island:ready", { bubbles: true }));
}
