```python
from queue import Empty, Queue

# This is in-memory queue
# For production use cases consider persisting changes
upload_queue: Queue[models.PointStruct] = Queue()
```
