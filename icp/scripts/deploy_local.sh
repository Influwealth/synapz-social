#!/bin/bash
# ─────────────────────────────────────────────────────────────
# deploy_local.sh — Deploy all SynapZ-Social canisters locally
# InfluWealth Quantum Labs | WealthBridge OS
# ─────────────────────────────────────────────────────────────
set -e

cd "$(dirname "$0")/.."

echo "▶ Starting local ICP replica..."
dfx start --background --clean

echo "▶ Deploying canisters to local replica..."
dfx deploy social_graph
dfx deploy content_feed
dfx deploy creator_economy
dfx deploy moderation
dfx deploy media_registry

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  SynapZ-Social — Local Deploy Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
dfx canister status social_graph
dfx canister status content_feed
dfx canister status creator_economy
dfx canister status moderation
dfx canister status media_registry
echo ""
echo "Candid UI: http://127.0.0.1:4943/?canisterId=<ID>"
