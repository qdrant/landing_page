---
title: Azure OpenAI
weight: 950
---

# Using Azure OpenAI with Qdrant 

Azure OpenAI is Microsoft's platform for AI embeddings, focusing on powerful text and data analytics. These embeddings are suitable for high-precision vector searches in Qdrant.

## Installation

You can install the required packages using the following pip command:

```bash
pip install openai azure-identity python-dotenv qdrant-client
```

## Code Example

```python
import os
import openai
import dotenv
import qdrant_client
from qdrant_client.models import Batch
from azure.identity import DefaultAzureCredential, get_bearer_token_provider

dotenv.load_dotenv()

# Set to True if using Azure Active Directory for authentication
use_azure_active_directory = False

# Qdrant client setup
qdrant_client = qdrant_client.QdrantClient(url="http://localhost:6333")

# Azure OpenAI Authentication
if not use_azure_active_directory:
    endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
    api_key = os.environ["AZURE_OPENAI_API_KEY"]

    client = openai.AzureOpenAI(
        azure_endpoint=endpoint,
        api_key=api_key,
        api_version="2023-09-01-preview"
    )
else:
    endpoint = os.environ["AZURE_OPENAI_ENDPOINT"]
    client = openai.AzureOpenAI(
        azure_endpoint=endpoint,
        azure_ad_token_provider=get_bearer_token_provider(DefaultAzureCredential(), "https://cognitiveservices.azure.com/.default"),
        api_version="2023-09-01-preview"
    )

# Deployment name of the model in Azure OpenAI Studio
deployment = "your-deployment-name"  # Replace with your deployment name

# Generate embeddings using the Azure OpenAI client
text_input = "The food was delicious and the waiter..."
embeddings_response = client.embeddings.create(
    model=deployment,
    input=text_input
)

# Extract the embedding vector from the response
embedding_vector = embeddings_response.data[0].embedding

# Insert the embedding into Qdrant
qdrant_client.upsert(
    collection_name="MyCollection",
    points=Batch(
        ids=[1],  # This ID can be dynamically assigned or managed
        vectors=[embedding_vector],
    )
)

print("Embedding successfully upserted into Qdrant.")
```