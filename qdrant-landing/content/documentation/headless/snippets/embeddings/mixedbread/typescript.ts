// @block-start mixedbread-api-legacy
import Mixedbread from "@mixedbread/sdk";

const mxbai = new Mixedbread();

const documents = [
  "Qdrant is a vector database and similarity search engine.",
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
// @block-end mixedbread-api-legacy
