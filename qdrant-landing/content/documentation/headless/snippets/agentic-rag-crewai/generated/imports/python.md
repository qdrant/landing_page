```python
import argparse
import os
import uuid
from typing import Any

from crewai import LLM, Agent, Crew, Process, Task
from crewai.tools import BaseTool
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from qdrant_client import QdrantClient, models

load_dotenv()

COLLECTION = "meeting-notes"
EMBEDDING_MODEL = "BAAI/bge-small-en-v1.5"
CLAUDE_MODEL = "anthropic/claude-opus-5-5"
```
