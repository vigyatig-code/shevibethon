/*
# Remove civic_complaints table

## Purpose
Undo the previous migration that created the civic_complaints table.
Removes the table, its sequence, triggers, and functions.

## Changes
- Drop triggers on civic_complaints
- Drop trigger functions (assign_ticket_no, classify_new_complaint, set_closed_warranty)
- Drop the civic_complaints table
- Drop the civic_complaints_ticket_seq sequence

## Notes
1. This is a full rollback of the civic_complaints table.
2. The existing `complaints` table is NOT affected.
*/

DROP TRIGGER IF EXISTS trg_assign_ticket_no ON civic_complaints;
DROP TRIGGER IF EXISTS trg_classify_new_complaint ON civic_complaints;
DROP TRIGGER IF EXISTS trg_set_closed_warranty ON civic_complaints;

DROP FUNCTION IF EXISTS assign_ticket_no() CASCADE;
DROP FUNCTION IF EXISTS classify_new_complaint() CASCADE;
DROP FUNCTION IF EXISTS set_closed_warranty() CASCADE;

DROP TABLE IF EXISTS civic_complaints CASCADE;

DROP SEQUENCE IF EXISTS civic_complaints_ticket_seq CASCADE;