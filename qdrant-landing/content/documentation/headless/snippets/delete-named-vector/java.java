package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Points.DeleteVectorNameRequest;

public class Snippet {
	public static void run() throws Exception {
		// @hide-start
		QdrantClient client =
		    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
		// @hide-end

		client
		    .deleteVectorNameAsync(
		        DeleteVectorNameRequest.newBuilder()
		            .setCollectionName("{collection_name}")
		            .setVectorName("{vector_name}")
		            .build())
		    .get();
	}
}
