# Troubleshooting
How to Ask a Discord Question that Gets Answered
---

This document outlines the basic steps required to report any general issue on Discord. We also have dedicated instructions for [database optimization tips](#database-optimization-strategies) or [server connection issues](#server-connection-issues).

Before you create a report, first check whether a similar issue has already been brought up by someone else. Go to the [GitHub issue search](https://github.com/qdrant/qdrant/issues) and look through open and closed issues. If the issue has been fixed, try to reproduce it using the latest version of Qdrant.

When requesting assistance, please provide as much detail as possible. We need to know about your environment, the actions you took and the results you got. In some cases, it is helpful to provide diagnostics as support. This will ensure we are able to triage the issue quickly and efficiently.


## Required information

1. **Summarize the issue.** Describe what you are trying to do and how you are being blocked. Let us know what should have been the result.
2. Are you using Qdrant in **local mode, with Docker or Qdrant Cloud?** If you are using Qdrant Cloud, please provide the cluster id.
3. **Which Qdrant version are you running?** Sometimes the issue happens because you are not running the latest version.
4. **How are you connecting to Qdrant?** Are you using a client?
5. **Provide your current database configuration.** What are the current collection settings? How many vectors in a collection? In case of a distributed setup, describe shards, replication factor etc.
6. **What is your server configuration?** If your question is related to performance, we need to know the operating system version, CPU, RAM size and storage details.
7. **Is there anything showing in the server logs?** Also, provide screenshots of monitoring or log excerpts that illustrate the issue.

## Reproduce the issue**

1. We need reproducible code or a script that demonstrates the problem. Please give us step-by-step instructions to recreate the situation. For errors or problems with queries:
    1. **Show the exact code of the query or the request.**
    1. **Paste the exact output of the response or the error message you are getting back.**

1. Try to recreate the problem in a controlled environment. This helps you confirm that the issue is consistent. If possible, identify the specific conditions that trigger the problem.
2. **What were you doing when the error happened?** Is there a common pattern?
3. **Have you attempted any workarounds?**

## Limitations

1. Please keep in mind that we can’t debug self-hosted deployments without direct access. If possible, reproduce the problem using Qdrant Cloud.
1. In case your version is older, we guarantee only compatibility between two consecutive minor versions.
1. While we will assist with break/fix troubleshooting of issues and errors specific to our products, Qdrant is not accountable for reviewing, writing (or rewriting), or debugging custom code.
1. This includes any customer specific code or 3rd party tools you may be using with our products. Furthermore, we do not support any technologies or configurations that are not listed as supported in our product documentation. Our team will do their best in pointing you to available documentation online to assist you with the best path forward.


## Database Optimization Strategies

**Q: How do I reduce memory usage?**

A: Quantization retains the original vector, but you can reduce the memory usage. 

[https://qdrant.tech/documentation/guides/quantization/](https://qdrant.tech/documentation/guides/quantization/)

**Q: How do I tune search accuracy while controlling for memory usage?**

A: Accuracy tuning tips show you how to adjust quantile parameters and rescoring. 

[https://qdrant.tech/documentation/guides/quantization/#quantization-tips](https://qdrant.tech/documentation/guides/quantization/#quantization-tips)

**Q: How do I measure memory requirements?**

Read more about the minimal RAM required to serve vectors with Qdrant. 

[https://qdrant.tech/articles/memory-consumption/](https://qdrant.tech/articles/memory-consumption/)

**Q: How do I optimize speed search while retaining low memory use?**

A: Use Vector Quantization or disable rescoring. Both will reduce disk reads.

[https://qdrant.tech/documentation/tutorials/optimize](https://qdrant.tech/documentation/tutorials/optimize)

**Q: How do I avoid issues when updating Qdrant to the latest version?**

A: We only guarantee compatibility if you update between consequent versions. You would need to upgrade versions one at a time 1.1 -> 1.2 then 1.2 -> 1.3 then 1.3 -> 1.4.

**Q: My database fails, and htop shows that memory usage is high.**

A: Measuring memory consumption with htop or other tools won't provide accurate numbers. Test by limiting memory instead and see when it fails.


## Server Connection Issues

**Q: What to do if I have a timeout during a batch upsert?**

A: The easiest fix would be to set **max_retries** to a higher value and set the **timeout** higher as well when you instantiate **QdrantClient**. However, we also recommend keeping the entire batch size (including vector & payload) under 5MB.

**Q: I have too many vectors and I can’t upload them all to RAM.**

A: Directly writing to disk is a lot faster when doing a huge upload batch.You want to use **memmap** support. During collection creation, **memmap** may be enabled on a per-vector basis using the **on_disk** parameter. This will store vector data directly on disk. [https://qdrant.tech/documentation/concepts/storage/#configuring-memmap-storage](https://qdrant.tech/documentation/concepts/storage/#configuring-memmap-storage)

**Q: Qdrant Docker fails to start repeatedly on Ubuntu 20.04**

A: We are currently finding there are permissions issues with Docker.

[https://github.com/qdrant/qdrant/issues/2149](https://github.com/qdrant/qdrant/issues/2149)


## Other Frequently Asked Questions

**Q: How many collections can I create?** \
A: You should create one collection and set it up for multitenancy. We believe that creating multiple collections is an anti-pattern, and we don't want to encourage it.

[https://qdrant.tech/documentation/tutorials/multiple-partitions/](https://qdrant.tech/documentation/tutorials/multiple-partitions/)

**Q: Why are returned vectors null?**

A: You can modify the scroll method to include the vectors by setting the `with_vector` parameter to `True`. If you're still seeing `"vector": null` in your point, it might be that the vector you're passing is not in the correct format, or there's an issue with how you're calling the upsert method.

**Q: Does Qdrant support sparse vectors?**

A: We have it in our roadmap, but currently, it’s not supported. We believe a hybrid search might be built with two separate tools combined. [https://qdrant.tech/articles/hybrid-search/](https://qdrant.tech/articles/hybrid-search/) 

**Q: What is the best strategy to upload many vectors into Qdrant collection?**

A: You should use batches and load the vectors iteratively. 

**Q: Can I only store quantized vectors and discard the full precision vectors?**

A: Qdrant needs to retain the original vectors for internal purposes.

**Q: When should one use Kubernetes for Qdrant as opposed to Docker containers?**

A: To run a multi node setup we recommend Kubernetes, but for a single node you can run Docker.  In general in production critical systems, we always advocate more nodes rather than one big one and activate replication for your collections. There are a lot of pros and cons of single installation versus Kubernetes and it very much depends on your use case.