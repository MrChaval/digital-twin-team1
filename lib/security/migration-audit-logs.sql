-- ============================================================================
-- Audit Logs Table Migration
-- ============================================================================
-- Created by: JaiZz
-- Date: February 13, 2026
-- Purpose: Add audit_logs table for tracking all sensitive operations
--
-- HOW TO APPLY:
-- Option 1: Using Drizzle Kit (Recommended)
--   1. Add the auditLogs schema from lib/security/audit.ts to lib/db.ts
--   2. Run: pnpm drizzle-kit push
--
-- Option 2: Manual SQL Execution
--   1. Connect to your Neon database
--   2. Run this SQL file
--
-- IMPORTANT: Backup your database before running any migration!
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_email VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(100),
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

-- Create composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action ON audit_logs(user_email, action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_status ON audit_logs(resource, status);

-- Add comment to table
COMMENT ON TABLE audit_logs IS 'Tracks all sensitive operations for security compliance and forensics';

-- Add comments to columns
COMMENT ON COLUMN audit_logs.id IS 'Primary key';
COMMENT ON COLUMN audit_logs.user_id IS 'References users.id (can be null for unauthenticated attempts)';
COMMENT ON COLUMN audit_logs.user_email IS 'User email who performed the action';
COMMENT ON COLUMN audit_logs.action IS 'Action type (CREATE_PROJECT, UPDATE_ROLE, etc.)';
COMMENT ON COLUMN audit_logs.resource IS 'Resource type affected (projects, users, etc.)';
COMMENT ON COLUMN audit_logs.resource_id IS 'ID of the affected resource';
COMMENT ON COLUMN audit_logs.metadata IS 'JSON object with additional context';
COMMENT ON COLUMN audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent string from request';
COMMENT ON COLUMN audit_logs.status IS 'Result status (success, failed, denied)';
COMMENT ON COLUMN audit_logs.created_at IS 'Timestamp when action occurred';

-- Verify table was created
SELECT 'Audit logs table created successfully!' AS message;
SELECT 
  COUNT(*) as index_count,
  'Indexes created' as message
FROM pg_indexes 
WHERE tablename = 'audit_logs';
