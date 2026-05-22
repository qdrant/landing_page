---
title: Security
short_description: "Harden self-hosted Qdrant with API keys, network binding, TLS encryption, and JWT-based access control."
description: "Secure a Qdrant instance with API key authentication, network binding, TLS encryption, and fine-grained JWT-based access control for production use."
partition: deploy
weight: 145
aliases:
  - /documentation/security
  - /documentation/operations/security
---

# Security & Access Control

Securing a Qdrant deployment means controlling who can access your data, encrypting traffic, and keeping an audit trail for compliance. To secure your deployments, Qdrant supports [API key authentication](#authentication) (including [read-only API keys](#read-only-api-key) for query-only consumers and [granular access API keys](#granular-access-api-keys) with per-collection read/write scoping), [network binding](#network-bind), [TLS](#tls) for encrypted connections, and [audit logging](#audit-logging) for compliance. On Qdrant Cloud, these features are enabled by default. On self-hosted open source deployments, they must be explicitly configured before going to production.

## Secure Your Instance

<aside role="alert">Self-hosted open source deployments are <b>not</b> secure by default and are <b>not</b> production-ready. Qdrant Cloud deployments are always secure and production-ready.</aside>

By default, all self-deployed Qdrant instances are not secure. They are open to
all network interfaces and do not have any kind of authentication configured. They
may be open to everybody on the internet without any restrictions. You must
therefore take security measures to make your instance production-ready.
Please read this section carefully for instructions on how to secure
your instance.

Qdrant Cloud deployments are always secure by default. Refer to
[Authentication](/documentation/cloud/authentication/) and [Client IP
Restrictions](/documentation/cloud/configure-cluster/#client-ip-restrictions).

To properly secure your own instance, we strongly recommend taking the following steps:

1. [Authentication](#authentication): Set up an API key to prevent unauthorized access.  
1. [Audit Logging](#audit-logging): Record all API operations to a log file for compliance and forensics.
1. [Network Bind](#network-bind): Bind to a specific network interface or IP address.  
   When developing locally, bind to `127.0.0.1` to prevent all external access.
   When deploying to production, bind to a private network interface or IP.
1. [TLS](#tls): Encrypt traffic everywhere using TLS.

## Authentication

By default, an open source Qdrant deployment accepts requests from anyone who can reach it. To secure your instance, enable API key authentication. On Qdrant Cloud, API key authentication is enabled by default.

Qdrant supports three types of API key:

- **[Admin API Key](#admin-api-key)**: Grants full access to all operations and collections.
- **[Read-Only API Key](#read-only-api-key)**: Grants read-only access to all operations and collections. This key can be used for services or users that only need to query data.
- **[Granular Access API Keys](#granular-access-api-keys)**: For more granular access control, you can use API keys that specify read or write permissions on individual collections.

### Authenticate with an API Key

To authenticate with an API key, whether it's an admin key, read-only key, or granular access token, provide it in the `api-key` request header:

{{< code-snippet path="/documentation/headless/snippets/authentication/api-key/" >}}

Alternatively, use the `Authorization: Bearer` header:

{{< code-snippet path="/documentation/headless/snippets/authentication/bearer/" >}}

### Admin API Key

*Available as of v1.2.0*

The admin API key is the primary key that grants full access to all operations and collections. It is configured with the `api_key` setting in the configuration file.

```yaml
service:
  # Set an api-key.
  # If set, all requests must include a header with the api-key.
  # example header: `api-key: <API-KEY>`
  #
  # If you enable this you should also enable TLS.
  # (Either above or via an external service like nginx.)
  # Sending an api-key over an unencrypted channel is insecure.
  api_key: your_secret_api_key_here
```

Or alternatively, you can use the `QDRANT__SERVICE__API_KEY` environment variable:

```bash
docker run -p 6333:6333 \
    -e QDRANT__SERVICE__API_KEY=your_secret_api_key_here \
    qdrant/qdrant
```

<aside role="alert"><a href="#tls">TLS</a> must be used to prevent leaking the API key over an unencrypted connection.</aside>

For using API key based authentication on Qdrant Cloud, see the Cloud
[Authentication](/documentation/cloud/authentication/)
section.


<aside role="alert">Internal communication channels are <strong>never</strong> protected by an API key nor bearer tokens. Internal gRPC uses port 6335 by default if running in distributed mode. You must ensure that this port is not publicly reachable and can only be used for node communication. By default, this setting is disabled for Qdrant Cloud and the Qdrant Helm chart.</aside>

#### Rotate an Admin API Key

*Available as of v1.17.0*

In a distributed deployment, you can rotate an admin API key without downtime. Use the `alt_api_key` setting to temporarily configure a second API key that acts identically to the primary `api_key`, allowing both the old and new API keys to be active at the same time.

```yaml
service:
  api_key: your_current_api_key_here
  alt_api_key: your_new_api_key_here
```

To rotate an API key without downtime:

1. Configure each peer with the new key set as `alt_api_key`. Restart only one peer at a time to avoid downtime (rolling restart). During the rotation window, requests authenticated with either key are accepted.
2. Switch clients to the new key.
3. Perform another rolling restart of the peers, promoting the new key to `api_key` and removing `alt_api_key`.

<aside role="alert">JWT tokens are tied to the key they were signed with and are <strong>not</strong> automatically migrated. They must be re-created after switching to the new key.</aside>

### Read-Only API Key

*Available as of v1.7.0*

Qdrant also supports a read-only API key.
This key can be used to access read-only operations on the instance.

```yaml
service:
  read_only_api_key: your_secret_read_only_api_key_here
```

Or with the environment variable:

```bash
export QDRANT__SERVICE__READ_ONLY_API_KEY=your_secret_read_only_api_key_here
```

Admin and read-only API keys can be used simultaneously.

### Granular Access API Keys

*Available as of v1.9.0*

Granular access API keys let you assign read or write permissions on individual collections, enabling [Role-based access control (RBAC)](https://en.wikipedia.org/wiki/Role-based_access_control). They're built on the [JSON Web Tokens (JWT)](https://jwt.io/) standard.

On Qdrant Cloud, granular access API key authentication is enabled by default. To enable granular access API key authentication on open source Qdrant instances, specify an `api-key` and enable the `jwt_rbac` feature in the configuration:

```yaml
service:
  api_key: you_secret_api_key_here
  jwt_rbac: true
```

Or with environment variables:

```bash
export QDRANT__SERVICE__API_KEY=your_secret_api_key_here
export QDRANT__SERVICE__JWT_RBAC=true
```

The `api_key` you set in the configuration will be used to encode and decode the JWTs, so –needless to say– keep it secure. If your `api_key` changes, all existing tokens will be invalid.

#### Generating JSON Web Tokens

JWTs can be generated with the admin API key. You can use any of the existing libraries and tools to generate tokens. You can also use the Qdrant Web UI to generate JWTs by selecting **Access Tokens**.

- **JWT Header** - Qdrant uses the `HS256` algorithm to decode the tokens.

  ```json
  {
    "alg": "HS256",
    "typ": "JWT"
  }
  ```

- **JWT Payload** - You can include any combination of the [available parameters](#jwt-configuration) in the payload.

  ```json
  {
    "exp": 1640995200, // Expiration time
    "value_exists": ..., // Validate this token by looking for a point with a payload value
    "access": "r", // Define the access level.
  }
  ```

**Signing the token** - To confirm that the generated token is valid, it needs to be signed with the `api_key` set in the configuration.
This means that someone who knows the admin API key can authorize the new token for use with the Qdrant instance.
Qdrant can validate the signature because it knows the admin API key and can decode the token.

The process of token generation can be done on the client side offline and doesn't require any communication with the Qdrant instance.

Here is an example of libraries that can be used to generate JWT tokens:

- Python: [PyJWT](https://pyjwt.readthedocs.io/en/stable/)
- JavaScript: [jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
- Rust: [jsonwebtoken](https://crates.io/crates/jsonwebtoken)
- CLI: [jwt-cli](https://github.com/mike-engel/jwt-cli)

Here is an example using `jwt-cli`:

```bash
jwt encode --payload '{
  "access": "r",
  "exp": 1766055305
}' --secret 'your-api-key'
```

#### JWT Configuration

These are the available options, or **claims** in the JWT lingo. You can use them in the JWT payload to define its functionality.

- **`exp`** - The expiration time of the token. This is a Unix timestamp in seconds. The token will be invalid after this time. The check for this claim includes a 30-second leeway to account for clock skew.

  ```json
  {
    "exp": 1640995200, // Expiration time
  }
  ```

- **`value_exists`** - This is a claim that can be used to validate the token against the data stored in a collection. The structure of this claim is as follows:

  ```json
  {
    "value_exists": {
      "collection": "my_validation_collection",
      "matches": [
        { "key": "my_key", "value": "value_that_must_exist" }
      ],
    },
  }
  ```

  If this claim is present, Qdrant will check if there is a point in the collection with the specified key-values. If such a point exists, the token is valid.

  This claim is especially useful if you want to have an ability to revoke tokens without changing the `api_key`.
  Consider a case where you have a collection of users, and you want to revoke access to a specific user.

  ```json
  {
    "value_exists": {
      "collection": "users",
      "matches": [
        { "key": "user_id", "value": "andrey" },
        { "key": "role", "value": "manager" }
      ],
    },
  }
  ```

  You can create a token with this claim, and when you want to revoke access, you can change the `role` of the user to something else, and the token will become invalid.

- **`access`** - This claim defines the [access level](#table-of-access) of the token. If this claim is present, Qdrant will check if the token has the required access level to perform the operation. If this claim is **not** present, **manage** access is assumed.

  It can provide global access with `r` for read-only, or `m` for manage. For example:

  ```json
  {
    "access": "r"
  }
  ```

  It can also be specific to one or more collections. The `access` level for each collection is `r` for read-only, or `rw` for read-write, like this:

  ```json
  {
    "access": [
      {
        "collection": "my_collection",
        "access": "rw"
      }
    ]
  }
  ```

### Table of Access

Check out this table to see which actions are allowed or denied based on the access level.

This is also applicable to using api keys instead of tokens. In that case, `api_key` maps to **manage**, while `read_only_api_key` maps to **read-only**.

<div style="text-align: right"> <strong>Symbols:</strong> ✅ Allowed | ❌ Denied | 🟡 Allowed, but filtered </div>

| Action | manage | read-only | collection read-write | collection read-only |
|--------|--------|-----------|----------------------|-----------------------|
| list collections | ✅ | ✅ | 🟡 | 🟡 |
| get collection info | ✅ | ✅ | ✅ | ✅ |
| create collection | ✅ | ❌ | ❌ | ❌ |
| delete collection | ✅ | ❌ | ❌ | ❌ |
| update collection params | ✅ | ❌ | ❌ | ❌ |
| get collection cluster info | ✅ | ✅ | ✅ | ✅ |
| collection exists | ✅ | ✅ | ✅ | ✅ |
| update collection cluster setup | ✅ | ❌ | ❌ | ❌ |
| update aliases | ✅ | ❌ | ❌ | ❌ |
| list collection aliases | ✅ | ✅ | 🟡 | 🟡 |
| list aliases | ✅ | ✅ | 🟡 | 🟡 |
| create shard key | ✅ | ❌ | ❌ | ❌ |
| delete shard key | ✅ | ❌ | ❌ | ❌ |
| create payload index | ✅ | ❌ | ✅ | ❌ |
| delete payload index | ✅ | ❌ | ✅ | ❌ |
| list collection snapshots | ✅ | ✅ | ✅ | ✅ |
| create collection snapshot | ✅ | ❌ | ✅ | ❌ |
| delete collection snapshot | ✅ | ❌ | ✅ | ❌ |
| download collection snapshot | ✅ | ✅ | ✅ | ✅ |
| upload collection snapshot | ✅ | ❌ | ❌ | ❌ |
| recover collection snapshot | ✅ | ❌ | ❌ | ❌ |
| list shard snapshots | ✅ | ✅ | ✅ | ✅ |
| create shard snapshot | ✅ | ❌ | ✅ | ❌ |
| delete shard snapshot | ✅ | ❌ | ✅ | ❌ |
| download shard snapshot | ✅ | ✅ | ✅ | ✅ |
| upload shard snapshot | ✅ | ❌ | ❌ | ❌ |
| recover shard snapshot | ✅ | ❌ | ❌ | ❌ |
| list full snapshots | ✅ | ✅ | ❌ | ❌ |
| create full snapshot | ✅ | ❌ | ❌ | ❌ |
| delete full snapshot | ✅ | ❌ | ❌ | ❌ |
| download full snapshot | ✅ | ✅ | ❌ | ❌ |
| get cluster info | ✅ | ✅ | ❌ | ❌ |
| recover raft state | ✅ | ❌ | ❌ | ❌ |
| delete peer | ✅ | ❌ | ❌ | ❌ |
| get point | ✅ | ✅ | ✅ | ✅ |
| get points | ✅ | ✅ | ✅ | ✅ |
| upsert points | ✅ | ❌ | ✅ | ❌ |
| update points batch | ✅ | ❌ | ✅ | ❌ |
| delete points | ✅ | ❌ | ✅ | ❌ | ❌ /
| update vectors | ✅ | ❌ | ✅ | ❌ |
| delete vectors | ✅ | ❌ | ✅ | ❌ | ❌ /
| set payload | ✅ | ❌ | ✅ | ❌ |
| overwrite payload | ✅ | ❌ | ✅ | ❌ |
| delete payload | ✅ | ❌ | ✅ | ❌ |
| clear payload | ✅ | ❌ | ✅ | ❌ |
| scroll points | ✅ | ✅ | ✅ | ✅ |
| query points | ✅ | ✅ | ✅ | ✅ |
| search points | ✅ | ✅ | ✅ | ✅ |
| search groups | ✅ | ✅ | ✅ | ✅ |
| recommend points | ✅ | ✅ | ✅ | ✅ |
| recommend groups | ✅ | ✅ | ✅ | ✅ |
| discover points | ✅ | ✅ | ✅ | ✅ |
| count points | ✅ | ✅ | ✅ | ✅ |
| version | ✅ | ✅ | ✅ | ✅ |
| readyz, healthz, livez | ✅ | ✅ | ✅ | ✅ |
| telemetry | ✅ | ✅ | ❌ | ❌ |
| metrics | ✅ | ✅ | ❌ | ❌ |

## Audit Logging

*Available as of v1.17.0* 

Audit logging records all API operations that require authentication or authorization, and writes them to a log file in JSON format.

Audit logging is not enabled by default. To enable it, use the following configuration options:

```yaml
audit:
  enabled: false
  dir: ./storage/audit
  rotation: daily
  max_log_files: 7
  # Only enable when Qdrant is behind a trusted reverse proxy or load balancer.
  # When true, the client IP is taken from the X-Forwarded-For header instead of
  # the TCP connection. Enabling this on a publicly reachable instance allows
  # clients to spoof their IP address in audit logs.
  trust_forwarded_headers: false
```

By default, audit logs are rotated daily, and the seven most recent log files are kept. To configure hourly rotation, set `rotation` to `hourly`. When the number of log files exceeds `max_log_files`, the oldest log file is deleted.

<aside role="alert">Audit logging is verbose and audit logs can grow in size rapidly. Ensure that you have sufficient disk space.</aside>

### Tracing IDs

*Available as of v1.18.0*

You can attach a tracing ID to individual requests. When audit logging is enabled, Qdrant includes the tracing ID in the audit log entry, enabling the correlation of client-side operations with their corresponding log entries.

Qdrant reads the tracing ID from the first matching header in the following order: `x-request-id`, `x-tracing-id`, `traceparent`. Tracing IDs longer than 256 characters are truncated.

{{< code-snippet path="/documentation/headless/snippets/audit-tracing-id/simple/" >}}

### Query Audit Logs

*Available as of v1.18.0*

The audit log can be queried via the `/audit/logs` API (requires [manage-level access](#table-of-access)). For example:

{{< code-snippet path="/documentation/headless/snippets/audit-logging/query/" >}}

By default, the API returns the 100 most recent entries, but you can change this number with the `limit` parameter (max 10,000).

In a distributed cluster, the API aggregates results from all nodes before returning them. An optional `timeout` (seconds) query parameter controls how long to wait for remote peers in a cluster.

Entries are returned in reverse-chronological order (newest first). Each entry has the following fields:

| Field | Type | Description |
|---|---|---|
| `timestamp` | ISO-8601 | When the access check occurred. |
| `method` | string | API method name, for example `upsert_points`, `search_points`. |
| `auth_type` | `"Jwt"` \| `"ApiKey"` \| `"None"` | How the request was authenticated. |
| `result` | `"ok"` \| `"denied"` | Whether access was granted. |
| `subject` | string | JWT `sub` claim. Only present for JWT-authenticated requests. |
| `remote` | string | Client IP address, if available. |
| `collection` | string | Collection name, for collection-scoped operations. |
| `tracing_id` | string | Value of the `x-request-id`, `x-tracing-id`, or `traceparent` request header. |
| `error` | string | Reason access was denied. Only present when `result` is `"denied"`. |

#### Narrowing Results with Time Ranges and Filters

To narrow results to a specific time range, use the `time_from` (inclusive) and `time_to` (exclusive) parameters.

The `filters` parameter enables exact-match filtering of entries based on specific field values. The parameter accepts a dictionary of field-value pairs. When specifying more than one pair, only entries that match all specified criteria are returned (logical AND).

Unknown filter fields silently return no matches. Filter field names are case-sensitive: filtering on a field name with incorrect casing silently returns no matches.

You can filter on any field in the entry fields table except `timestamp`. Use `time_from` and `time_to` for time-range filtering instead.

For example, to retrieve the 50 most recent denied requests to the `my_collection` collection on March 26, 2026:

{{< code-snippet path="/documentation/headless/snippets/audit-logging/query-with-filters/" >}}

## Network Bind

By default, a custom Qdrant deployment binds to all network interfaces. Your
instance may be open to everybody on the internet. On a local development
machine you likely have a firewall in place to prevent public access, but that
may not be the case on a public VPS or dedicated server.

It is highly recommended to bind to a specific interface or IP address to
prevent unwanted access:

- when developing locally, bind to `127.0.0.1` so no external access is possible
- or, when deploying to production, bind to a private network interface or IP

When using Docker, you may use the publish flag to bind to a specific interface.
For example:

```bash
docker run -p 127.0.0.1:6333:6333 qdrant/qdrant
```

If using another type of deployment you may configure the bind address in Qdrant
itself. Either set `service.host: 127.0.0.1` in the configuration, or use an
environment variable like this:

```bash
QDRANT__SERVICE__HOST=127.0.0.1 ./qdrant
```

Managed Qdrant Cloud deployments are always secure by default. They are publicly
accessible and bound to the endpoint that is assigned to the cluster. You may
configure authentication with [API keys](/documentation/cloud/authentication/),
and restrict access to specific IP addresses through [Client IP
Restrictions](/documentation/cloud/configure-cluster/#client-ip-restrictions).
[Hybrid Cloud](/documentation/hybrid-cloud/networking-logging-monitoring/) and
[Private
Cloud](/documentation/private-cloud/qdrant-cluster-management/#exposing-a-cluster)
deployments have their own kind of configuration.

## TLS

*Available as of v1.2.0*

TLS for encrypted connections can be enabled on your Qdrant instance to secure
connections.

<aside role="alert">Connections are unencrypted by default. This allows sniffing and <a href="https://en.wikipedia.org/wiki/Man-in-the-middle_attack">MitM</a> attacks.</aside>

First make sure you have a certificate and private key for TLS, usually in
`.pem` format. On your local machine you may use
[mkcert](https://github.com/FiloSottile/mkcert#readme) to generate a self signed
certificate.

To enable TLS, set the following properties in the Qdrant configuration with the
correct paths and restart:

```yaml
service:
  # Enable HTTPS for the REST and gRPC API
  enable_tls: true

# TLS configuration.
# Required if either service.enable_tls or cluster.p2p.enable_tls is true.
tls:
  # Server certificate chain file
  cert: ./tls/cert.pem

  # Server private key file
  key: ./tls/key.pem
```

For internal communication when running cluster mode, TLS can be enabled with:

```yaml
cluster:
  # Configuration of the inter-cluster communication
  p2p:
    # Use TLS for communication between peers
    enable_tls: true
```

With TLS enabled, you must start using HTTPS connections. For example:

```bash
curl -X GET https://localhost:6333
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://localhost:6333",
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({ url: "https://localhost", port: 6333 });
```

```rust
use qdrant_client::Qdrant;

let client = Qdrant::from_url("http://localhost:6334").build()?;
```

Certificate rotation is enabled with a default refresh time of one hour. This
reloads certificate files every hour while Qdrant is running. This way changed
certificates are picked up when they get updated externally. The refresh time
can be tuned by changing the `tls.cert_ttl` setting. You can leave this on, even
if you don't plan to update your certificates. Currently this is only supported
for the REST API.

Optionally, you can enable client certificate validation on the server against a
local certificate authority. Set the following properties and restart:

```yaml
service:
  # Check user HTTPS client certificate against CA file specified in tls config
  verify_https_client_certificate: false

# TLS configuration.
# Required if either service.enable_tls or cluster.p2p.enable_tls is true.
tls:
  # Certificate authority certificate file.
  # This certificate will be used to validate the certificates
  # presented by other nodes during inter-cluster communication.
  #
  # If verify_https_client_certificate is true, it will verify
  # HTTPS client certificate
  #
  # Required if cluster.p2p.enable_tls is true.
  ca_cert: ./tls/cacert.pem
```

## Hardening

We recommend reducing the amount of permissions granted to Qdrant containers so that you can reduce the risk of exploitation. Here are some ways to reduce the permissions of a Qdrant container:

* Run Qdrant as a non-root user. This can help mitigate the risk of future container breakout vulnerabilities. Qdrant does not need the privileges of the root user for any purpose.
  - You can use the image `qdrant/qdrant:<version>-unprivileged` instead of the default Qdrant image.
  - You can use the flag `--user=1000:2000` when running [`docker run`](https://docs.docker.com/reference/cli/docker/container/run/).
  - You can set [`user: 1000`](https://docs.docker.com/compose/compose-file/05-services/#user) when using Docker Compose.
  - You can set [`runAsUser: 1000`](https://kubernetes.io/docs/tasks/configure-pod-container/security-context) when running in Kubernetes (our [Helm chart](https://github.com/qdrant/qdrant-helm) does this by default).

* Run Qdrant with a read-only root filesystem. This can help mitigate vulnerabilities that require the ability to modify system files, which is a permission Qdrant does not need. As long as the container uses mounted volumes for storage (`/qdrant/storage` and `/qdrant/snapshots` by default), Qdrant can continue to operate while being prevented from writing data outside of those volumes.
  - You can use the flag `--read-only` when running [`docker run`](https://docs.docker.com/reference/cli/docker/container/run/).
  - You can set [`read_only: true`](https://docs.docker.com/compose/compose-file/05-services/#read_only) when using Docker Compose.
  - You can set [`readOnlyRootFilesystem: true`](https://kubernetes.io/docs/tasks/configure-pod-container/security-context) when running in Kubernetes (our [Helm chart](https://github.com/qdrant/qdrant-helm) does this by default).

* Block Qdrant's external network access. This can help mitigate [server side request forgery attacks](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery), like via the [snapshot recovery API](https://api.qdrant.tech/api-reference/snapshots/recover-from-snapshot). Single-node Qdrant clusters do not require any outbound network access. Multi-node Qdrant clusters only need the ability to connect to other Qdrant nodes via TCP ports 6333, 6334, and 6335.
  - You can use [`docker network create --internal <name>`](https://docs.docker.com/reference/cli/docker/network/create/#internal) and use that network when running [`docker run --network <name>`](https://docs.docker.com/reference/cli/docker/container/run/#network).
  - You can create an [internal network](https://docs.docker.com/compose/compose-file/06-networks/#internal) when using Docker Compose.
  - You can create a [NetworkPolicy](https://kubernetes.io/docs/concepts/services-networking/network-policies/) when using Kubernetes. Note that multi-node Qdrant clusters [will also need access to cluster DNS in Kubernetes](https://github.com/ahmetb/kubernetes-network-policy-recipes/blob/master/11-deny-egress-traffic-from-an-application.md#allowing-dns-traffic).

There are other techniques for reducing the permissions such as dropping [Linux capabilities](https://www.man7.org/linux/man-pages/man7/capabilities.7.html) depending on your deployment method, but the methods mentioned above are the most important.
