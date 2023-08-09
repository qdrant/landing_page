---
title: Sizing Upsert Batches
weight: 13
---

# Sizing Upsert Batches

Write an introduction here. Explain what is going on. 

### Calculate the Upper Bound

The hard upper bound should be given by the following formula:

¾ * quota * timeout * ø(IO MB/s) / (|vector| * 4 + ø(|serialize(payload)|) + (index * 1024))

* the ¾ factor is our safety distance from the timeout
* quota is the percentage of resources you intend to allocate to the Qdrant service
* timeout is configured in your Qdrant client with the `timeout` argument given at creation time
* ø(IO MB/s) can be measured as described below
* |vector| is the size of your vector as configured in your collection. We multiply by four as each 32-bit-floating point value takes four bytes
* ø(|serialize(payload)|) is the average length in bytes of the payload JSON
* index is the number of indices on your collection

> Note: Even when this bound shows you that you can insert millions of vectors in one go, it is still prudent to clamp the actual value at around a thousand to avoid losing too many operations if an upsert fails.

### Estimate Payload Sizes

If you know your schema, you can use the maximum size as a conservative estimate. Otherwise it very much depends on your data! There are cases where payload sizes grow with time, so doing a one-time estimate will be good only for a while. But in the usual case where payload sizes will be mostly random and independent, you can take a sample of payloads, measure their sizes in bytes and add a [standard error](https://en.wikipedia.org/wiki/Sample_size_determination#Estimation_of_a_mean) multiplied by the confidence factor (i.e. *ø(size of N payloads) \* (1 + Zδ / √N)*).

For example, say we take 1000 payloads, which are within \[796, 1782\] bytes, with a mean of 1287 bytes and δ of 284,17. Then to estimate with a 95% confidence interval, we'd estimate 1844 bytes, as the following python script shows:

```python
from math import sqrt

x = [...] # number of bytes per payload
Z = 1.96 # Z-value for 95% confidence interval
mean = sum(x) / len(x)
delta = sqrt(sum((i - mean) ** 2 for i in x) / len(x))
delta * Z + mean
# 1844.3242090711192
```

### Estimate Disk Speed

Of course there are specialized disk benchmarking tools, but we're after a quick estimate, so no need to download anything.

Under *Linux* or *Mac OS*, you can simply time writing a few megabytes of data. From a working directory on the disk you intend to measure, you can use `dd` to do just that:

```bash
$ dd if=/dev/zero of=output bs=8k count=1024; rm output

1024+0 records in
1024+0 records out
8388608 (8 MB) copied, 0.00294 s, 2721.1 MB/s
```

Under *Windows*, you can instead get your disk speed with an administrator console:

```bash
C:\Windows\System32>winsat disk -seq -write -drive c
Windows-Systembewertungstool
> Wird ausgeführt: Featureaufzählung ''
> Laufzeit 00:00:00.00
> Wird ausgeführt: Speicherbewertung '-seq -write -drive c'
> Laufzeit 00:00:01.08
> Dshow-Videocodierzeit                        0.00000 s
> Dshow-Videodecodierzeit                      0.00000 s
> Media Foundation-Decodierzeit                0.00000 s
> Disk  Sequential 64.0 Write                  2719.26 MB/s          9.2
> Gesamtausführungszeit 00:00:01.30
```

Now let us plug those estimates into our formula along with the values we take from the configuration:

* timeout = 5s (as per config)
* quota = 5%
* IO = 2720 MB/s
* |vector| = 1536 (as per collection config, yours may vary)
* |serialize(payload)| estimate = 1844 bytes
* I have two indices, so I'll have to add 2048 bytes

(¾ * 5% * 5s * 2720 MB/s) / (1536 * 4 + 1844 + 2048)B = ¾ * 510MB / 10036B = 53285.548027102435

As you can see, with those small payloads, the machine in the example is more than capable of getting a lot of vectors into Qdrant. You should still use roughly a thousand entries per request, to mitigate the risk of a failing request losing too much data.