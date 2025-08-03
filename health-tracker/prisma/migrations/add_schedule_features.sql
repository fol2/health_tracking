-- Add new fields to ScheduledFast table
ALTER TABLE "ScheduledFast" 
ADD COLUMN IF NOT EXISTS "parentId" TEXT,
ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Update recurrencePattern to JSON type if it's still TEXT
ALTER TABLE "ScheduledFast" 
ALTER COLUMN "recurrencePattern" TYPE JSONB USING "recurrencePattern"::JSONB;

-- Add new fields to Reminder table
ALTER TABLE "Reminder" 
ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "isSent" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "message" TEXT;

-- Rename 'sent' to 'isSent' if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'Reminder' AND column_name = 'sent') THEN
    ALTER TABLE "Reminder" RENAME COLUMN "sent" TO "isSent";
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS "ScheduledFast_parentId_idx" ON "ScheduledFast"("parentId");
CREATE INDEX IF NOT EXISTS "Reminder_isActive_reminderTime_idx" ON "Reminder"("isActive", "reminderTime");

-- Add foreign key constraint for parentId
ALTER TABLE "ScheduledFast" 
ADD CONSTRAINT "ScheduledFast_parentId_fkey" 
FOREIGN KEY ("parentId") REFERENCES "ScheduledFast"("id") ON DELETE CASCADE ON UPDATE CASCADE;