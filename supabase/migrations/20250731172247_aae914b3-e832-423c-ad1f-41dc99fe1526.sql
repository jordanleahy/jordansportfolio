INSERT INTO image_seeds (name, seed_value, category, description, is_default, user_id)
VALUES ('CDI Seed', 847392651, 'cdi', 'Default seed for Clinical Documentation Integrity content generation', true, 
  (SELECT id FROM auth.users LIMIT 1)
);