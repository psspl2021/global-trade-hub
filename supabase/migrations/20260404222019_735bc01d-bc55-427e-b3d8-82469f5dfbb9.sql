
-- Fix: Allow 'system' sender_role in auction_messages
ALTER TABLE auction_messages DROP CONSTRAINT IF EXISTS auction_messages_sender_role_check;
ALTER TABLE auction_messages ADD CONSTRAINT auction_messages_sender_role_check CHECK (sender_role IN ('buyer','supplier','system'));

-- Add seen_by_buyer column for read receipts
ALTER TABLE auction_messages ADD COLUMN IF NOT EXISTS seen_by_buyer boolean DEFAULT false;

-- Add is_read column to auction_messages if missing
ALTER TABLE auction_messages ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false;
