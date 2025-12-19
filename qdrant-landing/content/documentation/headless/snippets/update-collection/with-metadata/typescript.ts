import { QdrantClient } from "@qdrant/js-client-rest"; // @hide

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.updateCollection("{collection_name}", {
  metadata: {
    "my-metadata-field": {
      "key-a": "value-a",
      "key-b": 42
    }
  },
});
