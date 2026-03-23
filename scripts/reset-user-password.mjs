import { createClient } from '@supabase/supabase-js';

const [userId, newPassword] = process.argv.slice(2);

if (!userId || !newPassword) {
  console.error('Usage: npm run reset:user-password -- <user-id> <new-password>');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your shell environment.');
  console.error('Do not use VITE_* env vars for this script.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const { data, error } = await supabase.auth.admin.updateUserById(userId, {
  password: newPassword,
  email_confirm: true,
});

if (error) {
  console.error(`Supabase error: ${error.message}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      id: data.user.id,
      email: data.user.email,
      updated_at: data.user.updated_at,
    },
    null,
    2,
  ),
);
