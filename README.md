<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/16448dktpU07svGYERaCzh2eHuVlM4Aah

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Admin password reset

Use the supported Supabase admin API for one-off password resets instead of editing `auth.users` directly.

1. Export secure shell env vars:
   `export SUPABASE_URL=https://txlbhwvlzbceegzkoimr.supabase.co`
   `export SUPABASE_SERVICE_ROLE_KEY=...`
2. Run:
   `npm run reset:user-password -- 4f415526-db29-4375-9356-f6c410ecbb67 hawks2026`

Do not store `SUPABASE_SERVICE_ROLE_KEY` in any `VITE_*` variable because those are exposed to the browser.
