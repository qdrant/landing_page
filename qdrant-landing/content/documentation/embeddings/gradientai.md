---
title: GradientAI
weight: 1750
---

# Using GradientAI with Qdrant 

GradientAI provides state-of-the-art models for generating embeddings, which are highly effective for vector search tasks in Qdrant.

## Installation

You can install the required packages using the following pip command:

```bash
pip install gradientai python-dotenv qdrant-client
```

## Code Example

```python
from dotenv import load_dotenv
import qdrant_client
from qdrant_client.models import Batch
from gradientai import Gradient

load_dotenv()

def main() -> None:
    # Initialize GradientAI client
    gradient = Gradient()

    # Retrieve the embeddings model
    embeddings_model = gradient.get_embeddings_model(slug="bge-large")

    # Generate embeddings for your data
    generate_embeddings_response = embeddings_model.generate_embeddings(
        inputs=[
            "Multimodal brain MRI is the preferred method to evaluate for acute ischemic infarct and ideally should be obtained within 24 hours of symptom onset, and in most centers will follow a NCCT",
            "CTA has a higher sensitivity and positive predictive value than magnetic resonance angiography (MRA) for detection of intracranial stenosis and occlusion and is recommended over time-of-flight (without contrast) MRA",
            "Echocardiographic strain imaging has the advantage of detecting early cardiac involvement, even before thickened walls or symptoms are apparent",
        ],
    )

    # Initialize Qdrant client
    client = qdrant_client.QdrantClient(url="http://localhost:6333")

    # Upsert the embeddings into Qdrant
    for i, embedding in enumerate(generate_embeddings_response.embeddings):
        client.upsert(
            collection_name="MedicalRecords",
            points=Batch(
                ids=[i + 1],  # Unique ID for each embedding
                vectors=[embedding.embedding],
            )
        )

    print("Embeddings successfully upserted into Qdrant.")
    gradient.close()

if __name__ == "__main__":
    main()
```