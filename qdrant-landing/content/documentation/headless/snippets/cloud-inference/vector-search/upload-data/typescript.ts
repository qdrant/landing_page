import { QdrantClient } from "@qdrant/js-client-rest";
import { randomUUID } from "crypto";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

const denseModel = "sentence-transformers/all-minilm-l6-v2";
// NOTE: loadDataset is a user-defined function.
// Implement it to return 100 random rows with distinct passages, as the Python version does.
// @hide-start
function loadDataset(name: string, slice: string): Array<{ passage_text: string; question: string }> {
    return [];
}
// @hide-end
const dataset = loadDataset("miriad/miriad-4.4M", "train");

const points = dataset.map((item) => {
  const passage = item.passage_text;

  return {
    id: randomUUID().toString(),
    vector: {
      dense_vector: {
        text: passage,
        model: denseModel,
      },
    },
    payload: {
      passage_text: passage, // used for BM25
      question: item.question,
    },
  };
});

await client.upsert("{collection_name}", { points });
