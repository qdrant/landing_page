package com.example.snippets_amalgamation;

public class Snippet {
        public static void run() throws Exception {
                client.deleteCollectionAsync("{collection_name}").get();
        }
}
