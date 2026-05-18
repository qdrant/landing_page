---
draft: false
title: "How Sunny Health Built an AI Healthcare Concierge with Qdrant"
short_description: "See how Sunny Health's AI healthcare concierge uses Qdrant."
description: "Discover how Sunny Health built an AI healthcare concierge on Qdrant, combining hybrid search, geo re-ranking, and a flexible payload model to match members to in-network providers across a corpus of three to four million records."
preview_image: /blog/case-study-sunny-health-ai/social-preview-sunny-health.png
social_preview_image: /blog/case-study-sunny-health-ai/social-preview-sunny-health.png
date: 2026-05-15
author: "Daniel Azoulai"
featured: false

tags:
- Sunny Health AI
- vector search
- hybrid search
- payload filtering
- geo search
- healthcare
- agentic AI
- provider matching
- case study
---

![summary](/blog/case-study-sunny-health-ai/bento-box-sunny-health.png)

Most people don't read their insurance pamphlet. The benefits are there: deductibles, copays, in-network providers, what dental covers, what dermatology covers, when an optometry visit is included in the medical plan. But the document is dense, the website is worse, and the result is that patients pay for plans they barely understand and delay care because finding an in-network provider with availability takes more energy than they have.

Sunny Health is building a healthcare concierge that insurance companies and care providers offer to their members as part of the existing plan experience. When a member signs in (typically through SSO from their payer), Sunny Health already knows who they are and what their plan covers. They land in a chat experience where they can ask "show me dermatologists nearby," get matched to in-network options, and have Sunny Health book the appointment on their behalf. Three things on one retrieval layer: benefits navigation, provider matching, and appointment booking.

>"We're essentially looking to take the mental load of navigating all of that and give it to an agent." — Nikolas Yanek-Chrones, Chief Technology Officer, Sunny Health

Sunny Health distributes through payers and care providers, who plug the concierge into the experience their members already get.

>"People are already paying for insurance. They don't see the value in paying monthly for something on top of it. The goal now is targeting the payers and the providers." — Nikhil Karnik, Founding Engineer, Sunny Health  
	  
Behind any of those distribution surfaces sits the same engineering challenge: matching a specific member with specific benefits to a specific provider with the right network status, license, language, location, and specialty. That challenge is what brought the team to Qdrant.

## Why Postgres and fuzzy matching ran out of room

Sunny Health started where most teams start: Postgres. It worked for the first iteration. Then two things changed.

The first was scale. The team carries a corpus of three to four million providers, each with addresses, specialties, identifiers, and accepted insurances. A separate set of insurance plan records compounds it. The volume of insurances alone became burdensome to manage in Postgres.

The second was schema. Provider data is dense and growing. The team is constantly adding new fields they want patients to be able to search on: language coverage, parking accessibility, gender, years of practice, veteran status, wheelchair-accessible facilities. A rigid relational schema slowed every one of those additions, and the differentiator for Sunny Health is exactly the depth of metadata they can offer search against.

>*We want to be accelerating the amount of information that we're able to stuff into these providers." — Nikolas Yanek-Chrones, Chief Technology Officer, Sunny Health

For provider matching specifically, the team had also been leaning on fuzzy string matching. That worked for simple lookups but broke as soon as patient queries got specific. A patient asking for a female pediatric dentist with thirty years of experience near a specific cross street in San Francisco doesn't match on string distance. Patient demands are precise, and so is the metadata.

On top of all of it, healthcare introduces filters that cannot be ranked around. If a doctor isn't in network, isn't licensed in the patient's state, or doesn't speak the patient's language, they cannot appear in results. Period.

>"Hybrid for us is non-negotiable. Network adequacy, licenses, language: these are hard filters in healthcare. They're not options you can rank around. When the vector database can express a 'must' alongside a 'similar to' in a single query, that's the difference between a usable system and one you can't use at all." — Nikhil Karnik, Founding Engineer, Sunny Health

## Why Sunny Health chose Qdrant

The team's CTO had been writing Rust since college and wasn't going to put a Python-wrapped vector engine on the critical path of patient care. Qdrant being built in Rust from the storage layer up was the entry condition. From there, four capabilities sealed the decision.

The first was hybrid search. Healthcare matching needs hard filters and similarity ranking expressed in the same query. Qdrant lets the team filter on must-conditions (in-network, license valid, language match) and rank within the filtered set by semantic similarity to what the patient described.

The second was first-class geo re-ranking. Distance is the tiebreaker in care matching, and patients ask for providers near specific intersections, not just zip codes.

>Doing distance matching in care matching, in the database, in the same call as the vector and filter stage, is really important to us. It's one of the things that pushed us to Qdrant specifically. — Nikhil Karnik, Founding Engineer, Sunny Health

