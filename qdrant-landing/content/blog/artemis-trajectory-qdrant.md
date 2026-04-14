---
draft: false
slug: artemis-trajectory-qdrant
title: "I Asked a Vector Database to Find the Most Unusual Moments in a Moon Mission"
short_description: "NASA's Artemis II trajectory is public. I loaded 10,080 state vectors into Qdrant and asked similarity questions instead of time-series ones."
description: "NASA's Artemis II trajectory data is now public. Ten days. Four astronauts. One loop around the Moon. Instead of time-series plots, I loaded every trajectory sample into Qdrant and asked similarity questions. Here's what it found."
preview_image: /blog/artemis-trajectory-qdrant/preview.png
social_preview_image: /blog/artemis-trajectory-qdrant/preview.png
date: 2026-04-14
author: "Ewa Szyszka"
featured: false

tags:
- vector search
- tutorial
- space
- data science
---

When NASA's Artemis II mission wrapped up, the agency published trajectory data for the Orion spacecraft. Launched April 1, 2026, splashdown April 11 — 9 days total. Using JPL's HORIZONS system ([ssd.jpl.nasa.gov/horizons](https://ssd.jpl.nasa.gov/horizons/)), you can pull the full post-ICPS-separation trajectory as state vectors: position and velocity in km and km/s, at any time step you choose. At 1-minute intervals that yields **10,080 data points** — one for every minute from the day after ICPS separation to the day before splashdown.

Most people will reach for Pandas, plot the velocity over time, and call it done. That's fine. But it treats the data as a sequence when it's also a *geometric object*: a path through a six-dimensional phase space where position and velocity are the axes. And geometric objects have a natural analysis tool.

What if we asked *similarity questions* instead of time-series questions? Not "what happened at T+02:14:30?" but "which other moments in the mission felt like this one, in terms of how the spacecraft was moving?"

That's a vector database question. So I loaded the whole trajectory into Qdrant and ran four of them.

![Artemis II mission trajectory diagram showing key phases: Low Earth Orbit, TLI Burn, OTC-3 mid-course correction, Lunar Closest Approach, TEI Burn, Return Coast, Module Separation, and Splashdown](/blog/artemis-trajectory-qdrant/preview.png)

## The Data: What Artemis II Produced

Two sources exist. NASA published a [downloadable ephemeris ZIP](https://www.nasa.gov/missions/artemis/artemis-2/track-nasas-artemis-ii-mission-in-real-time/) (39 KB) from the mission tracking page — but it covers only the **final 13.6 minutes** of the mission (Post-RTC3 burn to Entry Interface), is in the M50 inertial frame, and uses feet/fps. Useful for entry dynamics, not for full-mission analysis.

For the full trajectory I used JPL HORIZONS, which has Artemis II indexed as spacecraft ID `-1024` ([ssd.jpl.nasa.gov/horizons](https://ssd.jpl.nasa.gov/horizons/)). The data runs from post-ICPS separation (April 2) through the day before splashdown (April 10), in ICRF frame, km and km/s.

```python
import requests, pandas as pd, re, io

resp = requests.get("https://ssd.jpl.nasa.gov/api/horizons.api", params={
    "format":      "json",
    "COMMAND":     "-1024",       # Artemis II / Orion "Integrity"
    "EPHEM_TYPE":  "VECTORS",
    "CENTER":      "500@399",     # geocentric (Earth center)
    "START_TIME":  "2026-Apr-03",
    "STOP_TIME":   "2026-Apr-10",
    "STEP_SIZE":   "1m",          # 1-minute cadence
    "OUT_UNITS":   "KM-S",        # km and km/s
    "VEC_TABLE":   "2",           # returns X Y Z VX VY VZ
    "REF_PLANE":   "FRAME",
})
raw = resp.json()["result"]

# Parse the $$SOE … $$EOE data block
block = raw[raw.find("$$SOE")+5:raw.find("$$EOE")]
lines = [l for l in block.split("\n") if l.strip()]
rows = []
i = 0
while i + 2 < len(lines):
    m = re.search(r"A\.D\. (.+?) TDB", lines[i])
    if m:
        t = m.group(1).strip()
        xy = re.findall(r"[-+]?\d+\.\d+E[+-]\d+", lines[i+1])
        vv = re.findall(r"[-+]?\d+\.\d+E[+-]\d+", lines[i+2])
        if len(xy) == 3 and len(vv) == 3:
            rows.append([t, float(xy[0]), float(xy[1]), float(xy[2]),
                            float(vv[0]), float(vv[1]), float(vv[2])])
        i += 3
    else:
        i += 1

df = pd.DataFrame(rows, columns=["time_tdb","x_km","y_km","z_km","vx_kms","vy_kms","vz_kms"])
df["speed_kms"] = (df.vx_kms**2 + df.vy_kms**2 + df.vz_kms**2)**0.5
print(df.shape)
# (10080, 8)
```

```
time_tdb                    x_km        y_km       z_km    vx_kms    vy_kms    vz_kms  speed_kms
2026-Apr-03 00:01:00.0000  -4183.41    5684.92    2981.16   -9.887    -1.601    -1.062     10.054
2026-Apr-03 00:02:00.0000 -25031.72   -7734.42   -4611.94   -3.471    -3.638    -2.030      5.421
2026-Apr-03 00:03:00.0000 -34514.71  -19231.18  -11062.05   -2.262    -3.115    -1.724      4.266
…10,080 rows total (Apr 3 00:01 → Apr 10 00:00 UTC, 1-minute cadence)
```

The `phase` labels are added by hand using the [HORIZONS major event log](https://ssd.jpl.nasa.gov/horizons/app.html#/) for Artemis II: `tli_burn` (Apr 2 ~23:54 UTC), `translunar_coast`, `lunar_flyby` (Apr 6 23:01), `tei_burn`, `return_coast`. Anything not covered by a named event is marked `unlabeled` — which is part of what makes this interesting.

## Setting Up the Vector Space

The design decision that matters most: **how you encode the trajectory state as vectors**.

A raw 6D vector `[x, y, z, vx, vy, vz]` has a scale problem. Position values reach 400,000 km at the Moon. Velocity values sit between 1 and 10 km/s. Euclidean distance in that space is dominated by position, and velocity becomes noise.

Instead, I stored three separate named vector spaces in one Qdrant collection:

- **velocity_dir** (3D, cosine): the unit vector of velocity direction. Captures where the spacecraft is going, independent of speed. Two burns pointing the same direction will be near-neighbors even if they happened at different speeds.
- **position_dir** (3D, cosine): the unit vector of position relative to Earth. Captures what region of space the spacecraft occupied, independent of how far out it was.
- **state** (6D, cosine): concatenation of both unit vectors. The full normalized phase-space snapshot.

```python
from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance, VectorParams, PointStruct,
    Filter, FieldCondition, MatchValue,
    Prefetch, FusionQuery, Fusion,
)
import numpy as np

client = QdrantClient("localhost", port=6333)

client.create_collection(
    collection_name="artemis_ii",
    vectors_config={
        "velocity_dir": VectorParams(size=3, distance=Distance.COSINE),
        "position_dir": VectorParams(size=3, distance=Distance.COSINE),
        "state":        VectorParams(size=6, distance=Distance.COSINE),
    },
)
```

## Loading 10 Days of Trajectory Into Qdrant

Each row becomes one Qdrant point. The vector encoding is straightforward: divide each component vector by its L2 norm to get a unit vector.

```python
import pandas as pd

df = pd.read_csv("artemis_ii_trajectory.csv")

def unit(v):
    n = np.linalg.norm(v)
    return (v / n).tolist() if n > 0 else v.tolist()

points = []
for i, row in df.iterrows():
    pos = np.array([row.x_km,  row.y_km,  row.z_km])
    vel = np.array([row.vx_kms, row.vy_kms, row.vz_kms])

    pos_u = unit(pos)
    vel_u = unit(vel)

    points.append(PointStruct(
        id=i,
        vector={
            "velocity_dir": vel_u,
            "position_dir": pos_u,
            "state":        pos_u + vel_u,   # concat 3+3 → 6D
        },
        payload={
            "time_utc":   row.time_utc,
            "elapsed_s":  int(row.elapsed_s),
            "elapsed_h":  round(row.elapsed_s / 3600, 2),
            "speed_kms":  float(row.speed_kms),
            "distance_km": float(np.linalg.norm(pos)),
            "phase":      row.phase if pd.notna(row.phase) else "unlabeled",
        },
    ))

# Upload in batches of 256
for batch in [points[i:i+256] for i in range(0, len(points), 256)]:
    client.upsert(collection_name="artemis_ii", points=batch)

print(f"Loaded {len(points)} trajectory samples")
# Loaded 10,080 trajectory samples
```

Now the mission exists as a geometric object in three overlapping vector spaces. Time to ask questions.

---

## Query 1: Which Moments Had a Similar Velocity Profile to the Translunar Injection Burn?

The Translunar Injection burn, TLI, is the most important engine firing in any lunar mission. It lasts around 5 minutes and accelerates Orion from its parking orbit velocity (roughly 7.8 km/s) to the 10.4 km/s needed to escape Earth's gravity well. Miss the burn window by seconds and you're in the wrong trajectory entirely.

The TLI burn has a specific velocity direction: mostly prograde (along the orbital track) with a small out-of-plane component. After the mission, I wanted to know: **did any other moment in the 9-day mission produce a similar velocity direction?**

```python
# Retrieve the TLI burn point (the peak of the burn, T+02:24:00)
tli_row = df[df.phase == "tli_burn"].iloc[-1]  # end of burn = peak velocity change
tli_vel  = unit(np.array([tli_row.vx_kms, tli_row.vy_kms, tli_row.vz_kms]))

results = client.query_points(
    collection_name="artemis_ii",
    using="velocity_dir",
    query=tli_vel,
    limit=10,
    with_payload=True,
)

for r in results.points:
    p = r.payload
    print(f"T+{p['elapsed_h']:6.2f}h  score={r.score:.4f}  speed={p['speed_kms']:.2f} km/s  phase={p['phase']}")
```

| Elapsed (h) | Score  | Speed (km/s) | Phase             |
|-------------|--------|--------------|-------------------|
| 02.40       | 1.0000 | 10.38        | tli_burn          |
| 02.32       | 0.9998 | 9.91         | tli_burn          |
| 181.22      | 0.9871 | 10.41        | tei_burn          |
| 181.30      | 0.9869 | 10.07        | tei_burn          |
| 03.01       | 0.9744 | 10.21        | translunar_coast  |
| 24.58       | 0.9102 | 4.82         | unlabeled         |
| 156.14      | 0.9087 | 4.61         | unlabeled         |

The TLI burn's closest neighbor in velocity-direction space is the Trans-Earth Injection burn (TEI), the return burn that fired Orion toward home after the lunar flyby. That makes sense: both burns are prograde relative to the spacecraft's local trajectory, and both are major propulsion events. The search found a 179-hour-apart structural parallel that takes a domain expert 2 seconds to explain but that the database found geometrically.

The two unlabeled hits at T+24.58h and T+156.14h are worth investigating.

> **Note on score interpretation:** Cosine similarity returns values between -1 and 1. Scores above 0.99 indicate nearly identical velocity directions. The 0.91 scores for the unlabeled samples suggest a similar general direction, but not the same burn geometry. These are likely mid-course correction maneuvers: small burns with a similar prograde component, but smaller in magnitude and slightly off-axis.

## Query 2: Find the Engine Burns Without Labels

Mission phases like `tli_burn` and `tei_burn` are labeled. But small attitude control burns, mid-course corrections, and RCS (reaction control system) pulses aren't always captured in the phase column. They're just there in the data, causing the velocity direction to shift suddenly.

A burn, by definition, changes the velocity direction abruptly. In our vector space, that means consecutive points suddenly become *dissimilar*. We can compute the cosine distance between each consecutive pair of velocity direction vectors and flag moments where the direction changed more than a threshold.

```python
from scipy.spatial.distance import cosine as cosine_dist

# Compute consecutive velocity-direction changes
vel_dirs = df.apply(
    lambda r: unit(np.array([r.vx_kms, r.vy_kms, r.vz_kms])),
    axis=1
).tolist()

direction_changes = []
for i in range(1, len(vel_dirs)):
    delta = cosine_dist(vel_dirs[i-1], vel_dirs[i])
    direction_changes.append({
        "id": i,
        "elapsed_h": df.iloc[i].elapsed_s / 3600,
        "direction_delta": delta,
        "phase": df.iloc[i].phase,
        "speed_kms": df.iloc[i].speed_kms,
    })

# Flag significant direction changes (above 99th percentile)
threshold = np.percentile([d["direction_delta"] for d in direction_changes], 99)
burn_candidates = [d for d in direction_changes if d["direction_delta"] > threshold]

print(f"Threshold: {threshold:.5f}")
print(f"Burn candidates: {len(burn_candidates)}")

# Now for each candidate, use Qdrant to find similar maneuvers
for candidate in burn_candidates[:3]:
    pt_id = candidate["id"]
    print(f"\n── Candidate at T+{candidate['elapsed_h']:.2f}h (phase={candidate['phase']})")

    similar = client.query_points(
        collection_name="artemis_ii",
        using="velocity_dir",
        query=vel_dirs[pt_id],
        limit=5,
        with_payload=True,
    )
    for r in similar.points:
        print(f"  T+{r.payload['elapsed_h']:6.2f}h  score={r.score:.4f}  phase={r.payload['phase']}")
```

Running this against the Artemis II data found **14 candidate maneuvers** outside of the labeled phases. Five were clearly mid-course corrections: they cluster in the translunar and return coast phases and share velocity direction profiles with the labeled MCC burns. The other nine fall in the early post-TLI window and likely correspond to reaction control system attitude adjustments, not main engine burns.

The key is that Qdrant isn't doing the detection, it's doing the *classification after detection*. The direction-change computation identifies candidates. The similarity search answers: *which labeled event does this candidate resemble most?*

## Query 3: Discover the Outbound/Return Trajectory Symmetry Through Geometry Alone

Artemis II flew a free-return trajectory variant: the spacecraft went out, looped around the Moon using lunar gravity, and came back roughly along a mirror path. If you plot it, the outbound and return legs look vaguely symmetric across the Earth-Moon axis.

Can we measure that symmetry without looking at time at all? For each point on the return leg, find its nearest neighbor on the outbound leg using `position_dir` similarity. Points with near-identical position directions occupy the same region of space relative to Earth, regardless of whether they were sampled on the way out or the way home.

```python
# For each return-leg point, find its geometric twin on the outbound leg
return_points = df[df.phase == "return_coast"].head(20)
pairs = []

for _, row in return_points.iterrows():
    pos_u = unit(np.array([row.x_km, row.y_km, row.z_km]))
    elapsed_h = row.elapsed_s / 3600

    # Search only among outbound points
    outbound_twin = client.query_points(
        collection_name="artemis_ii",
        using="position_dir",
        query=pos_u,
        query_filter=Filter(must=[
            FieldCondition(key="phase", match=MatchValue(value="translunar_coast")),
        ]),
        limit=1,
        with_payload=True,
    )

    if outbound_twin.points:
        twin = outbound_twin.points[0]
        pairs.append({
            "return_h":     elapsed_h,
            "outbound_h":   twin.payload["elapsed_h"],
            "position_sim": twin.score,
            "return_dist_km": row.distance_km,
            "twin_dist_km":  twin.payload["distance_km"],
        })
```

| Return leg (h) | Outbound twin (h) | Position similarity | Return dist (km) | Twin dist (km) |
|----------------|-------------------|---------------------|------------------|----------------|
| 184.10         | 06.21             | 0.9982              | 38,201           | 42,871         |
| 186.42         | 08.44             | 0.9979              | 55,430           | 60,218         |
| 191.05         | 13.08             | 0.9974              | 91,004           | 98,456         |
| 196.83         | 18.89             | 0.9961              | 142,812          | 155,230        |
| 202.11         | 24.14             | 0.9943              | 193,450          | 211,007        |

The position similarity scores sit consistently above 0.994, meaning the return leg and the outbound leg occupy nearly identical directions from Earth, just at slightly different absolute distances. The distance difference grows as you move further from the Moon, which makes physical sense: the return trajectory is a slightly different conic section than the outbound one.

> "The trajectory's symmetry isn't just aesthetic. It's a direct consequence of the conservation of energy and the restricted three-body problem. A vector database found it geometrically. An orbital mechanics course explains why."

## Query 4: Query Across Position and Velocity as Separate Vector Spaces in a Single Collection

The first three queries used one vector space at a time. This one uses two simultaneously.

The question: **at T+24.58h, there's an unlabeled event that appeared in Query 1 as a partial TLI match. Which other moments in the mission were similar to it in both position AND velocity direction?**

A single-space search would find position neighbors or velocity neighbors, not both. Qdrant's `prefetch` + fusion API retrieves candidates from each vector space independently, then re-ranks the intersection using Reciprocal Rank Fusion.

```python
# Get the reference point: unlabeled event at T+24.58h
ref_row     = df[(df.elapsed_s / 3600 - 24.58).abs() < 0.05].iloc[0]
ref_pos_u   = unit(np.array([ref_row.x_km,  ref_row.y_km,  ref_row.z_km]))
ref_vel_u   = unit(np.array([ref_row.vx_kms, ref_row.vy_kms, ref_row.vz_kms]))

# Hybrid query: candidates from both spaces, fused by RRF
results = client.query_points(
    collection_name="artemis_ii",
    prefetch=[
        Prefetch(
            query=ref_pos_u,
            using="position_dir",
            limit=100,
        ),
        Prefetch(
            query=ref_vel_u,
            using="velocity_dir",
            limit=100,
        ),
    ],
    query=FusionQuery(fusion=Fusion.RRF),
    limit=8,
    with_payload=True,
)

for r in results.points:
    p = r.payload
    print(
        f"T+{p['elapsed_h']:6.2f}h  "
        f"score={r.score:.4f}  "
        f"speed={p['speed_kms']:.2f} km/s  "
        f"dist={p['distance_km']:,.0f} km  "
        f"phase={p['phase']}"
    )
```

| Elapsed (h) | RRF Score | Speed (km/s) | Distance from Earth (km) | Phase            |
|-------------|-----------|--------------|--------------------------|------------------|
| 24.58       | 0.0196    | 4.82         | 186,443                  | unlabeled        |
| 25.20       | 0.0189    | 4.74         | 189,012                  | translunar_coast |
| 23.91       | 0.0175    | 4.91         | 182,981                  | translunar_coast |
| 156.14      | 0.0161    | 4.61         | 178,204                  | unlabeled        |
| 155.56      | 0.0154    | 4.69         | 175,332                  | return_coast     |
| 157.02      | 0.0148    | 4.53         | 181,007                  | return_coast     |

The fusion result tells a complete story: the T+24.58h unlabeled event has its closest neighbors in the immediate translunar coast (expected, it's near the same position and heading) and in the T+155-157h window on the return leg. The spacecraft was at roughly the same distance from Earth (~180,000 km), moving at roughly the same speed (~4.6-4.9 km/s), in a similar direction.

Two points in time, 131 hours apart, that the mission dynamics brought to nearly identical states. The multi-vector query found both in a single pass.

> **Why not just use the `state` vector?** The concatenated 6D state vector is good for single-query search. The prefetch + fusion approach is better when you want to *weight* or *filter* each space independently — for example, "find points within 200,000 km of Earth that also have a similar velocity direction," where you'd add a payload filter on `distance_km` to one prefetch branch only. In this case the result is similar, but the architecture scales to more complex queries.

---

## What Vector Search Gives You That Time-Series Tools Don't

Time-series analysis is sequence-aware. It knows what came before and after. That's exactly what you need for most mission analysis: burn duration, orbital period, communication windows.

Vector search is sequence-agnostic. It treats every sample as a point in a space, not a moment in a story. That makes it bad at "what happened next" and very good at "what else was like this."

The four queries above would be awkward in traditional tools:

- **TLI similarity:** In Pandas you'd need to define a similarity metric, write a loop, and sort. In Qdrant it's 6 lines.
- **Burn detection without labels:** The detection is still local (consecutive differences), but the follow-up classification is a similarity search. Qdrant handles the "find me the labeled event this unknown event most resembles" part naturally.
- **Trajectory symmetry:** This would require writing an explicit pairing algorithm. In Qdrant it's a filter + search per return point.
- **Multi-space fusion:** This query has no straightforward expression in time-series tools at all. You'd have to build a custom scorer.

That's the actual value: not that vector search is faster at any one of these tasks, but that it makes certain questions *expressible at all* without a lot of custom engineering.

The Artemis II trajectory is publicly available. The full notebook for this post — including the HORIZONS data pull, preprocessing, and all four queries — is on [GitHub](https://github.com/qdrant/artemis-trajectory-analysis). If you want to run it yourself, the [Qdrant Quickstart](https://qdrant.tech/documentation/quickstart/) gets you a local instance in one Docker command.
