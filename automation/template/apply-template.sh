#!/bin/bash

# Path to the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

OUTPUT_PATH=${OUTPUT_PATH:-"$SCRIPT_DIR/output.png"}

export MAGICK_FONT_PATH=$SCRIPT_DIR/fonts

SUBTITLE_TEXT=${SUBTITLE_TEXT:-""}

if [ -z "$SUBTITLE_TEXT" ]; then
    echo "No subtitle text provided"
    exit 1
fi

TITLE_TEXT=${TITLE_TEXT:-""}

if [ -z "$TITLE_TEXT" ]; then
    echo "No title text provided"
    exit 1
fi

SUBTITLE_TEXT_COMMAND="text 64,239 '$SUBTITLE_TEXT'"
SUBTITLE_SIZE=48

BACKGROUND_PATH=${BACKGROUND_PATH:-""}

if [ -z "$BACKGROUND_PATH" ]; then

    BACKGROUNDS=(a b c d e f g h i j k)

    RANDOM_BACKGROUND=${BACKGROUNDS[$RANDOM % ${#BACKGROUNDS[@]} ]}

    TEMPLATE_PATH="$SCRIPT_DIR/backgrounds/bg_${RANDOM_BACKGROUND}.png"

    convert $TEMPLATE_PATH -font "RobotoMonoM" -fill '#F2F6FF' -density 72 -pointsize $SUBTITLE_SIZE -draw "$SUBTITLE_TEXT_COMMAND" $OUTPUT_PATH

    convert $OUTPUT_PATH \
        -interline-spacing 0 \
        -font "RobotoB" \
        -fill '#F2F6FF' \
        -size 640x \
        -density 72 \
        -pointsize 80 \
        -background none \
        caption:"$TITLE_TEXT" \
        -geometry '+64+280' \
        -composite \
        $OUTPUT_PATH
else
    TEMPLATE_PATH="$SCRIPT_DIR/backgrounds/empty.png"

    echo $MAGICK_FONT_PATH

    convert $TEMPLATE_PATH -font "RobotoMonoM" -fill '#F2F6FF' -density 72 -pointsize $SUBTITLE_SIZE -draw "$SUBTITLE_TEXT_COMMAND" $OUTPUT_PATH

    convert $OUTPUT_PATH \
        -interline-spacing 0 \
        -font "RobotoB" \
        -fill '#F2F6FF' \
        -size 640x \
        -density 72 \
        -pointsize 80 \
        -background none \
        caption:"$TITLE_TEXT" \
        -geometry '+64+280' \
        -composite \
        $OUTPUT_PATH

    convert $BACKGROUND_PATH $OUTPUT_PATH -gravity center -resize '1280x640' -composite $OUTPUT_PATH
fi


