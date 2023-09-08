---
title: Troubleshooting
weight: 170
aliases:
  - ../tutorials/common-errors
  - ../guidess/common-errors
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

## Qdrant stuck/frozen, extract stack trace

*Available as of v1.5.0*

It might happen that Qdrant is completely stuck. Operations may hang
indefinitely or an optimization may be stuck forever. Waiting some time does not
improve the situation.

If you encounter this situation, always check the Qdrant logs first. It may give some
valuable information on what is happening.

When logs don't show any pointers to the problem, you may extract a stack trace
from the Qdrant server to report the current state of what it is doing. This can
be done by visiting [`/stacktrace`](http://localhost:6333/stacktrace) in your
browser. You can attach this stack trace to an issue report to help Qdrant
developers debug the issue.

```http
GET /stacktrace

{
  "result": {
    "threads": [
      {
        "id": 7,
        "name": "qdrant",
        "frames": [
          "",
          "",
          ":0 - qdrant::main::h6b7c98553f8d540b ",
          ":0 - std::sys_common::backtrace::__rust_begin_short_backtrace::ha4aa73ba5e009f1f "
        ]
      },
      {
        "id": 8,
        "name": "search-0",
        "frames": [
          ":0 - epoll_wait ",
          ":0 - mio::poll::Poll::poll::h91178360524c8cd2 "
        ]
      },
      {
        "id": 9,
        "name": "search-1",
        "frames": [
          ":0 - syscall ",
          ":0 - parking_lot::condvar::Condvar::wait_until_internal::h26d4f821b8427131 "
        ]
      }
    ]
  },
  "status": "ok",
  "time": 0.03003201
}
```
