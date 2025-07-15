This code snippet shows how to use Qdrant Cloud's cloud-side inference to automatically generate vector embeddings from images and text during upsert and search operations.

In the example, a new point is inserted with an image URL and a specified model. The vector embedding is generated on the Qdrant Cloud side using the provided model. The `image` and `model` fields specify the image to embed and the model to use.

After the point is inserted, it becomes searchable. The snippet also demonstrates how to perform a search query using cloud-side inference: a `text` and `model` are provided, and Qdrant Cloud generates the query vector automatically. This allows you to search your collection using natural language queries without manually generating embeddings.

Example demonstrates multimodal search with `CLIP` model and cloud-side inference.