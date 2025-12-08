package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchTextAny;

public class Snippet {
        public static void run() throws Exception {
                matchTextAny("description", "good cheap");
        }
}
