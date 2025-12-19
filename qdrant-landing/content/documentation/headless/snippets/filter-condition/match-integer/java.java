package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.match;

public class Snippet {
        public static void run() throws Exception {
                match("count", 0);
        }
}
