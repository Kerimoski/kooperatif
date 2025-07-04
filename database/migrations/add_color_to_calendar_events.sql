-- Migration: Add color column to calendar_events table
-- Date: 2024

ALTER TABLE calendar_events 
ADD COLUMN color VARCHAR(20) DEFAULT 'blue';

-- Add index for better performance
CREATE INDEX idx_calendar_events_color ON calendar_events(color);

-- Add comment
COMMENT ON COLUMN calendar_events.color IS 'Event color for UI customization (blue, emerald, purple, orange, red, pink, indigo, teal)'; 