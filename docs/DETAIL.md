# Session mailbox

Cross-session messaging and durable session links for DSH. A top-level session can send a message
to another session by id, and the receiver sees who sent it. Sessions can also be attached under a
parent and kept in a persisted tree.

## What it adds

- `get_current_session()` — returns this session's id and parent id.
- `create_child_session({ prompt?, cwd?, role? })` — create a session under the caller in the persisted
  tree and optionally queue a first prompt. Dispatch is fire-and-forget: the caller returns
  immediately. `role` is a routing label such as `design` or `testing`. A prompt section makes this
  the default action for an ordinary “新建会话” request; only an explicit “创建子 agent/子代理”
  request should use a native subagent.
- `dispatch_task({ task, role?, child?, cwd?, createIfMissing? })` — coordinator default for
  production work. It reuses a direct child whose stored role, title or recent task matches, or
  creates a child under the caller when none matches, then queues the task without blocking. It
  returns `{ childId, parentId, created, matchedBy }`.
- `send_session_message({ to, message })` — queue a message for another session and return
  immediately. The receiver gets a user-role message wrapped in a
  `<session-message from-session="…" from-parent="…" hop-chain="…">` envelope, followed by a note
  saying it came from another session rather than from the user. When `to` is a direct child, the
  Host auto-reports the child's final turn text back to the sender.
- `attach_session({ child, parent })` — place a session under a parent, replacing any old parent.
  Only the child or the parent may call it; self-links and cycles are rejected.
- `detach_session({ child })` — remove a session from its parent, restoring it to top level.
- `list_session_tree()` — list all persisted links as `{ sessionId, parentId }` pairs plus roots.
- `set_session_leader({ leader })` — alias for attaching the caller under a leader.

The Host also registers `session-mailbox:new-session-policy` and the coordinator-first instruction in
the system prompt. The main session should not create, modify, generate, test or design directly
unless the user explicitly says it should do the work itself; production requests go through
`dispatch_task`. Pure questions, explanations, status checks and summaries can be answered by the
main session directly.

## Native sidebar

The Client module replaces the `sidebar.workspaces` slot with a session browser that draws the
persisted links as a tree inside the normal DSH sidebar. It keeps workspace grouping, search,
running badges and session opening, and adds expand/collapse, sibling drag reordering, dropping a
child on another session to re-parent it, dropping it on the bottom strip to detach, and
archive/unarchive from the row menu. Archiving a running session first confirms that its activity
will stop; archiving a parent only marks that session archived and hides its whole subtree without
unlinking it. An “已归档 N” toolbar entry lists direct archived rows and restores them. The tree
reads `archivedSessionIds` (the same state the native browser uses). Because one slot is replaced,
native workspace-browser actions such as pin, fork and workspace create/rename are not rendered by
this sidebar; archive is provided here through `archiveSession`/`unarchiveSession`. The plugin also
does not add a “New session” button; instead, the Host registers a
`session-mailbox:new-session-policy` system-prompt section that maps ordinary new-session requests
to `create_child_session` under the current session.

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
overrides the path. The file is read when the bundle activates and by each HTTP mutation; it is
rewritten after every change using a temp file and rename. Records carry `parentId`, `updatedAt`,
`order`, and optional `role` / `lastTaskAt`; sibling order is stored explicitly. Deleting it resets
all links.

## Independent child tasks and auto-report

A parent can dispatch work without waiting. Both `create_child_session({ prompt })` and
`send_session_message({ to: child, message })` queue the target prompt and return; the parent stays
available for the user. For a direct child the Host records a pending task, listens to
`session/event`, caches the child's last `assistant/message` text, and on `turn/end` queues an
`auto-report="true"` session-message back to the parent. Failed/aborted turns report the reason plus
any final text. If the child sends a manual `send_session_message` to its parent first, the pending
task is marked manual and the automatic copy is skipped. The pending task and cached text are also
written to `pending.json` beside `groups.json`, so a plugin reload or DSH restart does not lose an
in-flight child's report; on startup the Host recovers a completed child whose final text was
already captured.

Delivery uses the native `agent-message` source (`{ kind: 'agent-message', form: 'relay',
senderSessionId }`) through `ctx.agents.get(parentId).followup(...)`. The Chat client classifies this
as a non-user turn trigger, so it renders as a collapsed **Agent** row and expands on demand; it does
not replace or alter the normal `user` message renderer. The same source is used for a child's manual
`send_session_message` to its parent. If the parent agent is not live, the Host falls back to the
ordinary session-controller prompt.

The task instruction appended to a dispatched prompt tells the child to work independently, avoid
progress messages, and finish with one final result. The parent should not sleep, poll, or watch
files while the child works.

## Coordinator-first routing

`dispatch_task` is the normal entry point for production work. Unless the user explicitly asks the
main session to operate or modify something itself, the main session routes the task instead of
doing it. Routing considers, in order: an explicit `child` argument; a single direct child; and a
score over stored `role`, the child title, and the task wording. Ties prefer the most recently
active child. When nothing matches, a child is created under the main session. The dispatched task
records `lastTaskAt` and updates `role` when supplied, so later tasks route better. Children do not
delegate further unless the task explicitly tells them to.

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
- Links are a flat child→parent map with titles and sibling order, but no labels or nested groups.
- The sidebar replaces `sidebar.workspaces`, so native pin/fork/workspace actions are not part of
  this UI. Archive is provided by the sidebar itself through `archiveSession`/`unarchiveSession`, but
  the native multi-select/batch archive view is not. The native subagent tree in the session header
  is a different, creation-time relation.
- Any top-level session can message any other session. A child can detach itself. The link is a
  workflow constraint, not a security boundary.
