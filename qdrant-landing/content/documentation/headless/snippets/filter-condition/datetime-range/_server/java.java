package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.datetimeRange;

import com.google.protobuf.Timestamp;
import io.qdrant.client.grpc.Common.DatetimeRange;
import java.time.Instant;

public class Snippet {
        public static void run() throws Exception {
                long gt = Instant.parse("2023-02-08T10:49:00Z").getEpochSecond();
                long lte = Instant.parse("2024-01-31T10:14:31Z").getEpochSecond();

                datetimeRange("date",
                    DatetimeRange.newBuilder()
                        .setGt(Timestamp.newBuilder().setSeconds(gt))
                        .setLte(Timestamp.newBuilder().setSeconds(lte))
                        .build());
        }
}