The third was the flexible JSON payload model. Provider records are deeply nested with specialties, certifications, multiple locations, organizations, education history, and accepted insurances. Forcing a flattened schema would mean either losing fidelity or building an external catalog lookup, both of which add latency and complexity.

>"Qdrant has a very flexible JSON payload model. Our provider records are long and nested: specialties, certifications, multiple locations, organizations, education, insurances. The flexible payload model fits us without forcing a flattened schema or an external catalog lookup." — Nikhil Karnik, Founding Engineer, Sunny Health

The fourth was developer ergonomics. The team is a Rust shop, and Qdrant shipped a first-class Rust client they didn't have to build themselves. Nikhil also called out the Qdrant MCP tool as a development accelerator: "I found that amazing. It sped up a lot of my time."

## What changed after the migration

The Sunny Health team migrated their core retrieval workload off Postgres into Qdrant. The first phase replicated their existing payload filtering logic in Qdrant syntax, which let them validate parity before introducing vectors. The second phase added vector search on top of those filters for provider matching, with hard filters expressing healthcare's must-conditions and similarity ranking handling the parts of patient queries that fuzzy matching never could.

*\[METRIC TO CONFIRM: latency or accuracy improvement vs. the prior approach.\]*

What's clear from the team's framing is the qualitative shift. A query like "female pediatric dentist with thirty years of experience, in network for Guardian, near Cass Street, with parking" now resolves in a single round trip: Qdrant applies the must-filters, ranks by similarity, and re-ranks by distance, all in one query.

>"Metadata filtering is huge. When customers' demands are very specific (this location, parking accessible, female doctor, thirty years of experience), the vector search in Qdrant has been the most useful for that. A fuzzy match will never solve that problem." — Nikhil Karnik, Founding Engineer, Sunny Health

For the AI calling agent, accuracy weighs more than raw speed. A wrong match doesn't just degrade UX, it produces real-world harm: misrouted patients, surprise bills, no-show charges. Qdrant's accuracy under filtered, geo-ranked queries is what gives the team confidence to put this matching logic on the critical path of an automated booking flow.

## How it works in production

Sunny Health runs Qdrant as the retrieval layer for two things today: provider records and a smaller insurance plan corpus that powers fast lookups when patients type in their own insurance during onboarding. Provider data is organized as a single collection of points, where each provider's payload carries the full nested record including all locations, specialties, accepted insurances, and operational details.

Patient queries enter from two surfaces. The chat-based concierge experience translates user intent into structured Qdrant queries combining payload filters, similarity, and geo. The voice agent, which calls real doctor's offices to book appointments, hits the same backend mid-call to fetch patient context, parsed benefits, and matched providers. The voice stack is a mix of providers (Twilio, Vapi, Telnyx) chosen per call type, but Qdrant sits at the center of the retrieval path.

![diagram](/blog/case-study-sunny-health-ai/diagram-sunny-health.png)

## What's next

Three workloads are queued up for Qdrant.

The first is insurance carrier matching. When a patient uploads their insurance card or types in a plan name, Sunny Health needs to match what they entered to a specific plan in the database. The variation is enormous: Anthem Blue Cross, Blue Shield of California, Blue Shield of Nevada, and dozens more carry overlapping naming conventions but different benefit structures. A mismatch here means every downstream recommendation is wrong. Vector search over the insurance corpus is the obvious fit.

The second is semantic specialty mapping and richer metadata. Patients describe symptoms, not specialties. "I have a skin rash" should match dermatology and primary care. Provider attributes that aren't easy to filter against (veteran status, wheelchair accessibility, languages spoken, scheduling style) become first-class search inputs once they're vectorized.

The third is memory for the agent. The team is exploring Qdrant as the long-term memory layer that lets the concierge keep context across conversations. A patient who booked an appointment last month should be able to come back, ask "what was that appointment again," and get a coherent answer instead of starting from scratch.

The team is also tracking new Qdrant capabilities relevant to their stack: GPU-accelerated indexing for faster reindexing as provider data grows, audit logging for HIPAA-aligned compliance posture, and Multi-AZ deployment for higher availability.

## From rigid schema to composable retrieval

Sunny Health's bet is that benefits navigation, provider matching, and appointment booking can be automated end to end so patients stop reading pamphlets and start getting care. That bet only works if the retrieval layer underneath it can express healthcare's real constraints: hard filters that cannot bend, geo-ranking that respects how patients actually search for care, and provider records dense enough to capture the dozens of metadata fields that determine whether a match is acceptable. Qdrant gave them that layer in a single query, with a schema flexible enough to keep adding to.

