#!/usr/bin/env bash
set -ex

npm install && npm run build

pushd infrastructure/
  npm install
  npm run build
  npx cdk deploy momento-auth-token-refresh-stack --require-approval never
popd