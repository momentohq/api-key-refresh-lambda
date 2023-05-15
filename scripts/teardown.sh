#!/usr/bin/env bash
set -ex

pushd infrastructure/
  npx cdk destroy momento-auth-token-refresh-stack
popd