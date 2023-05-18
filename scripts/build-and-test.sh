#!/usr/bin/env bash
set -ex

pushd lambda/
  npm ci
  node -v
  npm run build
  npm run lint
  npm run test
popd

pushd infrastructure/
  npm install
  npm run build
popd