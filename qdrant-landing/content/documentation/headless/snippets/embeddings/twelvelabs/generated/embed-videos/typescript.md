```typescript
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
```
