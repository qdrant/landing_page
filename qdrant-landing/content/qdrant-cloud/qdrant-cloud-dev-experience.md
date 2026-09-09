---
label: GETTING STARTED
title: Qdrant Cloud Across Your Stack
features:
- id: 0
  img: 
    src: /img/qdrant-cloud/language.svg
    mobileSrc: /img/qdrant-cloud/language-mobile.svg 
    alt: Language SDKs
  link: 
    text: Language SDKs
    url: /documentation/interfaces/
- id: 1
  img:
    src: /img/qdrant-cloud/monitoring-and-observability.svg
    mobileSrc: /img/qdrant-cloud/monitoring-and-observability-mobile.svg
    alt: Infrastructure as Code
  link: 
    text: Infrastructure as Code
    url: /documentation/cloud-tools/terraform/
- id: 2
  img:
    src: /img/qdrant-cloud/migrate.svg
    mobileSrc: /img/qdrant-cloud/migrate-mobile.svg
    alt: Migrate
  link: 
    text: Migrate
    url: https://github.com/qdrant/migration
- id: 3
  img:
    src: /img/qdrant-cloud/enterprise-sso-integration.svg
    mobileSrc: /img/qdrant-cloud/enterprise-sso-integration-mobile.svg
    alt: Integrations
  link: 
    text: Integrations
    url: /documentation/frameworks/
tabs:
  - id: 0
    tab: Operate Clusters (SDK + CLI)
    title: Same workflow from your app, terminal, or CI.
    description: Python SDK in app code, qcloud CLI in scripts and CI. Same Qdrant Cloud API.
    codeBlocks:
      - id: 0
        codeBar: Python SDK
        code: |
          from qdrant_client import QdrantClient

          client = QdrantClient(
              url="https://your-cluster.qdrant.io",
              api_key="qdrant_…",
          )
          
          # List collections on this cluster
          catalog = client.get_collections()
          
          # Snapshot before risky index or schema changes
          client.create_snapshot(collection_name="products")
          
          # Page payloads for spot checks, exports, or pipeline validation
          points, next_offset = client.scroll(
              collection_name="reports",
              limit=100,
              with_payload=True,
          )
      - id: 1
        codeBar: qcloud CLI · REST
        code: |
          # Pick the Qdrant Cloud context (API key + account id)
          qcloud context use prod
          
          # Inspect clusters — ids, regions, endpoints, status
          qcloud cluster list
          qcloud cluster describe $QDRANT_CLUSTER_ID
          
          # Snapshot the collection (in-cluster) before risky index / schema changes
          qcloud cluster snapshot create products
          
          # Query data via REST when scripting outside the SDK
          curl -sS "https://abcd-1234.eu-central.aws.cloud.qdrant.io:6333/collections/products/points/scroll" \
            -H "api-key: $QDRANT_DATA_API_KEY" \
            -H 'Content-Type: application/json' \
            -d '{"limit": 100, "with_payload": true, "with_vector": false}'
  - id: 1
    tab: Cluster Visibility (Console)
    title: See what's in your cluster from the browser.
    description: Inspect collections, run queries, and check results without leaving the Console.
    img:
      src: /img/qdrant-cloud/metrics.png
      mobileSrc: /img/qdrant-cloud/metrics-mobile.png 
      alt: Metrics
  - id: 2
    tab: Provision Infrastructure (Terraform)
    title: Define Qdrant Cloud clusters in your IaC repo.
    description: Provision, scale, and tear down clusters alongside the rest of your infrastructure.
    codeBlock:
      code: |
        terraform {
          required_providers {
            qdrant-cloud = {
              source  = "qdrant/qdrant-cloud"
              version = "~> 1.0"
            }
          }
        }
        
        provider "qdrant-cloud" {
          api_key    = var.qdrant_api_key
          account_id = var.qdrant_account_id
        }
        
        resource "qdrant-cloud_cluster" "production" {
          name              = "search-production"
          cloud_provider    = "aws"
          cloud_region      = "eu-central-1"
        
          configuration {
            number_of_nodes = 3
            node_configuration {
              package_id = "gpxxl-1"  # 8 vCPU, 32 GB RAM per node
            }
          }
        }
        
        # Pin the data API key to a Terraform output for downstream consumers
        output "cluster_endpoint" {
          value = qdrant-cloud_cluster.production.url
        }
sitemapExclude: true
---
