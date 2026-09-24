# PostHog Self-driving setup report

Session Replay, Error Tracking, and Conversations products are enabled; 9 signal sources are wired to the inbox; GitHub Issues and Sentry are connected as warehouse sources; 6 scouts are active (including one custom scout for the AI assistant); and 2 Replay Vision scanners are armed. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/585225/inbox) within ~30 minutes.

---

## AI data processing

**Status:** Approved — organization-level AI data processing consent was granted before this run started.

---

## GitHub

**Status:** Connected during this run.

- Integration: `marowa-labs` (ID 259664)
- Repositories visible to the App: `marowa-labs/workcontext`

---

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | already enabled | Recording was already on; no change. |
| Error Tracking | enabled | Turned on during this run. |
| Conversations (Support) | enabled | Turned on during this run. Tickets only arrive once an inbound channel is connected — see Follow-ups. |

`posthog.init` check (web app): clean — no `disable_session_recording` override, and `capture_exceptions: true` is set. No code changes needed.

---

## Signal sources

| source_product | source_type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | On by default — no config row needed. |
| `health_checks` | `health_issue` | Enabled (ID `01a052b3-89aa-7b0e-b772-47ae4de21b00`) |
| `error_tracking` | `issue_created` | Enabled (ID `01a052b3-8e31-7fc2-ac6e-79542211a0f3`) |
| `error_tracking` | `issue_reopened` | Enabled (ID `01a052b3-9073-72a7-94e3-18d96fea6afb`) |
| `error_tracking` | `issue_spiking` | Enabled (ID `01a052b3-a580-7c26-aa05-59470123aa8b`) |
| `session_replay` | `session_analysis_cluster` | Enabled (ID `01a052b3-a7c4-7d77-87a6-1326bd0ebf5f`, sample_rate: 0.1) |
| `conversations` | `ticket` | Enabled — dormant until an inbound channel is connected (ID `01a052b3-ab7d-71cd-8e73-8382bfd96156`) |
| `github` | `issue` | Enabled (ID `01a052bd-0d10-7559-8460-2299ee6808a1`) |
| `sentry` | `issue` | Enabled (ID `01a052bd-0f4a-7ce0-afcc-7bfb7529a3bf`) |

---

## Connected tools

| Tool | Status | Notes |
|---|---|---|
| GitHub Issues | Connected by this setup | Source ID `01a052b6-0b47-0000-8787-548acde4d911`, repo `marowa-labs/workcontext`, first sync started. Only the `issues` table is syncing; more tables can be enabled in PostHog > Data Management > Sources. |
| Sentry | Connected by this setup | Source ID `01a052bc-eb2a-0000-edab-3c1567d65938`, first sync started. Only the `issues` table is syncing; more tables can be enabled similarly. |

---

## Scout troop

**Run budget:** 100 runs/day (early access default), 0 used today. Max 3 per tick.
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (6)

| Scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product correlations and surfaces no specialist covers. |
| `signals-scout-product-analytics` | Saved funnel/retention/lifecycle flows for conversion regressions. |
| `signals-scout-health-checks` | PostHog setup health issues, weighted by blast radius. |
| `signals-scout-web-analytics` | Per-channel session volume, attribution breakage, landing-page bounce. |
| `signals-scout-data-warehouse` | GitHub Issues and Sentry import sync health; flags stalled or failed syncs. |
| `signals-scout-ai-chat-quality` *(custom)* | AI assistant feedback sentiment, session completion, and action failure patterns. |

### Disabled (22)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Intentional — covered by the native `error_tracking` signal sources enabled above. |
| `signals-scout-session-replay` | Intentional — covered by the native `session_replay` signal source enabled above. |
| `signals-scout-ai-observability` | Enable if `$ai_*` LLM analytics events are added in future. |
| `signals-scout-experiments` | Enable when A/B experiments are running. |
| `signals-scout-feature-flags` | Enable if feature flags are adopted. |
| `signals-scout-surveys` | Enable if PostHog surveys are used. |
| `signals-scout-revenue-analytics` | Enable if a payment SDK is integrated. |
| `signals-scout-logs` | Enable if the PostHog logs product is in use. |
| `signals-scout-csp-violations` | Enable if CSP reporting is configured. |
| All others (13) | Not active surfaces for this project; enable from the inbox when relevant. |

To switch a disabled scout on: PostHog > Self-driving inbox > Scout troop, toggle the scout. To silence a noisy scout without disabling it, set `emit: false` on its config — it keeps running but writes nothing to the inbox.

