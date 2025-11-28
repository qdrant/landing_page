package com.example.snippets_amalgamation;

public class Snippet {
        public static void run() throws Exception {
                client.collectionExistsAsync("{collection_name}").get();
        }
}
