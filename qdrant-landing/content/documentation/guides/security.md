---
title: Security
weight: 165
aliases:
  - ../security
---

# Security

Please read this page carefully. Although there are various ways to secure your Qdrant instances, **they are unsecured by default**.
You need to enable security measures before production use. Otherwise, they are completely open to anyone

## Authentication

*Available as of v1.2.0*

Qdrant supports a simple form of client authentication using a static API key.
This can be used to secure your instance.

To enable API key based authentication in your own Qdrant instance you must
specify a key in the configuration:

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

Or alternatively, you can use the environment variable:

```bash
export QDRANT__SERVICE__API_KEY=your_secret_api_key_here
```

<aside role="alert"><a href="#tls">TLS</a> must be used to prevent leaking the API key over an unencrypted connection.</aside>

For using API key based authentication in Qdrant Cloud see the cloud
[Authentication](/documentation/cloud/authentication/)
section.

The API key then needs to be present in all REST or gRPC requests to your instance.
All official Qdrant clients for Python, Go, Rust, .NET and Java support the API key parameter.

<!---
Examples with clients
-->

```bash
curl \
  -X GET https://localhost:6333 \
  --header 'api-key: your_secret_api_key_here'
```

```python
from qdrant_client import QdrantClient

client = QdrantClient(
    url="https://localhost:6333",
    api_key="your_secret_api_key_here",
)
```

```typescript
import { QdrantClient } from "@qdrant/js-client-rest";

const client = new QdrantClient({
  url: "http://localhost",
  port: 6333,
  apiKey: "your_secret_api_key_here",
});
```

```rust
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io:6334")
        .with_api_key("<paste-your-api-key-here>")
        .build()?;
```

```java
import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;

QdrantClient client =
    new QdrantClient(
        QdrantGrpcClient.newBuilder(
                "xyz-example.eu-central.aws.cloud.qdrant.io",
                6334,
                true)
            .withApiKey("<paste-your-api-key-here>")
            .build());
```

```csharp
using Qdrant.Client;

var client = new QdrantClient(
  host: "xyz-example.eu-central.aws.cloud.qdrant.io",
  https: true,
  apiKey: "<paste-your-api-key-here>"
);
```

<aside role="alert">Internal communication channels are <strong>never</strong> protected by an API key nor bearer tokens. Internal gRPC uses port 6335 by default if running in distributed mode. You must ensure that this port is not publicly reachable and can only be used for node communication. By default, this setting is disabled for Qdrant Cloud and the Qdrant Helm chart.</aside>

### Read-only API key

*Available as of v1.7.0*

In addition to the regular API key, Qdrant also supports a read-only API key.
This key can be used to access read-only operations on the instance.

```yaml
service:
  read_only_api_key: your_secret_read_only_api_key_here
```

Or with the environment variable:

```bash
export QDRANT__SERVICE__READ_ONLY_API_KEY=your_secret_read_only_api_key_here
```

Both API keys can be used simultaneously.

### Granular access control with JWT

*Available as of v1.9.0*

For more complex cases, Qdrant supports granular access control with [JSON Web Tokens (JWT)](https://jwt.io/). This allows you to have Role-Based Access Control (RBAC) integrated into the system. In this way, you can define roles and permissions for users and restrict access to sensitive endpoints.

To enable JWT based authentication in your own Qdrant instance you need to specify the `api-key` and enable the `jwt_rbac` feature in the configuration:

```yaml
service:
  api_key: you_secret_api_key_here
  jwt_rbac: true
```

Or with the environment variables:

```bash
export QDRANT__SERVICE__API_KEY=your_secret_api_key_here 
export QDRANT__SERVICE__JWT_RBAC=true
```

The `api_key` you set will be used to encode and decode the JWT tokens, so –needless to say– keep it secure.

To use JWT-based authentication, you need to provide it as a bearer token in the `Authorization` header of your requests.
```json
{ "Authorization": "Bearer <JWT>" }
```

The token should be signed with the `api_key` you set in the configuration.

#### Generating JSON Web Tokens

Anyone who knows the `api_key` can generate JWT tokens.

- **JWT Header** - Qdrant uses the `HS256` algorithm to decode the tokens.

  ```json
  {
    "alg": "HS256",
    "typ": "JWT"
  }
  ```

- **JWT Payload** - There are some [claims available](#jwt-payload-claims) to use in the payload. Keep reading for more info on each one.

  ```json
  {
    "exp": 1640995200, // Expiration time
    "value_exists": ..., // Validate this token by looking for a payload value
    "access": "r", // Define the access level.
  }
  ```

- **JWT Signature** - The signature is generated by encoding the header and payload with the `api_key` using the `HS256` algorithm.

  ```
  HMACSHA256(
    base64UrlEncode(header) + "." +
    base64UrlEncode(payload),
    api_key
  )
  ```

#### JWT Payload Claims

- **`exp`** - The expiration time of the token. This is a Unix timestamp in seconds. The token will be invalid after this time.

  ```json
  {
    "exp": 1640995200, // Expiration time
  }
  ```

- **`value_exists`** - This is a claim that can be used to validate the token at the cost of an extra lookup.
  
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

  If this claim is present, Qdrant will check if there is a point in the collection with the specified key-values. If it does, the token is valid.
  
  This is useful when you need stateful tokens which can be invalidated independently.

- **`access`** - This claim defines the access level of the token. If this claim is present, Qdrant will check if the token has the required access level to perform the operation. If this claim is **not** present, **manage** access is assumed.

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

  You can also specify which subset of the collection the user is able to access by specifying a `payload` restriction that the points must have.

  ```json
  {
    "access": [
      {
        "collection": "my_collection",
        "access": "r",
        "payload": {
          "user_id": "user_123456"
        }
      }
    ]
  }
  ```

  This `payload` claim will be used to implicitly filter the points in the collection, so that they only see their user, for example.

<!-- TODO: add access table -->

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
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("https://localhost:6334").build()?;
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

There are other techniques for reducing the permissions such as dropping [Linux capabilities](https://www.man7.org/linux/man-pages/man7/capabilities.7.html) depending on your deployment method, but running as a non-root user with a read-only root file system are the two most important.
