# PostHog Self-driving setup report

Session Replay, Error Tracking, and Conversations products are enabled; 8 signal sources are wired to the inbox; GitHub Issues and Sentry are connected as data warehouse sources; 6 scouts are active (general, product-analytics, web-analytics, data-warehouse, health-checks, and a custom AI chat quality scout); and 2 Replay Vision scanners are armed. Findings will start appearing in the [Self-driving inbox](https://us.posthog.com/project/585225/inbox) within ~30 minutes.

---

## AI data processing

**Status:** Approved — organization-level AI data processing consent was granted before this run started.

---

## GitHub

**Status:** Already connected (integration `github`, created 2026-08-30).

- Repositories visible to the App: `marowa-labs/workcontext`

---

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | already enabled | Recording was already on; no change. |
| Error Tracking | already enabled | Was enabled in a prior run; no change. |
| Conversations (Support) | already enabled | Was enabled in a prior run; no change. |

`posthog.init` check (web app): clean — `capture_exceptions: true` is set, no `disable_session_recording` override. No code changes needed.

Conversations tickets only arrive once an inbound channel (email / inbox / Slack) is connected — see Follow-ups.

---

## Signal sources

| source_product | source_type | Action |
|---|---|---|
| `signals_scout` | `cross_source_issue` | On by default — no config row needed. |
| `health_checks` | `health_issue` | Already enabled (ID `01a052b3-89aa-7b0e-b772-47ae4de21b00`) |
| `error_tracking` | `issue_created` | Already enabled (ID `01a052b3-8e31-7fc2-ac6e-79542211a0f3`) |
| `error_tracking` | `issue_reopened` | Already enabled (ID `01a052b3-9073-72a7-94e3-18d96fea6afb`) |
| `error_tracking` | `issue_spiking` | Already enabled (ID `01a052b3-a580-7c26-aa05-59470123aa8b`) |
| `session_replay` | `session_analysis_cluster` | Already enabled (ID `01a052b3-a7c4-7d77-87a6-1326bd0ebf5f`, sample_rate: default) |
| `conversations` | `ticket` | Already enabled — dormant until an inbound channel is connected (ID `01a052b3-ab7d-71cd-8e73-8382bfd96156`) |
| `github` | `issue` | Already enabled (ID `01a052bd-0d10-7559-8460-2299ee6808a1`) |
| `sentry` | `issue` | Already enabled (ID `01a052bd-0f4a-7ce0-afcc-7bfb7529a3bf`) |

---

## Connected tools

| Tool | Status | Notes |
|---|---|---|
| GitHub Issues | Already connected | Source `Github` running, repo `marowa-labs/workcontext`. Only the `issues` table is syncing; more tables can be enabled in PostHog > Data Management > Sources. |
| Sentry | Already connected | Source `Sentry` running. Only the `issues` table is syncing; more tables can be enabled similarly. |
| Jira | Not used | Detected in codebase (`JIRA_CLIENT_ID` env var) but not selected this run. |

---

## Scout troop

**Run budget:** 100 runs/day (early access default), 6 used today, 94 remaining.
**Banner:** "Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more."

### Enabled (6)

| Scout | What it watches |
|---|---|
| `signals-scout-general` | Cross-product correlations and surfaces no specialist covers. |
| `signals-scout-product-analytics` | Saved funnel/retention/lifecycle flows for conversion regressions. |
| `signals-scout-web-analytics` | Per-channel session volume, attribution breakage, landing-page bounce. |
| `signals-scout-data-warehouse` | GitHub Issues and Sentry import sync health; flags stalled or failed syncs. |
| `signals-scout-health-checks` | PostHog setup health issues, weighted by blast radius. |
| `signals-scout-ai-chat-quality` *(custom)* | AI assistant feedback sentiment, session completion, and action failure patterns. |

### Disabled (22)

| Scout | Reason |
|---|---|
| `signals-scout-error-tracking` | Intentional — covered by the native `error_tracking` signal sources enabled above. |
| `signals-scout-session-replay` | Intentional — covered by the native `session_replay` signal source enabled above. |
| `signals-scout-web-vitals` | Enable once web vitals data accumulates. |
| `signals-scout-conversations` | Enable once a Conversations inbound channel is connected and ticket events flow. |
| `signals-scout-surveys` | Enable if PostHog surveys are used. |
| `signals-scout-experiments` | Enable when A/B experiments are running. |
| `signals-scout-feature-flags` | Enable if feature flags are adopted. |
| `signals-scout-revenue-analytics` | Enable if a payment SDK is integrated. |
| `signals-scout-ai-observability` | Enable if `$ai_*` LLM analytics events are added. |
| `signals-scout-logs` | Enable if the PostHog logs product is in use. |
| `signals-scout-csp-violations` | Enable if CSP reporting is configured. |
| All others (11) | Not active surfaces for this project; enable from the inbox when relevant. |

To switch a disabled scout on: PostHog > Self-driving inbox > Scout troop, toggle the scout.

---

## Custom scouts

### Created in prior run: `signals-scout-ai-chat-quality`

**Surface:** The AI assistant chat interface (`app/(dashboard)/ai/page.tsx`), which captures PostHog events including explicit thumbs up/down feedback and AI action confirmations.

**Discriminator:** Ratio of thumbs-down to total explicit feedback across ≥ 3 distinct users, compared against the trailing 11-day baseline. A transient dip on low volume is noise; a sustained shift is worth surfacing.

**Why not covered by a built-in scout:** `signals-scout-product-analytics` watches only *saved* PostHog funnel and retention insights — no AI chat funnel exists yet. `signals-scout-general` sweeps cross-product surfaces but won't build a domain-specific feedback trend analysis.

**Noise escape hatch:** In PostHog, set `emit: false` on `signals-scout-ai-chat-quality`'s config to switch it to dry-run.

### Proposed this run, declined by user

| Scout | Surface | Reason declined |
|---|---|---|
| `signals-scout-signup-activation` | `user_signed_up` / `oauth_signup_completed` → `user_signed_in` return-login rate | User declined |
| `signals-scout-workspace-invitations` | `workspace_invitation_sent` vs `workspace_invitation_accepted` acceptance rate | User declined |

Both remain viable candidates once there is enough data to establish a baseline. Add them from the Self-driving inbox, or re-run this setup.

---

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes what it finds straight to the Self-driving inbox. Findings arrive at half weight — they need corroboration from a second independent finding before being promoted into a full inbox report. Scanners are the only part of this setup that spend Replay Vision quota.

| Scanner | Type | Status | Query scope | Sampling | Est. monthly credits |
|---|---|---|---|---|---|
| AI assistant and workspace breakage | monitor | Already configured | Sessions on URLs containing `/ai` | 50% | 0 (no recordings yet) |
| Workspace navigation frustration | monitor | Already configured | Sessions with `$rageclick` events | 100% | 0 (no recordings yet) |

Both scanners have `emits_signals: true` and were fully customised for this product (prompts reference the AI assistant, collaborative editor, project/space pages). Queries are disjoint by axis (URL vs event) to ensure independent corroboration.

The project has no recordings yet — scanners start working the day sessions begin, with no second setup.

---

## Follow-ups

- [ ] **Connect a Conversations inbound channel** (email / inbox / Slack) in PostHog Settings > Conversations so support tickets start arriving in the inbox. Until then, the `conversations / ticket` source is enabled but dormant.
- [ ] **Jira:** Detected in codebase (`JIRA_CLIENT_ID` env var) but not connected this run. To connect: [New data warehouse source](https://us.posthog.com/project/585225/pipeline/new/source) → select Jira.
- [ ] **Signup/activation funnel scout:** Once `user_signed_up` / `oauth_signup_completed` → `user_signed_in` events accumulate a baseline, a custom scout watching new-user return rate is a high-value addition.
- [ ] **Workspace invitations scout:** Once `workspace_invitation_sent` / `workspace_invitation_accepted` data has a baseline, a scout watching acceptance-rate drops would catch broken invite flows early.
- [ ] **Enable `signals-scout-web-vitals`** once `$web_vitals` data has accumulated across a range of pages — the scout reads per-page trends and needs history to be useful.
- [ ] **Enable `signals-scout-replay-vision`** after Replay Vision scanners have accumulated a few weeks of observations — that scout reads trends across observations and needs history to be useful.
- [ ] **GitHub Issues table:** Only `issues` is syncing for `marowa-labs/workcontext`. Enable additional tables (pull requests, etc.) in PostHog > Data Management > Sources if wanted.
- [ ] **Sentry issues table:** Only `issues` is syncing. Enable additional tables similarly.

---

## What happens next

- The scout coordinator picks up all fresh configs within **~30 minutes** and fires the first scans.
- Each enabled scout uses roughly one run from the project's daily budget (100/day during early access).
- Findings cluster into reports in the [Self-driving inbox](https://us.posthog.com/project/585225/inbox).
- Immediately-actionable reports can trigger coding tasks automatically, each producing a draft PR at $15/fix.
- Replay Vision scanners sweep matching recordings every 5 minutes; findings accumulate before corroborating into promoted inbox reports.
