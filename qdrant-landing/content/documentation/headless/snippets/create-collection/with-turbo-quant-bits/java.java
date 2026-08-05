package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.CreateCollection;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Collections.Memory;
import io.qdrant.client.grpc.Collections.QuantizationConfig;
import io.qdrant.client.grpc.Collections.TurboQuantBitSize;
import io.qdrant.client.grpc.Collections.TurboQuantization;
import io.qdrant.client.grpc.Collections.VectorParams;
import io.qdrant.client.grpc.Collections.VectorsConfig;

public class Snippet {
	public static void run() throws Exception {
		// @hide-start
		QdrantClient client =
		    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
		// @hide-end

		client
		    .createCollectionAsync(
		        CreateCollection.newBuilder()
		            .setCollectionName("{collection_name}")
		            .setVectorsConfig(
		                VectorsConfig.newBuilder()
		                    .setParams(
		                        VectorParams.newBuilder()
		                            .setSize(1536)
		                            .setDistance(Distance.Cosine)
		                            .build())
		                    .build())
		            .setQuantizationConfig(
		                QuantizationConfig.newBuilder()
		                    .setTurboquant(
		                        TurboQuantization.newBuilder()
		                            .setMemory(Memory.Pinned)
		                            .setBits(TurboQuantBitSize.Bits2)
		                            .build())
		                    .build())
		            .build())
		    .get();
	}
}
