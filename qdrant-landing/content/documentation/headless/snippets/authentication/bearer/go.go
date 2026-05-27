package snippet

import (
	"github.com/qdrant/go-client/qdrant"
)

func Main() {
	client, err := qdrant.NewClient(&qdrant.Config{
		Host:   "xyz-example.eu-central.aws.cloud.qdrant.io",
		Port:   6334,
		UseTLS: true,
		Headers: map[string]string{
			"authorization": "Bearer your_token_here",
		},
	})

	if err != nil { panic(err) } // @hide
	_ = client                   // @hide
}
