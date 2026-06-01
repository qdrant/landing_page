---
title: Secure a Self-Hosted Qdrant Instance
short_description: "Harden a self-hosted Qdrant deployment with TLS, an Admin API key, a Read-Only key, and Granular Access Control."
description: "Tutorial: secure a self-hosted Qdrant instance step by step: enable TLS, set up an Admin API key, restrict consumers with a Read-Only key, and issue collection-scoped JWT tokens."
weight: 45
---

# Secure a Self-Hosted Qdrant Instance

| Time: 45 min | Level: Intermediate |
| --- | ----------- |

Qdrant offers a comprehensive set of [security and access control features](/documentation/security/) that enable you to protect your data and control access at multiple levels. By default, these features are enabled on Qdrant Cloud deployments. However, self-hosted Qdrant deployments default to no authentication and no encryption: every interface on the host is reachable without a key or password. For self-hosted instances, it is crucial to secure your instance before connecting it to any network. 

This tutorial walks through securing a self-hosted Qdrant instance step by step. You will:

- **Enable TLS** to encrypt traffic between clients and your Qdrant instance.
- **Set up an admin API key** to require authentication for all requests.
- **Restrict consumers with a read-only key** to prevent unintended writes.
- **Issue granular access API keys** to scope permissions to specific collections.

