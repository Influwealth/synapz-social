// ─────────────────────────────────────────────────────────────
// media_registry — ICP Canister
// SynapZ Social | InfluWealth Quantum Labs | SAP v1.0
//
// Stores: media URIs, content hashes, metadata, ownership
// Media is stored off-chain (IPFS / Arweave / sovereign CDN)
// This canister is the sovereign registry / proof of ownership
// ─────────────────────────────────────────────────────────────

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Nat "mo:base/Nat";
import Text "mo:base/Text";
import Option "mo:base/Option";
import Iter "mo:base/Iter";

actor MediaRegistry {

  // ── Types ──────────────────────────────────────────────────
  public type MediaType = { #Image; #Video; #Audio; #Document; #Other };

  public type MediaRecord = {
    id          : Nat;
    owner       : Principal;
    uri         : Text;       // IPFS / Arweave / CDN URI
    hash        : Text;       // SHA-256 content hash
    mediaType   : MediaType;
    mimeType    : Text;       // "image/jpeg", "video/mp4", etc.
    sizeBytes   : Nat;
    altText     : Text;
    capsuleTag  : ?Text;      // optional WealthBridge OS capsule reference
    isPublic    : Bool;
    createdAt   : Int;
  };

  public type MediaInput = {
    uri        : Text;
    hash       : Text;
    mediaType  : MediaType;
    mimeType   : Text;
    sizeBytes  : Nat;
    altText    : Text;
    capsuleTag : ?Text;
    isPublic   : Bool;
  };

  // ── State ──────────────────────────────────────────────────
  private var registry  : HashMap.HashMap<Nat, MediaRecord>       = HashMap.HashMap(256, Nat.equal, Nat.hash);
  private var byOwner   : HashMap.HashMap<Principal, [Nat]>       = HashMap.HashMap(64, Principal.equal, Principal.hash);
  private var byHash    : HashMap.HashMap<Text, Nat>              = HashMap.HashMap(256, Text.equal, Text.hash);
  private var nextId    : Nat = 1;

  // ── Register Media ─────────────────────────────────────────
  public shared(msg) func register_media(input: MediaInput) : async { ok: Bool; mediaId: ?Nat; error: ?Text } {
    let owner = msg.caller;

    // Deduplicate by hash
    switch (byHash.get(input.hash)) {
      case (?existingId) { { ok = true; mediaId = ?existingId; error = ?"Already registered" } };
      case null {
        let id = nextId;
        nextId += 1;

        let record : MediaRecord = {
          id; owner; uri = input.uri; hash = input.hash;
          mediaType = input.mediaType; mimeType = input.mimeType;
          sizeBytes = input.sizeBytes; altText = input.altText;
          capsuleTag = input.capsuleTag; isPublic = input.isPublic;
          createdAt = Time.now();
        };

        registry.put(id, record);
        byHash.put(input.hash, id);

        let curr = Option.get(byOwner.get(owner), []);
        byOwner.put(owner, Array.append(curr, [id]));

        { ok = true; mediaId = ?id; error = null }
      };
    }
  };

  // ── Query ──────────────────────────────────────────────────
  public query func get_media(mediaId: Nat) : async ?MediaRecord {
    registry.get(mediaId)
  };

  public query func list_media_by_owner(owner: Principal, cursor: Nat, limit: Nat) : async [MediaRecord] {
    let ids   = Option.get(byOwner.get(owner), []);
    let total = ids.size();
    if (cursor >= total) return [];
    let end   = Nat.min(cursor + limit, total);
    Array.filterMap<Nat, MediaRecord>(
      Array.tabulate<Nat>(end - cursor, func i = ids[total - 1 - cursor - i]),
      func id = registry.get(id)
    )
  };

  public query func get_by_hash(hash: Text) : async ?MediaRecord {
    switch (byHash.get(hash)) {
      case (?id) { registry.get(id) };
      case null  { null };
    }
  };
}
