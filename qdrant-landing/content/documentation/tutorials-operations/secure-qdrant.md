---
title: Secure a Self-Hosted Qdrant Instance
short_description: "Progressively harden a self-hosted Qdrant deployment with TLS, an Admin API key, a Read-Only key, and JWT-based Granular Access Control."
description: "Tutorial: secure a self-hosted Qdrant instance step by step — enable TLS, set up an Admin API key, restrict consumers with a Read-Only key, and issue collection-scoped JWT tokens using the Web UI."
weight: 45
---

# Secure a Self-Hosted Qdrant Instance

| Time: 45 min | Level: Intermediate |
| --- | ----------- |

Lock down your instance before connecting it to any network. By default, self-hosted Qdrant runs with no authentication and no encryption — every interface on the host is reachable without a key or password. This tutorial walks through five layers of protection, validating each one before moving to the next.

<aside role="alert">Qdrant Cloud deployments are always secure by default. This tutorial covers <strong>self-hosted Docker deployments only</strong>.</aside>

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- `curl` available in your terminal
- [mkcert](https://github.com/FiloSottile/mkcert#readme) for generating a local self-signed certificate (Step 2)

---

## Step 1 — Start an Unsecured Instance

Start Qdrant using the [standard Docker Compose setup](/documentation/installation/#docker-compose). Create a `docker-compose.yml` file:

```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant_storage:/qdrant/storage:z

volumes:
  qdrant_storage:
```

Start the instance:

```bash
docker compose up -d
```

Confirm that no credentials are required:

```bash
curl http://localhost:6333
```

Expected response:

```json
{"title":"qdrant - vector search engine","version":"...","commit":"..."}
```

<aside role="status">No <code>api-key</code> header was required. Anyone who can reach this port can read, write, or delete all data.</aside>

---

## Step 2 — Enable TLS

Unencrypted connections allow anyone on the network to read your API key and data in transit. Enable TLS to encrypt all traffic.

Generate a locally trusted certificate with mkcert:

```bash
mkcert -install
mkdir tls && mkcert -cert-file tls/cert.pem -key-file tls/key.pem localhost 127.0.0.1
```

`mkcert -install` adds a local certificate authority to your system trust store, so `curl` and your browser will accept the certificate without extra flags.

Update `docker-compose.yml` to mount the certificate and enable TLS:

```yaml
services:
  qdrant:
    image: qdrant/qdrant
    ports:
      - "6333:6333"
      - "6334:6334"
    environment:
      QDRANT__SERVICE__ENABLE_TLS: "true"
      QDRANT__TLS__CERT: /qdrant/tls/cert.pem
      QDRANT__TLS__KEY: /qdrant/tls/key.pem
    volumes:
      - ./tls:/qdrant/tls:ro
      - qdrant_storage:/qdrant/storage:z

volumes:
  qdrant_storage:
```

Restart:

```bash
docker compose down && docker compose up -d
```

Verify that HTTPS works and HTTP no longer does:

```bash
curl https://localhost:6333
# Expected: {"title":"qdrant - vector search engine","version":"..."}

curl http://localhost:6333
# Expected: curl: (52) Empty reply from server
```

See [Security > TLS](/documentation/security/#tls) for more TLS configuration options.

---

## Step 3 — Enable an Admin API Key

Without an API key, any authenticated TLS connection can still read, write, or delete everything. Set an Admin API key to require credentials on every request.

Add the API key to `docker-compose.yml`:

```yaml
    environment:
      QDRANT__SERVICE__ENABLE_TLS: "true"
      QDRANT__TLS__CERT: /qdrant/tls/cert.pem
      QDRANT__TLS__KEY: /qdrant/tls/key.pem
      QDRANT__SERVICE__API_KEY: "my-admin-key"
```

Restart:

```bash
docker compose down && docker compose up -d
```

Verify that unauthenticated requests are now rejected:

```bash
curl https://localhost:6333/collections
# Expected: {"status":{"error":"Unauthorized"},"time":0.0}
```

Next, confirm the same behaviour from the SDK. Ingesting a point without an API key is blocked:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-no-auth" >}}

With the Admin API key, the request succeeds:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-admin-key" >}}

See [Security > Authentication](/documentation/security/#authentication) for additional configuration options, including API key rotation.

---

## Step 4 — Enable a Read-Only API Key

Issue a separate Read-Only API key for services that only need to query data. With this key active, callers can search and read but cannot upsert, delete, or modify collections.

Add the Read-Only key to `docker-compose.yml`:

```yaml
    environment:
      QDRANT__SERVICE__ENABLE_TLS: "true"
      QDRANT__TLS__CERT: /qdrant/tls/cert.pem
      QDRANT__TLS__KEY: /qdrant/tls/key.pem
      QDRANT__SERVICE__API_KEY: "my-admin-key"
      QDRANT__SERVICE__READ_ONLY_API_KEY: "my-read-only-key"
```

Restart:

```bash
docker compose down && docker compose up -d
```

Verify that a delete attempt with the Read-Only key is rejected:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="delete-read-only-key" >}}

Or with curl:

```bash
curl -X DELETE https://localhost:6333/collections/my_collection/points \
  -H "api-key: my-read-only-key" \
  -H "Content-Type: application/json" \
  -d '{"points": [1]}'
# Expected: {"status":{"error":"Forbidden"},"time":0.0}
```

Reads still succeed with the Read-Only key:

```bash
curl https://localhost:6333/collections/my_collection \
  -H "api-key: my-read-only-key"
# Expected: {"result":{...},"status":"ok","time":0.0}
```

Both keys can be used simultaneously. See [Security > Read-Only API Key](/documentation/security/#read-only-api-key).

---

## Step 5 — Set Up Granular Access API Keys (JWT)

The Admin and Read-Only keys apply globally. For finer control — for example, read-write access to one collection and read-only access to another — use Granular Access API Keys (JWT).

Enable JWT RBAC in `docker-compose.yml`:

```yaml
    environment:
      QDRANT__SERVICE__ENABLE_TLS: "true"
      QDRANT__TLS__CERT: /qdrant/tls/cert.pem
      QDRANT__TLS__KEY: /qdrant/tls/key.pem
      QDRANT__SERVICE__API_KEY: "my-admin-key"
      QDRANT__SERVICE__READ_ONLY_API_KEY: "my-read-only-key"
      QDRANT__SERVICE__JWT_RBAC: "true"
```

Restart:

```bash
docker compose down && docker compose up -d
```

Create a second collection using the Admin key:

```bash
curl -X PUT https://localhost:6333/collections/other_collection \
  -H "api-key: my-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"vectors": {"size": 4, "distance": "Cosine"}}'
```

Generate a JWT in the Web UI:

1. Open `https://localhost:6333/dashboard#/jwt`.
2. In the **Access** field, configure per-collection scopes — read-write on `my_collection`, read-only on `other_collection`:

```json
{
  "access": [
    {"collection": "my_collection", "access": "rw"},
    {"collection": "other_collection", "access": "r"}
  ]
}
```

3. Copy the generated token.

Writing to `my_collection` (rw scope) succeeds:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-jwt-rw-collection" >}}

Writing to `other_collection` (r scope) is blocked:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-jwt-ro-collection" >}}

Or with curl:

```bash
# Write to the rw collection — succeeds
curl -X PUT https://localhost:6333/collections/my_collection/points \
  -H "api-key: <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"points": [{"id": 2, "vector": [0.5, 0.6, 0.7, 0.8]}]}'
# Expected: {"result":{"operation_id":1,"status":"completed"},"status":"ok","time":0.0}

# Write to the read-only collection — blocked
curl -X PUT https://localhost:6333/collections/other_collection/points \
  -H "api-key: <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"points": [{"id": 2, "vector": [0.5, 0.6, 0.7, 0.8]}]}'
# Expected: {"status":{"error":"Forbidden"},"time":0.0}
```

See [Security > Granular Access Control with JWT](/documentation/security/#granular-access-api-keys) for the full list of available JWT claims and the complete access-level table.

---

## What's Next

Your instance now has TLS encryption, API key authentication, a read-only key for query consumers, and collection-scoped JWT tokens. For production deployments, also consider:

- [Network Bind](/documentation/security/#network-bind) — restrict which network interfaces Qdrant listens on.
- [API Key Rotation](/documentation/security/#rotate-an-api-key) — rotate keys in a distributed deployment without downtime.
- [Production Checklist](/documentation/production-checklist/) — a full checklist of security and reliability settings for production.
