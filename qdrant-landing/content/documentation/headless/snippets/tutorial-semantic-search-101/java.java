package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.range;
import static io.qdrant.client.PointIdFactory.id;
import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ValueFactory.value;
import static io.qdrant.client.VectorFactory.vector;
import static io.qdrant.client.VectorsFactory.vectors;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.PayloadSchemaType;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Common.Range;
import io.qdrant.client.grpc.JsonWithInt.Value;
import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.PointStruct;
import io.qdrant.client.grpc.Points.QueryPoints;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

public class Snippet {

    public static void run() throws Exception {
        // @hide-start
        String QDRANT_URL = "";
        String QDRANT_API_KEY = "";
        // @hide-end
        // @block-start client-connection
        QdrantClient client =
            new QdrantClient(
                QdrantGrpcClient.newBuilder(QDRANT_URL, 6334, true)
                    .withApiKey(QDRANT_API_KEY)
                    .build());
        // @block-end client-connection

        // @block-start create-collection
        String COLLECTION_NAME = "my_books";

        client.createCollectionAsync(COLLECTION_NAME,
                VectorParams.newBuilder().setDistance(Distance.Cosine).setSize(384).build()).get();
        // @block-end create-collection

        // @block-start upload-data
        List<Map<String, Value>> payloads = List.of(
            Map.of(
                "name", value("The Time Machine"),
                "description", value("A man travels through time and witnesses the evolution of humanity."),
                "author", value("H.G. Wells"),
                "year", value(1895)),
            Map.of(
                "name", value("Ender's Game"),
                "description",
                    value("A young boy is trained to become a military leader in a war against an alien race."),
                "author", value("Orson Scott Card"),
                "year", value(1985)),
            Map.of(
                "name", value("Brave New World"),
                "description",
                    value(
                        "A dystopian society where people are genetically engineered and conditioned to conform to a strict social hierarchy."),
                "author", value("Aldous Huxley"),
                "year", value(1932)),
            Map.of(
                "name", value("The Hitchhiker's Guide to the Galaxy"),
                "description",
                    value(
                        "A comedic science fiction series following the misadventures of an unwitting human and his alien friend."),
                "author", value("Douglas Adams"),
                "year", value(1979)),
            Map.of(
                "name", value("Dune"),
                "description", value("A desert planet is the site of political intrigue and power struggles."),
                "author", value("Frank Herbert"),
                "year", value(1965)),
            Map.of(
                "name", value("Foundation"),
                "description",
                    value(
                        "A mathematician develops a science to predict the future of humanity and works to save civilization from collapse."),
                "author", value("Isaac Asimov"),
                "year", value(1951)),
            Map.of(
                "name", value("Snow Crash"),
                "description",
                    value("A futuristic world where the internet has evolved into a virtual reality metaverse."),
                "author", value("Neal Stephenson"),
                "year", value(1992)),
            Map.of(
                "name", value("Neuromancer"),
                "description",
                    value(
                        "A hacker is hired to pull off a near-impossible hack and gets pulled into a web of intrigue."),
                "author", value("William Gibson"),
                "year", value(1984)),
            Map.of(
                "name", value("The War of the Worlds"),
                "description", value("A Martian invasion of Earth throws humanity into chaos."),
                "author", value("H.G. Wells"),
                "year", value(1898)),
            Map.of(
                "name", value("The Hunger Games"),
                "description",
                    value("A dystopian society where teenagers are forced to fight to the death in a televised spectacle."),
                "author", value("Suzanne Collins"),
                "year", value(2008)),
            Map.of(
                "name", value("The Andromeda Strain"),
                "description", value("A deadly virus from outer space threatens to wipe out humanity."),
                "author", value("Michael Crichton"),
                "year", value(1969)),
            Map.of(
                "name", value("The Left Hand of Darkness"),
                "description",
                    value(
                        "A human ambassador is sent to a planet where the inhabitants are genderless and can change gender at will."),
                "author", value("Ursula K. Le Guin"),
                "year", value(1969)),
            Map.of(
                "name", value("The Three-Body Problem"),
                "description", value("Humans encounter an alien civilization that lives in a dying system."),
                "author", value("Liu Cixin"),
                "year", value(2008)));
        // @block-end upload-data

        // @block-start upload-points
        String EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2";

        List<PointStruct> points = new ArrayList<>();

        for (int idx = 0; idx < payloads.size(); idx++) {
            Map<String, Value> payload = payloads.get(idx);
            String description = payload.get("description").getStringValue();

            PointStruct point =
                PointStruct.newBuilder()
                    .setId(id((long) idx))
                    .setVectors(
                        vectors(
                            vector(
                                Document.newBuilder()
                                    .setText(description)
                                    .setModel(EMBEDDING_MODEL)
                                    .build())))
                    .putAllPayload(payload)
                    .build();

            points.add(point);
        }

        client.upsertAsync(COLLECTION_NAME, points).get();
        // @block-end upload-points

        // @block-start query-engine
        QueryPoints request =
            QueryPoints.newBuilder()
                .setCollectionName(COLLECTION_NAME)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("alien invasion")
                            .setModel(EMBEDDING_MODEL)
                            .build()))
                .setLimit(3)
                .build();

        var hits = client.queryAsync(request).get();

        for (var hit : hits) {
            System.out.println(hit.getPayloadMap() + " score: " + hit.getScore());
        }
        // @block-end query-engine

        // @block-start create-payload-index
        client
            .createPayloadIndexAsync(
                COLLECTION_NAME,
                "year",
                PayloadSchemaType.Integer,
                null,
                true,
                null,
                null)
            .get();
        // @block-end create-payload-index

        // @block-start query-with-filter
        QueryPoints filteredRequest =
            QueryPoints.newBuilder()
                .setCollectionName(COLLECTION_NAME)
                .setQuery(
                    nearest(
                        Document.newBuilder()
                            .setText("alien invasion")
                            .setModel(EMBEDDING_MODEL)
                            .build()))
                .setFilter(
                    Filter.newBuilder()
                        .addMust(range("year", Range.newBuilder().setGte(2000.0).build()))
                        .build())
                .setLimit(1)
                .build();

        var filteredHits = client.queryAsync(filteredRequest).get();

        for (var hit : filteredHits) {
            System.out.println(hit.getPayloadMap() + " score: " + hit.getScore());
        }
        // @block-end query-with-filter
    }
}
