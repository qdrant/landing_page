package com.example.snippets_amalgamation;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.QueryPoints;
import io.qdrant.client.grpc.Points.ReadConsistency;
import io.qdrant.client.grpc.Points.ReadConsistencyType;
import io.qdrant.client.grpc.Points.SearchParams;

import static io.qdrant.client.QueryFactory.nearest;
import static io.qdrant.client.ConditionFactory.matchKeyword;

public class Snippet {
	public static void run() throws Exception {
		// @hide-start
		QdrantClient client =
		    new QdrantClient(QdrantGrpcClient.newBuilder("localhost", 6334, false).build());
		// @hide-end

		client.queryAsync(
		        QueryPoints.newBuilder()
		                .setCollectionName("{collection_name}")
		                .setFilter(Filter.newBuilder().addMust(matchKeyword("city", "London")).build())
		                .setQuery(nearest(.2f, 0.1f, 0.9f, 0.7f))
		                .setParams(SearchParams.newBuilder().setHnswEf(128).setExact(false).build())
		                .setLimit(3)
		                .setReadConsistency(
		                        ReadConsistency.newBuilder().setType(ReadConsistencyType.Majority).build())
		                .build())
		        .get();
	}
}
