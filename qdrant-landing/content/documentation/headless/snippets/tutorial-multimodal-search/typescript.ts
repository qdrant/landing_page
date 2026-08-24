import { QdrantClient, Schemas, withHeaders } from "@qdrant/js-client-rest";
import { readFileSync } from "fs";

// @block-start client-connection
const client = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});
// @block-end client-connection

// @block-start define-dataset
function imageToBase64Url(imagePath: string): string {
    const prefix = "data:image/png;base64";
    const imageBuffer = readFileSync(imagePath);
    return `${prefix},${imageBuffer.toString("base64")}`;
}

const documents = [
    { caption: "An image about plane emergency safety.", image: "images/image-1.png" },
    { caption: "An image about airplane components.", image: "images/image-2.png" },
    { caption: "An image about COVID safety restrictions.", image: "images/image-3.png" },
    { caption: "A confidential image about UFO sightings.", image: "images/image-4.png" },
    { caption: "An image about unusual footprints on Aralar 2011.", image: "images/image-5.png" },
];
// @block-end define-dataset

// @block-start create-collection
const collectionName = "multimodal-embeddings";

if (!(await client.collectionExists(collectionName)).exists) {
    await client.createCollection(collectionName, {
        vectors: {
            image: { size: 512, distance: "Cosine" },
            text: { size: 512, distance: "Cosine" },
        },
    });
}
// @block-end create-collection

// @block-start upload-data
const cohereApiKey = process.env.COHERE_API_KEY!;

await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.upsert(collectionName, {
        points: documents.map((doc, idx) => ({
            id: idx,
            vector: {
                text: { text: doc.caption, model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
                image: { image: imageToBase64Url(doc.image), model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
            },
            payload: doc,
        })),
    })
);
// @block-end upload-data

// @block-start text-to-image-search
const textToImageResults = await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.query(collectionName, {
        query: { text: "Plane components", model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
        using: "image",
        with_payload: ["image"],
        limit: 1,
    })
);

console.log(textToImageResults.points[0].payload!.image);
// @block-end text-to-image-search

// @block-start multilingual-search
const multilingualResults = await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.query(collectionName, {
        query: { text: "Componenti di un aereo", model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
        using: "image",
        with_payload: ["image"],
        limit: 1,
    })
);

console.log(multilingualResults.points[0].payload!.image);
// @block-end multilingual-search

// @block-start image-to-text-search
const imageToTextResults = await withHeaders({ "cohere-api-key": cohereApiKey }, () =>
    client.query(collectionName, {
        query: { image: imageToBase64Url("images/image-2.png"), model: "cohere/embed-v4.0", options: { output_dimension: 512 } },
        using: "text",
        with_payload: ["caption"],
        limit: 1,
    })
);

console.log(imageToTextResults.points[0].payload!.caption);
// @block-end image-to-text-search
