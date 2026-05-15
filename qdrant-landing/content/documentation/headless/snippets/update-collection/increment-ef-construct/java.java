package com.example.snippets_amalgamation;

import io.qdrant.client.grpc.Collections.CollectionInfo;
import io.qdrant.client.grpc.Collections.HnswConfigDiff;
import io.qdrant.client.grpc.Collections.UpdateCollection;

public class Snippet {
        public static void run() throws Exception {
                // @hide-start
                io.qdrant.client.QdrantClient client =
                    new io.qdrant.client.QdrantClient(io.qdrant.client.QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
                // @hide-end

                // @block-start get-current-value
                CollectionInfo collectionInfo = client.getCollectionInfoAsync("{collection_name}").get();
                long baseEf = collectionInfo.getConfig().getHnswConfig().getEfConstruct();
                // @block-end get-current-value

                // @block-start update-collection
                client
                    .updateCollectionAsync(
                        UpdateCollection.newBuilder()
                            .setCollectionName("{collection_name}")
                            .setHnswConfig(
                                HnswConfigDiff.newBuilder()
                                    .setEfConstruct(baseEf + 1)
                                    .build())
                            .build())
                    .get();
                // @block-end update-collection
        }
}
