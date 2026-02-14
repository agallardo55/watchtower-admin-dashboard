-- Add MFA phone to wt_users
ALTER TABLE wt_users ADD COLUMN IF NOT EXISTS mfa_phone text;

-- OTP codes table
CREATE TABLE IF NOT EXISTS wt_mfa_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_mfa_codes_user_id ON wt_mfa_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_wt_mfa_codes_expires_at ON wt_mfa_codes(expires_at);

ALTER TABLE wt_mfa_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_mfa_codes_select_own" ON wt_mfa_codes;
CREATE POLICY "wt_mfa_codes_select_own" ON wt_mfa_codes
  FOR SELECT USING (user_id = auth.uid());
