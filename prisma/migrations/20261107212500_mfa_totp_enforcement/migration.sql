-- AlterEnum
ALTER TYPE "security_event_type" ADD VALUE IF NOT EXISTS 'MFA_CHALLENGE';
ALTER TYPE "security_event_type" ADD VALUE IF NOT EXISTS 'MFA_VERIFIED';
ALTER TYPE "security_event_type" ADD VALUE IF NOT EXISTS 'MFA_FAILED';
ALTER TYPE "security_event_type" ADD VALUE IF NOT EXISTS 'MFA_RECOVERY_USED';
ALTER TYPE "security_event_type" ADD VALUE IF NOT EXISTS 'MFA_RESET';

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN "mfa_verified_at" TIMESTAMPTZ(6);

-- Revoke all existing sessions so that legacy sessions cannot bypass MFA verification
UPDATE "sessions" SET "revoked_at" = CURRENT_TIMESTAMP, "revoked_reason" = 'MIGRATION_MFA_ENFORCED' WHERE "revoked_at" IS NULL;
