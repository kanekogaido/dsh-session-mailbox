# Session mailbox

Cross-session messaging for DSH. It lets one top-level session send a message to another top-level session by id, and makes the receiver see who sent it.

## What it adds

- `send_session_message({ to, message })` — deliver a message to another top-level session. The receiving session gets a user-role message wrapped in a `<session-message from-session="…" hop-chain="…">` envelope, followed by a short note saying it came from another session rather than from the user.
- `set_session_leader({ leader })` — link the calling session to a leader. Once linked, that session can use `send_session_message` only against its leader.

## How a leader/follower run works

1. The user opens the leader session and notes its session id.
2. Each follower session calls `set_session_leader({ leader: "<leader-id>" })` once.
3. A follower calls `send_session_message({ to: "<leader-id>", message: "…" })` to report or ask.
4. The leader sees `from-session="<follower-id>"` in the envelope, decides (with the user if needed), and calls `send_session_message({ to: "<follower-id>", message: "…" })` to distribute the decision.

## Limitations of this version

- Delivery uses the Host prompt path, so the receiver sees the message as a user-role message. The envelope is a convention, not a separate message type.
- Only exact top-level session ids are accepted; titles and fuzzy matching are not implemented.
- Follower links are in memory only. A DSH restart forgets them.
- There is no durable outbox, hold-for-approval queue, reply correlation id, rate limit, or hop-chain propagation beyond the single sender id.
- Any session that has not called `set_session_leader` can still message any other top-level session. The link is a soft workflow constraint, not a security boundary.
