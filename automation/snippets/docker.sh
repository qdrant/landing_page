#!/usr/bin/env sh

set -e

IMAGE_NAME="snippet-checker"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

REPO_ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

# check if on macos

if ! docker image inspect "$IMAGE_NAME" > /dev/null 2>&1; then
	# TODO: comment why
	[ "$(uname)" != Darwin ] || export DOCKER_DEFAULT_PLATFORM=linux/amd64
	docker build -t "$IMAGE_NAME" "$SCRIPT_DIR/docker"
fi

[ $# -ne 0 ] || set -- bash

[ -t 0 ] && TTY_FLAG=--tty || TTY_FLAG=

docker run \
	--rm \
	--interactive \
	$TTY_FLAG \
	--network host \
	--user "$(id -u):$(id -g)" \
	--volume "$REPO_ROOT_DIR:/workspace" \
	"$IMAGE_NAME" \
	uv run "$@"
