#!/usr/bin/env bash

# note: any output from this script will be used by nova's language server, so it'll break functionality

cd "$WORKSPACE_DIR"

# symlinks have issues when the extension is submitted to the library, so we don't use node_modules/.bin

node \
  "$INSTALL_DIR/node_modules/@astrojs/language-server/bin/server.js" \
  --stdio \
