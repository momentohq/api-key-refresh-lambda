#!/usr/bin/env bash
set -ex

pushd lambda/
  npm install
  npm run build
popd

pushd infrastructure/
  npm install
  npm run build
  npx cdk deploy momento-auth-token-refresh-stack --require-approval never
popd