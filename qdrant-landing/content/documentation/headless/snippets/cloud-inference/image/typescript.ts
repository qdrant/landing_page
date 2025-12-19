import {QdrantClient} from "@qdrant/js-client-rest";

const client = new QdrantClient({
    url: 'https://xyz-example.qdrant.io:6333',
    apiKey: '<paste-your-api-key-here>',
});

const points = [
  {
    id: 1,
    vector: {
      image: "https://qdrant.tech/example.png",
      model: "qdrant/clip-vit-b-32-vision"
    },
    payload: {
      title: "Example Image"
    }
  }
];

await client.upsert("<your-collection>", { wait: true, points });

const result = await client.query(
    "<your-collection>",
    {
      query: {
          text: "Mission to Mars",
          model: "qdrant/clip-vit-b-32-text"
      },
    }
)

console.log(result);
