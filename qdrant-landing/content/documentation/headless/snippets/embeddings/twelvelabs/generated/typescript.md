```typescript
import { TwelveLabs } from "twelvelabs-js";
import { QdrantClient } from "@qdrant/js-client-rest";

const twelvelabs = new TwelveLabs({ apiKey: process.env.TWELVE_LABS_API_KEY });
const client = new QdrantClient({ url: "http://localhost:6333" });

const MODEL = "marengo3.5";

await client.createCollection("{collection_name}", {
  vectors: { size: 512, distance: "Cosine" },
});

const VIDEO_URL =
  "https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/720/Big_Buck_Bunny_720_10s_2MB.mp4";

const task = await twelvelabs.embed.v2.tasks.create({
  inputType: "video",
  modelName: MODEL,
  video: {
    mediaSource: { url: VIDEO_URL },
    embeddingScope: ["clip"],
  },
});

let result = await twelvelabs.embed.v2.tasks.retrieve(task.id);
while (result.status === "processing") {
  await new Promise((resolve) => setTimeout(resolve, 5000));
  result = await twelvelabs.embed.v2.tasks.retrieve(task.id);
}

if (result.status !== "ready" || !result.data) {
  throw new Error(`Embedding task ${task.id} failed`);
}

await client.upsert("{collection_name}", {
  points: result.data.map((segment, idx) => ({
    id: idx,
    vector: segment.embedding,
    payload: {
      video_url: VIDEO_URL,
      embedding_option: segment.embeddingOption,
      start_sec: segment.startSec,
      end_sec: segment.endSec,
    },
  })),
});

const response = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  multiInput: { inputText: "A big rabbit wakes up in a forest" },
});

const { points: hits } = await client.query("{collection_name}", {
  query: response.data[0].embedding,
  limit: 3,
});

const audioQuery = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  multiInput: {
    mediaSources: [
      {
        mediaType: "audio",
        url: "https://codeskulptor-demos.commondatastorage.googleapis.com/descent/background%20music.mp3",
      },
    ],
  },
});

const { points: audioHits } = await client.query("{collection_name}", {
  query: audioQuery.data[0].embedding,
  filter: { must: [{ key: "embedding_option", match: { value: "audio" } }] },
  limit: 3,
});

const imageQuery = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  multiInput: {
    mediaSources: [
      {
        mediaType: "image",
        url: "https://upload.wikimedia.org/wikipedia/commons/c/c5/Big_buck_bunny_poster_big.jpg",
      },
    ],
  },
});

const { points: imageHits } = await client.query("{collection_name}", {
  query: imageQuery.data[0].embedding,
  filter: { must: [{ key: "embedding_option", match: { value: "visual" } }] },
  limit: 3,
});

const reducedTask = await twelvelabs.embed.v2.tasks.create({
  inputType: "video",
  modelName: MODEL,
  embeddingDimension: 256,
  video: { mediaSource: { url: VIDEO_URL } },
});

const reducedQuery = await twelvelabs.embed.v2.create({
  inputType: "multi_input",
  modelName: MODEL,
  embeddingDimension: 256,
  multiInput: { inputText: "A big rabbit wakes up in a forest" },
});
```
