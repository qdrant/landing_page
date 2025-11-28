package com.example.snippets_amalgamation;

public class Snippet {
        public static void run() throws Exception {
                client.deleteAliasAsync("production_collection").get();
                client.createAliasAsync("production_collection", "example_collection").get();
        }
}
