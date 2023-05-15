#!/usr/bin/env bash
set -ex

pushd lambda/
  npm install
  npm run build
  npm run test
popd

pushd infrastructure/
  npm install
  npm run build
popd