#!/usr/bin/env -S uv run --script
#
# /// script
# requires-python = ">=3.12"
# dependencies = ["qdrant-client==1.20.0", "fastembed==0.8.0", "pandas==2.3.3", "huggingface-hub==1.33.0", "httpx==0.28.1", "ipython>=8"]
# ///

# Query blocks mirror the companion ecommerce-search notebook.
import atexit
import asyncio
import hashlib
import platform
import shutil
import socket
import subprocess
import tarfile
import tempfile
from pathlib import Path
import httpx
from qdrant_client import AsyncQdrantClient, models
import io
from typing import NotRequired, TypedDict
import pandas as pd  # type: ignore[import-untyped]
from fastembed import TextEmbedding
from huggingface_hub import snapshot_download
import math


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
    runtime_dir = Path(tempfile.mkdtemp(prefix="ecommerce-qdrant-"))
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
    WANDS_REVISION = "3b74dcf4ba29ab8ff3e6a50b5b09fc627cb882b5"
    WANDS_BASE = (
        f"https://raw.githubusercontent.com/wayfair/WANDS/{WANDS_REVISION}/dataset"
    )
    WANDS_SHA256 = {
        "product": "d993926254572e6eba96c8fd87cc549a17fb91ad3748308036eee4cf92b10ac6",
        "query": "63b61660560fecc33ec490804c7e2b81402ee3e7c31a9cbb5e03736639f68e95",
        "label": "c11fe81ad62f17f56f316b0ec9630ebe8fbe1393578cb0ca4f05c17253a180ef",
    }

    async def load_wands_file(name: str) -> pd.DataFrame:
        async with httpx.AsyncClient(follow_redirects=True, timeout=180) as http:
            response = await http.get(f"{WANDS_BASE}/{name}.csv")
            response.raise_for_status()
        assert hashlib.sha256(response.content).hexdigest() == WANDS_SHA256[name]
        return pd.read_csv(
            io.BytesIO(response.content), sep="\t", keep_default_na=False
        )

    catalog, queries, labels = await asyncio.gather(
        *(load_wands_file(name) for name in ("product", "query", "label"))
    )
    QUERY_ID = 418
    QUERY_TEXT = str(queries.loc[queries["query_id"] == QUERY_ID, "query"].iloc[0])
    judgments = labels.loc[labels["query_id"] == QUERY_ID].copy()
    assert judgments.groupby("product_id")["label"].nunique().max() == 1
    judgments = judgments.drop_duplicates("product_id")
    assert judgments["product_id"].is_unique
    label_by_id = dict(zip(judgments["product_id"], judgments["label"], strict=True))
    selected = catalog.loc[catalog["product_id"].isin(label_by_id)].sort_values(
        "product_id"
    )
    assert len(selected) == len(judgments)

    class Product(TypedDict):
        id: int
        product_name: str
        product_description: str
        in_stock: bool
        free_returns: bool
        pickup_location: NotRequired[dict[str, float]]

    PICKUP_LOCATIONS = [
        {"lat": 52.233, "lon": 21.020},
        {"lat": 52.238, "lon": 21.035},
        {"lat": 52.247, "lon": 20.985},
        {"lat": 52.258, "lon": 21.096},
        {"lat": 52.312, "lon": 21.043},
        {"lat": 52.126, "lon": 21.034},
        {"lat": 52.409, "lon": 21.014},
        {"lat": 52.227, "lon": 20.909},
    ]
    products: list[Product] = []
    for row in selected.to_dict(orient="records"):
        product_id = int(row["product_id"])
        product: Product = {
            "id": product_id,
            "product_name": str(row["product_name"]),
            "product_description": str(row["product_description"]),
            "in_stock": product_id % 7 != 0,
            "free_returns": product_id % 3 == 0,
        }
        if product_id % 37 != 0:
            product["pickup_location"] = PICKUP_LOCATIONS[
                product_id % len(PICKUP_LOCATIONS)
            ]
        products.append(product)
    print(f"Query {QUERY_ID}: {QUERY_TEXT!r}; {len(products)} judged products")
    print(judgments["label"].value_counts().rename_axis("label").to_frame("products"))
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
    print(f"Embedding {len(products)} products on CPU in batches of 32...")
    embeddings = list(
        encoder.passage_embed(
            (
                item["product_name"] + ". " + item["product_description"]
                for item in products
            ),
            batch_size=32,
        )
    )
    query_vector = next(iter(encoder.query_embed(QUERY_TEXT))).tolist()

    COLLECTION = "wands_pickup"
    if await client.collection_exists(COLLECTION):
        await client.delete_collection(COLLECTION)
    await client.create_collection(
        collection_name=COLLECTION,
        vectors_config=models.VectorParams(
            size=len(query_vector), distance=models.Distance.COSINE
        ),
    )
    for field, schema in [
        ("in_stock", models.PayloadSchemaType.BOOL),
        ("free_returns", models.PayloadSchemaType.BOOL),
        ("pickup_location", models.PayloadSchemaType.GEO),
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
            for item, embedding in zip(products, embeddings, strict=True)
        ],
        wait=True,
    )
    print(
        f"Indexed {(await client.count(COLLECTION, exact=True)).count} points, {len(query_vector)} dimensions"
    )
    # @hide-end

    # @block-start baseline
    SHOPPER_LOCATION = models.GeoPoint(lat=52.2297, lon=21.0122)
    CANDIDATE_LIMIT = len(products)
    TOP_K = 5
    EXACT = models.SearchParams(exact=True)

    # @hide-start
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
        return f"{point.id}: {str(point.payload['product_name'])[:55]}"

    def show_hits(
        points: list[models.ScoredPoint], origin: models.GeoPoint = SHOPPER_LOCATION
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            location = payload.get("pickup_location")
            rows.append(
                {
                    "id": point.id,
                    "product_name": str(payload["product_name"])[:60],
                    "label": label_by_id[point.id],
                    "score": point.score,
                    "distance_km": distance_m(origin, location) / 1000
                    if location
                    else None,
                    "in_stock": payload["in_stock"],
                    "free_returns": payload["free_returns"],
                }
            )
        return pd.DataFrame(rows).round(4)

    # @hide-end
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
    for point in baseline[:2]:
        assert point.payload is not None
        print(name_of(point), "| WANDS:", label_by_id[point.id])
        print(point.payload["product_description"], "\n")
    # @block-end baseline

    # @block-start filter
    MAX_DISTANCE_M = 15_000.0

    def make_eligibility_filter(origin: models.GeoPoint) -> models.Filter:
        return models.Filter(
            must=[
                models.FieldCondition(
                    key="in_stock", match=models.MatchValue(value=True)
                ),
                models.FieldCondition(
                    key="pickup_location",
                    geo_radius=models.GeoRadius(center=origin, radius=MAX_DISTANCE_M),
                ),
            ]
        )

    eligibility_filter = make_eligibility_filter(SHOPPER_LOCATION)
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
    print(f"Eligible candidates: {len(filtered)} / {len(products)}")
    assert all(isinstance(point.id, int) and point.id % 37 != 0 for point in filtered)
    # @block-end filter

    # @block-start returns
    RETURNS_WEIGHT = 0.08
    returns_condition = models.FieldCondition(
        key="free_returns", match=models.MatchValue(value=True)
    )
    returns_bonus = models.MultExpression(mult=[RETURNS_WEIGHT, returns_condition])

    returns_boost = (
        await client.query_points(
            collection_name=COLLECTION,
            prefetch=models.Prefetch(
                query=query_vector,
                filter=eligibility_filter,
                params=EXACT,
                limit=CANDIDATE_LIMIT,
            ),
            query=models.FormulaQuery(
                formula=models.SumExpression(sum=["$score", returns_bonus])
            ),
            limit=TOP_K,
            with_payload=True,
        )
    ).points
    print(show_hits(returns_boost))
    # @block-end returns

    # @block-start proximity
    GEO_WEIGHT = 0.15
    DISTANCE_SCALE_M = 5_000.0

    def make_proximity(origin: models.GeoPoint) -> models.GaussDecayExpression:
        return models.GaussDecayExpression(
            gauss_decay=models.DecayParamsExpression(
                x=models.GeoDistance(
                    geo_distance=models.GeoDistanceParams(
                        origin=origin, to="pickup_location"
                    )
                ),
                target=0.0,
                scale=DISTANCE_SCALE_M,
                midpoint=0.5,
            )
        )

    proximity = make_proximity(SHOPPER_LOCATION)
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
    async def rank_products(
        origin: models.GeoPoint = SHOPPER_LOCATION,
        returns_weight: float = RETURNS_WEIGHT,
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
                        models.MultExpression(mult=[returns_weight, returns_condition]),
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

    combined = await rank_products()
    print(show_hits(combined))
    # @block-end combined

    # @block-start explanation
    def explain_scores(
        points: list[models.ScoredPoint],
        origin: models.GeoPoint = SHOPPER_LOCATION,
        returns_weight: float = RETURNS_WEIGHT,
        geo_weight: float = GEO_WEIGHT,
    ) -> pd.DataFrame:
        rows = []
        for point in points:
            payload = point.payload or {}
            distance = distance_m(origin, payload["pickup_location"])
            geo_bonus = geo_weight * math.exp(
                math.log(0.5) * (distance / DISTANCE_SCALE_M) ** 2
            )
            returns_bonus = returns_weight * float(payload["free_returns"])
            reconstructed = semantic_scores[point.id] + returns_bonus + geo_bonus
            assert math.isclose(reconstructed, point.score, abs_tol=2e-5)
            rows.append(
                {
                    "id": point.id,
                    "product_name": str(payload["product_name"])[:60],
                    "label": label_by_id[point.id],
                    "semantic": semantic_scores[point.id],
                    "distance_km": distance / 1000,
                    "returns_bonus": returns_bonus,
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
            "returns bonus": [name_of(p) for p in returns_boost],
            "geo bonus": [name_of(p) for p in proximity_boost],
            "combined": [name_of(p) for p in combined],
        }
    )
    print(comparison)
    # @block-end explanation

    # @block-start checks
    without_bonuses = await rank_products(
        returns_weight=0.0, geo_weight=0.0, limit=CANDIDATE_LIMIT
    )
    expected_scores = {point.id: point.score for point in filtered}
    assert {point.id for point in without_bonuses} == set(expected_scores)
    for point in without_bonuses:
        assert math.isclose(point.score, expected_scores[point.id], abs_tol=1e-6)
    assert all(
        first.score >= second.score
        for first, second in zip(without_bonuses, without_bonuses[1:])
    )
    for point in await rank_products(limit=CANDIDATE_LIMIT):
        payload = point.payload or {}
        assert payload["in_stock"] is True
        assert (
            distance_m(SHOPPER_LOCATION, payload["pickup_location"]) <= MAX_DISTANCE_M
        )
        assert isinstance(point.id, int) and point.id % 37 != 0
    empty_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="pickup_location",
                geo_radius=models.GeoRadius(center=SHOPPER_LOCATION, radius=1.0),
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
                formula=models.SumExpression(sum=["$score", returns_bonus])
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
    overweighted = await rank_products(geo_weight=5.0)
    print(explain_scores(overweighted, geo_weight=5.0))
    assert overweighted[0].payload is not None
    print("Winner's description:", overweighted[0].payload["product_description"])
    # @block-end overweight

    # @block-start candidate-budget
    narrow = await rank_products(candidate_limit=3, limit=3)
    wide = await rank_products(candidate_limit=CANDIDATE_LIMIT, limit=3)
    print(
        pd.DataFrame(
            {
                "rank": [1, 2, 3],
                "prefetch limit 3": [name_of(p) for p in narrow],
                f"prefetch limit {CANDIDATE_LIMIT}": [name_of(p) for p in wide],
            }
        )
    )
    omitted = [
        name_of(p) for p in wide if p.id not in {candidate.id for candidate in narrow}
    ]
    print("Promoted products the narrow retrieval missed:", omitted)
    if not omitted:
        print("Both candidate budgets returned the same top results for this request.")
    # @block-end candidate-budget

    # @block-start relevance
    GRADE = {"Exact": 2, "Partial": 1, "Irrelevant": 0}

    def dcg(grades: list[int]) -> float:
        return sum(
            (2**grade - 1) / math.log2(rank + 2) for rank, grade in enumerate(grades)
        )

    eligible_grades = sorted(
        (GRADE[label_by_id[point.id]] for point in filtered), reverse=True
    )
    ideal_dcg = dcg(eligible_grades[:TOP_K])
    audit_rows = []
    for policy, hits in [
        ("semantic + eligibility", filtered[:TOP_K]),
        ("combined", combined),
        ("proximity weight 5", overweighted),
    ]:
        grades = [GRADE[label_by_id[point.id]] for point in hits]
        audit_rows.append(
            {
                "policy": policy,
                "NDCG@5 (eligible judged pool)": dcg(grades) / ideal_dcg
                if ideal_dcg
                else None,
                "labels in rank order": [label_by_id[point.id] for point in hits],
            }
        )
    print(pd.DataFrame(audit_rows).round(4))
    # @block-end relevance

    # @block-start move-origin
    NEW_ORIGIN = models.GeoPoint(lat=52.310, lon=21.040)
    moved = await rank_products(origin=NEW_ORIGIN)
    if not moved:
        print("No eligible products near this shopper. Try another origin or radius.")
    else:
        print(explain_scores(moved, origin=NEW_ORIGIN))
        print("Original winner:", name_of(combined[0]))
        print("New-origin winner:", name_of(moved[0]))
        if [p.id for p in moved] == [p.id for p in combined]:
            print("The ranking is unchanged; inspect the distance contributions.")
    # @block-end move-origin

    # @block-start tuning-exercise
    trial_returns_weight = 0.05
    trial_geo_weight = 0.10
    trial = await rank_products(
        returns_weight=trial_returns_weight,
        geo_weight=trial_geo_weight,
    )
    print(
        explain_scores(
            trial,
            returns_weight=trial_returns_weight,
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