> Qdrant Cloud deployments are always secure by default. This tutorial covers self-hosted deployments only. While this tutorial uses Docker Compose, the same security features and configurations apply to any self-hosted deployment method.

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed
- `curl` available in your terminal
- [mkcert](https://github.com/FiloSottile/mkcert#readme) for generating a local self-signed certificate ([installation instructions](https://github.com/FiloSottile/mkcert#installation))
- TLS requires Qdrant 1.2 or later, API key authentication requires Qdrant 1.2 or later, and granular access API keys (JWT) require Qdrant 1.9 or later. This tutorial uses the latest Qdrant image, which includes all these features.

---

## Step 1: Start an Unsecured Instance

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

Confirm that no credentials are required when connecting to the REST API port with `curl`:

```bash
curl http://localhost:6333
```

Expected response:

```json
{"title":"qdrant - vector search engine","version":"...","commit":"..."}
```

<aside role="status">No <code>api-key</code> header was required. Anyone who can reach this port can read, write, or delete all data.</aside>

---

## Step 2: Enable TLS

Unencrypted connections allow anyone on the network to read your API key and data in transit. Enable TLS to encrypt all traffic.

First, add a local certificate authority to your system trust store, so `curl` and your browser will accept the certificate without extra flags.

```bash
mkcert -install
```

Next, generate a locally trusted certificate with mkcert:

```bash
mkdir tls && mkcert -cert-file tls/cert.pem -key-file tls/key.pem localhost 127.0.0.1
```

If you're using the Python or TypeScript clients, set the following environment variables to allow the clients to find the certificate:

```python
export SSL_CERT_FILE=$(mkcert -CAROOT)/rootCA.pem
```
```typescript
export NODE_EXTRA_CA_CERTS=$(mkcert -CAROOT)/rootCA.pem
```

If you're using the Java client, add the certificate to the Java trust store:

```java
keytool -importcert \
  -file $(mkcert -CAROOT)/rootCA.pem \
  -alias mkcert-local \
  -keystore $JAVA_HOME/lib/security/cacerts \
  -storepass changeit -noprompt

```

Next, update `docker-compose.yml` to enable TLS and mount the certificate files:

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

Restart Qdrant to apply the changes:

```bash
docker compose down && docker compose up -d
```

Now, unencrypted HTTP requests are rejected:

```bash
curl http://localhost:6333
```

However, HTTPS requests succeed:

```bash
curl https://localhost:6333
```

Refer to [Security > TLS](/documentation/security/#tls) to learn more about TLS configuration.

---

## Step 3: Enable an Admin API Key

Without enabling authentication, anyone with network access to a Qdrant instance can read, write, or delete all its data. Set an [admin API key](/documentation/security/#authentication) to require credentials on every request.

Set the `QDRANT__SERVICE__API_KEY` environment variable to the API key in `docker-compose.yml`:

```yaml
    environment:
      QDRANT__SERVICE__ENABLE_TLS: "true"
      QDRANT__TLS__CERT: /qdrant/tls/cert.pem
      QDRANT__TLS__KEY: /qdrant/tls/key.pem
      QDRANT__SERVICE__API_KEY: "my-admin-key"
```

Restart Qdrant to apply the changes:

```bash
docker compose down && docker compose up -d
```

Verify that unauthenticated requests are now rejected:

```bash
curl https://localhost:6333/collections
```

The same behavior applies to the clients. Ingesting a point without an API key is blocked:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-no-auth" >}}

With the admin API key, the request succeeds:

```bash
curl -X PUT 'https://localhost:6333/collections/my_collection' \
  -H 'Content-Type: application/json' \
  -H 'api-key: my-admin-key' \
  -d '{
    "vectors": {
      "size": 4,
      "distance": "Cosine"
    }
  }'

curl -X PUT 'https://localhost:6333/collections/my_collection/points' \
  -H 'Content-Type: application/json' \
  -H 'api-key: my-admin-key' \
  -d '{
    "points": [
      {"id": 1, "vector": [0.1, 0.2, 0.3, 0.4]}
    ]
  }'
```

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-admin-key" >}}

Refer to [Security > Authentication](/documentation/security/#authentication) to learn more about admin API keys, including API key rotation.

---

## Step 4: Enable a Read-Only API Key

Issue a separate [read-only API key](/documentation/security/#read-only-api-key) for services that only need to read data. With this key, a client application can search and read but cannot upsert, delete, or modify data.

Set the `QDRANT__SERVICE__READ_ONLY_API_KEY` environment variable to the read-only key in `docker-compose.yml`:

```yaml
    environment:
      QDRANT__SERVICE__ENABLE_TLS: "true"
      QDRANT__TLS__CERT: /qdrant/tls/cert.pem
      QDRANT__TLS__KEY: /qdrant/tls/key.pem
      QDRANT__SERVICE__API_KEY: "my-admin-key"
      QDRANT__SERVICE__READ_ONLY_API_KEY: "my-read-only-key"
```

Restart Qdrant:

```bash
docker compose down && docker compose up -d
```

Verify that a delete attempt with the read-only key is rejected:

```bash
curl -X POST https://localhost:6333/collections/my_collection/points/delete \
  -H "api-key: my-read-only-key" \
  -H "Content-Type: application/json" \
  -d '{"points": [1]}'
```

Or with a client:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="delete-read-only-key" >}}

Reads still succeed with the read-only key:

```bash
curl https://localhost:6333/collections/my_collection \
  -H "api-key: my-read-only-key"
```

Both keys can be used simultaneously. See [Security > Read-Only API Key](/documentation/security/#read-only-api-key).

---

## Step 5: Set Up Granular Access API Keys (JWT)

The admin and read-only keys apply globally. For finer control, use [granular access API Keys](/documentation/security/#granular-access-api-keys) (JSON Web Tokens, JWT). For example, you can use JWT to provide read-write access to one collection and read-only access to another.

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

Create a second collection `other_collection` using the admin API key:

```bash
curl -X PUT https://localhost:6333/collections/other_collection \
  -H "api-key: my-admin-key" \
  -H "Content-Type: application/json" \
  -d '{"vectors": {"size": 4, "distance": "Cosine"}}'
```

Generate a JWT in the Web UI:

1. Open `https://localhost:6333/dashboard#/jwt`.

   If you get a warning about the connection not being private, this is because the certificate is self-signed. If so, restart the browser, and it should recognize the certificate as trusted.
1. Select **Collection Access**.
1. For `my_collection`, select **Read** and **Write**. 
1. For `other_collection`, select **Read** only.
1. Copy the generated JWT Token.

<figure>
  <img src="/documentation/tutorials/secure-qdrant/generate-jwt.png">
  <figcaption>
    Generating a JWT token with the desired access levels using the Web UI.
  </figcaption>
</figure>

> JWT tokens can also be generated programmatically. See [Security > Granular Access API Keys](/documentation/security/#granular-access-api-keys) for a list of libraries that can be used to generate JWT tokens.

Using the JWT token, writing to `my_collection` (`rw` scope) should succeed:

```bash
curl -X PUT https://localhost:6333/collections/my_collection/points \
  -H "api-key: <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"points": [{"id": 2, "vector": [0.5, 0.6, 0.7, 0.8]}]}'
```

With a client too:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-jwt-rw-collection" >}}

However, writing to `other_collection` (`r` scope) is blocked:

```bash
curl -X PUT https://localhost:6333/collections/other_collection/points \
  -H "api-key: <your-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"points": [{"id": 2, "vector": [0.5, 0.6, 0.7, 0.8]}]}'
```

With a client too:

{{< code-snippet path="/documentation/headless/snippets/tutorial-secure-qdrant/" block="upsert-jwt-ro-collection" >}}

See [Security > Granular Access Control with JWT](/documentation/security/#granular-access-api-keys) for the full list of available JWT claims and the complete access-level table.

---

## What's Next

Your instance now has TLS encryption, API key authentication, a read-only key for query consumers, and collection-scoped JWT tokens. For production deployments, also consider:

- [Network Bind](/documentation/security/#network-bind) — restrict which network interfaces Qdrant listens on.
- [API Key Rotation](/documentation/security/#rotate-an-admin-api-key) — rotate admin API keys in a distributed deployment without downtime.
- [Production Checklist](/documentation/production-checklist/) — a full checklist of security and reliability settings for production.
