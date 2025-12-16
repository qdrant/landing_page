import requests


def prepare() -> None:
    cleanup()


def check() -> None:
    response = requests.get("http://127.0.0.1:6333/collections/collection_name")
    response.raise_for_status()
    result = response.json()
    assert result["result"]["config"]["params"]["vectors"]["size"] == 100


def cleanup() -> None:
    requests.delete("http://127.0.0.1:6333/collections/collection_name")
