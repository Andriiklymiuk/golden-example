-- Insert test user
INSERT INTO users (id, name, email, "createdAt", "updatedAt")
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'Test User',
  'test@example.com',
  NOW(),
  NOW()
);

-- Insert test recipe
INSERT INTO recipes (id, "userId", title, ingredients, instructions, "createdAt", "updatedAt")
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  '123e4567-e89b-12d3-a456-426614174000',
  'Test Recipe',
  '["Ingredient 1", "Ingredient 2", "Ingredient 3"]'::jsonb,
  '1. Mix ingredients
2. Cook
3. Serve',
  NOW(),
  NOW()
);