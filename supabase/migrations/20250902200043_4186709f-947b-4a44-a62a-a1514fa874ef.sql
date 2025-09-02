-- Enable realtime for street_vision_generations table
ALTER TABLE street_vision_generations REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE street_vision_generations;