```java
import static io.qdrant.client.ConditionFactory.match;
import static io.qdrant.client.ConditionFactory.matchKeyword;
import static io.qdrant.client.WithPayloadSelectorFactory.enable;

import io.qdrant.client.QdrantClient;
import io.qdrant.client.QdrantGrpcClient;
import io.qdrant.client.grpc.Common.Filter;
import io.qdrant.client.grpc.Points.*;

QdrantClient client =

client
    .queryAsync(
        QueryPoints.newBuilder()
            .setCollectionName("{collection_name}")
            .setQuery(
                Query.newBuilder()
                    .setText(TextQuery.newBuilder().setQuery("time travel").build())
                    .build())
            .setUsing("title")
            .setFilter(
                Filter.newBuilder()
                    .addMust(matchKeyword("group_id", "user_1"))
                    .addMust(match("year", 2024))
                    .build())
            .setParams(
                SearchParams.newBuilder()
                    .setIdf(
                        IdfParams.newBuilder()
                            .setCorpus(
                                Filter.newBuilder()
                                    .addMust(matchKeyword("group_id", "user_1"))
                                    .build())
                            .build())
                    .build())
            .setLimit(10)
            .setWithPayload(enable(true))
            .build())
    .get();
```
