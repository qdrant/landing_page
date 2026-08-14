"""Harness for the hybrid-fusion experiment. Artifact paths live here."""

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data"
CACHE = ROOT / "cache"
RESULTS = ROOT / "results"
FUSED = ROOT / "fused"
DIAG = ROOT / "diag"
PARITY = ROOT / "parity"
FLOOR = ROOT / "floor"
BREADTH = ROOT / "breadth"
STUDY = ROOT / "study"
MANIFEST = ROOT / "manifest.json"

QDRANT_URL = "http://localhost:6360"
QDRANT_IMAGE = "qdrant/qdrant:v1.19.0"
SEED = 42

for _d in (DATA, CACHE, RESULTS, FUSED, DIAG, PARITY, FLOOR, BREADTH, STUDY):
    _d.mkdir(parents=True, exist_ok=True)
