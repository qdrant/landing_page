#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.12"
# dependencies = ["qdrant-client==1.20.0", "fastembed==0.8.0", "pandas==2.3.3", "huggingface-hub==1.33.0", "httpx==0.28.1", "ipython>=8"]
# ///

# Query blocks mirror the companion film-location-search notebook.
import asyncio
import atexit
import hashlib
import json
import platform
import shutil
import socket
import subprocess
import tarfile
import tempfile
from pathlib import Path

import httpx
from fastembed import TextEmbedding
from huggingface_hub import snapshot_download
from qdrant_client import AsyncQdrantClient, models


async def main() -> None:
    # @hide-start
    QDRANT_VERSION = "1.20.2"
    RELEASES = {
        ("Linux", "x86_64"): (
            "qdrant-x86_64-unknown-linux-musl.tar.gz",
            "7c3e956b97830a9faa6391540330380c2fa4aa2f92df99bd8d1880a703b922af",
        ),
        ("Darwin", "arm64"): (
            "qdrant-aarch64-apple-darwin.tar.gz",
            "385b244e6283968b2be926358541b5bc19b9ada7ea9586e900684388bc912d5f",
        ),
        ("Darwin", "x86_64"): (
            "qdrant-x86_64-apple-darwin.tar.gz",
            "73a6538ccccb892ec2c6fa3431faf1e73fba7eb2179079adbd0c65ae4c55bf6a",
        ),
    }
    asset, expected_digest = RELEASES[(platform.system(), platform.machine())]
    runtime_dir = Path(tempfile.mkdtemp(prefix="film-location-qdrant-"))
    archive = runtime_dir / asset
    release_url = (
        f"https://github.com/qdrant/qdrant/releases/download/v{QDRANT_VERSION}/{asset}"
    )
    async with httpx.AsyncClient(follow_redirects=True, timeout=120) as http:
        response = await http.get(release_url)
        response.raise_for_status()
        archive.write_bytes(response.content)
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == expected_digest
    binary = runtime_dir / "qdrant"
    with tarfile.open(archive) as bundle:
        executable = bundle.extractfile("qdrant")
        assert executable is not None
        with binary.open("wb") as output:
            shutil.copyfileobj(executable, output)
    binary.chmod(0o755)

    with socket.socket() as port_probe:
        port_probe.bind(("127.0.0.1", 0))
        port = port_probe.getsockname()[1]
    QDRANT_URL = f"http://127.0.0.1:{port}"
    config = runtime_dir / "config.yaml"
    config.write_text(
        "log_level: ERROR\n"
        "storage:\n  storage_path: ./storage\n  snapshots_path: ./snapshots\n"
        f"service:\n  host: 127.0.0.1\n  http_port: {port}\n  grpc_port: null\n"
        "  enable_cors: false\ncluster:\n  enabled: false\n"
    )
    server_log = (runtime_dir / "server.log").open("w")
    server = subprocess.Popen(
        [str(binary), "--config-path", str(config), "--disable-telemetry"],
        cwd=runtime_dir,
        stdout=server_log,
        stderr=subprocess.STDOUT,
    )
    atexit.register(server.terminate)
    async with httpx.AsyncClient(timeout=2) as http:
        for _ in range(60):
            if server.poll() is not None:
                raise RuntimeError((runtime_dir / "server.log").read_text())
            try:
                response = await http.get(f"{QDRANT_URL}/readyz")
                if response.is_success:
                    break
            except httpx.ConnectError:
                pass
            await asyncio.sleep(0.5)
        else:
            raise TimeoutError("Qdrant did not become ready; inspect server.log.")
    client = AsyncQdrantClient(url=QDRANT_URL)
    server_info = await client.info()
    assert server_info.version == QDRANT_VERSION
    print(f"Qdrant server {server_info.version} is ready at {QDRANT_URL}")
    # @hide-end

    # @hide-start
    locations = json.loads(r"""[
      {
        "id": 1,
        "name": "Old Kiln Hall",
        "description": "An abandoned industrial warehouse with weathered red brick walls, tall factory windows, steel roof trusses and an empty concrete floor. A moody space for a warehouse film scene.",
        "location": {
          "lat": 52.251,
          "lon": 21.049
        },
        "permission_available": false,
        "power_available": true
      },
      {
        "id": 2,
        "name": "East Brickworks",
        "description": "An abandoned industrial warehouse with exposed brick walls, tall dusty factory windows and rusted steel beams. Its empty concrete floor and worn surfaces suit a gritty film scene.",
        "location": {
          "lat": 52.258,
          "lon": 21.096
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 3,
        "name": "Riverside Workshop",
        "description": "A disused repair workshop with red brick walls, high windows, metal columns and a concrete floor. Soft daylight falls across an open industrial interior.",
        "location": {
          "lat": 52.238,
          "lon": 21.035
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 4,
        "name": "North Foundry",
        "description": "A deserted factory warehouse with exposed brick walls, tall windows, old steel gantries and a broad empty concrete floor. Dust and worn industrial machinery create a dramatic abandoned setting.",
        "location": {
          "lat": 52.312,
          "lon": 21.043
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 5,
        "name": "Glass Studio",
        "description": "A bright contemporary photography studio with white plaster walls, a seamless backdrop and a polished floor. The room has modern lighting and a clean commercial appearance.",
        "location": {
          "lat": 52.23,
          "lon": 21.013
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 6,
        "name": "Trackside Depot",
        "description": "A vacant railway maintenance warehouse with exposed red brick, tall arched windows and heavy metal roof supports. Faded paint and worn concrete give the hall an abandoned industrial character.",
        "location": {
          "lat": 52.278,
          "lon": 20.919
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 7,
        "name": "South Textile Mill",
        "description": "An empty former textile factory with exposed brick walls, rows of tall windows and old steel columns. Its expansive worn floor and weathered surfaces suit a deserted industrial film scene.",
        "location": {
          "lat": 52.126,
          "lon": 21.034
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 8,
        "name": "Rehearsal Loft",
        "description": "An open rehearsal loft inside a converted factory, with brick walls, large windows and timber flooring. The industrial room is tidy and still in regular use.",
        "location": {
          "lat": 52.247,
          "lon": 20.985
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 9,
        "name": "West Loading Hall",
        "description": "An unused distribution warehouse with grey concrete walls, low strip windows and steel loading doors. The large empty floor has tire marks and painted traffic lanes.",
        "location": {
          "lat": 52.227,
          "lon": 20.909
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 10,
        "name": "Brick Pump House",
        "description": "A small decommissioned pump station with red brick walls, tall narrow windows and heavy iron pipes. Its dim industrial room has patches of moss and cracked concrete.",
        "location": {
          "lat": 52.213,
          "lon": 21.05
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 11,
        "name": "Outer Ring Hangar",
        "description": "An abandoned industrial warehouse with exposed brick walls, tall factory windows, steel beams and an empty concrete floor. Weathered surfaces and dust create a gritty warehouse setting.",
        "location": {
          "lat": 52.409,
          "lon": 21.014
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 12,
        "name": "Canal Storehouse",
        "description": "A narrow old storage building with peeling brickwork, small barred windows and wooden roof beams. Crates and dusty shelves remain along the walls.",
        "location": {
          "lat": 52.282,
          "lon": 21.061
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 13,
        "name": "Concrete Soundstage",
        "description": "A purpose-built film soundstage with black acoustic walls, an overhead lighting grid and a smooth concrete floor. It is a controlled modern production environment without natural light.",
        "location": {
          "lat": 52.216,
          "lon": 20.979
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 14,
        "name": "Attic Reading Room",
        "description": "A quiet attic library with low timber beams, shelves of books and warm desk lamps. Small dormer windows overlook tiled rooftops.",
        "location": {
          "lat": 52.242,
          "lon": 21.012
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 15,
        "name": "Garden Conservatory",
        "description": "A sunlit glass conservatory filled with tropical plants, tiled paths and wicker chairs. Curved windows frame a leafy garden.",
        "location": {
          "lat": 52.204,
          "lon": 21.036
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 16,
        "name": "Blue Apartment",
        "description": "A compact furnished apartment with blue kitchen cabinets, a modern sofa and a small balcony. White walls and practical furnishings create an everyday domestic setting.",
        "location": {
          "lat": 52.233,
          "lon": 21.02
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 17,
        "name": "Marble Lobby",
        "description": "A polished office lobby with marble columns, glass elevators and chrome reception desks. Its bright corporate interior has reflective surfaces and large modern windows.",
        "location": {
          "lat": 52.228,
          "lon": 21.006
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 18,
        "name": "Velvet Theatre",
        "description": "A small theatre with red velvet seats, a wooden stage and ornate ceiling moldings. Warm spotlights illuminate the empty auditorium.",
        "location": {
          "lat": 52.251,
          "lon": 21.004
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 19,
        "name": "Floodlit Court",
        "description": "An outdoor basketball court surrounded by wire fencing and apartment blocks. Painted lines and overhead floodlights define the urban sports setting.",
        "location": {
          "lat": 52.262,
          "lon": 21.017
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 20,
        "name": "Basement Club",
        "description": "A dark basement music club with low brick vaults, neon signs and a small dance floor. There are no windows and the ceiling is crowded with pipes.",
        "location": {
          "lat": 52.231,
          "lon": 20.999
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 21,
        "name": "Rooftop Terrace",
        "description": "An open rooftop terrace with concrete paving, railings and views across the city skyline. Modern office towers surround the exposed outdoor space.",
        "location": {
          "lat": 52.235,
          "lon": 20.99
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 22,
        "name": "Quiet Classroom",
        "description": "An empty classroom with wooden desks, a chalkboard and posters on pale walls. Broad windows light a clean educational interior.",
        "location": {
          "lat": 52.221,
          "lon": 21.025
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 23,
        "name": "Underground Garage",
        "description": "A concrete underground parking garage with low ceilings, fluorescent lights and painted support columns. Ramps connect rows of empty parking bays.",
        "location": {
          "lat": 52.228,
          "lon": 21.02
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 24,
        "name": "Greenhouse Yard",
        "description": "A fenced yard containing glass greenhouses, potting benches and stacks of terracotta pots. Natural light and climbing plants create a rural garden atmosphere.",
        "location": {
          "lat": 52.185,
          "lon": 21.087
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 25,
        "name": "Retro Laundrette",
        "description": "A narrow laundrette with tiled walls, rows of washing machines and plastic chairs. Bright signs and fluorescent lighting evoke an ordinary neighborhood shop.",
        "location": {
          "lat": 52.244,
          "lon": 21.039
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 26,
        "name": "Stone Courtyard",
        "description": "An enclosed historic courtyard with stone paving, ivy-covered walls and arched doorways. A small fountain sits between old residential facades.",
        "location": {
          "lat": 52.255,
          "lon": 21.01
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 27,
        "name": "Empty Hotel Corridor",
        "description": "A long carpeted hotel corridor with numbered doors, warm wall lamps and patterned wallpaper. The enclosed interior has an intimate, slightly dated appearance.",
        "location": {
          "lat": 52.226,
          "lon": 21.001
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 28,
        "name": "Workshop Annex",
        "description": "A working carpentry shop with brick walls, large windows, workbenches and neatly arranged hand tools. Sawdust covers the timber floor between machines.",
        "location": {
          "lat": 52.24,
          "lon": 20.961
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 29,
        "name": "Ceramic Gallery",
        "description": "A white-walled art gallery with polished wood flooring and carefully lit ceramic sculptures. Its renovated interior feels calm, bright and minimal.",
        "location": {
          "lat": 52.22,
          "lon": 21.016
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 30,
        "name": "Disused Office Wing",
        "description": "An abandoned office floor with peeling paint, damaged ceiling tiles and rows of small windows. Empty desks and worn carpet create a neglected institutional interior.",
        "location": {
          "lat": 52.263,
          "lon": 20.981
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 31,
        "name": "Freight Shed",
        "description": "An old freight shed with corrugated metal cladding, steel beams and sliding doors. The interior is empty and dusty, with little daylight and no brick walls.",
        "location": {
          "lat": 52.288,
          "lon": 21.101
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 32,
        "name": "Boiler Room",
        "description": "A decommissioned industrial boiler room with pipes, metal walkways and soot-darkened brick walls. Narrow high windows illuminate rusting machinery.",
        "location": {
          "lat": 52.269,
          "lon": 21.078
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 33,
        "name": "Daylight Furniture Loft",
        "description": "A renovated furniture showroom in a former warehouse with exposed brick, tall factory windows and a pale wooden floor. Designer sofas and tables fill the bright, carefully maintained interior.",
        "location": {
          "lat": 52.236,
          "lon": 20.976
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 34,
        "name": "Covered Market",
        "description": "A busy indoor market hall with brick arches, glazed roof panels and colorful stalls. Signs, produce and people fill the lively public interior.",
        "location": {
          "lat": 52.258,
          "lon": 21.027
        },
        "permission_available": false,
        "power_available": true
      },
      {
        "id": 35,
        "name": "Empty Pool",
        "description": "A drained indoor swimming pool with blue tiles, changing-room doors and high clerestory windows. Echoes and faded lane markings suggest a closed sports facility.",
        "location": {
          "lat": 52.2,
          "lon": 20.976
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 36,
        "name": "Gravel Service Yard",
        "description": "An outdoor industrial yard with gravel, shipping containers and chain-link fencing. Steel loading equipment stands beside a low utility building.",
        "location": {
          "lat": 52.287,
          "lon": 20.939
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 37,
        "name": "Timber Barn",
        "description": "An old wooden barn with hay bales, exposed rafters and sunlight through gaps in the boards. Its rough rural interior has an earth floor and no industrial equipment.",
        "location": {
          "lat": 52.145,
          "lon": 20.923
        },
        "permission_available": true,
        "power_available": false
      },
      {
        "id": 38,
        "name": "Control Room",
        "description": "A retro control room with analog gauges, switch panels and worn operator chairs. Narrow windows overlook a factory floor, but the room itself is compact and enclosed.",
        "location": {
          "lat": 52.274,
          "lon": 21.055
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 39,
        "name": "White Dance Hall",
        "description": "A clean dance rehearsal hall with mirrors, white walls and a sprung wooden floor. Large windows provide even daylight across the open modern room.",
        "location": {
          "lat": 52.219,
          "lon": 21.009
        },
        "permission_available": true,
        "power_available": true
      },
      {
        "id": 40,
        "name": "Unmapped Factory",
        "description": "An abandoned industrial warehouse with exposed brick walls, tall factory windows and an empty concrete floor. Its location has not yet been verified in the catalog.",
        "permission_available": true,
        "power_available": true
      }
    ]""")
    assert len(locations) == 40
    print(f"{len(locations)} fictional film locations loaded")
    # @hide-end

    # @hide-start
    MODEL_NAME = "BAAI/bge-small-en-v1.5"
    MODEL_REVISION = "aa8f8b060edb00e03bfdd08813a2949946c8ba55"
    model_path = snapshot_download(
        repo_id="qdrant/bge-small-en-v1.5-onnx-q",
        revision=MODEL_REVISION,
        allow_patterns=["*.json", "*.txt", "model_optimized.onnx"],
        cache_dir=str(runtime_dir / "model-cache"),
    )
    encoder = TextEmbedding(
        model_name=MODEL_NAME,
        specific_model_path=model_path,
        threads=2,
        providers=["CPUExecutionProvider"],
    )
    embeddings = list(encoder.passage_embed(item["description"] for item in locations))
    QUERY_TEXT = (
        "An abandoned industrial warehouse with exposed brick walls and tall windows"
    )
    query_vector = next(iter(encoder.query_embed(QUERY_TEXT))).tolist()

    COLLECTION = "film_locations"
    if await client.collection_exists(COLLECTION):
        await client.delete_collection(COLLECTION)
    await client.create_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(
            size=len(query_vector), distance=models.Distance.COSINE
        ),
    )
    for field, schema in [
        ("permission_available", models.PayloadSchemaType.BOOL),
        ("power_available", models.PayloadSchemaType.BOOL),
        ("location", models.PayloadSchemaType.GEO),
    ]:
        await client.create_payload_index(
            COLLECTION, field, field_schema=schema, wait=True
        )
    await client.upsert(
        collection_name=COLLECTION,
        points=[
            models.PointStruct(
                id=item["id"],
                vector=embedding.tolist(),
                payload={key: value for key, value in item.items() if key != "id"},
            )
            for item, embedding in zip(locations, embeddings, strict=True)
        ],
        wait=True,
    )
    print(
        f"Indexed {(await client.count(COLLECTION, exact=True)).count} points, {len(query_vector)} dimensions"
    )
    # @hide-end

    # @block-start baseline
    import math

    import pandas as pd  # type: ignore[import-untyped]

    BASE_LOCATION = models.GeoPoint(lat=52.2297, lon=21.0122)
    CANDIDATE_LIMIT = len(locations)
    TOP_K = 5
    EXACT = models.SearchParams(exact=True)

    def distance_m(origin: models.GeoPoint, destination: dict[str, float]) -> float:
        lat1, lat2 = math.radians(origin.lat), math.radians(destination["lat"])
        dlat = lat2 - lat1
        dlon = math.radians(destination["lon"] - origin.lon)
        a = (
            math.sin(dlat / 2) ** 2
            + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        )
        return 6_371_000 * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    def name_of(point: models.ScoredPoint) -> str:
        assert point.payload is not None
        return str(point.payload["name"])

    def show_hits(
        points: list[models.ScoredPoint], origin: models.GeoPoint = BASE_LOCATION
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            location = payload.get("location")
            rows.append(
                {
                    "id": point.id,
                    "name": payload["name"],
                    "score": point.score,
                    "distance_km": distance_m(origin, location) / 1000
                    if location
                    else None,
                    "permission": payload["permission_available"],
                    "power": payload["power_available"],
                }
            )
        return pd.DataFrame(rows).round(4)

    baseline = (
        await client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            search_params=EXACT,
            limit=CANDIDATE_LIMIT,
            with_payload=True,
        )
    ).points
    semantic_scores = {point.id: point.score for point in baseline}
    print(show_hits(baseline[:TOP_K]))
    # @block-end baseline

    # @block-start filter
    MAX_DISTANCE_M = 15_000.0

    def make_eligibility_filter(origin: models.GeoPoint) -> models.Filter:
        return models.Filter(
            must=[
                models.FieldCondition(
                    key="permission_available", match=models.MatchValue(value=True)
                ),
                models.FieldCondition(
                    key="location",
                    geo_radius=models.GeoRadius(center=origin, radius=MAX_DISTANCE_M),
                ),
            ]
        )

    eligibility_filter = make_eligibility_filter(BASE_LOCATION)
    filtered = (
        await client.query_points(
            collection_name=COLLECTION,
            query=query_vector,
            query_filter=eligibility_filter,
            search_params=EXACT,
            limit=CANDIDATE_LIMIT,
            with_payload=True,
        )
    ).points
    print(show_hits(filtered[:TOP_K]))
    print(f"Eligible candidates: {len(filtered)} / {len(locations)}")
    assert {1, 11, 40}.isdisjoint(point.id for point in filtered)
    # @block-end filter

    # @block-start facility
    FACILITY_WEIGHT = 0.08
    power_condition = models.FieldCondition(
        key="power_available", match=models.MatchValue(value=True)
    )
    facility_bonus = models.MultExpression(mult=[FACILITY_WEIGHT, power_condition])

    facility_boost = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=eligibility_filter,
                params=EXACT,
                limit=CANDIDATE_LIMIT,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(sum=["$score", facility_bonus])
            ),
            limit=TOP_K,
            with_payload=True,
        )
    ).points
    print(show_hits(facility_boost))
    # @block-end facility

    # @block-start proximity
    GEO_WEIGHT = 0.15
    DISTANCE_SCALE_M = 5_000.0

    def make_proximity(origin: models.GeoPoint) -> models.GaussDecayExpression:
        return models.GaussDecayExpression(
            gauss_decay=models.DecayParamsExpression(
                x=models.GeoDistance(
                    geo_distance=models.GeoDistanceParams(origin=origin, to="location")
                ),
                target=0.0,
                scale=DISTANCE_SCALE_M,
                midpoint=0.5,
            )
        )

    proximity = make_proximity(BASE_LOCATION)
    proximity_boost = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=eligibility_filter,
                params=EXACT,
                limit=CANDIDATE_LIMIT,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(
                    sum=[
                        "$score",
                        models.MultExpression(mult=[GEO_WEIGHT, proximity]),
                    ]
                )
            ),
            limit=TOP_K,
            with_payload=True,
        )
    ).points
    print(show_hits(proximity_boost))
    # @block-end proximity

    # @block-start combined
    async def rank_locations(
        origin: models.GeoPoint = BASE_LOCATION,
        facility_weight: float = FACILITY_WEIGHT,
        geo_weight: float = GEO_WEIGHT,
        candidate_limit: int = CANDIDATE_LIMIT,
        limit: int = TOP_K,
    ) -> list[models.ScoredPoint]:
        response = await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=make_eligibility_filter(origin),
                params=EXACT,
                limit=candidate_limit,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(
                    sum=[
                        "$score",
                        models.MultExpression(mult=[facility_weight, power_condition]),
                        models.MultExpression(
                            mult=[geo_weight, make_proximity(origin)]
                        ),
                    ]
                )
            ),
            limit=limit,
            with_payload=True,
        )
        return response.points

    combined = await rank_locations()
    print(show_hits(combined))
    # @block-end combined

    # @block-start explanation
    def explain_scores(
        points: list[models.ScoredPoint],
        origin: models.GeoPoint = BASE_LOCATION,
        facility_weight: float = FACILITY_WEIGHT,
        geo_weight: float = GEO_WEIGHT,
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            distance = distance_m(origin, payload["location"])
            geo_bonus = geo_weight * math.exp(
                math.log(0.5) * (distance / DISTANCE_SCALE_M) ** 2
            )
            power_bonus = facility_weight * float(payload["power_available"])
            reconstructed = semantic_scores[point.id] + power_bonus + geo_bonus
            assert math.isclose(reconstructed, point.score, abs_tol=2e-5)
            rows.append(
                {
                    "name": payload["name"],
                    "semantic": semantic_scores[point.id],
                    "distance_km": distance / 1000,
                    "power_bonus": power_bonus,
                    "geo_bonus": geo_bonus,
                    "final_score": point.score,
                }
            )
        return pd.DataFrame(rows).round(4)

    print(explain_scores(combined))
    comparison = pd.DataFrame(
        {
            "rank": range(1, TOP_K + 1),
            "semantic + eligibility": [name_of(p) for p in filtered[:TOP_K]],
            "power bonus": [name_of(p) for p in facility_boost],
            "geo bonus": [name_of(p) for p in proximity_boost],
            "combined": [name_of(p) for p in combined],
        }
    )
    print(comparison)
    # @block-end explanation

    # @block-start checks
    without_bonuses = await rank_locations(
        facility_weight=0.0, geo_weight=0.0, limit=CANDIDATE_LIMIT
    )
    assert [p.id for p in without_bonuses] == [p.id for p in filtered]
    for actual, expected in zip(without_bonuses, filtered, strict=True):
        assert math.isclose(actual.score, expected.score, abs_tol=1e-6)
    for point in await rank_locations(limit=CANDIDATE_LIMIT):
        payload = point.payload or {}
        assert payload["permission_available"] is True
        assert distance_m(BASE_LOCATION, payload["location"]) <= MAX_DISTANCE_M
        assert point.id not in {1, 11, 40}
    empty_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="location",
                geo_radius=models.GeoRadius(center=BASE_LOCATION, radius=1.0),
            )
        ]
    )
    empty = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector, filter=empty_filter, limit=CANDIDATE_LIMIT
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(sum=["$score", facility_bonus])
            ),
            limit=TOP_K,
        )
    ).points
    assert empty == []
    print(
        "Passed: zero bonuses, eligibility, missing coordinates, score arithmetic, and empty result"
    )
    # @block-end checks

    # @block-start overweight
    overweighted = await rank_locations(geo_weight=5.0)
    print(explain_scores(overweighted, geo_weight=5.0))
    assert overweighted[0].payload is not None
    print("Winner's description:", overweighted[0].payload["description"])
    # @block-end overweight

    # @block-start candidate-budget
    narrow = await rank_locations(candidate_limit=3, limit=3)
    wide = await rank_locations(candidate_limit=CANDIDATE_LIMIT, limit=3)
    print(
        pd.DataFrame(
            {
                "rank": [1, 2, 3],
                "prefetch limit 3": [name_of(p) for p in narrow],
                "prefetch limit 40": [name_of(p) for p in wide],
            }
        )
    )
    omitted = [
        name_of(p) for p in wide if p.id not in {candidate.id for candidate in narrow}
    ]
    print("Promoted locations the narrow retrieval missed:", omitted)
    if not omitted:
        print("Both candidate budgets returned the same top results for this request.")
    # @block-end candidate-budget

    # @block-start move-origin
    NEW_BASE = models.GeoPoint(lat=52.310, lon=21.040)
    moved = await rank_locations(origin=NEW_BASE)
    if not moved:
        print("No eligible locations near this base. Try another origin or radius.")
    else:
        print(explain_scores(moved, origin=NEW_BASE))
        print("Original winner:", name_of(combined[0]))
        print("New-base winner:", name_of(moved[0]))
        if [p.id for p in moved] == [p.id for p in combined]:
            print("The ranking is unchanged; inspect the distance contributions.")
    # @block-end move-origin

    # @block-start tuning-exercise
    trial_facility_weight = 0.05
    trial_geo_weight = 0.10
    trial = await rank_locations(
        facility_weight=trial_facility_weight,
        geo_weight=trial_geo_weight,
    )
    print(
        explain_scores(
            trial,
            facility_weight=trial_facility_weight,
            geo_weight=trial_geo_weight,
        )
    )
    # @block-end tuning-exercise

    # @hide-start
    await client.close()
    server.terminate()
    server.wait(timeout=10)
    server_log.close()
    shutil.rmtree(runtime_dir)
    # @hide-end


if __name__ == "__main__":  # @hide
    asyncio.run(main())  # @hide
