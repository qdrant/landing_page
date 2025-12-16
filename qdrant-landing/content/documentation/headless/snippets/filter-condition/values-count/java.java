package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.valuesCount;

import io.qdrant.client.grpc.Common.ValuesCount;

public class Snippet {
        public static void run() throws Exception {
                valuesCount("comments", ValuesCount.newBuilder().setGt(2).build());
        }
}
