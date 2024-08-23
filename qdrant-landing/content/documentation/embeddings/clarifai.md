
---
title: Clarifai
weight: 1200
aliases:
  - /documentation/examples/clarifai-search/
  - /documentation/tutorials/clarifai-search/
  - /documentation/integrations/clarifai/ 
---

# Using Clarifai Embeddings with Qdrant 

Clarifai is a leading provider of visual embeddings, which are particularly strong in image and video analysis. Clarifai offers an API that allows you to create embeddings for various media types, which can be integrated into Qdrant for efficient vector search and retrieval. 

You can install the Clarifai Python client with pip:

```bash
pip install clarifai-grpc
```

## Integration Example

```python
import qdrant_client
from qdrant_client.models import Batch

from clarifai_grpc.channel.clarifai_channel import ClarifaiChannel
from clarifai_grpc.grpc.api import resources_pb2, service_pb2, service_pb2_grpc
from clarifai_grpc.grpc.api.status import status_code_pb2
from google.protobuf.struct_pb2 import Struct

# Qdrant client setup
client = qdrant_client.QdrantClient(url="http://localhost:6333")

# Clarifai setup
PAT = "YOUR_PAT_HERE"
USER_ID = "cohere"
APP_ID = "embed"
MODEL_ID = "cohere-embed-english-v3_0"
MODEL_VERSION_ID = "e2dd848faf454fbda85c26cf89c4926e"
RAW_TEXT = "Give me an exotic yet tasty recipe for some noodle dish"

channel = ClarifaiChannel.get_grpc_channel()
stub = service_pb2_grpc.V2Stub(channel)

params = Struct()
params.update({"input_type": "search_query"})

metadata = (("authorization", "Key " + PAT),)
userDataObject = resources_pb2.UserAppIDSet(user_id=USER_ID, app_id=APP_ID)

# Make the embedding request to Clarifai
post_model_outputs_response = stub.PostModelOutputs(
    service_pb2.PostModelOutputsRequest(
        user_app_id=userDataObject,
        model_id=MODEL_ID,
        version_id=MODEL_VERSION_ID,
        inputs=[
            resources_pb2.Input(
                data=resources_pb2.Data(
                    text=resources_pb2.Text(raw=RAW_TEXT)
                )
            )
        ],
        model=resources_pb2.Model(
            model_version=resources_pb2.ModelVersion(
                output_info=resources_pb2.OutputInfo(params=params)
            )
        ),
    ),
    metadata=metadata,
)

if post_model_outputs_response.status.code != status_code_pb2.SUCCESS:
    print(post_model_outputs_response.status)
    raise Exception("Post model outputs failed, status: " + post_model_outputs_response.status.description)

# Extract the embeddings from the response
embedding = post_model_outputs_response.outputs[0].data.embeddings.vector

# Upsert the embedding into Qdrant
client.upsert(
    collection_name="MyCollection",
    points=Batch(
        ids=[1],
        vectors=[embedding],
    )
)

print("Embedding successfully upserted into Qdrant.")

```
