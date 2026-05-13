---
title: From S3 Vectors
short_description: "Migrate vector data stored in Amazon S3 Vectors into Qdrant collections for richer filtering and search APIs."
description: "Migrate from S3 Vectors to Qdrant by streaming vectors, metadata, and indexes out of S3 Vectors into Qdrant collections with the Qdrant Migration Tool."
weight: 35
partition: ecosystem
---

# Migrate from S3 Vectors to Qdrant

## What You Need from AWS

- **S3 bucket name** — the bucket containing your vector data
- **Index name** — the S3 Vectors index to migrate
- **AWS credentials** — configured via `aws configure` or environment variables (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`)

<aside role="status">Set your AWS credentials using the AWS CLI's <code>configure</code> command or environment variables before running the migration container.</aside>

## Run the Migration

```bash
docker run --net=host --rm -it \
    -e AWS_ACCESS_KEY_ID='your-access-key' \
    -e AWS_SECRET_ACCESS_KEY='your-secret-key' \
    -e AWS_REGION='us-east-1' \
    registry.cloud.qdrant.io/library/qdrant-migration s3 \
    --s3.bucket 'your-bucket-name' \
    --s3.index 'your-index-name' \
    --qdrant.url 'https://your-instance.cloud.qdrant.io:6334' \
    --qdrant.api-key 'your-qdrant-api-key' \
    --qdrant.collection 'your-collection'
```

### All S3 Vectors-Specific Flags

| Flag | Required | Description |
| :--- | :--- | :--- |
| `--s3.bucket` | Yes | S3 bucket name |
| `--s3.index` | Yes | S3 Vectors index name |

AWS credentials are passed via environment variables or the default AWS credential chain, not CLI flags.

### Qdrant-Side Options

| Flag | Default | Description |
| :--- | :--- | :--- |
| `--qdrant.id-field` | `__id__` | Payload field name for original S3 vector IDs |

## Gotchas

- **Credential handling:** AWS credentials must be available inside the container. Pass them as environment variables with `-e` flags or mount your `~/.aws` directory.
- **Region matters:** Ensure the `AWS_REGION` environment variable matches the region of your S3 bucket.

## Next Steps

After migration, verify your data arrived correctly with the [Migration Verification Guide](/documentation/migration-guidance/).