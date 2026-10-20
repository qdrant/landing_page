```python
import argparse
import asyncio
import logging
import os

import discord
from camel.agents import ChatAgent
from camel.configs import ChatGPTConfig
from camel.embeddings import OpenAIEmbedding
from camel.models import ModelFactory
from camel.retrievers import VectorRetriever
from camel.storages import QdrantStorage
from camel.types import EmbeddingModelType, ModelPlatformType, ModelType
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

def required_env(name: str) -> str:
    value = os.getenv(name, "").strip()
    if not value:
        raise ValueError(f"Set {name} in your environment or .env file.")
    return value
```
