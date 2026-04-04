// ─────────────────────────────────────────────────────────────
// creator_economy — ICP Canister
// SynapZ Social | InfluWealth Quantum Labs | SAP v1.0
//
// Stores: creator tiers, memberships, engagement metrics, payouts
// Scoring fed by SynapZ-Core Meta-Unit (creator scoring capsule)
// ─────────────────────────────────────────────────────────────

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Option "mo:base/Option";

actor CreatorEconomy {

  // ── Types ──────────────────────────────────────────────────
  public type CreatorTier = {
    #Free;
    #Rising;      // emerging creator
    #Pro;         // verified monetizing creator
    #Sovereign;   // top tier — full WealthBridge OS integration
  };

  public type TierData = {
    tier           : CreatorTier;
    monthlyTarget  : Nat;   // USD cents
    revenueShare   : Nat;   // basis points (e.g. 7000 = 70%)
    capsuleAccess  : [Text];
    verifiedAt     : Int;
  };

  public type EngagementMetrics = {
    views        : Nat;
    watchTimeMs  : Nat;
    likes        : Nat;
    comments     : Nat;
    shares       : Nat;
    followers    : Nat;
    updatedAt    : Int;
  };

  public type PayoutEntry = {
    amount     : Nat;   // USD cents
    currency   : Text;  // "USD" | "WUSD" | "GRN-USD"
    period     : Text;  // "2026-03"
    status     : Text;  // "pending" | "paid" | "failed"
    createdAt  : Int;
  };

  public type CreatorProfile = {
    principal  : Principal;
    tier       : TierData;
    metrics    : EngagementMetrics;
    payouts    : [PayoutEntry];
    quditScore : Nat;   // 0–1000, set by SynapZ-Core Meta-Unit
    updatedAt  : Int;
  };

  // ── State ──────────────────────────────────────────────────
  private var creators : HashMap.HashMap<Principal, CreatorProfile> = HashMap.HashMap(64, Principal.equal, Principal.hash);

  // ── Creator Tier ───────────────────────────────────────────
  public shared(msg) func set_creator_tier(tierData: TierData) : async { ok: Bool } {
    let p = msg.caller;
    let existing = creators.get(p);
    let profile = switch (existing) {
      case (?cp) {
        { principal = cp.principal; tier = tierData; metrics = cp.metrics;
          payouts = cp.payouts; quditScore = cp.quditScore; updatedAt = Time.now() }
      };
      case null {
        { principal = p; tier = tierData;
          metrics = { views = 0; watchTimeMs = 0; likes = 0; comments = 0;
                      shares = 0; followers = 0; updatedAt = Time.now() };
          payouts = []; quditScore = 0; updatedAt = Time.now() }
      };
    };
    creators.put(p, profile);
    { ok = true }
  };

  public query func get_creator_tier(p: Principal) : async ?TierData {
    switch (creators.get(p)) {
      case (?cp) { ?cp.tier };
      case null  { null };
    }
  };

  // ── Engagement ─────────────────────────────────────────────
  public shared func record_engagement(creator: Principal, delta: EngagementMetrics) : async { ok: Bool } {
    switch (creators.get(creator)) {
      case null { { ok = false } };
      case (?cp) {
        let m = cp.metrics;
        let updated : EngagementMetrics = {
          views       = m.views       + delta.views;
          watchTimeMs = m.watchTimeMs + delta.watchTimeMs;
          likes       = m.likes       + delta.likes;
          comments    = m.comments    + delta.comments;
          shares      = m.shares      + delta.shares;
          followers   = m.followers   + delta.followers;
          updatedAt   = Time.now();
        };
        creators.put(creator, { principal = cp.principal; tier = cp.tier;
          metrics = updated; payouts = cp.payouts;
          quditScore = cp.quditScore; updatedAt = Time.now() });
        { ok = true }
      };
    }
  };

  public query func get_creator_stats(p: Principal) : async ?CreatorProfile {
    creators.get(p)
  };

  // ── Qudit Score (set by SynapZ-Core) ──────────────────────
  public shared func set_qudit_score(creator: Principal, score: Nat) : async { ok: Bool } {
    switch (creators.get(creator)) {
      case null { { ok = false } };
      case (?cp) {
        creators.put(creator, { principal = cp.principal; tier = cp.tier;
          metrics = cp.metrics; payouts = cp.payouts;
          quditScore = score; updatedAt = Time.now() });
        { ok = true }
      };
    }
  };

  // ── Payout Ledger ──────────────────────────────────────────
  public shared func record_payout(creator: Principal, entry: PayoutEntry) : async { ok: Bool } {
    switch (creators.get(creator)) {
      case null { { ok = false } };
      case (?cp) {
        creators.put(creator, { principal = cp.principal; tier = cp.tier;
          metrics = cp.metrics; payouts = Array.append(cp.payouts, [entry]);
          quditScore = cp.quditScore; updatedAt = Time.now() });
        { ok = true }
      };
    }
  };
}
