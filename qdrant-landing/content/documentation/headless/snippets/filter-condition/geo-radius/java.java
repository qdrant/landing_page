package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.geoRadius;

public class Snippet {
        public static void run() throws Exception {
                geoRadius("location", 52.520711, 13.403683, 1000.0f);
        }
}
