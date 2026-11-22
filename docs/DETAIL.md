# Session mailbox

Cross-session messaging and durable session links for DSH. A top-level session can send a message
to another session by id, and the receiver sees who sent it. Sessions can also be attached under a
parent and kept in a persisted tree.

## What it adds

- `get_current_session()` — returns this session's id and parent id.
- `send_session_message({ to, message })` — deliver a message to another session. The receiver gets
  a user-role message wrapped in a `<session-message from-session="…" from-parent="…" hop-chain="…">`
  envelope, followed by a note saying it came from another session rather than from the user.
- `attach_session({ child, parent })` — place a session under a parent, replacing any old parent.
  Only the child or the parent may call it; self-links and cycles are rejected.
- `detach_session({ child })` — remove a session from its parent, restoring it to top level.
- `list_session_tree()` — list all persisted links as `{ sessionId, parentId }` pairs plus roots.
- `set_session_leader({ leader })` — alias for attaching the caller under a leader.

## Link model

A link is an adoption/control relation, not a native subagent creation relation. It changes who may
message whom, but it does not change the target Session's creation lineage, continuation authority,
or sidebar visibility.

- A child may message its parent and its own direct children.
- A top-level session may message any session.
- Siblings, grandparents, grandchildren, and unrelated sessions are not directly reachable; route
  through the parent/child chain.
- The link is a soft workflow constraint, not an authentication boundary. A session can detach
  itself or change its parent.

## Persistence

Links live in `<DSH_PROFILE_DIR>\session-mailbox\groups.json` (falling back to
`%USERPROFILE%\.dsh\profiles\<profile>\session-mailbox\groups.json`). `DSH_SESSION_MAILBOX_STATE`
overrides the path. The file is read when the bundle activates and rewritten after every change,
using a temp file and rename. Deleting it resets all links.

## How a leader/follower run works

1. The user opens the leader session and notes its session id.
2. Each follower attaches to the leader, either with `set_session_leader` or with the leader's
   `attach_session`.
3. A follower calls `send_session_message({ to: "<leader-id>", message: "…" })` to report or ask.
4. The leader sees `from-session="<follower-id>"` in the envelope, decides (with the user if
   needed), and calls `send_session_message({ to: "<follower-id>", message: "…" })` to distribute
   the decision.
5. `detach_session` removes a follower from the tree when the run ends.

## Limitations of this version

- Delivery uses the Host prompt path, so the receiver sees the message as a user-role message. The
  envelope is a convention, not a separate message type.
- Only exact session ids are accepted; titles and fuzzy matching are not implemented.
- There is no durable outbox, hold-for-approval queue, reply correlation id, rate limit, or
  hop-chain propagation beyond the single sender id.
- Links are a flat child→parent map with no titles, labels, or ordering.
- No Web UI: the sidebar does not draw the tree, and dragging a parent with its subtree is not
  available yet. The native subagent tree in the session header is a different, creation-time
  relation.
- Any top-level session can message any other session. A child can detach itself. The link is a
  workflow constraint, not a security boundary.
