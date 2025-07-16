This code snippet shows how to use Qdrant Cloud Inference to automatically generate vector embeddings from images and text during upsert and search operations. 

In this example, a new point is inserted with an image URL and a specified model. The vector embedding is generated on the Qdrant Cloud side using the provided model. The `image` and `model` fields specify the image to embed and the model to use.

After the point is inserted, it becomes searchable. The snippet also demonstrates how to perform a search query using Qdrant Cloud Inference. A `text` and `model` are provided, and Qdrant Cloud generates the query vector automatically. This allows you to search your collection using natural language queries without manually generating embeddings.

This example demonstrates multimodal search using the `CLIP` model and Qdrant Cloud Inference.