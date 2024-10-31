---
title: Datadog
---

![Datadog Cover](/documentation/observability/datadog/datadog-cover.jpg)

[Datadog](https://www.datadoghq.com/) is a cloud-based monitoring and analytics platform that offers real-time monitoring of servers, databases, and numerous other tools and services. It provides visibility into the performance of applications and enables businesses to detect issues before they affect users.

You can install the [Qdrant integration](https://docs.datadoghq.com/integrations/qdrant/) to get real-time metrics to monitor your Qdrant deployment within Datadog including:

- The performance of REST and gRPC interfaces with metrics such as total requests, total failures, and time to serve to identify potential bottlenecks and mitigate them.

- Information about the readiness of the cluster, and deployment (total peers, pending operations, etc.) to gain insights into your Qdrant deployment.

### Usage

- With the [Datadog Agent installed](https://docs.datadoghq.com/agent/basic_agent_usage), run the following command to add the Qdrant integration:

```shell
datadog-agent integration install -t qdrant==1.0.0
```

- Edit the `conf.d/qdrant.d/conf.yaml` file in your [Agent's configuration directory](https://docs.datadoghq.com/agent/guide/agent-configuration-files/#agent-configuration-directory) to start collecting your [Qdrant metrics](/documentation/guides/monitoring/).

Most importantly, set the `openmetrics_endpoint` value to the `/metrics` endpoint of your Qdrant instance.

```yaml
instances:
    ## @param openmetrics_endpoint - string - optional
    ## The URL exposing metrics in the OpenMetrics format.
  - openmetrics_endpoint: http://localhost:6333/metrics
```

If the Qdrant instance requires authentication, you can specify the token by configuring [`extra_headers`](https://github.com/DataDog/integrations-core/blob/26f9ae7660f042c43f5d771f0c937ff805cf442c/openmetrics/datadog_checks/openmetrics/data/conf.yaml.example#L553C1-L558C35).

```yaml
# @param extra_headers - mapping - optional
# Additional headers to send with every request.
extra_headers:
   api-key: <QDRANT_API_KEY>
```

- Restart the Datadog agent.

- You can now head over to the Datadog dashboard to view the [metrics](https://docs.datadoghq.com/integrations/qdrant/#data-collected) emitted by the Qdrant check.

## Further Reading

- [Getting started with Datadog](https://docs.datadoghq.com/getting_started/)
- [Qdrant integration source](https://github.com/DataDog/integrations-extras/tree/master/qdrant)
