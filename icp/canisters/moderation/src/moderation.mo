// ─────────────────────────────────────────────────────────────
// moderation — ICP Canister
// SynapZ Social | InfluWealth Quantum Labs | SAP v1.0
//
// Stores: flags, reports, moderation decisions from SynapZ-Core Qubit
// Decision flow: content → SynapZ-Core /agents/moderate → Qubit → stored here
// ─────────────────────────────────────────────────────────────

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Iter "mo:base/Iter";

actor Moderation {

  // ── Types ──────────────────────────────────────────────────
  public type FlagReason = {
    #Spam;
    #Harassment;
    #Misinformation;
    #InappropriateContent;
    #CopyrightViolation;
    #Other : Text;
  };

  public type ModerationDecision = {
    #Allow;
    #SoftBlock;   // hidden from feed, author can see
    #HardBlock;   // fully removed
    #Review;      // queued for human review
  };

  public type Flag = {
    id        : Nat;
    reporter  : Principal;
    postId    : Nat;
    reason    : FlagReason;
    createdAt : Int;
  };

  public type ModerationRecord = {
    postId    : Nat;
    decision  : ModerationDecision;
    rationale : Text;
    qubitState: Nat;     // 0 = NO (block), 1 = YES (allow) — from SynapZ-Core
    quditLabel: Text;    // Qudit label from SynapZ-Core feed rank
    decidedAt : Int;
    flags     : [Flag];
  };

  // ── State ──────────────────────────────────────────────────
  private var records  : HashMap.HashMap<Nat, ModerationRecord> = HashMap.HashMap(128, Nat.equal, Nat.hash);
  private var flagSeq  : Nat = 1;

  // ── Flag Submission ────────────────────────────────────────
  public shared(msg) func submit_flag(postId: Nat, reason: FlagReason) : async { ok: Bool; flagId: ?Nat } {
    let reporter = msg.caller;
    let flagId   = flagSeq;
    flagSeq += 1;

    let flag : Flag = { id = flagId; reporter; postId; reason; createdAt = Time.now() };

    switch (records.get(postId)) {
      case null {
        // No record yet — create with Review status
        let rec : ModerationRecord = {
          postId; decision = #Review; rationale = "Flagged — awaiting SynapZ-Core review";
          qubitState = 1; quditLabel = "NEUTRAL";
          decidedAt = Time.now(); flags = [flag];
        };
        records.put(postId, rec);
      };
      case (?existing) {
        records.put(postId, { postId = existing.postId; decision = existing.decision;
          rationale = existing.rationale; qubitState = existing.qubitState;
          quditLabel = existing.quditLabel; decidedAt = existing.decidedAt;
          flags = Array.append(existing.flags, [flag]) });
      };
    };

    { ok = true; flagId = ?flagId }
  };

  // ── Record Decision (from SynapZ-Core Qubit) ──────────────
  public shared func record_moderation_decision(
    postId    : Nat,
    decision  : ModerationDecision,
    rationale : Text,
    qubitState: Nat,
    quditLabel: Text
  ) : async { ok: Bool } {
    let existing = Option.get(records.get(postId), {
      postId; decision = #Review; rationale = "";
      qubitState = 1; quditLabel = "NEUTRAL";
      decidedAt = 0; flags = []
    });
    records.put(postId, {
      postId; decision; rationale; qubitState; quditLabel;
      decidedAt = Time.now(); flags = existing.flags
    });
    { ok = true }
  };

  // ── Query ──────────────────────────────────────────────────
  public query func get_moderation_state(postId: Nat) : async ?ModerationRecord {
    records.get(postId)
  };

  public query func list_flagged_posts(limit: Nat) : async [ModerationRecord] {
    let all = Iter.toArray(records.vals());
    let flagged = Array.filter<ModerationRecord>(all, func r = r.flags.size() > 0);
    let n = Nat.min(limit, flagged.size());
    Array.tabulate<ModerationRecord>(n, func i = flagged[i])
  };
}
