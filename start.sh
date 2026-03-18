#!/usr/bin/env bash
set -e

# Install deps (skip dev deps for faster installs on panels)
npm install --omit=dev

# Start bot
npm start
