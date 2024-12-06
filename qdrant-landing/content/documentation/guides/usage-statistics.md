---
title: Usage Statistics
weight: 166
aliases:
  - ../telemetry
  - /documentation/guides/telemetry
---

# Usage statistics

The Qdrant open-source container image collects anonymized usage statistics from users in order to improve the engine by default.  You can [deactivate](#deactivate-telemetry) at any time, and any data that has already been collected can be [deleted on request](#request-information-deletion). 

Deactivating this will not affect your ability to monitor the Qdrant database yourself by accessing the `/metrics` or `/telemetry` endpoints of your database. It will just stop sending independend, anonymized usage statistics to the Qdrant team.

<aside role="status">When using Qdrant Cloud, this setting does not apply and anonymized usage statistics are disabled by default.</aside>

## Why do we collect usage statistics?

We want to make Qdrant fast and reliable. To do this, we need to understand how it performs in real-world scenarios.
We do a lot of benchmarking internally, but it is impossible to cover all possible use cases, hardware, and configurations.

In order to identify bottlenecks and improve Qdrant, we need to collect information about how it is used.

Additionally, Qdrant uses a bunch of internal heuristics to optimize the performance.
To better set up parameters for these heuristics, we need to collect timings and counters of various pieces of code.
With this information, we can make Qdrant faster for everyone.


## What information is collected?

There are 3 types of information that we collect:

* System information - general information about the system, such as CPU, RAM, and disk type. As well as the configuration of the Qdrant instance.
* Performance - information about timings and counters of various pieces of code.
* Critical error reports - information about critical errors, such as backtraces, that occurred in Qdrant. This information would allow to identify problems nobody yet reported to us.

### We **never** collect the following information:

- User's IP address
- Any data that can be used to identify the user or the user's organization
- Any data, stored in the collections
- Any names of the collections
- Any URLs

## How do we anonymize data?

We understand that some users may be concerned about the privacy of their data.
That is why we make an extra effort to ensure your privacy.

There are several different techniques that we use to anonymize the data:

- We use a random UUID to identify instances. This UUID is generated on each startup and is not stored anywhere. There are no other ways to distinguish between different instances.
- We round all big numbers, so that the last digits are always 0. For example, if the number is 123456789, we will store 123456000.
- We replace all names with irreversibly hashed values. So no collection or field names will leak into the telemetry.
- All urls are hashed as well.

You can see exact version of anomymized collected data by accessing the [telemetry API](https://api.qdrant.tech/master/api-reference/service/telemetry) with `anonymize=true` parameter.

For example, <http://localhost:6333/telemetry?details_level=6&anonymize=true>


## Deactivate usage statistics

You can deactivate usage statistics by:

- setting the `QDRANT__TELEMETRY_DISABLED` environment variable to `true`
- setting the config option `telemetry_disabled` to `true` in the `config/production.yaml` or `config/config.yaml` files
- using cli option `--disable-telemetry`

Any of these options will prevent Qdrant from sending any usage statistics data.

If you decide to deactivate usage statistics, we kindly ask you to share your feedback with us in the [Discord community](https://qdrant.to/discord) or GitHub [discussions](https://github.com/qdrant/qdrant/discussions)

## Request information deletion

We provide an email address so that users can request the complete removal of their data from all of our tools.

To do so, send an email to privacy@qdrant.com containing the unique identifier generated for your Qdrant installation.
You can find this identifier in the telemetry API response (`"id"` field), or in the logs of your Qdrant instance.

Any questions regarding the management of the data we collect can also be sent to this email address.
