package main

import (
	"fmt"
	_ "github.com/qdrant/go-client/qdrant"
	"os"
	// %imports%
)

func main() {
	for _, arg := range os.Args[1:] {
		switch arg {
		// %cases%
		default:
			fmt.Printf("Unknown argument: %s\n", arg)
			os.Exit(1)
		}
	}
}
