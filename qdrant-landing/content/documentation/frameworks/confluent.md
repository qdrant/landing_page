---
title: ‎
weight: 3700
---

# Confluent

[Confluent Cloud](https://www.confluent.io/confluent-cloud/?utm_campaign=tm.pmm_cd.cwc_partner_Qdrant_generic&utm_source=Qdrant&utm_medium=partnerref) is a fully-managed data streaming platform, available on AWS, GCP, and Azure, with a cloud-native Apache Kafka engine for elastic scaling, enterprise-grade security, stream processing, and governance.

With our [Qdrant-Kafka Sink Connector](https://github.com/qdrant/qdrant-kafka), Qdrant is part of the [Connect with Confluent](https://www.confluent.io/partners/connect/) technology partner program. It brings fully managed data streams directly to organizations through the Confluent Cloud platform. Making it easier for organizations to stream any data to Qdrant with a fully managed Apache Kafka service.


## Usage

### Pre-requisites

- A Confluent Cloud account. You can begin with a [free trial](https://www.confluent.io/confluent-cloud/tryfree/?utm_campaign=tm.pmm_cd.cwc_partner_qdrant_tryfree&utm_source=qdrant&utm_medium=partnerref) with credits for the first 30 days.
- Qdrant instance to connect to. You can get a free cloud instance at [cloud.qdrant.io](https://cloud.qdrant.io/).

### Installation

1) Download the latest connector zip file from [GitHub Releases](https://github.com/qdrant/qdrant-kafka/releases) or [Confluent Hub](https://www.confluent.io/hub/qdrant/kafka-connect-qdrant).

2) Configure an environment and cluster on Confluent and create a topic to produce messages for.

3) Navigate to the `Connectors` section of the Confluent cluster and click `Add Plugin`. Upload the zip file with the following info.

![Qdrant Connector Install](/documentation/frameworks/confluent/install.png)

4) Once installed, navigate to the connector and set the following configuration values.

![Qdrant Connector Config](/documentation/frameworks/confluent/config.png)

Replace the placeholder values with your credentials.

5) Add the Qdrant instance host to the allowed networking endpoints.

![Qdrant Connector Endpoint](/documentation/frameworks/confluent/endpoint.png)

7) Start the connector.

## Producing Messages

You can now produce messages for the configured topic, and they'll be written into the configured Qdrant instance.

![Qdrant Connector Message](/documentation/frameworks/confluent/message.png)

Refer to the [connector message formats](https://github.com/qdrant/qdrant-kafka/blob/main/README.md#message-formats) for the available options when producing messages.

## Further Reading

- [Kafka Connect Docs](https://docs.confluent.io/platform/current/connect/index.html)
- [Confluent Connectors Docs](https://docs.confluent.io/cloud/current/connectors/bring-your-connector/custom-connector-qs.html)
