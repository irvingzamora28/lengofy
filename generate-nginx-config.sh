#!/bin/sh

# Get the directory of the script
SCRIPT_DIR="$(dirname "$0")"

# Print the directory for debugging
echo "Script directory: $SCRIPT_DIR"

# Check if SERVER_NAME is provided
if [ -z "$1" ]; then
  echo "No SERVER_NAME provided. Exiting."
  exit 1
fi

# Use the known relative path to the template file from the project root
envsubst '${SERVER_NAME}' < "$SCRIPT_DIR/nginx/default.conf.template" > "$SCRIPT_DIR/nginx/default.conf"
