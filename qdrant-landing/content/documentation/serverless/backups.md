---
title: Back Up and Restore
short_description: "Take on-demand or scheduled managed backups of a Qdrant Serverless space or collection, and restore them in place or to a new space."
description: "Back up a Qdrant Serverless space or collection on demand or on a schedule, set retention, and restore a backup in place or to a new space."
weight: 70
---

# Back Up and Restore

Instead of a snapshots API, Serverless uses managed backups. You can take a backup on demand or schedule backups to run automatically. A backup covers a whole space or a single collection. The space stays fully available while a backup runs.

## Take a Backup Now

Open the space, go to the **Backups** tab, and select **Backup Now**. The backup appears in the list with a status while it runs.

## Schedule Backups

Each schedule has:

- A **name**
- A **collection**, if you want to back up just one. A schedule covers the whole space otherwise.
- A **frequency**, such as daily
- A **start time**, in UTC
- A **retention period**, in days, which defaults to 30

You can run several schedules on one space to give different collections different retention. Schedules can be paused and resumed without deleting the backups they already produced.

## Restore

You can restore a backup two ways:

- **In place**, over the space it came from
- **To a new space**, which must have a name not already in use, in the same region

Restoring to a new space works only for space-level backups. It's the safer option when you're recovering from a mistake, because the original stays untouched while you check the restored data. Restoring in place overwrites what's there.
