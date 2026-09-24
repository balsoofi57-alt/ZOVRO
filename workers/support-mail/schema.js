'use strict';
async function ensureSchema(db){
 await db.query(`CREATE TABLE IF NOT EXISTS zovro_support_mail_cursor(mailbox text PRIMARY KEY,uid_validity text NOT NULL,last_uid bigint NOT NULL);
CREATE TABLE IF NOT EXISTS zovro_support_mail_receipts(message_key text PRIMARY KEY,mailbox text NOT NULL,uid_validity text NOT NULL,uid bigint NOT NULL,status text NOT NULL,answer_id text,policy_version text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(mailbox,uid_validity,uid));
ALTER TABLE zovro_support_mail_receipts ADD COLUMN IF NOT EXISTS sender_hash text;
CREATE INDEX IF NOT EXISTS zovro_support_mail_rate_idx ON zovro_support_mail_receipts(mailbox,created_at);
CREATE TABLE IF NOT EXISTS zovro_support_mail_reviews(message_key text PRIMARY KEY REFERENCES zovro_support_mail_receipts(message_key),resolution text NOT NULL CHECK(resolution IN ('answered_manually','no_action','verified_delivered')),resolved_at timestamptz NOT NULL DEFAULT now());`);
}
module.exports={ensureSchema};
