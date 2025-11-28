package com.example.snippets_amalgamation;

import static io.qdrant.client.QueryFactory.fusion;
import static io.qdrant.client.QueryFactory.nearest;

import io.qdrant.client.grpc.Points.Document;
import io.qdrant.client.grpc.Points.Fusion;
import io.qdrant.client.grpc.Points.PrefetchQuery;
import io.qdrant.client.grpc.Points.QueryPoints;

public class Snippet {
        public static void run() throws Exception {
                PrefetchQuery densePrefetch =
                    PrefetchQuery.newBuilder()
                        .setQuery(
                            nearest(Document.newBuilder().setText(queryText).setModel(denseModel).build()))
                        .setUsing("dense_vector")
                        .build();

                PrefetchQuery bm25Prefetch =
                    PrefetchQuery.newBuilder()
                        .setQuery(nearest(Document.newBuilder().setText(queryText).setModel(bm25Model).build()))
                        .setUsing("bm25_sparse_vector")
                        .build();

                QueryPoints request =
                    QueryPoints.newBuilder()
                        .setCollectionName("{collection_name}")
                        .addPrefetch(densePrefetch)
                        .addPrefetch(bm25Prefetch)
                        .setQuery(fusion(Fusion.RRF))
                        .build();

                client.queryAsync(request).get();
        }
}
