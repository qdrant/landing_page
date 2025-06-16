---
title: Stanford DSPy
aliases: [ ../integrations/dspy/ ]
---

# Stanford DSPy

[DSPy](https://github.com/stanfordnlp/dspy) is the framework for solving advanced tasks with language models (LMs) and retrieval models (RMs). It unifies techniques for prompting and fine-tuning LMs — and approaches for reasoning, self-improvement, and augmentation with retrieval and tools.

- Provides composable and declarative modules for instructing LMs in a familiar Pythonic syntax.

- Introduces an automatic compiler that teaches LMs how to conduct the declarative steps in your program.

Qdrant can be used as a retrieval mechanism in the DSPy flow.

## Installation

For the Qdrant retrieval integration, include `dspy-ai` with the `qdrant` extra:
```bash
pip install dspy-ai dspy-qdrant fastembed
```

## Usage

We can configure `DSPy` settings to use the Qdrant retriever model like so:
```python
import os
import dspy
from dspy_qdrant import QdrantRM
from qdrant_client import QdrantClient

lm = dspy.LM("gpt-4o-mini", max_tokens=512,api_key=os.environ.get("OPENAI_API_KEY"))
client = QdrantClient(url=os.environ.get("QDRANT_CLOUD_URL"), api_key=os.environ.get("QDRANT_API_KEY"))
collection_name = "collection_name"
rm = QdrantRM(
    qdrant_collection_name=collection_name, 
    qdrant_client=client, 
    vector_name="dense",                 # <-- MATCHES your vector name
    document_field="passage_text",        # <-- MATCHES your payload field
    k=20)

dspy.settings.configure(lm=lm, rm=rm)
```
Using the retriever is pretty simple. The `dspy.Retrieve(k)` module will search for the top-k passages that match a given query.

```python
retrieve = dspy.Retrieve(k=3)
question = "Some question about my data"
topK_passages = retrieve(question).passages

print(f"Top {retrieve.k} passages for question: {question} \n", "\n")

for idx, passage in enumerate(topK_passages):
    print(f"{idx+1}]", passage, "\n")
```

With Qdrant configured as the retriever for contexts, you can set up a DSPy module like so:
```python
class RAG(dspy.Module):
    def __init__(self, num_passages=3):
        super().__init__()

        self.retrieve = dspy.Retrieve(k=num_passages)
        ...

    def forward(self, question):
        context = self.retrieve(question).passages
        ...

```

With the generic RAG blueprint now in place, you can add the many interactions offered by DSPy with context retrieval powered by Qdrant.

## Next steps

- Find DSPy usage docs and examples [here](https://github.com/stanfordnlp/dspy#4-documentation--tutorials).

- [Source Code](https://github.com/stanfordnlp/dspy/blob/main/dspy/retrieve/qdrant_rm.py)
