import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

import { randomUUID } from "crypto";

const denseModel = "sentence-transformers/all-minilm-l6-v2";
const bm25Model = "qdrant/bm25";
// NOTE: loadDataset is a user-defined function.
// Implement it to return 100 random rows with distinct passages, as the Python version does.
// @hide-start
function loadDataset(name: string, slice: string): Array<{ passage_text: string }> {
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
      bm25_sparse_vector: {
        text: passage,
        model: bm25Model,
      },
    },
  };
});

await client.upsert("{collection_name}", { points });
