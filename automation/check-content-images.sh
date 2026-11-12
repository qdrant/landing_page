#!/bin/bash

# Check that image references in blog and article front matter point at files
# that exist in qdrant-landing/static. Runs on every PR (see
# .github/workflows/check-content-images.yml).

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

ROOT=$(realpath "$DIR/..")

STATIC_FOLDER="$ROOT/qdrant-landing/static"

IMAGE_KEYS="preview_image social_preview_image title_preview_image small_preview_image"

# Files that automation/process-img.sh writes to <slug>/preview/
GENERATED_FILES="social_preview.jpg title.jpg title.webp preview.jpg preview.webp"

# Files the article templates load from preview_dir
PREVIEW_DIR_FILES="title.jpg title.webp preview.jpg"

ERRORS=0

function report_error() {
    echo "::error file=$1::$2"
    ERRORS=$((ERRORS + 1))
}

function get_front_matter() {
    # Hugo accepts trailing whitespace on the --- delimiters
    awk 'NR == 1 && !/^---[ \t]*$/ { exit } NR > 1 && /^---[ \t]*$/ { exit } NR > 1 { print }' "$1"
}

function get_value() {
    local key=$1
    local front_matter=$2
    local value=$(echo "$front_matter" | grep -m 1 "^$key:" | sed "s/^$key: *//")

    # Remove comments, surrounding whitespace, and surrounding quotes
    value=$(echo "$value" | sed -e 's/#.*//' -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')
    value=$(echo "$value" | sed -e 's/^["'"'"']//' -e 's/["'"'"']$//')

    echo "$value"
}

function static_file_exists() {
    [ -f "$STATIC_FOLDER/${1#/}" ]
}

function has_source_extension() {
    [[ "$1" =~ \.(png|jpg|jpeg)$ ]]
}

function check_file() {
    local file=$1
    local front_matter
    front_matter=$(get_front_matter "$file")

    if [ "$(get_value draft "$front_matter")" == "true" ]; then
        return
    fi

    local rel_path=${file#"$ROOT/"}
    local is_blog=false
    [[ "$rel_path" == qdrant-landing/content/blog/* ]] && is_blog=true

    local preview_image=$(get_value preview_image "$front_matter")
    local social_preview_image=$(get_value social_preview_image "$front_matter")

    # Mirror automation/gen-all-blogs-previews.sh: it skips posts with an existing
    # social_preview_image, and otherwise generates previews from preview_image.
    local generator_runs=false
    if [ "$is_blog" == "true" ] && [ -n "$preview_image" ] \
        && ! { [ -n "$social_preview_image" ] && static_file_exists "$social_preview_image"; }; then
        if static_file_exists "$preview_image" && ! has_source_extension "$preview_image"; then
            report_error "$rel_path" "preview_image $preview_image must be png, jpg, or jpeg (required by automation/process-img.sh)"
        elif static_file_exists "$preview_image"; then
            generator_runs=true
        fi
    fi

    local slug=$(get_value slug "$front_matter")
    if [ -z "$slug" ]; then
        slug=$(basename "$file" .md)
    fi

    for key in $IMAGE_KEYS; do
        local value=$(get_value "$key" "$front_matter")
        if [ -z "$value" ] || static_file_exists "$value"; then
            continue
        fi

        # Files that update-blog-preview-images generates after merge
        if [ "$generator_runs" == "true" ]; then
            local generated=false
            for name in $GENERATED_FILES; do
                [ "${value#/}" == "blog/$slug/preview/$name" ] && generated=true
            done
            [ "$generated" == "true" ] && continue
        fi

        report_error "$rel_path" "$key $value does not exist in qdrant-landing/static"
    done

    local preview_dir=$(get_value preview_dir "$front_matter")
    if [ -n "$preview_dir" ]; then
        for name in $PREVIEW_DIR_FILES; do
            if ! static_file_exists "${preview_dir%/}/$name"; then
                report_error "$rel_path" "preview_dir $preview_dir has no $name"
            fi
        done
    fi
}

while IFS= read -r -d '' file; do
    check_file "$file"
done < <(find "$ROOT/qdrant-landing/content/blog" "$ROOT/qdrant-landing/content/articles" -name '*.md' -print0 | sort -z)

if [ "$ERRORS" -gt 0 ]; then
    echo
    echo "Found $ERRORS broken image reference(s). Commit the missing images or fix the paths in the front matter."
    exit 1
fi

echo "All image references in blog and article front matter resolve."
