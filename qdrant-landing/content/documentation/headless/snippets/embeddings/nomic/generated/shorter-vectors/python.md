```python
import numpy as np

def shorten(vector: np.ndarray, size: int) -> list[float]:
    vector = (vector - vector.mean()) / np.sqrt(vector.var() + 1e-5)
    vector = vector[:size]
    return (vector / np.linalg.norm(vector)).tolist()

query_vector_256 = shorten(query_vector, 256)
```
