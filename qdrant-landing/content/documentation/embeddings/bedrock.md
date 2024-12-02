---
title: AWS Bedrock
---

# Bedrock Embeddings

You can use [AWS Bedrock](https://aws.amazon.com/bedrock/) with Qdrant. AWS Bedrock supports multiple [embedding model providers](https://docs.aws.amazon.com/bedrock/latest/userguide/models-supported.html).

You'll need the following information from your AWS account:

- Region
- Access key ID
- Secret key

To configure your credentials, review the following AWS article: [How do I create an AWS access key](https://repost.aws/knowledge-center/create-access-key).

With the following code sample, you can generate embeddings using the [Titan Embeddings G1 - Text model](https://docs.aws.amazon.com/bedrock/latest/userguide/titan-embedding-models.html) which produces sentence embeddings of size 1536.

```python
# Install the required dependencies
# pip install boto3 qdrant_client

import json
import boto3

from qdrant_client import QdrantClient, models

session = boto3.Session()

bedrock_client = session.client(
    "bedrock-runtime",
    region_name="<YOUR_AWS_REGION>",
    aws_access_key_id="<YOUR_AWS_ACCESS_KEY_ID>",
    aws_secret_access_key="<YOUR_AWS_SECRET_KEY>",
)

qdrant_client = QdrantClient(url="http://localhost:6333")

qdrant_client.create_collection(
    "{collection_name}",
    vectors_config=models.VectorParams(size=1536, distance=models.Distance.COSINE),
)

body = json.dumps({"inputText": "Some text to generate embeddings for"})

response = bedrock_client.invoke_model(
    body=body,
    modelId="amazon.titan-embed-text-v1",
    accept="application/json",
    contentType="application/json",
)

response_body = json.loads(response.get("body").read())

qdrant_client.upsert(
    "{collection_name}",
    points=[models.PointStruct(id=1, vector=response_body["embedding"])],
)
```

```javascript
// Install the required dependencies
// npm install @aws-sdk/client-bedrock-runtime @qdrant/js-client-rest

import {
    BedrockRuntimeClient,
    InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { QdrantClient } from '@qdrant/js-client-rest';

const main = async () => {
    const bedrockClient = new BedrockRuntimeClient({
        region: "<YOUR_AWS_REGION>",
        credentials: {
            accessKeyId: "<YOUR_AWS_ACCESS_KEY_ID>",,
            secretAccessKey: "<YOUR_AWS_SECRET_KEY>",
        },
    });

    const qdrantClient = new QdrantClient({ url: 'http://localhost:6333' });

    await qdrantClient.createCollection("{collection_name}", {
        vectors: {
            size: 1536,
            distance: 'Cosine',
        }
    });

    const response = await bedrockClient.send(
        new InvokeModelCommand({
            modelId: "amazon.titan-embed-text-v1",
            body: JSON.stringify({
                inputText: "Some text to generate embeddings for",
            }),
            contentType: "application/json",
            accept: "application/json",
        })
    );

    const body = new TextDecoder().decode(response.body);

    await qdrantClient.upsert("{collection_name}", {
        points: [
            {
                id: 1,
                vector: JSON.parse(body).embedding,
            },
        ],
    });
}

main();
```
