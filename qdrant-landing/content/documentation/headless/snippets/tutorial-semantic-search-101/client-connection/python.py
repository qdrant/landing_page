# @hide-start
QDRANT_URL=""
QDRANT_API_KEY=""
# @hide-end

from qdrant_client import QdrantClient, models

client = QdrantClient(
    url=QDRANT_URL,
    api_key=QDRANT_API_KEY,
    cloud_inference=True
)