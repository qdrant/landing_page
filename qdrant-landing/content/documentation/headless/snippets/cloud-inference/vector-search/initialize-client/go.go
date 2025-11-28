package snippet

import "github.com/qdrant/go-client/qdrant"

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.cloud-region.cloud-provider.cloud.qdrant.io",
		Port:   6334,
		APIKey: "<paste-your-api-key-here>",
		UseTLS: true,
	})

	if err != nil { panic(err) } // @hide
	_ = client // @hide
}
