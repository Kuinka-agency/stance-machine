# Auth Setup TODO

## Before Going Live

- [ ] Run `schema-auth.sql` against Neon database
- [ ] Generate `AUTH_SECRET`: `openssl rand -base64 32`
- [ ] Get `RESEND_API_KEY` from resend.com dashboard
- [ ] Set `RESEND_FROM_EMAIL` to verified sending domain
- [ ] Add all three env vars to Vercel project settings
- [ ] Deploy and test full flow:
  1. Play game anonymously — no auth prompts
  2. Refresh page — session_id persists (localStorage)
  3. Click "Save to Collection" → email prompt → magic link
  4. Click magic link → signed in → past votes stitched
  5. Save stance card → saved to collection
  6. New votes have both session_id and user_id
