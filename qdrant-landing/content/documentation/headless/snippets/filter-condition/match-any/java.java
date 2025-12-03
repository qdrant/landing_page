package com.example.snippets_amalgamation;

import static io.qdrant.client.ConditionFactory.matchKeywords;

import java.util.List;

public class Snippet {
        public static void run() throws Exception {
                matchKeywords("color", List.of("black", "yellow"));
        }
}
