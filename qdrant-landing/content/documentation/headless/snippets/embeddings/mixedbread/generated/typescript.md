```typescript
import Mixedbread from "@mixedbread/sdk";

const mxbai = new Mixedbread();

const documents = [
  "Qdrant is a vector search engine.",
  "Mixedbread publishes open-weight embedding models on Hugging Face.",
];

const documentResult = await mxbai.embed({
  model: "mixedbread-ai/mxbai-embed-large-v1",
  input: documents,
});
const queryResult = await mxbai.embed({
  model: "mixedbread-ai/mxbai-embed-large-v1",
  input: "Represent this sentence for searching relevant passages: What is Qdrant?",
});
```
