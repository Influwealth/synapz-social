#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy_mainnet.sh — Deploy SynapZ-Social canisters to ICP mainnet
# Requires: dfx identity with cycles wallet funded
# ─────────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")/.."

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SynapZ-Social — ICP MAINNET DEPLOY"
echo "  Network: ic"
echo "  Identity: $(dfx identity whoami)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
read -p "⚠ This will spend cycles. Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then echo "Aborted."; exit 0; fi

echo "▶ Deploying to ICP mainnet..."
dfx deploy --network ic social_graph
dfx deploy --network ic content_feed
dfx deploy --network ic creator_economy
dfx deploy --network ic moderation
dfx deploy --network ic media_registry

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  MAINNET DEPLOY COMPLETE"
echo "  Save canister_ids.json to secure storage"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat canister_ids.json
