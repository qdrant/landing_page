package snippet

import (
	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.eu-central.aws.cloud.qdrant.io",
		Port:   6334,
		APIKey: "your_api_key_here",
		UseTLS: true,
	})

	if err != nil { panic(err) } // @hide
	_ = client                   // @hide
}
