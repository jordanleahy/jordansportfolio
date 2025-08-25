-- Update the stuck book highlight record to completed status
UPDATE verified_book_highlights 
SET processing_status = 'completed', 
    updated_at = now(),
    verification_confidence = 'Manually resolved stuck process'
WHERE id = 'b51a455a-2eeb-4c91-a800-0dceeec291f1' 
AND processing_status = 'researching';

-- Also check for any other stuck records older than 10 minutes and update them
UPDATE verified_book_highlights 
SET processing_status = 'failed', 
    updated_at = now(),
    verification_confidence = 'Auto-resolved: Process timeout after 10 minutes'
WHERE processing_status = 'researching' 
AND created_at < now() - interval '10 minutes';