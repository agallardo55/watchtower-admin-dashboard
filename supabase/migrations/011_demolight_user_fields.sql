-- ============================================================================
-- 011_demolight_user_fields.sql
-- Add Demolight-specific fields to user management system
-- ============================================================================

-- Add dealership_name to wt_users
ALTER TABLE wt_users ADD COLUMN IF NOT EXISTS dealership_name text;

-- Add account_type enum and column to wt_users
DO $$ BEGIN
  CREATE TYPE account_type_enum AS ENUM ('starter', 'professional');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE wt_users ADD COLUMN IF NOT EXISTS account_type account_type_enum DEFAULT 'starter';

-- Update the role check constraint to include Demolight-specific roles
ALTER TABLE wt_users DROP CONSTRAINT IF EXISTS wt_users_role_check;
ALTER TABLE wt_users ADD CONSTRAINT wt_users_role_check 
  CHECK (role IN ('super_admin', 'admin', 'manager', 'user', 'salesperson', 'member'));

-- Create indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_wt_users_dealership_name ON wt_users(dealership_name);
CREATE INDEX IF NOT EXISTS idx_wt_users_account_type ON wt_users(account_type);

-- Add email delivery tracking table for welcome emails
CREATE TABLE IF NOT EXISTS wt_email_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type text NOT NULL CHECK (email_type IN ('welcome', 'password_reset', 'invitation')),
  recipient_email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed')),
  resend_message_id text, -- Store Resend message ID for tracking
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wt_email_deliveries_user_id ON wt_email_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_wt_email_deliveries_email_type ON wt_email_deliveries(email_type);
CREATE INDEX IF NOT EXISTS idx_wt_email_deliveries_status ON wt_email_deliveries(status);

ALTER TABLE wt_email_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "wt_email_deliveries_admin_all" ON wt_email_deliveries;
CREATE POLICY "wt_email_deliveries_admin_all" ON wt_email_deliveries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM wt_users wu WHERE wu.id = auth.uid() AND wu.role = 'super_admin')
  );

-- Add columns for SMS password reset enhancements
ALTER TABLE wt_mfa_codes ADD COLUMN IF NOT EXISTS code_type text NOT NULL DEFAULT 'mfa' CHECK (code_type IN ('mfa', 'password_reset'));
ALTER TABLE wt_mfa_codes ADD COLUMN IF NOT EXISTS phone_used text; -- Track which phone number was used

-- Create index for code_type
CREATE INDEX IF NOT EXISTS idx_wt_mfa_codes_code_type ON wt_mfa_codes(code_type);

-- Update wt_users with mobile phone field (separate from mfa_phone)
ALTER TABLE wt_users ADD COLUMN IF NOT EXISTS mobile_phone text;

-- Comments for documentation
COMMENT ON COLUMN wt_users.dealership_name IS 'Dealership name for Demolight users';
COMMENT ON COLUMN wt_users.account_type IS 'Account tier for Demolight users (starter/professional)';
COMMENT ON COLUMN wt_users.mobile_phone IS 'User mobile phone number for SMS notifications';
COMMENT ON TABLE wt_email_deliveries IS 'Track email delivery status for welcome emails and notifications';