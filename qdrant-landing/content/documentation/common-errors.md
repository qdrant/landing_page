---
title: Troubleshooting
short_description: "Diagnose and resolve common Qdrant errors, from open-file limits, quota rejections, and 401 and 403 authentication failures to incompatible file systems and corrupted collection metadata."
description: "Troubleshoot common Qdrant runtime errors: open-file limits, HTTP 507 quota rejections, POSIX file system requirements, and recovery from corrupted collection metadata."
partition: deploy
weight: 150
aliases:
  - ../tutorials/common-errors
  - /documentation/troubleshooting/
  - /documentation/guides/common-errors/
  - /documentation/common-errors
  - /documentation/operations/common-errors
---

# Solving common errors

## Too many files open (OS error 24)

Each collection segment needs some files to be open. At some point you may encounter the following errors in your server log:

```text
Error: Too many files open (OS error 24)
```

In such a case you may need to increase the limit of the open files. It might be done, for example, while you launch the Docker container:

```bash
docker run --ulimit nofile=10000:10000 qdrant/qdrant:latest
```

The command above will set both soft and hard limits to `10000`.

If you are not using Docker, the following command will change the limit for the current user session:

```bash
ulimit -n 10000
```

Please note, the command should be executed before you run Qdrant server.

## Insufficient storage (HTTP 507)

*Available as of v1.19.0*

When nodes have been configured with a [resource quotas](/documentation/ops-configuration/quotas/) no nodes may be availabe with replicas that accept writes. In that case, clients see an HTTP 507 Insufficient Storage, or gRPC `ResourceExhausted` error:

```text
Disk usage is at 95% of total capacity, exceeding the configured limit of 90%.
Help: Reduce disk usage (e.g. delete points or drop collections), or raise
`max_disk_usage_percent` in the global quota config.
```

