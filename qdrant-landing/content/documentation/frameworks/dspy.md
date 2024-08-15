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
pip install dspy-ai[qdrant]
```

## Usage

We can configure `DSPy` settings to use the Qdrant retriever model like so:
```python
import dspy
from dspy.retrieve.qdrant_rm import QdrantRM

from qdrant_client import QdrantClient

turbo = dspy.OpenAI(model="gpt-3.5-turbo")
qdrant_client = QdrantClient()  # Defaults to a local instance at http://localhost:6333/
qdrant_retriever_model = QdrantRM("collection-name", qdrant_client, k=3)

dspy.settings.configure(lm=turbo, rm=qdrant_retriever_model)
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
