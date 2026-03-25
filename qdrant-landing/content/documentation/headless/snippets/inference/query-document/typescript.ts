import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ host: "localhost", port: 6333 }); // @hide

client.query("{collection_name}", {
    query: {
        text: 'My Query Text',
        model: '<the-model-to-use>',
    },
});
