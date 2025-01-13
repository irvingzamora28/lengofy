#!/bin/sh

# Get the directory of the script
SCRIPT_DIR="$(dirname "$0")"

# Use the correct path to the template file
envsubst '${SERVER_NAME}' < "$SCRIPT_DIR/../nginx/default.conf.template" > "$SCRIPT_DIR/../nginx/default.conf"
