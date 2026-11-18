---
title: Secure a Space
short_description: "Control access to a Qdrant Serverless space with scoped API keys for applications and account permissions for people."
description: "Secure a Qdrant Serverless space with global or collection-scoped API keys, read-only and metrics-only access, key expiry, and Serverless permissions in Cloud RBAC."
weight: 40
---

# Secure a Space

Two layers control access to a space: API keys for applications and account permissions for people.

**Space API keys** control what an application can do with your data: reading points, writing them, and managing collections. Applications pass the key in the `api-key` header of every request.

**Account permissions** control what a person can do in the Qdrant Cloud console: creating spaces, deleting them, managing keys and backups. They're part of [Cloud role-based access control](/documentation/cloud-rbac/).

A space accepts connections from any address, so the API key is what protects your data.

<aside role="status">Serverless doesn't support private links or data encryption with customer-managed keys yet. If you need either, use a dedicated cluster.</aside>

## Space API Keys

A global key is created with the space so you can connect immediately. Create additional keys scoped to what each application needs.

### Access Scope

A key is either global or restricted to specific collections.

- **Global access** covers every collection in the space, including ones created later.
- **Collection access** covers only the collections you name.

Collection-scoped keys are stored against collection names rather than IDs. If you delete a collection and create another with the same name, the new one is back in scope.

### Allowed Operations

- **Read, write, and manage** for full access, including creating and deleting collections
- **Read-only** for applications that only query
- **Metrics-only** for collecting telemetry, with no access to your data

### Expiry

A key can expire after a set number of days, or never.

Revoke a key by deleting it. Revocation takes effect immediately.

### Example: Create a Read-Only Key for One Collection

This key allows querying a single collection and nothing else. Use it anywhere you don't fully control what happens to the key, such as a demo or a third-party integration.

1. Open the space and go to the **API Keys** tab, then select **Create**.
2. Give the key a name that says where it will be used, such as `search-frontend`.
3. Set **Days until expiration**, or leave it empty for a key that never expires.
4. Under **Access Control**, select **Collection Access**, then **Add collection**, and enter the collection's name.
5. Under **Allowed Operations**, select **Read-only Operations**, then select **Add**.
6. Select **Create**, then copy the key and store it somewhere safe.

This key can't write points, can't create or delete collections, and can't reach any collection you didn't name.

## Account Permissions

Serverless adds its own permission families to Cloud role-based access control, so you can grant console access to spaces without granting it to dedicated clusters:

- `serverless_spaces`
- `serverless_collections`
- `serverless_data`
- `serverless_backups`
- `serverless_backup_schedules`
- `serverless_api_keys`

Each can be scoped account-wide, to a single space, or to a single collection.
