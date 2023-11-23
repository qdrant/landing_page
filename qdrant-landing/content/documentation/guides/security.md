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

<aside role="alert"><a href="#tls">TLS</a> must be used to prevent leaking the API key over an unencrypted connection.</aside>

For using API key based authentication in Qdrant cloud see the cloud
[Authentication](https://qdrant.tech/documentation/cloud/authentication)
section.

The API key then needs to be present in all REST or gRPC requests to your instance.
All official Qdrant clients for Python, Go, Rust, and .NET support the API key parameter.

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
    url="https://localhost",
    port=6333,
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

```csharp
using Qdrant.Client;

var client = new QdrantClient(
  "xyz-example.eu-central.aws.cloud.qdrant.io",
  https: true,
  apiKey: "<paste-your-api-key-here>"
);
```

```rust
use qdrant_client::client::QdrantClient;

let client = QdrantClient::from_url("https://xyz-example.eu-central.aws.cloud.qdrant.io:6334")
        .with_api_key("<paste-your-api-key-here>")
        .build()?;
```

<aside role="alert">Internal communication channels are <strong>never</strong> protected by an API key. Internal gRPC uses port 6335 by default if running in distributed mode. You must ensure that this port is not publicly reachable and can only be used for node communication. By default, this setting is disabled for Qdrant Cloud and the Qdrant Helm chart.</aside>

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
    url="https://localhost",
    port=6333,
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
