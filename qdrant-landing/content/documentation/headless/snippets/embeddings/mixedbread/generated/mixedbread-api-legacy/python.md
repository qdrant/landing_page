```python
from mixedbread import Mixedbread

mxbai = Mixedbread()

document_result = mxbai.embed(model="mixedbread-ai/mxbai-embed-large-v1", input=documents)
query_result = mxbai.embed(
    model="mixedbread-ai/mxbai-embed-large-v1",
    input="Represent this sentence for searching relevant passages: What is Qdrant?",
)
```
