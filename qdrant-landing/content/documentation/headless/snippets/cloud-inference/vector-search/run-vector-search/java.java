package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.fusion;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.Query;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.TextQuery;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                String queryText = "{query_text}";
                String denseModel = "{dense_model_name}";
                // @hide-end

                PrefetchQuery densePrefetch =
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
                        .setUsing("dense_vector")
                        .build();

                PrefetchQuery bm25Prefetch =
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            Query.newBuilder()
                                .setText(TextQuery.newBuilder().setQuery(queryText).build())
                                .build())
                        .setUsing("passage_text")
                        .build();

                QueryPoints request =
                    QueryPoints.newBuilder()
                        .setCollectionName("{collection_name}")
                        .addPrefetch(densePrefetch)
                        .addPrefetch(bm25Prefetch)
                        .setQuery(fusion(Fusion.RRF))
                        .setLimit(5)
                        .build();

                client.queryAsync(request).get();
        }
}
