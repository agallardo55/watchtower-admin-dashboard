-- Schema browser RPC functions (006 was marked applied but never actually run)

CREATE OR REPLACE FUNCTION get_table_columns(p_table_name text)
RETURNS TABLE(column_name text, data_type text, is_nullable text, column_default text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT column_name::text, data_type::text, is_nullable::text, column_default::text
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = p_table_name
  ORDER BY ordinal_position;
$$;

CREATE OR REPLACE FUNCTION get_public_tables()
RETURNS TABLE(table_name text)
LANGUAGE sql SECURITY DEFINER AS $$
  SELECT table_name::text
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ORDER BY table_name;
$$;
