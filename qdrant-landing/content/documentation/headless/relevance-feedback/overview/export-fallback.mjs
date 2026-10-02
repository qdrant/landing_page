// Run with node from any directory. Reuses the diagram's labels and geometry.
import { readFileSync, writeFileSync } from "node:fs";
import { drawing } from "./index.js";
const root = new URL("../../../../../", import.meta.url);
const font = readFileSync(
  new URL(
    "themes/qdrant-2024/static/fonts/Geist_Mono/static/GeistMono-Regular.ttf",
    root,
  ),
).toString("base64");
const license = readFileSync(
  new URL("themes/qdrant-2024/static/fonts/Geist_Mono/OFL.txt", root),
  "utf8",
)
  .split("\n")
  .map((s) => s.trimEnd())
  .join("\n")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;");
const colors = {
  "--qi-fg": "#303547",
  "--qi-muted": "#656b7f",
  "--qi-cat-1": "#6047ff",
  "--qi-cat-3": "#00838f",
  "--qi-cat-4": "#dc244c",
};
let svg = drawing(false, true).replace(
  "><title>",
  `><metadata>${license}</metadata><style>@font-face{font-family:FeedbackGeist;src:url(data:font/ttf;base64,${font}) format('truetype')}text{font-family:FeedbackGeist,monospace;fill:#303547}.qi-frame{fill:#f0f3fa}</style><rect width="100%" height="100%" fill="#f0f3fa"/><title>`,
);
for (const [token, color] of Object.entries(colors))
  svg = svg.replaceAll(`var(${token})`, color);
writeFileSync(
  new URL(
    "static/documentation/tutorials/using-relevance-feedback/overview.svg",
    root,
  ),
  svg + "\n",
);
