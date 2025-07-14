This code snippet demonstrates how to use cloud inference in Qdrant Cloud to automatically create vector embeddings from text documents during upseart and query operations.
In this example we create a new point with a new vector, generated on the qdrant cloud side.
`Document` object contains the text which will be used as an input for inference model.
Specific model which should be used for inference is defined in the `model` parameter.

After point is inserted is becomes searchable.
Snippet contains an example of search query request, that uses cloud-side inferene.
`Document` object is used to obtain query vector. 
