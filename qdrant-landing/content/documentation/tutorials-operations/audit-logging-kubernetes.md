---
title: Qdrant Audit Logging In Kubernetes
short_description: "Get self-hosted/hybrid Qdrant audit logs off the pod's local disk and into Loki using a sidecar container and Fluent Bit, without a custom image."
description: "Capture Qdrant audit logs on Kubernetes with a sidecar container, ship them with Fluent Bit, and query them in Loki and Grafana."
weight: 46
---

#  Qdrant Audit Logging In Kubernetes

| Time: 40 min | Level: Intermediate |
| --- | ----------- |

[Audit logging](/documentation/security/#audit-logging), available since Qdrant v1.17, writes a structured JSON entry for every access-checked API request, recording who is behind the call, which authentication method was used, what endpoint was involved, the success status and other metadata. 

On Qdrant Cloud, those logs live on managed storage and are downloadable through the API. On a self-hosted or hybrid cluster, Qdrant writes them to a file on the pod's own storage volume instead, where they stay bound to that single pod: logs are not immediately searchable or shared across nodes, and not something your SIEM or log platform can reach directly.

Qdrant's own container image ships no log-forwarding agent, and there is currently no option to configure Qdrant to write audit logs to stdout instead of a file. 

To get audit logs off the pod, we need to add something else that reads that file and forwards it, without modifying Qdrant's image.

This tutorial builds the pipeline that tackles this issue on a local Kubernetes cluster: 

- a **[sidecar container](https://kubernetes.io/docs/concepts/workloads/pods/sidecar-containers/)** tails the audit log file and prints it to its own stdout
- **[Fluent Bit](https://fluentbit.io/)** picks that stream up from the node's container logs
- **[Loki](https://grafana.com/oss/loki/)** stores it so you can query it in Grafana.

![The audit-tailer sidecar tails Qdrant's audit log file inside the pod. Fluent Bit, running as a DaemonSet on the same node, tails that container's log file from the node's disk and forwards it to Loki, which you query from Grafana.](/documentation/tutorials/audit-logging-kubernetes/architecture.png)

Each stage is verified before moving to the next, so if something breaks later you know which layer to check.

## Prerequisites

Install [`docker`](https://docker.com), [`kind`](https://kind.sigs.k8s.io/), [`kubectl`](https://kubernetes.io/docs/reference/kubectl/), and [`helm`](https://helm.sh). On Ubuntu x86_64:

**Docker**

```bash
sudo apt update
sudo apt install ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

**kind**

Requires [go](https://go.dev/dl/) installed

```bash
go install sigs.k8s.io/kind@v0.33.0
```

**kubectl**

```bash
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
```

**helm**

```bash
curl -fsSL -o get_helm.sh https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-4
chmod 700 get_helm.sh
./get_helm.sh
```

Now that everything is set up, create a throwaway cluster and confirm it's up:

```bash
kind create cluster --name qdrant-audit-demo
kubectl get nodes
```

## Deploy Qdrant With Audit Logging and a Tailing Sidecar

Add the Qdrant Helm repository:

```bash
helm repo add qdrant https://qdrant.github.io/qdrant-helm
helm repo update
```

<aside role="alert">
    When using this Helm chart, be aware of the <a href="https://github.com/qdrant/qdrant-helm/tree/main#limitations">limitations</a> it has compared to Qdrant Cloud.
</aside>

[Audit logging](/documentation/security/#audit-logging) is off by default and has to be turned on in Qdrant's configuration. A sidecar container inside the same pod reads the log file straight off the pod's shared filesystem and writes each line to its own stdout, which is what turns a file only Qdrant can see into a stream Kubernetes can capture. See the [audit logging reference](/documentation/security/#audit-logging) for the full list of configuration options.

```yaml
# values.yaml
config:
  apiKey: true
  audit:
    enabled: true
    dir: ./storage/audit
    rotation: hourly
    max_log_files: 14

sidecarContainers:
  - name: audit-tailer
    image: busybox
    command: ["sh", "-c", "while true; do tail -n0 -F /qdrant/storage/audit/*.log & TAIL_PID=$!; sleep 60; kill $TAIL_PID 2>/dev/null; wait $TAIL_PID 2>/dev/null; done"]
    volumeMounts:
      - name: qdrant-storage
        mountPath: /qdrant/storage
        readOnly: true
```

The Qdrant Helm chart copies `sidecarContainers` into the pod spec as-is: it does not automatically give the sidecar access to Qdrant's storage volume, so the explicit `volumeMounts` block above is required or the sidecar will find nothing to tail.

Note that the outer loop in the tailing service restarts `tail -F` every 60 seconds so the sidecar keeps following the latest file after Qdrant rotates the audit log to a new one. This might not be the most performant setting for a production instance, and you might want to use specialized tailing containers that plug directly into Fluent Bit or other services.

Once you saved the YAML above to `values.yaml`, you can apply the changes to the Kubernetes cluster with:

```bash
helm upgrade --install qdrant-audit-logging qdrant/qdrant -f values.yaml
# verify update
kubectl get pods
```

Once the pod is `Running`, retrieve the generated API key and export it for the rest of this tutorial:

```bash
api_key=$(kubectl get secret qdrant-audit-logging-apikey -o jsonpath="{.data.api-key}" | base64 -d)
export QDRANT_API_KEY="$api_key"
```

Port-forward the REST port so you can send requests to it from your local machine:

```bash
export POD_NAME=$(kubectl get pods --namespace default -l "app.kubernetes.io/name=qdrant,app.kubernetes.io/instance=qdrant-audit-logging" -o jsonpath="{.items[0].metadata.name}")
kubectl --namespace default port-forward $POD_NAME 6333:6333
```

### Verify the Sidecar Sees Audit Events

Before adding any log shipper, confirm the sidecar itself is working. Follow its logs:

```bash
kubectl logs $POD_NAME -c audit-tailer -f
```

From a different terminal, send a batch of requests to Qdrant:

```bash
for i in {1..10}
do
    curl -X GET http://localhost:6333/collections -H "api-key: $QDRANT_API_KEY"
done
```

Each request should appear as a JSON line in the sidecar's logs within a few seconds. If nothing shows up, check that `config.audit.enabled` is `true` and that the sidecar's `volumeMounts` path matches `config.audit.dir`.

## Connect the Sidecar Logs to Fluent Bit

The sidecar prints to its own stdout, but that output is not yet leaving the cluster. Fluent Bit is a log shipper: a lightweight agent that reads log files and forwards their contents to a destination such as a Security Information and Event Management (SIEM) service, an object store, or a log aggregator like Loki.

A common assumption it that a log shipper works by calling `kubectl logs` internally, but that's not what happens. Every container's stdout is captured by the container runtime (in our case Docker via `kind`) and written to a file on the node's disk, typically under `/var/log/containers/`. 

`kubectl logs` is a convenience wrapper around reading those files, and a log shipper does the same thing directly: it runs as a `DaemonSet`, a pod Kubernetes automatically schedules on every node, mounts that `/var/log` directory from the host, and tails the files itself. This is the same trick as the sidecar, one layer up: the sidecar tails a file inside the pod, Fluent Bit tails a file on the node.

Add the Fluent Bit Helm repository:

```bash
helm repo add fluent https://fluent.github.io/helm-charts
helm repo update
```

Create `fluent-bit-values.yaml`, scoped to just the sidecar's log file and printing to Fluent Bit's own stdout as a first checkpoint:

```yaml
# fluent-bit-values.yaml
config:
  inputs: |
    [INPUT]
        Name              tail
        Path              /var/log/containers/*audit-tailer*.log
        Tag               qdrant.audit
        Parser            cri
        Refresh_Interval  5

  outputs: |
    [OUTPUT]
        Name    stdout
        Match   qdrant.audit
        Format  json_lines
```

Let's break down the configuration above:

- `Path` matches only log files whose name contains `audit-tailer`, scoping the input to the sidecar instead of every container on the node. 
- `Tag` labels matching input for routing to the matching output block. 
- `Parser cri` unwraps the plain-text envelope [containerd](https://containerd.io/) wraps around every container log line, a timestamp and stream type prefix, so the underlying audit log line comes out clean.

<aside role="status">
<code>kind</code> nodes run as Docker containers, but the pods inside them are managed by containerd, so log lines are in CRI format, not Docker JSON. Most managed Kubernetes services default to containerd too, so <code>cri</code> is also the parser for a real cluster.
</aside>

The stdout output is a stand-in for a real destination, letting you confirm the pipeline works end to end before pointing it at Loki.

Now apply the changes to deploy Fluent Bit:

```bash
helm upgrade --install fluent-bit fluent/fluent-bit -f fluent-bit-values.yaml
```

Send another batch of requests and check that Fluent Bit picked them up:

```bash
for i in {1..10}
do
    curl -X GET http://localhost:6333/collections -H "api-key: $QDRANT_API_KEY"
done

kubectl logs -l app.kubernetes.io/name=fluent-bit -f
```

Each audit event should print as a JSON line. If the log lines don't show up, double-check the `Path` pattern against the actual file names under `/var/log/containers/` on the node, since a mismatched pattern is the most common reason Fluent Bit sees nothing.

## Store and Query Logs

Printing to stdout proves the pipeline works, but it isn't a place to search or retain logs. Loki is Grafana's log aggregation system, built to index only a small set of labels, such as pod, container, or namespace, rather than the full text of every line. 

The labels work like folder names: a query first narrows down by label, then Loki scans the raw, compressed log chunks inside that narrowed set. Indexing less makes Loki cheap to run, which is why it fits a local tutorial as well as production.

Install Loki along with its bundled Grafana instance:

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update
helm upgrade --install loki grafana/loki-stack --set grafana.enabled=true
```

Point Fluent Bit's output at Loki instead of stdout, and update `fluent-bit-values.yaml`:

```yaml
# fluent-bit-values.yaml
config:
  inputs: |
    [INPUT]
        Name              tail
        Path              /var/log/containers/*audit-tailer*.log
        Tag               qdrant.audit
        Parser            cri
        Refresh_Interval  5
        Read_from_Head    true

  outputs: |
    [OUTPUT]
        Name        loki
        Match       qdrant.audit
        Host        loki
        Port        3100
        Labels      job=qdrant_audit
        Line_Format json
```

A few notes on the configuration above:

- `Host loki` works without an IP address because Kubernetes gives every Service a DNS name matching its release name, so `loki` alone resolves to the Loki Service inside the cluster. 
- `Labels job=qdrant_audit` is the Loki label these logs will be filed under, and what you'll filter on in Grafana. 
- `Line_Format json` keeps each audit event as a structured JSON blob instead of flattening it to plain text, so fields like the requested method or the result stay queryable later.

Apply the updated configuration:

```bash
helm upgrade --install fluent-bit fluent/fluent-bit -f fluent-bit-values.yaml
```

Port-forward Grafana and retrieve the generated admin password:

```bash
kubectl port-forward svc/loki-grafana 3000:80
kubectl get secret loki-grafana -o jsonpath="{.data.admin-password}" | base64 -d
```

Log in at `http://localhost:3000` with username `admin` and the password above. Open **Explore**, select the **Loki** data source, and query `{job="qdrant_audit"}`.

![Qdrant audit log entries queried in Grafana's Explore view through the Loki data source.](/documentation/tutorials/audit-logging-kubernetes/loki-grafana.png)

Send a few more requests to Qdrant and re-run the query: the new audit events should appear within a few seconds, each one carrying the full JSON payload Qdrant wrote to the audit log, now searchable and retained independently of the pod's lifecycle.

## Scaling to a Real Cluster

This tutorial uses `kind` so the whole pipeline runs on a laptop, but the pieces map directly onto a managed Kubernetes cluster: 

- The sidecar and its `volumeMounts` block go into whatever tool manages your Qdrant Helm release
- Fluent Bit's `Path` pattern only needs to match your node's actual container log naming; the `cri` parser used here already matches containerd, the runtime behind most managed Kubernetes offerings, so this part of the configuration carries over unchanged. If a cluster still uses the legacy dockershim, switch back to the `docker` parser instead.

For production, point the Loki output at a Loki deployment sized and retained for your compliance requirements, rather than the single-replica `loki-stack` chart used here, and restrict who can query the `job=qdrant_audit` label in Grafana. 

The `audit-tailer` sidecar and the Fluent Bit `INPUT`/`OUTPUT` blocks stay the same regardless of where the logs end up, although, as said before, we advise you to adopt specialized tailing services such as  [Fluent Bit's tail plugin](https://github.com/fluent/fluent-operator/blob/master/docs/plugins/fluentbit/input/tail.md).
