# SkillSwap Session System Implementation Plan

This plan details the design and implementation of the **SkillSwap Session System** to allow participants of accepted skill exchanges to schedule sessions, share meeting links (e.g. Zoom, Google Meet, Discord), join sessions, and seamlessly complete exchanges using the existing Time Bank settlement engine.

## Findings from Existing Codebase

1. **Database Schema & Architecture (`supabase/setup-supabase.sql` & `supabase/supabase-setup.sql`)**:
   - `profiles`: Stores user profiles and `time_balance`.
   - `listings`: Offers and requests for skills created by providers (`type` = `'offered'` | `'wanted'`).
   - `exchanges`: Manages exchange lifecycle (`status`: `'requested'`, `'accepted'`, `'rejected'`, `'cancelled'`, `'completed'`). Tracks two-party confirmation (`requester_confirmed`, `provider_confirmed`).
   - `time_ledger`: Audit log for time transactions.
   - RPC Functions: `accept_exchange_and_reserve`, `cancel_exchange`, `confirm_and_settle_exchange` (handles atomic Time Bank balance transfer upon two-party confirmation).

2. **Client Services & UI Routes**:
   - `src/lib/exchange-service.ts`: Client API wrappers for Supabase RPC functions and queries.
   - `src/app/(app)/exchanges/page.tsx`: Exchange dashboard rendering Incoming, Sent, Active, Completed, and History tabs.

---

## User Review Required

> [!IMPORTANT]
> - **Zero External Video APIs**: As instructed, no Zoom OAuth, Google APIs, ngrok, or WebRTC will be used. Meeting URLs are stored as validated external web links.
> - **Reusing Existing Settlement**: The completion flow will directly invoke `confirmAndSettleExchange()` from `exchange-service.ts`, guaranteeing no duplication of Time Bank logic.
> - **Database Migration**: A SQL snippet will be provided to create the `sessions` table, indexes, and RLS policies in Supabase.

---

## Proposed Changes

### Database & Schema

#### [NEW] [sessions-setup.sql](file:///e:/Web%20Dev%20Course/SkillSwap/supabase/sessions-setup.sql)
Creates the `sessions` table, constraints, indexes, and Row Level Security (RLS) policies:
- **Columns**: `id` (UUID), `exchange_id` (UUID FK -> `exchanges`), `teacher_id` (UUID FK -> `profiles`), `learner_id` (UUID FK -> `profiles`), `scheduled_date` (DATE), `scheduled_time` (TIME/TEXT), `meeting_link` (TEXT), `status` (`'scheduled'` | `'completed'` | `'cancelled'`), `created_at`, `updated_at`.
- **Validation Constraints**:
  - `meeting_link` must start with `http://` or `https://`.
  - `status` IN (`'scheduled'`, `'completed'`, `'cancelled'`).
- **RLS Policies**:
  - `SELECT`: Restricted to session participants (`auth.uid() = teacher_id OR auth.uid() = learner_id`).
  - `INSERT`: Restricted to participants of the corresponding exchange AND exchange must be in `'accepted'` status.
  - `UPDATE`: Restricted to session participants.

---

### Types & Client Services

#### [MODIFY] [skillswap.ts](file:///e:/Web%20Dev%20Course/SkillSwap/src/types/skillswap.ts)
- Add `SessionRecord` interface representing the database session entity and UI state (`scheduled_date`, `scheduled_time`, `meeting_link`, `status`, `teacher_id`, `learner_id`, `exchange_id`, etc.).
- Update `ExchangeRecord` to optionally hold associated session metadata.

#### [NEW] [session-service.ts](file:///e:/Web%20Dev%20Course/SkillSwap/src/lib/session-service.ts)
Provides backend helper functions with input validation:
- `createOrUpdateSession(...)`: Validates date/time, meeting URL format, exchange state (`accepted`), and participant authorization before inserting/updating into `sessions`.
- `fetchSessionByExchangeId(exchangeId: string)`: Fetches session details for an exchange.
- `updateSessionStatus(sessionId: string, status: 'scheduled' | 'completed' | 'cancelled')`: Updates session status.

---

### UI Integration

#### [NEW] [session-dialog.tsx](file:///e:/Web%20Dev%20Course/SkillSwap/src/components/sessions/session-dialog.tsx)
A modal/dialog component allowing users to schedule or reschedule a session for an accepted exchange with fields for Date, Time, and Meeting Link (e.g. Zoom, Google Meet, Teams, Discord).

#### [MODIFY] [exchanges/page.tsx](file:///e:/Web%20Dev%20Course/SkillSwap/src/app/(app)/exchanges/page.tsx)
Enhance the **Active Exchanges** tab:
- If no session exists: display a "Schedule Session" button opening the `SessionDialog`.
- If session exists:
  - Display scheduled date, time, and session status badge.
  - Display a prominent **"Join Session"** button linking directly to `meeting_link` (opening in a new browser tab).
  - Provide an option to reschedule/update meeting link.
  - Display completion confirmation status and connect confirmation directly to `confirmAndSettleExchange()`. When both participants confirm, the session status updates to `'completed'`.

---

## Verification Plan

### Automated / Manual Verification
1. **Database Schema Verification**: Execute the migration script in Supabase and confirm table creation, foreign keys, and RLS policies.
2. **Session Scheduling**:
   - Create an exchange request and accept it.
   - Click "Schedule Session" on the accepted exchange card.
   - Validate input checks (invalid URL format, past date, non-accepted exchange).
   - Submit valid details and confirm the session displays scheduled date/time and meeting link.
3. **Joining Session**:
   - Click the "Join Session" button and verify it opens the meeting link in a new tab.
4. **Completion & Time Bank Settlement**:
   - Click "Confirm Completion" as user 1, then as user 2.
   - Verify that the existing `confirmAndSettleExchange()` function runs, transfers Time Bank hours, updates exchange to `'completed'`, and updates session to `'completed'`.
5. **Authorization Verification**:
   - Verify non-participants cannot access or modify the session via RLS.
