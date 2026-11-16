```typescript
import { readFileSync } from "node:fs";

const pdfResponse = await gemini.models.embedContent({
  model: MODEL,
  contents: [
    { inlineData: { mimeType: "application/pdf", data: readFileSync("filename.pdf", "base64") } },
  ],
});

await client.upsert("{collection_name}", {
  points: [{ id: 100, vector: pdfResponse.embeddings![0].values!, payload: { file: "filename.pdf" } }],
});
```
