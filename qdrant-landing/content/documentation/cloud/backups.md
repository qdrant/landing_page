---
title: Backups
weight: 20
---

There are situations where you need to restore your cluster because of application or system failure.
In most cases you will have a source of truth for your data in a regular database and would be able to reindex the data into your Qdrant vector search cluster.
However, encoding and uploading a big amount of data might require a long time.
For high availability critical projects we highly recommend relying on replication, which is always a better option, because it guarantees the proper cluster functionality as long as at least one replica is running.
For less critical use-cases you can make use of one of the available options.

## Self-service backups

Qdrant engine offers a snapshot API that allows to create a snapshot of a particular collection or even the whole storage.
Please refer to the [snapshot documentation](../../snapshots/) for details.

In case of a single node cluster, simply call the snapshot endpoint on the exposed url.
In case of a multi node cluster you’d need to take a snapshot on each node that the collection resides upon. 
To achieve this, you simply prepend `node-{num}-` to your cluster url and call the snapshot endpoint on the individual hosts, starting with node 0 up to the number of nodes minus one.
You can recover snapshots the same way via api.


## Automatic backups

**Note: not available in the beta version.**

Note: not available in the beta version.
The cloud platform offers an option for automatic system backups.
It is possible to configure periodical system level snapshots to restore a cluster from a hard copy.
On the cluster settings section you can choose how often a backup should be done and how many latest copies should be kept on the backup storage. 
To restore a Qdrant cluster from backup, you can select a desired backup copy version and start the reporting process.
Attention: during the restoring process the affected cluster will not be available because the cluster will be deleted  and created from scratch from the backup copy.
Please also note, that if you changed the cluster topology after the copy was created, the new cluster will reset to the previous configuration.  

