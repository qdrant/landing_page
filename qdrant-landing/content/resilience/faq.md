---
title: FAQs
list:
  - id: 0
    title: Uptime and SLA
    questions:
      - id: 0
        question: What's the uptime SLA?
        answer: Up to 99.95% uptime on the Premium tier with Multi-AZ enabled. Full SLA terms are in the Qdrant Cloud SLA.
      - id: 1
        question: What's the difference between Standard, Premium, and Premium Multi-AZ SLAs?
        answer: Standard offers a 99.5% uptime SLA. Premium raises it to 99.9%. Premium with Multi-AZ enabled reaches 99.95%. Each tier also differs on support coverage and response times.
      - id: 2
        question: How is uptime measured?
        answer: Please refer to our Qdrant Cloud SLA.
      - id: 3
        question: What if I need a higher SLA than 99.95%?
        answer: Talk to us. We arrange bespoke SLAs for specific deployments.
  - id: 1
    title: Failover and Zone Behavior
    questions:
      - id: 0
        question: What happens during a zone failure?
        answer: On Multi-AZ clusters, reads and writes continue from the surviving zones automatically, and you do not need to take any action.
      - id: 1
        question: Do I need to change my client code for failover?
        answer: Failover happens server-side, so all clients behave the same way. For transient errors during a failover, retry with backoff, the standard production pattern.
      - id: 2
        question: Is Multi-AZ the same as failover?
        answer: No. Multi-AZ is continuous cross-zone replication that keeps the cluster available across availability zones. Node-level failover, where unhealthy nodes drop from rotation, is a separate mechanism.
      - id: 3
        question: Does a multi-node cluster spread across availability zones automatically?
        answer: No. A multi-node cluster gives you replication across nodes, but those nodes can sit in the same availability zone. Zone distribution only happens when you enable Multi-AZ at cluster creation. Replication factor and zone placement are two independent properties.
  - id: 2
    title: Replication and Requirements
    questions:
      - id: 0
        question: What do I need to get these resilience capabilities?
        answer: Run replicated collections. Your cluster should have at least 3 nodes, and each collection should have a replication factor of at least 2 (3 recommended for Multi-AZ). On Qdrant Cloud, Qdrant adds or drops shard replicas automatically to match the replication factor you set.
      - id: 1
        question: How do I enable Multi-AZ?
        answer: Check the Multi-AZ Deployment checkbox when you create the cluster. Multi-AZ clusters need a minimum of 3 nodes and scale in multiples of 3. Multi-AZ is available on the Premium tier.
      - id: 2
        question: Can I add Multi-AZ to an existing cluster?
        answer: No. Multi-AZ can't be added to an existing cluster. To move an existing workload onto Multi-AZ, create a new Multi-AZ cluster and migrate your data. Talk to engineering if you need help.
      - id: 3
        question: Is Qdrant replication primary/secondary?
        answer: There is no primary, no leader, and no write hot spot. Every replica is equal and any node accepts reads and writes. You set a replication factor and Qdrant keeps that many copies of each shard across your nodes. Write consistency is governed by the consistency factor you configure.
  - id: 3
    title: Backups and Recovery
    questions:
      - id: 0
        question: Are backups automatic?
        answer: Backups are under your control. Choose a schedule in the Console Backups tab and set how long to keep each one with days of retention, or take an on-demand backup any time. You only pay for the backups you configure.
      - id: 1
        question: Can I restore a backup to a different cluster?
        answer: Yes. Restore a backup into the same cluster to revert it, or restore into a new cluster.
      - id: 2
        question: What does a restore actually recover to?
        answer: A restore returns your cluster to the exact state captured in the backup, including its CPU, memory, node count, and Qdrant version at that time. Any changes made after the backup date are lost. The cluster is unavailable while the restore is in progress, and restore time depends on the size of your data. For recovery-time guidance on your workload, talk to engineering.
  - id: 4
    title: Upgrades
    questions:
      - id: 0
        question: Are upgrades really zero downtime?
        answer: For collections with a replication factor of at least 2, yes. Qdrant Cloud uses a rolling restart, updating nodes one at a time while peers serve traffic. If all collections have replication factor of 1, it uses a parallel restart, which causes a short downtime.
      - id: 1
        question: Do I control when upgrades happen?
        answer: Yes. When a new version is available, Qdrant Cloud shows an update notification on the Cluster Details page. Choose the version and click Update. You can update at any time, and if you are several versions behind, Qdrant Cloud performs the required intermediate updates for you.
  - id: 5
    title: Tiers and Residency
    questions:
      - id: 0
        question: Does my cluster get all of these capabilities, or just some?
        answer: Run replicated collections (3 or more nodes, replication factor 2 or more) to get automatic failover, scheduled backups, and zero-downtime upgrades. Multi-AZ replication across three availability zones, and the 99.95% uptime SLA, are on the Premium tier.
      - id: 1
        question: How do you handle data residency?
        answer: Choose your data-center region when you create the cluster, across AWS, Azure, and Google Cloud. For physical isolation, see Private and Hybrid Cloud.
sitemapExclude: true
---
