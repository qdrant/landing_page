package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Collections.Distance;
import io.qdrant.client.grpc.Points.CreateVectorNameRequest;
import io.qdrant.client.grpc.Points.DenseVectorCreationConfig;

public class Snippet {
	public static void run() throws Exception {
		// @hide-start
		QdrantClient client =
		    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
		// @hide-end

		client
		    .createVectorNameAsync(
		        CreateVectorNameRequest.newBuilder()
		            .setCollectionName("{collection_name}")
		            .setVectorName("{vector_name}")
		            .setDenseConfig(
		                DenseVectorCreationConfig.newBuilder()
		                    .setSize(256)
		                    .setDistance(Distance.Cosine)
		                    .build())
		            .build())
		    .get();
	}
}
