// ─────────────────────────────────────────────────────────────
// content_feed — ICP Canister
// SynapZ Social | InfluWealth Quantum Labs | SAP v1.0
//
// Stores: posts, comments, threads, tags, media references
// Feed assembly uses ranking_hint from SynapZ-Core (Qudit scores)
// ─────────────────────────────────────────────────────────────

import HashMap "mo:base/HashMap";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Nat "mo:base/Nat";
import Option "mo:base/Option";
import Iter "mo:base/Iter";

actor ContentFeed {

  // ── Types ──────────────────────────────────────────────────
  public type PostType = { #Short; #Long; #VideoRef; #Repost };

  public type Post = {
    id          : Nat;
    author      : Principal;
    content     : Text;
    mediaRef    : ?Text;          // media_registry ID
    postType    : PostType;
    tags        : [Text];
    capsuleTag  : ?Text;          // WealthBridge OS capsule reference
    parentId    : ?Nat;           // for comments/replies
    likes       : Nat;
    reposts     : Nat;
    isHidden    : Bool;           // moderation flag
    createdAt   : Int;
    updatedAt   : Int;
  };

  public type PostInput = {
    content    : Text;
    mediaRef   : ?Text;
    postType   : PostType;
    tags       : [Text];
    capsuleTag : ?Text;
    parentId   : ?Nat;
  };

  // ranking_hint is a Float score from SynapZ-Core Qudit (0.0–1.0)
  // stored as Nat * 1000 (fixed-point) to avoid Float in stable memory
  public type RankedPost = {
    post        : Post;
    rankScore   : Nat;    // 0–1000 (Qudit confidence * 1000)
  };

  // ── State ──────────────────────────────────────────────────
  private var posts     : HashMap.HashMap<Nat, Post>           = HashMap.HashMap(256, Nat.equal, Nat.hash);
  private var byAuthor  : HashMap.HashMap<Principal, [Nat]>    = HashMap.HashMap(64, Principal.equal, Principal.hash);
  private var nextId    : Nat = 1;

  // ── Post Methods ───────────────────────────────────────────
  public shared(msg) func create_post(input: PostInput) : async { ok: Bool; postId: ?Nat; error: ?Text } {
    let author = msg.caller;
    let id = nextId;
    nextId += 1;

    let post : Post = {
      id         = id;
      author     = author;
      content    = input.content;
      mediaRef   = input.mediaRef;
      postType   = input.postType;
      tags       = input.tags;
      capsuleTag = input.capsuleTag;
      parentId   = input.parentId;
      likes      = 0;
      reposts    = 0;
      isHidden   = false;
      createdAt  = Time.now();
      updatedAt  = Time.now();
    };

    posts.put(id, post);

    let curr = Option.get(byAuthor.get(author), []);
    byAuthor.put(author, Array.append(curr, [id]));

    { ok = true; postId = ?id; error = null }
  };

  public query func get_post(postId: Nat) : async ?Post {
    posts.get(postId)
  };

  public query func list_posts_by_author(author: Principal, cursor: Nat, limit: Nat) : async [Post] {
    let ids    = Option.get(byAuthor.get(author), []);
    let total  = ids.size();
    if (cursor >= total) return [];
    let end    = Nat.min(cursor + limit, total);
    let slice  = Array.tabulate<Nat>(end - cursor, func i = ids[total - 1 - cursor - i]);
    Array.filterMap<Nat, Post>(slice, func id = posts.get(id))
  };

  // list_feed_for_user returns recent posts (ranking applied by API layer using SynapZ-Core)
  public query func list_feed_for_user(cursor: Nat, limit: Nat) : async [Post] {
    let allPosts = Iter.toArray(posts.vals());
    let visible  = Array.filter<Post>(allPosts, func p = not p.isHidden);
    let total    = visible.size();
    if (cursor >= total) return [];
    let end      = Nat.min(cursor + limit, total);
    // Return newest first (descending by id)
    let sorted   = Array.sort<Post>(visible, func(a, b) = if (a.id > b.id) #less else #greater);
    Array.tabulate<Post>(end - cursor, func i = sorted[cursor + i])
  };

  // ── Moderation Hook ────────────────────────────────────────
  public shared func hide_post(postId: Nat) : async { ok: Bool } {
    switch (posts.get(postId)) {
      case null { { ok = false } };
      case (?p) {
        let updated = { id = p.id; author = p.author; content = p.content;
          mediaRef = p.mediaRef; postType = p.postType; tags = p.tags;
          capsuleTag = p.capsuleTag; parentId = p.parentId; likes = p.likes;
          reposts = p.reposts; isHidden = true; createdAt = p.createdAt;
          updatedAt = Time.now() };
        posts.put(postId, updated);
        { ok = true }
      };
    }
  };

  // ── Engagement ─────────────────────────────────────────────
  public shared func like_post(postId: Nat) : async { ok: Bool } {
    switch (posts.get(postId)) {
      case null { { ok = false } };
      case (?p) {
        let updated = { id = p.id; author = p.author; content = p.content;
          mediaRef = p.mediaRef; postType = p.postType; tags = p.tags;
          capsuleTag = p.capsuleTag; parentId = p.parentId; likes = p.likes + 1;
          reposts = p.reposts; isHidden = p.isHidden; createdAt = p.createdAt;
          updatedAt = Time.now() };
        posts.put(postId, updated);
        { ok = true }
      };
    }
  };
}