See also: [When a Quota Is Exceeded](/documentation/ops-configuration/quotas/#when-a-quota-is-exceeded)

To resolve it, either free the resource or raise the limit:

- Delete points, or drop collections you no longer need. Point deletes stay allowed under a quota for exactly this reason. Deleting individual vectors or payload keys is rejected.
- Add capacity. See [Capacity Planning](/documentation/capacity-planning/).
- Raise the limit with `PUT /quotas`, if the quota is set lower than the node can actually handle.

Writes don't resume the instant usage drops. A tripped limit clears only once usage has fallen under the [release margin](/documentation/ops-configuration/quotas/#release-margin), which defaults to 5 percentage points under the limit.

## Unauthorized and forbidden (HTTP 401 and 403)

When API key authentication is enabled, which is always the case on Qdrant Cloud, Qdrant rejects a request with `401` when it can't identify the key, and with `403` when the key is known but not allowed to do what the request asks. Response messages start with `Unauthorized:` or `Forbidden:`, followed by the text in the table.

| Status | Message | Cause | Fix |
|---|---|---|---|
| 401 | `Must provide an API key or an Authorization bearer token` | The request has neither an `api-key` header nor an `Authorization: Bearer` header. | Send the key with every request. |
| 401 | `Invalid API key or JWT` | The value is not a key this cluster recognizes, for example a mistyped or truncated key, or a Cloud Management Key. | Copy the key again. On Qdrant Cloud, use a [Database API key](/documentation/cloud/authentication/) from the target cluster. |
| 403 | A message naming an expired or invalid signature | A granular access key has passed its expiration, or it was created for a different cluster. | Create a new key on the cluster you connect to, and rotate the key before it expires. See [Rotate and Revoke Keys](/documentation/cloud/authentication/#rotate-and-revoke-keys). |
| 403 | `Access to collection <name> is required` | The key is restricted to collections and does not include this one. | Create a key that includes the collection. |
| 403 | `Write access to collection <name> is required` | The key has read-only access to the collection, and the request writes to it. | Create a key with read-write access to the collection. |
| 403 | `Manage access for this operation is required` | The operation, such as creating a collection, needs manage permission. | Use a manage key. See the [Table of Access](/documentation/security/#table-of-access). |
| 403 | `Global access is required` | A key restricted to specific collections called an operation that applies to the whole cluster. | Use a cluster-wide key. |
| 403 | `Global manage access is required` | A read-only cluster-wide key called an operation that writes or manages. | Use a cluster-wide manage key. See the [Table of Access](/documentation/security/#table-of-access). |

On Qdrant Cloud, a key that was created moments ago can return `403`. Wait a few seconds and retry. If connections fail before any `401` or `403` response, check the port, TLS, and [IP restrictions](/documentation/cloud/cluster-access/#troubleshooting-connections).

## Incompatible file system

Qdrant have a [set of requirements](/documentation/installation/#storage) for persistent file storage.
The most important requirement is that file system **must** be [POSIX-compatible](https://www.quobyte.com/storage-explained/posix-filesystem/).


Starting from v1.15.0 Qdrant performs runtime check of file system compatibility on start.
If it detects an unknown file system, you can see a warning like this:

```text
WARN qdrant: There is a potential issue with 
the filesystem for storage path ./storage. Details:
HFS/HFS+ filesystem support is untested
```

If runtime check fails, you might see an error message:

```text
ERROR qdrant: Filesystem check failed for storage path ./storage.
Details: FUSE filesystems may cause data corruption due to caching issues
```

If an error like this is reported, it is NOT safe to continue working with current configuration and you're at risk of losing your data.

Most common errors you might see, if you continue using Qdrant with incompatible file system:

```text
ERROR
Panic occurred in file /qdrant/lib/gridstore/src/gridstore.rs at line 53:
called `Result::unwrap()` on an `Err` value: OutputTooSmall { expected: 4, actual: 0 }
```

or

```text
ERROR
Service internal error: task XXX panicked with message
"called `Result::unwrap()` on an `Err` value: OutputTooSmall { expected: 4, actual: 0 }"
```

It might be also possible that vector data will be lost (set to all zeros) after service restart.


### How to avoid Incompatible file system?

Most common used configuration of incompatible file system is usage of WSL-baced Docker containers in Windows.
When you mount Windows folder into Qdrant docker container, the Windows hyper visor creates a shared mount, which is not fully POSIX-compatible.

Prefer to use docker volumes instead of bind mount:

```bash
# Create named volume
docker volume create qdrant-storage

# Use named volume with qdrant container
docker run --rm -it \
	-p 6333:6333 -p 6334:6334 \
	-v qdrant-storage:/qdrant/storage qdrant/qdrant:v1.15.3
```

The above keeps the volume inside the Linux container, preventing issues with a mount shared with Windows.


## Can't open Collections meta Wal

When starting a Qdrant instance as part of a distributed deployment, you may
come across an error message similar to this:

```bash
Can't open Collections meta Wal: Os { code: 11, kind: WouldBlock, message: "Resource temporarily unavailable" }
```

It means that Qdrant cannot start because a collection cannot be loaded. Its
associated [WAL](/documentation/manage-data/storage/#versioning) files are currently
unavailable, likely because the same files are already being used by another
Qdrant instance.

Each node must have their own separate storage directory, volume or mount.

The formed cluster will take care of sharing all data with each node, putting it
all in the correct places for you. If using Kubernetes, each node must have
their own volume. If using Docker, each node must have their own storage mount
or volume. If using Qdrant directly, each node must have their own storage
directory.


## Using python gRPC client with `multiprocessing`

When using the Python gRPC client with `multiprocessing`, you may encounter an error like this:

```text
<_InactiveRpcError of RPC that terminated with:
	status = StatusCode.UNAVAILABLE
	details = "sendmsg: Socket operation on non-socket (88)"
	debug_error_string = "UNKNOWN:Error received from peer  {grpc_message:"sendmsg: Socket operation on non-socket (88)", grpc_status:14, created_time:"....."}"
```

This error happens, because `multiprocessing` creates copies of gRPC channels, which share the same socket. When the parent process closes the channel, it closes the socket, and the child processes try to use a closed socket.

To prevent this error, you can use the `forkserver` or `spawn` start methods for `multiprocessing`. 

```python
import multiprocessing

multiprocessing.set_start_method("forkserver")  # or "spawn"    
```

Alternatively, you can switch to `REST` API, async client, or use built-in parallelization in the Python client - functions like `qdrant.upload_points(...)`
