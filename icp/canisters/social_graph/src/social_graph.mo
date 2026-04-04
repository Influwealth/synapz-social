// ─────────────────────────────────────────────────────────────
// social_graph — ICP Canister
// SynapZ Social | InfluWealth Quantum Labs | SAP v1.0
//
// Stores: sovereign profiles, follow graph, blocks, mutes,
//         roles (creator / youth / business / member)
// ─────────────────────────────────────────────────────────────

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Option "mo:base/Option";

actor SocialGraph {

  // ── Types ──────────────────────────────────────────────────
  public type Role = {
    #Member;
    #Creator;
    #Youth;
    #Business;
    #Admin;
  };

  public type Profile = {
    principal   : Principal;
    handle      : Text;
    displayName : Text;
    bio         : Text;
    avatarUri   : Text;
    links       : [Text];
    role        : Role;
    sovereignId : Text;       // SAP identity string
    createdAt   : Int;
    updatedAt   : Int;
  };

  public type ProfileInput = {
    handle      : Text;
    displayName : Text;
    bio         : Text;
    avatarUri   : Text;
    links       : [Text];
    role        : Role;
    sovereignId : Text;
  };

  // ── State ──────────────────────────────────────────────────
  private var profiles  : HashMap.HashMap<Principal, Profile>       = HashMap.HashMap(64, Principal.equal, Principal.hash);
  private var following : HashMap.HashMap<Principal, [Principal]>   = HashMap.HashMap(64, Principal.equal, Principal.hash);
  private var followers : HashMap.HashMap<Principal, [Principal]>   = HashMap.HashMap(64, Principal.equal, Principal.hash);
  private var blocked   : HashMap.HashMap<Principal, [Principal]>   = HashMap.HashMap(64, Principal.equal, Principal.hash);

  // ── Profile Methods ────────────────────────────────────────
  public shared(msg) func create_profile(input: ProfileInput) : async { ok: Bool; error: ?Text } {
    let caller = msg.caller;
    switch (profiles.get(caller)) {
      case (?_) { { ok = false; error = ?"Profile already exists" } };
      case null {
        let profile : Profile = {
          principal   = caller;
          handle      = input.handle;
          displayName = input.displayName;
          bio         = input.bio;
          avatarUri   = input.avatarUri;
          links       = input.links;
          role        = input.role;
          sovereignId = input.sovereignId;
          createdAt   = Time.now();
          updatedAt   = Time.now();
        };
        profiles.put(caller, profile);
        { ok = true; error = null }
      };
    }
  };

  public shared(msg) func update_profile(input: ProfileInput) : async { ok: Bool; error: ?Text } {
    let caller = msg.caller;
    switch (profiles.get(caller)) {
      case null { { ok = false; error = ?"Profile not found" } };
      case (?existing) {
        let updated : Profile = {
          principal   = existing.principal;
          handle      = input.handle;
          displayName = input.displayName;
          bio         = input.bio;
          avatarUri   = input.avatarUri;
          links       = input.links;
          role        = input.role;
          sovereignId = input.sovereignId;
          createdAt   = existing.createdAt;
          updatedAt   = Time.now();
        };
        profiles.put(caller, updated);
        { ok = true; error = null }
      };
    }
  };

  public query func get_profile(p: Principal) : async ?Profile {
    profiles.get(p)
  };

  // ── Follow Graph ───────────────────────────────────────────
  public shared(msg) func follow(followee: Principal) : async { ok: Bool } {
    let follower = msg.caller;
    if (Principal.equal(follower, followee)) return { ok = false };

    // Update following list
    let currFollowing = Option.get(following.get(follower), []);
    let alreadyFollowing = Array.find<Principal>(currFollowing, func p = Principal.equal(p, followee));
    if (Option.isSome(alreadyFollowing)) return { ok = true };

    following.put(follower, Array.append(currFollowing, [followee]));

    // Update followers list
    let currFollowers = Option.get(followers.get(followee), []);
    followers.put(followee, Array.append(currFollowers, [follower]));

    { ok = true }
  };

  public shared(msg) func unfollow(followee: Principal) : async { ok: Bool } {
    let follower = msg.caller;
    let currFollowing = Option.get(following.get(follower), []);
    following.put(follower, Array.filter<Principal>(currFollowing, func p = not Principal.equal(p, followee)));

    let currFollowers = Option.get(followers.get(followee), []);
    followers.put(followee, Array.filter<Principal>(currFollowers, func p = not Principal.equal(p, follower)));

    { ok = true }
  };

  public query func get_followers(p: Principal) : async [Principal] {
    Option.get(followers.get(p), [])
  };

  public query func get_following(p: Principal) : async [Principal] {
    Option.get(following.get(p), [])
  };

  // ── Block ──────────────────────────────────────────────────
  public shared(msg) func block_user(target: Principal) : async { ok: Bool } {
    let caller = msg.caller;
    let curr = Option.get(blocked.get(caller), []);
    blocked.put(caller, Array.append(curr, [target]));
    { ok = true }
  };

  public query func is_blocked(caller: Principal, target: Principal) : async Bool {
    let list = Option.get(blocked.get(caller), []);
    Option.isSome(Array.find<Principal>(list, func p = Principal.equal(p, target)))
  };
}