---

## Custom scouts

### Created: `signals-scout-ai-chat-quality`

**Surface:** The AI assistant chat interface (`app/(dashboard)/ai/page.tsx`), which captures PostHog events including explicit thumbs up/down feedback and AI action confirmations.

**Discriminator:** Ratio of thumbs-down to total explicit feedback across ≥ 3 distinct users, compared against the trailing 11-day baseline. A transient dip on low volume is noise; a sustained shift is worth surfacing.

**Why not covered by a built-in scout:**
- `signals-scout-product-analytics` watches only *saved* PostHog funnel and retention insights — no AI chat funnel exists yet.
- `signals-scout-general` sweeps cross-product surfaces but won't build a domain-specific feedback trend analysis for the AI assistant.

**Surfaces considered and ruled out:**
- Auth/signup funnel — potentially watchable, but specific PostHog event names for sign-up steps were not confirmed in the codebase. Record as a future candidate once event names are verified.
- Collaborative editing (tiptap + yjs) — no PostHog events confirmed for collaboration sessions. Record as a future candidate once instrumentation is added.

**Noise escape hatch:** In PostHog, set `emit: false` on `signals-scout-ai-chat-quality`'s config to switch it to dry-run (it keeps running and logging but writes nothing to the inbox).

---

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes what it finds straight to the Self-driving inbox. Findings from a scanner arrive at half weight — they need corroboration from a second independent finding before being promoted into a full inbox report.

| Scanner | Type | Status | Query scope | Sampling | Est. monthly credits |
|---|---|---|---|---|---|
| AI assistant and workspace breakage | monitor | Created | Sessions on URLs containing `/ai` | 50% | 0 (no recordings on `/ai` yet) |
| Workspace navigation frustration | monitor | Created | Sessions with `$rageclick` events | 100% | 0 (no rage-click recordings yet) |

**Breakage monitor** (ID `01a052ca-19a8-7c4a-ae94-284893d17b74`): Scoped to the AI assistant page (`$current_url icontains /ai`) — the core completion flow where breakage costs most (AI not responding, action dialogs failing, editor loading blank). Uses 50% random sampling.

**Frustration monitor** (ID `01a052ca-29a3-7684-b508-d751ee7a66bc`): Gated on `$rageclick` events across the whole product — no URL restriction, per the disjointness rule. Catches users hammering the AI send button, stuck project/space creation, and unresponsive UI elements. Uses 100% sampling (the `$rageclick` gate is already a strong pre-filter).

Both scanners are enabled with `emits_signals: true`. The project has recordings (confirmed in setup), but both estimated monthly credits are 0 because no sessions have been scanned yet — that changes once the next sweep runs.

---

## Follow-ups

- [ ] **Connect a Conversations inbound channel** (email / inbox / Slack) in PostHog Settings > Conversations so support tickets start arriving in the inbox. Until then, the `conversations / ticket` source is enabled but dormant.
- [ ] **GitHub Issues table:** Only `issues` is syncing for `marowa-labs/workcontext`. Enable additional tables (pull requests, etc.) in PostHog > Data Management > Sources if wanted.
- [ ] **Sentry issues table:** Only `issues` is syncing. Enable additional tables similarly.
- [ ] **AI chat event names:** Confirm the exact PostHog event names used in `app/(dashboard)/ai/page.tsx` for thumbs up/down and action feedback. The `signals-scout-ai-chat-quality` scout discovers them at runtime via `read-data-schema`, but confirming them now lets you save a funnel insight for the `signals-scout-product-analytics` scout to watch.
- [ ] **Auth/signup funnel scout:** Once specific PostHog event names for signup and login steps are confirmed, a custom scout watching this funnel is a high-value addition.
- [ ] **Collaborative editing instrumentation:** If PostHog events for collaboration sessions (session started, document saved, collaborator joined) are added, a custom scout watching for collaboration reliability issues becomes feasible.
- [ ] **Enable `signals-scout-replay-vision`** (currently disabled) after Replay Vision scanners have accumulated a few weeks of observations — that scout reads *trends across observations* and needs history to be useful.

---

## What happens next

- The scout coordinator picks up all fresh configs within **~30 minutes** and fires the first scans.
- Each enabled scout uses roughly one run from the project's daily budget (100/day during early access).
- Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/585225/inbox).
- Immediately-actionable reports can trigger coding tasks automatically, each producing a draft PR at $15/fix.
- Replay Vision scanners sweep matching recordings every 5 minutes; findings accumulate before corroborating into promoted inbox reports.
