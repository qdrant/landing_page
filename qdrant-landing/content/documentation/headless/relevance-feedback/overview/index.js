// Illustrative geometry, not measured scores. Preserve the original comparisons
// and document-to-context connections in desktop and stacked phone compositions.
const DESCRIPTION =
  "A feedback model scores five retrieved documents. Doc 2 becomes the positive example and Doc 5 the negative example. The query and this context pair rescore candidates across the collection. Similarity to the positive example exceeds similarity to the negative example for Candidate 2, producing a positive delta; Candidates 1 and 3 show negative deltas. Bar lengths are illustrative.";
const SCORES = [
  [0.96, 0.68],
  [0.86, 1],
  [0.7, 0.54],
  [0.67, 0.77],
  [0.46, 0.38],
];
const SIMILARITIES = [
  [1, 0.7, 0.9],
  [0.58, 0.86, 0.33],
  [0.27, 0.34, 0.47],
];

export function drawing(mobile = false) {
  const w = mobile ? 320 : 780,
    h = mobile ? 1080 : 550;
  const font = mobile ? 14 : 18;
  const query = "var(--qi-cat-1)",
    feedback = "var(--qi-cat-3)",
    positive = "#2e7d32",
    negative = "var(--qi-cat-4)";
  let body = "";
  const text = (x, y, label, size = font, anchor = "start", ink = false) =>
    (body += `<text x="${x}" y="${y}" font-size="${size}" text-anchor="${anchor}"${ink ? ' class="qi-rf__ink"' : ""}>${label}</text>`);
  const frame = (x, y, width, height, color = "var(--qi-muted)") =>
    (body += `<rect class="qi-frame" x="${x}" y="${y}" width="${width}" height="${height}" rx="6" style="stroke:${color};stroke-width:1.5"/>`);
  const path = (d, color, dash = false, arrow = false) =>
    (body += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2"${dash ? ' stroke-dasharray="4 3"' : ""}${arrow ? ` marker-end="url(#rf-${mobile ? "m" : "d"}-${color === positive ? "positive" : "negative"})"` : ""}/>`);
  const bar = (x, y, width, color) =>
    (body += `<rect x="${x}" y="${y}" width="${width}" height="${mobile ? 18 : 20}" rx="2" fill="${color}"/>`);
  const document = (x, y, width, height, label, color = "var(--qi-muted)") => {
    frame(x, y, width, height, color);
    // Document outline is the same entity cue as in the original figure.
    path(
      `M${x + 10} ${y + 12}h9l4 4v13h-13z M${x + 19} ${y + 12}v5h4 M${x + 13} ${y + 21}h7 M${x + 13} ${y + 25}h7`,
      color,
    );
    text(x + 30, y + 27, label);
  };
  body += `<defs>${[
    ["positive", positive],
    ["negative", negative],
  ]
    .map(
      ([name, color]) =>
        `<marker id="rf-${mobile ? "m" : "d"}-${name}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${color}"/></marker>`,
    )
    .join("")}</defs>`;
  text(mobile ? 18 : 30, 28, "1. Feedback from");
  text(mobile ? 18 : 30, 52, "Feedback Model");
  if (!mobile) {
    text(334, 28, "2. Relevance Feedback Rescoring");
    text(334, 52, "with One Context Pair");
  }
  const docX = mobile ? 28 : 30,
    docW = mobile ? 86 : 92;
  const barsX = mobile ? 122 : 134,
    barsW = mobile ? 174 : 180;
  const first = mobile ? 90 : 90,
    stride = mobile ? 58 : 64;
  SCORES.forEach(([retriever, model], i) => {
    const y = first + i * stride;
    document(docX, y, docW, 44, `Doc ${i + 1}`);
    bar(barsX, y, barsW * retriever, query);
    bar(barsX, y + 24, barsW * model, feedback);
    if (i === 0) {
      text(barsX + 5, y + 15, "Retriever", font, "start", true);
      text(barsX + 5, y + 39, "Feedback", font, "start", true);
    }
  });
  const confidenceX = barsX + barsW,
    last = first + 4 * stride;
  path(`M${confidenceX} ${first - 8}V${last + 50}`, feedback, true);
  const negativeEnd = barsX + barsW * SCORES[4][1];
  path(`M${negativeEnd} ${last + 48}H${confidenceX}`, feedback, true);
  path(
    `M${negativeEnd + 5} ${last + 43}L${negativeEnd} ${last + 48}L${negativeEnd + 5} ${last + 53} M${confidenceX - 5} ${last + 43}L${confidenceX} ${last + 48}L${confidenceX - 5} ${last + 53}`,
    feedback,
  );
  text(
    (negativeEnd + confidenceX) / 2,
    last + 72,
    "Confidence",
    font,
    "middle",
  );
  const inputY = mobile ? 478 : 440;
  const inputs = mobile
    ? [
        [24, 84, "Query", query],
        [119, 84, "Doc 2", positive],
        [214, 84, "Doc 5", negative],
      ]
    : [
        [448, 94, "Query", query],
        [554, 98, "Doc 2", positive],
        [672, 98, "Doc 5", negative],
      ];
  inputs.forEach(([x, width, label, color], i) => {
    text(
      x + width / 2,
      inputY - 12,
      ["Query", "Positive", "Negative"][i],
      font,
      "middle",
    );
    if (i === 0) {
      frame(x, inputY, width, 44, color);
      text(x + width / 2, inputY + 28, label, font, "middle");
    } else document(x, inputY, width, 44, label, color);
  });
  // Route the selected documents around the drawing, directly to their inputs.
  if (mobile) {
    path(
      `M${docX} ${first + stride + 22}H8V538H161V${inputY + 46}`,
      positive,
      false,
      true,
    );
    path(
      `M${docX} ${last + 22}H18V528H256V${inputY + 46}`,
      negative,
      false,
      true,
    );
  } else {
    path(
      `M${docX} ${first + stride + 22}H8V532H603V${inputY + 46}`,
      positive,
      false,
      true,
    );
    path(
      `M${docX} ${last + 22}H18V512H721V${inputY + 46}`,
      negative,
      false,
      true,
    );
  }
  const collectionX = mobile ? 18 : 334,
    collectionY = mobile ? 616 : 90;
  const collectionW = mobile ? 284 : 110,
    collectionH = mobile ? 48 : 300;
  frame(collectionX, collectionY, collectionW, collectionH);
  const cx = mobile ? collectionX + 24 : collectionX + collectionW / 2,
    cy = mobile ? collectionY + 15 : collectionY + 90;
  body += `<ellipse cx="${cx}" cy="${cy}" rx="12" ry="4" fill="none" stroke="var(--qi-muted)" stroke-width="2"/>`;
  path(
    `M${cx - 12} ${cy}v17c0 6 24 6 24 0v-17 M${cx - 12} ${cy + 8}c0 6 24 6 24 0`,
    "var(--qi-muted)",
  );
  text(
    mobile ? 172 : cx,
    mobile ? collectionY + 30 : cy + 51,
    "Collection",
    font,
    "middle",
  );
  if (mobile) {
    text(18, 580, "2. Relevance Feedback Rescoring");
    text(18, 602, "with One Context Pair");
  }
  const candidateX = mobile ? 24 : 458,
    candidateW = mobile ? 86 : 112;
  const candidateBarsX = mobile ? 122 : 584,
    candidateBarsW = mobile ? 174 : 186;
  const candidateFirst = mobile ? 698 : 90,
    candidateStride = mobile ? 124 : 110;
  SIMILARITIES.forEach(([q, p, n], i) => {
    const y = candidateFirst + i * candidateStride;
    frame(candidateX, y, candidateW, 72);
    text(
      candidateX + candidateW / 2,
      y + 29,
      "Candidate",
      font,
      "middle",
    );
    text(candidateX + candidateW / 2, y + 54, `${i + 1}`, font, "middle");
    [q, p, n].forEach((value, j) => {
      bar(
        candidateBarsX,
        y + j * 24,
        candidateBarsW * value,
        [query, positive, negative][j],
      );
      if (i === 0)
        text(
          candidateBarsX + 5,
          y + j * 24 + 15,
          mobile
            ? ["query", "positive", "negative"][j]
            : ["to query", "to positive", "to negative"][j],
          font,
          "start",
          true,
        );
    });
    const gapStart = candidateBarsX + candidateBarsW * Math.min(p, n),
      gapEnd = candidateBarsX + candidateBarsW * Math.max(p, n);
    const bracketY = y + (p > n ? 48 : 24),
      color = p > n ? positive : negative;
    path(
      `M${gapStart} ${bracketY}H${gapEnd}V${bracketY + (mobile ? 18 : 20)}H${gapStart}`,
      color,
      true,
    );
    text(
      candidateBarsX + candidateBarsW,
      y + 96,
      p > n ? "+delta" : "-delta",
      font,
      "end",
    );
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" class="qi-svg qi-rf__${mobile ? "mobile" : "desktop"}" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-label="${DESCRIPTION}"><title>Relevance feedback overview</title><desc>${DESCRIPTION}</desc>${body}</svg>`;
}

export function mount(node) {
  node.classList.add("qi-rf");
  node.innerHTML = `<div class="qi-fig">${drawing()}${drawing(true)}</div>`;
  node.dispatchEvent(new CustomEvent("island:ready", { bubbles: true }));
}
