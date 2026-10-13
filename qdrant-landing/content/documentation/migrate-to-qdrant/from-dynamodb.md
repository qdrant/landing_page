---
title: From Amazon DynamoDB
short_description: "Move vectors and item attributes from an Amazon DynamoDB vector index into Qdrant collections."
description: "Migrate from Amazon DynamoDB to Qdrant by streaming vectors and item attributes from a DynamoDB vector index into Qdrant collections with the Qdrant Migration Tool."
weight: 37
partition: ecosystem
---

# Migrate from Amazon DynamoDB to Qdrant

## What You Need from AWS

- **Table name**: the DynamoDB table containing your items
- **Vector index name**: the vector index to migrate
- **AWS credentials**: configured via `aws configure` or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`)

<aside role="status">Set your AWS credentials using the AWS CLI's <code>configure</code> command or environment variables before running the migration container.</aside>

## Run the Migration

```bash
docker run --net=host --rm -it \
    -e AWS_ACCESS_KEY_ID='your-access-key' \
    -e AWS_SECRET_ACCESS_KEY='your-secret-key' \
    -e AWS_REGION='us-east-1' \
    registry.cloud.qdrant.io/library/qdrant-migration dynamodb \
    --dynamodb.table 'your-table-name' \
    --dynamodb.index 'your-vector-index-name' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All DynamoDB-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--dynamodb.table` | Yes | DynamoDB table name |
| `--dynamodb.index` | Yes | DynamoDB vector index name |

AWS credentials are passed via environment variables or the default AWS credential chain, not CLI flags.

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for the original DynamoDB primary key |
| `--qdrant.vector-name` | (empty) | Target vector name. When empty, the unnamed vector is used |

## Gotchas

- **Credential handling:** AWS credentials must be available inside the container. Pass them as environment variables with `-e` flags or mount your `~/.aws` directory.
- **Region matters:** Ensure the `AWS_REGION` environment variable matches the region of your DynamoDB table.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).
