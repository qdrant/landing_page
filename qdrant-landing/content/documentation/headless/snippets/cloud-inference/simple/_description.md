This code snippet demonstrates how to use cloud inference in Qdrant Cloud to automatically create vector embeddings from text documents during upsert and query operations. In this example we create a new point with a new vector, generated in Qdrant Cloud.

The `Document` object contains the text which will be used as an input for inference model. The model which should be used for inference is defined in the `model` parameter.

After the point is inserted it becomes searchable. The snippet contains an example of search query request, that uses Qdrant Cloud inferene. The `Document` object is used to create the query vector with the configured inference `model`. 
