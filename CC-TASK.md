# CC Task: Wire Up Watchtower Edge Functions for Demolight User Management

Read `~/Documents/CMIG Partners/Agent Kitt Response.md` for the full spec.

## Summary
Build 2 new Supabase edge functions for the Watchtower project (txlbhwvlzbceegzkoimr) that manage Demolight users (on project owjvzqtfiyfnrdtsumqa).

### Edge Function 1: `manage-demolight-user`
Location: `supabase/functions/manage-demolight-user/index.ts`
- POST body: `{ action: 'update' | 'delete' | 'reset-password', userId: string, fields?: object }`
- UPDATE: call Demolight REST API to update `public.users` + `auth.admin.updateUserById`
- DELETE: cascading delete (audit_logs, notifications, nullify test_drives.created_by, public.users, auth.users)
- RESET-PASSWORD: generate recovery link via admin API, send SMS via Twilio
- Demolight URL: `https://owjvzqtfiyfnrdtsumqa.supabase.co`
- Service key env var: `SERVICE_KEY_owjvzqtfiyfnrdtsumqa`
- Twilio env vars: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Deploy with: `npx supabase functions deploy manage-demolight-user --no-verify-jwt --project-ref txlbhwvlzbceegzkoimr`

### Edge Function 2: `create-demolight-user`
Location: `supabase/functions/create-demolight-user/index.ts`
- POST body: `{ firstName, lastName, email, phone, role, dealershipName, plan }`
- Steps:
  1. Check if dealership exists by name → if not, create with `subscription_status: 'trialing'`, `trial_ends_at: NOW() + 14 days`
  2. Create auth user via admin API with random password + email_confirm: true
  3. Create public.users row
  4. Send welcome email via Resend (env: `RESEND_API_KEY`)
  5. Return created user data
- Deploy with: `npx supabase functions deploy create-demolight-user --no-verify-jwt --project-ref txlbhwvlzbceegzkoimr`

### CORS headers for both:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type
```

### DO NOT:
- Modify AllUsers.tsx (frontend already done)
- Touch any other files
- Add emojis

### After building, deploy both functions and verify they return 200 on OPTIONS requests.

When completely finished, run: openclaw system event --text "Done: Built manage-demolight-user and create-demolight-user edge functions for Watchtower" --mode now
