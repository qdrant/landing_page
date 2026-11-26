package snippet

import (
	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.qdrant.io",
		Port:   6334,
		APIKey: "<your-api-key>",
		UseTLS: true,
	})
	if err != nil {
		panic(err)
	}
	defer client.Close()
}
